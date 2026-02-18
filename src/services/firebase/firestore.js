import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  query, orderBy, onSnapshot,
  addDoc, limit as firestoreLimit, where
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config';
import {
  assertNonNegativeAmount,
  assertValidPersonName,
  assertValidUserRole,
  assertValidUserStatus,
  assertValidUsername,
  assertValidYear,
  assertYearDataRecord,
} from '@/lib/validators';

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

const cleanText = (value, fallback = '', max = 300) => {
  const text = typeof value === 'string' ? value.trim() : String(value ?? '').trim();
  if (!text) return fallback;
  return text.slice(0, max);
};

const sanitizeGroupInfoPatch = (data) => {
  if (!data || typeof data !== 'object') throw new Error('Invalid group payload');

  const patch = {};
  if (data.nameTA !== undefined) patch.nameTA = assertValidPersonName(data.nameTA, 'Group name (Tamil)', { optional: true, max: 150 });
  if (data.nameEN !== undefined) patch.nameEN = assertValidPersonName(data.nameEN, 'Group name (English)', { optional: true, max: 150 });
  if (data.type !== undefined) patch.type = assertValidPersonName(data.type, 'Group type', { optional: true, max: 120 });
  if (data.startDate !== undefined) patch.startDate = cleanText(data.startDate, '', 40);
  if (data.monthlySaving !== undefined) patch.monthlySaving = assertNonNegativeAmount(data.monthlySaving, 'Monthly saving');
  if (data.totalMembers !== undefined) {
    const totalMembers = Number(data.totalMembers);
    if (!Number.isInteger(totalMembers) || totalMembers < 0) throw new Error('totalMembers must be a non-negative integer');
    patch.totalMembers = totalMembers;
  }
  if (data.interestRate !== undefined) patch.interestRate = assertNonNegativeAmount(data.interestRate, 'Interest rate', { max: 100 });
  if (data.isClosed !== undefined) {
    if (typeof data.isClosed !== 'boolean') throw new Error('isClosed must be boolean');
    patch.isClosed = data.isClosed;
  }

  if (Object.keys(patch).length === 0) throw new Error('No valid group fields to update');
  return patch;
};

const sanitizeMemberPayload = (memberData, { partial = false } = {}) => {
  if (!memberData || typeof memberData !== 'object') throw new Error('Invalid member payload');
  const payload = {};

  if (!partial || memberData.id !== undefined) {
    const id = Number(memberData.id);
    if (!Number.isInteger(id) || id <= 0) throw new Error('Member id must be a positive integer');
    payload.id = id;
  }
  if (!partial || memberData.name !== undefined) {
    payload.name = assertValidPersonName(memberData.name, 'Member name');
  }
  if (!partial || memberData.nameTA !== undefined) {
    payload.nameTA = assertValidPersonName(memberData.nameTA ?? memberData.name, 'Member name (Tamil)', { optional: true }) || payload.name;
  }

  if (Object.keys(payload).length === 0) throw new Error('No valid member fields to update');
  return payload;
};

const sanitizeUserPayload = (userData, { partial = false } = {}) => {
  if (!userData || typeof userData !== 'object') throw new Error('Invalid user payload');
  if ('password' in userData) throw new Error('Password updates are not allowed in user profile updates');

  const payload = {};

  if (!partial || userData.username !== undefined) {
    payload.username = assertValidUsername(userData.username);
  }
  if (!partial || userData.fullName !== undefined) {
    payload.fullName = assertValidPersonName(userData.fullName, 'Full name');
  }
  if (!partial || userData.fullNameTA !== undefined) {
    payload.fullNameTA = assertValidPersonName(userData.fullNameTA, 'Full name (Tamil)', { optional: true });
  }
  if (!partial || userData.role !== undefined) {
    payload.role = assertValidUserRole(userData.role ?? 'member');
  }
  if (!partial || userData.status !== undefined) {
    payload.status = assertValidUserStatus(userData.status ?? 'active');
  }
  if (userData.email !== undefined) {
    const email = cleanText(userData.email, '', 120).toLowerCase();
    if (email && !email.includes('@')) throw new Error('Invalid email address');
    payload.email = email;
  }

  if (Object.keys(payload).length === 0) throw new Error('No valid user fields to update');
  return payload;
};

const sanitizeActivity = (activity) => {
  if (!activity || typeof activity !== 'object') throw new Error('Invalid activity payload');
  return {
    ...activity,
    type: cleanText(activity.type, 'unknown', 60),
    user: cleanText(activity.user, 'system', 60),
    detail: cleanText(activity.detail, '', 400),
    timestamp: new Date().toISOString(),
  };
};

// ── Group Info ──
export const getGroupInfo = async () => {
  if (!isFirebaseConfigured) return null;
  const snap = await getDoc(doc(db, 'groups', GROUP_ID));
  return snap.exists() ? snap.data() : null;
};

export const updateGroupInfo = async (data, username) => {
  if (!isFirebaseConfigured) return;
  const patch = sanitizeGroupInfoPatch(data);
  await setDoc(doc(db, 'groups', GROUP_ID), { ...patch, ...auditUpdate(username) }, { merge: true });
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
  const payload = sanitizeMemberPayload(memberData);
  const ref = doc(collection(db, 'groups', GROUP_ID, 'members'));
  await setDoc(ref, { ...payload, ...auditCreate(username) });
  return ref.id;
};

export const updateMember = async (memberId, data, username) => {
  if (!isFirebaseConfigured) return;
  const safeMemberId = Number(memberId);
  if (!Number.isInteger(safeMemberId) || safeMemberId <= 0) throw new Error('Invalid member id');
  const payload = sanitizeMemberPayload(data, { partial: true });
  // Query by numeric id field since Firestore doc IDs are auto-generated
  const q = query(collection(db, 'groups', GROUP_ID, 'members'), where('id', '==', safeMemberId));
  const snap = await getDocs(q);
  if (!snap.empty) {
    await updateDoc(snap.docs[0].ref, { ...payload, ...auditUpdate(username) });
  } else {
    throw new Error(`Member ${safeMemberId} not found`);
  }
};

export const deleteMember = async (memberId) => {
  if (!isFirebaseConfigured) return;
  const safeMemberId = Number(memberId);
  if (!Number.isInteger(safeMemberId) || safeMemberId <= 0) throw new Error('Invalid member id');
  // Query by numeric id field since Firestore doc IDs are auto-generated
  const q = query(collection(db, 'groups', GROUP_ID, 'members'), where('id', '==', safeMemberId));
  const snap = await getDocs(q);
  if (!snap.empty) {
    await deleteDoc(snap.docs[0].ref);
  } else {
    throw new Error(`Member ${safeMemberId} not found`);
  }
};

// ── Year Data ──
export const getYearData = async (year) => {
  if (!isFirebaseConfigured) return null;
  const safeYear = assertValidYear(year);
  const snap = await getDoc(doc(db, 'groups', GROUP_ID, 'years', String(safeYear)));
  return snap.exists() ? snap.data() : null;
};

export const saveYearData = async (year, data, username) => {
  if (!isFirebaseConfigured) return;
  const safeYear = assertValidYear(year);
  const validatedData = assertYearDataRecord(safeYear, data);
  await setDoc(doc(db, 'groups', GROUP_ID, 'years', String(safeYear)), { ...validatedData, ...auditUpdate(username) });
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
  const safeUid = cleanText(uid, '', 128);
  if (!safeUid) throw new Error('Invalid uid');
  const payload = sanitizeUserPayload({ ...userData, status: userData?.status ?? 'active' });
  await setDoc(doc(db, 'groups', GROUP_ID, 'users', safeUid), { ...payload, ...auditCreate(username) });
};

export const updateUser = async (uid, data, username) => {
  if (!isFirebaseConfigured) return;
  const safeUid = cleanText(uid, '', 128);
  if (!safeUid) throw new Error('Invalid uid');
  const payload = sanitizeUserPayload(data, { partial: true });
  await updateDoc(doc(db, 'groups', GROUP_ID, 'users', safeUid), { ...payload, ...auditUpdate(username) });
};

export const updateUserStatus = async (uid, status, username) => {
  if (!isFirebaseConfigured) return;
  const safeUid = cleanText(uid, '', 128);
  if (!safeUid) throw new Error('Invalid uid');
  const safeStatus = assertValidUserStatus(status);
  await updateDoc(doc(db, 'groups', GROUP_ID, 'users', safeUid), { status: safeStatus, ...auditUpdate(username) });
};

export const getUserProfile = async (uid) => {
  if (!isFirebaseConfigured) return null;
  const safeUid = cleanText(uid, '', 128);
  if (!safeUid) return null;
  const snap = await getDoc(doc(db, 'groups', GROUP_ID, 'users', safeUid));
  if (!snap.exists()) return null;
  return { uid: snap.id, ...snap.data() };
};

export const deleteUser = async (uid) => {
  if (!isFirebaseConfigured) return;
  const safeUid = cleanText(uid, '', 128);
  if (!safeUid) throw new Error('Invalid uid');
  await deleteDoc(doc(db, 'groups', GROUP_ID, 'users', safeUid));
};

// ── Real-time listeners ──
export const onYearDataChange = (year, callback) => {
  if (!isFirebaseConfigured) return () => {};
  const safeYear = assertValidYear(year);
  return onSnapshot(doc(db, 'groups', GROUP_ID, 'years', String(safeYear)), (snap) => {
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
    await addDoc(collection(db, 'groups', GROUP_ID, 'activityLog'), sanitizeActivity(activity));
  } catch (err) {
    console.error('Error logging activity:', err);
  }
};

export const getRecentActivity = async (count = 20) => {
  if (!isFirebaseConfigured) return [];
  const safeCount = Math.max(1, Math.min(100, Number(count) || 20));
  const snap = await getDocs(
    query(collection(db, 'groups', GROUP_ID, 'activityLog'), orderBy('timestamp', 'desc'), firestoreLimit(safeCount))
  );
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const onActivityChange = (count, callback) => {
  if (!isFirebaseConfigured) return () => {};
  const safeCount = Math.max(1, Math.min(100, Number(count) || 20));
  return onSnapshot(
    query(collection(db, 'groups', GROUP_ID, 'activityLog'), orderBy('timestamp', 'desc'), firestoreLimit(safeCount)),
    (snap) => { callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))); }
  );
};
