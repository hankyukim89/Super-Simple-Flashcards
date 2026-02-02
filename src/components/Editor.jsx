import React, { useRef } from 'react';
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
    removeCard,
    languages,
    setLanguages
}) => {
    const textareaRef = useRef(null);

    const handleSeparatorChange = (type, value) => {
        setSeparators(prev => ({ ...prev, [type]: value }));
    };

    const handleLanguageChange = (type, value) => {
        setLanguages(prev => ({ ...prev, [type]: value }));
    };



    return (
        <div className="editor-layout">
            {/* Left Column: Input & Settings */}
            <div className="input-section">
                <div className="editor-container" style={{ display: 'flex' }}>
                    <textarea
                        ref={textareaRef}
                        className="main-input code-editor"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder={`Word 1, Definition 1\nWord 2, Definition 2...`}
                        spellCheck={false}
                        style={{ padding: '1rem', flex: 1 }}
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

                    <div className="setting-group" style={{ flexDirection: 'row', gap: '1rem' }}>
                        <div style={{ flex: 1 }}>
                            <label>Term Language</label>
                            <select
                                value={languages?.term || 'en-US'}
                                onChange={(e) => handleLanguageChange('term', e.target.value)}
                                style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem' }}
                            >
                                <option value="en-US">English (US)</option>
                                <option value="es-ES">Spanish</option>
                                <option value="fr-FR">French</option>
                                <option value="de-DE">German</option>
                                <option value="it-IT">Italian</option>
                                <option value="ja-JP">Japanese</option>
                                <option value="ko-KR">Korean</option>
                                <option value="zh-CN">Chinese (Simplified)</option>
                            </select>
                        </div>
                        <div style={{ flex: 1 }}>
                            <label>Definition Language</label>
                            <select
                                value={languages?.definition || 'en-US'}
                                onChange={(e) => handleLanguageChange('definition', e.target.value)}
                                style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem' }}
                            >
                                <option value="en-US">English (US)</option>
                                <option value="es-ES">Spanish</option>
                                <option value="fr-FR">French</option>
                                <option value="de-DE">German</option>
                                <option value="it-IT">Italian</option>
                                <option value="ja-JP">Japanese</option>
                                <option value="ko-KR">Korean</option>
                                <option value="zh-CN">Chinese (Simplified)</option>
                            </select>
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
