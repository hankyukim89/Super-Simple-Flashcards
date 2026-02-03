import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFlashcards } from '../hooks/useFlashcards';
import Editor from './Editor';

const EditorPage = ({ fs, setHasCards }) => {
    const { setId } = useParams();
    const navigate = useNavigate();
    const flashcardState = useFlashcards();
    const [loaded, setLoaded] = useState(false);

    // Mass Create Settings
    const [massCreateSettings, setMassCreateSettings] = useState({
        enabled: false,
        maxCards: 30
    });

    // Update parent about card validity
    useEffect(() => {
        if (setHasCards) {
            setHasCards(flashcardState.cards && flashcardState.cards.length > 0);
        }
    }, [flashcardState.cards, setHasCards]);

    // Load data on mount or setId change
    useEffect(() => {
        if (!loaded && setId && fs.items[setId]) {
            const item = fs.items[setId];
            // Only update if we haven't started editing (which 'loaded' implies)
            // But we also want to handle case where we switch sets.
            // If setId changes, 'loaded' should reset? 
            // We need to reset loaded when setId changes.

            if (item.content) {
                flashcardState.setInputText(item.content.text || '');
                if (item.content.languages) {
                    flashcardState.setLanguages(item.content.languages);
                }
            } else {
                flashcardState.setInputText('');
            }
            setLoaded(true);
        } else if (!setId && !loaded) {
            // New set creation mode
            flashcardState.setInputText('');
            flashcardState.setLanguages({ term: 'en-US', definition: 'en-US' });
            setLoaded(true);
        }
    }, [setId, fs.items, loaded]);

    // Reset loaded state if setId changes
    useEffect(() => {
        setLoaded(false);
    }, [setId]);

    // Save on unmount or before navigating away
    useEffect(() => {
        return () => {
            if (setId && fs.items[setId]) {
                fs.updateSetContent(setId, {
                    text: flashcardState.inputText, // This might capture stale state if closure is issue, but react-router unmount should be fine?
                    // Actually, standard useEffect cleanup captures closure state from WHEN the effect ran. 
                    // Accessing latest state in cleanup is tricky.
                    // Better strategy: Auto-save when inputText changes (debounced) OR explicit save on navigation.
                    // Previous app used "goBack" which triggered "handleSaveSet".
                });
            }
        };
    }, []);

    // Re-replicating the comprehensive save logic from App.jsx:
    // The previous app had `handleSaveSet` called before navigation.
    // In React Router, we can't easily intercept "back button" to run logic *before* unmount AND have it access latest state easily without refs.

    // Better approach:
    // 1. Save on every change (debounced)? might be heavy for file system.
    // 2. Use a ref to track current text/languages so cleanup function can access it.

    // Let's implement the Ref approach for the cleanup save.

    const contentRef = useRef({ text: '', languages: null, massCreate: { enabled: false, maxCards: 30 } });

    // Sync ref with state
    useEffect(() => {
        contentRef.current = {
            text: flashcardState.inputText,
            languages: flashcardState.languages,
            massCreate: massCreateSettings
        };
    }, [flashcardState.inputText, flashcardState.languages, massCreateSettings]);

    // Auto-save Logic (Debounced)
    useEffect(() => {
        if (!setId) return;

        const saveContent = () => {
            const { text, languages, massCreate } = contentRef.current;

            // Simple Parser for mass create check
            const cardStrings = text.split('\n').filter(s => s.trim());

            if (massCreate.enabled && cardStrings.length > massCreate.maxCards) {
                // Mass create logic is typically a ONE-OFF action on save/exit. 
                // We shouldn't auto-split while user is typing.
                // For now, let's ONLY autosave the raw text to the current set.
                // The splitting logic should maybe only happen on explicit "Create" or exit?
                // But we can't detect "Create" button click here easily.
                // Let's stick to simple update for autosave.
                fs.updateSetContent(setId, { text, languages });
            } else {
                fs.updateSetContent(setId, { text, languages });
            }
        };

        // Debounce 1000ms
        const timeoutId = setTimeout(saveContent, 1000);

        return () => {
            clearTimeout(timeoutId);
        };
    }, [flashcardState.inputText, flashcardState.languages, setId]); // We removed dependency on massCreateSettings for autosave trigger to avoid spam if just toggling settings

    // Final Save on Unmount
    useEffect(() => {
        return () => {
            if (setId) {
                const { text, languages, massCreate } = contentRef.current;

                // Here we can do the mass create logic if needed
                const cardStrings = text.split('\n').filter(s => s.trim());

                if (massCreate.enabled && cardStrings.length > massCreate.maxCards) {
                    // ... (Mass create logic as before) ...
                    console.log('Mass creating items on exit...');
                    const max = massCreate.maxCards;
                    const chunks = [];
                    for (let i = 0; i < cardStrings.length; i += max) {
                        chunks.push(cardStrings.slice(i, i + max));
                    }

                    const firstChunkText = chunks[0].join('\n');
                    fs.updateSetContent(setId, { text: firstChunkText, languages });

                    const currentItem = fs.items[setId];
                    const parentId = currentItem?.parentId || 'root';
                    const baseName = currentItem?.name || 'New Set';

                    chunks.slice(1).forEach((chunk, index) => {
                        const newName = `${baseName} ${index + 2}`;
                        const newContent = { text: chunk.join('\n'), languages };
                        fs.createItem('set', newName, parentId, newContent);
                    });
                } else {
                    // Final save to ensure latest state is captured even if debounce didn't fire
                    fs.updateSetContent(setId, { text, languages });
                }
            }
        };
    }, [setId]); // Only on mount/unmount/setId change

    return (
        <Editor
            {...flashcardState}
            massCreateSettings={massCreateSettings}
            setMassCreateSettings={setMassCreateSettings}
        />
    );
};

export default EditorPage;
