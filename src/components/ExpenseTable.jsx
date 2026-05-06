import React, { useState } from 'react'
const fmt = n => '₹' + Math.round(+n || 0).toLocaleString('en-IN')

export default function ExpenseTable({ expenses, categories, onEdit, onDelete, canEdit }) {
  const [search, setSearch] = useState('')
  const catMap = Object.fromEntries(categories.map(c => [c.id, c]))
  const catOrder = new Map(categories.map((c, i) => [c.id, i]))

  const filtered = expenses.filter(e =>
    e.itemName?.toLowerCase().includes(search.toLowerCase()) ||
    catMap[e.categoryId]?.name?.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => {
    const orderA = catOrder.has(a.categoryId) ? catOrder.get(a.categoryId) : 999;
    const orderB = catOrder.has(b.categoryId) ? catOrder.get(b.categoryId) : 999;
    return orderA - orderB;
  })

  const total = filtered.reduce((s, e) => s + (+e.amount || 0), 0)

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
        <input type="text" placeholder="Search expenses…" value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 240 }} />
        <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--text2)' }}>{filtered.length} items · Total: <strong style={{ color: 'var(--text)' }}>{fmt(total)}</strong></span>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>
            {['Item Name','Category','Amount','Fixed?','Actions'].map(h => (
              <th key={h} style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.7, color: 'var(--text3)', fontWeight: 600, padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>No expenses this month. Add one!</td></tr>
            )}
            {filtered.map(e => {
              const cat = catMap[e.categoryId]
              return (
                <tr key={e.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ fontWeight: 500 }}>{e.itemName}</div>
                    {e.note && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>💬 {e.note}</div>}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    {cat ? <span style={{ background: (cat.color||'#6c8fff')+'22', color: cat.color||'#6c8fff', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>{cat.name}</span>
                         : <span style={{ color: 'var(--text3)', fontSize: 12 }}>{e.categoryId || '—'}</span>}
                  </td>
                  <td style={{ padding: '10px 12px', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{fmt(e.amount)}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 4, background: e.isFixed === 'TRUE' ? 'rgba(91,127,255,0.12)' : 'transparent', color: e.isFixed === 'TRUE' ? 'var(--accent)' : 'var(--text3)' }}>
                      {e.isFixed === 'TRUE' ? '🔒 Fixed' : '—'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    {canEdit && (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => onEdit(e)}>✏️ Edit</button>
                        <button className="btn btn-danger" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => onDelete(e)}>🗑</button>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
