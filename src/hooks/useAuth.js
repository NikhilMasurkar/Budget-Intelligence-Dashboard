import { useState, useEffect, useRef } from 'react'
import { toast } from 'react-hot-toast'
import {
  signInWithGoogle, signOut, isSignedIn,
  getUserProfile, findUserSpreadsheet, createUserSpreadsheet,
  setSheetId, setupSheet, silentReauth, getSavedUserName,
  getTokenExpiry, getToken, getSheetId
} from '../api/sheets'
import { bridgeFirebaseAuth, firebaseSignOut } from '../firebase'
import { ensureSheetOwnerFS } from '../api/firestoreSettings'

export function useAuth() {
  const [authd, setAuthd] = useState(false)
  const [userName, setUserName] = useState(getSavedUserName() || '')
  const [userFullName, setUserFullName] = useState(
    () => localStorage.getItem('budgetiq_userFullName') || getSavedUserName() || ''
  )
  const [userPicture, setUserPicture] = useState(
    () => localStorage.getItem('budgetiq_userPicture') || ''
  )
  const refreshTimerRef = useRef(null)   // silent token refresh
  const restoreTimerRef = useRef(null)   // restore retry — kept separate so the
                                         // two never clobber each other's timer
  const authReadyRef = useRef(null)
  const authdRef     = useRef(false)     // readable from listeners with [] deps

  const markAuthed = (v) => { authdRef.current = v; setAuthd(v) }

  // Backfill the GIS `hint` for anyone who signed in before we started storing
  // the email. Without a hint, silent reauth shows Google's account chooser on
  // every reload — which is exactly the modal we're trying to get rid of.
  async function cacheEmailOnce(token) {
    if (!token || localStorage.getItem('budgetiq_userEmail')) return
    try {
      const p = await getUserProfile(token)
      if (p.email) localStorage.setItem('budgetiq_userEmail', p.email)
    } catch { /* non-fatal — retried on the next load */ }
  }

  function scheduleRefresh(retryMs = 0) {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
    const delay = retryMs || Math.max(0, getTokenExpiry() - Date.now() - 5 * 60 * 1000)
    refreshTimerRef.current = setTimeout(async () => {
      try { await silentReauth(); scheduleRefresh() }
      catch { scheduleRefresh(Math.min(retryMs ? retryMs * 2 : 30_000, 5 * 60 * 1000)) }
    }, delay)
  }

  useEffect(() => {
    async function restore(retryMs = 0) {
      try {
        if (!isSignedIn()) {
          if (!getSavedUserName()) return
          await silentReauth()
        }
        cacheEmailOnce(getToken())
        await bridgeFirebaseAuth(getToken())
        await ensureSheetOwnerFS(getSheetId())
        markAuthed(true)
        scheduleRefresh()
      } catch {
        // Keep retrying quietly instead of stranding a returning user on the
        // sign-in screen. authReadyRef is reassigned so a PIN submitted while a
        // retry is in flight waits for that attempt rather than failing.
        const next = Math.min(retryMs ? retryMs * 2 : 30_000, 5 * 60 * 1000)
        if (restoreTimerRef.current) clearTimeout(restoreTimerRef.current)
        restoreTimerRef.current = setTimeout(() => {
          authReadyRef.current = restore(next).catch(() => {})
        }, next)
      }
    }
    // .catch keeps authReady() non-rejecting — PinScreen's verify path has no catch
    authReadyRef.current = restore().catch(() => {})

    // A backgrounded PWA has its timers throttled, so the scheduled refresh may
    // never fire and the token goes stale while the app is still "open".
    // Re-check on resume; scheduleRefresh fires immediately when already due.
    const onResume = () => {
      if (document.visibilityState !== 'visible' || !getSavedUserName()) return
      // Only nudge the refresh timer once a session exists. Before that, resume
      // must re-run restore — scheduleRefresh alone never sets authd, so it
      // would leave a user who resumed mid-retry stuck on the sign-in screen.
      if (authdRef.current) scheduleRefresh()
      else authReadyRef.current = restore().catch(() => {})
    }
    document.addEventListener('visibilitychange', onResume)

    return () => {
      document.removeEventListener('visibilitychange', onResume)
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
      if (restoreTimerRef.current) clearTimeout(restoreTimerRef.current)
    }
  }, [])

  const handleSignIn = async () => {
    try {
      toast.loading('Authenticating...', { id: 'auth' })
      const token = await signInWithGoogle()
      toast.loading('Finding your personal database...', { id: 'auth' })
      const profile = await getUserProfile(token)
      const name     = profile.given_name || profile.name || 'User'
      const fullName = profile.name || name
      const pic      = profile.picture || ''
      localStorage.setItem('budgetiq_userName', name)
      localStorage.setItem('budgetiq_userFullName', fullName)
      localStorage.setItem('budgetiq_userPicture', pic)
      if (profile.email) localStorage.setItem('budgetiq_userEmail', profile.email)
      let sid = await findUserSpreadsheet(token, name)
      if (!sid) {
        toast.loading(`Creating personal database for ${name}...`, { id: 'auth' })
        sid = await createUserSpreadsheet(token, name)
        setSheetId(sid)
        toast.loading('Setting up new sheets...', { id: 'auth' })
        await setupSheet(token)
      } else {
        setSheetId(sid)
      }
      // Establish the Firebase identity from the same Google token, then stamp
      // ownership on this sheet — both must precede any Firestore data access.
      await bridgeFirebaseAuth(token)
      await ensureSheetOwnerFS(sid)
      setUserName(name)
      setUserFullName(fullName)
      setUserPicture(pic)
      markAuthed(true)
      scheduleRefresh()
      toast.success(`Welcome, ${name}!`, { id: 'auth' })
    } catch (e) {
      toast.error('Sign-in failed: ' + e.message, { id: 'auth' })
    }
  }

  const handleSignOut = async () => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
    if (restoreTimerRef.current) clearTimeout(restoreTimerRef.current)
    signOut()
    // MUST be awaited. bridgeFirebaseAuth short-circuits on auth.currentUser, so
    // signing in as a second account before this settles would reuse the first
    // account's Firebase identity and stamp their uid on the new sheet.
    await firebaseSignOut()
    markAuthed(false)
    setUserName('')
    setUserFullName('')
    setUserPicture('')
    toast('Signed out')
  }

  return {
    authd, userName, userFullName, userPicture, handleSignIn, handleSignOut,
    authReady: () => authReadyRef.current,
  }
}
