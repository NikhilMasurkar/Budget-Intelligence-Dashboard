import React, { useState, useEffect, useRef, useMemo } from 'react'
import {
  Box, Typography, CircularProgress,
  Dialog, DialogContent, IconButton, TextField
} from '@mui/material'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import CloseIcon        from '@mui/icons-material/Close'
import RefreshIcon      from '@mui/icons-material/Refresh'
import SendIcon         from '@mui/icons-material/Send'
import {
  getAIInsights, calcInstantScore,
  getChatResponseStream, buildFinancialContext
} from '../../../api/gemini'

const CACHE_PREFIX = 'budgetiq_ai_v7_'
const MONTH_NAMES  = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

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

// Small stable hash so the cache key reflects WHAT the data is, not just its
// total — recategorising or renaming an item (same period total) must bust it.
function hashRows(rows) {
  let h = 0
  for (const s of rows.sort()) {
    for (let i = 0; i < s.length; i++) {
      h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
    }
  }
  return (h >>> 0).toString(36)
}

function makeCacheKey(year, selMonths, expenses, income) {
  const sel = selMonths || []
  const mk  = [...sel].sort((a,b)=>a-b).join(',')
  const expRows = expenses
    .filter(e => sel.includes(+e.month-1))
    .map(e => `${e.month}|${e.categoryId}|${e.itemName}|${Math.round(+e.amount||0)}`)
  const incRows = income
    .filter(i => sel.includes(+i.month-1))
    .map(i => `${i.month}|${i.source}|${Math.round(+i.amount||0)}`)
  return `${CACHE_PREFIX}${year}_${mk}_${hashRows(expRows)}_${hashRows(incRows)}`
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
const NUM_COLOR = { red: '#ff6b6b', green: '#3de8a0', amber: '#ffb347', neutral: '#c8cfea' }
const SCORE_COLOR = s => s >= 7 ? '#3de8a0' : s >= 5 ? '#ffb347' : '#ff6b6b'
const SCORE_LABEL = s => s >= 8 ? 'Great' : s >= 6 ? 'Good' : s >= 4 ? 'Okay' : 'Needs work'
const EMPLOYMENT_CONFIG = {
  salaried:   { label: 'Salaried',   icon: '💼',    color: '#3de8a0' },
  freelancer: { label: 'Freelancer', icon: '🧑‍💻', color: '#ffb347' },
  general:    { label: 'Individual', icon: '👤',    color: '#8891b8' },
}
const QUICK_QUESTIONS = [
  'Where am I overspending?',
  'What can I cut to save more?',
  'Am I saving enough?',
  'How long to build a ₹1 lakh emergency fund?',
]

// ── Score hero shared between loading + done states ───────────────────────────
function ScoreHero({ score, summary, employment, isEstimate }) {
  const emp = employment ? EMPLOYMENT_CONFIG[employment] || EMPLOYMENT_CONFIG.general : null
  return (
    <Box sx={{
      padding: '20px 20px 18px', display: 'flex', gap: '16px', alignItems: 'center',
      borderBottom: '1px solid rgba(255,255,255,0.05)'
    }}>
      <Box sx={{
        width: 72, height: 72, flexShrink: 0, borderRadius: '50%',
        border: `3px solid ${SCORE_COLOR(score)}`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        background: `${SCORE_COLOR(score)}12`
      }}>
        <Typography sx={{ fontSize: 26, fontWeight: 800, lineHeight: 1, color: SCORE_COLOR(score) }}>
          {score}
        </Typography>
        <Typography sx={{ fontSize: 9, color: SCORE_COLOR(score), opacity: 0.8 }}>
          {SCORE_LABEL(score)}
        </Typography>
      </Box>

      <Box sx={{ flex: 1 }}>
        {isEstimate ? (
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: '5px', mb: '6px',
            background: 'rgba(255,179,71,0.1)', border: '1px solid rgba(255,179,71,0.2)',
            borderRadius: '5px', padding: '2px 8px' }}>
            <Typography sx={{ fontSize: 10, fontWeight: 700, color: '#ffb347', letterSpacing: '0.3px' }}>
              ⚡ Quick estimate
            </Typography>
          </Box>
        ) : emp ? (
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: '5px', mb: '6px',
            background: `${emp.color}14`, border: `1px solid ${emp.color}30`,
            borderRadius: '5px', padding: '2px 8px' }}>
            <span style={{ fontSize: 11 }}>{emp.icon}</span>
            <Typography sx={{ fontSize: 10, fontWeight: 700, color: emp.color, letterSpacing: '0.3px' }}>
              {emp.label}
            </Typography>
          </Box>
        ) : null}

        <Typography sx={{ fontSize: 14, color: '#d4d9f0', lineHeight: 1.6 }}>{summary}</Typography>
      </Box>
    </Box>
  )
}

export default function AIInsightsSection({ open, onClose, expenses, income, categories, year, selMonths, userName }) {
  const [state,    setState]    = useState('idle')
  const [result,   setResult]   = useState(null)
  const [errorMsg, setErrorMsg] = useState('')

  const [activeTab,     setActiveTab]     = useState('analysis')
  const [chatMessages,  setChatMessages]  = useState([])
  const [chatInput,     setChatInput]     = useState('')
  const [chatLoading,   setChatLoading]   = useState(false)
  const chatEndRef  = useRef(null)
  const fetchingRef = useRef(false)  // prevents concurrent analysis fetches

  const hasKey        = !!import.meta.env.VITE_GEMINI_API_KEY
  const effectiveMonths = selMonths?.length ? selMonths : [0,1,2,3,4,5,6,7,8,9,10,11]
  const cacheKey      = makeCacheKey(year, effectiveMonths, expenses, income)
  const periodKey     = `${year}_${[...effectiveMonths].sort((a,b)=>a-b).join(',')}`
  const periodLabel   = getPeriodLabel(effectiveMonths, year)

  // Instant score — pure JS, available immediately with no API call
  const instantScore = useMemo(() => {
    if (!expenses.length && !income.length) return null
    return calcInstantScore({ expenses, income, categories, selMonths: effectiveMonths })
  }, [expenses, income, categories, effectiveMonths])

  const financialContext = useMemo(
    () => buildFinancialContext({ expenses, income, categories, selMonths: effectiveMonths, year, userName }),
    [expenses, income, categories, effectiveMonths, year, userName]
  )

  // ── Background prefetch — fires even when modal is closed ────────────────
  useEffect(() => {
    if (!hasKey || (!expenses.length && !income.length)) return
    try { if (localStorage.getItem(cacheKey)) return } catch {}
    if (fetchingRef.current) return

    fetchingRef.current = true
    getAIInsights({ expenses, income, categories, selMonths: effectiveMonths, year, userName })
      .then(data => {
        fetchingRef.current = false
        try { localStorage.setItem(cacheKey, JSON.stringify(data)) } catch {}
        setResult(data)
        setState('done')
      })
      .catch(err => {
        fetchingRef.current = false
        setErrorMsg(err.message || 'Analysis failed')
        setState(prev => prev === 'loading' ? 'error' : prev)
      })
  }, [cacheKey, hasKey])

  // ── Modal open — reset UI, read cache (likely already populated) ──────────
  useEffect(() => {
    if (!open || !hasKey) return
    setActiveTab('analysis')
    setChatMessages([])
    setChatInput('')
    setState('idle')
    setResult(null)
    try {
      const cached = localStorage.getItem(cacheKey)
      if (cached) { setResult(JSON.parse(cached)); setState('done'); return }
    } catch {}
    // Not cached yet — show loading state; background prefetch will resolve it
    setState('loading')
  }, [open, periodKey])

  // Chat auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const runAnalysis = async (force = false) => {
    if (!force) {
      try {
        const cached = localStorage.getItem(cacheKey)
        if (cached) { setResult(JSON.parse(cached)); setState('done'); return }
      } catch {}
    }
    if (fetchingRef.current && !force) {
      setState('loading')
      return  // background prefetch will update state when done
    }
    setState('loading')
    setErrorMsg('')
    fetchingRef.current = true
    try {
      const data = await getAIInsights({ expenses, income, categories, selMonths: effectiveMonths, year, userName })
      setResult(data)
      try { localStorage.setItem(cacheKey, JSON.stringify(data)) } catch {}
      setState('done')
    } catch (e) {
      setErrorMsg(e.message)
      setState('error')
    } finally {
      fetchingRef.current = false
    }
  }

  // ── Streaming chat send ───────────────────────────────────────────────────
  const handleSendChat = async (text) => {
    const msg = (text !== undefined ? text : chatInput).trim()
    if (!msg || chatLoading) return
    setChatInput('')
    setChatLoading(true)

    const history = [...chatMessages, { role: 'user', text: msg }]
    setChatMessages([...history, { role: 'ai', text: '', streaming: true }])

    try {
      await getChatResponseStream({
        messages: history,
        financialContext,
        onChunk: txt => {
          setChatMessages(prev => [
            ...prev.slice(0, -1),
            { role: 'ai', text: txt, streaming: true }
          ])
        }
      })
      setChatMessages(prev => {
        const last = prev[prev.length - 1]
        return [...prev.slice(0, -1), { role: 'ai', text: last?.text || '', streaming: false }]
      })
    } catch (e) {
      setChatMessages(prev => [
        ...prev.slice(0, -1),
        { role: 'ai', text: `Sorry, something went wrong. ${e.message}`, streaming: false }
      ])
    } finally {
      setChatLoading(false)
    }
  }

  if (!hasKey) return null

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{
      sx: {
        background: '#0f1117', border: '1px solid rgba(255,255,255,0.09)',
        borderRadius: '18px', boxShadow: '0 32px 80px rgba(0,0,0,0.7)', maxHeight: '92vh',
      }
    }}>
      <DialogContent sx={{ padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* ── Header ── */}
        <Box sx={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '16px 18px 14px', flexShrink: 0,
          borderBottom: '1px solid rgba(255,255,255,0.06)'
        }}>
          <AutoAwesomeIcon sx={{ fontSize: 16, color: '#a0b4ff' }} />
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontWeight: 700, fontSize: 14, color: '#e4e8f5' }}>AI Budget Analysis</Typography>
            <Typography sx={{ fontSize: 10, color: '#4a5070', mt: '1px' }}>
              {periodLabel}{result?._model ? ` · ${result._model}` : ''}
            </Typography>
          </Box>
          {activeTab === 'analysis' && (
            <IconButton size="small" onClick={() => runAnalysis(true)} disabled={state === 'loading'}
              sx={{ color: '#5a6080', '&:hover': { color: '#c8cfea' }, width: 28, height: 28 }}>
              {state === 'loading'
                ? <CircularProgress size={12} sx={{ color: '#a0b4ff' }} />
                : <RefreshIcon sx={{ fontSize: 14 }} />}
            </IconButton>
          )}
          <IconButton size="small" onClick={onClose}
            sx={{ color: '#5a6080', '&:hover': { color: '#c8cfea' }, width: 28, height: 28 }}>
            <CloseIcon sx={{ fontSize: 14 }} />
          </IconButton>
        </Box>

        {/* ── Tabs ── */}
        <Box sx={{
          display: 'flex', gap: '6px', px: 2, py: 1.2, flexShrink: 0,
          borderBottom: '1px solid rgba(255,255,255,0.06)'
        }}>
          {[{ key: 'analysis', label: '📊 Analysis' }, { key: 'chat', label: '💬 Ask AI' }].map(t => (
            <Box key={t.key} onClick={() => setActiveTab(t.key)} sx={{
              padding: '4px 14px', borderRadius: '20px', cursor: 'pointer',
              fontSize: 12, fontWeight: 600, userSelect: 'none',
              background: activeTab === t.key ? 'rgba(160,180,255,0.15)' : 'transparent',
              color: activeTab === t.key ? '#a0b4ff' : '#5a6080',
              border: `1px solid ${activeTab === t.key ? 'rgba(160,180,255,0.3)' : 'transparent'}`,
              transition: 'all 0.15s', '&:hover': { color: '#c8cfea' }
            }}>
              {t.label}
            </Box>
          ))}
        </Box>

        {/* ═══════════════════════════════════════
            ANALYSIS TAB
        ═══════════════════════════════════════ */}
        {activeTab === 'analysis' && (
          <Box sx={{ overflowY: 'auto', flex: 1 }}>

            {/* Loading — show instant score + skeleton cards */}
            {state === 'loading' && (
              <Box>
                {instantScore && (
                  <ScoreHero
                    score={instantScore.score}
                    summary={instantScore.summary}
                    employment={instantScore.employment}
                    isEstimate
                  />
                )}
                {/* Skeleton insight cards */}
                <Box sx={{ p: '12px 14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', mb: '2px' }}>
                    <CircularProgress size={12} sx={{ color: '#a0b4ff' }} />
                    <Typography sx={{ fontSize: 11, color: '#5a6080' }}>AI building detailed insights…</Typography>
                  </Box>

                  {[0.9, 0.6, 0.45].map((op, i) => (
                    <Box key={i} sx={{
                      height: 88, borderRadius: '12px', background: '#13161f',
                      border: '1px solid rgba(255,255,255,0.04)',
                      '@keyframes biqPulse': {
                        '0%,100%': { opacity: op * 0.6 },
                        '50%': { opacity: op }
                      },
                      animation: `biqPulse 2s ease ${i * 0.35}s infinite`
                    }} />
                  ))}
                </Box>
              </Box>
            )}

            {/* Error */}
            {state === 'error' && (
              <Box sx={{ p: '20px' }}>
                <Box sx={{
                  background: 'rgba(255,107,107,0.07)', border: '1px solid rgba(255,107,107,0.2)',
                  borderRadius: '10px', p: '14px 16px'
                }}>
                  <Typography sx={{ fontSize: 13, color: '#ff7070', mb: '8px' }}>⚠️ {errorMsg}</Typography>
                  <Typography onClick={() => runAnalysis(true)}
                    sx={{ fontSize: 12, color: '#a0b4ff', cursor: 'pointer', textDecoration: 'underline' }}>
                    Retry
                  </Typography>
                </Box>
              </Box>
            )}

            {/* Done */}
            {state === 'done' && result && (
              <Box>
                <ScoreHero
                  score={result.score}
                  summary={result.summary}
                  employment={result._employment}
                  isEstimate={false}
                />
                <Box sx={{ p: '14px 14px 12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {(result.insights || []).map((ins, i) => {
                    const t   = TYPE[ins.type]        || TYPE.tip
                    const pri = PRIORITY[ins.priority] || PRIORITY.low
                    return (
                      <Box key={i} sx={{ border: `1px solid ${t.border}`, borderRadius: '12px', overflow: 'hidden', background: '#13161f' }}>
                        <Box sx={{ background: t.bg, p: '11px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                            <span style={{ fontSize: 15, flexShrink: 0 }}>{t.icon}</span>
                            <Typography sx={{ fontSize: 13, fontWeight: 700, color: t.color, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {ins.title}
                            </Typography>
                          </Box>
                          {ins.priority && (
                            <Box sx={{ background: pri.bg, borderRadius: '4px', p: '2px 7px', flexShrink: 0 }}>
                              <Typography sx={{ fontSize: 9, fontWeight: 800, color: pri.color, letterSpacing: '0.5px' }}>
                                {pri.label}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                        {ins.numbers?.length > 0 && (
                          <Box sx={{ p: '10px 14px', background: 'rgba(0,0,0,0.2)', borderTop: `1px solid ${t.border}`, borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            {ins.numbers.map((n, j) => (
                              <Box key={j} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography sx={{ fontSize: 12, color: '#7a849e' }}>{n.label}</Typography>
                                <Typography sx={{ fontSize: 13, fontWeight: 700, color: NUM_COLOR[n.color] || NUM_COLOR.neutral, fontVariantNumeric: 'tabular-nums' }}>
                                  {n.value}
                                </Typography>
                              </Box>
                            ))}
                          </Box>
                        )}
                        <Box sx={{ p: '10px 14px' }}>
                          <Typography sx={{ fontSize: 13, color: '#c2c9e0', lineHeight: 1.65 }}>{ins.action}</Typography>
                        </Box>
                      </Box>
                    )
                  })}
                </Box>
              </Box>
            )}
          </Box>
        )}
        
        {activeTab === 'chat' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>

            {/* Messages */}
            <Box sx={{ overflowY: 'auto', flex: 1, p: '14px 14px 8px', display: 'flex', flexDirection: 'column', gap: '10px' }}>

              {/* Empty state */}
              {chatMessages.length === 0 && !chatLoading && (
                <Box sx={{ pt: 1 }}>
                  <Typography sx={{ fontSize: 13, color: '#5a6080', textAlign: 'center', mb: 2.5 }}>
                    Ask me anything about your{' '}
                    <span style={{ color: '#8891b8' }}>{periodLabel}</span> finances
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
                    {QUICK_QUESTIONS.map(q => (
                      <Box key={q} onClick={() => handleSendChat(q)} sx={{
                        p: '7px 13px', borderRadius: '10px', cursor: 'pointer',
                        border: '1px solid rgba(160,180,255,0.18)',
                        background: 'rgba(160,180,255,0.04)',
                        fontSize: 12, color: '#8891b8', transition: 'all 0.15s',
                        '&:hover': { background: 'rgba(160,180,255,0.1)', color: '#c8cfea', borderColor: 'rgba(160,180,255,0.35)' }
                      }}>
                        {q}
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}

              {/* Message bubbles */}
              {chatMessages.map((msg, i) =>
                msg.role === 'user' ? (
                  <Box key={i} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Box sx={{ maxWidth: '82%', p: '10px 14px', borderRadius: '16px 16px 4px 16px', background: '#1e2d5e', border: '1px solid rgba(91,127,255,0.22)' }}>
                      <Typography sx={{ fontSize: 13, color: '#d4dcff', lineHeight: 1.6 }}>{msg.text}</Typography>
                    </Box>
                  </Box>
                ) : (
                  <Box key={i} sx={{ display: 'flex', alignItems: 'flex-end', gap: '7px' }}>
                    <Box sx={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, mb: '2px', background: 'rgba(160,180,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <AutoAwesomeIcon sx={{ fontSize: 11, color: '#a0b4ff' }} />
                    </Box>
                    <Box sx={{ maxWidth: '82%', p: '10px 14px', borderRadius: '16px 16px 16px 4px', background: '#161c30', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <Typography sx={{ fontSize: 13, color: '#c2c9e0', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>
                        {msg.text}
                        {msg.streaming && (
                          <Box component="span" sx={{
                            display: 'inline-block', width: '2px', height: '1em',
                            background: '#a0b4ff', ml: '2px', verticalAlign: 'text-bottom',
                            '@keyframes biqCursor': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0 } },
                            animation: 'biqCursor 0.8s step-end infinite'
                          }} />
                        )}
                      </Typography>
                    </Box>
                  </Box>
                )
              )}

              <div ref={chatEndRef} />
            </Box>

            {/* Input */}
            <Box sx={{ flexShrink: 0, p: '10px 14px 12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <Box sx={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                <TextField
                  fullWidth multiline maxRows={3}
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendChat() } }}
                  placeholder="Ask about your spending…"
                  variant="outlined" size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px', fontSize: 13, color: '#c8cfea', background: '#161c30',
                      '& fieldset': { borderColor: 'rgba(255,255,255,0.09)' },
                      '&:hover fieldset': { borderColor: 'rgba(160,180,255,0.3)' },
                      '&.Mui-focused fieldset': { borderColor: 'rgba(160,180,255,0.5)', borderWidth: 1 },
                    },
                    '& .MuiInputBase-input::placeholder': { color: '#4a5070', opacity: 1 }
                  }}
                />
                <IconButton
                  onClick={() => handleSendChat()}
                  disabled={!chatInput.trim() || chatLoading}
                  sx={{
                    background: chatInput.trim() && !chatLoading ? '#2d4eff' : 'rgba(255,255,255,0.04)',
                    color: chatInput.trim() && !chatLoading ? '#fff' : '#4a5070',
                    borderRadius: '12px', width: 36, height: 36, flexShrink: 0, transition: 'all 0.2s',
                    '&:hover': { background: chatInput.trim() && !chatLoading ? '#3d5fff' : 'rgba(255,255,255,0.06)' },
                    '&.Mui-disabled': { color: '#4a5070 !important', background: 'rgba(255,255,255,0.04) !important' }
                  }}>
                  <SendIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Box>
            </Box>

          </Box>
        )}

      </DialogContent>
    </Dialog>
  )
}
