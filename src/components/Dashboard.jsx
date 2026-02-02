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
    updatePermissions,
    onNavigateNewSet
}) => {
    const [currentFolderId, setCurrentFolderId] = useState('root');
    const [selection, setSelection] = useState(new Set());
    const [contextMenu, setContextMenu] = useState(null);
    const [draggedItem, setDraggedItem] = useState(null);
    const [renamingId, setRenamingId] = useState(null);

    // Selection Box State
    const [isSelecting, setIsSelecting] = useState(false);
    const [selectionBox, setSelectionBox] = useState(null); // { startX, startY, currentX, currentY }
    const containerRef = useRef(null);

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
                label: 'Rename', action: () => setRenamingId(item.id)
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
            { label: 'New Folder', action: handleNewFolder },
            { label: 'New Set', action: handleNewSet },
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

    // Renaming Handler
    const handleRename = (id, newName) => {
        if (newName && newName.trim() !== '') {
            renameItem(id, newName);
        }
        setRenamingId(null);
    };

    // Actions
    const handleNewFolder = () => {
        const id = createItem('folder', 'New Folder', currentFolderId);
        setRenamingId(id);
    };

    const handleNewSet = () => {
        const id = createItem('set', 'New Flashcard Set', currentFolderId);
        onNavigateNewSet(id);
    };


    // Selection Box Handlers
    const handleMouseDown = (e) => {
        if (e.target === containerRef.current || e.target.classList.contains('file-grid')) {
            // Start selection box
            setIsSelecting(true);
            setSelectionBox({
                startX: e.clientX,
                startY: e.clientY,
                currentX: e.clientX,
                currentY: e.clientY
            });
            if (!e.shiftKey && !e.metaKey && !e.ctrlKey) {
                setSelection(new Set());
            }
        }
    };

    const handleMouseMove = (e) => {
        if (isSelecting && selectionBox) {
            setSelectionBox(prev => ({
                ...prev,
                currentX: e.clientX,
                currentY: e.clientY
            }));
        }
    };

    const handleMouseUp = (e) => {
        if (isSelecting) {
            // Calculate intersection with items
            // This is a naive implementation. For robust intersection, we need item refs.
            // But since we are short on time/complexity, we can simply define a box and check intersection if we had item positions.
            // Since we don't have item positions easily without refs for each, 
            // I'll stick to a visual box for now and maybe a simpler logic later if requested.
            // Or: just assume user wants drag select functionality and implement it properly.
            // RECT: Left, Top, Width, Height
            // We need to know where items are.
            // Let's defer actual selection logic or iterate through child positions?
            // "I want to be able to drag select" -> They expect it to work.
            // Since `children` are mapped, we can't easily get their DOM nodes without a ref map.
            // Let's try to querySelectorAll('.file-item')?

            if (selectionBox) {
                const boxRect = {
                    left: Math.min(selectionBox.startX, selectionBox.currentX),
                    top: Math.min(selectionBox.startY, selectionBox.currentY),
                    right: Math.max(selectionBox.startX, selectionBox.currentX),
                    bottom: Math.max(selectionBox.startY, selectionBox.currentY)
                };

                const itemNodes = document.querySelectorAll('.file-item-wrapper');
                const newSelection = new Set(e.shiftKey ? selection : []);

                itemNodes.forEach(node => {
                    const rect = node.getBoundingClientRect();
                    // Check intersection
                    if (rect.left < boxRect.right && rect.right > boxRect.left &&
                        rect.top < boxRect.bottom && rect.bottom > boxRect.top) {
                        const id = node.getAttribute('data-id');
                        if (id) newSelection.add(id);
                    }
                });

                if (newSelection.size > 0 || !e.shiftKey) {
                    setSelection(newSelection);
                }
            }

            setIsSelecting(false);
            setSelectionBox(null);
        }
    };

    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

    return (
        <div
            className="dashboard-container"
            ref={containerRef}
            onContextMenu={handleBackgroundContextMenu}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onClick={() => {
                // Clear selection handled in MouseDown if hitting background
            }}
            style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', userSelect: 'none' }}
        >
            {/* Toolbar */}
            <div className="dashboard-toolbar" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem',
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

                <div className="toolbar-actions" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ display: 'flex', background: '#f0f2f5', borderRadius: '20px', padding: '2px', marginRight: '1rem' }}>
                        <button
                            onClick={() => setViewMode('list')}
                            style={{
                                background: viewMode === 'list' ? 'white' : 'transparent',
                                border: 'none',
                                borderRadius: '18px',
                                padding: '6px 12px',
                                cursor: 'pointer',
                                boxShadow: viewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                display: 'flex', alignItems: 'center', gap: '5px'
                            }}
                        >
                            <span style={{ fontSize: '14px' }}>☰</span>
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            style={{
                                background: viewMode === 'grid' ? 'white' : 'transparent',
                                border: 'none',
                                borderRadius: '18px',
                                padding: '6px 12px',
                                cursor: 'pointer',
                                boxShadow: viewMode === 'grid' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                display: 'flex', alignItems: 'center', gap: '5px'
                            }}
                        >
                            <span style={{ fontSize: '14px' }}>⊞</span>
                        </button>
                    </div>

                    <button
                        className="action-btn"
                        onClick={handleNewFolder}
                        style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}
                    >
                        + New Folder
                    </button>
                    <button
                        className="action-btn"
                        onClick={handleNewSet}
                        style={{ fontSize: '0.9rem', padding: '0.5rem 1rem', background: 'var(--color-primary)', color: 'white', borderColor: 'var(--color-primary)' }}
                    >
                        + New Set
                    </button>
                </div>
            </div>

            {/* List Header */}
            {viewMode === 'list' && children.length > 0 && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(250px, 2fr) 150px 150px',
                    padding: '0.5rem 1rem',
                    borderBottom: '1px solid #eee',
                    marginBottom: '0.5rem',
                    color: '#666',
                    fontSize: '0.9rem',
                    fontWeight: '500'
                }}>
                    <div>Name</div>
                    <div>Owner</div>
                    <div>Date Modified</div>
                </div>
            )}

            {/* Content Area */}
            <div className={`file-content-area ${viewMode}-view`} style={{
                display: 'flex',
                flexDirection: viewMode === 'list' ? 'column' : 'row',
                flexWrap: viewMode === 'list' ? 'nowrap' : 'wrap',
                gap: viewMode === 'list' ? '0' : '1.5rem',
                alignContent: 'flex-start',
                flex: 1
            }}>
                {children.map(item => (
                    <div className="file-item-wrapper" data-id={item.id} key={item.id} style={{ width: viewMode === 'list' ? '100%' : 'auto' }}>
                        <FileItem
                            item={item}
                            viewMode={viewMode}
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
                            isRenaming={renamingId === item.id}
                            onRename={handleRename}
                        />
                    </div>
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

            {isSelecting && selectionBox && (
                <div style={{
                    position: 'absolute',
                    border: '1px solid #007bff',
                    backgroundColor: 'rgba(0, 123, 255, 0.2)',
                    left: Math.min(selectionBox.startX, selectionBox.currentX),
                    top: Math.min(selectionBox.startY, selectionBox.currentY),
                    width: Math.abs(selectionBox.currentX - selectionBox.startX),
                    height: Math.abs(selectionBox.currentY - selectionBox.startY),
                    pointerEvents: 'none',
                    zIndex: 100
                }} />
            )}

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
