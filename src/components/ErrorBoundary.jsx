import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary'
import { Box, Typography, Button } from '@mui/material'
import { useErrorBoundaryUi } from './styles/ErrorBoundary.styles'

function ErrorFallback({ error, resetErrorBoundary }) {
  const { classes: ui } = useErrorBoundaryUi()
  return (
    <Box className={ui.box1}>
      <Typography className={ui.typography1} variant="h6">
        Something went wrong
      </Typography>
      <Typography className={ui.typography2} variant="body2">
        {error?.message}
      </Typography>
      <Button className={ui.button1}
        variant="outlined"
        size="small"
        onClick={resetErrorBoundary}
      >
        Try again
      </Button>
    </Box>
  )
}

export default function ErrorBoundary({ children }) {
  return (
    <ReactErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, info) => console.error('[BudgetIQ] Uncaught render error:', error, info)}
    >
      {children}
    </ReactErrorBoundary>
  )
}
