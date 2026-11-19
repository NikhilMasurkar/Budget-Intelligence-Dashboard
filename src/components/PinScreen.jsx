import { useState, useEffect, useRef } from 'react'
import { Box, Button, Card, Typography, CircularProgress, Checkbox, FormControlLabel } from '@mui/material'
import {
  isBiometricsAvailable,
  hasBiometricCredential,
  registerBiometric,
  verifyBiometric,
  clearBiometric,
} from '../api/biometric'
import {
  hashPin,
  clearPinResetOtpFS,
  resetPinFS,
} from '../api/firestoreSettings'
import { auth } from '../firebase'
import { usePinScreenStyles } from './styles/PinScreen.styles'
import { PIN_LENGTH, FingerprintIcon, NumPad, PinDots, LogoBox } from './PinScreenParts'

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

const OTP_LENGTH = 6

// ── Main component ───────────────────────────────────────────
export default function PinScreen({ mode, userName, sheetId, onVerify, onUnlock, onSetPin }) {
  const { classes, cx } = usePinScreenStyles()
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
  // Opt-in: the enrol screen only appears if the user ticks the box. Previously
  // it was forced after every correct PIN, which nagged on every single unlock.
  const [wantBio, setWantBio]         = useState(false)
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
  // eslint-disable-next-line react-hooks/exhaustive-deps -- once on mount; props don't change while the PIN screen is up
  }, [])

  // Auto-submit when PIN is complete
  useEffect(() => {
    if (current.length === PIN_LENGTH) submitPin(current)
  // eslint-disable-next-line react-hooks/exhaustive-deps -- submit exactly when the PIN reaches full length
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
  // eslint-disable-next-line react-hooks/exhaustive-deps -- submit exactly when the OTP is complete
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
        if (wantBio && biometricAvail && sheetId) {
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
        else if (wantBio && biometricAvail && sheetId && !hasCred) {
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

      // Deliberately NOT persisted. Verification compares against this
      // in-memory response, and no getter for the stored copy ever existed — so
      // writing it only left a reset-code hash sitting in Firestore forever
      // whenever someone opened Forgot PIN and backed out (the clear below runs
      // on success only).
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
    // Clears any hash left behind by an older build that did persist one.
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

        {/* Opt in to fingerprint/Face ID. Only worth showing when the device
            supports it and no credential is enrolled yet. */}
        {!isReset && biometricAvail && sheetId && !hasCred && (
          <FormControlLabel
            className={classes.bioOptIn}
            control={
              <Checkbox
                checked={wantBio}
                onChange={e => setWantBio(e.target.checked)}
                disableRipple
                size="small"
                sx={{
                  color: 'rgba(255,255,255,0.25)',
                  padding: '4px 6px 4px 0',
                  '&.Mui-checked': { color: '#5b7fff' },
                }}
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FingerprintIcon size={14} color={wantBio ? '#5b7fff' : '#6a7190'} />
                <span>Enable fingerprint / Face ID</span>
              </Box>
            }
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
