import { useState } from 'react'
import { useFileSystem } from './hooks/useFileSystem'
import { useFlashcards } from './hooks/useFlashcards'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Editor from './components/Editor'
import Study from './components/Study'
import Dashboard from './components/Dashboard'
import LandingPage from './components/LandingPage'
import './App.css'

function AuthenticatedApp() {
  const { user, logout } = useAuth();

  // Routing State
  const [view, setView] = useState('dashboard'); // 'dashboard', 'editor', 'study'
  const [activeSetId, setActiveSetId] = useState(null);
  const [history, setHistory] = useState([]); // Stack of { view, activeSetId }

  // File System - Pass user ID for isolation
  const fs = useFileSystem(user?.id);

  // Flashcard Logic
  const flashcardState = useFlashcards();

  const handleNavigateFile = (item) => {
    if (item.type === 'set') {
      setActiveSetId(item.id);
      if (item.content) {
        flashcardState.setInputText(item.content.text || '');
        if (item.content.languages) {
          flashcardState.setLanguages(item.content.languages);
        }
      } else {
        flashcardState.setInputText('');
        flashcardState.setLanguages({ term: 'en-US', definition: 'en-US' });
      }
      setHistory(prev => [...prev, { view, activeSetId }]);
      setView('editor');
    }
  };

  const navigateToNewSet = (id) => {
    setActiveSetId(id);
    flashcardState.setInputText('');
    flashcardState.setLanguages({ term: 'en-US', definition: 'en-US' });
    setHistory(prev => [...prev, { view, activeSetId }]);
    setView('editor');
  };

  const handleSaveSet = () => {
    if (activeSetId) {
      fs.updateSetContent(activeSetId, {
        text: flashcardState.inputText,
        languages: flashcardState.languages,
      });
    }
  };

  const goBack = () => {
    handleSaveSet();
    if (history.length > 0) {
      const prev = history[history.length - 1];
      setHistory(history.slice(0, -1));
      setView(prev.view);
      setActiveSetId(prev.activeSetId);
    } else {
      setView('dashboard');
      setActiveSetId(null);
    }
  };

  const handleCreateAndExit = () => {
    handleSaveSet();
    goBack();
  };

  const startStudy = () => {
    handleSaveSet();
    setView('study');
  };

  // If we are not logged in, show Landing Page
  if (!user) {
    return <LandingPage />;
  }

  return (
    <div className="app-container">
      <header style={{
        padding: '1rem 2rem',
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {view !== 'dashboard' && (
            <button onClick={goBack} className="nav-btn" style={{ padding: '0.5rem', display: 'flex', alignItems: 'center' }}>
              ← Back
            </button>
          )}
          <h1 style={{ fontSize: '1.25rem' }}>
            {view === 'dashboard' ? 'My Flashcards' : (
              fs.items[activeSetId]?.name || 'Untitled Set'
            )}
          </h1>
        </div>

        <div style={{ gap: '1rem', display: 'flex', alignItems: 'center' }}>
          {view === 'editor' && (
            <>
              <button
                className="action-btn"
                onClick={handleCreateAndExit}
                style={{ padding: '0.5rem 1rem' }}
              >
                Create
              </button>
              <button
                className="action-btn"
                onClick={startStudy}
                style={{ padding: '0.5rem 1rem', background: 'var(--color-primary)', color: 'white', borderColor: 'var(--color-primary)' }}
              >
                Create and Practice
              </button>
            </>
          )}

          <div style={{
            marginLeft: '1rem',
            paddingLeft: '1rem',
            borderLeft: '1px solid #eee',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span style={{ fontSize: '0.9rem', fontWeight: '500', color: '#666' }}>
              {user.username}
            </span>
            <button
              onClick={logout}
              style={{
                fontSize: '0.8rem',
                color: '#999',
                cursor: 'pointer',
                padding: '0.2rem 0.5rem',
                background: '#f5f5f7',
                borderRadius: '4px'
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', height: 'calc(100vh - 80px)' }}>
        {view === 'dashboard' && (
          <Dashboard
            {...fs}
            onNavigateFile={handleNavigateFile}
            onCopy={(ids, action) => fs.copyToClipboard(ids, action)}
            onPaste={fs.pasteFromClipboard}
            onNavigateNewSet={navigateToNewSet}
          />
        )}
        {view === 'editor' && (
          <Editor {...flashcardState} />
        )}
        {view === 'study' && (
          <Study cards={flashcardState.cards} images={flashcardState.images} languages={flashcardState.languages} />
        )}
      </main>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
}

export default App
