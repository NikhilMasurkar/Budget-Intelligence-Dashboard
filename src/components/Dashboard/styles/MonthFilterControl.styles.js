import { makeStyles } from 'tss-react/mui'

export const useStyles = makeStyles()((theme) => ({
  container: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    marginBottom: '24px',
    alignItems: 'center'
  },
  filterLabel: {
    fontSize: '12px',
    color: '#8891b8',
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
    border: '1px solid rgba(255, 255, 255, 0.12)',
    color: '#8891b8',
    backgroundColor: 'transparent',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.04)',
      borderColor: 'rgba(255, 255, 255, 0.2)'
    }
  },
  buttonActive: {
    backgroundColor: '#5b7fff',
    borderColor: '#5b7fff',
    color: 'white',
    '&:hover': {
      backgroundColor: '#4a6eee',
      borderColor: '#4a6eee'
    }
  },
  divider: {
    width: '1px',
    height: '20px',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
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
    border: '1px solid rgba(255, 255, 255, 0.08)',
    color: '#8891b8',
    backgroundColor: 'transparent',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.04)',
      borderColor: 'rgba(255, 255, 255, 0.15)'
    }
  },
  qButtonActive: {
    backgroundColor: '#5b7fff',
    borderColor: '#5b7fff',
    color: 'white',
    '&:hover': {
      backgroundColor: '#4a6eee',
      borderColor: '#4a6eee'
    }
  }
}))
