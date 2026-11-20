// ── Who is signed in, and where their data lives ─────────────────────────────
// Sign-in: Google (GIS popup, basic profile only) → Firebase Auth. Firebase
// keeps the session on the device and refreshes it itself, so there is no
// token to store or renew here.
//
// Data lives under sheets/{sheetId}/**. The id is historical (it used to be the
// Google Sheet's id); existing accounts keep theirs, new accounts use their uid.

import { collection, doc, getDoc, getDocs, limit, query, setDoc, where } from 'firebase/firestore'
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth'
import { auth, db } from '../firebase'

const SHEET_KEY = 'budgetiq_sheetId'
let _sheetId = globalThis.localStorage?.getItem(SHEET_KEY) || null
export const getSheetId = () => _sheetId
function setSheetId(id) {
  _sheetId = id || null
  try { id ? localStorage.setItem(SHEET_KEY, id) : localStorage.removeItem(SHEET_KEY) } catch { /* private mode */ }
}

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
export const getSavedUserName = () => localStorage.getItem('budgetiq_userName') || null

const GSI_SCRIPT = 'https://accounts.google.com/gsi/client'
function loadGsi() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) { resolve(); return }
    const s = document.createElement('script')
    s.src = GSI_SCRIPT
    s.onload = resolve
    s.onerror = () => reject(new Error('Could not load Google sign-in'))
    document.head.appendChild(s)
  })
}

// Google popup → Firebase session. Returns the Firebase user.
export async function signInWithGoogle() {
  await loadGsi()
  const accessToken = await new Promise((resolve, reject) => {
    window.google.accounts.oauth2.initTokenClient({
      client_id: import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID,
      scope: 'openid email profile',
      callback: r => (r.error ? reject(new Error(r.error)) : resolve(r.access_token)),
      error_callback: e => reject(new Error(e?.message || e?.type || 'Sign-in cancelled')),
    }).requestAccessToken()
  })
  const { user } = await signInWithCredential(auth, GoogleAuthProvider.credential(null, accessToken))
  return user
}

// Remember the profile for the PIN screen, which shows before Firebase is ready.
export function saveProfile(user) {
  const fullName = user.displayName || user.email || 'User'
  const name = fullName.split(' ')[0]
  try {
    localStorage.setItem('budgetiq_userName', name)
    localStorage.setItem('budgetiq_userFullName', fullName)
    localStorage.setItem('budgetiq_userPicture', user.photoURL || '')
  } catch { /* fine */ }
  return { name, fullName, picture: user.photoURL || '' }
}

// Find (or create) this user's data root and make sure they own it. Must run
// before any other Firestore access: every rule checks sheets/{id}.ownerUid.
export async function resolveSheetId(userId) {
  const cached = getSheetId()
  if (cached) {
    try {
      const snap = await getDoc(doc(db, 'sheets', cached))
      if (snap.exists() && snap.data().ownerUid === userId) return cached
    } catch {
      return cached   // offline: trust this device's last answer
    }
  }
  const found = await getDocs(query(collection(db, 'sheets'), where('ownerUid', '==', userId), limit(1)))
  const sid = found.empty ? userId : found.docs[0].id
  if (found.empty) await setDoc(doc(db, 'sheets', sid), { ownerUid: userId, createdAt: new Date().toISOString() })
  setSheetId(sid)
  return sid
}

// Forget this account on the device. Firebase sign-out is separate (firebase.js).
export function clearSession() {
  setSheetId(null)
  for (const k of ['budgetiq_userName', 'budgetiq_userFullName', 'budgetiq_userPicture', 'budgetiq_userEmail',
    'budgetiq_has_pin', 'budgetiq_token', 'budgetiq_exp', 'budgetiq_session_exp']) {
    try { localStorage.removeItem(k) } catch { /* fine */ }
  }
  sessionStorage.removeItem('budgetiq_pin_verified')
}

export const DEFAULT_CATEGORIES = [
  { id: 'cat_rental',      name: 'RENTAL HOME',                  type: 'expense', color: '#2A9D8F' },
  { id: 'cat_home',        name: 'OWNED HOME',                   type: 'expense', color: '#264653' },
  { id: 'cat_entertain',   name: 'ENTERTAINMENT',                type: 'expense', color: '#E76F51' },
  { id: 'cat_invest',      name: 'INVESTMENTS & SAVINGS',        type: 'savings', color: '#8338EC' },
  { id: 'cat_vacations',   name: 'VACATIONS',                    type: 'expense', color: '#3A86FF' },
  { id: 'cat_electronics', name: 'ELECTRONICS & HOME GOODS',     type: 'expense', color: '#457B9D' },
  { id: 'cat_personal',    name: 'PERSONAL & LIFESTYLE',         type: 'expense', color: '#FB8500' },
  { id: 'cat_health',      name: 'HEALTH',                       type: 'expense', color: '#D62828' },
  { id: 'cat_loans',       name: 'LOANS',                        type: 'expense', color: '#6A4C93' },
  { id: 'cat_return',      name: 'RETURN MONEY',                 type: 'expense', color: '#06D6A0' },
  { id: 'cat_recharge',    name: 'RECHARGE & SUBSCRIPTION',      type: 'expense', color: '#F72585' },
  { id: 'cat_services',    name: 'SERVICES (PLANNING,BUILDING,ETC)', type: 'expense', color: '#7209B7' },
  { id: 'cat_travel',      name: 'TRAVELLING',                   type: 'expense', color: '#4361EE' },
  { id: 'cat_misc',        name: 'MISCELLANEOUS',                type: 'expense', color: '#FF6B6B' },
]
