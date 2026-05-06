import React, { useState } from 'react'
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const SOURCES = ['Salary', 'Freelance', 'Dividend', 'ITR Return', 'Other']

export default function AddIncomeModal({ initial, year, month, onSave, onClose }) {
  const [form, setForm] = useState({
    id: initial?.id || '',
    year: initial?.year || year,
    month: initial?.month || month,
    source: initial?.source || 'Salary',
    amount: initial?.amount || '',
  })
  // applyMode: 'single' | 'all_year' | 'this_and_forward'
  const [applyMode, setApplyMode] = useState('single')
  const [customSrc, setCustomSrc] = useState(
    initial?.source && !SOURCES.includes(initial.source) ? initial.source : ''
  )
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = () => {
    onSave(form, applyMode)
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 420 }}>
        <div className="modal-title" style={{ textAlign: 'center' }}>{form.id ? '✏️ Edit Income' : '+ Add Income'}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="grid-2">
            <div>
              <label style={lbl}>Year</label>
              <select value={form.year} onChange={e => set('year', e.target.value)}>
                {[2026, 2027].map(y => <option key={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Month</label>
              <select value={form.month} onChange={e => set('month', +e.target.value)}>
                {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={lbl}>Source</label>
            <select value={SOURCES.includes(form.source) ? form.source : 'Other'} onChange={e => {
              if (e.target.value === 'Other') { set('source', customSrc) }
              else { set('source', e.target.value); setCustomSrc('') }
            }}>
              {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          {!SOURCES.includes(form.source) && (
            <div>
              <label style={lbl}>Custom Source</label>
              <input type="text" value={form.source} onChange={e => { set('source', e.target.value); setCustomSrc(e.target.value) }} placeholder="Enter your source" autoFocus />
            </div>
          )}
          <div>
            <label style={lbl}>Amount (₹)</label>
            <input type="number" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="0" min="0" />
          </div>

          {/* Apply mode */}
          <div>
            <label style={lbl}>Apply to</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { value: 'single', label: 'This month only' },
                { value: 'all_year', label: 'Whole year' },
                { value: 'this_and_forward', label: `${MONTHS[(form.month || 1) - 1]} → Dec` },
              ].map(opt => (
                <button key={opt.value} type="button"
                  className={applyMode === opt.value ? 'btn btn-primary' : 'btn btn-ghost'}
                  style={{ padding: '5px 12px', fontSize: 12 }}
                  onClick={() => setApplyMode(opt.value)}
                >{opt.label}</button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
            <button className="btn btn-primary" style={{ width: '100%', padding: '10px 14px', fontSize: 14 }} disabled={!form.source || !form.amount} onClick={handleSave}>
              {form.id ? '✅ Update Income' : '+ Add Income'}
            </button>
            <button className="btn btn-ghost" style={{ padding: '8px 12px', fontSize: 13 }} onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  )
}

const lbl = { display: 'block', fontSize: 11, color: 'var(--text3)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.7, fontWeight: 600 }
