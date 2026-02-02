import React, { useEffect, useRef } from 'react';

const ContextMenu = ({ x, y, options, onClose }) => {
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    return (
        <div
            ref={menuRef}
            style={{
                position: 'fixed',
                top: y,
                left: x,
                background: 'white',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                boxShadow: 'var(--shadow-lg)',
                zIndex: 1000,
                minWidth: '160px',
                padding: '0.5rem 0'
            }}
        >
            {options.map((opt, idx) => (
                <div
                    key={idx}
                    className="context-menu-item"
                    onClick={(e) => {
                        e.stopPropagation();
                        console.log('Context menu clicked:', opt.label);
                        opt.action();
                        onClose();
                    }}
                    style={{
                        padding: '0.5rem 1rem',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        color: opt.danger ? 'var(--color-danger)' : 'var(--color-text)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}
                    onMouseEnter={(e) => e.target.style.background = '#F5F5F7'}
                    onMouseLeave={(e) => e.target.style.background = 'white'}
                >
                    {opt.label}
                </div>
            ))}
        </div>
    );
};

export default ContextMenu;
