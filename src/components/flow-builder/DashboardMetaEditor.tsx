'use client';

import React from 'react';
import {
  Box,
  TextField,
  MenuItem,
  Typography,
  Paper,
  Grid,
  Alert,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
} from '@mui/material';
import { Palette, TextFields, Description, Image } from '@mui/icons-material';
import { DashboardMeta } from '@/types';
import { DASHBOARD_FLOW_ICONS } from '@/lib/constants';

interface DashboardMetaEditorProps {
  value?: DashboardMeta;
  onChange: (meta: DashboardMeta) => void;
}

/**
 * DashboardMetaEditor Component
 * 
 * Allows configuration of Dashboard/Home screen tile appearance.
 * 
 * Features:
 * - Title and description text inputs
 * - Icon picker (predefined icon keys)
 * - Live preview
 * 
 * Usage:
 * This metadata is ONLY for Dashboard UI rendering.
 * It does NOT affect flow navigation logic.
 */
export default function DashboardMetaEditor({ value, onChange }: DashboardMetaEditorProps) {
  // Initialize with defaults if not provided
  const meta: DashboardMeta = value || {
    title: '',
    description: '',
    icon: 'APPLICANT_ONBOARDING',
  };

  /**
   * Handles field changes
   */
  const handleChange = (field: string, newValue: string) => {
    const updatedMeta: DashboardMeta = {
      ...meta,
      [field]: newValue,
    };

    onChange(updatedMeta);
  };

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Palette sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="h6">Dashboard Appearance</Typography>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        Configure how this flow appears as a tile on the Home/Dashboard screen.
        This does NOT affect flow navigation logic.
      </Alert>

      <Grid container spacing={3}>
        {/* Title */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Tile Title"
            value={meta.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="e.g., Applicant and Co-Applicant Onboarding"
            helperText="Displayed as the main heading on the dashboard tile"
            InputProps={{
              startAdornment: <TextFields sx={{ mr: 1, color: 'action.active' }} />,
            }}
          />
        </Grid>

        {/* Description */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Tile Description"
            value={meta.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="e.g., Capture applicant personal and business details"
            helperText="Brief description shown below the title"
            InputProps={{
              startAdornment: <Description sx={{ mr: 1, color: 'action.active' }} />,
            }}
          />
        </Grid>

        {/* Icon */}
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Dashboard Icon</InputLabel>
            <Select
              value={meta.icon}
              onChange={(e) => handleChange('icon', e.target.value)}
              label="Dashboard Icon"
              startAdornment={<Image sx={{ mr: 1, color: 'action.active' }} />}
            >
              {DASHBOARD_FLOW_ICONS.map((icon) => (
                <MenuItem key={icon.value} value={icon.value}>
                  {icon.label}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>
              Icon displayed on the dashboard tile (Android/Web apps map icon key to actual drawable)
            </FormHelperText>
          </FormControl>
        </Grid>

        {/* Live Preview */}
        <Grid item xs={12}>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Live Preview
            </Typography>
            <Box
              sx={{
                backgroundColor: '#f5f5f5',
                color: '#000000',
                p: 3,
                borderRadius: 2,
                minHeight: 120,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                border: '1px solid #e0e0e0',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    backgroundColor: '#e0e0e0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 2,
                  }}
                >
                  {DASHBOARD_FLOW_ICONS.find((i) => i.value === meta.icon)?.label.split(' ')[0] ||
                    '👤'}
                </Box>
                <Typography variant="h6" fontWeight="bold">
                  {meta.title || 'Tile Title'}
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                {meta.description || 'Tile description will appear here'}
              </Typography>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
}
