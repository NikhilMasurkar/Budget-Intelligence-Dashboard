import React, { useState } from 'react'
import {
  Dialog, DialogTitle, DialogContent, Box, Typography,
  TextField, Button, IconButton, Divider
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import ChatBubbleOutlinedIcon from '@mui/icons-material/ChatBubbleOutlined'

export function parseComments(note) {
  if (!note) return []
  const s = String(note).trim()
  if (s.startsWith('[')) {
    try { return JSON.parse(s) } catch { /* fall through */ }
  }
  if (s) return [{ text: s, ts: 0 }]
  return []
}

function fmtTs(ts) {
  if (!ts) return 'Earlier note'
  return new Date(ts).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

export default function ExpenseCommentsModal({ expense, onClose, onSave, saving }) {
  const [text, setText] = useState('')
  const comments = parseComments(expense?.note)

  const handleAdd = () => {
    if (!text.trim() || saving) return
    const updated = [...comments, { text: text.trim(), ts: Date.now() }]
    onSave(expense, JSON.stringify(updated))
    setText('')
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

      <DialogContent sx={{ px: 2, py: 1.5, overflowY: 'auto', minHeight: 100, maxHeight: 320 }}>
        {comments.length === 0 ? (
          <Typography sx={{ fontSize: 13, color: '#5a6080', fontStyle: 'italic', textAlign: 'center', py: 4 }}>
            No comments yet
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {comments.map((c, i) => (
              <Box key={i} sx={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '10px',
                padding: '10px 12px'
              }}>
                <Typography sx={{ fontSize: 13, color: '#e4e8f5', lineHeight: 1.5, wordBreak: 'break-word' }}>
                  {c.text}
                </Typography>
                <Typography sx={{ fontSize: 10, color: '#5a6080', mt: '4px' }}>
                  {fmtTs(c.ts)}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </DialogContent>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

      <Box sx={{ px: 2, py: 1.5, display: 'flex', gap: 1, alignItems: 'flex-end' }}>
        <TextField
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
    </Dialog>
  )
}
