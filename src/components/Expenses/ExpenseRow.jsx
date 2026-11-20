import { memo } from 'react'
import { Box, Typography, IconButton, Tooltip, Checkbox } from '@mui/material'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import ChatBubbleOutlinedIcon from '@mui/icons-material/ChatBubbleOutlined'
import { fmt } from '../../utils/constants'
import { parseComments } from './ExpenseCommentsModal'
import { useExpenseRowUi } from './styles/ExpenseRow.styles'

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
    prev.isSelected === next.isSelected &&
    prev.canEdit === next.canEdit &&
    prev.onToggle === next.onToggle &&
    prev.onComment === next.onComment &&
    prev.onEdit === next.onEdit &&
    prev.onDelete === next.onDelete
  )
}

const ExpenseRow = memo(function ExpenseRow({ exp, classes, canEdit, isSelected, onToggle, onComment, onEdit, onDelete }) {
  const { classes: ui, cx: uiCx } = useExpenseRowUi()
  const comments = parseComments(exp.note)
  const commentCount = comments.length
  const lastComment = comments[commentCount - 1]?.text
  const updated = fmtUpdated(exp.updatedAt)
  return (
    <Box className={uiCx(classes.expenseRow, isSelected && ui.rowSelected)}>
      {canEdit && (
        <Checkbox className={ui.selectBox}
          size="small"
          checked={isSelected}
          onChange={e => onToggle(exp.id, e.target.checked)}
        />
      )}
      <Box className={ui.details}>
        <Typography className={uiCx(classes.expenseName, ui.name)}>{exp.itemName}</Typography>
        {/* Latest note right under the name, so it's readable without opening the thread. */}
        {lastComment && (
          <Typography className={ui.lastComment}
            onClick={() => onComment(exp)}
          >
            💬 {lastComment}
          </Typography>
        )}
        {updated && (
          <Typography className={ui.updatedText}>
            Updated {updated}
          </Typography>
        )}
      </Box>
      {exp.isFixed === true && (
        <Box component="span" className={classes.fixedBadge}>📌</Box>
      )}
      {+exp.amount < 0 && (
        <Box component="span" className={classes.withdrawBadge}>↓ WITHDRAWN</Box>
      )}
      <Typography
        className={uiCx(classes.expenseAmount, +exp.amount < 0 && ui.amountNegative)}
      >
        {fmt(exp.amount)}
      </Typography>
      <Tooltip title={commentCount > 0 ? `${commentCount} comment${commentCount !== 1 ? 's' : ''}` : 'Add comment'} arrow>
        <IconButton
          size="small"
          onClick={() => onComment(exp)}
          className={uiCx(ui.commentBtn, commentCount > 0 && ui.commentBtnHas)}
        >
          <ChatBubbleOutlinedIcon className={ui.commentIcon} />
          {commentCount > 0 && (
            <Box className={ui.commentBadge} component="span">
              {commentCount > 9 ? '9+' : commentCount}
            </Box>
          )}
        </IconButton>
      </Tooltip>
      {canEdit && (
        <>
          <Tooltip title="Edit" arrow>
            <IconButton size="small" className={classes.rowAction} onClick={() => onEdit(exp)}>
              <EditOutlinedIcon className={ui.editIcon} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete" arrow>
            <IconButton size="small" className={classes.rowDelete} onClick={() => onDelete(exp)}>
              <DeleteOutlinedIcon className={ui.deleteIcon} />
            </IconButton>
          </Tooltip>
        </>
      )}
    </Box>
  )
}, areRowPropsEqual)

export default ExpenseRow
