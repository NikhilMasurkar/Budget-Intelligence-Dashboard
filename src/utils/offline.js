import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'

// ── Offline support ──────────────────────────────────────────────────────────
// Two things live on the phone, per spreadsheet:
//   snapshot — the last data that loaded successfully, shown read-only offline
//   queue    — NEW expenses added offline, as ready-to-append sheet rows
//
// Only new expenses are queued. Every other change rewrites the whole Expenses
// sheet, and replaying one later could overwrite edits made on another device;
// a new row is append-only, and its id lets a replay skip rows already sent.
//
// ponytail: localStorage, ~5 MB per origin — years of rows fit. Move to
// IndexedDB if a snapshot ever fails to save (saveSnapshot returns false).

const key = (name, sid) => `budgetiq_${name}_${sid}`

function read(k, fallback) {
  try { return JSON.parse(localStorage.getItem(k)) ?? fallback } catch { return fallback }
}
function write(k, value) {
  try { localStorage.setItem(k, JSON.stringify(value)); return true } catch { return false }
}

export const isOffline = () => typeof navigator !== 'undefined' && navigator.onLine === false

// A failed request that never reached Google, as opposed to Google saying no.
export function isNetworkError(e) {
  if (isOffline()) return true
  if (e?.code === 'unavailable') return true                 // Firestore
  // fetch() rejects with Chrome "Failed to fetch", Safari "Load failed",
  // Firefox "NetworkError…"; Firestore says "…the client is offline".
  // Matched by message, not TypeError, so a plain code bug isn't mistaken for it.
  return /offline|networkerror|failed to fetch|load failed/i.test(e?.message || '')
}

// Guard for changes that can't be queued. Says why instead of a raw
// "Failed to fetch", and throws so callers stop (modals stay open).
export function requireConnection() {
  if (!isOffline()) return
  const msg = 'Needs a connection — you can still add new expenses offline'
  toast.error(msg, { id: 'needs-connection' })
  throw new Error(msg)
}

export function saveSnapshot(sid, data) {
  return !!sid && write(key('snapshot', sid), { ...data, savedAt: Date.now() })
}
export const loadSnapshot = (sid) => (sid ? read(key('snapshot', sid), null) : null)

// Queue entries are sheet rows: [id, year, month, categoryId, itemName, amount, isFixed, note, updatedAt]
export const getQueue = (sid) => (sid ? read(key('queue', sid), []) : [])
export const setQueue = (sid, rows) => write(key('queue', sid), rows)
export function queueRow(sid, row) {
  if (!sid || !write(key('queue', sid), [...getQueue(sid), row])) {
    throw new Error('Could not save on this phone — storage is full')
  }
}

export const rowToExpense = (r, extra) => ({
  id: r[0], year: r[1], month: r[2], categoryId: r[3], itemName: r[4],
  amount: r[5], isFixed: r[6], note: r[7], updatedAt: r[8], ...extra,
})

// The PIN is checked against Firestore, which is unreachable offline. Keep the
// same hash locally once a PIN has been confirmed online. The snapshot sitting
// next to it is unencrypted anyway, so this doesn't widen what the phone holds.
export const cachePinHash = (sid, hash) => sid && write(key('pinhash', sid), hash)
export const getCachedPinHash = (sid) => (sid ? read(key('pinhash', sid), null) : null)

export function clearOfflineData(sid) {
  if (!sid) return
  for (const n of ['snapshot', 'queue', 'pinhash']) {
    try { localStorage.removeItem(key(n, sid)) } catch { /* nothing to clear */ }
  }
}

export function useOnline() {
  const [online, setOnline] = useState(!isOffline())
  useEffect(() => {
    const on = () => setOnline(true), off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])
  return online
}
