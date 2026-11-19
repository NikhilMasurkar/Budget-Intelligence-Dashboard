import React, { useState, useEffect, useRef } from 'react'
import {
  Dialog, DialogTitle, DialogContent, Box, Typography,
  TextField, Button, IconButton, Divider
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import ChatBubbleOutlinedIcon from '@mui/icons-material/ChatBubbleOutlined'
import DeleteIcon from '@mui/icons-material/Delete'
import { parseComments } from '../../utils/comments'

// Re-exported for existing importers; the implementation lives in utils/comments.
export { parseComments }

function fmtTs(ts) {
  if (!ts) return 'Earlier note'
  return new Date(ts).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

export default function ExpenseCommentsModal({ expense, onClose, onSave, saving, canEdit = true, readOnlyNote = '🔒 This year is locked — comments are read-only' }) {
  const [text, setText] = useState('')
  const [confirmIdx, setConfirmIdx] = useState(null)   // comment awaiting a second tap to delete
  const comments = parseComments(expense?.note)
  const listRef = useRef(null)

  // Keep the newest comment in view, including right after adding one.
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
  }, [comments.length])

  const handleAdd = async () => {
    if (!text.trim() || saving) return
    const updated = [...comments, { text: text.trim(), ts: Date.now() }]
    try {
      await onSave(expense, JSON.stringify(updated))
      setText('')                 // only once it is saved — a failed save keeps the typing
    } catch { /* the save already showed an error toast */ }
  }

  // Two taps: the first arms the button, the second deletes. There is no undo.
  const handleDelete = async (idx) => {
    if (saving) return
    if (confirmIdx !== idx) { setConfirmIdx(idx); return }
    setConfirmIdx(null)
    try {
      await onSave(expense, JSON.stringify(comments.filter((_, i) => i !== idx)))
    } catch { /* toast already shown */ }
  }

  return (
    <Dialog
      open={true}
      onClose={saving ? undefined : onClose}
      fullWidth
      maxWidth="xs"
      PaperProps={{
        sx: {
          background: '#181b28',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '16px',
          color: '#e4e8f5',
          mx: 2
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1, pt: 2, fontSize: 15, fontWeight: 700 }}>
        <ChatBubbleOutlinedIcon sx={{ fontSize: 18, color: '#5b7fff', flexShrink: 0 }} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: 15, fontWeight: 700, color: '#e4e8f5', lineHeight: 1.2 }}>Comments</Typography>
          <Typography sx={{ fontSize: 11, color: '#8891b8', mt: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {expense?.itemName}
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose} disabled={saving} sx={{ color: '#8891b8', flexShrink: 0 }}>
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </DialogTitle>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

      <DialogContent ref={listRef} sx={{ px: 2, py: 1.5, overflowY: 'auto', minHeight: 100, maxHeight: 320 }}>
        {comments.length === 0 ? (
          <Typography sx={{ fontSize: 13, color: '#5a6080', fontStyle: 'italic', textAlign: 'center', py: 4 }}>
            {canEdit ? 'No comments yet — add a note below' : 'No comments'}
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {comments.map((c, i) => (
              <Box key={c.ts || `legacy-${i}`} sx={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '10px',
                padding: '10px 12px',
                position: 'relative',
                '&:hover .comment-delete': { opacity: 1 }
              }}>
                <Typography sx={{ fontSize: 13, color: '#e4e8f5', lineHeight: 1.5, wordBreak: 'break-word', whiteSpace: 'pre-wrap', pr: canEdit ? '36px' : 0 }}>
                  {c.text}
                </Typography>
                <Typography sx={{ fontSize: 10, color: '#5a6080', mt: '4px' }}>
                  {fmtTs(c.ts)}
                </Typography>
                {canEdit && (confirmIdx === i ? (
                  <Button
                    size="small"
                    onClick={() => handleDelete(i)}
                    onBlur={() => setConfirmIdx(null)}
                    autoFocus
                    disabled={saving}
                    sx={{
                      position: 'absolute', top: 6, right: 6, minWidth: 0, px: '8px', py: '2px',
                      fontSize: 11, fontWeight: 700, textTransform: 'none', borderRadius: '6px',
                      color: '#fff', background: '#e05555', '&:hover': { background: '#c94444' }
                    }}
                  >
                    Delete?
                  </Button>
                ) : (
                  <IconButton
                    className="comment-delete"
                    size="small"
                    aria-label="Delete comment"
                    onClick={() => handleDelete(i)}
                    disabled={saving}
                    sx={{
                      position: 'absolute', top: 4, right: 4,
                      // Hover-reveal on desktop; always shown on touch screens,
                      // which have no hover and could never find it otherwise.
                      opacity: 0, '@media (hover: none)': { opacity: 1 },
                      transition: 'opacity 0.15s',
                      color: '#5a6080',
                      '&:hover': { color: '#e05555', background: 'rgba(224,85,85,0.1)' },
                      p: '6px'
                    }}
                  >
                    <DeleteIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                ))}
              </Box>
            ))}
          </Box>
        )}
      </DialogContent>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

      {!canEdit ? (
        <Typography sx={{ px: 2, py: 1.5, fontSize: 12, color: '#5a6080', textAlign: 'center' }}>
          {readOnlyNote}
        </Typography>
      ) : (
      <Box sx={{ px: 2, py: 1.5, display: 'flex', gap: 1, alignItems: 'flex-end' }}>
        <TextField
          // Straight to typing when there is nothing to read yet; otherwise
          // don't throw a phone keyboard over the thread.
          autoFocus={comments.length === 0}
          placeholder="Add a comment…"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAdd() } }}
          multiline
          maxRows={3}
          size="small"
          fullWidth
          disabled={saving}
          sx={{
            '& .MuiOutlinedInput-root': {
              background: 'rgba(255,255,255,0.04)',
              fontSize: 13,
              color: '#e4e8f5',
              '& fieldset': { borderColor: 'rgba(255,255,255,0.12)' },
              '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
              '&.Mui-focused fieldset': { borderColor: '#5b7fff' }
            },
            '& .MuiOutlinedInput-input': { color: '#e4e8f5' },
            '& .MuiOutlinedInput-input::placeholder': { color: '#5a6080' }
          }}
        />
        <Button
          variant="contained"
          onClick={handleAdd}
          disabled={saving || !text.trim()}
          sx={{
            minWidth: 56, fontSize: 12, fontWeight: 700, textTransform: 'none',
            borderRadius: '8px', px: 2, height: 36, flexShrink: 0,
            background: '#5b7fff', '&:hover': { background: '#4a6def' },
            '&.Mui-disabled': { background: 'rgba(91,127,255,0.3)', color: 'rgba(255,255,255,0.3)' }
          }}
        >
          {saving ? '…' : 'Add'}
        </Button>
      </Box>
      )}
    </Dialog>
  )
}
