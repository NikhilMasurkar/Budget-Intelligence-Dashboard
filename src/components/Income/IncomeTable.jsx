import React from 'react'
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
        background: 'rgba(82,183,136,0.06)',
        border: '1px solid rgba(82,183,136,0.2)',
        borderRadius: '10px'
      }}>
        <TrendingUpIcon sx={{ fontSize: 18, color: '#3de8a0' }} />
        <Typography sx={{ fontSize: 13, color: '#8891b8' }}>
          {income.length} {income.length === 1 ? 'entry' : 'entries'} · Total{' '}
          <Box component="span" sx={{ color: '#3de8a0', fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
            {fmt(total)}
          </Box>
        </Typography>
      </Box>

      {/* Card list */}
      {income.length === 0 ? (
        <Box sx={{
          textAlign: 'center', py: 6, color: '#5a6080', fontSize: 13, fontStyle: 'italic',
          border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '12px'
        }}>
          No income entries yet. Add one!
        </Box>
      ) : (
        <Box sx={{
          display: 'flex', flexDirection: 'column',
          border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', overflow: 'hidden'
        }}>
          {income.map((i, idx) => (
            <Box
              key={i.id}
              sx={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '12px 16px',
                background: '#101218',
                borderTop: idx === 0 ? 'none' : '1px solid rgba(255,255,255,0.04)',
                '&:hover': { background: 'rgba(255,255,255,0.015)' },
                transition: 'background 0.12s'
              }}
            >
              <Typography sx={{
                flex: 1, minWidth: 0, fontWeight: 600, fontSize: '13.5px', color: '#e4e8f5',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
              }}>
                {i.source}
              </Typography>
              <Typography sx={{
                fontWeight: 700, fontSize: '14px', color: '#3de8a0',
                fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap'
              }}>
                {fmt(i.amount)}
              </Typography>
              {canEdit && (
                <>
                  <Tooltip title="Edit" arrow>
                    <IconButton size="small" onClick={() => onEdit(i)}
                      sx={{ color: '#8891b8', p: '4px', '&:hover': { color: '#5b7fff', background: 'rgba(91,127,255,0.1)' } }}>
                      <EditOutlinedIcon sx={{ fontSize: 15 }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete" arrow>
                    <IconButton size="small" onClick={() => onDelete(i)}
                      sx={{ color: '#8891b8', p: '4px', '&:hover': { color: '#ff5f5f', background: 'rgba(255,95,95,0.1)' } }}>
                      <DeleteOutlinedIcon sx={{ fontSize: 15 }} />
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
