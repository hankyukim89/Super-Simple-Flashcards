import React, { useRef, useEffect } from 'react';
import { useFlashcards } from '../hooks/useFlashcards';
import CardPreview from './CardPreview';

const Editor = ({
    inputText,
    setInputText,
    cards,
    separators,
    setSeparators,
    updateCard,
    images,
    addImage,
    removeCard
}) => {
    const textareaRef = useRef(null);
    const lineNumbersRef = useRef(null);

    const handleSeparatorChange = (type, value) => {
        setSeparators(prev => ({ ...prev, [type]: value }));
    };

    const handleScroll = () => {
        if (textareaRef.current && lineNumbersRef.current) {
            lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
        }
    };

    const lineCount = inputText.split('\n').length;
    // Ensure enough lines fill the height
    const lineNumbers = Array.from({ length: Math.max(lineCount, 20) }, (_, i) => i + 1);

    return (
        <div className="editor-layout">
            {/* Left Column: Input & Settings */}
            <div className="input-section">

                <div className="editor-container">
                    <div className="line-numbers" ref={lineNumbersRef}>
                        {lineNumbers.map(num => (
                            <div key={num}>{num}</div>
                        ))}
                    </div>
                    <textarea
                        ref={textareaRef}
                        className="main-input code-editor"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onScroll={handleScroll}
                        placeholder={`Word 1, Definition 1\nWord 2, Definition 2...`}
                        spellCheck={false}
                    />
                </div>

                <div className="settings-panel">
                    <div className="setting-group">
                        <label>Between term and definition</label>
                        <input
                            type="text"
                            className="separator-input"
                            value={separators.term}
                            onChange={(e) => handleSeparatorChange('term', e.target.value)}
                            placeholder="e.g. , or -"
                        />
                    </div>

                    <div className="setting-group">
                        <label>Between cards (New Line is default)</label>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                            <span style={{ background: '#eee', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>↵ New Line</span>
                            <span>or</span>
                            <input
                                type="text"
                                className="separator-input"
                                style={{ width: '60px' }}
                                value={separators.card === '\n' ? '' : separators.card}
                                onChange={(e) => handleSeparatorChange('card', e.target.value || '\n')}
                                placeholder="Custom"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column: Preview */}
            <div className="preview-section">
                <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    Preview <span className="badge">{cards.length} cards</span>
                </h2>
                {cards.map((card, idx) => (
                    <CardPreview
                        key={card.id || idx} // Fallback to idx if id unstable
                        index={idx}
                        card={card}
                        onUpdate={updateCard}
                        onAddImage={addImage}
                        onDelete={removeCard}
                        images={images}
                    />
                ))}
            </div>
        </div>
    );
};

export default Editor;
