import { makeStyles } from 'tss-react/mui'

// Styles for AIInsightsSection.jsx.
export const useAIInsightsSectionUi = makeStyles()((theme) => ({
  box1: {
    padding: '20px 20px 18px',
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
    borderBottom: '1px solid rgb(var(--ink-rgb) / 0.05)',
  },
  box2: {
    flex: 1,
  },
  box3: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    marginBottom: '6px',
    background: 'rgb(var(--warn-rgb) / 0.1)',
    border: '1px solid rgb(var(--warn-rgb) / 0.2)',
    borderRadius: '5px',
    padding: '2px 8px',
  },
  typography1: {
    fontSize: 10,
    fontWeight: 700,
    color: 'var(--warn)',
    letterSpacing: '0.3px',
  },
  span1: {
    fontSize: 11,
  },
  typography2: {
    fontSize: 14,
    color: 'var(--text-soft)',
    lineHeight: 1.6,
  },
  dialogContent1: {
    padding: theme.spacing(0),
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  box4: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '16px 18px 14px',
    flexShrink: 0,
    borderBottom: '1px solid rgb(var(--ink-rgb) / 0.06)',
  },
  autoAwesomeIcon1: {
    fontSize: 16,
    color: 'var(--accent-soft)',
  },
  box5: {
    flex: 1,
  },
  typography3: {
    fontWeight: 700,
    fontSize: 14,
    color: 'var(--text)',
  },
  typography4: {
    fontSize: 10,
    color: 'var(--text3)',
    marginTop: '1px',
  },
  iconButton1: {
    color: 'var(--text-faint)',
    "&:hover": {
      color: 'var(--text-soft)',
    },
    width: 28,
    height: 28,
  },
  circularProgress1: {
    color: 'var(--accent-soft)',
  },
  refreshIcon1: {
    fontSize: 14,
  },
  iconButton2: {
    color: 'var(--text-faint)',
    "&:hover": {
      color: 'var(--text-soft)',
    },
    width: 28,
    height: 28,
  },
  closeIcon1: {
    fontSize: 14,
  },
  box6: {
    display: 'flex',
    gap: '6px',
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
    paddingTop: theme.spacing(1.2),
    paddingBottom: theme.spacing(1.2),
    flexShrink: 0,
    borderBottom: '1px solid rgb(var(--ink-rgb) / 0.06)',
  },
  box7: {
    overflowY: 'auto',
    flex: 1,
  },
  box8: {
    padding: '12px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  box9: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '2px',
  },
  circularProgress2: {
    color: 'var(--accent-soft)',
  },
  typography5: {
    fontSize: 11,
    color: 'var(--text-faint)',
  },
  box10: {
    padding: '20px',
  },
  box11: {
    background: 'rgb(var(--danger-soft-rgb) / 0.07)',
    border: '1px solid rgb(var(--danger-soft-rgb) / 0.2)',
    borderRadius: '10px',
    padding: '14px 16px',
  },
  typography6: {
    fontSize: 13,
    color: 'var(--danger-soft)',
    marginBottom: '8px',
  },
  typography7: {
    fontSize: 12,
    color: 'var(--accent-soft)',
    cursor: 'pointer',
    textDecoration: 'underline',
  },
  box12: {
    padding: '14px 14px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  box13: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flex: 1,
    minWidth: 0,
  },
  span2: {
    fontSize: 15,
    flexShrink: 0,
  },
  box14: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typography8: {
    fontSize: 12,
    color: 'var(--text-muted)',
  },
  box15: {
    padding: '10px 14px',
  },
  typography9: {
    fontSize: 13,
    color: 'var(--text-soft)',
    lineHeight: 1.65,
  },
  box16: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    overflow: 'hidden',
  },
  box17: {
    overflowY: 'auto',
    flex: 1,
    padding: '14px 14px 8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  box18: {
    paddingTop: theme.spacing(1),
  },
  typography10: {
    fontSize: 13,
    color: 'var(--text-faint)',
    textAlign: 'center',
    marginBottom: theme.spacing(2.5),
  },
  span3: {
    color: 'var(--text2)',
  },
  box19: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    justifyContent: 'center',
  },
  box20: {
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
  box21: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  box22: {
    maxWidth: '82%',
    padding: '10px 14px',
    borderRadius: '16px 16px 4px 16px',
    background: 'var(--accent-deep)',
    border: '1px solid rgb(var(--accent-rgb) / 0.22)',
  },
  typography11: {
    fontSize: 13,
    color: 'var(--text)',
    lineHeight: 1.6,
  },
  box23: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '7px',
  },
  box24: {
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
  autoAwesomeIcon2: {
    fontSize: 11,
    color: 'var(--accent-soft)',
  },
  box25: {
    maxWidth: '82%',
    padding: '10px 14px',
    borderRadius: '16px 16px 16px 4px',
    background: 'var(--surface2)',
    border: '1px solid rgb(var(--ink-rgb) / 0.06)',
  },
  typography12: {
    fontSize: 13,
    color: 'var(--text-soft)',
    lineHeight: 1.65,
    whiteSpace: 'pre-wrap',
  },
  box26: {
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
  box27: {
    flexShrink: 0,
    padding: '10px 14px 12px',
    borderTop: '1px solid rgb(var(--ink-rgb) / 0.06)',
  },
  box28: {
    display: 'flex',
    gap: '8px',
    alignItems: 'flex-end',
  },
  textField1: {
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
  sendIcon1: {
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
