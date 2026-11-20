import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { getSheetId } from '../api/session'
import { hasPinFS, setPinFS, verifyPinFS, checkPin } from '../api/firestoreSettings'
import { isOffline, cachePinHash, getCachedPinHash } from '../utils/offline'

// The PIN lock in front of the app, once per browser session.
// Returns props for <PinScreen> while locked (null when open) and reset() for sign-out.
export function usePinGate({ authd, authReady, userName }) {
  const [mode, setMode] = useState(null)   // null | 'setup' | 'entry'
  const [verified, setVerified] = useState(() => sessionStorage.getItem('budgetiq_pin_verified') === '1')

  useEffect(() => {
    if (verified) return
    const sid = getSheetId()
    if (!sid) return
    if (localStorage.getItem('budgetiq_has_pin') === '1') { setMode('entry'); return }
    if (!authd) return
    hasPinFS(sid).then(exists => {
      if (exists) localStorage.setItem('budgetiq_has_pin', '1')
      setMode(exists ? 'entry' : 'setup')
    }).catch(() => setVerified(true))   // Firebase error — don't block the app
  }, [authd, verified])

  // State survives sign-out, so a second account would find the gate "passed".
  const reset = () => { setVerified(false); setMode(null) }

  if (verified || !mode) return { screen: null, reset }
  const sid = getSheetId()
  return {
    reset,
    screen: {
      mode, userName, sheetId: sid,
      onSetPin: async (pin) => {
        const hash = await setPinFS(sid, pin)
        localStorage.setItem('budgetiq_has_pin', '1')
        cachePinHash(sid, hash)
      },
      onVerify: async (entered) => {
        if (mode === 'setup' || entered === null) return true   // null = biometric passed
        // Firestore is out of reach offline — check the copy kept from the last
        // time this PIN was confirmed online.
        if (isOffline()) {
          const cached = getCachedPinHash(sid)
          if (!cached) {
            toast.error("You're offline. Use fingerprint / Face ID, or connect once so your PIN works offline.", { id: 'pin-offline' })
            return false
          }
          return checkPin(entered, cached)
        }
        await authReady()
        const hash = await verifyPinFS(sid, entered)
        if (hash) cachePinHash(sid, hash)
        return !!hash
      },
      onUnlock: () => {
        sessionStorage.setItem('budgetiq_pin_verified', '1')
        setVerified(true)
        setMode(null)
      },
    },
  }
}
