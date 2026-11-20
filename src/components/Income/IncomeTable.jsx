import { Box, Typography, IconButton, Tooltip } from '@mui/material'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import { fmt } from '../../utils/constants'

export default function IncomeTable({ income, onEdit, onDelete, canEdit }) {
  const total = income.reduce((s, i) => s + (+i.amount || 0), 0)

  return (
    <Box sx={{ width: '100%' }}>
      {/* Summary header */}
      <Box sx={{
        display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap',
        padding: '10px 16px', marginBottom: '12px',
        background: 'rgb(var(--income-rgb) / 0.06)',
        border: '1px solid rgb(var(--income-rgb) / 0.2)',
        borderRadius: '10px'
      }}>
        <TrendingUpIcon sx={{ fontSize: 18, color: 'var(--accent2)' }} />
        <Typography sx={{ fontSize: 13, color: 'var(--text2)' }}>
          {income.length} {income.length === 1 ? 'entry' : 'entries'} · Total{' '}
          <Box component="span" sx={{ color: 'var(--accent2)', fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
            {fmt(total)}
          </Box>
        </Typography>
      </Box>

      {/* Card list */}
      {income.length === 0 ? (
        <Box sx={{
          textAlign: 'center', py: 6, color: 'var(--text-faint)', fontSize: 13, fontStyle: 'italic',
          border: '1px dashed rgb(var(--ink-rgb) / 0.08)', borderRadius: '12px'
        }}>
          No income entries yet. Add one!
        </Box>
      ) : (
        <Box sx={{
          display: 'flex', flexDirection: 'column',
          border: '1px solid rgb(var(--ink-rgb) / 0.07)', borderRadius: '12px', overflow: 'hidden'
        }}>
          {income.map((i, idx) => (
            <Box
              key={i.id}
              sx={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '12px 16px',
                background: 'var(--bg)',
                borderTop: idx === 0 ? 'none' : '1px solid rgb(var(--ink-rgb) / 0.04)',
                '&:hover': { background: 'rgb(var(--ink-rgb) / 0.015)' },
                transition: 'background 0.12s'
              }}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{
                  fontWeight: 600, fontSize: '13.5px', color: 'var(--text)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                }}>
                  {i.source}
                </Typography>
                {i.date && (
                  <Typography sx={{ fontSize: '11px', color: 'var(--text-faint)', mt: '1px', fontVariantNumeric: 'tabular-nums' }}>
                    {new Date(i.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </Typography>
                )}
              </Box>
              <Typography sx={{
                fontWeight: 700, fontSize: '14px', color: 'var(--accent2)',
                fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', flexShrink: 0
              }}>
                {fmt(i.amount)}
              </Typography>
              {canEdit && (
                <>
                  <Tooltip title="Edit" arrow>
                    <IconButton size="small" onClick={() => onEdit(i)}
                      sx={{ color: 'var(--text2)', p: { xs: '9px', sm: '4px' }, '&:hover': { color: 'var(--accent)', background: 'rgb(var(--accent-rgb) / 0.1)' } }}>
                      <EditOutlinedIcon sx={{ fontSize: { xs: 18, sm: 15 } }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete" arrow>
                    <IconButton size="small" onClick={() => onDelete(i)}
                      sx={{ color: 'var(--text2)', p: { xs: '9px', sm: '4px' }, '&:hover': { color: 'var(--danger)', background: 'rgb(var(--danger-rgb) / 0.1)' } }}>
                      <DeleteOutlinedIcon sx={{ fontSize: { xs: 18, sm: 15 } }} />
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
