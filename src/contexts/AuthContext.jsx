import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Load session from localStorage on mount
        const storedUser = localStorage.getItem('flashcards_session');
        if (storedUser) {
            // eslint-disable-next-line
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = (username, password) => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (username === 'admin' && password === 'admin123') {
                    const adminUser = { id: 'admin', username: 'Admin', isAdmin: true };
                    setUser(adminUser);
                    localStorage.setItem('flashcards_session', JSON.stringify(adminUser));
                    resolve(adminUser);
                    return;
                }

                // Check local storage for registered users
                const users = JSON.parse(localStorage.getItem('flashcards_users') || '{}');
                const registeredUser = users[username];

                if (registeredUser && registeredUser.password === password) {
                    const userObj = { id: username, username: username }; // Simple ID strategy
                    setUser(userObj);
                    localStorage.setItem('flashcards_session', JSON.stringify(userObj));
                    resolve(userObj);
                } else {
                    reject('Invalid username or password');
                }
            }, 500); // Fake delay
        });
    };

    const signup = (username, password) => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const users = JSON.parse(localStorage.getItem('flashcards_users') || '{}');

                if (users[username] || username === 'admin') {
                    reject('Username already exists');
                    return;
                }

                const newUser = { password }; // In a real app, hash this!
                users[username] = newUser;
                localStorage.setItem('flashcards_users', JSON.stringify(users));

                // Auto login
                const userObj = { id: username, username };
                setUser(userObj);
                localStorage.setItem('flashcards_session', JSON.stringify(userObj));
                resolve(userObj);
            }, 500);
        });
    };

    const loginWithGoogle = () => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const googleUser = { id: 'google_user', username: 'Google User', isGoogle: true };
                setUser(googleUser);
                localStorage.setItem('flashcards_session', JSON.stringify(googleUser));
                resolve(googleUser);
            }, 800);
        });
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('flashcards_session');
    };

    return (
        <AuthContext.Provider value={{ user, login, signup, loginWithGoogle, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
