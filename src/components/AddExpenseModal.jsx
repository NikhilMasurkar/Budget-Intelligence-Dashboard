import React, { useState } from 'react'
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function AddExpenseModal({ initial, categories, year, month, onSave, onClose }) {
  const [form, setForm] = useState({
    id: initial?.id || '',
    year: initial?.year || year,
    month: initial?.month || month,
    categoryId: initial?.categoryId || categories[0]?.id || '',
    itemName: initial?.itemName || '',
    amount: initial?.amount || '',
    isFixed: initial?.isFixed === 'TRUE' || false,
    note: initial?.note || '',
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const valid = form.itemName.trim() && form.amount && form.categoryId

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">{form.id ? '✏️ Edit Expense' : '+ Add Expense'}</div>
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
            <label style={lbl}>Category</label>
            <select value={form.categoryId} onChange={e => set('categoryId', e.target.value)}>
              <option value="">-- Select Category --</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Item Name</label>
            <input type="text" value={form.itemName} onChange={e => set('itemName', e.target.value)} placeholder="e.g. Electricity Bill" />
          </div>
          <div>
            <label style={lbl}>Amount (₹)</label>
            <input type="number" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="0" min="0" />
          </div>
          <div>
            <label style={lbl}>Note (Optional - Exported as Excel comment)</label>
            <input type="text" value={form.note} onChange={e => set('note', e.target.value)} placeholder="e.g. 20k given to Ramesh" />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '10px 12px', background: 'var(--surface2)', borderRadius: 8, border: '1px solid var(--border)' }}>
            <input type="checkbox" checked={form.isFixed} onChange={e => set('isFixed', e.target.checked)}
              style={{ width: 16, height: 16, accentColor: 'var(--accent)', cursor: 'pointer' }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>🔒 Fixed Expense</div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>Auto-copy to next month</div>
            </div>
          </label>
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button className="btn btn-primary" style={{ flex: 1 }} disabled={!valid} onClick={() => onSave(form)}>
              {form.id ? 'Update' : 'Add Expense'}
            </button>
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  )
}

const lbl = { display: 'block', fontSize: 11, color: 'var(--text3)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.7, fontWeight: 600 }
