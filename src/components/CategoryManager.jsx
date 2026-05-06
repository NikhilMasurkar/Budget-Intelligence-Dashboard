import React, { useState } from 'react'

export default function CategoryManager({ categories, onEdit, onDelete, onReorder, canEdit }) {
  const [reordering, setReordering] = useState(false)
  const [localCats, setLocalCats] = useState(categories)

  // Sync when categories prop changes (after save, etc.)
  const catsToShow = reordering ? localCats : categories

  const startReorder = () => {
    setLocalCats([...categories])
    setReordering(true)
  }

  const moveItem = (fromIdx, toIdx) => {
    const updated = [...localCats]
    const [moved] = updated.splice(fromIdx, 1)
    updated.splice(toIdx, 0, moved)
    setLocalCats(updated)
  }

  const saveOrder = () => {
    onReorder(localCats)
    setReordering(false)
  }

  const cancelReorder = () => {
    setReordering(false)
  }

  return (
    <div>
      {/* Reorder toggle button */}
      {canEdit && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {reordering ? (
            <>
              <button className="btn btn-primary" onClick={saveOrder}>💾 Save Order</button>
              <button className="btn btn-ghost" onClick={cancelReorder}>Cancel</button>
            </>
          ) : (
            <button className="btn btn-ghost" onClick={startReorder}>↕️ Reorder</button>
          )}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {catsToShow.length === 0 && <div style={{ color: 'var(--text3)', padding: 20 }}>No categories yet. Add one!</div>}
        {catsToShow.map((cat, idx) => (
          <div key={cat.id} style={{
            background: 'var(--surface2)', border: reordering ? '1px dashed var(--accent)' : '1px solid var(--border)',
            borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12,
            transition: 'border 0.2s',
          }}>
            {/* Reorder arrows — only in reorder mode */}
            {reordering && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
                <button className="btn btn-ghost" style={{ padding: '2px 6px', fontSize: 10, lineHeight: 1, opacity: idx === 0 ? 0.25 : 1 }}
                  disabled={idx === 0} onClick={() => moveItem(idx, idx - 1)} title="Move up">▲</button>
                <button className="btn btn-ghost" style={{ padding: '2px 6px', fontSize: 10, lineHeight: 1, opacity: idx === catsToShow.length - 1 ? 0.25 : 1 }}
                  disabled={idx === catsToShow.length - 1} onClick={() => moveItem(idx, idx + 1)} title="Move down">▼</button>
              </div>
            )}
            {/* Color dot */}
            <div style={{ width: 36, height: 36, borderRadius: 8, background: (cat.color||'#6c8fff')+'33', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
              <div style={{ width: 14, height: 14, borderRadius: '50%', background: cat.color || '#6c8fff' }} />
            </div>
            {/* Name + type */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14, wordBreak: 'break-word' }}>{cat.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 }}>{cat.type}</div>
            </div>
            {/* Edit / Delete — hidden during reorder */}
            {canEdit && !reordering && (
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: 12 }} onClick={() => onEdit(cat)}>✏️</button>
                <button className="btn btn-danger" style={{ padding: '4px 8px', fontSize: 12 }} onClick={() => onDelete(cat.id)}>🗑</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
