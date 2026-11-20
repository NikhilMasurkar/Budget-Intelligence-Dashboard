import { useState, useEffect, useRef } from 'react'
import { Box, Button, Card, Typography, CircularProgress, Checkbox, FormControlLabel } from '@mui/material'
import {
  isBiometricsAvailable,
  hasBiometricCredential,
  registerBiometric,
  verifyBiometric,
  clearBiometric,
} from '../api/biometric'
import { resetPinFS } from '../api/firestoreSettings'
import PinReset from './PinReset'
import { usePinScreenStyles, usePinScreenUi } from './styles/PinScreen.styles'
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

// ── Main component ───────────────────────────────────────────
export default function PinScreen({ mode, userName, sheetId, onVerify, onUnlock, onSetPin }) {
  const { classes: ui, cx: uiCx } = usePinScreenUi()
  const { classes, cx } = usePinScreenStyles()
  const isSetup = mode === 'setup'

  // screen: 'pin' | 'biometric' | 'biometric-enable' | 'forgot' | 'reset'
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

  // ── Render: forgot PIN (email code) ─────────────────────────
  if (screen === 'forgot') {
    return (
      <PinReset
        sheetId={sheetId}
        onBack={() => setScreen('pin')}
        onVerified={() => { setStep('enter'); setPin(''); setConfirmPin(''); setError(''); setScreen('reset') }}
      />
    )
  }

  // ── Render: biometric-enable prompt ─────────────────────────
  if (screen === 'biometric-enable') {
    return (
      <Box className={classes.wrapper}>
        <Card className={classes.pinCard} elevation={0}>
          <LogoBox />
          <Box className={ui.box1}>
            <FingerprintIcon size={56} color="var(--accent)" />
          </Box>
          <Typography className={classes.title}>Enable fingerprint?</Typography>
          <Typography className={uiCx(classes.subtitle, ui.typography1)}>
            Use fingerprint or Face ID on this device instead of your PIN next time.
          </Typography>
          {loading ? (
            <Box className={ui.box2}><CircularProgress className={ui.circularProgress1} size={28} /></Box>
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
          <Typography className={uiCx(classes.subtitle, ui.typography2)}>
            {isError
              ? (bioError || 'Fingerprint not recognised.')
              : 'Tap the fingerprint below to unlock.'}
          </Typography>

          {/* Fingerprint button */}
          <Button
            onClick={triggerBiometric}
            disabled={isScanning}
            className={cx(classes.fingerprintBtn, isScanning ? classes.fingerprintScanning : classes.fingerprintIdle,
              isError && classes.fingerprintError, isScanning && classes.pulsingFingerprint)}
            disableRipple
          >
            <FingerprintIcon
              size={40}
              color={isError ? 'var(--danger)' : isScanning ? 'var(--accent)' : 'var(--text-muted)'}
              scanning={isScanning}
            />
          </Button>

          <Typography className={cx(classes.statusText, isError && classes.textDanger)}>
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
        <Typography className={uiCx(classes.subtitle, ui.typography3)}>{subtitle}</Typography>

        <PinDots count={current.length} shake={shake} />

        <Typography className={cx(classes.errorLine, error && classes.errorLineShown)}>
          {error || ' '}
        </Typography>

        {loading ? (
          <Box className={ui.box3}>
            <CircularProgress className={ui.circularProgress2} size={28} />
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
              <Checkbox className={ui.checkbox1}
                checked={wantBio}
                onChange={e => setWantBio(e.target.checked)}
                disableRipple
                size="small"
              />
            }
            label={
              <Box className={ui.box4}>
                <FingerprintIcon size={14} color={wantBio ? 'var(--accent)' : 'var(--text-muted)'} />
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
                <FingerprintIcon size={16} color="var(--accent)" />
                <span className={ui.span1}>Use fingerprint</span>
              </Button>
            )}
            <Button onClick={() => setScreen('forgot')} className={uiCx(classes.ghostBtn, ui.button1)}>
              Forgot PIN?
            </Button>
          </Box>
        )}

        {isReset && (
          <Button onClick={() => setScreen('pin')} className={uiCx(classes.ghostBtn, ui.button2)}>
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
