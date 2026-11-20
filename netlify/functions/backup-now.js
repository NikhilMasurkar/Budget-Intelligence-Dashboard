// Same backup on demand, for testing: /api/backup-now?secret=PUSH_SECRET
// (Scheduled functions can't be called by URL, hence this second entry point.)
const { runBackup } = require('../lib/backup')

exports.handler = async (event) => {
  if (event.queryStringParameters?.secret !== process.env.PUSH_SECRET) {
    return { statusCode: 401, body: 'Unauthorized' }
  }
  return { statusCode: 200, body: JSON.stringify(await runBackup()) }
}
