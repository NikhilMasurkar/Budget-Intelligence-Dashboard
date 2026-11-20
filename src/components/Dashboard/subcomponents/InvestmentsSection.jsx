import { Box, Typography } from '@mui/material'

export default function InvestmentsSection({ holdings, periodTotal, periodLabel, fmt }) {
  if (!holdings.length) return null

  const balanceTotal = holdings.reduce((s, h) => s + h.balance, 0)
  const COLS = 'minmax(110px, 1.6fr) minmax(92px, 1fr) minmax(92px, 1fr)'

  const Grid = ({ children, sx }) => (
    <Box sx={{ display: 'grid', gridTemplateColumns: COLS, gap: '10px', alignItems: 'baseline', ...sx }}>
      {children}
    </Box>
  )

  const Amount = ({ v, color, weight = 700, size = 14, dim }) => (
    <Typography sx={{
      fontSize: size, fontWeight: weight,
      color: v === 0 && dim ? 'var(--line)' : color,
      fontVariantNumeric: 'tabular-nums', textAlign: 'right', whiteSpace: 'nowrap',
    }}>
      {v === 0 && dim ? '—' : `${v < 0 ? '−' : ''}${fmt(Math.abs(v))}`}
    </Typography>
  )

  const Head = ({ children, align = 'right' }) => (
    <Typography sx={{
      fontSize: 10, fontWeight: 700, color: 'var(--line)',
      letterSpacing: '0.6px', textTransform: 'uppercase', textAlign: align,
    }}>
      {children}
    </Typography>
  )

  return (
    <Box sx={{
      background: 'var(--surface2)', border: '1px solid rgb(var(--ink-rgb) / 0.07)',
      borderRadius: '14px', padding: '18px 20px', mb: '18px', overflowX: 'auto',
    }}>
      <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', mb: '2px' }}>
        Investments
      </Typography>
      <Typography sx={{ fontSize: 11, color: 'var(--text-faint)', mb: '10px' }}>
        Balance includes earlier years — a pot can go down this period and still hold money
      </Typography>

      <Grid sx={{ pb: '8px', borderBottom: '1px solid rgb(var(--ink-rgb) / 0.05)' }}>
        <Head align="left">Investment</Head>
        <Head>{periodLabel || 'This period'}</Head>
        <Head>Balance</Head>
      </Grid>

      {holdings.map(h => (
        <Grid key={h.name} sx={{ py: '9px', borderBottom: '1px solid rgb(var(--ink-rgb) / 0.03)' }}>
          <Typography sx={{
            fontSize: 13, fontWeight: 600, color: 'var(--text-soft)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {h.name}
          </Typography>
          <Amount
            v={h.period}
            color={h.period > 0 ? 'var(--accent2)' : h.period < 0 ? 'var(--warn)' : 'var(--line)'}
            weight={600}
            size={13}
            dim
          />
          <Amount v={h.balance} color={h.balance < 0 ? 'var(--danger)' : 'var(--purple)'} />
        </Grid>
      ))}

      <Grid sx={{ pt: '10px' }}>
        <Typography sx={{ fontSize: 13, fontWeight: 800, color: 'var(--text)' }}>Total</Typography>
        <Amount
          v={periodTotal}
          color={periodTotal > 0 ? 'var(--accent2)' : periodTotal < 0 ? 'var(--warn)' : 'var(--line)'}
          weight={800}
          size={14}
          dim
        />
        <Amount v={balanceTotal} color="var(--purple)" weight={800} size={17} />
      </Grid>
    </Box>
  )
}
