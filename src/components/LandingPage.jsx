import React, { useState } from 'react';
import AuthModal from './Auth/AuthModal';

const LandingPage = () => {
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const [authMode, setAuthMode] = useState('login');

    const openAuth = (mode) => {
        setAuthMode(mode);
        setIsAuthOpen(true);
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
            textAlign: 'center',
            padding: '2rem'
        }}>
            <div style={{
                background: 'white',
                padding: '4rem 3rem',
                borderRadius: '24px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
                maxWidth: '600px',
                width: '100%'
            }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⚡️</div>
                <h1 style={{
                    fontSize: '3rem',
                    fontWeight: '800',
                    color: '#2d3748',
                    marginBottom: '1rem',
                    lineHeight: '1.2'
                }}>
                    Super Simple Flashcards
                </h1>
                <p style={{
                    fontSize: '1.25rem',
                    color: '#718096',
                    marginBottom: '3rem',
                    lineHeight: '1.6'
                }}>
                    Make flash cards simple and fast. <br />
                    No clutter, just learning.
                </p>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexDirection: 'column' }}>
                    <button
                        onClick={() => openAuth('signup')}
                        style={{
                            padding: '1rem 2rem',
                            fontSize: '1.1rem',
                            fontWeight: '600',
                            color: 'white',
                            background: 'var(--color-primary, #FF9500)',
                            border: 'none',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            transition: 'transform 0.2s',
                            boxShadow: '0 4px 12px rgba(255, 149, 0, 0.3)'
                        }}
                    >
                        Get Started for Free
                    </button>
                    <button
                        onClick={() => openAuth('login')}
                        style={{
                            padding: '1rem 2rem',
                            fontSize: '1.1rem',
                            fontWeight: '600',
                            color: '#4a5568',
                            background: 'white',
                            border: '2px solid #e2e8f0',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            transition: 'background 0.2s'
                        }}
                    >
                        Log In
                    </button>
                </div>
            </div>

            <AuthModal
                isOpen={isAuthOpen}
                onClose={() => setIsAuthOpen(false)}
                initialMode={authMode}
            />
        </div>
    );
};

export default LandingPage;
