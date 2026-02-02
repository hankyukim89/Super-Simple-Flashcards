import { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

const DEFAULT_ITEMS = {
    'root': { id: 'root', type: 'folder', name: 'Main', parentId: null, permissions: 'private' }
};

export const useFileSystem = (userId) => {
    const [items, setItems] = useState(DEFAULT_ITEMS);
    const [clipboard, setClipboard] = useState(null);

    // Load from Firestore
    useEffect(() => {
        if (!userId) {
            // eslint-disable-next-line
            setItems(DEFAULT_ITEMS);
            return;
        }

        const unsub = onSnapshot(doc(db, "users", userId), (docSnap) => {
            if (docSnap.exists()) {
                setItems(docSnap.data().fileSystem || DEFAULT_ITEMS);
            } else {
                // Initialize if new user
                setDoc(doc(db, "users", userId), { fileSystem: DEFAULT_ITEMS }, { merge: true });
                setItems(DEFAULT_ITEMS);
            }
        });

        return () => unsub();
    }, [userId]);

    // Save to Firestore
    useEffect(() => {
        if (!userId) return;

        // Debounce or save on change. For now, direct save is fine for small data, 
        // but in prod we'd want to be careful.
        // We will just save when items change. 
        if (items !== DEFAULT_ITEMS) {
            const save = async () => {
                try {
                    await setDoc(doc(db, "users", userId), { fileSystem: items }, { merge: true });
                } catch (e) {
                    console.error("Error saving filesystem: ", e);
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
        console.log('Updating content for:', id);
        setItems(prev => ({
            ...prev,
            [id]: { ...prev[id], content, modified: Date.now() }
        }));
    }, []);

    const copyToClipboard = useCallback((ids, action) => {
        console.log('Clipboard:', action, ids);
        setClipboard({ action, itemIds: ids });
    }, []);

    const pasteFromClipboard = useCallback((targetFolderId) => {
        console.log('Pasting to:', targetFolderId);
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
                        name: original.name + (newParentId === original.parentId ? ' (Copy)' : ''), // avoid name collision if same folder
                        created: Date.now(),
                        modified: Date.now()
                    };
                    next[newId] = newItem;

                    // Copy children if folder
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
            [id]: { ...prev[id], permissions: permission }
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
