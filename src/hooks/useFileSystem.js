import { useState, useCallback, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../firebase';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';

const DEFAULT_ITEMS = {
    'root': { id: 'root', type: 'folder', name: 'Main', parentId: null, permissions: 'private' }
};

export const useFileSystem = (userId) => {
    const getStorageKey = (uid) => `flashcards_filesystem_${uid || 'local'}`;

    // Initialize state from local storage to avoid flashing empty
    const [items, setItems] = useState(() => {
        const key = getStorageKey(userId);
        const local = localStorage.getItem(key);
        if (local) {
            try {
                return JSON.parse(local);
            } catch (e) {
                console.error("Parse error", e);
            }
        }
        return DEFAULT_ITEMS;
    });
    const [clipboard, setClipboard] = useState(null);

    // Track the last time we saved to Firestore to prevent loops/stale overwrites
    const lastSaveTime = useRef(0);

    // Load from Firestore (Sync with Merge)
    useEffect(() => {
        if (!userId) return;

        const unsub = onSnapshot(doc(db, "users", userId), (docSnap) => {
            if (docSnap.exists()) {
                const remoteData = (docSnap.data() || {}).fileSystem;
                if (remoteData) {
                    setItems(prevItems => {
                        const nextItems = { ...prevItems };
                        const now = Date.now();
                        let hasChanges = false;

                        // 1. Update/Add items from Remote
                        Object.keys(remoteData).forEach(id => {
                            const remoteItem = remoteData[id];
                            const localItem = prevItems[id];

                            // If local doesn't exist, add it
                            if (!localItem) {
                                nextItems[id] = remoteItem;
                                hasChanges = true;
                            }
                            // If local exists, check timestamps
                            else {
                                // If remote is newer, take it.
                                // Note: we ensure we parse timestamps correctly if they are strings.
                                // Assuming they are numbers (Date.now()).
                                if (remoteItem.modified > localItem.modified) {
                                    // Special check: If local was modified VERY recently (pending save), keep local
                                    // if (remoteItem.modified > localItem.modified) implied remote is newer.
                                    // But what if local modification happened 1ms ago and hasn't synced?
                                    // Then local.modified > remote.modified (usually).
                                    // Only if clocks are weird.
                                    // Let's rely on strict inequality.
                                    if (JSON.stringify(remoteItem) !== JSON.stringify(localItem)) {
                                        nextItems[id] = remoteItem;
                                        hasChanges = true;
                                    }
                                }
                            }
                        });

                        // 2. Check for Local items missing in Remote (Potential Deletions vs New Items)
                        Object.keys(prevItems).forEach(id => {
                            if (!remoteData[id]) {
                                const localItem = prevItems[id];
                                // If local item is new (created recently, e.g., last 10 seconds) or modified recently 
                                // and implies it hasn't synced yet, KEEP IT.
                                // Otherwise, assume it was deleted on server.

                                // Threshold: 10 seconds buffer for sync safety
                                const isRecent = (now - (localItem.modified || 0)) < 10000 || (now - (localItem.created || 0)) < 10000;

                                if (isRecent) {
                                    // Keep it (it's likely pending sync)
                                } else {
                                    // Delete it (Server says it's gone)
                                    // Exception: 'root' should never be deleted
                                    if (id !== 'root') {
                                        delete nextItems[id];
                                        hasChanges = true;
                                    }
                                }
                            }
                        });

                        return hasChanges ? nextItems : prevItems;
                    });

                    // Update local storage immediately for backup (best effort)
                    localStorage.setItem(getStorageKey(userId), JSON.stringify(remoteData));
                }
            } else {
                setDoc(doc(db, "users", userId), { fileSystem: DEFAULT_ITEMS }, { merge: true });
                setItems(DEFAULT_ITEMS);
            }
        }, (error) => {
            console.error("Firestore sync error:", error);
        });

        return () => unsub();
    }, [userId]);

    // Save to LocalStorage AND Firestore
    useEffect(() => {
        const key = getStorageKey(userId);

        // 1. Always save to LocalStorage (Fast, Offline-proof)
        if (items !== DEFAULT_ITEMS) {
            localStorage.setItem(key, JSON.stringify(items));
        }

        // 2. Sync to Firestore if logged in
        if (userId && items !== DEFAULT_ITEMS) {
            const save = async () => {
                try {
                    // Update the whole map. 
                    // Since we merged remote changes into 'items', writing 'items' back is safe 
                    // unless a parallel write happened *during* the merge/render cycle.
                    // This is acceptable for single-user scenarios.
                    await updateDoc(doc(db, "users", userId), { fileSystem: items });
                    lastSaveTime.current = Date.now();
                } catch (e) {
                    if (e.code === 'not-found') {
                        await setDoc(doc(db, "users", userId), { fileSystem: items });
                    } else {
                        console.error("Error saving to Firestore: ", e);
                    }
                }
            };
            save();
        }
    }, [items, userId]);

    // Helper to get children of a folder
    const getChildren = useCallback((folderId) => {
        return Object.values(items).filter(item => item.parentId === folderId);
    }, [items]);

    const createItem = useCallback((type, name, parentId, content = null) => {
        console.log('Creating item:', type, name, parentId);
        const id = uuidv4();
        const newItem = {
            id,
            type, // 'folder' | 'set'
            name,
            parentId,
            content, // Flashcard Set Data
            permissions: 'private', // 'private' | 'link' | 'public'
            created: Date.now(),
            modified: Date.now()
        };

        setItems(prev => ({ ...prev, [id]: newItem }));
        return id;
    }, []);

    const deleteItems = useCallback((ids) => {
        console.log('Deleting items:', ids);
        setItems(prev => {
            const next = { ...prev };
            const toDelete = new Set(ids);

            // Recursive delete helper
            const deleteRecursive = (itemId) => {
                toDelete.add(itemId);
                const children = Object.values(prev).filter(i => i.parentId === itemId);
                children.forEach(c => deleteRecursive(c.id));
            };

            ids.forEach(id => deleteRecursive(id));

            toDelete.forEach(id => delete next[id]);
            return next;
        });
    }, []);

    const renameItem = useCallback((id, newName) => {
        console.log('Renaming item:', id, newName);
        setItems(prev => ({
            ...prev,
            [id]: { ...prev[id], name: newName, modified: Date.now() }
        }));
    }, []);

    const moveItems = useCallback((ids, targetFolderId) => {
        console.log('Moving items:', ids, 'to', targetFolderId);
        setItems(prev => {
            const next = { ...prev };
            ids.forEach(id => {
                if (next[id] && next[id].id !== 'root') {
                    // Prevent moving folder into its own child
                    // TODO: check for circular dependency
                    next[id] = { ...next[id], parentId: targetFolderId, modified: Date.now() };
                }
            });
            return next;
        });
    }, []);

    const updateSetContent = useCallback((id, content) => {
        setItems(prev => {
            // Basic structural sharing
            return {
                ...prev,
                [id]: { ...prev[id], content, modified: Date.now() }
            };
        });
    }, []);

    const copyToClipboard = useCallback((ids, action) => {
        console.log('Clipboard:', action, ids);
        setClipboard({ action, itemIds: ids });
    }, []);

    const pasteFromClipboard = useCallback((targetFolderId) => {
        if (!clipboard) return;

        if (clipboard.action === 'cut') {
            moveItems(clipboard.itemIds, targetFolderId);
            setClipboard(null); // Clear after cut
        } else if (clipboard.action === 'copy') {
            // Deep copy logic
            setItems(prev => {
                const next = { ...prev };

                const copyRecursive = (itemId, newParentId) => {
                    const original = prev[itemId];
                    if (!original) return;

                    const newId = uuidv4();
                    const newItem = {
                        ...original,
                        id: newId,
                        parentId: newParentId,
                        name: original.name + (newParentId === original.parentId ? ' (Copy)' : ''),
                        created: Date.now(),
                        modified: Date.now()
                    };
                    next[newId] = newItem;

                    if (original.type === 'folder') {
                        const children = Object.values(prev).filter(i => i.parentId === itemId);
                        children.forEach(c => copyRecursive(c.id, newId));
                    }
                };

                clipboard.itemIds.forEach(id => copyRecursive(id, targetFolderId));
                return next;
            });
        }
    }, [clipboard, moveItems]);

    const updatePermissions = useCallback((id, permission) => {
        console.log('Updating permissions:', id, permission);
        setItems(prev => ({
            ...prev,
            [id]: { ...prev[id], permissions: permission, modified: Date.now() }
        }));
    }, []);

    return {
        items,
        getChildren,
        createItem,
        deleteItems,
        renameItem,
        moveItems,
        updateSetContent,
        copyToClipboard,
        pasteFromClipboard,
        clipboard,
        updatePermissions
    };
};
