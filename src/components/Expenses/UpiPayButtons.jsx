import { Box, Button, Typography } from '@mui/material'
import { useUpiPayButtonsUi } from './styles/UpiPayButtons.styles'

// "Save & pay": the expense is saved first, then the UPI app opens and you pay
// there as usual (scan the QR). UPI apps don't report back to a website, so
// saving first is the only order that never loses an entry.
//
// Chrome opens an app straight away only through a link scheme the app has
// made web-openable (phonepe://, tez://…); a plain "open the launcher screen"
// intent isn't allowed and lands on the Play Store instead. The package pins
// the app (no chooser) and is where Chrome falls back if it isn't installed.
// Checked on a real phone (adb, as a BROWSABLE link): each scheme opens its
// app directly. ponytail: Android only; add iOS schemes if used on an iPhone.
const UPI_APPS = [
  { id: 'phonepe', label: 'PhonePe', pkg: 'com.phonepe.app', scheme: 'phonepe', path: '' },
  { id: 'gpay', label: 'GPay', pkg: 'com.google.android.apps.nbu.paisa.user', scheme: 'tez', path: 'upi/' },
  { id: 'bhim', label: 'BHIM', pkg: 'in.org.npci.upiapp', scheme: 'bhim', path: '' },
  { id: 'paytm', label: 'Paytm', pkg: 'net.one97.paytm', scheme: 'paytmmp', path: '' },
]
export const canPayByUpi = typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent)
const UPI_KEY = 'budgetiq_upi_app'
const lastUpi = () => { try { return localStorage.getItem(UPI_KEY) } catch { return null } }

// Remember the app and hand over to it. Call after the expense is saved.
export function openUpiApp(app) {
  try { localStorage.setItem(UPI_KEY, app.id) } catch { /* fine */ }
  window.location.href = `intent://${app.path}#Intent;scheme=${app.scheme};package=${app.pkg};end`
}

// The row of app buttons; the last app used comes first and is highlighted.
export default function UpiPayButtons({ caption, disabled, onPay }) {
  const { classes: ui } = useUpiPayButtonsUi()
  const last = lastUpi()
  return (
    <Box className={ui.box1}>
      <Typography className={ui.typography1} variant="caption">
        {caption}
      </Typography>
      <Box className={ui.box2}>
        {[...UPI_APPS].sort((a, b) => (b.id === last) - (a.id === last)).map(app => (
          <Button className={ui.button1}
            key={app.id}
            size="small"
            variant={app.id === last ? 'contained' : 'outlined'}
            onClick={() => onPay(app)}
            disabled={disabled}
          >
            {app.label}
          </Button>
        ))}
      </Box>
    </Box>
  )
}
