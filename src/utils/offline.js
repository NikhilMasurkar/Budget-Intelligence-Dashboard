import { useState, useEffect } from 'react'

// ── Offline helpers ──────────────────────────────────────────────────────────
// Firestore keeps the data and any offline changes on the device itself. The
// only thing kept here is a copy of the PIN hash, so the PIN works offline.

const key = (name, sid) => `budgetiq_${name}_${sid}`

function read(k, fallback) {
  try { return JSON.parse(localStorage.getItem(k)) ?? fallback } catch { return fallback }
}
function write(k, value) {
  try { localStorage.setItem(k, JSON.stringify(value)); return true } catch { return false }
}

export const isOffline = () => typeof navigator !== 'undefined' && navigator.onLine === false

// The PIN is checked against Firestore, which is unreachable offline. Keep the
// same hash locally once a PIN has been confirmed online. Firestore's offline
// copy of the data sits on the device too, so this doesn't widen what it holds.
export const cachePinHash = (sid, hash) => sid && write(key('pinhash', sid), hash)
export const getCachedPinHash = (sid) => (sid ? read(key('pinhash', sid), null) : null)

export function clearOfflineData(sid) {
  if (!sid) return
  // snapshot/queue: left by older versions of the app
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
