import React, { useState, useEffect, useCallback } from 'react';
import Flashcard from './Flashcard';

const Study = ({ cards, images }) => {
    const [studyCards, setStudyCards] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [unknownIds, setUnknownIds] = useState(new Set());
    const [isReviewingUnknown, setIsReviewingUnknown] = useState(false);
    const [isComplete, setIsComplete] = useState(false);

    // Initialize with all cards
    useEffect(() => {
        // Only map if not already set or restarting
        if (studyCards.length === 0 && cards.length > 0) {
            setStudyCards(cards.map(c => c.id || c.index)); // Store IDs/Indices
        }
    }, [cards, studyCards.length]);

    const handleNext = useCallback(() => {
        setIsFlipped(false);
        if (currentIndex < studyCards.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            setIsComplete(true);
        }
    }, [currentIndex, studyCards.length]);

    const handlePrev = useCallback(() => {
        if (currentIndex > 0) {
            setIsFlipped(false);
            setCurrentIndex(prev => prev - 1);
        }
    }, [currentIndex]);

    const markKnown = useCallback(() => {
        // Possibly remove from unknown if it was there (if reviewing all)
        // But mainly just advance
        const currentId = studyCards[currentIndex];
        setUnknownIds(prev => {
            const next = new Set(prev);
            next.delete(currentId);
            return next;
        });
        handleNext();
    }, [handleNext, currentIndex, studyCards]);

    const markUnknown = useCallback(() => {
        const currentId = studyCards[currentIndex];
        setUnknownIds(prev => new Set(prev).add(currentId));
        handleNext();
    }, [handleNext, currentIndex, studyCards]);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (isComplete) return;

            switch (e.code) {
                case 'Space':
                    e.preventDefault();
                    setIsFlipped(prev => !prev);
                    break;
                case 'ArrowRight':
                case 'ArrowDown':
                    e.preventDefault();
                    handleNext();
                    break;
                case 'ArrowLeft':
                case 'ArrowUp':
                    e.preventDefault();
                    handlePrev();
                    break;
                case 'Digit1':
                case 'Numpad1':
                    markKnown(); // User mapped '1' to Known (from desc: "press the number one for known")
                    break;
                case 'Digit2':
                case 'Numpad2':
                    markUnknown();
                    break;
                default:
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleNext, handlePrev, markKnown, markUnknown, isComplete]);

    const restartAll = () => {
        setStudyCards(cards.map(c => c.id || c.index));
        setCurrentIndex(0);
        setIsFlipped(false);
        setIsComplete(false);
        setIsReviewingUnknown(false);
        setUnknownIds(new Set()); // Reset unknown too? Or keep memory? Usually reset for "Redo All".
    };

    const reviewUnknown = () => {
        // Filter cards to only unknown
        const unknowns = cards.filter(c => unknownIds.has(c.id || c.index)).map(c => c.id || c.index);
        if (unknowns.length === 0) return; // Should disable button if 0

        setStudyCards(unknowns);
        setCurrentIndex(0);
        setIsFlipped(false);
        setIsComplete(false);
        setIsReviewingUnknown(true);
    };

    const currentCardId = studyCards[currentIndex];
    // Find the full card object
    const currentCard = cards.find(c => (c.id || c.index) === currentCardId);

    if (!cards.length) {
        return <div className="study-container">Please add flashcards in the editor first.</div>;
    }

    if (isComplete) {
        return (
            <div className="completion-view">
                <h2 style={{ fontSize: '2rem' }}>Set Complete!</h2>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                    <button className="action-btn" onClick={restartAll}>
                        Redo All
                    </button>
                    {unknownIds.size > 0 && (
                        <button className="action-btn btn-unknown" onClick={reviewUnknown}>
                            Redo Unknown ({unknownIds.size})
                        </button>
                    )}
                </div>
            </div>
        );
    }

    if (!currentCard) return null;

    return (
        <div className="study-container">
            <Flashcard
                card={currentCard}
                isFlipped={isFlipped}
                onClick={() => setIsFlipped(!isFlipped)}
                images={images}
            />

            <div className="controls">
                <div className="stats-row">
                    <span>
                        {isReviewingUnknown ? 'Unknown Set' : 'All Cards'}
                    </span>
                    <span>{currentIndex + 1} / {studyCards.length}</span>
                </div>

                <div className="progress-bar">
                    <div
                        className="progress-fill"
                        style={{ width: `${((currentIndex + 1) / studyCards.length) * 100}%` }}
                    />
                </div>

                <div className="action-buttons">
                    <button className="action-btn btn-known" onClick={markKnown}>
                        1 Known
                    </button>
                    <button className="action-btn btn-unknown" onClick={markUnknown}>
                        2 Unknown
                    </button>
                </div>

                <div className="nav-buttons">
                    <button className="nav-btn" onClick={handlePrev} disabled={currentIndex === 0}>
                        ← Previous
                    </button>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                        Space to flip • Arrows to navigate
                    </div>
                    <button className="nav-btn" onClick={handleNext} disabled={currentIndex === studyCards.length - 1}>
                        Next →
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Study;
