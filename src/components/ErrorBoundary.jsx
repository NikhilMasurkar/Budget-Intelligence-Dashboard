import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary'
import { Box, Typography, Button } from '@mui/material'

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <Box sx={{ p: 4, textAlign: 'center' }}>
      <Typography variant="h6" sx={{ mb: 1, color: 'var(--danger-soft)' }}>
        Something went wrong
      </Typography>
      <Typography variant="body2" sx={{ mb: 2, color: 'var(--text2)' }}>
        {error?.message}
      </Typography>
      <Button
        variant="outlined"
        size="small"
        sx={{ color: 'var(--accent)', borderColor: 'var(--accent)' }}
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
