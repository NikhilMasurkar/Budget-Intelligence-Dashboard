import { makeStyles } from 'tss-react/mui'

// Styles for ExpenseBars.jsx.
export const useExpenseBarsUi = makeStyles()((theme) => ({
  usage: {
    flex: 1,
    minWidth: 120,
  },
  usageTrack: {
    height: 6,
    borderRadius: theme.shape.borderRadius * 3,
    background: 'rgb(var(--ink-rgb) / 0.08)',
    overflow: 'hidden',
  },
  usageText: {
    fontSize: 10,
    color: 'var(--text2)',
    marginTop: '4px',
  },
  bulkBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 14px',
    marginBottom: '10px',
    flexWrap: 'wrap',
    background: 'rgb(var(--accent-rgb) / 0.1)',
    border: '1px solid rgb(var(--accent-rgb) / 0.35)',
    borderRadius: '10px',
    position: 'sticky',
    top: 8,
    zIndex: 5,
    backdropFilter: 'blur(6px)',
  },
  bulkCount: {
    fontSize: 13,
    fontWeight: 700,
    color: 'var(--accent-soft)',
  },
  bulkSpacer: {
    flex: 1,
  },
  deleteQuestion: {
    fontSize: 12,
    color: 'var(--danger-soft)',
  },
  bulkCancel: {
    fontSize: 12,
    color: 'var(--text2)',
    textTransform: 'none',
    minWidth: 0,
  },
  pinIcon: {
    fontSize: 15,
  },
  deleteIcon: {
    fontSize: 15,
  },
  bulkClear: {
    fontSize: 12,
    color: 'var(--text2)',
    textTransform: 'none',
    minWidth: 0,
  },
  budgetText: { fontSize: 11, color: 'var(--text2)', fontWeight: 600, paddingLeft: '20px' },
  budgetWarn: { color: 'var(--warn)' },
  budgetOver: { color: 'var(--danger-soft)' },
  income: { color: 'var(--accent2)' },
  spent: { color: 'var(--danger-soft)' },
  invested: { color: 'var(--purple)' },
  remaining: { color: 'var(--accent-soft)' },
  fill: { height: '100%', transition: 'width 0.3s', background: 'var(--accent)' },
  fillWarn: { background: 'var(--warn)' },
  fillFull: { background: 'var(--danger-soft)' },
  bulkBtn: { fontSize: 12, fontWeight: 700, textTransform: 'none', borderRadius: '7px' },
  bulkDanger: { background: 'var(--danger)', '&:hover': { background: 'var(--danger-strong)' } },
  bulkPrimary: { background: 'var(--accent)', '&:hover': { background: 'var(--accent-strong)' } },
  bulkAccentOutline: {
    color: 'var(--accent-soft)', borderColor: 'rgb(var(--accent-rgb) / 0.4)',
    '&:hover': { borderColor: 'rgb(var(--accent-rgb) / 0.7)', background: 'rgb(var(--accent-rgb) / 0.08)' },
  },
  bulkPlainOutline: {
    color: 'var(--text-soft)', borderColor: 'rgb(var(--ink-rgb) / 0.15)',
    '&:hover': { borderColor: 'rgb(var(--ink-rgb) / 0.3)', background: 'rgb(var(--ink-rgb) / 0.04)' },
  },
  bulkDangerOutline: {
    color: 'var(--danger-soft)', borderColor: 'rgb(var(--danger-rgb) / 0.4)',
    '&:hover': { borderColor: 'rgb(var(--danger-rgb) / 0.7)', background: 'rgb(var(--danger-rgb) / 0.08)' },
  },
}))

// The income-used bar: its width is the percentage.
export const useFillWidth = makeStyles()((_theme, pct) => ({
  width: { width: `${pct}%` },
}))
