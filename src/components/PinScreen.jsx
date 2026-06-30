import React, { useState, useEffect, useRef } from 'react'
import { CircularProgress } from '@mui/material'
import {
  isBiometricsAvailable,
  hasBiometricCredential,
  registerBiometric,
  verifyBiometric,
  clearBiometric,
} from '../api/biometric'

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
  const keys = ['1','2','3','4','5','6','7','8','9','','0','del']
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, width: '100%' }}>
      {keys.map((k, i) => {
        if (k === '') return <div key={i} />
        const isDel = k === 'del'
        return (
          <button
            key={k + i}
            onClick={() => disabled ? null : isDel ? onDelete() : onDigit(k)}
            style={{
              height: 58, borderRadius: 14,
              border: isDel ? 'none' : '1px solid rgba(255,255,255,0.07)',
              background: isDel ? 'transparent' : 'rgba(255,255,255,0.04)',
              color: '#e4e8f5', fontSize: isDel ? 14 : 22, fontWeight: 600,
              cursor: disabled ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background .12s, transform .08s',
              WebkitTapHighlightColor: 'transparent', userSelect: 'none',
              fontFamily: 'inherit',
            }}
            onMouseDown={e => !disabled && (e.currentTarget.style.background = isDel ? 'rgba(255,255,255,0.05)' : 'rgba(91,127,255,0.18)', e.currentTarget.style.transform = 'scale(0.93)')}
            onMouseUp={e => (e.currentTarget.style.background = isDel ? 'transparent' : 'rgba(255,255,255,0.04)', e.currentTarget.style.transform = 'scale(1)')}
            onMouseLeave={e => (e.currentTarget.style.background = isDel ? 'transparent' : 'rgba(255,255,255,0.04)', e.currentTarget.style.transform = 'scale(1)')}
            onTouchStart={e => !disabled && (e.currentTarget.style.background = isDel ? 'rgba(255,255,255,0.05)' : 'rgba(91,127,255,0.18)', e.currentTarget.style.transform = 'scale(0.93)')}
            onTouchEnd={e => (e.currentTarget.style.background = isDel ? 'transparent' : 'rgba(255,255,255,0.04)', e.currentTarget.style.transform = 'scale(1)')}
          >
            {isDel ? (
              <svg width="22" height="16" viewBox="0 0 22 16" fill="none">
                <path d="M8 1H20C20.6 1 21 1.4 21 2V14C21 14.6 20.6 15 20 15H8L1 8L8 1Z" stroke="#6a7190" strokeWidth="1.5" strokeLinejoin="round"/>
                <line x1="9.5" y1="5.5" x2="17.5" y2="10.5" stroke="#6a7190" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="17.5" y1="5.5" x2="9.5" y2="10.5" stroke="#6a7190" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            ) : k}
          </button>
        )
      })}
    </div>
  )
}

// ── PIN dots ─────────────────────────────────────────────────
function PinDots({ count, shake }) {
  return (
    <div style={{
      display: 'flex', gap: 16, marginBottom: 8,
      animation: shake ? 'pinShake 0.45s ease' : 'none',
    }}>
      {Array.from({ length: PIN_LENGTH }).map((_, i) => {
        const filled = i < count
        return (
          <div key={i} style={{
            width: 14, height: 14, borderRadius: '50%',
            transition: 'all 0.15s ease',
            background: filled ? '#5b7fff' : 'transparent',
            border: `2px solid ${filled ? '#5b7fff' : '#2e3a5a'}`,
            transform: filled ? 'scale(1.1)' : 'scale(1)',
          }} />
        )
      })}
    </div>
  )
}

// ── Main component ───────────────────────────────────────────
export default function PinScreen({ mode, userName, sheetId, onVerify, onUnlock, onSetPin }) {
  const isSetup = mode === 'setup'

  // screen: 'pin' | 'biometric' | 'biometric-enable'
  const [screen, setScreen]           = useState('pin')
  const [step, setStep]               = useState('enter')   // setup: 'enter' | 'confirm'
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

  // NOTE: we deliberately do NOT auto-invoke biometrics when the screen mounts.
  // navigator.credentials.get() requires a user gesture on mobile (iOS Safari,
  // installed PWAs) — calling it on mount throws NotAllowedError and looks like
  // a failure. The user taps the fingerprint button instead (a real gesture).

  // Auto-submit when PIN is complete
  useEffect(() => {
    if (current.length === PIN_LENGTH) submitPin(current)
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
        // After setup: offer biometric if available, otherwise unlock now.
        if (biometricAvail && sheetId) {
          pendingSuccessRef.current = onUnlock
          setScreen('biometric-enable')
        } else {
          onUnlock()
        }
      } catch (e) { triggerError(e.message) }
      finally { setLoading(false) }
    } else {
      setLoading(true)
      try {
        const ok = await onVerify(value)
        if (!ok) { triggerError('Incorrect PIN'); setPin('') }
        // Correct PIN: if biometrics are available but not yet set up on this
        // device, offer enrollment FIRST, then unlock. Unlocking immediately
        // would unmount this screen before the prompt could appear.
        else if (biometricAvail && sheetId && !hasCred) {
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

  function handleSkipBiometric() {
    pendingSuccessRef.current?.()
  }

  // ── Render: biometric-enable prompt ─────────────────────────
  if (screen === 'biometric-enable') {
    return (
      <Wrapper>
        <Card>
          <LogoBox />
          <div style={{ fontSize: 52, margin: '4px 0 8px' }}>
            <FingerprintIcon size={56} color="#5b7fff" />
          </div>
          <p style={styles.title}>Enable fingerprint?</p>
          <p style={{ ...styles.subtitle, marginBottom: 32 }}>
            Use fingerprint or Face ID on this device instead of your PIN next time.
          </p>
          {loading ? (
            <div style={{ padding: '16px 0' }}><CircularProgress size={28} style={{ color: '#5b7fff' }} /></div>
          ) : (
            <>
              <button onClick={handleEnableBiometric} style={styles.primaryBtn}>
                Enable fingerprint
              </button>
              <button onClick={handleSkipBiometric} style={styles.ghostBtn}>
                Skip for now
              </button>
            </>
          )}
        </Card>
      </Wrapper>
    )
  }

  // ── Render: biometric entry screen ───────────────────────────
  if (screen === 'biometric') {
    return (
      <Wrapper>
        <Card>
          <LogoBox />
          <p style={styles.title}>Welcome back{userName ? `, ${userName}` : ''}!</p>
          <p style={{ ...styles.subtitle, marginBottom: 32 }}>
            {bioStatus === 'error'
              ? (bioError || 'Fingerprint not recognised.')
              : 'Tap the fingerprint below to unlock.'}
          </p>

          {/* Fingerprint button */}
          <button
            onClick={triggerBiometric}
            disabled={bioStatus === 'scanning'}
            style={{
              width: 88, height: 88, borderRadius: '50%',
              border: `2px solid ${bioStatus === 'error' ? '#ff5f5f' : bioStatus === 'scanning' ? '#5b7fff' : 'rgba(91,127,255,0.35)'}`,
              background: bioStatus === 'scanning' ? 'rgba(91,127,255,0.1)' : 'rgba(255,255,255,0.03)',
              cursor: bioStatus === 'scanning' ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s', marginBottom: 24,
              animation: bioStatus === 'scanning' ? 'bioPulse 1.2s ease-in-out infinite' : 'none',
            }}
          >
            <FingerprintIcon
              size={40}
              color={bioStatus === 'error' ? '#ff5f5f' : bioStatus === 'scanning' ? '#5b7fff' : '#6a7190'}
              scanning={bioStatus === 'scanning'}
            />
          </button>

          <p style={{ fontSize: 12, color: bioStatus === 'error' ? '#ff5f5f' : '#6a7190', marginBottom: 28, minHeight: 16 }}>
            {bioStatus === 'scanning' ? 'Scanning…' : bioStatus === 'error' ? (bioError || 'Try again or use your PIN') : 'Tap to authenticate'}
          </p>

          <button onClick={() => { setBioStatus('idle'); setBioError(''); setScreen('pin') }} style={styles.ghostBtn}>
            Use PIN instead
          </button>
        </Card>
        <style>{`@keyframes bioPulse{0%,100%{box-shadow:0 0 0 0 rgba(91,127,255,0.3)}50%{box-shadow:0 0 0 12px rgba(91,127,255,0)}}`}</style>
      </Wrapper>
    )
  }

  // ── Render: PIN pad ──────────────────────────────────────────
  const title = isSetup
    ? (step === 'enter' ? 'Create your PIN' : 'Confirm your PIN')
    : 'Enter PIN'
  const subtitle = isSetup
    ? (step === 'enter' ? 'Choose a 4-digit PIN to secure BudgetIQ' : 'Enter the same 4 digits again')
    : `Welcome back${userName ? ', ' + userName : ''}!`

  return (
    <Wrapper>
      <Card>
        <LogoBox />
        <p style={styles.title}>{title}</p>
        <p style={{ ...styles.subtitle, marginBottom: 28 }}>{subtitle}</p>

        <PinDots count={current.length} shake={shake} />

        <p style={{ margin: '0 0 20px', fontSize: 12, color: '#ff5f5f', minHeight: 16, textAlign: 'center', opacity: error ? 1 : 0, transition: 'opacity 0.2s' }}>
          {error || ' '}
        </p>

        {loading ? (
          <div style={{ padding: '40px 0', display: 'flex', justifyContent: 'center' }}>
            <CircularProgress size={28} style={{ color: '#5b7fff' }} />
          </div>
        ) : (
          <NumPad
            onDigit={d => current.length < PIN_LENGTH && setCurrent(v => v + d)}
            onDelete={() => setCurrent(v => v.slice(0, -1))}
            disabled={current.length >= PIN_LENGTH}
          />
        )}

        {/* Switch to biometric if credential exists */}
        {!isSetup && hasCred && biometricAvail && (
          <button onClick={() => setScreen('biometric')} style={{ ...styles.ghostBtn, marginTop: 20 }}>
            <FingerprintIcon size={16} color="#5b7fff" />
            <span style={{ marginLeft: 6 }}>Use fingerprint</span>
          </button>
        )}
      </Card>

      {isSetup && step === 'enter' && (
        <p style={{ marginTop: 20, fontSize: 11.5, color: '#3a4575', textAlign: 'center', maxWidth: 300, lineHeight: 1.6 }}>
          This PIN cannot be changed later. You can find it in Firebase console if needed.
        </p>
      )}

      <style>{`@keyframes pinShake{0%,100%{transform:translateX(0)}15%{transform:translateX(-9px)}30%{transform:translateX(9px)}45%{transform:translateX(-7px)}60%{transform:translateX(7px)}75%{transform:translateX(-4px)}90%{transform:translateX(4px)}}`}</style>
    </Wrapper>
  )
}

// ── Layout helpers ───────────────────────────────────────────
function Wrapper({ children }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#0b0e1a',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '0 16px',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    }}>
      {children}
    </div>
  )
}

function Card({ children }) {
  return (
    <div style={{
      width: '100%', maxWidth: 340,
      background: '#12172b',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 24, padding: '36px 28px 32px',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
    }}>
      {children}
    </div>
  )
}

function LogoBox() {
  return (
    <div style={{
      width: 56, height: 56, borderRadius: 16, marginBottom: 20,
      background: 'linear-gradient(135deg, #3a57e8 0%, #5b7fff 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 26, boxShadow: '0 4px 20px rgba(91,127,255,0.3)',
    }}>
      💰
    </div>
  )
}

const styles = {
  title: {
    margin: '0 0 4px', fontSize: 20, fontWeight: 700,
    color: '#e4e8f5', letterSpacing: '-0.3px', textAlign: 'center',
  },
  subtitle: {
    margin: 0, fontSize: 13, color: '#6a7190', textAlign: 'center', lineHeight: 1.5,
  },
  primaryBtn: {
    width: '100%', height: 48, borderRadius: 14, border: 'none',
    background: '#5b7fff', color: '#fff', fontSize: 15, fontWeight: 600,
    cursor: 'pointer', marginBottom: 10, fontFamily: 'inherit',
    transition: 'opacity 0.15s',
  },
  ghostBtn: {
    background: 'transparent', border: 'none', color: '#5b7fff',
    fontSize: 13, fontWeight: 500, cursor: 'pointer',
    padding: '6px 12px', borderRadius: 8, fontFamily: 'inherit',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
}
