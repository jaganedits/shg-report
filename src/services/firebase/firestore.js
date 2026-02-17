import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  query, orderBy, onSnapshot, arrayUnion, arrayRemove, writeBatch,
  addDoc, limit as firestoreLimit, where
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config';

const GROUP_ID = 'default';

// ── Audit helpers ──
const auditCreate = (username) => ({
  createdBy: username || 'system',
  createdOn: new Date().toISOString(),
  modifiedBy: username || 'system',
  modifiedOn: new Date().toISOString(),
});

const auditUpdate = (username) => ({
  modifiedBy: username || 'system',
  modifiedOn: new Date().toISOString(),
});

// ── Group Info ──
export const getGroupInfo = async () => {
  if (!isFirebaseConfigured) return null;
  const snap = await getDoc(doc(db, 'groups', GROUP_ID));
  return snap.exists() ? snap.data() : null;
};

export const updateGroupInfo = async (data, username) => {
  if (!isFirebaseConfigured) return;
  await setDoc(doc(db, 'groups', GROUP_ID), { ...data, ...auditUpdate(username) }, { merge: true });
};

// ── Members ──
export const getMembers = async () => {
  if (!isFirebaseConfigured) return [];
  const snap = await getDocs(collection(db, 'groups', GROUP_ID, 'members'));
  return snap.docs.map(d => {
    const data = d.data();
    // Ensure numeric id from document data takes precedence over Firestore doc ID
    return { firestoreId: d.id, ...data, id: typeof data.id === 'number' ? data.id : d.id };
  });
};

export const addMember = async (memberData, username) => {
  if (!isFirebaseConfigured) return;
  const ref = doc(collection(db, 'groups', GROUP_ID, 'members'));
  await setDoc(ref, { ...memberData, ...auditCreate(username) });
  return ref.id;
};

export const updateMember = async (memberId, data, username) => {
  if (!isFirebaseConfigured) return;
  // Query by numeric id field since Firestore doc IDs are auto-generated
  const q = query(collection(db, 'groups', GROUP_ID, 'members'), where('id', '==', memberId));
  const snap = await getDocs(q);
  if (!snap.empty) {
    await updateDoc(snap.docs[0].ref, { ...data, ...auditUpdate(username) });
  }
};

export const deleteMember = async (memberId) => {
  if (!isFirebaseConfigured) return;
  // Query by numeric id field since Firestore doc IDs are auto-generated
  const q = query(collection(db, 'groups', GROUP_ID, 'members'), where('id', '==', memberId));
  const snap = await getDocs(q);
  if (!snap.empty) {
    await deleteDoc(snap.docs[0].ref);
  }
};

// ── Year Data ──
export const getYearData = async (year) => {
  if (!isFirebaseConfigured) return null;
  const snap = await getDoc(doc(db, 'groups', GROUP_ID, 'years', String(year)));
  return snap.exists() ? snap.data() : null;
};

export const saveYearData = async (year, data, username) => {
  if (!isFirebaseConfigured) return;
  await setDoc(doc(db, 'groups', GROUP_ID, 'years', String(year)), { ...data, ...auditUpdate(username) });
};

export const getAvailableYears = async () => {
  if (!isFirebaseConfigured) return [];
  const snap = await getDocs(collection(db, 'groups', GROUP_ID, 'years'));
  return snap.docs.map(d => Number(d.id)).sort();
};

// ── Users ──
export const getUsers = async () => {
  if (!isFirebaseConfigured) return [];
  const snap = await getDocs(collection(db, 'groups', GROUP_ID, 'users'));
  return snap.docs.map(d => ({ uid: d.id, ...d.data() }));
};

export const createUser = async (uid, userData, username) => {
  if (!isFirebaseConfigured) return;
  await setDoc(doc(db, 'groups', GROUP_ID, 'users', uid), { ...userData, ...auditCreate(username) });
};

export const updateUser = async (uid, data, username) => {
  if (!isFirebaseConfigured) return;
  await updateDoc(doc(db, 'groups', GROUP_ID, 'users', uid), { ...data, ...auditUpdate(username) });
};

export const deleteUser = async (uid) => {
  if (!isFirebaseConfigured) return;
  await deleteDoc(doc(db, 'groups', GROUP_ID, 'users', uid));
};

// ── Real-time listeners ──
export const onYearDataChange = (year, callback) => {
  if (!isFirebaseConfigured) return () => {};
  return onSnapshot(doc(db, 'groups', GROUP_ID, 'years', String(year)), (snap) => {
    callback(snap.exists() ? snap.data() : null);
  });
};

export const onMembersChange = (callback) => {
  if (!isFirebaseConfigured) return () => {};
  return onSnapshot(collection(db, 'groups', GROUP_ID, 'members'), (snap) => {
    callback(snap.docs.map(d => {
      const data = d.data();
      return { firestoreId: d.id, ...data, id: typeof data.id === 'number' ? data.id : d.id };
    }));
  });
};

// ── Activity Log ──
// Types: login, logout, data_entry, member_add, member_edit, member_remove,
//        user_create, user_update, user_delete, year_add, group_close, group_reopen
export const logActivity = async (activity) => {
  if (!isFirebaseConfigured) return;
  try {
    await addDoc(collection(db, 'groups', GROUP_ID, 'activityLog'), {
      ...activity,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Error logging activity:', err);
  }
};

export const getRecentActivity = async (count = 20) => {
  if (!isFirebaseConfigured) return [];
  const snap = await getDocs(
    query(collection(db, 'groups', GROUP_ID, 'activityLog'), orderBy('timestamp', 'desc'), firestoreLimit(count))
  );
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const onActivityChange = (count, callback) => {
  if (!isFirebaseConfigured) return () => {};
  return onSnapshot(
    query(collection(db, 'groups', GROUP_ID, 'activityLog'), orderBy('timestamp', 'desc'), firestoreLimit(count)),
    (snap) => { callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))); }
  );
};
