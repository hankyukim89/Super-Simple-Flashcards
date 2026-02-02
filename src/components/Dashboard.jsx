import React, { useState, useRef, useEffect } from 'react';
import FileItem from './FileItem';
import ContextMenu from './ContextMenu';

const Dashboard = ({
    items,
    getChildren,
    createItem,
    deleteItems,
    renameItem,
    moveItems,
    onCopy,
    onPaste,
    onNavigateFile,
    updatePermissions
}) => {
    const [currentFolderId, setCurrentFolderId] = useState('root');
    const [selection, setSelection] = useState(new Set());
    const [contextMenu, setContextMenu] = useState(null);
    const [draggedItem, setDraggedItem] = useState(null);
    const containerRef = useRef(null);

    const currentFolder = items[currentFolderId];
    const children = getChildren(currentFolderId);

    // Breadcrumb path construction
    const getPath = (folderId) => {
        const path = [];
        let curr = items[folderId];
        while (curr) {
            path.unshift(curr);
            curr = items[curr.parentId];
        }
        return path;
    };

    const path = getPath(currentFolderId);

    const handleSelect = (item, isMulti) => {
        setSelection(prev => {
            const next = new Set(isMulti ? prev : []);
            if (next.has(item.id)) next.delete(item.id);
            else next.add(item.id);
            return next;
        });
    };

    const handleContextMenu = (e, item) => {
        e.preventDefault();
        e.stopPropagation(); // Stop bubbling to background

        // If right-clicked item is not in selection, select it exclusively
        if (item && !selection.has(item.id)) {
            setSelection(new Set([item.id]));
        }

        const targetItems = item ? (selection.has(item.id) ? Array.from(selection) : [item.id]) : [];

        const options = [];
        if (item) {
            options.push({ label: 'Open', action: () => onNavigateFile(item) });
            options.push({
                label: 'Rename', action: () => {
                    const newName = prompt("Rename to:", item.name);
                    if (newName) renameItem(item.id, newName);
                }
            });
            options.push({ label: 'Duplicate', action: () => onCopy(targetItems, 'copy') });
            options.push({ label: 'Copy', action: () => onCopy(targetItems, 'copy') });
            options.push({ label: 'Cut', action: () => onCopy(targetItems, 'cut') });
            options.push({ label: 'Delete', action: () => deleteItems(targetItems), danger: true });

            options.push({ label: 'Make Public', action: () => updatePermissions(item.id, 'public') });
            options.push({ label: 'Make Private', action: () => updatePermissions(item.id, 'private') });
        } else {
            options.push({ label: 'Paste', action: () => onPaste(currentFolderId) });
        }

        setContextMenu({ x: e.clientX, y: e.clientY, options });
    };

    // Global right click on background
    const handleBackgroundContextMenu = (e) => {
        e.preventDefault();
        // Only show Paste option on background context menu
        const options = [
            { label: 'Paste', action: () => onPaste(currentFolderId) }
        ];
        setContextMenu({ x: e.clientX, y: e.clientY, options });
    };

    const handleDrop = (targetItem) => {
        if (!draggedItem) return;
        if (targetItem.type === 'folder' && targetItem.id !== draggedItem.id) {
            const idsToMove = selection.has(draggedItem.id) ? Array.from(selection) : [draggedItem.id];
            moveItems(idsToMove, targetItem.id);
        }
        setDraggedItem(null);
    };

    // Keyboard Delete
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (selection.size > 0) deleteItems(Array.from(selection));
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selection, deleteItems]);

    return (
        <div
            className="dashboard-container"
            ref={containerRef}
            onContextMenu={handleBackgroundContextMenu}
            onClick={(e) => {
                // Clear selection when clicking empty space
                if (e.target === containerRef.current || e.target.classList.contains('file-grid')) {
                    setSelection(new Set());
                }
            }}
            style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
        >
            {/* Toolbar */}
            <div className="dashboard-toolbar" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '2rem',
                paddingBottom: '1rem',
                borderBottom: '1px solid var(--color-border)'
            }}>
                <div className="breadcrumbs" style={{ display: 'flex', gap: '0.5rem', fontSize: '1.2rem', color: 'var(--color-text-secondary)' }}>
                    {path.map((item, idx) => (
                        <span key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span
                                onClick={() => setCurrentFolderId(item.id)}
                                style={{
                                    cursor: 'pointer',
                                    color: idx === path.length - 1 ? 'var(--color-primary)' : 'inherit',
                                    fontWeight: idx === path.length - 1 ? 600 : 400,
                                    textDecoration: idx !== path.length - 1 ? 'underline' : 'none'
                                }}
                            >
                                {item.name}
                            </span>
                            {idx < path.length - 1 && <span style={{ color: '#ccc' }}>&gt;</span>}
                        </span>
                    ))}
                </div>

                <div className="toolbar-actions" style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        className="action-btn"
                        onClick={() => createItem('folder', 'New Folder', currentFolderId)}
                        style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}
                    >
                        + New Folder
                    </button>
                    <button
                        className="action-btn"
                        onClick={() => createItem('set', 'New Flashcard Set', currentFolderId)}
                        style={{ fontSize: '0.9rem', padding: '0.5rem 1rem', background: 'var(--color-primary)', color: 'white', borderColor: 'var(--color-primary)' }}
                    >
                        + New Set
                    </button>
                </div>
            </div>

            {/* Grid */}
            <div className="file-grid" style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignContent: 'flex-start', flex: 1 }}>
                {children.map(item => (
                    <FileItem
                        key={item.id}
                        item={item}
                        isSelected={selection.has(item.id)}
                        onSelect={handleSelect}
                        onNavigate={(i) => {
                            if (i.type === 'folder') setCurrentFolderId(i.id);
                            else onNavigateFile(i);
                        }}
                        onContextMenu={handleContextMenu}
                        isDragging={draggedItem?.id === item.id}
                        onDragStart={(e, i) => setDraggedItem(i)}
                        onDrop={handleDrop}
                    />
                ))}

                {/* Empty State */}
                {children.length === 0 && (
                    <div style={{
                        color: 'var(--color-text-secondary)',
                        width: '100%',
                        textAlign: 'center',
                        marginTop: '2rem',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '1rem',
                        opacity: 0.7
                    }}>
                        <div style={{ fontSize: '3rem' }}>📂</div>
                        <div>This folder is empty</div>
                        <div style={{ fontSize: '0.9rem' }}>Use the buttons above to create content</div>
                    </div>
                )}
            </div>

            {contextMenu && (
                <ContextMenu
                    {...contextMenu}
                    onClose={() => setContextMenu(null)}
                />
            )}
        </div>
    );
};

export default Dashboard;
