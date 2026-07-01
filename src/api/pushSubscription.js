import { db, getFirebaseUid } from '../firebase'
import { doc, setDoc, deleteDoc } from 'firebase/firestore'

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)))
}

export async function getPushStatus() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return 'unsupported'
  if (Notification.permission === 'denied') return 'denied'
  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.getSubscription()
  return sub ? 'subscribed' : 'unsubscribed'
}

export async function subscribeToPush() {
  const key = import.meta.env.VITE_VAPID_PUBLIC_KEY
  if (!key) throw new Error('Push notifications not configured yet (VITE_VAPID_PUBLIC_KEY missing)')

  // Validate UID before creating the browser subscription so we never
  // end up with an orphaned browser push sub that has no Firestore record.
  const uid = getFirebaseUid()
  if (!uid) throw new Error('Not signed in to Firebase')

  const perm = await Notification.requestPermission()
  if (perm !== 'granted') throw new Error('Notification permission denied')

  const reg = await navigator.serviceWorker.ready
  const existing = await reg.pushManager.getSubscription()
  if (existing) await existing.unsubscribe()

  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(key)
  })

  await setDoc(doc(db, 'pushSubscriptions', uid), {
    ...sub.toJSON(),
    uid,
    updatedAt: new Date().toISOString()
  })

  return sub
}

export async function unsubscribeFromPush() {
  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.getSubscription()
  // Always attempt the Firestore delete even if browser unsubscribe fails,
  // so the server stops sending pushes regardless of local SW state.
  if (sub) await sub.unsubscribe().catch(() => {})

  const uid = getFirebaseUid()
  if (uid) await deleteDoc(doc(db, 'pushSubscriptions', uid)).catch(() => {})
}
