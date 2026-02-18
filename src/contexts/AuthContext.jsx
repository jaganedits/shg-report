import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  allowLocalAuthFallback,
  firebaseConfigError,
  isFirebaseConfigured,
} from '@/services/firebase/config';
import * as firebaseAuth from '@/services/firebase/auth';
import * as firestore from '@/services/firebase/firestore';
import {
  assertStrongPassword,
  assertValidPersonName,
  assertValidUserRole,
  assertValidUserStatus,
  assertValidUsername,
  isPermissionDeniedError,
  normalizeUsername,
} from '@/lib/validators';

const AuthContext = createContext(null);

const toEmail = (username) => `${normalizeUsername(username)}@shreeannai-4d014.firebaseapp.com`;

const DEV_LOCAL_USERS = [
  {
    uid: 'local-admin',
    username: 'admin',
    password: 'admin123',
    fullName: 'Administrator',
    fullNameTA: '\u0BA8\u0BBF\u0BB0\u0BCD\u0BB5\u0BBE\u0B95\u0BBF',
    role: 'admin',
    status: 'active',
  },
];

const toPublicUser = (value) => ({
  uid: value.uid || value.username,
  username: value.username,
  fullName: value.fullName || '',
  fullNameTA: value.fullNameTA || '',
  role: value.role || 'member',
  status: value.status || 'active',
  email: value.email || '',
});

const mapStoredUsers = (users) => users.map((u) => toPublicUser({
  uid: u.uid || u.username,
  username: u.username || u.uid,
  fullName: u.fullName || '',
  fullNameTA: u.fullNameTA || '',
  role: u.role || 'member',
  status: u.status || 'active',
  email: u.email || '',
}));

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [localUsers, setLocalUsers] = useState(() => DEV_LOCAL_USERS);
  const [registeredUsers, setRegisteredUsers] = useState(() => mapStoredUsers(DEV_LOCAL_USERS));
  const [loading, setLoading] = useState(isFirebaseConfigured);

  const refreshRegisteredUsers = useCallback(async () => {
    if (!isFirebaseConfigured) {
      const mapped = mapStoredUsers(localUsers);
      setRegisteredUsers(mapped);
      return mapped;
    }
    const users = await firestore.getUsers();
    const mapped = mapStoredUsers(users);
    setRegisteredUsers(mapped);
    return mapped;
  }, [localUsers]);

  useEffect(() => {
    if (!isFirebaseConfigured) return undefined;

    const unsubscribe = firebaseAuth.onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const users = await refreshRegisteredUsers();
          const profile = users.find(u => u.uid === firebaseUser.uid);
          if (!profile) {
            await firebaseAuth.signOut();
            setUser(null);
            setLoading(false);
            return;
          }
          if (profile?.status === 'disabled') {
            await firebaseAuth.signOut();
            setUser(null);
            setLoading(false);
            return;
          }
          const username = firebaseUser.email.split('@')[0];
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            username: profile?.username || username,
            fullName: profile?.fullName || firebaseUser.displayName || username,
            fullNameTA: profile?.fullNameTA || '',
            role: profile?.role || 'member',
            status: profile?.status || 'active',
          });
        } catch (err) {
          console.error('Error loading user profile:', err);
          try {
            await firebaseAuth.signOut();
          } catch (signOutErr) {
            console.error('Sign out after profile load failure failed:', signOutErr);
          }
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [refreshRegisteredUsers]);

  const login = useCallback(async (rawUsername, password) => {
    const username = normalizeUsername(rawUsername);
    if (!username || !String(password || '').trim()) {
      return { error: 'Invalid credentials' };
    }

    if (!isFirebaseConfigured) {
      if (!allowLocalAuthFallback) {
        return { error: firebaseConfigError || 'Authentication is unavailable' };
      }
      const found = localUsers.find(u => normalizeUsername(u.username) === username);
      if (!found || found.status !== 'active' || found.password !== password) {
        return { error: 'Invalid credentials' };
      }
      const userData = {
        uid: found.uid,
        username: found.username,
        fullName: found.fullName,
        fullNameTA: found.fullNameTA || '',
        role: found.role || 'member',
        status: found.status || 'active',
      };
      setUser(userData);
      return { user: userData, success: true };
    }

    try {
      const email = toEmail(username);
      await firebaseAuth.signIn(email, password);
      void firestore.logActivity({
        type: 'login',
        user: username,
        detail: `${username} logged in`,
      });
      return { success: true };
    } catch (err) {
      console.error('Login error:', err);
      return { error: err.message || 'Login failed' };
    }
  }, [localUsers]);

  const logout = useCallback(async () => {
    const logoutUser = user?.username || 'unknown';
    if (isFirebaseConfigured) {
      try {
        await firestore.logActivity({
          type: 'logout',
          user: logoutUser,
          detail: `${logoutUser} logged out`,
        });
      } catch (err) {
        console.error('Activity log error:', err);
      }
      try { await firebaseAuth.signOut(); } catch (err) { console.error('Logout error:', err); }
    }
    setUser(null);
  }, [user]);

  const registerUser = useCallback(async (newUser) => {
    const username = assertValidUsername(newUser.username);
    const fullName = assertValidPersonName(newUser.fullName, 'Full name');
    const fullNameTA = assertValidPersonName(newUser.fullNameTA, 'Full name (Tamil)', { optional: true });
    const role = assertValidUserRole(newUser.role || 'member');
    const password = assertStrongPassword(newUser.password);

    if (!isFirebaseConfigured) {
      if (!allowLocalAuthFallback) throw new Error(firebaseConfigError || 'Authentication is unavailable');
      if (localUsers.some(u => normalizeUsername(u.username) === username)) throw new Error('Username already exists');
      const created = {
        uid: `local-${Date.now()}`,
        username,
        password,
        fullName,
        fullNameTA,
        role,
        status: 'active',
      };
      setLocalUsers(prev => [...prev, created]);
      setRegisteredUsers(prev => [...prev, toPublicUser(created)]);
      return;
    }

    try {
      const email = toEmail(username);
      const cred = await firebaseAuth.signUp(email, password, fullName);
      await firestore.createUser(cred.user.uid, {
        username,
        fullName,
        fullNameTA,
        role,
        status: 'active',
        email,
      }, user?.username || 'admin');
      await refreshRegisteredUsers();
      void firestore.logActivity({
        type: 'user_create',
        user: user?.username || 'admin',
        detail: `Created user "${fullName}" (@${username})`,
        target: username,
      });
    } catch (err) {
      console.error('Register error:', err);
      if (isPermissionDeniedError(err)) throw new Error('You do not have permission to create users');
      throw err;
    }
  }, [localUsers, refreshRegisteredUsers, user]);

  const updateUser = useCallback(async (rawUsername, updates) => {
    const username = assertValidUsername(rawUsername);
    if ('password' in (updates || {})) {
      throw new Error('Use the dedicated password change flow');
    }

    const safeUpdates = {};
    if (updates.fullName !== undefined) safeUpdates.fullName = assertValidPersonName(updates.fullName, 'Full name');
    if (updates.fullNameTA !== undefined) safeUpdates.fullNameTA = assertValidPersonName(updates.fullNameTA, 'Full name (Tamil)', { optional: true });
    if (updates.role !== undefined) safeUpdates.role = assertValidUserRole(updates.role);
    if (updates.status !== undefined) safeUpdates.status = assertValidUserStatus(updates.status);
    if (Object.keys(safeUpdates).length === 0) return;

    if (!isFirebaseConfigured) {
      if (!allowLocalAuthFallback) throw new Error(firebaseConfigError || 'Authentication is unavailable');
      setLocalUsers(prev => prev.map(u => (normalizeUsername(u.username) === username ? { ...u, ...safeUpdates } : u)));
      setRegisteredUsers(prev => prev.map(u => (normalizeUsername(u.username) === username ? { ...u, ...safeUpdates } : u)));
      if (normalizeUsername(user?.username) === username) {
        setUser(prev => ({ ...prev, ...safeUpdates }));
      }
      return;
    }

    try {
      const target = registeredUsers.find(u => normalizeUsername(u.username) === username);
      if (target?.uid) {
        await firestore.updateUser(target.uid, safeUpdates, user?.username || 'admin');
        await refreshRegisteredUsers();
        if (user?.uid === target.uid) {
          setUser(prev => ({ ...prev, ...safeUpdates }));
        }
        void firestore.logActivity({
          type: 'user_update',
          user: user?.username || 'admin',
          detail: `Updated user @${username}`,
          target: username,
        });
      } else {
        throw new Error(`User "${username}" not found`);
      }
    } catch (err) {
      console.error('Update user error:', err);
      if (isPermissionDeniedError(err)) throw new Error('You do not have permission to update users');
      throw err;
    }
  }, [registeredUsers, refreshRegisteredUsers, user]);

  const setUserStatus = useCallback(async (rawUsername, status) => {
    const username = assertValidUsername(rawUsername);
    const nextStatus = assertValidUserStatus(status);

    if (normalizeUsername(user?.username) === username && nextStatus === 'disabled') {
      throw new Error('Cannot deactivate your own account');
    }

    if (!isFirebaseConfigured) {
      if (!allowLocalAuthFallback) throw new Error(firebaseConfigError || 'Authentication is unavailable');
      setLocalUsers(prev => prev.map(u => (normalizeUsername(u.username) === username ? { ...u, status: nextStatus } : u)));
      setRegisteredUsers(prev => prev.map(u => (normalizeUsername(u.username) === username ? { ...u, status: nextStatus } : u)));
      return;
    }

    try {
      const target = registeredUsers.find(u => normalizeUsername(u.username) === username);
      if (target?.uid) {
        await firestore.updateUserStatus(target.uid, nextStatus, user?.username || 'admin');
        await refreshRegisteredUsers();
        void firestore.logActivity({
          type: nextStatus === 'disabled' ? 'user_deactivate' : 'user_reactivate',
          user: user?.username || 'admin',
          detail: `${nextStatus === 'disabled' ? 'Deactivated' : 'Reactivated'} user @${username}`,
          target: username,
        });
        if (user?.uid === target.uid && nextStatus === 'disabled') {
          await logout();
        }
      } else {
        throw new Error(`User "${username}" not found`);
      }
    } catch (err) {
      console.error('Update user status error:', err);
      if (isPermissionDeniedError(err)) throw new Error('You do not have permission to update user status');
      throw err;
    }
  }, [logout, refreshRegisteredUsers, registeredUsers, user]);

  const deactivateUser = useCallback((username) => setUserStatus(username, 'disabled'), [setUserStatus]);
  const reactivateUser = useCallback((username) => setUserStatus(username, 'active'), [setUserStatus]);

  const changeMyPassword = useCallback(async (currentPassword, newPassword) => {
    if (!user?.username) throw new Error('You must be logged in');
    const current = String(currentPassword || '');
    if (!current.trim()) throw new Error('Current password is required');
    const safeNewPassword = assertStrongPassword(newPassword);
    if (current === safeNewPassword) throw new Error('New password must be different from current password');

    if (!isFirebaseConfigured) {
      if (!allowLocalAuthFallback) throw new Error(firebaseConfigError || 'Authentication is unavailable');
      let changed = false;
      setLocalUsers(prev => prev.map((u) => {
        if (normalizeUsername(u.username) !== normalizeUsername(user.username)) return u;
        if (u.password !== current) return u;
        changed = true;
        return { ...u, password: safeNewPassword };
      }));
      if (!changed) throw new Error('Current password is incorrect');
      return;
    }

    try {
      await firebaseAuth.changeCurrentUserPassword(current, safeNewPassword);
      void firestore.logActivity({
        type: 'password_change',
        user: user.username,
        detail: `${user.username} changed password`,
      });
    } catch (err) {
      console.error('Change password error:', err);
      if (String(err?.code || '').includes('wrong-password')) throw new Error('Current password is incorrect');
      throw err;
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{
      user, loading, registeredUsers,
      login, logout, registerUser, updateUser,
      deactivateUser, reactivateUser, setUserStatus,
      deleteUser: deactivateUser,
      changeMyPassword,
      isAuthenticated: !!user && user?.status !== 'disabled',
      isAdmin: user?.role === 'admin' && user?.status !== 'disabled',
      canUseLocalAuthFallback: !isFirebaseConfigured && allowLocalAuthFallback,
      configurationError: firebaseConfigError,
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
