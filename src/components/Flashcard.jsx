import React from 'react';

const Flashcard = ({ card, isFlipped, onClick, images }) => {
    const termImage = images?.[card.index]?.term;
    const defImage = images?.[card.index]?.definition;

    return (
        <div className="flashcard-scene" onClick={onClick}>
            <div className={`flashcard ${isFlipped ? 'flipped' : ''}`}>
                <div className="card-face front">
                    {termImage && <img src={termImage} alt="Term" className="card-image" />}
                    <div>{card.term}</div>
                </div>
                <div className="card-face back">
                    {defImage && <img src={defImage} alt="Definition" className="card-image" />}
                    <div>{card.definition}</div>
                </div>
            </div>
        </div>
    );
};

export default Flashcard;
