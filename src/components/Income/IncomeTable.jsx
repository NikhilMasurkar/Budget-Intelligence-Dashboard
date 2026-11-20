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
    <Box className={ui.box1}>
      {/* Summary header */}
      <Box className={ui.box2}>
        <TrendingUpIcon className={ui.trendingUpIcon1} />
        <Typography className={ui.typography1}>
          {income.length} {income.length === 1 ? 'entry' : 'entries'} · Total{' '}
          <Box className={ui.box3} component="span">
            {fmt(total)}
          </Box>
        </Typography>
      </Box>

      {/* Card list */}
      {income.length === 0 ? (
        <Box className={ui.box4}>
          No income entries yet. Add one!
        </Box>
      ) : (
        <Box className={ui.box5}>
          {income.map(i => (
            <Box key={i.id} className={ui.incomeRow}>
              <Box className={ui.box6}>
                <Typography className={ui.typography2}>
                  {i.source}
                </Typography>
                {i.date && (
                  <Typography className={ui.typography3}>
                    {new Date(i.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </Typography>
                )}
              </Box>
              <Typography className={ui.typography4}>
                {fmt(i.amount)}
              </Typography>
              {canEdit && (
                <>
                  <Tooltip title="Edit" arrow>
                    <IconButton className={ui.iconButton1} size="small" onClick={() => onEdit(i)}
                     >
                      <EditOutlinedIcon className={ui.editOutlinedIcon1} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete" arrow>
                    <IconButton className={ui.iconButton2} size="small" onClick={() => onDelete(i)}
                     >
                      <DeleteOutlinedIcon className={ui.deleteOutlinedIcon1} />
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
