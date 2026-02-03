import React from 'react';

const FileItem = ({
    item,
    isSelected,
    onSelect,
    onNavigate,
    onContextMenu,
    isDragging,
    onDragStart,
    onDrop,
    isRenaming,
    onRename,
    viewMode
}) => {
    const handleRenameSubmit = (e) => {
        if (e.key === 'Enter') {
            onRename(item.id, e.target.value);
        } else if (e.key === 'Escape') {
            onRename(item.id, null); // Cancel
        }
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return '-';
        return new Date(timestamp).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (viewMode === 'list') {
        return (
            <div
                draggable
                onDragStart={(e) => onDragStart(e, item)}
                onDragOver={(e) => {
                    e.preventDefault();
                    if (item.type === 'folder') e.currentTarget.style.background = '#E8F0FE';
                }}
                onDragLeave={(e) => e.currentTarget.style.background = isSelected ? 'rgba(232, 240, 254, 0.5)' : 'transparent'}
                onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.style.background = 'transparent';
                    onDrop(item);
                }}
                onClick={(e) => !isRenaming && onSelect(item, e.ctrlKey || e.metaKey)}
                onDoubleClick={() => !isRenaming && onNavigate(item)}
                onContextMenu={(e) => onContextMenu(e, item)}
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(250px, 2fr) 150px 150px',
                    alignItems: 'center',
                    padding: '0.75rem 1rem',
                    cursor: 'pointer',
                    background: isSelected ? '#E8F0FE' : 'transparent',
                    borderBottom: '1px solid #f0f0f0',
                    opacity: isDragging ? 0.5 : 1,
                    transition: 'background 0.1s'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', overflow: 'hidden' }}>
                    <div style={{ fontSize: '1.5rem', flexShrink: 0 }}>
                        {item.type === 'folder' ? '📁' : '🗂️'}
                    </div>
                    {isRenaming ? (
                        <input
                            autoFocus
                            onFocus={(e) => e.target.select()}
                            defaultValue={item.name}
                            onBlur={(e) => onRename(item.id, e.target.value)}
                            onKeyDown={handleRenameSubmit}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                width: '100%',
                                fontSize: '0.9rem',
                                padding: '2px',
                                border: '1px solid var(--color-primary)',
                                borderRadius: '4px'
                            }}
                        />
                    ) : (
                        <div style={{
                            fontSize: '0.9rem',
                            fontWeight: isSelected ? 600 : 500,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                        }}>
                            {item.name}
                        </div>
                    )}
                </div>

                <div style={{ fontSize: '0.9rem', color: '#5f6368' }}>
                    me
                </div>

                <div style={{ fontSize: '0.85rem', color: '#5f6368' }}>
                    {formatDate(item.modified || item.created)}
                </div>
            </div>
        );
    }

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
            onClick={(e) => !isRenaming && onSelect(item, e.ctrlKey || e.metaKey)}
            onDoubleClick={() => !isRenaming && onNavigate(item)}
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
            {isRenaming ? (
                <input
                    autoFocus
                    onFocus={(e) => e.target.select()}
                    defaultValue={item.name}
                    onBlur={(e) => onRename(item.id, e.target.value)}
                    onKeyDown={handleRenameSubmit}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        width: '100%',
                        textAlign: 'center',
                        fontSize: '0.9rem',
                        padding: '2px',
                        border: '1px solid var(--color-primary)',
                        borderRadius: '4px'
                    }}
                />
            ) : (
                <div style={{
                    fontSize: '0.9rem',
                    textAlign: 'center',
                    wordBreak: 'break-word',
                    fontWeight: isSelected ? 600 : 400
                }}>
                    {item.name}
                </div>
            )}
            <div style={{ fontSize: '0.7rem', color: '#999', marginTop: '0.2rem' }}>
                {item.permissions}
            </div>
        </div>
    );
};

export default FileItem;
