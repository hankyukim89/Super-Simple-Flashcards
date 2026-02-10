import React from 'react';
import { useParams } from 'react-router-dom';
import { useFlashcards } from '../hooks/useFlashcards';
import Study from './Study';

const StudyPageContent = ({ initialText, initialLanguages }) => {
    const { cards, images, languages } = useFlashcards(initialText, initialLanguages);

    return (
        <Study
            cards={cards}
            images={images}
            languages={languages}
        />
    );
};

const StudyPage = ({ fs }) => {
    const { setId } = useParams();
    const item = fs.items[setId];

    if (!item) {
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
                <div>Loading Set...</div>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    const initialText = item.content?.text || '';
    const initialLanguages = item.content?.languages || { term: 'en-US', definition: 'en-US' };

    return (
        <StudyPageContent
            initialText={initialText}
            initialLanguages={initialLanguages}
        />
    );
};

export default StudyPage;
