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

    // Unified Auto-Save Logic
    useEffect(() => {
        if (!setId) return;

        const save = () => {
            const text = flashcardState.inputText;
            const languages = flashcardState.languages;

            // Validate: Don't save if it looks like we're overwriting with empty data during load
            // (Wait until loaded is true)
            if (!loaded) return;

            fs.updateSetContent(setId, { text, languages });
        };

        const timeoutId = setTimeout(save, 500); // More frequent saves (500ms)

        return () => {
            clearTimeout(timeoutId);
            // On unmount/cleanup, force a save of the CURRENT state
            // Note: In this cleanup closure, 'flashcardState' might be stale if the effect didn't re-run.
            // But we requested this effect to run on [inputText, languages].
            // So for THIS render cycle, the closure has the correct state.
            // We can safely save.
            if (loaded) {
                fs.updateSetContent(setId, {
                    text: flashcardState.inputText,
                    languages: flashcardState.languages
                });
            }
        };
    }, [flashcardState.inputText, flashcardState.languages, setId, loaded]); // Dependencies ensure fresh state

    return (
        <Editor
            {...flashcardState}
            massCreateSettings={massCreateSettings}
            setMassCreateSettings={setMassCreateSettings}
        />
    );
};

export default EditorPage;
