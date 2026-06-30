import { db, getFirebaseUid } from '../firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'

// ── Ownership ────────────────────────────────────────────────────────────────
// Security rules gate every sheets/{sheetId}/** doc on the ownerUid stored in
// the parent sheets/{sheetId} doc. This stamps it on first sign-in so the rules
// can verify the caller. Must run (once) BEFORE any other Firestore read for the
// sheet, otherwise the owner check has nothing to read. Safe to call repeatedly.
export async function ensureSheetOwnerFS(sheetId) {
  const uid = getFirebaseUid()
  if (!sheetId || !uid) return
  try {
    const ref  = doc(db, 'sheets', sheetId)
    const snap = await getDoc(ref)
    if (!snap.exists()) {
      await setDoc(ref, { ownerUid: uid, createdAt: new Date().toISOString() })
    } else if (!snap.data().ownerUid) {
      // Legacy sheet created before ownership existed — claim it for this user.
      await setDoc(ref, { ownerUid: uid }, { merge: true })
    }
  } catch (e) {
    console.warn('[BudgetIQ] ensureSheetOwner failed:', e?.code, e?.message)
  }
}

const securityRef = (sheetId) =>
  doc(db, 'sheets', sheetId, 'settings', 'security')

export async function getPinFS(sheetId) {
  try {
    const snap = await getDoc(securityRef(sheetId))
    return snap.exists() ? (snap.data().pin ?? null) : null
  } catch {
    return null
  }
}

// Only works the first time — once a PIN is set it cannot be changed from the app.
// To recover: open Firebase console → sheets/{sheetId}/settings/security → pin field.
export async function setPinFS(sheetId, pin) {
  const existing = await getPinFS(sheetId)
  if (existing !== null) throw new Error('PIN already set')
  await setDoc(securityRef(sheetId), {
    pin,
    createdAt: new Date().toISOString()
  })
}

// ─── Sheet format/sync metadata ──────────────────────────────────────────────
// Tracks which export FORMAT version the Drive Excel was last generated with,
// so the app can auto-regenerate it after a format/calc change (see
// SHEET_FORMAT_VERSION). Returns null on any error so callers can no-op safely.
const syncRef = (sheetId) => doc(db, 'sheets', sheetId, 'settings', 'sync')

export async function getSheetSyncMetaFS(sheetId) {
  try {
    const snap = await getDoc(syncRef(sheetId))
    return snap.exists() ? snap.data() : null
  } catch {
    return null
  }
}

export async function setSheetFormatVersionFS(sheetId, version) {
  await setDoc(syncRef(sheetId), {
    formatVersion: version,
    updatedAt: new Date().toISOString()
  }, { merge: true })
}
