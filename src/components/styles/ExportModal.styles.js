import { makeStyles } from 'tss-react/mui'

// Styles for ExportModal.jsx.
export const useExportModalUi = makeStyles()((theme) => ({
  typography1: {
    fontWeight: 700,
    marginBottom: theme.spacing(1.5),
    alignSelf: 'flex-start',
    color: theme.palette.text.secondary,
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  button1: {
    marginTop: theme.spacing(1.5),
    color: theme.palette.text.secondary,
    textTransform: 'none',
  },
}))
