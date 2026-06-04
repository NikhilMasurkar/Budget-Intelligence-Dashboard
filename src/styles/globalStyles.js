import { makeStyles } from 'tss-react/mui'

export const useGlobalStyles = makeStyles()((theme) => ({
  globalContainer: {
    minHeight: '100vh',
    backgroundColor: '#101218',
    color: '#e4e8f5'
  },
  contentArea: {
    paddingLeft: '12px',
    paddingRight: '12px',
    paddingTop: '16px',
    paddingBottom: '16px',
    maxWidth: '1800px',
    marginLeft: 'auto',
    marginRight: 'auto',
    [theme.breakpoints.up('sm')]: {
      paddingLeft: '3%',
      paddingRight: '3%'
    }
  },
  glassCard: {
    backgroundColor: '#181b28',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '20px',
    [theme.breakpoints.up('sm')]: {
      padding: '18px'
    }
  },
  nativeSelectFormControl: {
    minWidth: '90px'
  },
  nativeSelect: {
    height: '34px',
    fontSize: '13px',
    fontWeight: 600,
    backgroundColor: '#181b28',
    color: '#e4e8f5',
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: 'rgba(255, 255, 255, 0.08)'
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: '#5b7fff'
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: '#5b7fff'
    },
    '& select': {
      paddingTop: '6px',
      paddingBottom: '6px',
      paddingLeft: '12px',
      paddingRight: '12px',
      backgroundColor: '#181b28',
      color: '#e4e8f5'
    }
  },
  containedBlueButton: {
    backgroundColor: '#5b7fff',
    color: 'white',
    textTransform: 'none',
    fontWeight: 600,
    borderRadius: '8px',
    height: '34px',
    fontSize: '13px',
    paddingLeft: '16px',
    paddingRight: '16px',
    boxShadow: 'none',
    '&:hover': {
      backgroundColor: '#4a6eee',
      boxShadow: 'none'
    }
  }
}))
