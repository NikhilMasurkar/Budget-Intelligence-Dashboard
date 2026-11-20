import { memo } from 'react'
import { Box, Typography, IconButton, Tooltip, Checkbox } from '@mui/material'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import ChatBubbleOutlinedIcon from '@mui/icons-material/ChatBubbleOutlined'
import { fmt } from '../../utils/constants'
import { parseComments } from './ExpenseCommentsModal'

// One expense line inside a category: name, latest comment, badges, amount,
// and the comment / edit / delete actions.

function fmtUpdated(raw) {
  if (!raw) return null
  const s = String(raw)
  if (!s.startsWith('U')) return null
  const ms = +s.slice(1)
  if (!ms || isNaN(ms)) return null
  const diffMs = Date.now() - ms
  const diffMins = Math.floor(diffMs / 60000)
  const diffHrs = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHrs < 24) return `${diffHrs}h ago`
  if (diffDays === 1) return 'yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  return new Date(ms).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

// Custom comparator: expense objects are always new refs after loadAll (rebuilt via .map()),
// so we compare individual field values instead of the object reference.
function areRowPropsEqual(prev, next) {
  return (
    prev.exp.id === next.exp.id &&
    prev.exp.amount === next.exp.amount &&
    prev.exp.itemName === next.exp.itemName &&
    prev.exp.isFixed === next.exp.isFixed &&
    prev.exp.note === next.exp.note &&
    prev.exp.updatedAt === next.exp.updatedAt &&
    prev.exp.pending === next.exp.pending &&
    prev.isSelected === next.isSelected &&
    prev.canEdit === next.canEdit &&
    prev.onToggle === next.onToggle &&
    prev.onComment === next.onComment &&
    prev.onEdit === next.onEdit &&
    prev.onDelete === next.onDelete
  )
}

const ExpenseRow = memo(function ExpenseRow({ exp, classes, canEdit, isSelected, onToggle, onComment, onEdit, onDelete }) {
  const comments = parseComments(exp.note)
  const commentCount = comments.length
  const lastComment = comments[commentCount - 1]?.text
  const updated = fmtUpdated(exp.updatedAt)
  return (
    <Box className={classes.expenseRow}
      sx={isSelected ? { background: 'rgb(var(--accent-rgb) / 0.06)' } : undefined}>
      {canEdit && (
        <Checkbox
          size="small"
          checked={isSelected}
          onChange={e => onToggle(exp.id, e.target.checked)}
          sx={{ p: { xs: '8px', sm: 0 }, mr: '2px', color: 'var(--line)', '&.Mui-checked': { color: 'var(--accent)' } }}
        />
      )}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography className={classes.expenseName} sx={{ flex: 'unset' }}>{exp.itemName}</Typography>
        {/* Latest note right under the name, so it's readable without opening the thread. */}
        {lastComment && (
          <Typography
            onClick={() => onComment(exp)}
            sx={{
              fontSize: 11, color: 'var(--text2)', lineHeight: 1.4, cursor: 'pointer',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}
          >
            💬 {lastComment}
          </Typography>
        )}
        {updated && (
          <Typography sx={{ fontSize: 10, color: 'var(--line)', display: 'block', lineHeight: 1.4 }}>
            Updated {updated}
          </Typography>
        )}
      </Box>
      {exp.isFixed === 'TRUE' && (
        <Box component="span" className={classes.fixedBadge}>📌</Box>
      )}
      {+exp.amount < 0 && (
        <Box component="span" className={classes.withdrawBadge}>↓ WITHDRAWN</Box>
      )}
      {exp.pending && (
        <Tooltip title="Added offline — saved on this phone, goes to your sheet when you're back online" arrow>
          <Box component="span" sx={{
            fontSize: 10, fontWeight: 700, color: 'var(--warn)', whiteSpace: 'nowrap',
            background: 'rgb(var(--warn-rgb) / 0.12)', border: '1px solid rgb(var(--warn-rgb) / 0.35)',
            borderRadius: '6px', px: '6px', py: '1px',
          }}>⏳ Not synced</Box>
        </Tooltip>
      )}
      <Typography
        className={classes.expenseAmount}
        sx={+exp.amount < 0 ? { color: 'var(--danger-soft)' } : undefined}
      >
        {fmt(exp.amount)}
      </Typography>
      {!exp.pending && (
      <Tooltip title={commentCount > 0 ? `${commentCount} comment${commentCount !== 1 ? 's' : ''}` : 'Add comment'} arrow>
        <IconButton
          size="small"
          onClick={() => onComment(exp)}
          sx={{
            p: { xs: '9px', sm: '3px' }, position: 'relative',
            color: commentCount > 0 ? 'var(--accent)' : 'var(--text3)',
            '&:hover': { color: 'var(--accent)', background: 'rgb(var(--accent-rgb) / 0.1)' }
          }}
        >
          <ChatBubbleOutlinedIcon sx={{ fontSize: { xs: 18, sm: 14 } }} />
          {commentCount > 0 && (
            <Box component="span" sx={{
              position: 'absolute', top: 0, right: 0,
              fontSize: 8, fontWeight: 800, lineHeight: 1,
              background: 'var(--accent)', color: '#fff',
              borderRadius: '50%', width: 12, height: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {commentCount > 9 ? '9+' : commentCount}
            </Box>
          )}
        </IconButton>
      </Tooltip>
      )}
      {canEdit && (
        <>
          <Tooltip title="Edit" arrow>
            <IconButton size="small" className={classes.rowAction} onClick={() => onEdit(exp)}>
              <EditOutlinedIcon sx={{ fontSize: { xs: 18, sm: 14 } }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete" arrow>
            <IconButton size="small" className={classes.rowDelete} onClick={() => onDelete(exp)}>
              <DeleteOutlinedIcon sx={{ fontSize: { xs: 18, sm: 14 } }} />
            </IconButton>
          </Tooltip>
        </>
      )}
    </Box>
  )
}, areRowPropsEqual)

export default ExpenseRow
