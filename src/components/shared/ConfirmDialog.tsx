import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Warning, ErrorOutline } from '@mui/icons-material';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  severity?: 'warning' | 'error' | 'info';
  isLoading?: boolean;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  severity = 'warning',
  isLoading = false,
}: ConfirmDialogProps) {
  // Split message by newlines to support multi-line formatting
  const messageLines = message.split('\n').filter(line => line.trim() !== '');

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle
        id="confirm-dialog-title"
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          color: severity === 'error' ? 'error.main' : severity === 'warning' ? 'warning.main' : 'inherit'
        }}
      >
        {severity === 'warning' && <Warning color="warning" />}
        {severity === 'error' && <ErrorOutline color="error" />}
        {title}
      </DialogTitle>

      <DialogContent>
        <Box sx={{ marginTop: 1 }}>
          {severity === 'error' && (
            <Alert severity="error" sx={{ marginBottom: 2 }}>
              <Typography variant="body2" fontWeight="bold">
                This action is irreversible and may have serious consequences.
              </Typography>
            </Alert>
          )}
          <Box id="confirm-dialog-description">
            {messageLines.map((line, index) => {
              // Check if line starts with bullet point
              const isBullet = line.trim().startsWith('•');
              const isBold = line.includes('CAUTION:') || line.includes('Are you');
              
              return (
                <Typography
                  key={index}
                  variant="body1"
                  sx={{
                    marginBottom: index < messageLines.length - 1 ? 1 : 0,
                    fontWeight: isBold ? 'bold' : 'normal',
                    color: isBold ? (severity === 'error' ? 'error.main' : 'text.primary') : 'text.secondary',
                    paddingLeft: isBullet ? 2 : 0,
                  }}
                >
                  {line}
                </Typography>
              );
            })}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ padding: 2, paddingTop: 1 }}>
        <Button 
          onClick={onCancel} 
          color="inherit" 
          variant="outlined"
          disabled={isLoading}
        >
          {cancelLabel}
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color={severity === 'error' ? 'error' : 'primary'}
          autoFocus
          disabled={isLoading}
          startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {isLoading ? 'Deleting...' : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

