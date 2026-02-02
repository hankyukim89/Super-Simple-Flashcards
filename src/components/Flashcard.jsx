import React from 'react';

const Flashcard = ({ card, isFlipped, onClick, images, languages }) => {
    const termImage = images?.[card.index]?.term;
    const defImage = images?.[card.index]?.definition;

    const speak = (e, text, lang) => {
        e.stopPropagation(); // Prevent card flip
        if (!text) return;

        window.speechSynthesis.cancel(); // Stop previous
        const utterance = new SpeechSynthesisUtterance(text);
        if (lang) utterance.lang = lang;
        window.speechSynthesis.speak(utterance);
    };

    const SpeakerIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
        </svg>
    );

    return (
        <div className="flashcard-scene" onClick={onClick}>
            <div className={`flashcard ${isFlipped ? 'flipped' : ''}`}>
                <div className="card-face front" style={{ position: 'relative' }}>
                    <button
                        onClick={(e) => speak(e, card.term, languages?.term)}
                        className="speaker-btn"
                        style={{
                            position: 'absolute',
                            top: '10px',
                            right: '10px',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '5px',
                            color: '#666'
                        }}
                    >
                        <SpeakerIcon />
                    </button>
                    {termImage && <img src={termImage} alt="Term" className="card-image" />}
                    <div>{card.term}</div>
                </div>
                <div className="card-face back" style={{ position: 'relative' }}>
                    <button
                        onClick={(e) => speak(e, card.definition, languages?.definition)}
                        className="speaker-btn"
                        style={{
                            position: 'absolute',
                            top: '10px',
                            right: '10px',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '5px',
                            color: '#666'
                        }}
                    >
                        <SpeakerIcon />
                    </button>
                    {defImage && <img src={defImage} alt="Definition" className="card-image" />}
                    <div>{card.definition}</div>
                </div>
            </div>
        </div>
    );
};

export default Flashcard;
