import React from 'react';

const FileItem = ({
    item,
    isSelected,
    onSelect,
    onNavigate,
    onContextMenu,
    isDragging,
    onDragStart,
    onDrop
}) => {

    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, item)}
            onDragOver={(e) => {
                e.preventDefault();
                if (item.type === 'folder') e.currentTarget.style.background = '#E8F0FE';
            }}
            onDragLeave={(e) => e.currentTarget.style.background = 'transparent'}
            onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.style.background = 'transparent';
                onDrop(item);
            }}
            onClick={(e) => onSelect(item, e.ctrlKey || e.metaKey)}
            onDoubleClick={() => onNavigate(item)}
            onContextMenu={(e) => onContextMenu(e, item)}
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '1rem',
                borderRadius: '8px',
                cursor: 'pointer',
                background: isSelected ? '#E8F0FE' : 'transparent', // Light blue selection
                border: isSelected ? '1px solid var(--color-primary)' : '1px solid transparent',
                width: '120px',
                opacity: isDragging ? 0.5 : 1,
                transition: 'all 0.1s'
            }}
        >
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>
                {item.type === 'folder' ? '📁' : '🗂️'}
            </div>
            <div style={{
                fontSize: '0.9rem',
                textAlign: 'center',
                wordBreak: 'break-word',
                fontWeight: isSelected ? 600 : 400
            }}>
                {item.name}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#999', marginTop: '0.2rem' }}>
                {item.permissions}
            </div>
        </div>
    );
};

export default FileItem;
