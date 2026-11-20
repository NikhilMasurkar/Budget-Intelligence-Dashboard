import { makeStyles } from 'tss-react/mui'

// Styles for UpiPayButtons.jsx.
export const useUpiPayButtonsUi = makeStyles()((theme) => ({
  box1: {
    marginTop: theme.spacing(1.5),
    textAlign: 'center',
  },
  typography1: {
    color: theme.palette.text.secondary,
    display: 'block',
    marginBottom: theme.spacing(0.75),
  },
  box2: {
    display: 'flex',
    gap: theme.spacing(1),
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  button1: {
    minHeight: 36,
    textTransform: 'none',
    borderRadius: theme.shape.borderRadius * 2,
  },
}))
