'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
  Typography,
  Alert,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Add,
  Save,
  Cancel,
  Delete,
  Visibility,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import PageHeader from '@/components/shared/PageHeader';
import FilterPanel, { Filter } from '@/components/shared/FilterPanel';
import EmptyState from '@/components/shared/EmptyState';
import JsonViewer from '@/components/shared/JsonViewer';
import { useConfiguredScreensSimple } from '@/hooks/use-master-data';
import { VALIDATION_TYPES, EXECUTION_TARGETS, CODE_LANGUAGES } from '@/lib/constants';
import {
  getAllValidationConfigs,
  saveValidationConfig,
  deleteValidationConfig,
  getScreenConfigByScreenId,
  saveScreenConfig,
  getAllScreenConfigs,
  type CachedValidationConfig,
} from '@/lib/cache-storage';
import toast from 'react-hot-toast';

interface ValidationRule {
  id: string;
  fieldId: string;
  type: string;
  message: string;
  pattern?: string;
  min?: number;
  max?: number;
  executionTarget?: string;
}

export default function ValidationBuilderPage() {
  const router = useRouter();
  const [filters, setFilters] = useState({
    screenId: '',
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [validationConfigs, setValidationConfigs] = useState<CachedValidationConfig[]>([]);
  const [availableFields, setAvailableFields] = useState<string[]>([]);
  const [editingConfig, setEditingConfig] = useState<any>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingConfig, setViewingConfig] = useState<any>(null);
  const { data: configuredScreens, isLoading: screensLoading, refetch: refetchScreens } = useConfiguredScreensSimple();

  // Refetch screens when dialog opens
  useEffect(() => {
    if (dialogOpen) {
      refetchScreens();
    }
  }, [dialogOpen, refetchScreens]);

  const { control, handleSubmit, reset, watch } = useForm({
    defaultValues: {
      screenId: '',
      rules: [] as ValidationRule[],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'rules',
  });

  const selectedScreenId = watch('screenId');

  // Load screens with validation status
  const loadValidationConfigs = () => {
    // Load all screen configs
    const allScreens = getAllScreenConfigs();
    
    // Filter to show only screens that have validations
    let screensWithValidations = allScreens.filter(
      screen => screen.config.validations && screen.config.validations.rules
    );
    
    if (filters.screenId) {
      screensWithValidations = screensWithValidations.filter(
        s => s.screenId === filters.screenId
      );
    }
    
    // Convert to validation config format for display
    const validationConfigs = screensWithValidations.map(screen => ({
      id: screen.id,
      screenId: screen.screenId,
      version: screen.version,
      validations: screen.config.validations,
      createdAt: screen.createdAt,
      updatedAt: screen.updatedAt,
    }));
    
    setValidationConfigs(validationConfigs as any);
  };

  useEffect(() => {
    loadValidationConfigs();
  }, [filters]);

  // Load fields when screen is selected
  useEffect(() => {
    if (selectedScreenId) {
      const screenConfig = getScreenConfigByScreenId(selectedScreenId);
      if (screenConfig) {
        const fieldIds: string[] = [];
        
        // Extract all field IDs from the screen config
        screenConfig.config.ui?.sections?.forEach((section: any) => {
          if (section.fields) {
            section.fields.forEach((field: any) => {
              if (field.id) fieldIds.push(field.id);
            });
          }
          if (section.subSections) {
            section.subSections.forEach((subSection: any) => {
              subSection.fields?.forEach((field: any) => {
                if (field.id) fieldIds.push(field.id);
              });
            });
          }
        });
        
        setAvailableFields(fieldIds);
      } else {
        setAvailableFields([]);
      }
    } else {
      setAvailableFields([]);
    }
  }, [selectedScreenId]);

  const handleFilterChange = (name: string, value: string) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleClearFilters = () => {
    setFilters({ screenId: '' });
  };

  const handleAddRule = () => {
    append({
      id: `rule_${Date.now()}`,
      fieldId: '',
      type: 'REGEX',
      message: '',
      pattern: '',
      executionTarget: 'BOTH',
    });
  };

  const handleSave = (data: any) => {
    if (!data.screenId) {
      toast.error('Please select a screen');
      return;
    }
    
    if (data.rules.length === 0) {
      toast.error('Please add at least one validation rule');
      return;
    }
    
    // Get the screen config
    const screenConfig = getScreenConfigByScreenId(data.screenId);
    if (!screenConfig) {
      toast.error('Screen configuration not found');
      return;
    }
    
    // Update the screen config with validations
    const updatedConfig = {
      ...screenConfig,
      config: {
        ...screenConfig.config,
        validations: {
          rules: data.rules,
        },
      },
    };
    
    // Save back to screen configs (not separate validation config)
    saveScreenConfig(updatedConfig);
    
    console.log('💾 Updated screen config with validations:', updatedConfig);
    toast.success(
      editingConfig 
        ? 'Validation rules updated successfully!' 
        : 'Validations added to screen successfully! Screen is now complete.'
    );
    
    handleCloseDialog();
    loadValidationConfigs();
  };

  const handleView = (config: any) => {
    setViewingConfig(config);
    setViewDialogOpen(true);
  };

  const handleEdit = (config: any) => {
    setEditingConfig(config);
    
    // Load the screen config to get the validations
    const screenConfig = getScreenConfigByScreenId(config.screenId);
    if (screenConfig && screenConfig.config.validations) {
      // Set form values
      reset({
        screenId: config.screenId,
        rules: screenConfig.config.validations.rules || [],
      });
    }
    
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this validation configuration?')) {
      deleteValidationConfig(id);
      toast.success('Validation configuration deleted');
      loadValidationConfigs();
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingConfig(null);
    reset({
      screenId: '',
      rules: [],
    });
  };

  const filterConfig: Filter[] = [
    {
      name: 'screenId',
      label: 'Screen',
      type: 'select',
      value: filters.screenId,
      options: [
        { value: '', label: 'All Screens' },
        ...(configuredScreens?.map((s) => ({
          value: s.screenId,
          label: s.screenName,
        })) || []),
      ],
    },
  ];

  return (
    <ProtectedRoute requiresEdit>
      <DashboardLayout>
        <PageHeader
          title="Validation Builder"
          description="Configure business rules and validation logic for screen fields"
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Validation Builder' },
          ]}
          action={{
            label: 'New Validation Config',
            icon: <Add />,
            onClick: () => setDialogOpen(true),
            disabled: screensLoading || !configuredScreens || configuredScreens.length === 0,
          }}
        />

        {(!configuredScreens || configuredScreens.length === 0) && !screensLoading && (
          <Alert severity="warning" sx={{ marginBottom: 3 }}>
            No screen configurations found. Please create screens in Screen Builder first before adding validations.
          </Alert>
        )}

        <FilterPanel
          filters={filterConfig}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
        />

        <Card>
          {validationConfigs.length === 0 ? (
            <EmptyState
              title="No validation configurations found"
              description="Create validation rules to enforce business logic and data correctness"
              action={{
                label: 'Create Validation Config',
                onClick: () => setDialogOpen(true),
                disabled: !configuredScreens || configuredScreens.length === 0,
              }}
            />
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Screen ID</TableCell>
                    <TableCell>Rules Count</TableCell>
                    <TableCell>Version</TableCell>
                    <TableCell>Last Updated</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {validationConfigs.map((config) => (
                    <TableRow key={config.id} hover>
                      <TableCell>{config.screenId}</TableCell>
                      <TableCell>{config.validations?.rules?.length || 0}</TableCell>
                      <TableCell>v{config.version}</TableCell>
                      <TableCell>
                        {new Date(config.updatedAt).toLocaleString()}
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<Visibility />}
                            onClick={() => handleView(config)}
                          >
                            View
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<Add />}
                            onClick={() => handleEdit(config)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            startIcon={<Delete />}
                            onClick={() => handleDelete(config.id)}
                          >
                            Delete
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Card>

        {/* Validation Config Dialog */}
        <Dialog
          open={dialogOpen}
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
        >
          <form onSubmit={handleSubmit(handleSave)}>
            <DialogTitle>
              {editingConfig ? 'Edit Validation Rules' : 'New Validation Configuration'}
            </DialogTitle>

            <DialogContent>
              {/* Tabs for Configuration and Preview */}
              <Box sx={{ borderBottom: 1, borderColor: 'divider', marginTop: -2, marginX: -3 }}>
                <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
                  <Tab label="Configuration" />
                  <Tab label="JSON Preview" />
                </Tabs>
              </Box>

              {activeTab === 0 && (
              <Box sx={{ paddingTop: 2 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Controller
                      name="screenId"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Screen"
                          select
                          required
                          disabled={!!editingConfig || screensLoading || !configuredScreens || configuredScreens.length === 0}
                          helperText={
                            screensLoading 
                              ? "Loading screens..." 
                              : !configuredScreens || configuredScreens.length === 0
                              ? "No active screens found. Create and activate a screen in Screen Builder first."
                              : "Select a screen that has been configured in Screen Builder"
                          }
                        >
                          {configuredScreens && configuredScreens.length > 0 ? (
                            configuredScreens.map((screen) => (
                              <MenuItem key={screen.screenId} value={screen.screenId}>
                                {screen.screenName}
                              </MenuItem>
                            ))
                          ) : (
                            <MenuItem value="" disabled>
                              No screens available
                            </MenuItem>
                          )}
                        </TextField>
                      )}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 2,
                      }}
                    >
                      <Typography variant="h6">Validation Rules</Typography>
                      <Button
                        startIcon={<Add />}
                        onClick={handleAddRule}
                        variant="outlined"
                        size="small"
                      >
                        Add Rule
                      </Button>
                    </Box>

                    {fields.length === 0 ? (
                      <Alert severity="info">
                        No validation rules defined. Click "Add Rule" to create one.
                      </Alert>
                    ) : (
                      fields.map((field, index) => (
                        <Card key={field.id} variant="outlined" sx={{ marginBottom: 2, padding: 2 }}>
                          <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                              <Controller
                                name={`rules.${index}.fieldId`}
                                control={control}
                                render={({ field }) => (
                                  <TextField
                                    {...field}
                                    fullWidth
                                    label="Field ID"
                                    select
                                    size="small"
                                    required
                                    disabled={!selectedScreenId || availableFields.length === 0}
                                    helperText={
                                      !selectedScreenId 
                                        ? "Select a screen first" 
                                        : availableFields.length === 0
                                        ? "No fields found in selected screen"
                                        : "Select field from screen configuration"
                                    }
                                  >
                                    {availableFields.map((fieldId) => (
                                      <MenuItem key={fieldId} value={fieldId}>
                                        {fieldId}
                                      </MenuItem>
                                    ))}
                                  </TextField>
                                )}
                              />
                            </Grid>

                            <Grid item xs={12} md={6}>
                              <Controller
                                name={`rules.${index}.type`}
                                control={control}
                                render={({ field }) => (
                                  <TextField
                                    {...field}
                                    fullWidth
                                    label="Validation Type"
                                    select
                                    size="small"
                                    required
                                  >
                                    {VALIDATION_TYPES.map((type) => (
                                      <MenuItem key={type.value} value={type.value}>
                                        {type.label}
                                      </MenuItem>
                                    ))}
                                  </TextField>
                                )}
                              />
                            </Grid>

                            <Grid item xs={12}>
                              <Controller
                                name={`rules.${index}.message`}
                                control={control}
                                render={({ field }) => (
                                  <TextField
                                    {...field}
                                    fullWidth
                                    label="Error Message"
                                    size="small"
                                    required
                                    placeholder="Error message to show user"
                                  />
                                )}
                              />
                            </Grid>

                            {/* Conditional Fields Based on Validation Type */}
                            {(() => {
                              const validationType = watch(`rules.${index}.type`);
                              
                              // For REGEX validation - show pattern field
                              if (validationType === 'REGEX') {
                                return (
                                  <Grid item xs={12}>
                                    <Controller
                                      name={`rules.${index}.pattern`}
                                      control={control}
                                      render={({ field }) => (
                                        <TextField
                                          {...field}
                                          fullWidth
                                          label="Regex Pattern"
                                          size="small"
                                          required
                                          placeholder="^[a-zA-Z0-9]+$"
                                          helperText="Enter regex pattern for validation"
                                        />
                                      )}
                                    />
                                  </Grid>
                                );
                              }
                              
                              // For MIN_LENGTH, MAX_LENGTH, MIN_VALUE, MAX_VALUE - show single value field
                              if (['MIN_LENGTH', 'MAX_LENGTH', 'MIN_VALUE', 'MAX_VALUE'].includes(validationType)) {
                                const isLength = validationType.includes('LENGTH');
                                return (
                                  <Grid item xs={12} md={6}>
                                    <Controller
                                      name={`rules.${index}.value`}
                                      control={control}
                                      render={({ field }) => (
                                        <TextField
                                          {...field}
                                          fullWidth
                                          label={isLength ? "Length" : "Value"}
                                          size="small"
                                          type="number"
                                          required
                                          placeholder={isLength ? "Enter minimum/maximum length" : "Enter minimum/maximum value"}
                                        />
                                      )}
                                    />
                                  </Grid>
                                );
                              }
                              
                              // For LENGTH_RANGE, VALUE_RANGE - show min and max fields
                              if (['LENGTH_RANGE', 'VALUE_RANGE'].includes(validationType)) {
                                const isLength = validationType === 'LENGTH_RANGE';
                                return (
                                  <>
                                    <Grid item xs={12} md={6}>
                                      <Controller
                                        name={`rules.${index}.min`}
                                        control={control}
                                        render={({ field }) => (
                                          <TextField
                                            {...field}
                                            fullWidth
                                            label={isLength ? "Minimum Length" : "Minimum Value"}
                                            size="small"
                                            type="number"
                                            required
                                            placeholder={isLength ? "Min length" : "Min value"}
                                          />
                                        )}
                                      />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                      <Controller
                                        name={`rules.${index}.max`}
                                        control={control}
                                        render={({ field }) => (
                                          <TextField
                                            {...field}
                                            fullWidth
                                            label={isLength ? "Maximum Length" : "Maximum Value"}
                                            size="small"
                                            type="number"
                                            required
                                            placeholder={isLength ? "Max length" : "Max value"}
                                          />
                                        )}
                                      />
                                    </Grid>
                                  </>
                                );
                              }
                              
                              // For CUSTOM validation - show language and custom code fields
                              if (validationType === 'CUSTOM') {
                                return (
                                  <>
                                    <Grid item xs={12} md={6}>
                                      <Controller
                                        name={`rules.${index}.language`}
                                        control={control}
                                        render={({ field }) => (
                                          <TextField
                                            {...field}
                                            fullWidth
                                            label="Language"
                                            size="small"
                                            select
                                            required
                                            helperText="Select programming language for validation"
                                          >
                                            {CODE_LANGUAGES.map((lang) => (
                                              <MenuItem key={lang.value} value={lang.value}>
                                                {lang.label}
                                              </MenuItem>
                                            ))}
                                          </TextField>
                                        )}
                                      />
                                    </Grid>
                                    <Grid item xs={12}>
                                      <Controller
                                        name={`rules.${index}.customCode`}
                                        control={control}
                                        render={({ field }) => (
                                          <TextField
                                            {...field}
                                            fullWidth
                                            label="Custom Validation Code"
                                            size="small"
                                            multiline
                                            rows={4}
                                            required
                                            placeholder="// Write custom validation logic here&#10;// Return true if valid, false if invalid&#10;return value.length > 0;"
                                            helperText="Write validation logic in selected language"
                                          />
                                        )}
                                      />
                                    </Grid>
                                  </>
                                );
                              }
                              
                              // For EMAIL, PHONE - no additional fields needed
                              // Note: REQUIRED is a field-level property (checkbox in Field Builder)
                              // Note: Date validations are now configured in Field Builder (dateConfig)
                              return null;
                            })()}

                            <Grid item xs={12} md={6}>
                              <Controller
                                name={`rules.${index}.executionTarget`}
                                control={control}
                                render={({ field }) => (
                                  <TextField
                                    {...field}
                                    fullWidth
                                    label="Execution Target"
                                    select
                                    size="small"
                                  >
                                    {EXECUTION_TARGETS.map((target) => (
                                      <MenuItem key={target.value} value={target.value}>
                                        {target.label}
                                      </MenuItem>
                                    ))}
                                  </TextField>
                                )}
                              />
                            </Grid>

                            <Grid item xs={12}>
                              <Button
                                color="error"
                                startIcon={<Delete />}
                                onClick={() => remove(index)}
                                size="small"
                              >
                                Remove Rule
                              </Button>
                            </Grid>
                          </Grid>
                        </Card>
                      ))
                    )}
                  </Grid>
                </Grid>
              </Box>
              )}

              {activeTab === 1 && (
                <Box sx={{ paddingTop: 2 }}>
                  <JsonViewer
                    data={{
                      screenId: watch('screenId'),
                      rules: watch('rules') || [],
                    }}
                    title="Validation Configuration Preview"
                    filename={`${watch('screenId') || 'validation'}_rules.json`}
                  />
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog} startIcon={<Cancel />}>
                Cancel
              </Button>
              <Button type="submit" variant="contained" startIcon={<Save />}>
                {editingConfig ? 'Update Validations' : 'Save Configuration'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* View Configuration Dialog */}
        <Dialog
          open={viewDialogOpen}
          onClose={() => setViewDialogOpen(false)}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle>
            View Validation Rules - {viewingConfig?.screenId}
          </DialogTitle>
          <DialogContent>
            {viewingConfig && (
              <Box sx={{ paddingTop: 2 }}>
                <JsonViewer
                  data={{
                    screenId: viewingConfig.screenId,
                    version: viewingConfig.version,
                    rules: viewingConfig.validations?.rules || [],
                    updatedAt: viewingConfig.updatedAt,
                  }}
                  title="Validation Configuration"
                  filename={`${viewingConfig.screenId}_validation_rules.json`}
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
