import React, { useState, useEffect } from 'react'
import { CircularProgress } from '@mui/material'

const PIN_LENGTH = 4

export default function PinScreen({ mode, userName, onSuccess, onSetPin }) {
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [step, setStep] = useState('enter')
  const [shake, setShake] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const isSetup = mode === 'setup'
  const current = step === 'confirm' ? confirmPin : pin
  const setCurrent = step === 'confirm' ? setConfirmPin : setPin

  useEffect(() => {
    if (current.length === PIN_LENGTH) {
      handleComplete(current)
    }
  }, [current])

  async function handleComplete(value) {
    if (isSetup) {
      if (step === 'enter') {
        setStep('confirm')
        return
      }
      if (value !== pin) {
        triggerError('PINs do not match. Try again.')
        setConfirmPin('')
        setStep('enter')
        setPin('')
        return
      }
      setLoading(true)
      try {
        await onSetPin(pin)
        onSuccess()
      } catch (e) {
        triggerError(e.message)
      } finally {
        setLoading(false)
      }
    } else {
      setLoading(true)
      try {
        const ok = await onSuccess(value)
        if (!ok) {
          triggerError('Incorrect PIN. Try again.')
          setPin('')
        }
      } finally {
        setLoading(false)
      }
    }
  }

  function triggerError(msg) {
    setError(msg)
    setShake(true)
    setTimeout(() => setShake(false), 450)
    setTimeout(() => setError(''), 2800)
  }

  function handleDigit(d) {
    if (current.length < PIN_LENGTH && !loading) setCurrent(v => v + d)
  }

  function handleDelete() {
    if (!loading) setCurrent(v => v.slice(0, -1))
  }

  const title  = isSetup ? (step === 'enter' ? 'Create your PIN' : 'Confirm your PIN') : 'Enter PIN'
  const subtitle = isSetup
    ? (step === 'enter' ? 'Choose a 4-digit PIN to secure BudgetIQ' : 'Enter the same 4 digits again')
    : `Welcome back${userName ? ', ' + userName : ''}!`

  const numKeys = [
    '1','2','3',
    '4','5','6',
    '7','8','9',
    '','0','del',
  ]

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#0b0e1a',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '0 16px',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    }}>

      {/* Card */}
      <div style={{
        width: '100%', maxWidth: 340,
        background: '#12172b',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 24,
        padding: '36px 28px 32px',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>

        {/* Logo */}
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: 'linear-gradient(135deg, #3a57e8 0%, #5b7fff 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 26, marginBottom: 20,
          boxShadow: '0 4px 20px rgba(91,127,255,0.3)',
        }}>
          💰
        </div>

        {/* Title */}
        <p style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700, color: '#e4e8f5', letterSpacing: '-0.3px' }}>
          {title}
        </p>
        <p style={{ margin: '0 0 28px', fontSize: 13, color: '#6a7190', textAlign: 'center' }}>
          {subtitle}
        </p>

        {/* PIN dots */}
        <div style={{
          display: 'flex', gap: 16, marginBottom: 10,
          animation: shake ? 'pinShake 0.45s ease' : 'none',
        }}>
          <style>{`
            @keyframes pinShake {
              0%,100%{transform:translateX(0)}
              15%{transform:translateX(-9px)}
              30%{transform:translateX(9px)}
              45%{transform:translateX(-7px)}
              60%{transform:translateX(7px)}
              75%{transform:translateX(-4px)}
              90%{transform:translateX(4px)}
            }
          `}</style>
          {Array.from({ length: PIN_LENGTH }).map((_, i) => {
            const filled = i < current.length
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

        {/* Error */}
        <p style={{
          margin: '0 0 20px', fontSize: 12, color: '#ff5f5f',
          minHeight: 16, textAlign: 'center',
          opacity: error ? 1 : 0, transition: 'opacity 0.2s',
        }}>
          {error || ' '}
        </p>

        {/* Numpad */}
        {loading ? (
          <div style={{ padding: '40px 0', display: 'flex', justifyContent: 'center' }}>
            <CircularProgress size={28} style={{ color: '#5b7fff' }} />
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 10,
            width: '100%',
          }}>
            {numKeys.map((k, i) => {
              if (k === '') {
                return <div key={i} />
              }
              const isDel = k === 'del'
              return (
                <button
                  key={k + i}
                  onClick={() => isDel ? handleDelete() : handleDigit(k)}
                  style={{
                    height: 58,
                    borderRadius: 14,
                    border: isDel ? 'none' : '1px solid rgba(255,255,255,0.07)',
                    background: isDel ? 'transparent' : 'rgba(255,255,255,0.04)',
                    color: isDel ? '#6a7190' : '#e4e8f5',
                    fontSize: isDel ? 20 : 22,
                    fontWeight: isDel ? 400 : 600,
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'background 0.12s, transform 0.08s',
                    WebkitTapHighlightColor: 'transparent',
                    userSelect: 'none',
                    fontFamily: 'inherit',
                  }}
                  onMouseDown={e => { e.currentTarget.style.background = isDel ? 'rgba(255,255,255,0.04)' : 'rgba(91,127,255,0.15)'; e.currentTarget.style.transform = 'scale(0.94)' }}
                  onMouseUp={e => { e.currentTarget.style.background = isDel ? 'transparent' : 'rgba(255,255,255,0.04)'; e.currentTarget.style.transform = 'scale(1)' }}
                  onTouchStart={e => { e.currentTarget.style.background = isDel ? 'rgba(255,255,255,0.04)' : 'rgba(91,127,255,0.15)'; e.currentTarget.style.transform = 'scale(0.94)' }}
                  onTouchEnd={e => { e.currentTarget.style.background = isDel ? 'transparent' : 'rgba(255,255,255,0.04)'; e.currentTarget.style.transform = 'scale(1)' }}
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
        )}
      </div>

      {/* Bottom note for setup */}
      {isSetup && step === 'enter' && (
        <p style={{
          marginTop: 20, fontSize: 11.5, color: '#3a4575',
          textAlign: 'center', maxWidth: 300, lineHeight: 1.6,
        }}>
          This PIN cannot be changed later. You can always find it in Firebase console if needed.
        </p>
      )}
    </div>
  )
}
