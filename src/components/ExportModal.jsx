import { useState, useEffect } from 'react'
import { fetchExpenses, fetchIncome } from '../api/store'
import toast from 'react-hot-toast'
import {
  Dialog,
  Box,
  Typography,
  Button,
  CircularProgress
} from '@mui/material'
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined'
import { makeStyles } from 'tss-react/mui'
import { useExportModalUi } from './styles/ExportModal.styles'

const useStyles = makeStyles()((theme) => ({
  dialog: {
    '& .MuiDialog-paper': {
      maxWidth: '380px',
      width: 'calc(100% - 32px)',
      margin: theme.spacing(2),
      borderRadius: theme.spacing(3),
      border: '1px solid rgb(var(--ink-rgb) / 0.13)',
      backgroundColor: 'var(--bg)',
      backgroundImage: 'none',
      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.5)',
      overflowY: 'auto', maxHeight: 'calc(100dvh - 32px)',
    },
  },
  container: {
    padding: theme.spacing(2.5),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    [theme.breakpoints.up('sm')]: {
      padding: theme.spacing(3.5),
    },
  },
  iconContainer: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing(2.5),
  },
  iconContainerLocal: {
    backgroundColor: 'rgb(var(--accent2-rgb) / 0.1)',
    border: '1px solid rgb(var(--accent2-rgb) / 0.25)',
    boxShadow: '0 0 12px rgb(var(--accent2-rgb) / 0.1)',
  },
  icon: {
    fontSize: '28px',
  },
  title: {
    fontWeight: 800,
    fontSize: '16px',
    marginBottom: theme.spacing(1.5),
    color: theme.palette.text.primary,
    letterSpacing: '-0.01em',
  },
  loadingBox: {
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: theme.spacing(2),
  },
  loadingText: {
    color: theme.palette.text.secondary,
    fontSize: '12.5px',
  },
  description: {
    color: theme.palette.text.secondary,
    fontSize: '12.5px',
    lineHeight: 1.6,
    marginBottom: theme.spacing(3),
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(1),
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: theme.spacing(1.5),
    width: '100%',
    marginBottom: theme.spacing(3.5),
  },
  yearCard: {
    padding: theme.spacing(1.5),
    borderRadius: theme.spacing(1),
    border: '2px solid',
    borderColor: theme.palette.divider,
    backgroundColor: 'transparent',
    cursor: 'pointer',
    transition: 'all 0.15s ease-in-out',
    textAlign: 'center',
    userSelect: 'none',
    '&:hover': {
      borderColor: theme.palette.text.secondary,
      backgroundColor: 'rgb(var(--ink-rgb) / 0.02)',
    },
  },
  yearCardSelected: {
    borderColor: theme.palette.primary.main,
    backgroundColor: 'rgb(var(--accent-rgb) / 0.08)',
    '&:hover': {
      borderColor: theme.palette.primary.main,
      backgroundColor: 'rgb(var(--accent-rgb) / 0.12)',
    },
  },
  yearTitle: {
    fontWeight: 800,
    fontSize: '13px',
    color: theme.palette.text.primary,
  },
  yearTitleSelected: {
    color: theme.palette.primary.main,
  },
  yearSub: {
    fontSize: '9.5px',
    color: theme.palette.text.secondary,
    opacity: 0.8,
  },
  actionGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1.25),
    width: '100%',
  },
  exportBtn: {
    paddingTop: theme.spacing(1.2),
    paddingBottom: theme.spacing(1.2),
    fontWeight: 700,
    borderRadius: theme.spacing(1),
    fontSize: '13px',
  },
  exportBtnLocal: {
    boxShadow: '0 4px 12px rgb(var(--accent2-rgb) / 0.2)',
    '&:hover': {
      boxShadow: '0 6px 16px rgb(var(--accent2-rgb) / 0.3)',
    },
  },
  cancelBtn: {
    paddingTop: theme.spacing(0.9),
    paddingBottom: theme.spacing(0.9),
    borderRadius: theme.spacing(1),
    borderColor: theme.palette.divider,
    color: theme.palette.text.secondary,
    fontSize: '13px',
    fontWeight: 600,
    '&:hover': {
      borderColor: theme.palette.text.primary,
      color: theme.palette.text.primary,
      backgroundColor: 'rgb(var(--ink-rgb) / 0.03)',
    },
  },
}))

export default function ExportModal({ categories, onClose }) {
  const { classes: ui } = useExportModalUi()
  const { classes, cx } = useStyles()
  const currentYear = new Date().getFullYear()
  const [selectedYears, setSelectedYears] = useState([])
  const [availableYears, setAvailableYears] = useState([])
  const [allData, setAllData] = useState({ expenses: [], income: [] })
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    async function loadYears() {
      try {
        const [exps, inc] = await Promise.all([fetchExpenses(), fetchIncome()])
        // Ignore unparseable years — a bad row would otherwise put a literal
        // "NaN" in the year list and export an empty section for it.
        const years = new Set([currentYear])
        const addYear = (v) => { const n = parseInt(v, 10); if (Number.isFinite(n)) years.add(n) }
        exps.forEach(e => addYear(e.year))
        inc.forEach(i => addYear(i.year))

        const sorted = Array.from(years).sort((a,b) => a - b).map(String)
        setAvailableYears(sorted)
        setSelectedYears(sorted)   // full report by default
        setAllData({ expenses: exps, income: inc })
      } catch (e) {
        toast.error('Failed to load years: ' + e.message)
      } finally {
        setLoading(false)
      }
    }
    loadYears()
  // eslint-disable-next-line react-hooks/exhaustive-deps -- load once when the dialog opens
  }, [])

  const toggleYear = (y) => {
    setSelectedYears(prev => 
      prev.includes(y) ? prev.filter(x => x !== y) : [...prev, y].sort()
    )
  }

  const handleExport = async () => {
    if (selectedYears.length === 0) {
      toast.error('Select at least one year')
      return
    }
    try {
      setBusy(true)
      const toastId = 'local-export'
      toast.loading('Generating PDF...', { id: toastId })
      const { exportToPdf } = await import('../utils/exportPdf')
      await exportToPdf(categories, allData.expenses, allData.income, selectedYears)
      toast.success('✅ PDF Downloaded!', { id: toastId })
      onClose()
    } catch (e) {
      console.error(e)
      toast.error('Export failed: ' + e.message)
    } finally {
      setBusy(false)
    }
  }

  // Everything, every year, as one JSON file — the only copy outside Firebase.
  const handleBackup = () => {
    const backup = { app: 'BudgetIQ', exportedAt: new Date().toISOString(), categories, ...allData }
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }))
    a.download = `budgetiq_backup_${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
    toast.success(`Backup saved — ${allData.expenses.length} expenses, ${allData.income.length} income entries`)
  }

  return (
    <Dialog
      open={true}
      onClose={() => {
        if (!busy) onClose()
      }}
      className={classes.dialog}
    >
      <Box className={classes.container}>
        {/* Top Icon Badge */}
        <Box className={cx(classes.iconContainer, classes.iconContainerLocal)}>
          <FileDownloadOutlinedIcon color="secondary" className={classes.icon} />
        </Box>

        {/* Title */}
        <Typography variant="h6" className={classes.title}>
          Download PDF
        </Typography>

        {loading ? (
          <Box className={classes.loadingBox}>
            <CircularProgress size={36} color="primary" />
            <Typography variant="body2" className={classes.loadingText}>
              Loading your data...
            </Typography>
          </Box>
        ) : (
          <>
            {/* Description */}
            <Typography variant="body2" className={classes.description}>
              A PDF report of every year is ready. Untick any year you want to leave out.
            </Typography>

            <Typography className={ui.typography1}
              variant="subtitle2"
            >
              Select Year(s)
            </Typography>

            {/* Year selection grid */}
            <Box className={classes.grid}>
              {availableYears.map(y => {
                const selected = selectedYears.includes(y)
                return (
                  <Box
                    key={y}
                    onClick={() => toggleYear(y)}
                    className={cx(classes.yearCard, selected && classes.yearCardSelected)}
                  >
                    <Typography
                      variant="subtitle2"
                      className={cx(classes.yearTitle, selected && classes.yearTitleSelected)}
                    >
                      {y}
                    </Typography>
                    <Typography variant="caption" className={classes.yearSub}>
                      {selected ? 'Selected' : 'Include'}
                    </Typography>
                  </Box>
                )
              })}
            </Box>

            {/* Actions */}
            <Box className={classes.actionGroup}>
              <Button
                variant="contained"
                onClick={handleExport}
                // Also disabled while the data is still loading — allData starts
                // empty, so exporting early produced a silent empty report.
                disabled={busy || loading}
                startIcon={<FileDownloadOutlinedIcon />}
                className={cx(classes.exportBtn, classes.exportBtnLocal)}
              >
                {busy ? 'Processing...' : 'Download PDF'}
              </Button>
              <Button
                variant="outlined"
                onClick={onClose}
                disabled={busy}
                className={classes.cancelBtn}
              >
                Cancel
              </Button>
            </Box>
            <Button className={ui.button1} size="small" onClick={handleBackup} disabled={busy || loading}>
              Full backup of all years (.json)
            </Button>
          </>
        )}
      </Box>
    </Dialog>
  )
}
