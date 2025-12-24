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
import { useScreenConfigs, useDeleteScreenConfig } from '@/hooks/use-screen-configs';
import { usePartners, useScreens } from '@/hooks/use-master-data';
import { ScreenConfig } from '@/types';
import { formatDateTime } from '@/lib/utils';
import {
  getAllScreenConfigs,
  deleteScreenConfig as deleteCachedConfig,
  updateScreenConfigStatus,
  type CachedScreenConfig,
} from '@/lib/cache-storage';
import toast from 'react-hot-toast';

export default function ScreenBuilderPage() {
  const router = useRouter();
  const [filters, setFilters] = useState({
    partnerCode: '',
    screenId: '',
    status: '',
  });
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedConfig, setSelectedConfig] = useState<CachedScreenConfig | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [configs, setConfigs] = useState<CachedScreenConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { data: partners } = usePartners();
  const { data: screens } = useScreens();

  // Load configs from cache
  const loadConfigs = useCallback(() => {
    setIsLoading(true);
    const cachedConfigs = getAllScreenConfigs();
    
    // Apply filters
    let filtered = cachedConfigs;
    
    if (filters.partnerCode) {
      filtered = filtered.filter(c => c.config.scope?.partnerCode === filters.partnerCode);
    }
    
    if (filters.screenId) {
      filtered = filtered.filter(c => c.screenId === filters.screenId);
    }
    
    if (filters.status) {
      filtered = filtered.filter(c => c.status === filters.status);
    }
    
    setConfigs(filtered);
    setIsLoading(false);
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
    config: CachedScreenConfig
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
    if (selectedConfig) {
      router.push(`/screen-builder/new?id=${selectedConfig.id}`);
    }
    handleMenuClose();
  };

  const handleClone = () => {
    if (selectedConfig) {
      router.push(`/screen-builder/new?clone=${selectedConfig.id}`);
    }
    handleMenuClose();
  };

  const handleDelete = () => {
    handleMenuClose();
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedConfig) {
      deleteCachedConfig(selectedConfig.id);
      toast.success('Configuration deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedConfig(null);
      loadConfigs(); // Reload the list
    }
  };

  const handleActivate = () => {
    if (selectedConfig) {
      updateScreenConfigStatus(selectedConfig.id, 'ACTIVE');
      toast.success('Configuration activated successfully');
      handleMenuClose();
      loadConfigs();
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
                    <TableCell>Screen ID</TableCell>
                    <TableCell>Title</TableCell>
                    <TableCell>Partner</TableCell>
                    <TableCell>Scope</TableCell>
                    <TableCell>Version</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Last Updated</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {configs.map((config) => (
                    <TableRow
                      key={config.id}
                      hover
                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    >
                      <TableCell>{config.screenId}</TableCell>
                      <TableCell>{config.screenName}</TableCell>
                      <TableCell>{config.config.scope?.partnerCode || '-'}</TableCell>
                      <TableCell>
                        <Chip
                          label={config.config.scope?.type || 'PARTNER'}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>v{config.version}</TableCell>
                      <TableCell>
                        <StatusChip status={config.status} />
                      </TableCell>
                      <TableCell>
                        {formatDateTime(config.updatedAt)}
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
            <MenuItem onClick={handleActivate}>
              <ListItemIcon>
                <CheckCircle fontSize="small" color="success" />
              </ListItemIcon>
              <ListItemText>Activate</ListItemText>
            </MenuItem>
          )}
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
            View Configuration - {selectedConfig?.screenName}
          </DialogTitle>
          <DialogContent>
            {selectedConfig && (
              <JsonViewer
                data={selectedConfig.config}
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
      </DashboardLayout>
    </ProtectedRoute>
  );
}

