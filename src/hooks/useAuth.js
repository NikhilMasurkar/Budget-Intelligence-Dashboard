import { useState, useEffect, useRef } from 'react'
import { toast } from 'react-hot-toast'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, firebaseSignOut } from '../firebase'
import { signInWithGoogle, saveProfile, resolveSheetId, clearSession, getSavedUserName } from '../api/session'

// Firebase keeps the sign-in on the device (works offline too) and refreshes
// it by itself. authd = signed in AND the data root is known.
export function useAuth() {
  const [authd, setAuthd] = useState(false)
  const [userName, setUserName] = useState(getSavedUserName() || '')
  const [userFullName, setUserFullName] = useState(() => localStorage.getItem('budgetiq_userFullName') || getSavedUserName() || '')
  const [userPicture, setUserPicture] = useState(() => localStorage.getItem('budgetiq_userPicture') || '')

  // Resolves once the first auth state is settled — the PIN check waits on it.
  const readyRef = useRef(null)
  if (!readyRef.current) {
    let resolve
    readyRef.current = { promise: new Promise(r => { resolve = r }), resolve }
  }

  const applyUser = async (user) => {
    await resolveSheetId(user.uid)
    const p = saveProfile(user)
    setUserName(p.name); setUserFullName(p.fullName); setUserPicture(p.picture)
    setAuthd(true)
  }

  useEffect(() => onAuthStateChanged(auth, async (user) => {
    try {
      if (user) await applyUser(user)
      else setAuthd(false)
    } catch (e) {
      console.error('[BudgetIQ] Could not open your data:', e)
      toast.error('Could not open your data: ' + e.message, { id: 'auth' })
    } finally {
      readyRef.current.resolve()
    }
  }), [])

  const handleSignIn = async () => {
    try {
      toast.loading('Signing in…', { id: 'auth' })
      const user = await signInWithGoogle()
      await applyUser(user)   // onAuthStateChanged also fires; resolveSheetId is idempotent
      toast.success(`Welcome, ${user.displayName?.split(' ')[0] || 'back'}!`, { id: 'auth' })
    } catch (e) {
      toast.error('Sign-in failed: ' + e.message, { id: 'auth' })
    }
  }

  const handleSignOut = async () => {
    clearSession()
    await firebaseSignOut()
    setAuthd(false)
    setUserName(''); setUserFullName(''); setUserPicture('')
    toast('Signed out')
  }

  return {
    authd, userName, userFullName, userPicture, handleSignIn, handleSignOut,
    authReady: () => readyRef.current.promise,
  }
}
