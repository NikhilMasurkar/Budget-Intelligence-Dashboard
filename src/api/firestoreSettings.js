import { db } from '../firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'

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
