import React from 'react'
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary'
import { Box, Typography, Button } from '@mui/material'

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <Box sx={{ p: 4, textAlign: 'center' }}>
      <Typography variant="h6" sx={{ mb: 1, color: '#ff6b6b' }}>
        Something went wrong
      </Typography>
      <Typography variant="body2" sx={{ mb: 2, color: '#8891b8' }}>
        {error?.message}
      </Typography>
      <Button
        variant="outlined"
        size="small"
        sx={{ color: '#6c8fff', borderColor: '#6c8fff' }}
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
