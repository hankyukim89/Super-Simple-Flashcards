import React, { useRef } from 'react';

const CardPreview = ({ card, index, onUpdate, onAddImage, onDelete, images }) => {
    const fileInputRef = useRef(null);
    const currentImageSide = useRef(null);

    const handleImageClick = (side) => {
        currentImageSide.current = side;
        fileInputRef.current?.click();
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file && currentImageSide.current) {
            const url = URL.createObjectURL(file);
            onAddImage(index, currentImageSide.current, url);
            // Reset
            e.target.value = '';
        }
    };

    const termImage = images?.[index]?.term;
    const defImage = images?.[index]?.definition;

    return (
        <div className="card-preview">
            <div className="card-header">
                <span>{index + 1}</span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="delete-btn" onClick={() => onDelete(index)} title="Delete card">
                        Stop
                    </button>
                    <button className="delete-btn" onClick={() => onDelete(index)} title="Delete card">
                        🗑️
                    </button>
                </div>
            </div>

            <div className="card-row">
                <div className="preview-input-group">
                    <label>Term</label>
                    <input
                        className="preview-input"
                        value={card.term}
                        onChange={(e) => onUpdate(index, 'term', e.target.value)}
                        placeholder="Term"
                    />
                </div>
                <button
                    className="image-upload-btn"
                    onClick={() => handleImageClick('term')}
                    style={termImage ? { backgroundImage: `url(${termImage})`, backgroundSize: 'cover', border: 'none' } : {}}
                >
                    {!termImage && <span>Image</span>}
                </button>
            </div>

            <div className="card-row">
                <div className="preview-input-group">
                    <label>Definition</label>
                    <input
                        className="preview-input"
                        value={card.definition}
                        onChange={(e) => onUpdate(index, 'definition', e.target.value)}
                        placeholder="Definition"
                    />
                </div>
                <button
                    className="image-upload-btn"
                    onClick={() => handleImageClick('definition')}
                    style={defImage ? { backgroundImage: `url(${defImage})`, backgroundSize: 'cover', border: 'none' } : {}}
                >
                    {!defImage && <span>Image</span>}
                </button>
            </div>

            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/*"
                onChange={handleFileChange}
            />
        </div>
    );
};

export default CardPreview;
