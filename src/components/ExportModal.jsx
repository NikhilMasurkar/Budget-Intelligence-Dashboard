import React, { useState, useEffect } from 'react'
import { getToken } from '../api/sheets'
import toast from 'react-hot-toast'

export default function ExportModal({ categories, mode, onClose }) {
  const currentYear = new Date().getFullYear()
  const [selectedYears, setSelectedYears] = useState([String(currentYear)])
  const [availableYears, setAvailableYears] = useState([])
  const [allData, setAllData] = useState({ expenses: [], income: [] })
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    async function loadYears() {
      try {
        const t = getToken()
        const { fetchExpenses, fetchIncome } = await import('../api/sheets')
        const [exps, inc] = await Promise.all([
          fetchExpenses(null, t),
          fetchIncome(null, t)
        ])
        
        const years = new Set([currentYear, currentYear + 1])
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
      const toastId = mode === 'drive' ? 'drive-export' : 'local-export'
      toast.loading(mode === 'drive' ? 'Uploading to Drive...' : 'Generating Excel...', { id: toastId })

      const t = getToken()
      if (mode === 'drive' && !t) {
        toast.error('Sign in required', { id: toastId })
        setBusy(false)
        return
      }

      const { getUserProfile, uploadExcelToDrive } = await import('../api/sheets')
      const { exportToExcel } = await import('../utils/exportExcel')

      const buffer = await exportToExcel(categories, allData.expenses, allData.income, selectedYears)

      if (mode === 'drive') {
        const profile = await getUserProfile(t)
        const userName = profile.given_name || profile.name || 'User'
        await uploadExcelToDrive(buffer, userName, t)
        toast.success('✅ Saved to Google Drive!', { id: toastId })
      } else {
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'balance_sheet_.xlsx'
        a.click()
        URL.revokeObjectURL(url)
        toast.success('✅ Downloaded!', { id: toastId })
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
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && !busy && onClose()}>
      <div className="modal" style={{ maxWidth: 400, textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>{mode === 'drive' ? '☁️' : '📥'}</div>
        <div className="modal-title" style={{ textAlign: 'center' }}>Export Budget</div>
        
        {loading ? (
          <div style={{ padding: '20px 0' }}>
            <div className="loading-spinner" style={{ margin: '0 auto 10px' }} />
            <p style={{ color: 'var(--text3)', fontSize: 13 }}>Scanning your spreadsheet for years...</p>
          </div>
        ) : (
          <>
            <p style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 20 }}>
              Select which year's budget sheets to include in your Excel file.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 24 }}>
              {availableYears.map(y => (
                <div 
                  key={y} 
                  onClick={() => toggleYear(y)}
                  style={{
                    padding: '12px',
                    borderRadius: 10,
                    border: '2px solid',
                    borderColor: selectedYears.includes(y) ? 'var(--accent)' : 'var(--border)',
                    background: selectedYears.includes(y) ? 'var(--accent-light)' : 'transparent',
                    cursor: 'pointer',
                    fontWeight: 600,
                    transition: 'all 0.2s'
                  }}
                >
                  <span style={{ fontSize: 16, display: 'block' }}>{y}</span>
                  <span style={{ fontSize: 10, opacity: 0.7 }}>{selectedYears.includes(y) ? 'Selected' : 'Include'}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button 
                className="btn btn-primary" 
                style={{ padding: '12px', width: '100%' }} 
                onClick={handleExport}
                disabled={busy}
              >
                {busy ? 'Processing...' : (mode === 'drive' ? 'Upload to Drive' : 'Download Excel')}
              </button>
              <button 
                className="btn btn-ghost" 
                style={{ fontSize: 13 }} 
                onClick={onClose}
                disabled={busy}
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
