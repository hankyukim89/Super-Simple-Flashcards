import { useState, useEffect } from 'react'
import { useFileSystem } from './hooks/useFileSystem'
import { useFlashcards } from './hooks/useFlashcards'
import Editor from './components/Editor'
import Study from './components/Study'
import Dashboard from './components/Dashboard'
import './App.css'

function App() {
  // Routing State
  const [view, setView] = useState('dashboard'); // 'dashboard', 'editor', 'study'
  const [activeSetId, setActiveSetId] = useState(null);

  // File System
  const fs = useFileSystem();

  // Flashcard Logic
  const flashcardState = useFlashcards();

  const handleNavigateFile = (item) => {
    if (item.type === 'set') {
      setActiveSetId(item.id);
      // Load content into editor/study
      // Assuming content format: { cards: [], text: "..." }
      // If fresh set, content is null.
      if (item.content) {
        flashcardState.setInputText(item.content.text || '');
        // We rely on parse logic in useFlashcards to generate cards from text
        // If we saved other metadata (separators), load them too
      } else {
        flashcardState.setInputText('');
      }
      setView('editor');
    }
  };

  const handleSaveSet = () => {
    if (activeSetId) {
      fs.updateSetContent(activeSetId, {
        text: flashcardState.inputText,
        // we could save parsed cards too to avoid reparsing, but text is source of truth
      });
    }
  };

  const goHome = () => {
    handleSaveSet();
    setView('dashboard');
    setActiveSetId(null);
  };

  const startStudy = () => {
    handleSaveSet();
    setView('study');
  };

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
            <button onClick={goHome} className="nav-btn" style={{ padding: '0.5rem', display: 'flex', alignItems: 'center' }}>
              ← Back
            </button>
          )}
          <h1 style={{ fontSize: '1.25rem' }}>
            {view === 'dashboard' ? 'My Flashcards' : (
              fs.items[activeSetId]?.name || 'Untitled Set'
            )}
          </h1>
        </div>

        <div style={{ gap: '1rem', display: 'flex' }}>
          {view !== 'dashboard' && (
            <>
              <button
                style={{
                  color: view === 'editor' ? 'var(--color-primary)' : 'var(--color-text)',
                  fontWeight: view === 'editor' ? 600 : 400
                }}
                onClick={() => setView('editor')}
              >
                Editor
              </button>
              <button
                style={{
                  color: view === 'study' ? 'var(--color-primary)' : 'var(--color-text)',
                  fontWeight: view === 'study' ? 600 : 400
                }}
                onClick={startStudy}
              >
                Study
              </button>
            </>
          )}
        </div>
      </header>
      <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', height: 'calc(100vh - 80px)' }}>
        {view === 'dashboard' && (
          <Dashboard
            {...fs}
            onNavigateFile={handleNavigateFile}
            onCopy={(ids, action) => fs.copyToClipboard(ids, action)}
            onPaste={fs.pasteFromClipboard}
          />
        )}
        {view === 'editor' && (
          <Editor {...flashcardState} />
        )}
        {view === 'study' && (
          <Study cards={flashcardState.cards} images={flashcardState.images} />
        )}
      </main>
    </div>
  )
}

export default App
