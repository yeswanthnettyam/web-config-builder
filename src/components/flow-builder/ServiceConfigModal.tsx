'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Box,
  Typography,
  Divider,
  IconButton,
  Switch,
  FormControlLabel,
  Grid,
} from '@mui/material';
import { Close, Add, Delete } from '@mui/icons-material';
import { ServiceCall } from '@/types';
import { HTTP_METHODS } from '@/lib/constants';

interface ServiceConfigModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (service: ServiceCall) => void;
  service?: ServiceCall;
  availableFields?: string[];
}

export default function ServiceConfigModal({
  open,
  onClose,
  onSave,
  service,
  availableFields = [],
}: ServiceConfigModalProps) {
  const [formData, setFormData] = useState<ServiceCall>(
    service || {
      serviceId: '',
      serviceName: '',
      endpoint: '',
      method: 'POST',
      timeout: 10000,
      retryPolicy: {
        maxRetries: 2,
        retryDelayMs: 2000,
      },
      onError: 'CONTINUE',
      cachePolicy: {
        enabled: false,
        ttlSeconds: 3600,
      },
    }
  );

  const handleChange = (field: keyof ServiceCall, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNestedChange = (path: string[], value: any) => {
    setFormData((prev) => {
      const newData = { ...prev };
      let current: any = newData;
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]] = { ...current[path[i]] };
      }
      current[path[path.length - 1]] = value;
      return newData;
    });
  };

  const handleAddMapping = (type: 'request' | 'response') => {
    const mapping = { sourceField: '', targetField: '' };
    const field = type === 'request' ? 'requestMapping' : 'responseMapping';
    handleChange(field, [...(formData[field] || []), mapping]);
  };

  const handleRemoveMapping = (type: 'request' | 'response', index: number) => {
    const field = type === 'request' ? 'requestMapping' : 'responseMapping';
    const mappings = formData[field] || [];
    handleChange(field, mappings.filter((_, i) => i !== index));
  };

  const handleMappingChange = (
    type: 'request' | 'response',
    index: number,
    field: 'sourceField' | 'targetField',
    value: string
  ) => {
    const mappingField = type === 'request' ? 'requestMapping' : 'responseMapping';
    const mappings = [...(formData[mappingField] || [])];
    mappings[index] = { ...mappings[index], [field]: value };
    handleChange(mappingField, mappings);
  };

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Service Configuration</Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ paddingTop: 2 }}>
          <TextField
            fullWidth
            label="Service ID"
            value={formData.serviceId}
            onChange={(e) => handleChange('serviceId', e.target.value)}
            sx={{ marginBottom: 2 }}
            required
          />

          <TextField
            fullWidth
            label="Service Name"
            value={formData.serviceName}
            onChange={(e) => handleChange('serviceName', e.target.value)}
            sx={{ marginBottom: 2 }}
            required
          />

          <TextField
            fullWidth
            label="Endpoint URL"
            value={formData.endpoint}
            onChange={(e) => handleChange('endpoint', e.target.value)}
            sx={{ marginBottom: 2 }}
            placeholder="/api/v1/bureau/score"
            required
          />

          <TextField
            fullWidth
            label="Method"
            select
            value={formData.method}
            onChange={(e) => handleChange('method', e.target.value)}
            sx={{ marginBottom: 3 }}
          >
            {HTTP_METHODS.map((method) => (
              <MenuItem key={method.value} value={method.value}>
                {method.label}
              </MenuItem>
            ))}
          </TextField>

          <Divider sx={{ marginY: 3 }} />

          <Typography variant="h6" gutterBottom>
            Request Mapping
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ marginBottom: 2 }}>
            Map form fields to service request:
          </Typography>

          {(formData.requestMapping || []).map((mapping, index) => (
            <Grid container spacing={2} key={index} sx={{ marginBottom: 2 }}>
              <Grid item xs={5}>
                <TextField
                  fullWidth
                  label="Source Field"
                  select
                  value={mapping.sourceField}
                  onChange={(e) =>
                    handleMappingChange('request', index, 'sourceField', e.target.value)
                  }
                >
                  {availableFields.map((field) => (
                    <MenuItem key={field} value={field}>
                      {field}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={1} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography>→</Typography>
              </Grid>
              <Grid item xs={5}>
                <TextField
                  fullWidth
                  label="Target Field"
                  value={mapping.targetField}
                  onChange={(e) =>
                    handleMappingChange('request', index, 'targetField', e.target.value)
                  }
                />
              </Grid>
              <Grid item xs={1}>
                <IconButton
                  onClick={() => handleRemoveMapping('request', index)}
                  color="error"
                  size="small"
                >
                  <Delete />
                </IconButton>
              </Grid>
            </Grid>
          ))}

          <Button
            variant="outlined"
            size="small"
            startIcon={<Add />}
            onClick={() => handleAddMapping('request')}
            sx={{ marginBottom: 3 }}
          >
            Add Mapping
          </Button>

          <Divider sx={{ marginY: 3 }} />

          <Typography variant="h6" gutterBottom>
            Response Mapping
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ marginBottom: 2 }}>
            Map service response to application state:
          </Typography>

          {(formData.responseMapping || []).map((mapping, index) => (
            <Grid container spacing={2} key={index} sx={{ marginBottom: 2 }}>
              <Grid item xs={5}>
                <TextField
                  fullWidth
                  label="Service Field"
                  value={mapping.sourceField}
                  onChange={(e) =>
                    handleMappingChange('response', index, 'sourceField', e.target.value)
                  }
                />
              </Grid>
              <Grid item xs={1} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography>→</Typography>
              </Grid>
              <Grid item xs={5}>
                <TextField
                  fullWidth
                  label="App Field"
                  select
                  value={mapping.targetField}
                  onChange={(e) =>
                    handleMappingChange('response', index, 'targetField', e.target.value)
                  }
                >
                  {availableFields.map((field) => (
                    <MenuItem key={field} value={field}>
                      {field}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={1}>
                <IconButton
                  onClick={() => handleRemoveMapping('response', index)}
                  color="error"
                  size="small"
                >
                  <Delete />
                </IconButton>
              </Grid>
            </Grid>
          ))}

          <Button
            variant="outlined"
            size="small"
            startIcon={<Add />}
            onClick={() => handleAddMapping('response')}
            sx={{ marginBottom: 3 }}
          >
            Add Mapping
          </Button>

          <Divider sx={{ marginY: 3 }} />

          <Typography variant="h6" gutterBottom>
            Error Handling
          </Typography>

          <TextField
            fullWidth
            label="On Error"
            select
            value={formData.onError || 'CONTINUE'}
            onChange={(e) => handleChange('onError', e.target.value)}
            sx={{ marginBottom: 2 }}
          >
            <MenuItem value="FAIL_FLOW">Fail Flow</MenuItem>
            <MenuItem value="CONTINUE">Continue Flow</MenuItem>
            <MenuItem value="ROUTE_TO_SCREEN">Route to Screen</MenuItem>
          </TextField>

          {formData.onError === 'ROUTE_TO_SCREEN' && (
            <TextField
              fullWidth
              label="Error Screen"
              value={formData.errorScreen || ''}
              onChange={(e) => handleChange('errorScreen', e.target.value)}
              sx={{ marginBottom: 2 }}
            />
          )}

          <Grid container spacing={2} sx={{ marginBottom: 2 }}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Timeout (ms)"
                type="number"
                value={formData.timeout || 10000}
                onChange={(e) => handleChange('timeout', parseInt(e.target.value) || 10000)}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Max Retries"
                type="number"
                value={formData.retryPolicy?.maxRetries || 2}
                onChange={(e) =>
                  handleNestedChange(['retryPolicy', 'maxRetries'], parseInt(e.target.value) || 2)
                }
              />
            </Grid>
          </Grid>

          <TextField
            fullWidth
            label="Retry Delay (ms)"
            type="number"
            value={formData.retryPolicy?.retryDelayMs || 2000}
            onChange={(e) =>
              handleNestedChange(['retryPolicy', 'retryDelayMs'], parseInt(e.target.value) || 2000)
            }
            sx={{ marginBottom: 3 }}
          />

          <Divider sx={{ marginY: 3 }} />

          <Typography variant="h6" gutterBottom>
            Caching (Optional)
          </Typography>

          <FormControlLabel
            control={
              <Switch
                checked={formData.cachePolicy?.enabled || false}
                onChange={(e) =>
                  handleNestedChange(['cachePolicy', 'enabled'], e.target.checked)
                }
              />
            }
            label="Enable Response Caching"
            sx={{ marginBottom: 2 }}
          />

          {formData.cachePolicy?.enabled && (
            <>
              <TextField
                fullWidth
                label="Cache TTL (seconds)"
                type="number"
                value={formData.cachePolicy?.ttlSeconds || 3600}
                onChange={(e) =>
                  handleNestedChange(['cachePolicy', 'ttlSeconds'], parseInt(e.target.value) || 3600)
                }
                sx={{ marginBottom: 2 }}
              />

              <TextField
                fullWidth
                label="Cache Key"
                value={formData.cachePolicy?.cacheKey || ''}
                onChange={(e) =>
                  handleNestedChange(['cachePolicy', 'cacheKey'], e.target.value)
                }
                placeholder="bureau_${pan}"
                sx={{ marginBottom: 2 }}
              />
            </>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">
          Save Service
        </Button>
      </DialogActions>
    </Dialog>
  );
}

