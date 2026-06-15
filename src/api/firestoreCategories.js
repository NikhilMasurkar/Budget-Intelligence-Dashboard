import { db } from '../firebase'
import {
  collection, doc, getDocs,
  setDoc, deleteDoc, writeBatch,
  query, orderBy
} from 'firebase/firestore'

// Firestore path: sheets/{sheetId}/categories/{categoryId}
const catCol = (sheetId) =>
  collection(db, 'sheets', sheetId, 'categories')

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Firebase timeout — check VITE_FIREBASE_PROJECT_ID env var')), ms)
    )
  ])
}

export async function fetchCategoriesFS(sheetId) {
  const snap = await withTimeout(
    getDocs(query(catCol(sheetId), orderBy('order', 'asc'))),
    10000
  )
  return snap.docs.map(d => d.data())
}

export async function saveCategoryFS(sheetId, category) {
  const ref = doc(db, 'sheets', sheetId, 'categories', category.id)
  await setDoc(ref, category, { merge: true })
}

export async function deleteCategoryFS(sheetId, categoryId) {
  await deleteDoc(doc(db, 'sheets', sheetId, 'categories', categoryId))
}

// Write all categories at once (used for reorder + initial migration).
// Each category gets an `order` field matching its array index.
export async function saveAllCategoriesFS(sheetId, categories) {
  const batch = writeBatch(db)
  categories.forEach((cat, i) => {
    const ref = doc(db, 'sheets', sheetId, 'categories', cat.id)
    batch.set(ref, { ...cat, order: i })
  })
  await batch.commit()
}
