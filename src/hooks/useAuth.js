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
  const refreshTimerRef = useRef(null)
  const authReadyRef = useRef(null)
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
      if (isSignedIn()) {

        await bridgeFirebaseAuth(getToken())
        await ensureSheetOwnerFS(getSheetId())
        setAuthd(true)
        scheduleRefresh()
        return
      }
      if (!getSavedUserName()) return
      try {
        await silentReauth()
        await bridgeFirebaseAuth(getToken())
        await ensureSheetOwnerFS(getSheetId())
        setAuthd(true)
        scheduleRefresh()
      } catch {

        const next = Math.min(retryMs ? retryMs * 2 : 30_000, 5 * 60 * 1000)
        if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
        refreshTimerRef.current = setTimeout(() => {
          authReadyRef.current = restore(next).catch(() => {})
        }, next)
      }
    }
    // .catch keeps authReady() non-rejecting — PinScreen's verify path has no catch
    authReadyRef.current = restore().catch(() => {})
    return () => { if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current) }
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
      setAuthd(true)
      scheduleRefresh()
      toast.success(`Welcome, ${name}!`, { id: 'auth' })
    } catch (e) {
      toast.error('Sign-in failed: ' + e.message, { id: 'auth' })
    }
  }

  const handleSignOut = () => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
    signOut()
    firebaseSignOut()
    setAuthd(false)
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
