// Triggered daily by cron-job.org at 9 PM IST (15:30 UTC).
// Reads all push subscriptions from Firestore and sends a reminder notification.
const webpush = require('web-push')
const admin = require('firebase-admin')

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
    )
  })
}

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VITE_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
)

exports.handler = async (event) => {
  const params = new URLSearchParams(event.rawQuery || '')
  if (params.get('secret') !== process.env.PUSH_SECRET) {
    return { statusCode: 401, body: 'Unauthorized' }
  }

  const db = admin.firestore()
  const snap = await db.collection('pushSubscriptions').get()

  if (snap.empty) {
    return { statusCode: 200, body: JSON.stringify({ sent: 0, note: 'No subscribers' }) }
  }

  const payload = JSON.stringify({
    title: '💰 BudgetIQ',
    body: "Don't forget to log today's expenses! 📝"
  })

  const results = await Promise.allSettled(
    snap.docs.map(d => {
      const { endpoint, keys } = d.data()
      return webpush.sendNotification({ endpoint, keys }, payload)
    })
  )

  // Clean up expired subscriptions (410 Gone = browser uninstalled/revoked)
  const expired = snap.docs.filter((_, i) =>
    results[i].status === 'rejected' && [404, 410].includes(results[i].reason?.statusCode)
  )
  if (expired.length) {
    await Promise.allSettled(expired.map(d => d.ref.delete()))
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      sent: results.filter(r => r.status === 'fulfilled').length,
      failed: results.filter(r => r.status === 'rejected').length,
      total: snap.size
    })
  }
}
