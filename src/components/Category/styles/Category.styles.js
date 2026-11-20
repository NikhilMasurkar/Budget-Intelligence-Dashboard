import { makeStyles } from 'tss-react/mui'

export const useCategoryModalStyles = makeStyles()((theme) => ({
  dialog: {
    '& .MuiDialog-paper': {
      maxWidth: '380px',
      width: 'calc(100% - 32px)',
      margin: '16px',
      borderRadius: '12px',
      border: '1px solid rgb(var(--ink-rgb) / 0.13)',
      backgroundColor: 'var(--bg)',
      backgroundImage: 'none',
      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.5)',
      overflowY: 'auto', maxHeight: 'calc(100dvh - 32px)',
    }
  },
  content: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    [theme.breakpoints.up('sm')]: {
      padding: '28px'
    }
  },
  iconBadge: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    backgroundColor: 'rgb(var(--accent-rgb) / 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '20px',
    border: '1px solid rgb(var(--accent-rgb) / 0.25)',
    boxShadow: '0 0 12px rgb(var(--accent-rgb) / 0.1)'
  },
  title: {
    fontWeight: 800,
    fontSize: '16px',
    marginBottom: '24px',
    color: 'var(--text)',
    letterSpacing: '-0.01em',
    textAlign: 'center'
  },
  formContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    width: '100%',
    marginBottom: '28px'
  },
  colorPickerLabel: {
    display: 'block',
    color: 'var(--text2)',
    marginBottom: '6px',
    fontWeight: 600,
    fontSize: '11px'
  },
  colorPickerRow: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center'
  },
  colorInput: {
    width: '56px',
    height: '36px',
    backgroundColor: 'transparent',
    border: '1px solid rgb(var(--ink-rgb) / 0.12)',
    borderRadius: '8px',
    cursor: 'pointer',
    padding: 0,
    outline: 'none',
    overflow: 'hidden',
    '&::-webkit-color-swatch-wrapper': { padding: 0 },
    '&::-webkit-color-swatch': { border: 'none' }
  },
  colorPreview: {
    flex: 1,
    height: '36px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: '16px',
    paddingRight: '16px'
  },
  colorPreviewText: {
    fontWeight: 700,
    letterSpacing: '0.5px',
    fontSize: '11.5px'
  },
  actionsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    width: '100%'
  },
  saveButton: {
    paddingTop: '9px',
    paddingBottom: '9px',
    fontWeight: 700,
    borderRadius: '8px',
    fontSize: '13px',
    boxShadow: '0 4px 12px rgb(var(--accent-rgb) / 0.2)',
    '&:hover': {
      boxShadow: '0 6px 16px rgb(var(--accent-rgb) / 0.3)'
    }
  },
  cancelButton: {
    paddingTop: '7px',
    paddingBottom: '7px',
    borderRadius: '8px',
    borderColor: theme.palette.divider,
    color: 'var(--text2)',
    fontSize: '13px',
    fontWeight: 600,
    '&:hover': {
      borderColor: 'var(--text)',
      color: 'var(--text)',
      backgroundColor: 'rgb(var(--ink-rgb) / 0.03)'
    }
  },
  fieldStyles: {
    '& .MuiInputLabel-root': {
      fontSize: '13px'
    },
    '& .MuiInputBase-input': {
      fontSize: '13px'
    },
    '& .MuiOutlinedInput-root': {
      borderRadius: '2px',
      backgroundColor: 'rgb(var(--ink-rgb) / 0.03)',
      '& fieldset': {
        borderColor: 'rgb(var(--ink-rgb) / 0.08)'
      },
      '&:hover fieldset': {
        borderColor: 'rgb(var(--ink-rgb) / 0.15)'
      },
      '&.Mui-focused fieldset': {
        borderColor: 'var(--accent)'
      }
    },
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: 'rgb(var(--ink-rgb) / 0.08)'
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: 'rgb(var(--ink-rgb) / 0.15)'
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: 'var(--accent)'
    },
    '& .MuiSelect-select': {
      fontSize: '13px'
    }
  }
}))
