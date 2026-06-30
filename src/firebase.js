import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import {
  getAuth, GoogleAuthProvider,
  signInWithCredential, signOut as fbSignOut
} from 'firebase/auth'

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)

// ── Firebase Auth bridge ─────────────────────────────────────────────────────
// We sign in to Google via GIS (for Sheets/Drive) and get an OAuth access token.
// To let Firestore security rules enforce per-user ownership we ALSO need a
// Firebase identity — so we exchange that same access token for a Firebase Auth
// session here. No second popup. Idempotent: a no-op once a user is signed in.
export async function bridgeFirebaseAuth(accessToken) {
  if (!accessToken) return auth.currentUser
  try {
    // Wait for any persisted session to restore before deciding to sign in.
    if (auth.authStateReady) await auth.authStateReady()
    if (auth.currentUser) return auth.currentUser
    const cred = GoogleAuthProvider.credential(null, accessToken)
    const res  = await signInWithCredential(auth, cred)
    return res.user
  } catch (e) {
    // Don't hard-fail the app if the bridge breaks — log it. With rules
    // deployed, Firestore writes will fail until this succeeds.
    console.error('[BudgetIQ] Firebase auth bridge failed:', e?.code, e?.message)
    return null
  }
}

export async function firebaseSignOut() {
  try { await fbSignOut(auth) } catch (e) { console.warn('[BudgetIQ] Firebase sign-out:', e?.message) }
}

export function getFirebaseUid() {
  return auth.currentUser?.uid || null
}
