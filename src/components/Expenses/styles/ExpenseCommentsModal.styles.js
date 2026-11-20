import { makeStyles } from 'tss-react/mui'

// Styles for ExpenseCommentsModal.jsx.
export const useExpenseCommentsModalUi = makeStyles()((theme) => ({
  dialogTitle1: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    paddingBottom: theme.spacing(1),
    paddingTop: theme.spacing(2),
    fontSize: 15,
    fontWeight: 700,
  },
  chatBubbleOutlinedIcon1: {
    fontSize: 18,
    color: 'var(--accent)',
    flexShrink: 0,
  },
  box1: {
    flex: 1,
    minWidth: 0,
  },
  typography1: {
    fontSize: 15,
    fontWeight: 700,
    color: 'var(--text)',
    lineHeight: 1.2,
  },
  typography2: {
    fontSize: 11,
    color: 'var(--text2)',
    marginTop: '2px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  iconButton1: {
    color: 'var(--text2)',
    flexShrink: 0,
  },
  closeIcon1: {
    fontSize: 18,
  },
  divider1: {
    borderColor: 'rgb(var(--ink-rgb) / 0.08)',
  },
  dialogContent1: {
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
    paddingTop: theme.spacing(1.5),
    paddingBottom: theme.spacing(1.5),
    overflowY: 'auto',
    minHeight: 100,
    maxHeight: 320,
  },
  typography3: {
    fontSize: 13,
    color: 'var(--text-faint)',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
  },
  box2: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
  },
  box3: {
    background: 'rgb(var(--ink-rgb) / 0.03)',
    border: '1px solid rgb(var(--ink-rgb) / 0.06)',
    borderRadius: '10px',
    padding: '10px 12px',
    position: 'relative',
    "&:hover .comment-delete": {
      opacity: 1,
    },
  },
  typography4: {
    fontSize: 10,
    color: 'var(--text-faint)',
    marginTop: '4px',
  },
  button1: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 0,
    paddingLeft: '8px',
    paddingRight: '8px',
    paddingTop: '2px',
    paddingBottom: '2px',
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'none',
    borderRadius: '6px',
    color: '#fff',
    background: 'var(--danger-strong)',
    "&:hover": {
      background: 'var(--danger-strong)',
    },
  },
  iconButton2: {
    position: 'absolute',
    top: 4,
    right: 4,
    opacity: 0,
    "@media (hover: none)": {
      opacity: 1,
    },
    transition: 'opacity 0.15s',
    color: 'var(--text-faint)',
    "&:hover": {
      color: 'var(--danger-strong)',
      background: 'rgb(var(--danger-strong-rgb) / 0.1)',
    },
    padding: '6px',
  },
  deleteIcon1: {
    fontSize: 16,
  },
  divider2: {
    borderColor: 'rgb(var(--ink-rgb) / 0.08)',
  },
  typography5: {
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
    paddingTop: theme.spacing(1.5),
    paddingBottom: theme.spacing(1.5),
    fontSize: 12,
    color: 'var(--text-faint)',
    textAlign: 'center',
  },
  box4: {
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
    paddingTop: theme.spacing(1.5),
    paddingBottom: theme.spacing(1.5),
    display: 'flex',
    gap: theme.spacing(1),
    alignItems: 'flex-end',
  },
  textField1: {
    "& .MuiOutlinedInput-root": {
      background: 'rgb(var(--ink-rgb) / 0.04)',
      fontSize: 13,
      color: 'var(--text)',
      "& fieldset": {
        borderColor: 'rgb(var(--ink-rgb) / 0.12)',
      },
      "&:hover fieldset": {
        borderColor: 'rgb(var(--ink-rgb) / 0.2)',
      },
      "&.Mui-focused fieldset": {
        borderColor: 'var(--accent)',
      },
    },
    "& .MuiOutlinedInput-input": {
      color: 'var(--text)',
    },
    "& .MuiOutlinedInput-input::placeholder": {
      color: 'var(--text-faint)',
    },
  },
  button2: {
    minWidth: 56,
    fontSize: 12,
    fontWeight: 700,
    textTransform: 'none',
    borderRadius: '8px',
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
    height: 36,
    flexShrink: 0,
    background: 'var(--accent)',
    "&:hover": {
      background: 'var(--accent-strong)',
    },
    "&.Mui-disabled": {
      background: 'rgb(var(--accent-rgb) / 0.3)',
      color: 'rgb(var(--ink-rgb) / 0.3)',
    },
  },
  commentText: { fontSize: 13, color: 'var(--text)', lineHeight: 1.5, wordBreak: 'break-word', whiteSpace: 'pre-wrap' },
  commentTextEditable: { paddingRight: '36px' },
}))
