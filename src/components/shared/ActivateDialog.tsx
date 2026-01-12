'use client';

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Alert,
  Box,
} from '@mui/material';
import { Warning, CheckCircle } from '@mui/icons-material';

export interface ActivateDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  configType: 'Screen' | 'Flow' | 'Validation' | 'Field Mapping';
  configName: string;
  isLoading?: boolean;
}

/**
 * Reusable Activation Confirmation Dialog
 * 
 * Shows a confirmation dialog when activating a configuration.
 * Includes important warnings about the activation behavior.
 */
export default function ActivateDialog({
  open,
  onClose,
  onConfirm,
  configType,
  configName,
  isLoading = false,
}: ActivateDialogProps) {
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Warning color="warning" />
        Activate {configType} Configuration
      </DialogTitle>
      
      <DialogContent>
        <Typography variant="body1" gutterBottom>
          Are you sure you want to activate <strong>{configName}</strong>?
        </Typography>

        <Alert severity="warning" sx={{ marginTop: 2, marginBottom: 2 }}>
          <Typography variant="body2" gutterBottom>
            <strong>Important:</strong> Activating this configuration will:
          </Typography>
          <Box component="ul" sx={{ paddingLeft: 2, marginTop: 1, marginBottom: 0 }}>
            <li>Mark this configuration as <strong>ACTIVE</strong></li>
            <li>Automatically deprecate any existing <strong>ACTIVE</strong> configuration for the same scope</li>
            <li>Apply this configuration to <strong>NEW loan applications only</strong></li>
          </Box>
        </Alert>

        <Alert severity="info" icon={<CheckCircle />}>
          <Typography variant="body2">
            <strong>Runtime Behavior:</strong> Existing loan applications will continue using 
            their original configuration. This change affects new applications only.
          </Typography>
        </Alert>
      </DialogContent>

      <DialogActions>
        <Button 
          onClick={onClose}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color="warning"
          disabled={isLoading}
          startIcon={<CheckCircle />}
        >
          {isLoading ? 'Activating...' : 'Activate'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
