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
import { DASHBOARD_FLOW_ICONS, DEFAULT_DASHBOARD_COLORS } from '@/lib/constants';

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
 * - Color pickers for background, text, and icon colors
 * - HEX color validation
 * - Live preview of color combinations
 * 
 * Usage:
 * This metadata is ONLY for Dashboard UI rendering.
 * It does NOT affect flow navigation logic.
 */
export default function DashboardMetaEditor({ value, onChange }: DashboardMetaEditorProps) {
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // Initialize with defaults if not provided
  const meta: DashboardMeta = value || {
    title: '',
    description: '',
    icon: 'APPLICANT_ONBOARDING',
    ui: {
      backgroundColor: DEFAULT_DASHBOARD_COLORS.BACKGROUND,
      textColor: DEFAULT_DASHBOARD_COLORS.TEXT,
      iconColor: DEFAULT_DASHBOARD_COLORS.ICON,
    },
  };

  /**
   * Validates HEX color format
   */
  const validateHexColor = (color: string): boolean => {
    const hexColorRegex = /^#([0-9A-F]{3}|[0-9A-F]{6})$/i;
    return hexColorRegex.test(color);
  };

  /**
   * Handles field changes with validation
   */
  const handleChange = (field: string, newValue: string) => {
    const newErrors = { ...errors };

    // Validate HEX colors
    if (field.includes('Color') && !validateHexColor(newValue)) {
      newErrors[field] = 'Invalid HEX color format (e.g., #0B2F70)';
    } else {
      delete newErrors[field];
    }

    setErrors(newErrors);

    // Update meta
    let updatedMeta: DashboardMeta;

    if (field === 'title' || field === 'description' || field === 'icon') {
      updatedMeta = {
        ...meta,
        [field]: newValue,
      };
    } else {
      // Color fields
      updatedMeta = {
        ...meta,
        ui: {
          ...meta.ui,
          [field]: newValue,
        },
      };
    }

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

        {/* Background Color */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Background Color"
            value={meta.ui.backgroundColor}
            onChange={(e) => handleChange('backgroundColor', e.target.value)}
            placeholder="#0B2F70"
            error={!!errors.backgroundColor}
            helperText={errors.backgroundColor || 'HEX color for tile background (e.g., #0B2F70)'}
            InputProps={{
              startAdornment: (
                <Box
                  sx={{
                    width: 24,
                    height: 24,
                    borderRadius: 1,
                    border: '1px solid #ccc',
                    backgroundColor: validateHexColor(meta.ui.backgroundColor)
                      ? meta.ui.backgroundColor
                      : '#cccccc',
                    mr: 1,
                  }}
                />
              ),
            }}
          />
        </Grid>

        {/* Text Color */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Text Color"
            value={meta.ui.textColor}
            onChange={(e) => handleChange('textColor', e.target.value)}
            placeholder="#FFFFFF"
            error={!!errors.textColor}
            helperText={errors.textColor || 'HEX color for title and description text'}
            InputProps={{
              startAdornment: (
                <Box
                  sx={{
                    width: 24,
                    height: 24,
                    borderRadius: 1,
                    border: '1px solid #ccc',
                    backgroundColor: validateHexColor(meta.ui.textColor)
                      ? meta.ui.textColor
                      : '#cccccc',
                    mr: 1,
                  }}
                />
              ),
            }}
          />
        </Grid>

        {/* Icon Color */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Icon Color"
            value={meta.ui.iconColor}
            onChange={(e) => handleChange('iconColor', e.target.value)}
            placeholder="#00B2FF"
            error={!!errors.iconColor}
            helperText={errors.iconColor || 'HEX color for the icon'}
            InputProps={{
              startAdornment: (
                <Box
                  sx={{
                    width: 24,
                    height: 24,
                    borderRadius: 1,
                    border: '1px solid #ccc',
                    backgroundColor: validateHexColor(meta.ui.iconColor)
                      ? meta.ui.iconColor
                      : '#cccccc',
                    mr: 1,
                  }}
                />
              ),
            }}
          />
        </Grid>

        {/* Live Preview */}
        <Grid item xs={12}>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Live Preview
            </Typography>
            <Box
              sx={{
                backgroundColor: validateHexColor(meta.ui.backgroundColor)
                  ? meta.ui.backgroundColor
                  : '#cccccc',
                color: validateHexColor(meta.ui.textColor) ? meta.ui.textColor : '#000000',
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
                    backgroundColor: validateHexColor(meta.ui.iconColor)
                      ? meta.ui.iconColor
                      : '#00B2FF',
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

      {Object.keys(errors).length > 0 && (
        <Alert severity="error" sx={{ mt: 2 }}>
          Please fix validation errors before saving
        </Alert>
      )}
    </Paper>
  );
}
