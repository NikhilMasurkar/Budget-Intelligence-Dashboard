import { initializeApp } from 'firebase/app'
import {
  getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
  terminate, clearIndexedDbPersistence,
} from 'firebase/firestore'
import { getAuth, signOut as fbSignOut } from 'firebase/auth'

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
// Keep a copy of the data on the device (IndexedDB): reads work offline and
// writes made offline are saved and sent when the connection is back.
// Falls back to memory-only where IndexedDB isn't available (some private modes).
function makeDb() {
  try {
    return initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) })
  } catch (e) {
    console.warn('[BudgetIQ] Offline cache unavailable:', e?.message)
    return getFirestore(app)
  }
}
export const db = makeDb()

// Remove this account's data from the device (sign-out). The page must reload
// afterwards — a terminated Firestore instance can't be used again.
export async function wipeLocalCache() {
  try { await terminate(db); await clearIndexedDbPersistence(db) } catch (e) { console.warn('[BudgetIQ] Cache wipe:', e?.message) }
}
export const auth = getAuth(app)

export async function firebaseSignOut() {
  try { await fbSignOut(auth) } catch (e) { console.warn('[BudgetIQ] Firebase sign-out:', e?.message) }
}

export function getFirebaseUid() {
  return auth.currentUser?.uid || null
}
