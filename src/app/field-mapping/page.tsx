'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  Paper,
  Chip,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Add,
  Save,
  Cancel,
  Delete,
  ArrowForward,
  Visibility,
  CheckCircle,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import PageHeader from '@/components/shared/PageHeader';
import FilterPanel, { Filter } from '@/components/shared/FilterPanel';
import EmptyState from '@/components/shared/EmptyState';
import ActivateDialog from '@/components/shared/ActivateDialog';
import JsonViewer from '@/components/shared/JsonViewer';
import { useCompleteScreens } from '@/hooks/use-master-data';
import { MAPPING_TYPES, TRANSFORMER_TYPES } from '@/lib/constants';
import { fieldMappingApi } from '@/api/fieldMapping.api';
import { screenConfigApi } from '@/api/screenConfig.api';
import { BackendFieldMappingConfig } from '@/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

interface FieldMappingItem {
  fieldId: string;
  mappingType: string;
  transformer?: string;
  dbColumn: string;
  table: string;
  dataType: string;
}

export default function FieldMappingPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    screenId: '',
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activateDialogOpen, setActivateDialogOpen] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<BackendFieldMappingConfig | null>(null);
  const [availableFields, setAvailableFields] = useState<string[]>([]);
  const [editingConfig, setEditingConfig] = useState<BackendFieldMappingConfig | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingConfig, setViewingConfig] = useState<BackendFieldMappingConfig | null>(null);
  const { data: configuredScreens, isLoading: screensLoading, refetch: refetchScreens } = useCompleteScreens();

  // Fetch field mapping configurations
  const { data: mappingConfigs = [], isLoading, refetch } = useQuery({
    queryKey: ['field-mapping-configs'],
    queryFn: () => fieldMappingApi.getAll(),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: Partial<BackendFieldMappingConfig>) => fieldMappingApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['field-mapping-configs'] });
      toast.success('Field mapping configuration created successfully!');
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create field mapping configuration');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ configId, data }: { configId: number; data: Partial<BackendFieldMappingConfig> }) => 
      fieldMappingApi.update(configId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['field-mapping-configs'] });
      toast.success('Field mapping configuration updated successfully!');
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update field mapping configuration');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (configId: number) => fieldMappingApi.delete(configId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['field-mapping-configs'] });
      toast.success('Field mapping configuration deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete field mapping configuration');
    },
  });

  // Refetch screens when dialog opens
  useEffect(() => {
    if (dialogOpen) {
      refetchScreens();
    }
  }, [dialogOpen, refetchScreens]);

  const { control, handleSubmit, reset, watch } = useForm({
    defaultValues: {
      screenId: '',
      mappings: [] as FieldMappingItem[],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'mappings',
  });

  const selectedScreenId = watch('screenId');

  // Filter mapping configs based on selected screen
  const filteredMappingConfigs = mappingConfigs.filter(config => {
    if (filters.screenId) {
      return config.screenId === filters.screenId;
    }
    return true;
  });

  // Fetch screen config when screen is selected (to get fields)
  const { data: selectedScreenConfig } = useQuery({
    queryKey: ['screen-config-for-fields', selectedScreenId],
    queryFn: async () => {
      if (!selectedScreenId || !configuredScreens) return null;
      
      // Find the screen to get config details
      const screen = configuredScreens.find(s => s.screenId === selectedScreenId);
      if (!screen) return null;
      
      // Fetch all screen configs and find the one matching this screenId
      const allScreenConfigs = await screenConfigApi.getAll();
      const screenConfig = allScreenConfigs.find(config => config.screenId === selectedScreenId);
      
      return screenConfig || null;
    },
    enabled: !!selectedScreenId && !!configuredScreens,
  });

  // Load fields when screen config is loaded
  useEffect(() => {
    if (selectedScreenConfig) {
      const fieldIds: string[] = [];
      
      // Extract all field IDs from the screen config
      const uiConfig = selectedScreenConfig.uiConfig as any;
      uiConfig?.ui?.sections?.forEach((section: any) => {
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
  }, [selectedScreenConfig]);

  const handleFilterChange = (name: string, value: string) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleClearFilters = () => {
    setFilters({ screenId: '' });
  };

  const handleAddMapping = () => {
    append({
      fieldId: '',
      mappingType: 'DIRECT',
      dbColumn: '',
      table: '',
      dataType: 'VARCHAR(255)',
    });
  };

  const handleSave = (data: any) => {
    if (!data.screenId) {
      toast.error('Please select a screen');
      return;
    }
    
    if (data.mappings.length === 0) {
      toast.error('Please add at least one field mapping');
      return;
    }
    
    const mappingData: Partial<BackendFieldMappingConfig> = {
      screenId: data.screenId,
      mappings: {
        fields: data.mappings,
      },
    };
    
    if (editingConfig && editingConfig.configId) {
      updateMutation.mutate({
        configId: editingConfig.configId,
        data: mappingData,
      });
    } else {
      createMutation.mutate(mappingData);
    }
  };

  const handleView = (config: BackendFieldMappingConfig) => {
    setViewingConfig(config);
    setViewDialogOpen(true);
  };

  const handleEdit = (config: BackendFieldMappingConfig) => {
    setEditingConfig(config);
    
    // Pre-populate form with existing data
    reset({
      screenId: config.screenId,
      mappings: config.mappings.fields || [],
    });
    
    setDialogOpen(true);
  };

  const handleActivate = (config: BackendFieldMappingConfig) => {
    setSelectedConfig(config);
    setActivateDialogOpen(true);
  };

  const handleConfirmActivate = async () => {
    if (selectedConfig && selectedConfig.configId) {
      setIsActivating(true);
      try {
        await fieldMappingApi.activate(selectedConfig.configId);
        toast.success('Field mapping configuration activated successfully');
        setActivateDialogOpen(false);
        setSelectedConfig(null);
        refetch();
      } catch (error: any) {
        toast.error(error.message || 'Failed to activate field mapping configuration');
      } finally {
        setIsActivating(false);
      }
    }
  };

  const handleDelete = (configId: number) => {
    if (window.confirm('Are you sure you want to delete this mapping configuration?')) {
      deleteMutation.mutate(configId);
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingConfig(null);
    reset({
      screenId: '',
      mappings: [],
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
          title="Field Mapping Manager"
          description="Map UI fields to database columns with transformations"
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Field Mapping' },
          ]}
          action={{
            label: 'New Field Mapping',
            icon: <Add />,
            onClick: () => setDialogOpen(true),
            disabled: screensLoading || !configuredScreens || configuredScreens.length === 0,
          }}
        />

        {(!configuredScreens || configuredScreens.length === 0) && !screensLoading && (
          <Alert severity="warning" sx={{ marginBottom: 3 }}>
            No screen configurations found. Please create screens in Screen Builder first before adding field mappings.
          </Alert>
        )}

        <FilterPanel
          filters={filterConfig}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
        />

        <Card>
          {isLoading ? (
            <Box sx={{ padding: 4, textAlign: 'center' }}>
              <Typography>Loading field mapping configurations...</Typography>
            </Box>
          ) : filteredMappingConfigs.length === 0 ? (
            <EmptyState
              title="No field mappings found"
              description="Create field mappings to define how UI fields are persisted to the database"
              action={{
                label: 'Create Field Mapping',
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
                    <TableCell>Mappings Count</TableCell>
                    <TableCell>Version</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Last Updated</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredMappingConfigs.map((config) => (
                    <TableRow key={config.configId} hover>
                      <TableCell>{config.screenId}</TableCell>
                      <TableCell>{config.mappings?.fields?.length || 0}</TableCell>
                      <TableCell>v{config.version || '1.0'}</TableCell>
                      <TableCell>
                        <Chip
                          label={config.status || 'DRAFT'}
                          color={
                            config.status === 'ACTIVE' ? 'success' :
                            config.status === 'DEPRECATED' ? 'default' :
                            'warning'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {config.updatedAt ? new Date(config.updatedAt).toLocaleString() : '-'}
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
                          {config.status === 'DRAFT' && (
                            <>
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
                                variant="contained"
                                color="success"
                                startIcon={<CheckCircle />}
                                onClick={() => handleActivate(config)}
                              >
                                Activate
                              </Button>
                              <Button
                                size="small"
                                color="error"
                                startIcon={<Delete />}
                                onClick={() => config.configId && handleDelete(config.configId)}
                                disabled={!config.configId}
                              >
                                Delete
                              </Button>
                            </>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Card>

        {/* Field Mapping Dialog */}
        <Dialog
          open={dialogOpen}
          onClose={handleCloseDialog}
          maxWidth="lg"
          fullWidth
        >
          <form onSubmit={handleSubmit(handleSave)}>
            <DialogTitle>
              {editingConfig ? 'Edit Field Mapping' : 'New Field Mapping Configuration'}
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
                              ? "No complete screens found. Please add validations to your screens first."
                              : "Select a screen that has validations configured"
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
                      <Typography variant="h6">Field Mappings</Typography>
                      <Button
                        startIcon={<Add />}
                        onClick={handleAddMapping}
                        variant="outlined"
                        size="small"
                      >
                        Add Mapping
                      </Button>
                    </Box>

                    {fields.length === 0 ? (
                      <Alert severity="info">
                        No field mappings defined. Click &quot;Add Mapping&quot; to create one.
                      </Alert>
                    ) : (
                      <Box sx={{ marginTop: 2 }}>
                        {fields.map((field, index) => (
                          <Paper key={field.id} variant="outlined" sx={{ padding: 2, marginBottom: 2 }}>
                            <Grid container spacing={2} alignItems="center">
                              {/* Left side - UI Field */}
                              <Grid item xs={12} md={5}>
                                <Box
                                  sx={{
                                    padding: 2,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    borderRadius: 1,
                                  }}
                                >
                                  <Typography variant="caption" gutterBottom fontWeight={600}>
                                    UI Field
                                  </Typography>
                                  <Controller
                                    name={`mappings.${index}.fieldId`}
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
                                        sx={{ backgroundColor: 'white', marginTop: 1 }}
                                        helperText={
                                          !selectedScreenId 
                                            ? "Select a screen first" 
                                            : availableFields.length === 0
                                            ? "No fields found"
                                            : ""
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
                                </Box>
                              </Grid>

                              {/* Middle - Mapping Type & Transformer */}
                              <Grid item xs={12} md={2}>
                                <Box
                                  sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: 1,
                                  }}
                                >
                                  <ArrowForward color="action" />
                                  <Controller
                                    name={`mappings.${index}.mappingType`}
                                    control={control}
                                    render={({ field }) => (
                                      <TextField
                                        {...field}
                                        select
                                        size="small"
                                        fullWidth
                                      >
                                        {MAPPING_TYPES.map((type) => (
                                          <MenuItem key={type.value} value={type.value}>
                                            {type.label}
                                          </MenuItem>
                                        ))}
                                      </TextField>
                                    )}
                                  />
                                  <Controller
                                    name={`mappings.${index}.transformer`}
                                    control={control}
                                    render={({ field }) => (
                                      <TextField
                                        {...field}
                                        select
                                        size="small"
                                        fullWidth
                                        label="Transform"
                                      >
                                        <MenuItem value="">None</MenuItem>
                                        {TRANSFORMER_TYPES.map((type) => (
                                          <MenuItem key={type.value} value={type.value}>
                                            {type.label}
                                          </MenuItem>
                                        ))}
                                      </TextField>
                                    )}
                                  />
                                </Box>
                              </Grid>

                              {/* Right side - Database Column */}
                              <Grid item xs={12} md={5}>
                                <Box
                                  sx={{
                                    padding: 2,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    borderRadius: 1,
                                  }}
                                >
                                  <Typography variant="caption" gutterBottom fontWeight={600}>
                                    Database Column
                                  </Typography>
                                  <Grid container spacing={1} sx={{ marginTop: 1 }}>
                                    <Grid item xs={6}>
                                      <Controller
                                        name={`mappings.${index}.table`}
                                        control={control}
                                        render={({ field }) => (
                                          <TextField
                                            {...field}
                                            fullWidth
                                            label="Table"
                                            size="small"
                                            required
                                            sx={{ backgroundColor: 'white' }}
                                          />
                                        )}
                                      />
                                    </Grid>
                                    <Grid item xs={6}>
                                      <Controller
                                        name={`mappings.${index}.dbColumn`}
                                        control={control}
                                        render={({ field }) => (
                                          <TextField
                                            {...field}
                                            fullWidth
                                            label="Column"
                                            size="small"
                                            required
                                            sx={{ backgroundColor: 'white' }}
                                          />
                                        )}
                                      />
                                    </Grid>
                                    <Grid item xs={12}>
                                      <Controller
                                        name={`mappings.${index}.dataType`}
                                        control={control}
                                        render={({ field }) => (
                                          <TextField
                                            {...field}
                                            fullWidth
                                            label="Data Type"
                                            size="small"
                                            required
                                            sx={{ backgroundColor: 'white' }}
                                          />
                                        )}
                                      />
                                    </Grid>
                                  </Grid>
                                </Box>
                              </Grid>

                              <Grid item xs={12}>
                                <Button
                                  color="error"
                                  startIcon={<Delete />}
                                  onClick={() => remove(index)}
                                  size="small"
                                >
                                  Remove Mapping
                                </Button>
                              </Grid>
                            </Grid>
                          </Paper>
                        ))}
                      </Box>
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
                      mappings: {
                        fields: watch('mappings') || [],
                      },
                    }}
                    title="Field Mapping Configuration Preview"
                    filename={`${watch('screenId') || 'mapping'}_config.json`}
                  />
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog} startIcon={<Cancel />}>
                Cancel
              </Button>
              <Button type="submit" variant="contained" startIcon={<Save />}>
                {editingConfig ? 'Update Mappings' : 'Save Mappings'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Activate Confirmation Dialog */}
        <ActivateDialog
          open={activateDialogOpen}
          onClose={() => setActivateDialogOpen(false)}
          onConfirm={handleConfirmActivate}
          configType="Field Mapping"
          configName={selectedConfig?.screenId || ''}
          isLoading={isActivating}
        />

        {/* View Configuration Dialog */}
        <Dialog
          open={viewDialogOpen}
          onClose={() => setViewDialogOpen(false)}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle>
            View Field Mapping - {viewingConfig?.screenId}
          </DialogTitle>
          <DialogContent>
            {viewingConfig && (
              <Box sx={{ paddingTop: 2 }}>
                <JsonViewer
                  data={{
                    screenId: viewingConfig.screenId,
                    version: viewingConfig.version,
                    mappings: viewingConfig.mappings,
                    updatedAt: viewingConfig.updatedAt,
                  }}
                  title="Field Mapping Configuration"
                  filename={`${viewingConfig.screenId}_field_mapping.json`}
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

