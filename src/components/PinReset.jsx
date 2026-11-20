import { useState, useEffect } from 'react'
import { Box, Button, Card, Typography, CircularProgress } from '@mui/material'
import { hashPin, clearPinResetOtpFS } from '../api/firestoreSettings'
import { auth } from '../firebase'
import { usePinScreenStyles } from './styles/PinScreen.styles'
import { NumPad, PinDots, LogoBox } from './PinScreenParts'
import { usePinResetUi } from './styles/PinReset.styles'

const OTP_LENGTH = 6

// Forgot PIN: email a 6-digit code (send-otp edge function), then check it.
// Calls onVerified() once the code matches; the PIN screen takes over from there.
export default function PinReset({ sheetId, onBack, onVerified }) {
  const { classes: ui, cx: uiCx } = usePinResetUi()
  const { classes, cx } = usePinScreenStyles()
  const [step, setStep]             = useState('send')   // 'send' | 'code'
  const [otp, setOtp]               = useState('')
  const [otpMeta, setOtpMeta]       = useState(null)     // { otpHash, expiresAt, email }
  const [sending, setSending]       = useState(false)
  const [sendError, setSendError]   = useState('')
  const [error, setError]           = useState('')
  const [shake, setShake]           = useState(false)
  const [countdown, setCountdown]   = useState(0)        // seconds remaining

  useEffect(() => {
    if (step !== 'code') return
    const id = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000)
    return () => clearInterval(id)
  }, [step])

  useEffect(() => {
    if (step === 'code' && otp.length === OTP_LENGTH) verify(otp)
  // eslint-disable-next-line react-hooks/exhaustive-deps -- submit exactly when the code is complete
  }, [otp, step])

  function fail(msg) {
    setError(msg); setShake(true); setOtp('')
    setTimeout(() => setShake(false), 450)
    setTimeout(() => setError(''), 2800)
  }

  async function send() {
    setSending(true)
    setSendError('')
    try {
      const idToken = await auth.currentUser?.getIdToken()
      if (!idToken) throw new Error('Not signed in')
      const res = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' },
      })
      // On localhost the edge function doesn't run and Vite answers with an HTML 404.
      const text = await res.text()
      let data
      try { data = JSON.parse(text) } catch {
        throw new Error(res.status === 404
          ? 'OTP service unavailable locally — deploy to Netlify and set RESEND_API_KEY to use this feature.'
          : 'Unexpected response from server')
      }
      if (!res.ok) throw new Error(data.error || 'Failed to send code')
      // Kept in memory only: nothing ever reads a stored copy back.
      setOtpMeta(data)
      setCountdown(Math.floor((data.expiresAt - Date.now()) / 1000))
      setOtp('')
      setStep('code')
    } catch (e) {
      setSendError(e.message)
    } finally {
      setSending(false)
    }
  }

  async function verify(entered) {
    if (!otpMeta) return
    if (Date.now() > otpMeta.expiresAt) return fail('Code expired — tap Resend for a new one')
    if (await hashPin(entered) !== otpMeta.otpHash) return fail('Incorrect code — try again')
    await clearPinResetOtpFS(sheetId)   // tidy up a hash an older build may have stored
    onVerified()
  }

  if (step === 'send') {
    const email  = auth.currentUser?.email || ''
    const masked = email.includes('@') ? email[0] + '****@' + email.split('@')[1] : email
    return (
      <Box className={classes.wrapper}>
        <Card className={classes.pinCard} elevation={0}>
          <LogoBox />
          <Typography className={classes.title}>Reset PIN</Typography>
          <Typography className={uiCx(classes.subtitle, ui.sendIntro)}>
            We'll send a 6-digit code to
          </Typography>
          <Box className={classes.emailBox}>{masked}</Box>
          {sendError && (
            <Typography className={ui.sendError}>
              {sendError}
            </Typography>
          )}
          {sending ? (
            <Box className={ui.sendSpinnerBox}><CircularProgress className={ui.sendSpinner} size={26} /></Box>
          ) : (
            <Button onClick={send} className={classes.primaryBtn}>Send code</Button>
          )}
          <Button onClick={onBack} className={classes.ghostBtn}>Back to PIN</Button>
        </Card>
      </Box>
    )
  }

  const mm = String(Math.floor(countdown / 60)).padStart(2, '0')
  const ss = String(countdown % 60).padStart(2, '0')
  const expired = countdown === 0
  return (
    <Box className={classes.wrapper}>
      <Card className={classes.pinCard} elevation={0}>
        <LogoBox />
        <Typography className={classes.title}>Enter code</Typography>
        <Typography className={uiCx(classes.subtitle, ui.codeSubtitle)}>
          Check your email for the 6-digit code
        </Typography>
        {otpMeta?.email && (
          <Typography className={ui.codeEmail}>{otpMeta.email}</Typography>
        )}
        <PinDots count={otp.length} shake={shake} length={OTP_LENGTH} />
        <Typography className={cx(classes.errorLine, error && classes.errorLineShown)}>
          {error || ' '}
        </Typography>
        <NumPad
          onDigit={d => otp.length < OTP_LENGTH && setOtp(v => v + d)}
          onDelete={() => setOtp(v => v.slice(0, -1))}
          disabled={otp.length >= OTP_LENGTH || expired}
        />
        <Box className={ui.codeFooter}>
          <Typography className={cx(classes.expiryText, expired && classes.textDanger)}>
            {expired ? 'Code expired' : `Expires in ${mm}:${ss}`}
          </Typography>
          <Button onClick={() => { setOtp(''); setStep('send') }} className={uiCx(classes.ghostBtn, ui.resendButton)}>
            Resend
          </Button>
        </Box>
      </Card>
    </Box>
  )
}
