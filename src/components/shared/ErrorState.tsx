import React from 'react';
import { Box, Typography, Button, Alert } from '@mui/material';
import { Error as ErrorIcon, Refresh } from '@mui/icons-material';

interface ErrorStateProps {
  error?: string;
  onRetry?: () => void;
}

export default function ErrorState({
  error = 'An error occurred while loading data',
  onRetry,
}: ErrorStateProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 6,
      }}
      role="alert"
      aria-live="assertive"
    >
      <ErrorIcon sx={{ fontSize: 64, color: 'error.main', marginBottom: 2 }} />

      <Typography variant="h6" gutterBottom>
        Something went wrong
      </Typography>

      <Alert severity="error" sx={{ marginBottom: 3, maxWidth: 600 }}>
        {error}
      </Alert>

      {onRetry && (
        <Button
          variant="contained"
          startIcon={<Refresh />}
          onClick={onRetry}
        >
          Try Again
        </Button>
      )}
    </Box>
  );
}

