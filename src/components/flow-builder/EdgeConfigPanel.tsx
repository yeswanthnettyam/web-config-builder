'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  MenuItem,
  Button,
  Typography,
  Divider,
  Switch,
  FormControlLabel,
  Paper,
  IconButton,
} from '@mui/material';
import { Close, Delete } from '@mui/icons-material';
import { NavigationCondition, NavigationActionType } from '@/types';
import ConditionBuilder from './ConditionBuilder';
import toast from 'react-hot-toast';

interface EdgeConfigPanelProps {
  condition: NavigationCondition;
  availableScreens: Array<{ screenId: string; screenName: string }>;
  availableFields?: string[];
  availableServices?: string[];
  onChange: (condition: NavigationCondition) => void;
  onDelete?: () => void;
  onSave?: () => void; // Optional callback to close panel after save
}

export default function EdgeConfigPanel({
  condition,
  availableScreens,
  availableFields = [],
  availableServices = [],
  onChange,
  onDelete,
  onSave,
}: EdgeConfigPanelProps) {
  // Use local state to track changes
  const [formData, setFormData] = useState<NavigationCondition>(condition);
  // Store raw metadata text to allow typing invalid JSON
  const [metadataText, setMetadataText] = useState<string>(
    condition.action.metadata ? JSON.stringify(condition.action.metadata, null, 2) : ''
  );

  // Update local state when condition prop changes
  useEffect(() => {
    setFormData(condition);
    setMetadataText(condition.action.metadata ? JSON.stringify(condition.action.metadata, null, 2) : '');
  }, [condition]);

  const handleFieldChange = (field: keyof NavigationCondition, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleActionChange = (field: keyof NavigationCondition['action'], value: any) => {
    setFormData((prev) => ({
      ...prev,
      action: { ...prev.action, [field]: value },
    }));
  };

  const handleConditionChange = (cond: any) => {
    setFormData((prev) => ({ ...prev, condition: cond }));
  };

  const handleSave = () => {
    try {
      onChange(formData);
      toast.success('Condition saved successfully!');
      // Close panel after save if onSave callback is provided
      if (onSave) {
        setTimeout(() => {
          onSave();
        }, 500); // Small delay to show toast
      }
    } catch (error) {
      console.error('Error saving condition:', error);
      toast.error('Failed to save condition');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
        <Typography variant="h6">Condition Configuration</Typography>
        {onDelete && (
          <IconButton onClick={onDelete} color="error" size="small">
            <Delete />
          </IconButton>
        )}
      </Box>

      <FormControlLabel
        control={
          <Switch
            checked={formData.enabled}
            onChange={(e) => handleFieldChange('enabled', e.target.checked)}
          />
        }
        label="Enable Condition"
        sx={{ marginBottom: 2 }}
      />

      <TextField
        fullWidth
        label="Condition Name"
        value={formData.name}
        onChange={(e) => handleFieldChange('name', e.target.value)}
        sx={{ marginBottom: 2 }}
      />

      <TextField
        fullWidth
        label="Priority"
        type="number"
        value={formData.priority}
        onChange={(e) => handleFieldChange('priority', parseInt(e.target.value) || 1)}
        sx={{ marginBottom: 3 }}
        helperText="Higher = earlier evaluation"
      />

      <Divider sx={{ marginY: 2 }} />

      <Typography variant="subtitle1" gutterBottom>
        Condition Builder
      </Typography>

      <ConditionBuilder
        condition={formData.condition}
        onChange={handleConditionChange}
        availableFields={availableFields}
        availableServices={availableServices}
      />

      <Divider sx={{ marginY: 2 }} />

      <Typography variant="subtitle1" gutterBottom>
        Action
      </Typography>

      <TextField
        fullWidth
        label="Action Type"
        select
        value={formData.action.type}
        onChange={(e) => handleActionChange('type', e.target.value)}
        sx={{ marginBottom: 2 }}
      >
        <MenuItem value="NAVIGATE">Navigate to Screen</MenuItem>
        <MenuItem value="CALL_SERVICE">Call Service (then navigate)</MenuItem>
        <MenuItem value="SKIP">Skip Screen</MenuItem>
        <MenuItem value="END_FLOW">End Flow</MenuItem>
        <MenuItem value="LOOP_BACK">Loop Back</MenuItem>
      </TextField>

      {(formData.action.type === 'NAVIGATE' || formData.action.type === 'CALL_SERVICE') && (
        <TextField
          fullWidth
          label="Target Screen"
          select
          value={formData.action.targetScreen || ''}
          onChange={(e) => handleActionChange('targetScreen', e.target.value)}
          sx={{ marginBottom: 2 }}
        >
          {availableScreens.map((s) => (
            <MenuItem key={s.screenId} value={s.screenId}>
              {s.screenName}
            </MenuItem>
          ))}
        </TextField>
      )}

      <Divider sx={{ marginY: 2 }} />

      <Typography variant="subtitle1" gutterBottom>
        Advanced
      </Typography>

      <TextField
        fullWidth
        label="Tracking Metadata (JSON)"
        multiline
        rows={4}
        value={metadataText}
        onChange={(e) => {
          // Allow typing - just update the text state
          setMetadataText(e.target.value);
        }}
        onBlur={(e) => {
          // Validate and parse on blur
          const rawValue = e.target.value.trim();
          try {
            if (rawValue === '') {
              handleActionChange('metadata', {});
              setMetadataText('');
            } else {
              const metadata = JSON.parse(rawValue);
              handleActionChange('metadata', metadata);
              // Update text to formatted version
              setMetadataText(JSON.stringify(metadata, null, 2));
            }
          } catch (error) {
            toast.error('Invalid JSON format. Please check your syntax.');
            // Reset to last valid value
            setMetadataText(formData.action.metadata ? JSON.stringify(formData.action.metadata, null, 2) : '');
          }
        }}
        sx={{ marginBottom: 2 }}
        placeholder='{\n  "reason": "self_employed_route"\n}'
        helperText="Enter valid JSON. Will be validated when you click away."
      />

      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', marginTop: 3 }}>
        {onDelete && (
          <Button onClick={onDelete} color="error" variant="outlined">
            Delete Condition
          </Button>
        )}
        <Button variant="outlined" onClick={() => setFormData(condition)}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSave}>
          Save
        </Button>
      </Box>
    </Box>
  );
}

