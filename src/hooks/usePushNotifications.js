import { useState, useEffect, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import { getPushStatus, subscribeToPush, unsubscribeFromPush } from '../api/pushSubscription'

// The daily 10 PM reminder: its current status and an on/off toggle.
export function usePushNotifications(authd) {
  const [notifStatus, setNotifStatus] = useState('unsubscribed')

  useEffect(() => {
    if (!authd) return
    getPushStatus().then(setNotifStatus).catch(() => { })
  }, [authd])

  const handleToggleNotifications = useCallback(async () => {
    if (notifStatus === 'subscribed') {
      setNotifStatus('loading')
      try {
        await unsubscribeFromPush()
        setNotifStatus('unsubscribed')
        toast.success('Daily reminders disabled')
      } catch {
        // Re-fetch actual state — browser sub may have been revoked even if we threw
        const status = await getPushStatus().catch(() => 'unsubscribed')
        setNotifStatus(status)
      }
    } else {
      setNotifStatus('loading')
      try {
        await subscribeToPush()
        setNotifStatus('subscribed')
        toast.success('Daily 10 PM reminders enabled! 🔔')
      } catch (e) {
        const status = await getPushStatus().catch(() => 'unsubscribed')
        setNotifStatus(status)
        if (!e?.message?.includes('denied')) toast.error(e?.message || String(e))
      }
    }
  }, [notifStatus])

  return { notifStatus, handleToggleNotifications }
}
