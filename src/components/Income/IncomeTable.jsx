import { Box, Typography, IconButton, Tooltip } from '@mui/material'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import { fmt } from '../../utils/constants'
import { useIncomeTableUi } from './styles/IncomeTable.styles'

export default function IncomeTable({ income, onEdit, onDelete, canEdit }) {
  const { classes: ui } = useIncomeTableUi()
  const total = income.reduce((s, i) => s + (+i.amount || 0), 0)

  return (
    <Box className={ui.page}>
      {/* Summary header */}
      <Box className={ui.summary}>
        <TrendingUpIcon className={ui.summaryIcon} />
        <Typography className={ui.summaryText}>
          {income.length} {income.length === 1 ? 'entry' : 'entries'} · Total{' '}
          <Box className={ui.summaryTotal} component="span">
            {fmt(total)}
          </Box>
        </Typography>
      </Box>

      {/* Card list */}
      {income.length === 0 ? (
        <Box className={ui.emptyText}>
          No income entries yet. Add one!
        </Box>
      ) : (
        <Box className={ui.rows}>
          {income.map(i => (
            <Box key={i.id} className={ui.incomeRow}>
              <Box className={ui.rowText}>
                <Typography className={ui.source}>
                  {i.source}
                </Typography>
                {i.date && (
                  <Typography className={ui.date}>
                    {new Date(i.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </Typography>
                )}
              </Box>
              <Typography className={ui.amount}>
                {fmt(i.amount)}
              </Typography>
              {canEdit && (
                <>
                  <Tooltip title="Edit" arrow>
                    <IconButton className={ui.editButton} size="small" onClick={() => onEdit(i)}
                     >
                      <EditOutlinedIcon className={ui.editIcon} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete" arrow>
                    <IconButton className={ui.deleteButton} size="small" onClick={() => onDelete(i)}
                     >
                      <DeleteOutlinedIcon className={ui.deleteIcon} />
                    </IconButton>
                  </Tooltip>
                </>
              )}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  )
}
