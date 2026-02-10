import { useEffect } from 'react';

export const useLocalStorageSync = (userId, items, DEFAULT_ITEMS) => {
    const getStorageKey = (uid) => `flashcards_filesystem_${uid || 'local'}`;

    useEffect(() => {
        const key = getStorageKey(userId);
        if (items !== DEFAULT_ITEMS) {
            localStorage.setItem(key, JSON.stringify(items));
        }
    }, [items, userId, DEFAULT_ITEMS]);

    const loadFromLocalStorage = () => {
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

    return { loadFromLocalStorage };
};
