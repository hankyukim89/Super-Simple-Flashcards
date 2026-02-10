import { useEffect, useRef } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';

export const useFirestoreSync = (userId, items, setItems, DEFAULT_ITEMS) => {
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
                            // If local exists, check timestamps and CONTENT
                            else {
                                const localHasContent = localItem.content && localItem.content.text;
                                const remoteHasContent = remoteItem.content && remoteItem.content.text;

                                if (localHasContent && !remoteHasContent) {
                                    // Keep local, it has data we don't want to lose.
                                    return;
                                }

                                if (remoteItem.modified > localItem.modified) {
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
                                const isRecent = (now - (localItem.modified || 0)) < 30000 || (now - (localItem.created || 0)) < 30000;

                                if (isRecent) {
                                    // Keep it (it's likely pending sync)
                                } else {
                                    if (id !== 'root') {
                                        delete nextItems[id];
                                        hasChanges = true;
                                    }
                                }
                            }
                        });

                        return hasChanges ? nextItems : prevItems;
                    });
                }
            } else {
                setDoc(doc(db, "users", userId), { fileSystem: DEFAULT_ITEMS }, { merge: true });
                setItems(DEFAULT_ITEMS);
            }
        }, (error) => {
            console.error("Firestore sync error:", error);
        });

        return () => unsub();
    }, [userId, setItems, DEFAULT_ITEMS]);

    // Save to Firestore
    useEffect(() => {
        if (userId && items !== DEFAULT_ITEMS) {
            const save = async () => {
                try {
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
    }, [items, userId, DEFAULT_ITEMS]);
};
