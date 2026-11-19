import { useId } from 'react'
import { Box, Button } from '@mui/material'
import { usePinScreenStyles } from './styles/PinScreen.styles'

// The visual pieces of the PIN screen; the flow itself lives in PinScreen.jsx.
export const PIN_LENGTH = 4

// ── Fingerprint icon SVG ─────────────────────────────────────
// A full thumb-print: a loop core surrounded by many concentric ridges,
// with the divergence delta on the lower-left — reads as a real fingerprint
// rather than a minimal line glyph.
const FP_RIDGES = [
  // loop core
  'M44 58 C42 49 54 48 54 57',
  'M47.5 57 C46.5 52.5 51 52.5 50 56',
  // core-hugging ridges
  'M42 53 A6 7 0 0 1 54 53',
  'M42 57 A6 6 0 0 0 54 57',
  // upper concentric ridges (loop opening downward)
  'M38 56 A10 12 0 0 1 58 56',
  'M33 58 A15 19 0 0 1 63 58',
  'M28 60 A20 26 0 0 1 68 60',
  'M23 62 A25 33 0 0 1 73 62',
  'M18 64 A30 40 0 0 1 78 64',
  'M14 66 A34 47 0 0 1 82 66',
  'M10 68 A38 53 0 0 1 86 68',
  'M7 70 A41 58 0 0 1 89 70',
  'M5 72 A43 62 0 0 1 91 72',
  // lower concentric ridges
  'M37 60 A11 9 0 0 0 59 60',
  'M31 62 A17 13 0 0 0 65 62',
  'M25 64 A23 17 0 0 0 71 64',
  'M19 66 A29 21 0 0 0 77 66',
  'M14 68 A34 25 0 0 0 82 68',
  'M10 70 A38 29 0 0 0 86 70',
  'M7 72 A41 33 0 0 0 89 72',
  // divergence delta
  'M28 82 L34 74 L40 82',
  'M31 82 L34 78 L37 82',
]

// When `scanning`, a bright band sweeps top→bottom→top, lighting up the ridges
// it passes over (a second, clipped copy of the print) with a leading scan line.
export function FingerprintIcon({ size = 48, color = '#5b7fff', scanning = false }) {
  const clipId = 'fpScan-' + useId().replace(/:/g, '')
  const ridges = FP_RIDGES.map((d, i) => <path key={i} d={d} />)
  return (
    <svg width={size} height={size} viewBox="0 0 96 114" fill="none" strokeLinecap="round" strokeLinejoin="round">
      {scanning && (
        <defs>
          <clipPath id={clipId}>
            <rect className="fpBand" x="0" y="-8" width="96" height="26" />
          </clipPath>
        </defs>
      )}

      {/* Base ridges — dimmed while a scan sweeps over them */}
      <g stroke={color} strokeWidth="2.4" opacity={scanning ? 0.28 : 1}>
        {ridges}
      </g>

      {scanning && (
        <>
          {/* Bright copy, revealed only inside the moving band */}
          <g stroke={color} strokeWidth="2.7" clipPath={`url(#${clipId})`}>
            {ridges}
          </g>
          {/* Leading scan line */}
          <rect className="fpLine" x="4" y="14" width="88" height="2.6" rx="1.3" fill={color} />
          <style>{`
            @keyframes fpScanMove { 0% { transform: translateY(0) } 50% { transform: translateY(88px) } 100% { transform: translateY(0) } }
            .fpBand, .fpLine { animation: fpScanMove 1.9s ease-in-out infinite; }
          `}</style>
        </>
      )}
    </svg>
  )
}

// ── Numpad ───────────────────────────────────────────────────
export function NumPad({ onDigit, onDelete, disabled }) {
  const { classes, cx } = usePinScreenStyles()
  const keys = ['1','2','3','4','5','6','7','8','9','','0','del']
  return (
    <Box className={classes.numpadContainer}>
      {keys.map((k, i) => {
        if (k === '') return <Box key={i} />
        const isDel = k === 'del'
        return (
          <Button
            key={k + i}
            onClick={() => disabled ? null : isDel ? onDelete() : onDigit(k)}
            disabled={disabled}
            className={cx(classes.numpadKey, isDel && classes.delKey)}
            disableRipple
          >
            {isDel ? (
              <svg width="22" height="16" viewBox="0 0 22 16" fill="none">
                <path d="M8 1H20C20.6 1 21 1.4 21 2V14C21 14.6 20.6 15 20 15H8L1 8L8 1Z" stroke="#6a7190" strokeWidth="1.5" strokeLinejoin="round"/>
                <line x1="9.5" y1="5.5" x2="17.5" y2="10.5" stroke="#6a7190" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="17.5" y1="5.5" x2="9.5" y2="10.5" stroke="#6a7190" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            ) : k}
          </Button>
        )
      })}
    </Box>
  )
}

// ── PIN / OTP dots ───────────────────────────────────────────
export function PinDots({ count, shake, length = PIN_LENGTH }) {
  const { classes, cx } = usePinScreenStyles()
  return (
    <Box
      className={cx(classes.dotsContainer, shake && classes.shakingDots)}
      sx={{ gap: length > 4 ? '10px' : '16px' }}
    >
      {Array.from({ length }).map((_, i) => {
        const filled = i < count
        return (
          <Box
            key={i}
            className={classes.dot}
            sx={{
              background: filled ? '#5b7fff' : 'transparent',
              border: `2px solid ${filled ? '#5b7fff' : '#2e3a5a'}`,
              transform: filled ? 'scale(1.1)' : 'scale(1)',
            }}
          />
        )
      })}
    </Box>
  )
}

// ── LogoBox ──────────────────────────────────────────────────
export function LogoBox() {
  const { classes } = usePinScreenStyles()
  return (
    <Box className={classes.logoBox}>
      💰
    </Box>
  )
}

