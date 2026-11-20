import { useRef, useState } from 'react'
import { Box, Button, Typography } from '@mui/material'
import toast from 'react-hot-toast'
import { parseBackup } from '../utils/backupFile'
import { restoreBackup } from '../api/store'
import { useRestoreBackupUi } from './styles/RestoreBackup.styles'

const fmtDate = (iso) => iso
  ? new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })
  : 'an unknown date'

// Restore a backup file (Download dialog's .json or the weekly email's).
// Checks the file, says exactly what it holds, saves the current data as a
// file first, then replaces everything.
export default function RestoreBackup({ disabled, onBeforeRestore, onRestored }) {
  const { classes: ui } = useRestoreBackupUi()
  const input = useRef(null)
  const [pending, setPending] = useState(null)   // parsed backup awaiting confirmation
  const [busy, setBusy] = useState(false)

  const pick = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''   // picking the same file again still fires
    if (!file) return
    try { setPending(parseBackup(await file.text())) } catch (err) { toast.error(err.message) }
  }

  const restore = async () => {
    setBusy(true)
    const id = 'restore'
    try {
      onBeforeRestore()
      toast.loading('Restoring your backup…', { id })
      await restoreBackup(pending)
      toast.success(`Restored — ${pending.expenses.length} expenses, ${pending.income.length} income entries`, { id })
      setPending(null)
      onRestored()
    } catch (err) {
      toast.error('Restore failed: ' + err.message, { id })
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <input ref={input} type="file" accept=".json,application/json" className={ui.hiddenInput} onChange={pick} />
      {!pending ? (
        <Button size="small" className={ui.openButton} disabled={disabled} onClick={() => input.current.click()}>
          Restore from a backup file…
        </Button>
      ) : (
        <Box className={ui.confirmBox} role="alert">
          <Typography className={ui.confirmTitle}>Replace all your data with this backup?</Typography>
          <Typography className={ui.confirmText}>
            Backup from {fmtDate(pending.exportedAt)}: {pending.expenses.length} expenses,
            {' '}{pending.income.length} income entries, {pending.categories.length} categories.
          </Typography>
          <Typography className={ui.confirmText}>
            Everything not in the backup is removed. Your current data is downloaded as a file first, so you can undo this.
          </Typography>
          <Box className={ui.confirmActions}>
            <Button variant="contained" size="small" className={ui.restoreButton} disabled={busy} onClick={restore}>
              {busy ? 'Restoring…' : 'Yes, restore'}
            </Button>
            <Button variant="outlined" size="small" className={ui.cancelButton} disabled={busy} onClick={() => setPending(null)}>
              Cancel
            </Button>
          </Box>
        </Box>
      )}
    </>
  )
}
