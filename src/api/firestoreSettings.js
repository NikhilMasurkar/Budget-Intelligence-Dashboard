import { db } from '../firebase'
import { doc, getDoc, setDoc, deleteDoc, deleteField } from 'firebase/firestore'

// SHA-256 the PIN digits so raw numbers are never stored in Firestore.
// Web Crypto is available in all modern browsers and Node 18+.
export async function hashPin(pin) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pin))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

// Stored PINs: salted PBKDF2, "pbkdf2$<iterations>$<saltHex>$<hashHex>". A plain
// SHA-256 of a 4–6 digit PIN is reversed instantly by trying every PIN; the
// salt and the iterations make that far slower. Older plain-SHA-256 hashes
// still verify and are upgraded on the next correct entry.
const hex = (buf) => Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
const PIN_ITERATIONS = 210000
async function pbkdf2(pin, saltHex, iterations) {
  const salt = new Uint8Array(saltHex.match(/../g).map(h => parseInt(h, 16)))
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits'])
  return hex(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256))
}
export async function makePinHash(pin) {
  const salt = hex(crypto.getRandomValues(new Uint8Array(16)))
  return `pbkdf2$${PIN_ITERATIONS}$${salt}$${await pbkdf2(pin, salt, PIN_ITERATIONS)}`
}
export async function checkPin(pin, stored) {
  if (!stored) return false
  if (!stored.startsWith('pbkdf2$')) return (await hashPin(pin)) === stored   // legacy
  const [, iter, salt, hash] = stored.split('$')
  return (await pbkdf2(pin, salt, +iter)) === hash
}
export const isLegacyPinHash = (stored) => !!stored && !stored.startsWith('pbkdf2$')

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

// Verify a PIN and silently upgrade plaintext / plain SHA-256 → PBKDF2 on a
// correct entry. Returns the stored hash on success (for the offline cache),
// null otherwise. Never throws — on any Firestore error returns null.
export async function verifyPinFS(sheetId, enteredPin) {
  try {
    const snap = await getDoc(securityRef(sheetId))
    if (!snap.exists()) return null
    const d = snap.data()
    if (d.pinHash ? !(await checkPin(enteredPin, d.pinHash)) : enteredPin !== d.pin) return null
    if (d.pinHash && !isLegacyPinHash(d.pinHash)) return d.pinHash

    // Correct, but stored the old way — upgrade it.
    const pinHash = await makePinHash(enteredPin)
    try {
      await setDoc(securityRef(sheetId), { pinHash, pin: deleteField() }, { merge: true })
    } catch (e) {
      console.warn('[BudgetIQ] PIN upgrade failed (will retry next login):', e.message)
    }
    return pinHash
  } catch {
    return null
  }
}

// Store a hashed PIN. Only works once — once set it cannot be changed from the app.
// To reset: open Firebase console → sheets/{sheetId}/settings/security → delete the doc.
export async function setPinFS(sheetId, pin) {
  const exists = await hasPinFS(sheetId)
  if (exists) throw new Error('PIN already set')
  const pinHash = await makePinHash(pin)
  await setDoc(securityRef(sheetId), { pinHash, createdAt: new Date().toISOString() })
  return pinHash
}

// ─── PIN reset (OTP flow) ────────────────────────────────────────────────────
const pinResetRef = (sheetId) =>
  doc(db, 'sheets', sheetId, 'settings', 'pinReset')

// The matching writer was removed: nothing ever read the stored hash back
// (there was no getter), so persisting it only left a reset-code hash in the
// database whenever a Forgot PIN flow was abandoned. This clear remains to tidy
// up documents written by older builds.
export async function clearPinResetOtpFS(sheetId) {
  try { await deleteDoc(pinResetRef(sheetId)) } catch { /* ignore */ }
}

// Overwrite PIN without the "already set" guard — only reachable after OTP verification.
export async function resetPinFS(sheetId, newPin) {
  await setDoc(securityRef(sheetId), {
    pinHash: await makePinHash(newPin),
    updatedAt: new Date().toISOString(),
  }, { merge: true })
}
