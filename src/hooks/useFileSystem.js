import { useFileSystemItems } from './useFileSystemItems';
import { useLocalStorageSync } from './useLocalStorageSync';
import { useFirestoreSync } from './useFirestoreSync';

const DEFAULT_ITEMS = {
    'root': { id: 'root', type: 'folder', name: 'Main', parentId: null, permissions: 'private' }
};

export const useFileSystem = (userId) => {
    // Helper to get initial state from local storage
    const getInitialState = () => {
        const getStorageKey = (uid) => `flashcards_filesystem_${uid || 'local'}`;
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
    };

    // 1. Core State & Operations
    // We initialize with a function to read from LS once
    const {
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
    } = useFileSystemItems(getInitialState);

    // 2. Sync to LocalStorage (Always)
    useLocalStorageSync(userId, items, DEFAULT_ITEMS);

    // 3. Sync with Firestore (If logged in)
    useFirestoreSync(userId, items, setItems, DEFAULT_ITEMS);

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

