'use client';

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  MenuItem,
  Typography,
  Checkbox,
  FormControlLabel,
  Button,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
  Chip,
  Alert,
} from '@mui/material';
import { ExpandMore, Upload, Refresh } from '@mui/icons-material';

interface FormPreviewProps {
  formData: any;
}

export default function FormPreview({ formData }: FormPreviewProps) {
  const [formValues, setFormValues] = useState<Record<string, any>>({});

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormValues((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  const checkCondition = (condition: any) => {
    if (!condition || !condition.field) return true;

    const fieldValue = formValues[condition.field];
    const expectedValue = condition.value;

    switch (condition.operator) {
      case 'EQUALS':
        return fieldValue === expectedValue;
      case 'NOT_EQUALS':
        return fieldValue !== expectedValue;
      case 'IN':
        return Array.isArray(expectedValue) && expectedValue.includes(fieldValue);
      case 'EXISTS':
        return fieldValue !== undefined && fieldValue !== null && fieldValue !== '';
      case 'NOT_EXISTS':
        return fieldValue === undefined || fieldValue === null || fieldValue === '';
      default:
        return true;
    }
  };

  const renderField = (field: any) => {
    if (!field || !field.id) return null;

    // Check visibility condition
    if (field.visibleWhen && !checkCondition(field.visibleWhen)) {
      return null;
    }

    const isDisabled = field.readOnly || (field.enabledWhen && !checkCondition(field.enabledWhen));
    const isRequired = field.required || (field.requiredWhen && checkCondition(field.requiredWhen));

    switch (field.type) {
      case 'TEXT':
      case 'NUMBER':
        return (
          <TextField
            key={field.id}
            fullWidth
            label={field.label}
            type={field.type === 'NUMBER' ? 'number' : 'text'}
            placeholder={field.placeholder}
            required={isRequired}
            disabled={isDisabled}
            value={formValues[field.id] || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            inputProps={{
              min: field.min,
              max: field.max,
              maxLength: field.maxLength,
            }}
            helperText={field.placeholder}
          />
        );

      case 'TEXTAREA':
        return (
          <TextField
            key={field.id}
            fullWidth
            label={field.label}
            multiline
            rows={4}
            placeholder={field.placeholder}
            required={isRequired}
            disabled={isDisabled}
            value={formValues[field.id] || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
          />
        );

      case 'DROPDOWN':
        const options = field.dataSource?.staticData || [];
        return (
          <TextField
            key={field.id}
            fullWidth
            label={field.label}
            select
            required={isRequired}
            disabled={isDisabled}
            value={formValues[field.id] || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            helperText={
              field.dataSource?.type === 'MASTER_DATA'
                ? `Master Data: ${field.dataSource?.masterDataKey}`
                : field.dataSource?.type === 'API'
                ? `API: ${field.dataSource?.apiEndpoint}`
                : ''
            }
          >
            {options.map((option: any) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        );

      case 'DATE':
        return (
          <TextField
            key={field.id}
            fullWidth
            label={field.label}
            type="date"
            required={isRequired}
            disabled={isDisabled}
            value={formValues[field.id] || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        );

      case 'CHECKBOX':
        return (
          <FormControlLabel
            key={field.id}
            control={
              <Checkbox
                checked={formValues[field.id] || false}
                onChange={(e) => handleFieldChange(field.id, e.target.checked)}
                disabled={isDisabled}
              />
            }
            label={field.label}
          />
        );

      case 'RADIO':
        const radioOptions = field.dataSource?.staticData || [];
        return (
          <Box key={field.id}>
            <Typography variant="body2" gutterBottom>
              {field.label} {isRequired && <span style={{ color: 'red' }}>*</span>}
            </Typography>
            {radioOptions.map((option: any) => (
              <FormControlLabel
                key={option.value}
                control={
                  <Checkbox
                    checked={formValues[field.id] === option.value}
                    onChange={() => handleFieldChange(field.id, option.value)}
                    disabled={isDisabled}
                  />
                }
                label={option.label}
              />
            ))}
          </Box>
        );

      case 'FILE_UPLOAD':
        return (
          <Box key={field.id}>
            <Typography variant="body2" gutterBottom>
              {field.label} {isRequired && <span style={{ color: 'red' }}>*</span>}
            </Typography>
            <Button
              variant="outlined"
              startIcon={<Upload />}
              disabled={isDisabled}
              fullWidth
            >
              Choose File
            </Button>
            {field.allowedFileTypes && (
              <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                Allowed: {Array.isArray(field.allowedFileTypes) ? field.allowedFileTypes.join(', ') : field.allowedFileTypes}
                {field.maxFileSizeMB && ` | Max size: ${field.maxFileSizeMB}MB`}
              </Typography>
            )}
          </Box>
        );

      case 'OTP_VERIFICATION':
        return (
          <Box key={field.id}>
            <TextField
              fullWidth
              label={field.label}
              placeholder="Enter OTP"
              required={isRequired}
              disabled={isDisabled}
              value={formValues[field.id] || ''}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              inputProps={{ maxLength: field.otpConfig?.otpLength || 6 }}
            />
            <Box sx={{ display: 'flex', gap: 1, marginTop: 1 }}>
              <Button variant="outlined" size="small" fullWidth>
                Send OTP via {field.otpConfig?.channel || 'Mobile'}
              </Button>
              <Button variant="text" size="small" startIcon={<Refresh />}>
                Resend
              </Button>
            </Box>
          </Box>
        );

      default:
        return (
          <TextField
            key={field.id}
            fullWidth
            label={field.label}
            placeholder={field.placeholder}
            required={isRequired}
            disabled={isDisabled}
          />
        );
    }
  };

  const renderSubSection = (subSection: any, parentIndex: number) => {
    if (!subSection) return null;

    return (
      <Paper
        key={subSection.id}
        variant="outlined"
        sx={{ padding: 2, marginBottom: 2, backgroundColor: 'grey.50' }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
          <Typography variant="subtitle2" fontWeight={600}>
            {subSection.title}
          </Typography>
          {subSection.repeatable && (
            <Chip
              label={`Repeatable (${subSection.minInstances}-${subSection.maxInstances})`}
              size="small"
              color="secondary"
            />
          )}
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {subSection.fields?.map((field: any) => renderField(field))}
        </Box>
        {subSection.repeatable && (
          <Button size="small" sx={{ marginTop: 2 }}>
            + Add {subSection.instanceLabel || 'Instance'}
          </Button>
        )}
      </Paper>
    );
  };

  const renderSection = (section: any, index: number) => {
    if (!section) return null;

    const content = (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {section.subSections && section.subSections.length > 0 ? (
          section.subSections.map((subSection: any, subIndex: number) =>
            renderSubSection(subSection, subIndex)
          )
        ) : (
          section.fields?.map((field: any) => renderField(field))
        )}
      </Box>
    );

    if (section.collapsible) {
      return (
        <Accordion key={section.id || index} defaultExpanded={section.defaultExpanded !== false}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="h6" fontSize="1rem">
              {section.title}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>{content}</AccordionDetails>
        </Accordion>
      );
    }

    return (
      <Box key={section.id || index} sx={{ marginBottom: 3 }}>
        <Typography variant="h6" gutterBottom>
          {section.title}
        </Typography>
        <Divider sx={{ marginBottom: 2 }} />
        {content}
      </Box>
    );
  };

  if (!formData || !formData.sections || formData.sections.length === 0) {
    return (
      <Alert severity="info">
        No sections configured yet. Add sections and fields to see the preview.
      </Alert>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ marginBottom: 2 }}>
          <Typography variant="h5" gutterBottom fontWeight={600}>
            {formData.title || formData.screenName || 'Form Preview'}
          </Typography>
          <Chip
            label={formData.layout || 'FORM'}
            size="small"
            color="primary"
            sx={{ marginRight: 1 }}
          />
          {formData.screenId && (
            <Chip label={`ID: ${formData.screenId}`} size="small" variant="outlined" />
          )}
        </Box>

        <Divider sx={{ marginBottom: 3 }} />

        {formData.sections.map((section: any, index: number) =>
          renderSection(section, index)
        )}

        {formData.actions && formData.actions.length > 0 && (
          <Box sx={{ display: 'flex', gap: 2, marginTop: 3, justifyContent: 'flex-end' }}>
            {formData.actions.map((action: any) => (
              <Button
                key={action.id}
                variant="contained"
                color={action.id === 'submit' ? 'primary' : 'inherit'}
              >
                {action.label}
              </Button>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

