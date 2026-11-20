import { makeStyles } from 'tss-react/mui'

// Styles for AIInsightsSection.jsx.
export const useAIInsightsSectionUi = makeStyles()((theme) => ({
  scoreHero: {
    padding: '20px 20px 18px',
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
    borderBottom: '1px solid rgb(var(--ink-rgb) / 0.05)',
  },
  scoreText: {
    flex: 1,
  },
  estimateBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    marginBottom: '6px',
    background: 'rgb(var(--warn-rgb) / 0.1)',
    border: '1px solid rgb(var(--warn-rgb) / 0.2)',
    borderRadius: '5px',
    padding: '2px 8px',
  },
  estimateText: {
    fontSize: 10,
    fontWeight: 700,
    color: 'var(--warn)',
    letterSpacing: '0.3px',
  },
  empIcon: {
    fontSize: 11,
  },
  summary: {
    fontSize: 14,
    color: 'var(--text-soft)',
    lineHeight: 1.6,
  },
  content: {
    padding: theme.spacing(0),
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '16px 18px 14px',
    flexShrink: 0,
    borderBottom: '1px solid rgb(var(--ink-rgb) / 0.06)',
  },
  headerIcon: {
    fontSize: 16,
    color: 'var(--accent-soft)',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontWeight: 700,
    fontSize: 14,
    color: 'var(--text)',
  },
  period: {
    fontSize: 10,
    color: 'var(--text3)',
    marginTop: '1px',
  },
  refreshButton: {
    color: 'var(--text-faint)',
    "&:hover": {
      color: 'var(--text-soft)',
    },
    width: 28,
    height: 28,
  },
  refreshSpinner: {
    color: 'var(--accent-soft)',
  },
  refreshIcon: {
    fontSize: 14,
  },
  closeButton: {
    color: 'var(--text-faint)',
    "&:hover": {
      color: 'var(--text-soft)',
    },
    width: 28,
    height: 28,
  },
  closeIcon: {
    fontSize: 14,
  },
  tabs: {
    display: 'flex',
    gap: '6px',
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
    paddingTop: theme.spacing(1.2),
    paddingBottom: theme.spacing(1.2),
    flexShrink: 0,
    borderBottom: '1px solid rgb(var(--ink-rgb) / 0.06)',
  },
  analysis: {
    overflowY: 'auto',
    flex: 1,
  },
  skeletonList: {
    padding: '12px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  loadingRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '2px',
  },
  loadingSpinner: {
    color: 'var(--accent-soft)',
  },
  loadingText: {
    fontSize: 11,
    color: 'var(--text-faint)',
  },
  errorArea: {
    padding: '20px',
  },
  errorBox: {
    background: 'rgb(var(--danger-soft-rgb) / 0.07)',
    border: '1px solid rgb(var(--danger-soft-rgb) / 0.2)',
    borderRadius: '10px',
    padding: '14px 16px',
  },
  errorText: {
    fontSize: 13,
    color: 'var(--danger-soft)',
    marginBottom: '8px',
  },
  retryLink: {
    fontSize: 12,
    color: 'var(--accent-soft)',
    cursor: 'pointer',
    textDecoration: 'underline',
  },
  insightList: {
    padding: '14px 14px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  insightTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flex: 1,
    minWidth: 0,
  },
  insightIcon: {
    fontSize: 15,
    flexShrink: 0,
  },
  numberRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  numberLabel: {
    fontSize: 12,
    color: 'var(--text-muted)',
  },
  insightActionBox: {
    padding: '10px 14px',
  },
  insightAction: {
    fontSize: 13,
    color: 'var(--text-soft)',
    lineHeight: 1.65,
  },
  chat: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    overflow: 'hidden',
  },
  messages: {
    overflowY: 'auto',
    flex: 1,
    padding: '14px 14px 8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  emptyChat: {
    paddingTop: theme.spacing(1),
  },
  chatIntro: {
    fontSize: 13,
    color: 'var(--text-faint)',
    textAlign: 'center',
    marginBottom: theme.spacing(2.5),
  },
  chatPeriod: {
    color: 'var(--text2)',
  },
  quickQuestions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    justifyContent: 'center',
  },
  quickQuestion: {
    padding: '7px 13px',
    borderRadius: '10px',
    cursor: 'pointer',
    border: '1px solid rgb(var(--accent-soft-rgb) / 0.18)',
    background: 'rgb(var(--accent-soft-rgb) / 0.04)',
    fontSize: 12,
    color: 'var(--text2)',
    transition: 'all 0.15s',
    "&:hover": {
      background: 'rgb(var(--accent-soft-rgb) / 0.1)',
      color: 'var(--text-soft)',
      borderColor: 'rgb(var(--accent-soft-rgb) / 0.35)',
    },
  },
  userRow: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  userBubble: {
    maxWidth: '82%',
    padding: '10px 14px',
    borderRadius: '16px 16px 4px 16px',
    background: 'var(--accent-deep)',
    border: '1px solid rgb(var(--accent-rgb) / 0.22)',
  },
  userText: {
    fontSize: 13,
    color: 'var(--text)',
    lineHeight: 1.6,
  },
  aiRow: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '7px',
  },
  aiAvatar: {
    width: 22,
    height: 22,
    borderRadius: '50%',
    flexShrink: 0,
    marginBottom: '2px',
    background: 'rgb(var(--accent-soft-rgb) / 0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiAvatarIcon: {
    fontSize: 11,
    color: 'var(--accent-soft)',
  },
  aiBubble: {
    maxWidth: '82%',
    padding: '10px 14px',
    borderRadius: '16px 16px 16px 4px',
    background: 'var(--surface2)',
    border: '1px solid rgb(var(--ink-rgb) / 0.06)',
  },
  aiText: {
    fontSize: 13,
    color: 'var(--text-soft)',
    lineHeight: 1.65,
    whiteSpace: 'pre-wrap',
  },
  cursor: {
    display: 'inline-block',
    width: '2px',
    height: '1em',
    background: 'var(--accent-soft)',
    marginLeft: '2px',
    verticalAlign: 'text-bottom',
    "@keyframes biqCursor": {
      "0%,100%": {
        opacity: 1,
      },
      "50%": {
        opacity: 0,
      },
    },
    animation: 'biqCursor 0.8s step-end infinite',
  },
  inputBar: {
    flexShrink: 0,
    padding: '10px 14px 12px',
    borderTop: '1px solid rgb(var(--ink-rgb) / 0.06)',
  },
  inputRow: {
    display: 'flex',
    gap: '8px',
    alignItems: 'flex-end',
  },
  chatInput: {
    "& .MuiOutlinedInput-root": {
      borderRadius: '12px',
      fontSize: 13,
      color: 'var(--text-soft)',
      background: 'var(--surface2)',
      "& fieldset": {
        borderColor: 'rgb(var(--ink-rgb) / 0.09)',
      },
      "&:hover fieldset": {
        borderColor: 'rgb(var(--accent-soft-rgb) / 0.3)',
      },
      "&.Mui-focused fieldset": {
        borderColor: 'rgb(var(--accent-soft-rgb) / 0.5)',
        borderWidth: 1,
      },
    },
    "& .MuiInputBase-input::placeholder": {
      color: 'var(--text3)',
      opacity: 1,
    },
  },
  sendIcon: {
    fontSize: 16,
  },
  // Tones: set --tone / --tone-rgb, which the pieces below read.
  toneAccent2: { '--tone': 'var(--accent2)', '--tone-rgb': 'var(--accent2-rgb)' },
  toneWarn: { '--tone': 'var(--warn)', '--tone-rgb': 'var(--warn-rgb)' },
  toneDangerSoft: { '--tone': 'var(--danger-soft)', '--tone-rgb': 'var(--danger-soft-rgb)' },
  toneAccentSoft: { '--tone': 'var(--accent-soft)', '--tone-rgb': 'var(--accent-soft-rgb)' },
  toneText2: { '--tone': 'var(--text2)', '--tone-rgb': 'var(--text2-rgb)' },
  toneTextSoft: { '--tone': 'var(--text-soft)', '--tone-rgb': 'var(--text-soft-rgb)' },
  scoreRing: {
    width: 72, height: 72, flexShrink: 0, borderRadius: '50%',
    border: '3px solid var(--tone)', background: 'rgb(var(--tone-rgb) / 0.07)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
  },
  scoreNum: { fontSize: 26, fontWeight: 800, lineHeight: 1, color: 'var(--tone)' },
  scoreLabel: { fontSize: 9, color: 'var(--tone)', opacity: 0.8 },
  empBadge: {
    display: 'inline-flex', alignItems: 'center', gap: '5px', marginBottom: '6px',
    background: 'rgb(var(--tone-rgb) / 0.08)', border: '1px solid rgb(var(--tone-rgb) / 0.19)',
    borderRadius: '5px', padding: '2px 8px',
  },
  empLabel: { fontSize: 10, fontWeight: 700, color: 'var(--tone)', letterSpacing: '0.3px' },
  tab: {
    padding: '4px 14px', borderRadius: '20px', cursor: 'pointer',
    fontSize: 12, fontWeight: 600, userSelect: 'none',
    background: 'transparent', color: 'var(--text-faint)', border: '1px solid transparent',
    transition: 'all 0.15s', '&:hover': { color: 'var(--text-soft)' },
  },
  tabActive: {
    background: 'rgb(var(--accent-soft-rgb) / 0.15)', color: 'var(--accent-soft)',
    borderColor: 'rgb(var(--accent-soft-rgb) / 0.3)',
  },
  skeleton: { height: 88, borderRadius: '12px', background: 'var(--bg)', border: '1px solid rgb(var(--ink-rgb) / 0.04)' },
  skeleton0: {
    '@keyframes biqPulse0': { '0%,100%': { opacity: 0.54 }, '50%': { opacity: 0.9 } },
    animation: 'biqPulse0 2s ease 0s infinite',
  },
  skeleton1: {
    '@keyframes biqPulse1': { '0%,100%': { opacity: 0.36 }, '50%': { opacity: 0.6 } },
    animation: 'biqPulse1 2s ease 0.35s infinite',
  },
  skeleton2: {
    '@keyframes biqPulse2': { '0%,100%': { opacity: 0.27 }, '50%': { opacity: 0.45 } },
    animation: 'biqPulse2 2s ease 0.7s infinite',
  },
  insightCard: { border: '1px solid rgb(var(--tone-rgb) / 0.25)', borderRadius: '12px', overflow: 'hidden', background: 'var(--bg)' },
  insightHead: {
    background: 'rgb(var(--tone-rgb) / 0.05)', padding: '11px 14px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px',
  },
  insightTitle: { fontSize: 13, fontWeight: 700, color: 'var(--tone)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  priorityBadge: { background: 'rgb(var(--tone-rgb) / 0.12)', borderRadius: '4px', padding: '2px 7px', flexShrink: 0 },
  priorityText: { fontSize: 9, fontWeight: 800, color: 'var(--tone)', letterSpacing: '0.5px' },
  insightNumbers: {
    padding: '10px 14px', background: 'rgba(0,0,0,0.2)',
    borderTop: '1px solid rgb(var(--tone-rgb) / 0.25)', borderBottom: '1px solid rgb(var(--ink-rgb) / 0.04)',
    display: 'flex', flexDirection: 'column', gap: '5px',
  },
  numberValue: { fontSize: 13, fontWeight: 700, color: 'var(--tone)', fontVariantNumeric: 'tabular-nums' },
  send: {
    background: 'rgb(var(--ink-rgb) / 0.04)', color: 'var(--text3)',
    borderRadius: '12px', width: 36, height: 36, flexShrink: 0, transition: 'all 0.2s',
    '&:hover': { background: 'rgb(var(--ink-rgb) / 0.06)' },
    '&.Mui-disabled': { color: 'var(--text3) !important', background: 'rgb(var(--ink-rgb) / 0.04) !important' },
  },
  sendReady: {
    background: 'var(--accent-strong)', color: '#fff',
    '&:hover': { background: 'var(--accent-strong)' },
  },
}))
