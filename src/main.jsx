import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { themes } from './theme'
import { applyTokens, useThemeMode } from './theme/tokens'
import App from './App'
import './index.css'

applyTokens()

function Root() {
  return (
    <ThemeProvider theme={themes[useThemeMode()]}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>
)
