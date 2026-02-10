import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFlashcards } from '../hooks/useFlashcards';
import Editor from './Editor';

const EditorPageContent = ({ fs, setHasCards, setId, initialText, initialLanguages }) => {
    const flashcardState = useFlashcards(initialText, initialLanguages);
    const { updateSetContent } = fs;

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

    // Keep ref in sync for cleanup
    const contentRef = useRef({ text: '', languages: null });
    useEffect(() => {
        contentRef.current = {
            text: flashcardState.inputText,
            languages: flashcardState.languages
        };
    }, [flashcardState.inputText, flashcardState.languages]);

    // Final Save on Unmount
    useEffect(() => {
        return () => {
            // Only save if we are editing an existing set
            if (setId) {
                updateSetContent(setId, {
                    text: contentRef.current.text,
                    languages: contentRef.current.languages
                });
            }
        };
    }, [setId, updateSetContent]);

    // Unified Auto-Save Logic
    useEffect(() => {
        if (!setId) return;

        const save = () => {
            updateSetContent(setId, { text: flashcardState.inputText, languages: flashcardState.languages });
        };

        const timeoutId = setTimeout(save, 500);

        return () => {
            clearTimeout(timeoutId);
        };
    }, [flashcardState.inputText, flashcardState.languages, setId, updateSetContent]);

    return (
        <Editor
            {...flashcardState}
            massCreateSettings={massCreateSettings}
            setMassCreateSettings={setMassCreateSettings}
        />
    );
};

const EditorPage = ({ fs, setHasCards }) => {
    const { setId } = useParams();
    const navigate = useNavigate();

    // Redirect /create to a new ID immediately
    useEffect(() => {
        if (!setId) {
            const newId = fs.createItem('set', 'New Flashcard Set', 'root');
            navigate(`/edit/${newId}`, { replace: true });
        }
    }, [setId, fs, navigate]);

    const item = setId ? fs.items[setId] : null;

    // Loading state
    if (!setId || (setId && !item)) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
                color: '#888',
                fontSize: '1.2rem',
                flexDirection: 'column',
                gap: '1rem'
            }}>
                <div className="spinner" style={{
                    width: '30px',
                    height: '30px',
                    border: '3px solid #eee',
                    borderTop: '3px solid var(--color-primary)',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                }}></div>
                <div>{setId ? 'Loading Document...' : 'Creating New Set...'}</div>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    const initialText = item?.content?.text || '';
    const initialLanguages = item?.content?.languages || { term: 'en-US', definition: 'en-US' };

    return (
        <EditorPageContent
            fs={fs}
            setHasCards={setHasCards}
            setId={setId}
            initialText={initialText}
            initialLanguages={initialLanguages}
        />
    );
};

export default EditorPage;
