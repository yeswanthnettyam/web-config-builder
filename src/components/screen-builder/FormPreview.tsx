'use client';

import { useState, useEffect, useRef } from 'react';
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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { ExpandMore, Upload, Refresh, CheckCircle, Cancel, VerifiedUser } from '@mui/icons-material';

interface FormPreviewProps {
  formData: any;
}

export default function FormPreview({ formData }: FormPreviewProps) {
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [verificationStates, setVerificationStates] = useState<Record<string, 'idle' | 'verifying' | 'verified' | 'failed'>>({});
  const [apiVerificationStates, setApiVerificationStates] = useState<Record<string, 'idle' | 'verifying' | 'verified' | 'failed'>>({});
  const [dialogOpen, setDialogOpen] = useState<Record<string, boolean>>({});
  const [dialogMessage, setDialogMessage] = useState<Record<string, { type: 'success' | 'error'; message: string }>>({});
  const previousVisibilityRef = useRef<Record<string, boolean>>({});
  const formValuesRef = useRef<Record<string, any>>({});
  
  // Keep ref in sync with state
  useEffect(() => {
    formValuesRef.current = formValues;
  }, [formValues]);

  const handleFieldChange = (fieldId: string, value: any, fieldType?: string) => {
    setFormValues((prev) => {
      const prevValue = prev[fieldId];
      const newValues = {
        ...prev,
        [fieldId]: value,
      };
      
      // For VERIFIED_INPUT: Reset verification state when value changes
      if (fieldType === 'VERIFIED_INPUT' && prevValue !== value) {
        setVerificationStates((prevStates) => ({
          ...prevStates,
          [fieldId]: 'idle',
        }));
      }
      
      return newValues;
    });
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
        // EXISTS: field has any non-null, non-empty value
        // For dropdowns, empty string means no selection
        return fieldValue !== undefined && fieldValue !== null && fieldValue !== '';
      case 'NOT_EXISTS':
        // NOT_EXISTS: field is null, undefined, or empty
        return fieldValue === undefined || fieldValue === null || fieldValue === '';
      default:
        return true;
    }
  };

  // Initialize form values from field.value properties
  useEffect(() => {
    if (!formData?.sections) return;

    const initialValues: Record<string, any> = {};
    const allFields: any[] = [];
    
    formData.sections.forEach((section: any) => {
      if (section.fields) allFields.push(...section.fields);
      if (section.subSections) {
        section.subSections.forEach((sub: any) => {
          if (sub.fields) allFields.push(...sub.fields);
        });
      }
    });

    // Initialize values from field.value if present
    allFields.forEach((field: any) => {
      if (field.id && field.value !== undefined && field.value !== null) {
        initialValues[field.id] = field.value;
      }
    });

    // Only update if there are initial values to set
    if (Object.keys(initialValues).length > 0) {
      setFormValues((prev) => ({
        ...prev,
        ...initialValues,
      }));
    }
  }, [formData]);

  // Clear-on-hide: Clear field values when visibleWhen becomes false
  useEffect(() => {
    if (!formData?.sections) return;

    const allFields: any[] = [];
    formData.sections.forEach((section: any) => {
      if (section.fields) allFields.push(...section.fields);
      if (section.subSections) {
        section.subSections.forEach((sub: any) => {
          if (sub.fields) allFields.push(...sub.fields);
        });
      }
    });

    const fieldsToClear: string[] = [];

    allFields.forEach((field: any) => {
      if (!field.id || !field.visibleWhen) return;

      const wasVisible = previousVisibilityRef.current[field.id] ?? true;
      // Use ref to get current formValues to avoid dependency issues
      const currentFormValues = formValuesRef.current;
      const fieldValue = currentFormValues[field.visibleWhen.field];
      const expectedValue = field.visibleWhen.value;
      let isVisible = true;

      // Re-evaluate condition using current form values
      if (field.visibleWhen.operator === 'EQUALS') {
        isVisible = fieldValue === expectedValue;
      } else if (field.visibleWhen.operator === 'NOT_EQUALS') {
        isVisible = fieldValue !== expectedValue;
      } else if (field.visibleWhen.operator === 'IN') {
        isVisible = Array.isArray(expectedValue) && expectedValue.includes(fieldValue);
      } else if (field.visibleWhen.operator === 'EXISTS') {
        isVisible = fieldValue !== undefined && fieldValue !== null && fieldValue !== '';
      } else if (field.visibleWhen.operator === 'NOT_EXISTS') {
        isVisible = fieldValue === undefined || fieldValue === null || fieldValue === '';
      }

      // If field was visible and now hidden, clear its value
      if (wasVisible && !isVisible) {
        fieldsToClear.push(field.id);
      }

      // Update visibility tracking
      previousVisibilityRef.current[field.id] = isVisible;
    });

    // Clear values and reset states for hidden fields
    if (fieldsToClear.length > 0) {
      setFormValues((prev) => {
        const newValues = { ...prev };
        fieldsToClear.forEach((fieldId) => {
          delete newValues[fieldId];
        });
        return newValues;
      });

      // Reset verification states
      setVerificationStates((prev) => {
        const newStates = { ...prev };
        fieldsToClear.forEach((fieldId) => {
          delete newStates[fieldId];
        });
        return newStates;
      });

      setApiVerificationStates((prev) => {
        const newStates = { ...prev };
        fieldsToClear.forEach((fieldId) => {
          delete newStates[fieldId];
        });
        return newStates;
      });
    }
  }, [formValues, formData]);

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
            value={formValues[field.id] ?? field.value ?? ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value, field.type)}
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
            value={formValues[field.id] ?? field.value ?? ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value, field.type)}
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
            value={formValues[field.id] ?? field.value ?? ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value, field.type)}
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
            value={formValues[field.id] ?? field.value ?? ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value, field.type)}
            InputLabelProps={{ shrink: true }}
          />
        );

      case 'CHECKBOX':
        return (
          <FormControlLabel
            key={field.id}
            control={
              <Checkbox
                checked={formValues[field.id] ?? field.value ?? false}
                onChange={(e) => handleFieldChange(field.id, e.target.checked, field.type)}
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
                    checked={(formValues[field.id] ?? field.value) === option.value}
                    onChange={() => handleFieldChange(field.id, option.value, field.type)}
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
              value={formValues[field.id] ?? field.value ?? ''}
              onChange={(e) => handleFieldChange(field.id, e.target.value, field.type)}
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

      case 'VERIFIED_INPUT':
        const verifiedInputConfig = field.verifiedInputConfig;
        const verificationMode = verifiedInputConfig?.verification?.mode;
        const verificationState = verificationStates[field.id] || 'idle';
        
        return (
          <Box key={field.id}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
              <TextField
                fullWidth
                label={field.label}
                placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                required={isRequired}
                disabled={isDisabled}
                value={formValues[field.id] ?? field.value ?? ''}
                onChange={(e) => handleFieldChange(field.id, e.target.value, field.type)}
                type={verifiedInputConfig?.input?.dataType === 'NUMBER' ? 'number' : 'text'}
                inputProps={{
                  maxLength: verifiedInputConfig?.input?.maxLength,
                  min: verifiedInputConfig?.input?.min,
                  max: verifiedInputConfig?.input?.max,
                }}
                InputProps={{
                  endAdornment: (
                    <IconButton
                      size="small"
                      onClick={() => {
                        if (verificationMode === 'OTP') {
                          // Simulate OTP verification flow
                          setVerificationStates((prev) => ({ ...prev, [field.id]: 'verifying' }));
                          setTimeout(() => {
                            // Simulate success (in real app, check API response)
                            const isSuccess = true; // This would come from API response
                            setVerificationStates((prev) => ({ ...prev, [field.id]: isSuccess ? 'verified' : 'failed' }));
                            if (verifiedInputConfig?.verification?.showDialog) {
                              if (isSuccess && verifiedInputConfig?.verification?.messages?.success) {
                                setDialogMessage((prev) => ({ ...prev, [field.id]: { type: 'success', message: verifiedInputConfig.verification.messages.success! } }));
                                setDialogOpen((prev) => ({ ...prev, [field.id]: true }));
                              } else if (!isSuccess && verifiedInputConfig?.verification?.messages?.failure) {
                                setDialogMessage((prev) => ({ ...prev, [field.id]: { type: 'error', message: verifiedInputConfig.verification.messages.failure! } }));
                                setDialogOpen((prev) => ({ ...prev, [field.id]: true }));
                              }
                            }
                          }, 1500);
                        } else if (verificationMode === 'API') {
                          // Simulate API verification
                          setVerificationStates((prev) => ({ ...prev, [field.id]: 'verifying' }));
                          setTimeout(() => {
                            // Simulate success (in real app, check API response)
                            const isSuccess = true; // This would come from API response
                            setVerificationStates((prev) => ({ ...prev, [field.id]: isSuccess ? 'verified' : 'failed' }));
                            if (verifiedInputConfig?.verification?.showDialog) {
                              if (isSuccess && verifiedInputConfig?.verification?.messages?.success) {
                                setDialogMessage((prev) => ({ ...prev, [field.id]: { type: 'success', message: verifiedInputConfig.verification.messages.success! } }));
                                setDialogOpen((prev) => ({ ...prev, [field.id]: true }));
                              } else if (!isSuccess && verifiedInputConfig?.verification?.messages?.failure) {
                                setDialogMessage((prev) => ({ ...prev, [field.id]: { type: 'error', message: verifiedInputConfig.verification.messages.failure! } }));
                                setDialogOpen((prev) => ({ ...prev, [field.id]: true }));
                              }
                            }
                          }, 1500);
                        }
                      }}
                      disabled={!formValues[field.id] || verificationState === 'verifying'}
                      sx={{
                        color: verificationState === 'verified' ? 'success.main' : 
                                verificationState === 'failed' ? 'error.main' : 
                                'primary.main',
                      }}
                    >
                      {verificationState === 'verified' ? (
                        <CheckCircle color="success" />
                      ) : verificationState === 'failed' ? (
                        <Cancel color="error" />
                      ) : verificationState === 'verifying' ? (
                        <Refresh sx={{ animation: 'spin 1s linear infinite' }} />
                      ) : (
                        <VerifiedUser />
                      )}
                    </IconButton>
                  ),
                }}
              />
            </Box>
            {verificationMode === 'OTP' && verificationState === 'verifying' && (
              <Box sx={{ marginTop: 1 }}>
                <TextField
                  fullWidth
                  label="Enter OTP"
                  placeholder={`Enter ${verifiedInputConfig?.verification?.otp?.otpLength || 6} digit OTP`}
                  size="small"
                  inputProps={{ maxLength: verifiedInputConfig?.verification?.otp?.otpLength || 6 }}
                />
                <Box sx={{ display: 'flex', gap: 1, marginTop: 1 }}>
                  <Button variant="outlined" size="small" fullWidth>
                    Send OTP via {verifiedInputConfig?.verification?.otp?.channel || 'Mobile'}
                  </Button>
                  <Button variant="text" size="small" startIcon={<Refresh />}>
                    Resend
                  </Button>
                </Box>
              </Box>
            )}
            {verificationState === 'verified' && verifiedInputConfig?.verification?.messages?.success && !verifiedInputConfig?.verification?.showDialog && (
              <Alert severity="success" sx={{ marginTop: 1 }}>
                {verifiedInputConfig.verification.messages.success}
              </Alert>
            )}
            {verificationState === 'failed' && verifiedInputConfig?.verification?.messages?.failure && !verifiedInputConfig?.verification?.showDialog && (
              <Alert severity="error" sx={{ marginTop: 1 }}>
                {verifiedInputConfig.verification.messages.failure}
              </Alert>
            )}
          </Box>
        );

      case 'API_VERIFICATION':
        const apiVerificationConfig = field.apiVerificationConfig;
        const apiVerificationState = apiVerificationStates[field.id] || 'idle';
        
        return (
          <Box key={field.id}>
            <TextField
              fullWidth
              label={field.label}
              placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
              required={isRequired}
              disabled={isDisabled}
              value={formValues[field.id] ?? field.value ?? ''}
              onChange={(e) => handleFieldChange(field.id, e.target.value, field.type)}
            />
            <Button 
              variant="outlined" 
              size="small" 
              fullWidth 
              sx={{ marginTop: 1 }}
              onClick={() => {
                if (formValues[field.id]) {
                  setApiVerificationStates((prev) => ({ ...prev, [field.id]: 'verifying' }));
                  // Simulate API verification
                  setTimeout(() => {
                    // Simulate success (in real app, check API response)
                    const isSuccess = true; // This would come from API response
                    setApiVerificationStates((prev) => ({ ...prev, [field.id]: isSuccess ? 'verified' : 'failed' }));
                    if (apiVerificationConfig?.showDialog) {
                      if (isSuccess && apiVerificationConfig?.messages?.success) {
                        setDialogMessage((prev) => ({ ...prev, [field.id]: { type: 'success', message: apiVerificationConfig.messages.success! } }));
                        setDialogOpen((prev) => ({ ...prev, [field.id]: true }));
                      } else if (!isSuccess && apiVerificationConfig?.messages?.failure) {
                        setDialogMessage((prev) => ({ ...prev, [field.id]: { type: 'error', message: apiVerificationConfig.messages.failure! } }));
                        setDialogOpen((prev) => ({ ...prev, [field.id]: true }));
                      }
                    }
                  }, 1500);
                }
              }}
              disabled={!formValues[field.id] || apiVerificationState === 'verifying'}
              startIcon={
                apiVerificationState === 'verified' ? (
                  <CheckCircle color="success" />
                ) : apiVerificationState === 'failed' ? (
                  <Cancel color="error" />
                ) : apiVerificationState === 'verifying' ? (
                  <Refresh sx={{ animation: 'spin 1s linear infinite' }} />
                ) : null
              }
            >
              {apiVerificationState === 'verifying' 
                ? 'Verifying...' 
                : apiVerificationState === 'verified'
                ? 'Verified'
                : apiVerificationState === 'failed'
                ? 'Verification Failed'
                : `Verify via ${apiVerificationConfig?.method || 'POST'} API`}
            </Button>
            {apiVerificationState === 'verified' && apiVerificationConfig?.messages?.success && !apiVerificationConfig?.showDialog && (
              <Alert severity="success" sx={{ marginTop: 1 }}>
                {apiVerificationConfig.messages.success}
              </Alert>
            )}
            {apiVerificationState === 'failed' && apiVerificationConfig?.messages?.failure && !apiVerificationConfig?.showDialog && (
              <Alert severity="error" sx={{ marginTop: 1 }}>
                {apiVerificationConfig.messages.failure}
              </Alert>
            )}
            {apiVerificationConfig?.endpoint && (
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                Endpoint: {apiVerificationConfig.endpoint}
              </Typography>
            )}
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

    const content = (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {subSection.fields?.map((field: any) => renderField(field))}
        {subSection.repeatable && (
          <Button size="small" sx={{ marginTop: 2 }}>
            + Add {subSection.instanceLabel || 'Instance'}
          </Button>
        )}
      </Box>
    );

    if (subSection.collapsible) {
      return (
        <Accordion
          key={subSection.id}
          defaultExpanded={subSection.defaultExpanded !== false}
          sx={{ marginBottom: 2 }}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginRight: 2 }}>
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
          </AccordionSummary>
          <AccordionDetails>
            {content}
          </AccordionDetails>
        </Accordion>
      );
    }

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
        {content}
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
    <Box>
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

      {/* Dialogs for API verification messages - rendered outside Card for proper positioning */}
      {Object.entries(dialogOpen).map(([fieldId, isOpen]) => {
        if (!isOpen) return null;
        const message = dialogMessage[fieldId];
        if (!message) return null;
        
        return (
          <Dialog
            key={fieldId}
            open={isOpen}
            onClose={() => setDialogOpen((prev) => ({ ...prev, [fieldId]: false }))}
          >
            <DialogTitle>
              {message.type === 'success' ? 'Verification Successful' : 'Verification Failed'}
            </DialogTitle>
            <DialogContent>
              <Typography>{message.message}</Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDialogOpen((prev) => ({ ...prev, [fieldId]: false }))} autoFocus>
                OK
              </Button>
            </DialogActions>
          </Dialog>
        );
      })}
    </Box>
  );
}

