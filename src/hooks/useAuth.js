import { useState, useEffect, useRef } from 'react'
import { toast } from 'react-hot-toast'
import {
  signInWithGoogle, signOut, isSignedIn,
  getUserProfile, findUserSpreadsheet, createUserSpreadsheet,
  setSheetId, setupSheet, silentReauth, getSavedUserName,
  getTokenExpiry, getSessionValid
} from '../api/sheets'

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

  // Schedule a silent token refresh ~5 min before expiry
  function scheduleRefresh() {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
    const msUntilExpiry = getTokenExpiry() - Date.now()
    const delay = Math.max(0, msUntilExpiry - 5 * 60 * 1000)
    refreshTimerRef.current = setTimeout(async () => {
      if (!getSessionValid()) {
        // 24h session expired — sign out cleanly
        handleSignOut()
        return
      }
      try { await silentReauth(); scheduleRefresh() } catch { handleSignOut() }
    }, delay)
  }

  useEffect(() => {
    async function restore() {
      if (isSignedIn()) {
        setAuthd(true)
        scheduleRefresh()
        return
      }
      const saved = getSavedUserName()
      if (saved && getSessionValid()) {
        try {
          await silentReauth()
          setAuthd(true)
          scheduleRefresh()
        } catch {}
      }
    }
    restore()
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
    setAuthd(false)
    setUserName('')
    setUserFullName('')
    setUserPicture('')
    toast('Signed out')
  }

  return { authd, userName, userFullName, userPicture, handleSignIn, handleSignOut }
}
