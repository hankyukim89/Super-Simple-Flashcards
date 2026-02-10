import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

export const useFileSystemItems = (initialItems) => {
    const [items, setItems] = useState(initialItems);
    const [clipboard, setClipboard] = useState(null);

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
                    next[id] = { ...next[id], parentId: targetFolderId, modified: Date.now() };
                }
            });
            return next;
        });
    }, []);

    const updateSetContent = useCallback((id, content) => {
        setItems(prev => {
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
            setClipboard(null);
        } else if (clipboard.action === 'copy') {
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
        setItems,
        clipboard,
        getChildren,
        createItem,
        deleteItems,
        renameItem,
        moveItems,
        updateSetContent,
        copyToClipboard,
        pasteFromClipboard,
        updatePermissions
    };
};
