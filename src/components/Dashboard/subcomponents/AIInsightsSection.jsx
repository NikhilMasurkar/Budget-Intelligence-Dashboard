import React, { useState, useEffect } from 'react'
import {
  Box, Typography, CircularProgress,
  Dialog, DialogContent, IconButton
} from '@mui/material'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import CloseIcon from '@mui/icons-material/Close'
import RefreshIcon from '@mui/icons-material/Refresh'
import { getAIInsights } from '../../../api/gemini'

// v7 — selMonths-aware cache
const CACHE_PREFIX = 'budgetiq_ai_v7_'

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function getPeriodLabel(selMonths, year) {
  if (!selMonths?.length) return `${year}`
  const s = [...selMonths].sort((a, b) => a - b)
  if (s.length === 1)  return `${MONTH_NAMES[s[0]]} ${year}`
  if (s.length === 12) return `Full Year ${year}`
  if (s.length === 3 && s[0] === 0 && s[2] === 2)  return `Q1 ${year}`
  if (s.length === 3 && s[0] === 3 && s[2] === 5)  return `Q2 ${year}`
  if (s.length === 3 && s[0] === 6 && s[2] === 8)  return `Q3 ${year}`
  if (s.length === 3 && s[0] === 9 && s[2] === 11) return `Q4 ${year}`
  if (s.length === 6 && s[0] === 0 && s[5] === 5)  return `H1 ${year}`
  if (s.length === 6 && s[0] === 6 && s[5] === 11) return `H2 ${year}`
  return s.map(m => MONTH_NAMES[m]).join(', ') + ` ${year}`
}

function makeCacheKey(year, selMonths, expenses, income) {
  const monthsKey = [...(selMonths || [])].sort((a,b)=>a-b).join(',')
  const filtExp = expenses.filter(e => (selMonths || []).includes(+e.month - 1))
  const filtInc = income.filter(i => (selMonths || []).includes(+i.month - 1))
  const totalExp = filtExp.reduce((s, e) => s + (+e.amount || 0), 0)
  const totalInc = filtInc.reduce((s, i) => s + (+i.amount || 0), 0)
  return `${CACHE_PREFIX}${year}_${monthsKey}_${Math.round(totalExp)}_${Math.round(totalInc)}`
}

const TYPE = {
  alert:    { icon: '🚨', color: '#ff6b6b', border: 'rgba(255,107,107,0.25)', bg: 'rgba(255,107,107,0.05)' },
  warning:  { icon: '⚠️', color: '#ffb347', border: 'rgba(255,179,71,0.25)',  bg: 'rgba(255,179,71,0.05)'  },
  tip:      { icon: '💡', color: '#a0b4ff', border: 'rgba(91,127,255,0.25)',  bg: 'rgba(91,127,255,0.05)'  },
  positive: { icon: '✅', color: '#3de8a0', border: 'rgba(61,232,160,0.25)',  bg: 'rgba(61,232,160,0.05)'  },
}

const PRIORITY = {
  high:   { label: 'HIGH PRIORITY', color: '#ff6b6b', bg: 'rgba(255,107,107,0.12)' },
  medium: { label: 'MEDIUM',        color: '#ffb347', bg: 'rgba(255,179,71,0.12)'  },
  low:    { label: 'GOOD TO KNOW',  color: '#a0b4ff', bg: 'rgba(91,127,255,0.12)'  },
}

const NUM_COLOR = {
  red: '#ff6b6b', green: '#3de8a0', amber: '#ffb347', neutral: '#c8cfea'
}

const SCORE_COLOR = (s) => s >= 7 ? '#3de8a0' : s >= 5 ? '#ffb347' : '#ff6b6b'
const SCORE_LABEL = (s) => s >= 8 ? 'Great' : s >= 6 ? 'Good' : s >= 4 ? 'Okay' : 'Needs work'

const EMPLOYMENT_CONFIG = {
  salaried:   { label: 'Salaried', icon: '💼', color: '#3de8a0' },
  freelancer: { label: 'Freelancer', icon: '🧑‍💻', color: '#ffb347' },
  general:    { label: 'Individual', icon: '👤', color: '#8891b8' },
}

export default function AIInsightsSection({ open, onClose, expenses, income, categories, year, selMonths, userName }) {
  const [state, setState] = useState('idle')
  const [result, setResult] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')

  const hasKey = !!import.meta.env.VITE_GEMINI_API_KEY
  const effectiveMonths = selMonths?.length ? selMonths : [0,1,2,3,4,5,6,7,8,9,10,11]
  const cacheKey  = makeCacheKey(year, effectiveMonths, expenses, income)
  const periodLabel = getPeriodLabel(effectiveMonths, year)

  // When modal opens (or selMonths changes while open), check cache
  useEffect(() => {
    if (!open || !hasKey) return
    setState('idle')
    setResult(null)
    try {
      const cached = localStorage.getItem(cacheKey)
      if (cached) { setResult(JSON.parse(cached)); setState('done'); return }
    } catch {}
    runAnalysis()
  }, [open, cacheKey])

  const runAnalysis = async (force = false) => {
    if (!force) {
      try {
        const cached = localStorage.getItem(cacheKey)
        if (cached) { setResult(JSON.parse(cached)); setState('done'); return }
      } catch {}
    }
    setState('loading')
    setErrorMsg('')
    try {
      const data = await getAIInsights({
        expenses, income, categories,
        selMonths: effectiveMonths,
        year, userName
      })
      setResult(data)
      localStorage.setItem(cacheKey, JSON.stringify(data))
      setState('done')
    } catch (e) {
      setErrorMsg(e.message)
      setState('error')
    }
  }

  if (!hasKey) return null

  const emp = result?._employment ? EMPLOYMENT_CONFIG[result._employment] || EMPLOYMENT_CONFIG.general : null

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          background: '#0f1117',
          border: '1px solid rgba(255,255,255,0.09)',
          borderRadius: '18px',
          boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
          maxHeight: '92vh',
        }
      }}
    >
      <DialogContent sx={{ padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* ── Top bar ── */}
        <Box sx={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '16px 18px 14px', flexShrink: 0,
          borderBottom: '1px solid rgba(255,255,255,0.06)'
        }}>
          <AutoAwesomeIcon sx={{ fontSize: 16, color: '#a0b4ff' }} />
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontWeight: 700, fontSize: 14, color: '#e4e8f5' }}>
              AI Budget Analysis
            </Typography>
            <Typography sx={{ fontSize: 10, color: '#4a5070', mt: '1px' }}>
              {periodLabel}{result?._model ? ` · ${result._model}` : ''}
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => runAnalysis(true)} disabled={state === 'loading'}
            sx={{ color: '#5a6080', '&:hover': { color: '#c8cfea' }, width: 28, height: 28 }}>
            {state === 'loading'
              ? <CircularProgress size={12} sx={{ color: '#a0b4ff' }} />
              : <RefreshIcon sx={{ fontSize: 14 }} />
            }
          </IconButton>
          <IconButton size="small" onClick={onClose}
            sx={{ color: '#5a6080', '&:hover': { color: '#c8cfea' }, width: 28, height: 28 }}>
            <CloseIcon sx={{ fontSize: 14 }} />
          </IconButton>
        </Box>

        {/* ── Body ── */}
        <Box sx={{ overflowY: 'auto', flex: 1, pb: '8px' }}>

          {/* Loading */}
          {state === 'loading' && (
            <Box sx={{ padding: '56px 20px', textAlign: 'center' }}>
              <CircularProgress size={28} sx={{ color: '#a0b4ff', mb: '14px' }} />
              <Typography sx={{ fontSize: 13, color: '#8891b8' }}>
                Analysing {periodLabel}…
              </Typography>
              <Typography sx={{ fontSize: 11, color: '#5a6080', mt: '4px' }}>
                {effectiveMonths.length === 1
                  ? 'Looking at this month\'s spending'
                  : `Covering ${effectiveMonths.length} months of data`}
              </Typography>
            </Box>
          )}

          {/* Error */}
          {state === 'error' && (
            <Box sx={{ padding: '20px' }}>
              <Box sx={{
                background: 'rgba(255,107,107,0.07)', border: '1px solid rgba(255,107,107,0.2)',
                borderRadius: '10px', padding: '14px 16px'
              }}>
                <Typography sx={{ fontSize: 13, color: '#ff7070', mb: '8px' }}>⚠️ {errorMsg}</Typography>
                <Typography onClick={() => runAnalysis(true)}
                  sx={{ fontSize: 12, color: '#a0b4ff', cursor: 'pointer', textDecoration: 'underline' }}>
                  Retry
                </Typography>
              </Box>
            </Box>
          )}

          {/* Results */}
          {state === 'done' && result && (
            <Box>

              {/* Score hero */}
              <Box sx={{
                padding: '20px 20px 18px',
                display: 'flex', gap: '16px', alignItems: 'center',
                borderBottom: '1px solid rgba(255,255,255,0.05)'
              }}>
                <Box sx={{
                  width: 72, height: 72, flexShrink: 0, borderRadius: '50%',
                  border: `3px solid ${SCORE_COLOR(result.score)}`,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  background: `${SCORE_COLOR(result.score)}12`
                }}>
                  <Typography sx={{ fontSize: 26, fontWeight: 800, lineHeight: 1, color: SCORE_COLOR(result.score) }}>
                    {result.score}
                  </Typography>
                  <Typography sx={{ fontSize: 9, color: SCORE_COLOR(result.score), opacity: 0.8 }}>
                    {SCORE_LABEL(result.score)}
                  </Typography>
                </Box>

                <Box sx={{ flex: 1 }}>
                  {emp && (
                    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: '5px', mb: '6px',
                      background: `${emp.color}14`, border: `1px solid ${emp.color}30`,
                      borderRadius: '5px', padding: '2px 8px' }}>
                      <span style={{ fontSize: 11 }}>{emp.icon}</span>
                      <Typography sx={{ fontSize: 10, fontWeight: 700, color: emp.color, letterSpacing: '0.3px' }}>
                        {emp.label}
                      </Typography>
                    </Box>
                  )}
                  <Typography sx={{ fontSize: 14, color: '#d4d9f0', lineHeight: 1.6 }}>
                    {result.summary}
                  </Typography>
                </Box>
              </Box>

              {/* Insight cards */}
              <Box sx={{ padding: '14px 14px 12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {(result.insights || []).map((ins, i) => {
                  const t   = TYPE[ins.type]       || TYPE.tip
                  const pri = PRIORITY[ins.priority] || PRIORITY.low
                  return (
                    <Box key={i} sx={{
                      border: `1px solid ${t.border}`,
                      borderRadius: '12px', overflow: 'hidden',
                      background: '#13161f'
                    }}>
                      {/* Header */}
                      <Box sx={{
                        background: t.bg, padding: '11px 14px',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px'
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                          <span style={{ fontSize: 15, flexShrink: 0 }}>{t.icon}</span>
                          <Typography sx={{
                            fontSize: 13, fontWeight: 700, color: t.color,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                          }}>
                            {ins.title}
                          </Typography>
                        </Box>
                        {ins.priority && (
                          <Box sx={{ background: pri.bg, borderRadius: '4px', padding: '2px 7px', flexShrink: 0 }}>
                            <Typography sx={{ fontSize: 9, fontWeight: 800, color: pri.color, letterSpacing: '0.5px' }}>
                              {pri.label}
                            </Typography>
                          </Box>
                        )}
                      </Box>

                      {/* Numbers */}
                      {ins.numbers?.length > 0 && (
                        <Box sx={{
                          padding: '10px 14px',
                          background: 'rgba(0,0,0,0.2)',
                          borderTop: `1px solid ${t.border}`,
                          borderBottom: '1px solid rgba(255,255,255,0.04)',
                          display: 'flex', flexDirection: 'column', gap: '5px'
                        }}>
                          {ins.numbers.map((n, j) => (
                            <Box key={j} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography sx={{ fontSize: 12, color: '#7a849e' }}>{n.label}</Typography>
                              <Typography sx={{
                                fontSize: 13, fontWeight: 700,
                                color: NUM_COLOR[n.color] || NUM_COLOR.neutral,
                                fontVariantNumeric: 'tabular-nums'
                              }}>
                                {n.value}
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      )}

                      {/* Action */}
                      <Box sx={{ padding: '10px 14px' }}>
                        <Typography sx={{ fontSize: 13, color: '#c2c9e0', lineHeight: 1.65 }}>
                          {ins.action}
                        </Typography>
                      </Box>
                    </Box>
                  )
                })}
              </Box>

            </Box>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  )
}
