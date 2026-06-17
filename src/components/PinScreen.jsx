import React, { useState, useEffect, useRef } from 'react'
import { CircularProgress } from '@mui/material'
import {
  isBiometricsAvailable,
  hasBiometricCredential,
  registerBiometric,
  verifyBiometric,
} from '../api/biometric'

const PIN_LENGTH = 4

// ── Fingerprint icon SVG ─────────────────────────────────────
function FingerprintIcon({ size = 48, color = '#5b7fff' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4" />
      <path d="M14 13.12c0 2.38 0 6.38-1 8.88" />
      <path d="M17.29 21.02c.12-.6.43-2.3.5-3.02" />
      <path d="M2 12a10 10 0 0 1 18-6" />
      <path d="M2 17c1 .5 2.5.5 3.5-.17" />
      <path d="M22 12a10 10 0 0 1-.28 2.28" />
      <path d="M6 10a6 6 0 0 1 11.8-1.27" />
      <path d="M6.18 17.09A6 6 0 0 1 6 16a6 6 0 0 1 3-5.2" />
      <path d="M20.14 13.33A6 6 0 0 1 18 16" />
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
export default function PinScreen({ mode, userName, sheetId, onSuccess, onSetPin }) {
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

  // Auto-trigger biometric when biometric screen mounts
  useEffect(() => {
    if (screen === 'biometric') triggerBiometric()
  }, [screen])

  // Auto-submit when PIN is complete
  useEffect(() => {
    if (current.length === PIN_LENGTH) submitPin(current)
  }, [current])

  async function triggerBiometric() {
    if (!sheetId) return
    setBioStatus('scanning')
    try {
      const ok = await verifyBiometric(sheetId)
      if (ok) {
        setBioStatus('idle')
        await onSuccess(null) // null = biometric bypass
      } else {
        setBioStatus('error')
      }
    } catch {
      setBioStatus('error')
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
        // After setup: offer biometric if available
        if (biometricAvail && sheetId) {
          pendingSuccessRef.current = () => onSuccess(null)
          setScreen('biometric-enable')
        } else {
          onSuccess(null)
        }
      } catch (e) { triggerError(e.message) }
      finally { setLoading(false) }
    } else {
      setLoading(true)
      try {
        const ok = await onSuccess(value)
        if (!ok) { triggerError('Incorrect PIN'); setPin('') }
        else if (biometricAvail && sheetId && !hasCred) {
          pendingSuccessRef.current = () => {}
          setScreen('biometric-enable')
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
      // Registration cancelled or failed — just proceed
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
            {bioStatus === 'error' ? 'Fingerprint not recognised.' : 'Touch the fingerprint sensor to continue.'}
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
            />
          </button>

          <p style={{ fontSize: 12, color: bioStatus === 'error' ? '#ff5f5f' : '#6a7190', marginBottom: 28, minHeight: 16 }}>
            {bioStatus === 'scanning' ? 'Scanning…' : bioStatus === 'error' ? 'Try again or use your PIN' : 'Tap to authenticate'}
          </p>

          <button onClick={() => { setBioStatus('idle'); setScreen('pin') }} style={styles.ghostBtn}>
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
