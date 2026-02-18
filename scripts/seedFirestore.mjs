/**
 * Seed Firestore with initial SHG data
 *
 * Usage:
 *   node scripts/seedFirestore.mjs
 *
 * Prerequisites:
 *   - Firebase project configured with Firestore
 *   - .env.local with VITE_FIREBASE_* variables
 *   - SHG_ADMIN_INITIAL_PASSWORD set in env (or .env.local)
 *
 * This script creates:
 *   1. Admin user in Firebase Auth (admin@shreeannai-4d014.firebaseapp.com)
 *   2. Group info document
 *   3. 14 member documents
 *   4. 2024 year data with sample financial data
 */

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Read .env.local
const envPath = resolve(__dirname, '..', '.env.local');
const envContent = readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...rest] = line.split('=');
  if (key && rest.length) env[key.trim()] = rest.join('=').trim();
});

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

console.log('Firebase config:', { projectId: firebaseConfig.projectId, authDomain: firebaseConfig.authDomain });

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const GROUP_ID = 'default';

// ── Data ──
const GROUP_INFO = {
  nameTA: 'ஸ்ரீ அன்னை மகளிர் சுய உதவி குழு',
  nameEN: 'Shree Annai Magalir Suya Uthavi Kulu',
  type: 'Women Self Help Group (SHG)',
  startDate: '10.01.2019',
  monthlySaving: 500,
  totalMembers: 14,
  interestRate: 0.02,
  isClosed: false,
};

const MEMBERS = [
  { id: 1,  name: 'M. Susila',            nameTA: 'M. சுசிலா' },
  { id: 2,  name: 'R. Anithatamilpriya',   nameTA: 'R. அனிதாதமிழ்பிரியா' },
  { id: 3,  name: 'K. Selvanayaki',        nameTA: 'K. செல்வநாயகி' },
  { id: 4,  name: 'K. Soundari',           nameTA: 'K. செளந்தரி' },
  { id: 5,  name: 'V. Vijaya',             nameTA: 'V. விஜயா' },
  { id: 6,  name: 'K. Pinky',              nameTA: 'K. பிங்கி' },
  { id: 7,  name: 'R. Mallika',            nameTA: 'R. மல்லிகா' },
  { id: 8,  name: 'V. Radhika',            nameTA: 'V. ராதிகா' },
  { id: 9,  name: 'P. Kalyani',            nameTA: 'P. கல்யாணி' },
  { id: 10, name: 'P. Lakshmi',            nameTA: 'P. லட்சுமி' },
  { id: 11, name: 'R. Vijayalakshmi',      nameTA: 'R. விஜயலட்சுமி' },
  { id: 12, name: 'K. Jayalakshmi',        nameTA: 'K. ஜெயலட்சுமி' },
  { id: 13, name: 'B. Tripurasundari',     nameTA: 'B. திரிபுரசுந்தரி' },
  { id: 14, name: 'V. Srinidhi',           nameTA: 'V. ஸ்ரீநிதி' },
];

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const INTEREST_RATE = 0.02;
const STRONG_PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,64}$/;

function getAdminPassword() {
  const password = (process.env.SHG_ADMIN_INITIAL_PASSWORD || env.SHG_ADMIN_INITIAL_PASSWORD || '').trim();
  if (!password) {
    throw new Error('SHG_ADMIN_INITIAL_PASSWORD is required (env or .env.local)');
  }
  if (!STRONG_PASSWORD_REGEX.test(password)) {
    throw new Error('SHG_ADMIN_INITIAL_PASSWORD must be 8-64 chars and include at least one letter and one number');
  }
  const weakDefaults = new Set(['admin', 'admin123', 'password', 'changeme123']);
  if (weakDefaults.has(password.toLowerCase())) {
    throw new Error('SHG_ADMIN_INITIAL_PASSWORD is too weak. Choose a non-default password');
  }
  return password;
}

function recalculateMonth(monthMembers, prevMonthMembers) {
  return monthMembers.map(mem => {
    const prevMem = prevMonthMembers?.find(p => p.memberId === mem.memberId);
    const prevCumulative = prevMem ? prevMem.cumulative : 0;
    const cumulative = prevCumulative + (mem.saving || 0);
    const interest = Math.round((mem.loanTaken || 0) * INTEREST_RATE);
    const loanBalance = (mem.loanTaken || 0) - (mem.loanRepayment || 0);
    return { ...mem, cumulative, interest, loanBalance };
  });
}

function recalculateAllMonths(yearData) {
  const months = [...yearData.months];
  for (let i = 0; i < months.length; i++) {
    const prevMembers = i > 0 ? months[i - 1].members : null;
    const recalced = recalculateMonth(months[i].members, prevMembers);
    const totalSaving = recalced.reduce((s, m) => s + m.saving, 0);
    const totalCumulative = recalced.reduce((s, m) => s + m.cumulative, 0);
    months[i] = { ...months[i], members: recalced, totalSaving, totalCumulative };
  }
  return { ...yearData, months };
}

function buildSampleData() {
  const rawMonths = MONTHS.map((month, i) => {
    const isSavingMonth = i < 6;
    return {
      month, monthIndex: i,
      members: MEMBERS.map(m => {
        const base = { memberId: m.id, saving: isSavingMonth ? 500 : 0, loanTaken: 0, loanRepayment: 0 };
        if (i === 4 && m.id === 12) { base.loanTaken = 10000; base.loanRepayment = 1000; }
        if (i === 5 && m.id === 8) { base.loanTaken = 18000; }
        if (i === 5 && m.id === 13) { base.loanTaken = 7000; }
        return { ...base, cumulative: 0, interest: 0, loanBalance: 0 };
      }),
      totalSaving: 0, totalCumulative: 0,
    };
  });
  return recalculateAllMonths({ year: 2024, months: rawMonths });
}

// ── Seed ──
async function seed() {
  console.log('\n🌱 Seeding Firestore for SHG app...\n');

  // 1. Create admin user in Firebase Auth
  const adminEmail = 'admin@shreeannai-4d014.firebaseapp.com';
  const adminPassword = getAdminPassword();
  let adminUid;

  try {
    const cred = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
    adminUid = cred.user.uid;
    console.log('✅ Admin user created:', adminEmail);
  } catch (err) {
    if (err.code === 'auth/email-already-in-use') {
      console.log('ℹ️  Admin user already exists, signing in...');
      const cred = await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
      adminUid = cred.user.uid;
      console.log('✅ Signed in as admin:', adminUid);
    } else {
      console.error('❌ Error creating admin:', err.message);
      process.exit(1);
    }
  }

  // 2. Store admin profile in Firestore
  await setDoc(doc(db, 'groups', GROUP_ID, 'users', adminUid), {
    username: 'admin',
    fullName: 'Administrator',
    fullNameTA: 'நிர்வாகி',
    role: 'admin',
    status: 'active',
    email: adminEmail,
  });
  console.log('✅ Admin profile stored in Firestore');

  // 3. Group info
  await setDoc(doc(db, 'groups', GROUP_ID), GROUP_INFO);
  console.log('✅ Group info seeded');

  // 4. Members
  for (const member of MEMBERS) {
    await setDoc(doc(db, 'groups', GROUP_ID, 'members', String(member.id)), {
      id: member.id,
      name: member.name,
      nameTA: member.nameTA,
    });
  }
  console.log(`✅ ${MEMBERS.length} members seeded`);

  // 5. Year data (2024)
  const yearData = buildSampleData();
  await setDoc(doc(db, 'groups', GROUP_ID, 'years', '2024'), yearData);
  console.log('✅ 2024 year data seeded');

  console.log('\n🎉 Seeding complete!');
  console.log('\n📋 Login credentials:');
  console.log('   Username: admin');
  console.log('   Password: [value from SHG_ADMIN_INITIAL_PASSWORD]');
  console.log('');

  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
