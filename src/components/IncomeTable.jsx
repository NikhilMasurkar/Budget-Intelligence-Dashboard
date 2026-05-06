import React from 'react'
const fmt = n => '₹' + Math.round(+n || 0).toLocaleString('en-IN')

export default function IncomeTable({ income, onEdit, onDelete, canEdit }) {
  const total = income.reduce((s, i) => s + (+i.amount || 0), 0)
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
      <div style={{ marginBottom: 12, textAlign: 'right', fontSize: 13, color: 'var(--text2)' }}>
        {income.length} entries · Total: <strong style={{ color: 'var(--text)' }}>{fmt(total)}</strong>
      </div>
      <div className="table-wrap">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>
            {['Source','Amount','Actions'].map(h => (
              <th key={h} style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.7, color: 'var(--text3)', fontWeight: 600, padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {income.length === 0 && <tr><td colSpan={3} style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>No income entries. Add one!</td></tr>}
            {income.map(i => (
              <tr key={i.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '10px 12px', fontWeight: 500 }}>{i.source}</td>
                <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--accent2)', fontVariantNumeric: 'tabular-nums' }}>{fmt(i.amount)}</td>
                <td style={{ padding: '10px 12px' }}>
                  {canEdit && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => onEdit(i)}>✏️ Edit</button>
                      <button className="btn btn-danger" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => onDelete(i)}>🗑</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
