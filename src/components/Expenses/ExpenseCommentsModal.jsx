import { useState, useEffect, useRef } from 'react'
import {
  Dialog, DialogTitle, DialogContent, Box, Typography,
  TextField, Button, IconButton, Divider
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import ChatBubbleOutlinedIcon from '@mui/icons-material/ChatBubbleOutlined'
import DeleteIcon from '@mui/icons-material/Delete'
import { parseComments } from '../../utils/comments'
import { useExpenseCommentsModalUi } from './styles/ExpenseCommentsModal.styles'

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
  const { classes: ui, cx: uiCx } = useExpenseCommentsModalUi()
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
          background: 'var(--surface2)',
          border: '1px solid rgb(var(--ink-rgb) / 0.1)',
          borderRadius: '16px',
          color: 'var(--text)',
          mx: 2
        }
      }}
    >
      <DialogTitle className={ui.dialogTitle1}>
        <ChatBubbleOutlinedIcon className={ui.chatBubbleOutlinedIcon1} />
        <Box className={ui.box1}>
          <Typography className={ui.typography1}>Comments</Typography>
          <Typography className={ui.typography2}>
            {expense?.itemName}
          </Typography>
        </Box>
        <IconButton className={ui.iconButton1} size="small" onClick={onClose} disabled={saving}>
          <CloseIcon className={ui.closeIcon1} />
        </IconButton>
      </DialogTitle>

      <Divider className={ui.divider1} />

      <DialogContent className={ui.dialogContent1} ref={listRef}>
        {comments.length === 0 ? (
          <Typography className={ui.typography3}>
            {canEdit ? 'No comments yet — add a note below' : 'No comments'}
          </Typography>
        ) : (
          <Box className={ui.box2}>
            {comments.map((c, i) => (
              <Box className={ui.box3} key={c.ts || `legacy-${i}`}>
                <Typography className={uiCx(ui.commentText, canEdit && ui.commentTextEditable)}>
                  {c.text}
                </Typography>
                <Typography className={ui.typography4}>
                  {fmtTs(c.ts)}
                </Typography>
                {canEdit && (confirmIdx === i ? (
                  <Button className={ui.button1}
                    size="small"
                    onClick={() => handleDelete(i)}
                    onBlur={() => setConfirmIdx(null)}
                    autoFocus
                    disabled={saving}
                  >
                    Delete?
                  </Button>
                ) : (
                  <IconButton
                    className={uiCx("comment-delete", ui.iconButton2)}
                    size="small"
                    aria-label="Delete comment"
                    onClick={() => handleDelete(i)}
                    disabled={saving}
                  >
                    <DeleteIcon className={ui.deleteIcon1} />
                  </IconButton>
                ))}
              </Box>
            ))}
          </Box>
        )}
      </DialogContent>

      <Divider className={ui.divider2} />

      {!canEdit ? (
        <Typography className={ui.typography5}>
          {readOnlyNote}
        </Typography>
      ) : (
      <Box className={ui.box4}>
        <TextField className={ui.textField1}
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
        />
        <Button className={ui.button2}
          variant="contained"
          onClick={handleAdd}
          disabled={saving || !text.trim()}
        >
          {saving ? '…' : 'Add'}
        </Button>
      </Box>
      )}
    </Dialog>
  )
}
