import { makeStyles } from 'tss-react/mui'

// Styles for UpiPayButtons.jsx.
export const useUpiPayButtonsUi = makeStyles()((theme) => ({
  upiBlock: {
    marginTop: theme.spacing(1.5),
    textAlign: 'center',
  },
  caption: {
    color: theme.palette.text.secondary,
    display: 'block',
    marginBottom: theme.spacing(0.75),
  },
  appList: {
    display: 'flex',
    gap: theme.spacing(1),
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  appButton: {
    minHeight: 36,
    textTransform: 'none',
    borderRadius: theme.shape.borderRadius * 2,
  },
}))
