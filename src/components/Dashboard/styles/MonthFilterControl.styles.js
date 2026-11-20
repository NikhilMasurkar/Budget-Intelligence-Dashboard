import { makeStyles } from 'tss-react/mui'

export const useStyles = makeStyles()(() => ({
  container: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    marginBottom: '24px',
    alignItems: 'center'
  },
  filterLabel: {
    fontSize: '12px',
    color: 'var(--text2)',
    marginRight: '4px',
    fontWeight: 600
  },
  buttonCommon: {
    paddingTop: '4px',
    paddingBottom: '4px',
    paddingLeft: '10px',
    paddingRight: '10px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 600,
    minWidth: 'auto',
    textTransform: 'none',
    border: '1px solid rgb(var(--ink-rgb) / 0.12)',
    color: 'var(--text2)',
    backgroundColor: 'transparent',
    '&:hover': {
      backgroundColor: 'rgb(var(--ink-rgb) / 0.04)',
      borderColor: 'rgb(var(--ink-rgb) / 0.2)'
    }
  },
  buttonActive: {
    backgroundColor: 'var(--accent)',
    borderColor: 'var(--accent)',
    color: 'white',
    '&:hover': {
      backgroundColor: 'var(--accent-strong)',
      borderColor: 'var(--accent-strong)'
    }
  },
  divider: {
    width: '1px',
    height: '20px',
    backgroundColor: 'rgb(var(--ink-rgb) / 0.08)',
    marginLeft: '6px',
    marginRight: '6px'
  },
  qButtonCommon: {
    paddingTop: '4px',
    paddingBottom: '4px',
    paddingLeft: '10px',
    paddingRight: '10px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 600,
    minWidth: 'auto',
    textTransform: 'none',
    border: '1px solid rgb(var(--ink-rgb) / 0.08)',
    color: 'var(--text2)',
    backgroundColor: 'transparent',
    '&:hover': {
      backgroundColor: 'rgb(var(--ink-rgb) / 0.04)',
      borderColor: 'rgb(var(--ink-rgb) / 0.15)'
    }
  },
  qButtonActive: {
    backgroundColor: 'var(--accent)',
    borderColor: 'var(--accent)',
    color: 'white',
    '&:hover': {
      backgroundColor: 'var(--accent-strong)',
      borderColor: 'var(--accent-strong)'
    }
  }
}))
