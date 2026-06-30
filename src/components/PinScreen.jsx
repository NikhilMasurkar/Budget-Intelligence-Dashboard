import React, { useState, useEffect, useRef } from 'react'
import { Box, Button, Card, Typography, CircularProgress } from '@mui/material'
import { makeStyles } from 'tss-react/mui'
import {
  isBiometricsAvailable,
  hasBiometricCredential,
  registerBiometric,
  verifyBiometric,
  clearBiometric,
} from '../api/biometric'
import {
  hashPin,
  savePinResetOtpFS,
  clearPinResetOtpFS,
  resetPinFS,
} from '../api/firestoreSettings'
import { auth } from '../firebase'

// Turn a WebAuthn DOMException into something a user can act on.
function bioErrorMessage(e) {
  switch (e?.name) {
    case 'NotAllowedError':
      return 'Cancelled or timed out — tap to try again.'
    case 'SecurityError':
      return 'Biometrics need a secure (https) connection.'
    case 'InvalidStateError':
    case 'NotReadableError':
      return 'This device’s saved fingerprint is no longer valid. Use your PIN, then re-enable it.'
    case 'AbortError':
      return 'Tap the fingerprint to try again.'
    default:
      return 'Couldn’t verify — use your PIN instead.'
  }
}

const PIN_LENGTH = 4
const OTP_LENGTH = 6

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
function FingerprintIcon({ size = 48, color = '#5b7fff', scanning = false }) {
  const clipId = 'fpScan-' + React.useId().replace(/:/g, '')
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
function NumPad({ onDigit, onDelete, disabled }) {
  const { classes, cx } = useStyles()
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
function PinDots({ count, shake, length = PIN_LENGTH }) {
  const { classes, cx } = useStyles()
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
function LogoBox() {
  const { classes } = useStyles()
  return (
    <Box className={classes.logoBox}>
      💰
    </Box>
  )
}

// ── Main component ───────────────────────────────────────────
export default function PinScreen({ mode, userName, sheetId, onVerify, onUnlock, onSetPin }) {
  const { classes, cx } = useStyles()
  const isSetup = mode === 'setup'

  // screen: 'pin' | 'biometric' | 'biometric-enable' | 'forgot' | 'otp' | 'reset'
  const [screen, setScreen]           = useState('pin')
  const [step, setStep]               = useState('enter')   // 'enter' | 'confirm'
  const [pin, setPin]                 = useState('')
  const [confirmPin, setConfirmPin]   = useState('')
  const [shake, setShake]             = useState(false)
  const [error, setError]             = useState('')
  const [loading, setLoading]         = useState(false)
  const [biometricAvail, setBiometricAvail] = useState(false)
  const [hasCred, setHasCred]         = useState(false)
  const [bioStatus, setBioStatus]     = useState('idle') // 'idle' | 'scanning' | 'error'
  const [bioError, setBioError]       = useState('')
  const pendingSuccessRef             = useRef(null)

  // ── Forgot PIN state ─────────────────────────────────────────
  const [otp, setOtp]                 = useState('')
  const [otpMeta, setOtpMeta]         = useState(null)  // { otpHash, expiresAt, email }
  const [otpSending, setOtpSending]   = useState(false)
  const [otpError, setOtpError]       = useState('')
  const [countdown, setCountdown]     = useState(0)     // seconds remaining

  const current    = step === 'confirm' ? confirmPin : pin
  const setCurrent = step === 'confirm' ? setConfirmPin : setPin

  // Check biometric availability on mount
  useEffect(() => {
    isBiometricsAvailable().then(avail => {
      setBiometricAvail(avail)
      if (avail && sheetId) {
        const cred = hasBiometricCredential(sheetId)
        setHasCred(cred)
        // Entry mode: jump straight to biometric screen if credential exists
        if (!isSetup && cred) setScreen('biometric')
      }
    })
  }, [])

  // Auto-submit when PIN is complete
  useEffect(() => {
    if (current.length === PIN_LENGTH) submitPin(current)
  }, [current])

  // OTP countdown timer
  useEffect(() => {
    if (screen !== 'otp') return
    const id = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000)
    return () => clearInterval(id)
  }, [screen])

  // Auto-submit when OTP is complete
  useEffect(() => {
    if (screen === 'otp' && otp.length === OTP_LENGTH) handleVerifyOtp(otp)
  }, [otp, screen])

  async function triggerBiometric() {
    if (!sheetId || bioStatus === 'scanning') return
    setBioStatus('scanning')
    setBioError('')
    try {
      const ok = await verifyBiometric(sheetId)
      if (ok) {
        setBioStatus('idle')
        onUnlock() // biometric verified — unlock
      } else {
        // No stored credential on this device — fall back to the PIN pad.
        setHasCred(false)
        setScreen('pin')
      }
    } catch (e) {
      console.warn('[BudgetIQ] Biometric verify failed:', e?.name, e?.message)
      // A stale/unusable credential should be dropped so the user can re-enable.
      if (e?.name === 'InvalidStateError' || e?.name === 'NotReadableError') {
        clearBiometric(sheetId)
        setHasCred(false)
      }
      setBioStatus('error')
      setBioError(bioErrorMessage(e))
    }
  }

  async function submitPin(value) {
    // ── PIN reset (post-OTP) ───────────────────────────────────
    if (screen === 'reset') {
      if (step === 'enter') { setStep('confirm'); return }
      if (value !== pin) {
        triggerError('PINs do not match — try again')
        setConfirmPin(''); setStep('enter'); setPin('')
        return
      }
      setLoading(true)
      try {
        await resetPinFS(sheetId, pin)
        onUnlock()
      } catch (e) { triggerError(e.message) }
      finally { setLoading(false) }
      return
    }

    // ── First-time PIN setup ───────────────────────────────────
    if (isSetup) {
      if (step === 'enter') { setStep('confirm'); return }
      if (value !== pin) {
        triggerError('PINs do not match — try again')
        setConfirmPin(''); setStep('enter'); setPin('')
        return
      }
      setLoading(true)
      try {
        await onSetPin(pin)
        if (biometricAvail && sheetId) {
          pendingSuccessRef.current = onUnlock
          setScreen('biometric-enable')
        } else {
          onUnlock()
        }
      } catch (e) { triggerError(e.message) }
      finally { setLoading(false) }
    } else {
      // ── Normal PIN entry ─────────────────────────────────────
      setLoading(true)
      try {
        const ok = await onVerify(value)
        if (!ok) { triggerError('Incorrect PIN'); setPin('') }
        else if (biometricAvail && sheetId && !hasCred) {
          pendingSuccessRef.current = onUnlock
          setScreen('biometric-enable')
        } else {
          onUnlock()
        }
      } finally { setLoading(false) }
    }
  }

  // ── Forgot PIN — send OTP ─────────────────────────────────────
  async function handleSendOtp() {
    setOtpSending(true)
    setOtpError('')
    try {
      const idToken = await auth.currentUser?.getIdToken()
      if (!idToken) throw new Error('Not signed in')

      const res = await fetch('/api/send-otp', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
      })

      // Parse JSON safely — on localhost the edge function doesn't run and
      // Vite returns an HTML 404, which blows up res.json().
      const text = await res.text()
      let data
      try { data = JSON.parse(text) } catch {
        throw new Error(
          res.status === 404
            ? 'OTP service unavailable locally — deploy to Netlify and set RESEND_API_KEY to use this feature.'
            : 'Unexpected response from server'
        )
      }
      if (!res.ok) throw new Error(data.error || 'Failed to send code')

      await savePinResetOtpFS(sheetId, data.otpHash, data.expiresAt)
      setOtpMeta(data)
      setCountdown(Math.floor((data.expiresAt - Date.now()) / 1000))
      setOtp('')
      setScreen('otp')
    } catch (e) {
      setOtpError(e.message)
    } finally {
      setOtpSending(false)
    }
  }

  // ── Forgot PIN — verify OTP ───────────────────────────────────
  async function handleVerifyOtp(enteredOtp) {
    if (!otpMeta) return
    if (Date.now() > otpMeta.expiresAt) {
      triggerError('Code expired — tap Resend for a new one')
      setOtp(''); return
    }
    const hash = await hashPin(enteredOtp)
    if (hash !== otpMeta.otpHash) {
      triggerError('Incorrect code — try again')
      setOtp(''); return
    }
    await clearPinResetOtpFS(sheetId)
    setOtp('')
    setStep('enter')
    setPin('')
    setConfirmPin('')
    setError('')
    setScreen('reset')
  }

  function triggerError(msg) {
    setError(msg); setShake(true)
    setTimeout(() => setShake(false), 450)
    setTimeout(() => setError(''), 2800)
  }

  async function handleEnableBiometric() {
    setLoading(true)
    try {
      await registerBiometric(sheetId, userName)
      setHasCred(true)
    } catch (e) {
      // Registration cancelled or failed — log for diagnostics, then proceed.
      console.warn('[BudgetIQ] Biometric registration failed:', e?.name, e?.message)
    } finally {
      setLoading(false)
      pendingSuccessRef.current?.()
    }
  }

  // ── Skip biometric ──────────────────────────────────────────
  function handleSkipBiometric() {
    pendingSuccessRef.current?.()
  }

  // ── Render: forgot PIN ──────────────────────────────────────
  if (screen === 'forgot') {
    const email    = auth.currentUser?.email || ''
    const masked   = email.includes('@')
      ? email[0] + '****@' + email.split('@')[1]
      : email
    return (
      <Box className={classes.wrapper}>
        <Card className={classes.pinCard} elevation={0}>
          <LogoBox />
          <Typography className={classes.title}>Reset PIN</Typography>
          <Typography className={classes.subtitle} sx={{ marginBottom: '24px' }}>
            We'll send a 6-digit code to
          </Typography>
          <Box className={classes.emailBox}>
            {masked}
          </Box>
          {otpError && (
            <Typography sx={{ fontSize: 12, color: '#ff5f5f', marginBottom: '12px', textAlign: 'center' }}>
              {otpError}
            </Typography>
          )}
          {otpSending ? (
            <Box sx={{ padding: '12px 0' }}><CircularProgress size={26} style={{ color: '#5b7fff' }} /></Box>
          ) : (
            <Button onClick={handleSendOtp} className={classes.primaryBtn}>
              Send code
            </Button>
          )}
          <Button onClick={() => setScreen('pin')} className={classes.ghostBtn}>
            Back to PIN
          </Button>
        </Card>
      </Box>
    )
  }

  // ── Render: OTP entry ────────────────────────────────────────
  if (screen === 'otp') {
    const mm = String(Math.floor(countdown / 60)).padStart(2, '0')
    const ss = String(countdown % 60).padStart(2, '0')
    const expired = countdown === 0
    return (
      <Box className={classes.wrapper}>
        <Card className={classes.pinCard} elevation={0}>
          <LogoBox />
          <Typography className={classes.title}>Enter code</Typography>
          <Typography className={classes.subtitle} sx={{ marginBottom: '8px' }}>
            Check your email for the 6-digit code
          </Typography>
          {otpMeta?.email && (
            <Typography sx={{ fontSize: 12, color: '#5b7fff', marginBottom: '20px' }}>
              {otpMeta.email}
            </Typography>
          )}

          <PinDots count={otp.length} shake={shake} length={OTP_LENGTH} />

          <Typography sx={{ margin: '0 0 20px', fontSize: 12, color: '#ff5f5f', minHeight: 16, textAlign: 'center', opacity: error ? 1 : 0, transition: 'opacity 0.2s' }}>
            {error || ' '}
          </Typography>

          {loading ? (
            <Box sx={{ padding: '40px 0', display: 'flex', justifyContent: 'center' }}>
              <CircularProgress size={28} style={{ color: '#5b7fff' }} />
            </Box>
          ) : (
            <>
              <NumPad
                onDigit={d => otp.length < OTP_LENGTH && setOtp(v => v + d)}
                onDelete={() => setOtp(v => v.slice(0, -1))}
                disabled={otp.length >= OTP_LENGTH || expired}
              />
              <Box sx={{ marginTop: '20px', display: 'flex', gap: '16px', alignItems: 'center', justifyContent: 'center' }}>
                <Typography sx={{ fontSize: 12, color: expired ? '#ff5f5f' : '#6a7190' }}>
                  {expired ? 'Code expired' : `Expires in ${mm}:${ss}`}
                </Typography>
                <Button
                  onClick={() => { setOtp(''); setScreen('forgot') }}
                  className={classes.ghostBtn}
                  style={{ fontSize: 12 }}
                >
                  Resend
                </Button>
              </Box>
            </>
          )}
        </Card>
      </Box>
    )
  }

  // ── Render: biometric-enable prompt ─────────────────────────
  if (screen === 'biometric-enable') {
    return (
      <Box className={classes.wrapper}>
        <Card className={classes.pinCard} elevation={0}>
          <LogoBox />
          <Box sx={{ fontSize: 52, margin: '4px 0 8px' }}>
            <FingerprintIcon size={56} color="#5b7fff" />
          </Box>
          <Typography className={classes.title}>Enable fingerprint?</Typography>
          <Typography className={classes.subtitle} sx={{ marginBottom: '32px' }}>
            Use fingerprint or Face ID on this device instead of your PIN next time.
          </Typography>
          {loading ? (
            <Box sx={{ padding: '16px 0' }}><CircularProgress size={28} style={{ color: '#5b7fff' }} /></Box>
          ) : (
            <>
              <Button onClick={handleEnableBiometric} className={classes.primaryBtn}>
                Enable fingerprint
              </Button>
              <Button onClick={handleSkipBiometric} className={classes.ghostBtn}>
                Skip for now
              </Button>
            </>
          )}
        </Card>
      </Box>
    )
  }

  // ── Render: biometric entry screen ───────────────────────────
  if (screen === 'biometric') {
    const isScanning = bioStatus === 'scanning'
    const isError = bioStatus === 'error'
    return (
      <Box className={classes.wrapper}>
        <Card className={classes.pinCard} elevation={0}>
          <LogoBox />
          <Typography className={classes.title}>Welcome back{userName ? `, ${userName}` : ''}!</Typography>
          <Typography className={classes.subtitle} sx={{ marginBottom: '32px' }}>
            {isError
              ? (bioError || 'Fingerprint not recognised.')
              : 'Tap the fingerprint below to unlock.'}
          </Typography>

          {/* Fingerprint button */}
          <Button
            onClick={triggerBiometric}
            disabled={isScanning}
            className={cx(classes.fingerprintBtn, isScanning && classes.pulsingFingerprint)}
            sx={{
              border: `2px solid ${isError ? '#ff5f5f' : isScanning ? '#5b7fff' : 'rgba(91,127,255,0.35)'}`,
              background: isScanning ? 'rgba(91,127,255,0.1)' : 'rgba(255,255,255,0.03)',
              cursor: isScanning ? 'default' : 'pointer',
            }}
            disableRipple
          >
            <FingerprintIcon
              size={40}
              color={isError ? '#ff5f5f' : isScanning ? '#5b7fff' : '#6a7190'}
              scanning={isScanning}
            />
          </Button>

          <Typography sx={{ fontSize: 12, color: isError ? '#ff5f5f' : '#6a7190', marginBottom: '28px', minHeight: 16, textAlign: 'center' }}>
            {isScanning ? 'Scanning…' : isError ? (bioError || 'Try again or use your PIN') : 'Tap to authenticate'}
          </Typography>

          <Button onClick={() => { setBioStatus('idle'); setBioError(''); setScreen('pin') }} className={classes.ghostBtn}>
            Use PIN instead
          </Button>
        </Card>
      </Box>
    )
  }

  // ── Render: PIN pad (entry, setup, and post-OTP reset) ───────
  const isReset = screen === 'reset'
  const title = isReset
    ? (step === 'enter' ? 'Create new PIN' : 'Confirm new PIN')
    : isSetup
    ? (step === 'enter' ? 'Create your PIN' : 'Confirm your PIN')
    : 'Enter PIN'
  const subtitle = isReset
    ? (step === 'enter' ? 'Choose a new 4-digit PIN' : 'Enter the same 4 digits again')
    : isSetup
    ? (step === 'enter' ? 'Choose a 4-digit PIN to secure BudgetIQ' : 'Enter the same 4 digits again')
    : `Welcome back${userName ? ', ' + userName : ''}!`

  return (
    <Box className={classes.wrapper}>
      <Card className={classes.pinCard} elevation={0}>
        <LogoBox />
        <Typography className={classes.title}>{title}</Typography>
        <Typography className={classes.subtitle} sx={{ marginBottom: '28px' }}>{subtitle}</Typography>

        <PinDots count={current.length} shake={shake} />

        <Typography sx={{ margin: '0 0 20px', fontSize: 12, color: '#ff5f5f', minHeight: 16, textAlign: 'center', opacity: error ? 1 : 0, transition: 'opacity 0.2s' }}>
          {error || ' '}
        </Typography>

        {loading ? (
          <Box sx={{ padding: '40px 0', display: 'flex', justifyContent: 'center' }}>
            <CircularProgress size={28} style={{ color: '#5b7fff' }} />
          </Box>
        ) : (
          <NumPad
            onDigit={d => current.length < PIN_LENGTH && setCurrent(v => v + d)}
            onDelete={() => setCurrent(v => v.slice(0, -1))}
            disabled={current.length >= PIN_LENGTH}
          />
        )}

        {/* Switch to biometric / Forgot PIN — only on normal entry screen */}
        {!isSetup && !isReset && (
          <Box className={classes.bottomLink}>
            {hasCred && biometricAvail && (
              <Button onClick={() => setScreen('biometric')} className={classes.ghostBtn}>
                <FingerprintIcon size={16} color="#5b7fff" />
                <span style={{ marginLeft: 6 }}>Use fingerprint</span>
              </Button>
            )}
            <Button onClick={() => { setOtpError(''); setScreen('forgot') }} className={classes.ghostBtn} sx={{ color: '#3a4575', fontSize: 12 }}>
              Forgot PIN?
            </Button>
          </Box>
        )}

        {isReset && (
          <Button onClick={() => setScreen('pin')} className={classes.ghostBtn} sx={{ marginTop: '16px', color: '#3a4575', fontSize: 12 }}>
            Cancel reset
          </Button>
        )}
      </Card>

      {isSetup && step === 'enter' && (
        <Typography className={classes.footerText}>
          Use "Forgot PIN?" on the lock screen to reset it via email if you ever get locked out.
        </Typography>
      )}
    </Box>
  )
}

// ── Styling System ───────────────────────────────────────────
const useStyles = makeStyles()((theme) => ({
  '@keyframes pinShake': {
    '0%, 100%': { transform: 'translateX(0)' },
    '15%': { transform: 'translateX(-9px)' },
    '30%': { transform: 'translateX(9px)' },
    '45%': { transform: 'translateX(-7px)' },
    '60%': { transform: 'translateX(7px)' },
    '75%': { transform: 'translateX(-4px)' },
    '90%': { transform: 'translateX(4px)' },
  },
  '@keyframes bioPulse': {
    '0%, 100%': { boxShadow: '0 0 0 0 rgba(91, 127, 255, 0.3)' },
    '50%': { boxShadow: '0 0 0 12px rgba(91, 127, 255, 0)' },
  },
  wrapper: {
    position: 'fixed',
    inset: 0,
    zIndex: 9999,
    background: '#0b0e1a',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 16px',
    fontFamily: theme.typography.fontFamily,
  },
  pinCard: {
    width: '100%',
    maxWidth: 340,
    background: '#12172b',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: 24,
    padding: '36px 28px 32px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    boxShadow: 'none',
  },
  logoBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    marginBottom: 20,
    background: 'linear-gradient(135deg, #3a57e8 0%, #5b7fff 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 26,
    boxShadow: '0 4px 20px rgba(91, 127, 255, 0.3)',
  },
  title: {
    margin: '0 0 4px',
    fontSize: 20,
    fontWeight: 700,
    color: '#e4e8f5',
    letterSpacing: '-0.3px',
    textAlign: 'center',
  },
  subtitle: {
    margin: 0,
    fontSize: 13,
    color: '#6a7190',
    textAlign: 'center',
    lineHeight: 1.5,
  },
  dotsContainer: {
    display: 'flex',
    marginBottom: 8,
  },
  shakingDots: {
    animation: 'pinShake 0.45s ease',
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: '50%',
    transition: 'all 0.15s ease',
  },
  numpadContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 10,
    width: '100%',
  },
  numpadKey: {
    height: 58,
    borderRadius: 14,
    border: '1px solid rgba(255, 255, 255, 0.07)',
    background: 'rgba(255, 255, 255, 0.04)',
    color: '#e4e8f5',
    fontSize: 22,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background .12s, transform .08s',
    WebkitTapHighlightColor: 'transparent',
    userSelect: 'none',
    minWidth: 0,
    padding: 0,
    fontFamily: theme.typography.fontFamily,
    '&:active': {
      background: 'rgba(91, 127, 255, 0.18)',
      transform: 'scale(0.93)',
    },
  },
  delKey: {
    border: 'none',
    background: 'transparent',
    '&:active': {
      background: 'rgba(255, 255, 255, 0.05)',
      transform: 'scale(0.93)',
    },
  },
  primaryBtn: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    border: 'none',
    background: '#5b7fff',
    color: '#fff',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    marginBottom: 10,
    fontFamily: theme.typography.fontFamily,
    textTransform: 'none',
    transition: 'opacity 0.15s',
    '&:hover': {
      background: '#4a6eee',
    },
  },
  ghostBtn: {
    background: 'transparent',
    border: 'none',
    color: '#5b7fff',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    padding: '6px 12px',
    borderRadius: 8,
    fontFamily: theme.typography.fontFamily,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textTransform: 'none',
    '&:hover': {
      background: 'rgba(255, 255, 255, 0.04)',
    },
  },
  emailBox: {
    background: 'rgba(91, 127, 255, 0.08)',
    border: '1px solid rgba(91, 127, 255, 0.2)',
    borderRadius: 10,
    padding: '10px 16px',
    marginBottom: 28,
    fontSize: 14,
    color: '#a0b0e8',
    fontWeight: 500,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  fingerprintBtn: {
    width: 88,
    height: 88,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
    marginBottom: 24,
    minWidth: 0,
    padding: 0,
  },
  pulsingFingerprint: {
    animation: 'bioPulse 1.2s ease-in-out infinite',
  },
  bottomLink: {
    marginTop: 20,
    display: 'flex',
    gap: 8,
    flexDirection: 'column',
    alignItems: 'center',
  },
  footerText: {
    marginTop: 20,
    fontSize: 11.5,
    color: '#3a4575',
    textAlign: 'center',
    maxWidth: 300,
    lineHeight: 1.6,
  },
}))
