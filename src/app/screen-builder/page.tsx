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
  IconButton,
  Tooltip,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Add,
  Visibility,
  Edit,
  ContentCopy,
  Delete,
  MoreVert,
  CheckCircle,
  Cancel,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import PageHeader from '@/components/shared/PageHeader';
import FilterPanel, { Filter } from '@/components/shared/FilterPanel';
import LoadingState from '@/components/shared/LoadingState';
import ErrorState from '@/components/shared/ErrorState';
import EmptyState from '@/components/shared/EmptyState';
import StatusChip from '@/components/shared/StatusChip';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import JsonViewer from '@/components/shared/JsonViewer';
import { usePartners, useScreens } from '@/hooks/use-master-data';
import { BackendScreenConfig } from '@/types';
import { formatDateTime } from '@/lib/utils';
import { screenConfigApi } from '@/api';
import { AxiosError } from 'axios';

export default function ScreenBuilderPage() {
  const router = useRouter();
  const [filters, setFilters] = useState({
    partnerCode: '',
    screenId: '',
    status: '',
  });
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedConfig, setSelectedConfig] = useState<BackendScreenConfig | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [configs, setConfigs] = useState<BackendScreenConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const { data: partners } = usePartners();
  const { data: screens } = useScreens();

  // Load configs from backend API
  const loadConfigs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const allConfigs = await screenConfigApi.getAll();
      
      // Apply filters
      let filtered = allConfigs;
      
      if (filters.partnerCode) {
        filtered = filtered.filter(c => c.partnerCode === filters.partnerCode);
      }
      
      if (filters.screenId) {
        filtered = filtered.filter(c => c.screenId === filters.screenId);
      }
      
      if (filters.status) {
        filtered = filtered.filter(c => c.status === filters.status);
      }
      
      setConfigs(filtered);
    } catch (err) {
      const axiosError = err as AxiosError<{ message: string }>;
      const errorMessage = axiosError.response?.data?.message || 'Failed to load configurations';
      setError(errorMessage);
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadConfigs();
  }, [loadConfigs]);

  const handleFilterChange = (name: string, value: string) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleClearFilters = () => {
    setFilters({
      partnerCode: '',
      screenId: '',
      status: '',
    });
  };

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    config: BackendScreenConfig
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedConfig(config);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleView = () => {
    handleMenuClose();
    setViewDialogOpen(true);
  };

  const handleEdit = () => {
    if (selectedConfig && selectedConfig.configId) {
      router.push(`/screen-builder/new?id=${selectedConfig.configId}`);
    }
    handleMenuClose();
  };

  const handleClone = async () => {
    if (selectedConfig && selectedConfig.configId) {
      try {
        const clonedConfig = await screenConfigApi.clone(selectedConfig.configId);
        setSnackbar({
          open: true,
          message: `Configuration cloned successfully (ID: ${clonedConfig.configId})`,
          severity: 'success',
        });
        handleMenuClose();
        loadConfigs(); // Reload the list
      } catch (err) {
        const axiosError = err as AxiosError<{ message: string }>;
        const errorMessage = axiosError.response?.data?.message || 'Failed to clone configuration';
        setSnackbar({
          open: true,
          message: errorMessage,
          severity: 'error',
        });
      }
    }
    handleMenuClose();
  };

  const handleDelete = () => {
    handleMenuClose();
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedConfig && selectedConfig.configId) {
      try {
        await screenConfigApi.delete(selectedConfig.configId);
        setSnackbar({
          open: true,
          message: 'Configuration deleted successfully',
          severity: 'success',
        });
        setDeleteDialogOpen(false);
        setSelectedConfig(null);
        loadConfigs(); // Reload the list
      } catch (err) {
        const axiosError = err as AxiosError<{ message: string }>;
        const errorMessage = axiosError.response?.data?.message || 'Failed to delete configuration';
        setSnackbar({
          open: true,
          message: errorMessage,
          severity: 'error',
        });
      }
    }
  };

  const filterConfig: Filter[] = [
    {
      name: 'partnerCode',
      label: 'Partner',
      type: 'select',
      value: filters.partnerCode,
      options: [
        { value: '', label: 'All Partners' },
        ...(partners?.map((p) => ({
          value: p.partnerCode,
          label: p.partnerName,
        })) || []),
      ],
    },
    {
      name: 'screenId',
      label: 'Screen',
      type: 'select',
      value: filters.screenId,
      options: [
        { value: '', label: 'All Screens' },
        ...(screens?.map((s) => ({
          value: s.screenId,
          label: s.screenName,
        })) || []),
      ],
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      value: filters.status,
      options: [
        { value: '', label: 'All Statuses' },
        { value: 'DRAFT', label: 'Draft' },
        { value: 'ACTIVE', label: 'Active' },
        { value: 'DEPRECATED', label: 'Deprecated' },
      ],
    },
  ];

  return (
    <ProtectedRoute requiresEdit>
      <DashboardLayout>
        <PageHeader
          title="Screen Builder"
          description="Define UI structure, fields, and actions for each screen"
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Screen Builder' },
          ]}
          action={{
            label: 'New Screen Config',
            icon: <Add />,
            onClick: () => router.push('/screen-builder/new'),
          }}
        />

        <FilterPanel
          filters={filterConfig}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
        />

        <Card>
          {isLoading ? (
            <LoadingState message="Loading screen configurations..." />
          ) : error ? (
            <ErrorState
              error={error}
              onRetry={loadConfigs}
            />
          ) : !configs || configs.length === 0 ? (
            <EmptyState
              title="No configurations found"
              description="Create your first screen configuration to get started"
              action={{
                label: 'Create Configuration',
                onClick: () => router.push('/screen-builder/new'),
              }}
            />
          ) : (
            <TableContainer>
              <Table aria-label="screen configurations table">
                <TableHead>
                  <TableRow>
                    <TableCell>Config ID</TableCell>
                    <TableCell>Screen ID</TableCell>
                    <TableCell>Product</TableCell>
                    <TableCell>Partner</TableCell>
                    <TableCell>Branch</TableCell>
                    <TableCell>Version</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Last Updated</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {configs.map((config) => (
                    <TableRow
                      key={config.configId}
                      hover
                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    >
                      <TableCell>{config.configId}</TableCell>
                      <TableCell>{config.screenId}</TableCell>
                      <TableCell>{config.productCode || '-'}</TableCell>
                      <TableCell>{config.partnerCode || '-'}</TableCell>
                      <TableCell>{config.branchCode || '-'}</TableCell>
                      <TableCell>v{config.version || 1}</TableCell>
                      <TableCell>
                        <StatusChip status={config.status} />
                      </TableCell>
                      <TableCell>
                        {config.updatedAt ? formatDateTime(config.updatedAt) : '-'}
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="More actions">
                          <IconButton
                            onClick={(e) => handleMenuOpen(e, config)}
                            aria-label="more actions"
                            aria-controls="config-menu"
                            aria-haspopup="true"
                          >
                            <MoreVert />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Card>

        {/* Actions Menu */}
        <Menu
          id="config-menu"
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleView}>
            <ListItemIcon>
              <Visibility fontSize="small" />
            </ListItemIcon>
            <ListItemText>View</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleEdit}>
            <ListItemIcon>
              <Edit fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleClone}>
            <ListItemIcon>
              <ContentCopy fontSize="small" />
            </ListItemIcon>
            <ListItemText>Clone</ListItemText>
          </MenuItem>
          {selectedConfig?.status === 'DRAFT' && (
            <MenuItem onClick={handleDelete}>
              <ListItemIcon>
                <Delete fontSize="small" color="error" />
              </ListItemIcon>
              <ListItemText>Delete</ListItemText>
            </MenuItem>
          )}
        </Menu>

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          open={deleteDialogOpen}
          title="Delete Configuration"
          message={`Are you sure you want to delete the configuration for "${selectedConfig?.screenId}"? This action cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteDialogOpen(false)}
          severity="error"
        />

        {/* View Configuration Dialog */}
        <Dialog
          open={viewDialogOpen}
          onClose={() => setViewDialogOpen(false)}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle>
            View Configuration - {selectedConfig?.screenId}
          </DialogTitle>
          <DialogContent>
            {selectedConfig && (
              <JsonViewer
                data={selectedConfig.uiConfig}
                title="Screen Configuration"
                filename={`${selectedConfig.screenId}_config.json`}
              />
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar for success/error messages */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

