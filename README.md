# SHG Report App

Single-page React app for SHG (Self Help Group) savings/loan tracking with Firebase Auth + Firestore.

## Prerequisites

- Node.js 20+
- npm 10+
- Firebase project with Firestore + Email/Password auth enabled
- Firebase CLI (for rules deploy): `npm i -g firebase-tools`

## Environment

Create `.env.local` from `.env.example` and fill all `VITE_FIREBASE_*` values.

### Production behavior

- Firebase config is mandatory.
- App login is blocked if Firebase env variables are missing.

### Development behavior

- If Firebase env is missing, app uses a local fallback auth mode.
- Fallback mode is for local development only.

## Commands

- `npm run dev` - start dev server
- `npm run build` - production build
- `npm run lint` - eslint checks
- `npm run preview` - preview build locally
- `npm run deploy:rules` - deploy Firestore rules from `firestore.rules`

## Firestore Security Rules

- Rules are in `firestore.rules`.
- Firebase config file is `firebase.json`.
- Deploy rules:

```bash
npm run deploy:rules
```
