// Scheduled (netlify.toml): Sundays 03:30 UTC = 9 AM IST. Emails each owner a JSON backup.
const { runBackup } = require('../lib/backup')

exports.handler = async () => {
  const report = await runBackup()
  console.log('[backup]', JSON.stringify(report))
  return { statusCode: 200, body: JSON.stringify(report) }
}
