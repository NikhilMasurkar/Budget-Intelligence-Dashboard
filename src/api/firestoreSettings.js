import { db, getFirebaseUid } from '../firebase'
import { doc, getDoc, setDoc, deleteDoc, deleteField } from 'firebase/firestore'

// SHA-256 the PIN digits so raw numbers are never stored in Firestore.
// Web Crypto is available in all modern browsers and Node 18+.
export async function hashPin(pin) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pin))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

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

// Returns true when a PIN (hashed or legacy plaintext) is configured.
export async function hasPinFS(sheetId) {
  try {
    const snap = await getDoc(securityRef(sheetId))
    if (!snap.exists()) return false
    const d = snap.data()
    return 'pinHash' in d || ('pin' in d && d.pin != null)
  } catch {
    return false
  }
}

// Verify a PIN and silently migrate plaintext → hash on first correct entry.
// Returns true/false. Never throws — on any Firestore error returns false.
export async function verifyPinFS(sheetId, enteredPin) {
  try {
    const snap = await getDoc(securityRef(sheetId))
    if (!snap.exists()) return false
    const d = snap.data()

    if (d.pinHash) {
      return (await hashPin(enteredPin)) === d.pinHash
    }

    if (d.pin) {
      if (enteredPin !== d.pin) return false
      // Correct — one-time migration: store hash, remove plaintext.
      try {
        await setDoc(securityRef(sheetId), {
          pinHash: await hashPin(enteredPin),
          pin: deleteField(),
        }, { merge: true })
      } catch (e) {
        console.warn('[BudgetIQ] PIN migration failed (will retry next login):', e.message)
      }
      return true
    }

    return false
  } catch {
    return false
  }
}

// Store a hashed PIN. Only works once — once set it cannot be changed from the app.
// To reset: open Firebase console → sheets/{sheetId}/settings/security → delete the doc.
export async function setPinFS(sheetId, pin) {
  const exists = await hasPinFS(sheetId)
  if (exists) throw new Error('PIN already set')
  await setDoc(securityRef(sheetId), {
    pinHash: await hashPin(pin),
    createdAt: new Date().toISOString(),
  })
}

// ─── PIN reset (OTP flow) ────────────────────────────────────────────────────
const pinResetRef = (sheetId) =>
  doc(db, 'sheets', sheetId, 'settings', 'pinReset')

// Store the server-generated OTP hash + expiry during a "Forgot PIN" flow.
// Covered by the existing sheets/{sheetId}/** Firestore rule (owner-only).
export async function savePinResetOtpFS(sheetId, otpHash, expiresAt) {
  await setDoc(pinResetRef(sheetId), { otpHash, expiresAt })
}

export async function clearPinResetOtpFS(sheetId) {
  try { await deleteDoc(pinResetRef(sheetId)) } catch { /* ignore */ }
}

// Overwrite PIN without the "already set" guard — only reachable after OTP verification.
export async function resetPinFS(sheetId, newPin) {
  await setDoc(securityRef(sheetId), {
    pinHash: await hashPin(newPin),
    updatedAt: new Date().toISOString(),
  }, { merge: true })
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
