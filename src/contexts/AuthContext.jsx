import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { isFirebaseConfigured } from '@/services/firebase/config';
import * as firebaseAuth from '@/services/firebase/auth';
import * as firestore from '@/services/firebase/firestore';

const AuthContext = createContext(null);

const toEmail = (username) => `${username.trim().toLowerCase()}@shreeannai-4d014.firebaseapp.com`;

const DEFAULT_USERS = [
  { username: 'admin', password: 'admin', fullName: 'Administrator', fullNameTA: '\u0BA8\u0BBF\u0BB0\u0BCD\u0BB5\u0BBE\u0B95\u0BBF', role: 'admin' },
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [registeredUsers, setRegisteredUsers] = useState(DEFAULT_USERS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }
    const unsubscribe = firebaseAuth.onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const users = await firestore.getUsers();
          const profile = users.find(u => u.uid === firebaseUser.uid);
          const username = firebaseUser.email.split('@')[0];
          setUser({
            uid: firebaseUser.uid, email: firebaseUser.email,
            username,
            fullName: profile?.fullName || firebaseUser.displayName || username,
            fullNameTA: profile?.fullNameTA || '',
            role: profile?.role || 'member',
          });
          setRegisteredUsers(users.map(u => ({
            username: u.username || u.uid, fullName: u.fullName || '',
            fullNameTA: u.fullNameTA || '', role: u.role || 'member', uid: u.uid,
          })));
        } catch (err) {
          console.error('Error loading user profile:', err);
          setUser({
            uid: firebaseUser.uid, email: firebaseUser.email,
            username: firebaseUser.email.split('@')[0],
            fullName: firebaseUser.displayName || firebaseUser.email.split('@')[0],
            fullNameTA: '', role: 'member',
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = useCallback(async (username, password) => {
    if (!isFirebaseConfigured) {
      const found = registeredUsers.find(u => u.username === username.trim());
      if (found && found.password !== password) return { error: 'Invalid credentials' };
      const userData = {
        username: username.trim(),
        fullName: found?.fullName || username.trim(),
        fullNameTA: found?.fullNameTA || '',
        role: found?.role || (username.toLowerCase() === 'admin' ? 'admin' : 'member'),
      };
      setUser(userData);
      return { user: userData };
    }
    try {
      const email = toEmail(username);
      await firebaseAuth.signIn(email, password);
      // Log login activity
      firestore.logActivity({
        type: 'login',
        user: username.trim(),
        detail: `${username.trim()} logged in`,
      });
      return { success: true };
    } catch (err) {
      console.error('Login error:', err);
      return { error: err.message || 'Login failed' };
    }
  }, [registeredUsers]);

  const logout = useCallback(async () => {
    const logoutUser = user?.username || 'unknown';
    if (isFirebaseConfigured) {
      // Log logout before signing out (non-blocking, don't fail logout if logging fails)
      try {
        await firestore.logActivity({
          type: 'logout',
          user: logoutUser,
          detail: `${logoutUser} logged out`,
        });
      } catch (_) { /* ignore logging failures */ }
      try { await firebaseAuth.signOut(); } catch (err) { console.error('Logout error:', err); }
    }
    setUser(null);
  }, [user]);

  const registerUser = useCallback(async (newUser) => {
    if (!isFirebaseConfigured) { setRegisteredUsers(prev => [...prev, newUser]); return; }
    try {
      const email = toEmail(newUser.username);
      // signUp uses a secondary Firebase app so admin session is NOT affected
      const cred = await firebaseAuth.signUp(email, newUser.password, newUser.fullName);
      await firestore.createUser(cred.user.uid, {
        username: newUser.username.trim(), fullName: newUser.fullName,
        fullNameTA: newUser.fullNameTA || '', role: newUser.role || 'member', email,
      }, user?.username || 'admin');
      const users = await firestore.getUsers();
      setRegisteredUsers(users.map(u => ({
        username: u.username || u.uid, fullName: u.fullName || '',
        fullNameTA: u.fullNameTA || '', role: u.role || 'member', uid: u.uid,
      })));
      // Log user creation
      firestore.logActivity({
        type: 'user_create',
        user: user?.username || 'admin',
        detail: `Created user "${newUser.fullName}" (@${newUser.username.trim()})`,
        target: newUser.username.trim(),
      });
    } catch (err) { console.error('Register error:', err); throw err; }
  }, [user]);

  const updateUser = useCallback(async (username, updates) => {
    if (!isFirebaseConfigured) {
      setRegisteredUsers(prev => prev.map(u => u.username === username ? { ...u, ...updates } : u));
      return;
    }
    try {
      const target = registeredUsers.find(u => u.username === username);
      if (target?.uid) {
        const d = {};
        if (updates.fullName) d.fullName = updates.fullName;
        if (updates.fullNameTA !== undefined) d.fullNameTA = updates.fullNameTA;
        if (updates.role) d.role = updates.role;
        await firestore.updateUser(target.uid, d, user?.username || 'admin');
        const users = await firestore.getUsers();
        setRegisteredUsers(users.map(u => ({
          username: u.username || u.uid, fullName: u.fullName || '',
          fullNameTA: u.fullNameTA || '', role: u.role || 'member', uid: u.uid,
        })));
        if (user?.uid === target.uid) {
          setUser(prev => ({ ...prev, fullName: updates.fullName || prev.fullName,
            fullNameTA: updates.fullNameTA !== undefined ? updates.fullNameTA : prev.fullNameTA,
            role: updates.role || prev.role }));
        }
        // Log user update
        firestore.logActivity({
          type: 'user_update',
          user: user?.username || 'admin',
          detail: `Updated user @${username}`,
          target: username,
        });
      }
    } catch (err) { console.error('Update user error:', err); throw err; }
  }, [registeredUsers, user]);

  const deleteUser = useCallback(async (username) => {
    if (!isFirebaseConfigured) {
      setRegisteredUsers(prev => prev.filter(u => u.username !== username));
      return;
    }
    try {
      const target = registeredUsers.find(u => u.username === username);
      if (target?.uid) {
        await firestore.deleteUser(target.uid);
        const users = await firestore.getUsers();
        setRegisteredUsers(users.map(u => ({
          username: u.username || u.uid, fullName: u.fullName || '',
          fullNameTA: u.fullNameTA || '', role: u.role || 'member', uid: u.uid,
        })));
        // Log user deletion
        firestore.logActivity({
          type: 'user_delete',
          user: user?.username || 'admin',
          detail: `Deleted user @${username}`,
          target: username,
        });
      }
    } catch (err) { console.error('Delete user error:', err); throw err; }
  }, [registeredUsers, user]);

  return (
    <AuthContext.Provider value={{
      user, loading, registeredUsers,
      login, logout, registerUser, updateUser, deleteUser,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'admin',
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export default AuthContext;
