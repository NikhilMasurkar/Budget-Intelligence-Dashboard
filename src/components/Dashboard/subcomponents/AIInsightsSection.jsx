import { useState, useEffect, useRef, useMemo } from 'react'
import { useThemeMode } from '../../../theme/tokens'
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
  getChatResponseStream, buildFinancialContext, AI_ENABLED
} from '../../../api/gemini'
import { useAIInsightsSectionUi } from '../styles/AIInsightsSection.styles'

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

function makeCacheKey(year, selMonths, expenses, income, categories = []) {
  const sel = selMonths || []
  const mk  = [...sel].sort((a,b)=>a-b).join(',')
  const expRows = expenses
    .filter(e => sel.includes(+e.month-1))
    .map(e => `${e.month}|${e.categoryId}|${e.itemName}|${Math.round(+e.amount||0)}`)
  const incRows = income
    .filter(i => sel.includes(+i.month-1))
    .map(i => `${i.month}|${i.source}|${Math.round(+i.amount||0)}`)
  // Category NAMES go in the prompt, so renaming one must bust the cache even
  // though every row's categoryId is unchanged.
  const catRows = categories.map(c => `${c.id}|${c.name}`)
  return `${CACHE_PREFIX}${year}_${mk}_${hashRows(expRows)}_${hashRows(incRows)}_${hashRows(catRows)}`
}

// `tone` names a tone class in the stylesheet (toneAccent2, toneWarn, …).
const TYPE = {
  alert:    { icon: '🚨', tone: 'toneDangerSoft' },
  warning:  { icon: '⚠️', tone: 'toneWarn' },
  tip:      { icon: '💡', tone: 'toneAccentSoft' },
  positive: { icon: '✅', tone: 'toneAccent2' },
}
const PRIORITY = {
  high:   { label: 'HIGH PRIORITY', tone: 'toneDangerSoft' },
  medium: { label: 'MEDIUM',        tone: 'toneWarn' },
  low:    { label: 'GOOD TO KNOW',  tone: 'toneAccentSoft' },
}
const NUM_TONE = { red: 'toneDangerSoft', green: 'toneAccent2', amber: 'toneWarn', neutral: 'toneTextSoft' }
const SCORE_TONE = s => s >= 7 ? 'toneAccent2' : s >= 5 ? 'toneWarn' : 'toneDangerSoft'
const SCORE_LABEL = s => s >= 8 ? 'Great' : s >= 6 ? 'Good' : s >= 4 ? 'Okay' : 'Needs work'
const EMPLOYMENT_CONFIG = {
  salaried:   { label: 'Salaried',   icon: '💼',    tone: 'toneAccent2' },
  freelancer: { label: 'Freelancer', icon: '🧑‍💻', tone: 'toneWarn' },
  general:    { label: 'Individual', icon: '👤',    tone: 'toneText2' },
}
const QUICK_QUESTIONS = [
  'Where am I overspending?',
  'What can I cut to save more?',
  'Am I saving enough?',
  'How long to build a ₹1 lakh emergency fund?',
]

// ── Score hero shared between loading + done states ───────────────────────────
function ScoreHero({ score, summary, employment, isEstimate }) {
  const { classes: ui, cx } = useAIInsightsSectionUi()
  const emp = employment ? EMPLOYMENT_CONFIG[employment] || EMPLOYMENT_CONFIG.general : null
  return (
    <Box className={ui.box1}>
      <Box className={cx(ui.scoreRing, ui[SCORE_TONE(score)])}>
        <Typography className={ui.scoreNum}>
          {score}
        </Typography>
        <Typography className={ui.scoreLabel}>
          {SCORE_LABEL(score)}
        </Typography>
      </Box>

      <Box className={ui.box2}>
        {isEstimate ? (
          <Box className={ui.box3}>
            <Typography className={ui.typography1}>
              ⚡ Quick estimate
            </Typography>
          </Box>
        ) : emp ? (
          <Box className={cx(ui.empBadge, ui[emp.tone])}>
            <span className={ui.span1}>{emp.icon}</span>
            <Typography className={ui.empLabel}>
              {emp.label}
            </Typography>
          </Box>
        ) : null}

        <Typography className={ui.typography2}>{summary}</Typography>
      </Box>
    </Box>
  )
}

export default function AIInsightsSection({ open, onClose, expenses, income, categories, year, selMonths, userName }) {
  const { classes: ui, cx } = useAIInsightsSectionUi()
  useThemeMode() // re-render so chart/score colours follow the theme
  const [state,    setState]    = useState('idle')
  const [result,   setResult]   = useState(null)
  const [errorMsg, setErrorMsg] = useState('')

  const [activeTab,     setActiveTab]     = useState('analysis')
  const [chatMessages,  setChatMessages]  = useState([])
  const [chatInput,     setChatInput]     = useState('')
  const [chatLoading,   setChatLoading]   = useState(false)
  const chatEndRef  = useRef(null)
  const fetchingRef = useRef(false)  // prevents concurrent analysis fetches

  const hasKey        = AI_ENABLED
  // Memoised: a fresh array each render would recompute every memo below on every render.
  const effectiveMonths = useMemo(() => (selMonths?.length ? selMonths : [0,1,2,3,4,5,6,7,8,9,10,11]), [selMonths])
  const cacheKey      = makeCacheKey(year, effectiveMonths, expenses, income, categories)
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
  // eslint-disable-next-line react-hooks/exhaustive-deps -- cacheKey already encodes the data; refetch only when it changes
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
  // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when opened or the period changes
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
        background: 'var(--bg)', border: '1px solid rgb(var(--ink-rgb) / 0.09)',
        borderRadius: '18px', boxShadow: '0 32px 80px rgba(0,0,0,0.7)', maxHeight: '92vh',
      }
    }}>
      <DialogContent className={ui.dialogContent1}>

        {/* ── Header ── */}
        <Box className={ui.box4}>
          <AutoAwesomeIcon className={ui.autoAwesomeIcon1} />
          <Box className={ui.box5}>
            <Typography className={ui.typography3}>AI Budget Analysis</Typography>
            <Typography className={ui.typography4}>
              {periodLabel}{result?._model ? ` · ${result._model}` : ''}
            </Typography>
          </Box>
          {activeTab === 'analysis' && (
            <IconButton className={ui.iconButton1} size="small" onClick={() => runAnalysis(true)} disabled={state === 'loading'}
             >
              {state === 'loading'
                ? <CircularProgress className={ui.circularProgress1} size={12} />
                : <RefreshIcon className={ui.refreshIcon1} />}
            </IconButton>
          )}
          <IconButton className={ui.iconButton2} size="small" onClick={onClose}
           >
            <CloseIcon className={ui.closeIcon1} />
          </IconButton>
        </Box>

        {/* ── Tabs ── */}
        <Box className={ui.box6}>
          {[{ key: 'analysis', label: '📊 Analysis' }, { key: 'chat', label: '💬 Ask AI' }].map(t => (
            <Box key={t.key} onClick={() => setActiveTab(t.key)}
              className={cx(ui.tab, activeTab === t.key && ui.tabActive)}>
              {t.label}
            </Box>
          ))}
        </Box>

        {/* ═══════════════════════════════════════
            ANALYSIS TAB
        ═══════════════════════════════════════ */}
        {activeTab === 'analysis' && (
          <Box className={ui.box7}>

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
                <Box className={ui.box8}>
                  <Box className={ui.box9}>
                    <CircularProgress className={ui.circularProgress2} size={12} />
                    <Typography className={ui.typography5}>AI building detailed insights…</Typography>
                  </Box>

                  {[0, 1, 2].map(i => (
                    <Box key={i} className={cx(ui.skeleton, ui[`skeleton${i}`])} />
                  ))}
                </Box>
              </Box>
            )}

            {/* Error */}
            {state === 'error' && (
              <Box className={ui.box10}>
                <Box className={ui.box11}>
                  <Typography className={ui.typography6}>⚠️ {errorMsg}</Typography>
                  <Typography className={ui.typography7} onClick={() => runAnalysis(true)}
                   >
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
                <Box className={ui.box12}>
                  {(result.insights || []).map((ins, i) => {
                    const t   = TYPE[ins.type]        || TYPE.tip
                    const pri = PRIORITY[ins.priority] || PRIORITY.low
                    return (
                      <Box key={i} className={cx(ui.insightCard, ui[t.tone])}>
                        <Box className={ui.insightHead}>
                          <Box className={ui.box13}>
                            <span className={ui.span2}>{t.icon}</span>
                            <Typography className={ui.insightTitle}>
                              {ins.title}
                            </Typography>
                          </Box>
                          {ins.priority && (
                            <Box className={cx(ui.priorityBadge, ui[pri.tone])}>
                              <Typography className={ui.priorityText}>
                                {pri.label}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                        {ins.numbers?.length > 0 && (
                          <Box className={ui.insightNumbers}>
                            {ins.numbers.map((n, j) => (
                              <Box className={ui.box14} key={j}>
                                <Typography className={ui.typography8}>{n.label}</Typography>
                                <Typography className={cx(ui.numberValue, ui[NUM_TONE[n.color] || NUM_TONE.neutral])}>
                                  {n.value}
                                </Typography>
                              </Box>
                            ))}
                          </Box>
                        )}
                        <Box className={ui.box15}>
                          <Typography className={ui.typography9}>{ins.action}</Typography>
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
          <Box className={ui.box16}>

            {/* Messages */}
            <Box className={ui.box17}>

              {/* Empty state */}
              {chatMessages.length === 0 && !chatLoading && (
                <Box className={ui.box18}>
                  <Typography className={ui.typography10}>
                    Ask me anything about your{' '}
                    <span className={ui.span3}>{periodLabel}</span> finances
                  </Typography>
                  <Box className={ui.box19}>
                    {QUICK_QUESTIONS.map(q => (
                      <Box className={ui.box20} key={q} onClick={() => handleSendChat(q)}>
                        {q}
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}

              {/* Message bubbles */}
              {chatMessages.map((msg, i) =>
                msg.role === 'user' ? (
                  <Box className={ui.box21} key={i}>
                    <Box className={ui.box22}>
                      <Typography className={ui.typography11}>{msg.text}</Typography>
                    </Box>
                  </Box>
                ) : (
                  <Box className={ui.box23} key={i}>
                    <Box className={ui.box24}>
                      <AutoAwesomeIcon className={ui.autoAwesomeIcon2} />
                    </Box>
                    <Box className={ui.box25}>
                      <Typography className={ui.typography12}>
                        {msg.text}
                        {msg.streaming && (
                          <Box className={ui.box26} component="span" />
                        )}
                      </Typography>
                    </Box>
                  </Box>
                )
              )}

              <div ref={chatEndRef} />
            </Box>

            {/* Input */}
            <Box className={ui.box27}>
              <Box className={ui.box28}>
                <TextField className={ui.textField1}
                  fullWidth multiline maxRows={3}
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendChat() } }}
                  placeholder="Ask about your spending…"
                  variant="outlined" size="small"
                />
                <IconButton
                  onClick={() => handleSendChat()}
                  disabled={!chatInput.trim() || chatLoading}
                  className={cx(ui.send, chatInput.trim() && !chatLoading && ui.sendReady)}>
                  <SendIcon className={ui.sendIcon1} />
                </IconButton>
              </Box>
            </Box>

          </Box>
        )}

      </DialogContent>
    </Dialog>
  )
}
