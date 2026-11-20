import { db, getFirebaseUid } from '../firebase'
import { doc, setDoc, deleteDoc } from 'firebase/firestore'

// One Firestore doc per device: pushSubscriptions/{sha256(endpoint)} with the
// owner's uid inside. (It used to be one doc per account, so turning the
// reminder on in a second browser silently took it away from the first.)

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)))
}

async function docIdFor(endpoint) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(endpoint))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

async function saveSub(sub, uid) {
  await setDoc(doc(db, 'pushSubscriptions', await docIdFor(sub.endpoint)), {
    ...sub.toJSON(), uid, updatedAt: new Date().toISOString(),
  })
}

const supported = () => 'serviceWorker' in navigator && 'PushManager' in window

// Also re-saves this device's subscription, so the server always has what the
// menu shows as "On" (the browser can renew a subscription by itself).
export async function getPushStatus() {
  if (!supported()) return 'unsupported'
  if (Notification.permission === 'denied') return 'denied'
  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.getSubscription()
  const uid = getFirebaseUid()
  if (sub && uid && Notification.permission === 'granted') await saveSub(sub, uid).catch(() => {})
  return sub ? 'subscribed' : 'unsubscribed'
}

export async function subscribeToPush() {
  const key = import.meta.env.VITE_VAPID_PUBLIC_KEY
  if (!key) throw new Error('Push notifications not configured yet (VITE_VAPID_PUBLIC_KEY missing)')
  if (!supported()) throw new Error('This browser does not support notifications. Open the installed app.')

  // Check the uid first so a browser subscription never exists without its record.
  const uid = getFirebaseUid()
  if (!uid) throw new Error('Not signed in')

  const perm = await Notification.requestPermission()
  if (perm !== 'granted') throw new Error('Notification permission denied')

  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.getSubscription() || await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(key),
  })
  await saveSub(sub, uid)
  // The old one-doc-per-account record, written by earlier versions.
  await deleteDoc(doc(db, 'pushSubscriptions', uid)).catch(() => {})
  return sub
}

export async function unsubscribeFromPush() {
  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.getSubscription()
  if (!sub) return
  // Delete the record even if the browser unsubscribe fails, so pushes stop.
  await deleteDoc(doc(db, 'pushSubscriptions', await docIdFor(sub.endpoint))).catch(() => {})
  await sub.unsubscribe().catch(() => {})
}
