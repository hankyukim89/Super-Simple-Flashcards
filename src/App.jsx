import { useState } from 'react'
import { Routes, Route, useNavigate, useLocation, Link } from 'react-router-dom'
import { useFileSystem } from './hooks/useFileSystem'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Dashboard from './components/Dashboard'
import LandingPage from './components/LandingPage'
import EditorPage from './components/EditorPage'
import StudyPage from './components/StudyPage'
import './App.css'

function AuthenticatedApp() {
  const { user, logout } = useAuth();
  const fs = useFileSystem(user?.id);
  const navigate = useNavigate();
  const location = useLocation();

  const [isRenamingTitle, setIsRenamingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState('');

  const handleTitleSubmit = () => {
    setIsRenamingTitle(false);
    if (!titleInput.trim()) return;

    if (location.pathname.startsWith('/edit/') || location.pathname.startsWith('/study/')) {
      const id = location.pathname.split('/')[2];
      fs.renameItem(id, titleInput);
    }
  };

  // Helper to get active set name for header
  const getActiveSetName = () => {
    const path = location.pathname;
    if (path.startsWith('/edit/') || path.startsWith('/study/')) {
      const id = path.split('/')[2];
      return fs.items[id]?.name || 'Untitled Set';
    }
    return '';
  };

  const handleNavigateFile = (item) => {
    if (item.type === 'set') {
      navigate(`/study/${item.id}`);
    }
  };

  const handleEditFile = (item) => {
    if (item.type === 'set') {
      navigate(`/edit/${item.id}`);
    }
  };

  const navigateToNewSet = (id) => {
    navigate(`/edit/${id}`);
  };

  const [hasCards, setHasCards] = useState(false);

  // If we are not logged in, show Landing Page
  if (!user) {
    return <LandingPage />;
  }

  const isDashboard = location.pathname === '/';
  const isEditor = location.pathname.startsWith('/edit/') || location.pathname === '/create';
  const currentSetId = isEditor ? location.pathname.split('/')[2] : null;

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
          {!isDashboard && (
            <button onClick={() => navigate('/')} className="nav-btn" style={{ padding: '0.5rem', display: 'flex', alignItems: 'center' }}>
              ← Back
            </button>
          )}
          {isRenamingTitle ? (
            <input
              autoFocus
              className="nav-title-input"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
              style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                fontFamily: 'inherit',
                border: '1px solid black',
                borderRadius: '4px',
                padding: '0 6px',
                lineHeight: '1.5',
                width: 'auto',
                minWidth: '200px',
                margin: '-1px',
                color: 'inherit',
                background: 'white'
              }}
            />
          ) : (
            <h1
              className={!isDashboard ? "editable-document-title" : ""}
              title={!isDashboard ? "Rename" : ""}
              style={{ fontSize: '1.25rem' }}
              onClick={() => {
                if (!isDashboard) {
                  setTitleInput(getActiveSetName());
                  setIsRenamingTitle(true);
                }
              }}
            >
              {isDashboard ? 'My Flashcards' : getActiveSetName()}
            </h1>
          )}
        </div>

        <div style={{ gap: '1rem', display: 'flex', alignItems: 'center' }}>
          {isEditor && (
            <>
              <button
                className="action-btn"
                onClick={() => navigate('/')} // "Create" button effectively just saves (via unmount) and exits
                disabled={!hasCards}
                style={{
                  padding: '0.5rem 1rem',
                  opacity: hasCards ? 1 : 0.5,
                  cursor: hasCards ? 'pointer' : 'not-allowed'
                }}
              >
                Create
              </button>
              <button
                className="action-btn"
                onClick={() => navigate(`/study/${currentSetId}`)}
                disabled={!hasCards}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'var(--color-primary)',
                  color: 'white',
                  borderColor: 'var(--color-primary)',
                  opacity: hasCards ? 1 : 0.5,
                  cursor: hasCards ? 'pointer' : 'not-allowed'
                }}
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
        <Routes>
          <Route path="/" element={
            <Dashboard
              {...fs}
              onNavigateFile={handleNavigateFile}
              onEditFile={handleEditFile}
              onCopy={(ids, action) => fs.copyToClipboard(ids, action)}
              onPaste={fs.pasteFromClipboard}
              onNavigateNewSet={navigateToNewSet}
            />
          } />
          <Route path="/edit/:setId" element={<EditorPage fs={fs} setHasCards={setHasCards} />} />
          <Route path="/create" element={<EditorPage fs={fs} setHasCards={setHasCards} />} />
          <Route path="/study/:setId" element={<StudyPage fs={fs} />} />
        </Routes>
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
