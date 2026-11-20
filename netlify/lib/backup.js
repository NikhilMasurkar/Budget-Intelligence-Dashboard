// Weekly backup: every account's data as one JSON file, emailed to its owner.
// The only copy outside Firebase that nobody has to remember to make.
// Same shape as the app's "Full backup (.json)" download.
const admin = require('firebase-admin')

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)) })
}
const db = admin.firestore()

async function collectSheet(ref) {
  const [cats, months] = await Promise.all([ref.collection('categories').get(), ref.collection('months').get()])
  const expenses = [], income = []
  months.docs.forEach(d => {
    const { year, month } = d.data()
    Object.entries(d.data().expenses || {}).forEach(([id, e]) => expenses.push({ id, year, month, ...e }))
    Object.entries(d.data().income || {}).forEach(([id, i]) => income.push({ id, year, month, ...i }))
  })
  return { categories: cats.docs.map(d => ({ id: d.id, ...d.data() })), expenses, income }
}

async function sendMail(to, filename, json, counts) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.RESEND_FROM || 'BudgetIQ <onboarding@resend.dev>',
      to: [to],
      subject: `BudgetIQ weekly backup — ${counts.expenses} expenses, ${counts.income} income`,
      text: `Your BudgetIQ data as of ${new Date().toUTCString()} is attached (${filename}).\nKeep it somewhere safe; it is the copy outside Firebase.`,
      attachments: [{ filename, content: Buffer.from(json).toString('base64') }],
    }),
  })
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`)
}

// Returns one line per account, for the function's response and logs.
async function runBackup() {
  const sheets = await db.collection('sheets').get()
  const report = []
  for (const s of sheets.docs) {
    const { ownerUid } = s.data()
    if (!ownerUid) continue
    const data = await collectSheet(s.ref)
    if (!data.expenses.length && !data.income.length) continue   // nothing to back up
    const { email } = await admin.auth().getUser(ownerUid)
    if (!email) continue
    const exportedAt = new Date().toISOString()
    const filename = `budgetiq_backup_${exportedAt.slice(0, 10)}.json`
    const json = JSON.stringify({ app: 'BudgetIQ', exportedAt, ...data }, null, 2)
    await sendMail(email, filename, json, { expenses: data.expenses.length, income: data.income.length })
    report.push({ sheet: s.id.slice(0, 6), expenses: data.expenses.length, income: data.income.length, bytes: json.length })
  }
  return report
}

module.exports = { runBackup, collectSheet }
