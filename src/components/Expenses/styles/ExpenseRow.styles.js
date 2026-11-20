import { makeStyles } from 'tss-react/mui'

// Styles for ExpenseRow.jsx.
export const useExpenseRowUi = makeStyles()((theme) => ({
  selectBox: {
    padding: '8px',
    marginRight: '2px',
    color: 'var(--line)',
    "&.Mui-checked": {
      color: 'var(--accent)',
    },
    [theme.breakpoints.up('sm')]: {
      padding: theme.spacing(0),
    },
  },
  details: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    flex: 'unset',
  },
  lastComment: {
    fontSize: 11,
    color: 'var(--text2)',
    lineHeight: 1.4,
    cursor: 'pointer',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  updatedText: {
    fontSize: 10,
    color: 'var(--line)',
    display: 'block',
    lineHeight: 1.4,
  },
  commentIcon: {
    fontSize: 18,
    [theme.breakpoints.up('sm')]: {
      fontSize: 14,
    },
  },
  commentBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    fontSize: 8,
    fontWeight: 800,
    lineHeight: 1,
    background: 'var(--accent)',
    color: '#fff',
    borderRadius: '50%',
    width: 12,
    height: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editIcon: {
    fontSize: 18,
    [theme.breakpoints.up('sm')]: {
      fontSize: 14,
    },
  },
  deleteIcon: {
    fontSize: 18,
    [theme.breakpoints.up('sm')]: {
      fontSize: 14,
    },
  },
  rowSelected: { background: 'rgb(var(--accent-rgb) / 0.06)' },
  amountNegative: { color: 'var(--danger-soft)' },
  commentBtn: {
    padding: '9px',
    position: 'relative',
    color: 'var(--text3)',
    '&:hover': { color: 'var(--accent)', background: 'rgb(var(--accent-rgb) / 0.1)' },
    [theme.breakpoints.up('sm')]: { padding: '3px' },
  },
  commentBtnHas: { color: 'var(--accent)' },
}))
