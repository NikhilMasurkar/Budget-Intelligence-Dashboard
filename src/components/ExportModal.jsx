import React, { useState, useEffect } from 'react'
import { getToken } from '../api/sheets'
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

const useStyles = makeStyles()((theme) => ({
  dialog: {
    '& .MuiDialog-paper': {
      maxWidth: '380px',
      width: 'calc(100% - 32px)',
      margin: theme.spacing(2),
      borderRadius: theme.spacing(3),
      border: '1px solid rgba(255, 255, 255, 0.13)',
      backgroundColor: '#101218',
      backgroundImage: 'none',
      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.5)',
      overflow: 'hidden',
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
    backgroundColor: 'rgba(61, 232, 160, 0.1)',
    border: '1px solid rgba(61, 232, 160, 0.25)',
    boxShadow: '0 0 12px rgba(61, 232, 160, 0.1)',
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
      backgroundColor: 'rgba(255, 255, 255, 0.02)',
    },
  },
  yearCardSelected: {
    borderColor: theme.palette.primary.main,
    backgroundColor: 'rgba(91, 127, 255, 0.08)',
    '&:hover': {
      borderColor: theme.palette.primary.main,
      backgroundColor: 'rgba(91, 127, 255, 0.12)',
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
    boxShadow: '0 4px 12px rgba(61, 232, 160, 0.2)',
    '&:hover': {
      boxShadow: '0 6px 16px rgba(61, 232, 160, 0.3)',
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
      backgroundColor: 'rgba(255, 255, 255, 0.03)',
    },
  },
}))

export default function ExportModal({ categories, onClose }) {
  const { classes, cx } = useStyles()
  const currentYear = new Date().getFullYear()
  const [selectedYears, setSelectedYears] = useState([String(currentYear)])
  const [availableYears, setAvailableYears] = useState([])
  const [allData, setAllData] = useState({ expenses: [], income: [] })
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [fileType, setFileType] = useState('pdf')

  useEffect(() => {
    async function loadYears() {
      try {
        const t = getToken()
        const { fetchExpenses, fetchIncome } = await import('../api/sheets')
        const [exps, inc] = await Promise.all([
          fetchExpenses(null, t),
          fetchIncome(null, t)
        ])
        
        const years = new Set([currentYear])
        exps.forEach(e => years.add(parseInt(e.year)))
        inc.forEach(i => years.add(parseInt(i.year)))
        
        const sorted = Array.from(years).sort((a,b) => a - b).map(String)
        setAvailableYears(sorted)
        setAllData({ expenses: exps, income: inc })
      } catch (e) {
        toast.error('Failed to load years: ' + e.message)
      } finally {
        setLoading(false)
      }
    }
    loadYears()
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
      toast.loading(fileType === 'excel' ? 'Generating Excel...' : 'Generating PDF...', { id: toastId })
      if (fileType === 'excel') {
        const { exportToExcel } = await import('../utils/exportExcel')
        const buffer = await exportToExcel(categories, allData.expenses, allData.income, selectedYears)
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
        const { saveAs } = await import('file-saver')
        saveAs(blob, `budget_report_${selectedYears.join('_')}.xlsx`)
        toast.success('✅ Excel Downloaded!', { id: toastId })
      } else {
        const { exportToPdf } = await import('../utils/exportPdf')
        await exportToPdf(categories, allData.expenses, allData.income, selectedYears)
        toast.success('✅ PDF Downloaded!', { id: toastId })
      }
      onClose()
    } catch (e) {
      console.error(e)
      toast.error('Export failed: ' + e.message)
    } finally {
      setBusy(false)
    }
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
          Download Budget
        </Typography>

        {loading ? (
          <Box className={classes.loadingBox}>
            <CircularProgress size={36} color="primary" />
            <Typography variant="body2" className={classes.loadingText}>
              Scanning your spreadsheet for years...
            </Typography>
          </Box>
        ) : (
          <>
            {/* Description */}
            <Typography variant="body2" className={classes.description}>
              Select which year's budget sheets to include in your {fileType === 'excel' ? 'Excel' : 'PDF'} file.
            </Typography>

            {/* File Type selector */}
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 700,
                mb: 1.5,
                alignSelf: 'flex-start',
                color: 'text.secondary',
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
            >
              File Type
            </Typography>
            <Box className={classes.grid} sx={{ mb: 3 }}>
              <Box
                onClick={() => setFileType('pdf')}
                className={cx(classes.yearCard, fileType === 'pdf' && classes.yearCardSelected)}
              >
                <Typography
                  variant="subtitle2"
                  className={cx(classes.yearTitle, fileType === 'pdf' && classes.yearTitleSelected)}
                >
                  PDF Report
                </Typography>
                <Typography variant="caption" className={classes.yearSub}>
                  Portable Document
                </Typography>
              </Box>
              <Box
                onClick={() => setFileType('excel')}
                className={cx(classes.yearCard, fileType === 'excel' && classes.yearCardSelected)}
              >
                <Typography
                  variant="subtitle2"
                  className={cx(classes.yearTitle, fileType === 'excel' && classes.yearTitleSelected)}
                >
                  Excel Spreadsheet
                </Typography>
                <Typography variant="caption" className={classes.yearSub}>
                  Editable Data (.xlsx)
                </Typography>
              </Box>
            </Box>

            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 700,
                mb: 1.5,
                alignSelf: 'flex-start',
                color: 'text.secondary',
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
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
                disabled={busy}
                startIcon={<FileDownloadOutlinedIcon />}
                className={cx(classes.exportBtn, classes.exportBtnLocal)}
              >
                {busy ? 'Processing...' : (fileType === 'excel' ? 'Download Excel' : 'Download PDF')}
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
          </>
        )}
      </Box>
    </Dialog>
  )
}
