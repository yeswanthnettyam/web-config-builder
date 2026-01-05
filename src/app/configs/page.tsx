'use client';

import React, { useState } from 'react';
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
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  TablePagination,
  Chip,
} from '@mui/material';
import {
  Visibility,
  Edit,
  ContentCopy,
  Delete,
  MoreVert,
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
import { ScopeBadge } from '@/components/config/ScopeBadge';
import { useConfigList, useDeleteConfig, ConfigListFilters } from '@/hooks/use-configs';
import { useProducts, usePartners, useBranches, useScreens } from '@/hooks/use-master-data';
import { ScreenConfig, ConfigStatus, ScopeType } from '@/types';
import { formatDateTime } from '@/lib/utils';
import { getScopeIdentifier } from '@/utils/configValidation';
import toast from 'react-hot-toast';

export default function ConfigListPage() {
  const router = useRouter();
  const [filters, setFilters] = useState<ConfigListFilters>({
    productCode: '',
    partnerCode: '',
    branchCode: '',
    screenId: '',
    scopeType: undefined,
    status: undefined,
    page: 1,
    pageSize: 50,
  });
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedConfig, setSelectedConfig] = useState<ScreenConfig | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);

  // Fetch data
  const { data: configsData, isLoading, error, refetch } = useConfigList(filters);
  const { data: products } = useProducts();
  const { data: partners } = usePartners();
  const { data: branches } = useBranches(filters.partnerCode || undefined);
  const { data: screens } = useScreens();
  const deleteConfigMutation = useDeleteConfig();

  // Update page state when filters change
  React.useEffect(() => {
    setPage(0);
    setFilters((prev) => ({ ...prev, page: 1 }));
  }, [filters.productCode, filters.partnerCode, filters.branchCode, filters.screenId, filters.scopeType, filters.status]);

  const handleFilterChange = (name: string, value: string) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [name]: value || undefined };
      // Reset dependent filters
      if (name === 'productCode') {
        newFilters.partnerCode = undefined;
        newFilters.branchCode = undefined;
      }
      if (name === 'partnerCode') {
        newFilters.branchCode = undefined;
      }
      return newFilters;
    });
  };

  const handleClearFilters = () => {
    setFilters({
      productCode: '',
      partnerCode: '',
      branchCode: '',
      screenId: '',
      scopeType: undefined,
      status: undefined,
      page: 1,
      pageSize: 50,
    });
    setPage(0);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, config: ScreenConfig) => {
    setAnchorEl(event.currentTarget);
    setSelectedConfig(config);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleView = () => {
    if (selectedConfig) {
      router.push(`/configs/${selectedConfig.configId}`);
    }
    handleMenuClose();
  };

  const handleEdit = () => {
    if (selectedConfig) {
      router.push(`/configs/${selectedConfig.configId}/edit`);
    }
    handleMenuClose();
  };

  const handleClone = () => {
    if (selectedConfig) {
      router.push(`/configs/new?clone=${selectedConfig.configId}`);
    }
    handleMenuClose();
  };

  const handleDelete = () => {
    handleMenuClose();
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedConfig) {
      try {
        await deleteConfigMutation.mutateAsync(selectedConfig.configId);
        toast.success('Configuration deleted successfully');
        setDeleteDialogOpen(false);
        setSelectedConfig(null);
        refetch();
      } catch (error) {
        toast.error('Failed to delete configuration');
      }
    }
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
    setFilters((prev) => ({ ...prev, page: newPage + 1 }));
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setPage(0);
    setFilters((prev) => ({ ...prev, pageSize: newRowsPerPage, page: 1 }));
  };

  const filterConfig: Filter[] = [
    {
      name: 'productCode',
      label: 'Product',
      type: 'select',
      value: filters.productCode || '',
      options: [
        { value: '', label: 'All Products' },
        ...(products?.map((p) => ({
          value: p.productCode,
          label: p.productName,
        })) || []),
      ],
    },
    {
      name: 'partnerCode',
      label: 'Partner',
      type: 'select',
      value: filters.partnerCode || '',
      options: [
        { value: '', label: 'All Partners' },
        ...(partners?.map((p) => ({
          value: p.partnerCode,
          label: p.partnerName,
        })) || []),
      ],
    },
    {
      name: 'branchCode',
      label: 'Branch',
      type: 'select',
      value: filters.branchCode || '',
      options: [
        { value: '', label: 'All Branches' },
        ...(branches?.map((b) => ({
          value: b.branchCode,
          label: b.branchName,
        })) || []),
      ],
    },
    {
      name: 'screenId',
      label: 'Screen',
      type: 'select',
      value: filters.screenId || '',
      options: [
        { value: '', label: 'All Screens' },
        ...(screens?.map((s) => ({
          value: s.screenId,
          label: s.screenName,
        })) || []),
      ],
    },
    {
      name: 'scopeType',
      label: 'Scope Type',
      type: 'select',
      value: filters.scopeType || '',
      options: [
        { value: '', label: 'All Scopes' },
        { value: 'PRODUCT', label: 'Product' },
        { value: 'PARTNER', label: 'Partner' },
        { value: 'BRANCH', label: 'Branch' },
      ],
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      value: filters.status || '',
      options: [
        { value: '', label: 'All Statuses' },
        { value: 'DRAFT', label: 'Draft' },
        { value: 'ACTIVE', label: 'Active' },
        { value: 'DEPRECATED', label: 'Deprecated' },
      ],
    },
  ];

  const configs = configsData?.items || [];
  const total = configsData?.total || 0;

  return (
    <ProtectedRoute requiresEdit>
      <DashboardLayout>
        <PageHeader
          title="Configurations"
          description="Manage screen configurations with hierarchical scope (PRODUCT → PARTNER → BRANCH)"
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Configurations' },
          ]}
        />

        <FilterPanel
          filters={filterConfig}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
        />

        <Card>
          {isLoading ? (
            <LoadingState message="Loading configurations..." />
          ) : error ? (
            <ErrorState
              error="Failed to load configurations"
              onRetry={() => refetch()}
            />
          ) : !configs || configs.length === 0 ? (
            <EmptyState
              title="No configurations found"
              description="Create your first configuration to get started"
            />
          ) : (
            <>
              <TableContainer>
                <Table aria-label="configurations table">
                  <TableHead>
                    <TableRow>
                      <TableCell>Screen ID</TableCell>
                      <TableCell>Product</TableCell>
                      <TableCell>Partner</TableCell>
                      <TableCell>Branch</TableCell>
                      <TableCell>Scope</TableCell>
                      <TableCell>Version</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Updated</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {configs.map((config) => (
                      <TableRow key={config.configId} hover>
                        <TableCell>
                          <Box>
                            <Box fontWeight={600}>{config.screenId}</Box>
                            <Box fontSize="0.875rem" color="text.secondary">
                              {config.title}
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>{config.scope.productCode}</TableCell>
                        <TableCell>
                          {config.scope.partnerCode || (
                            <Chip label="ALL" size="small" variant="outlined" />
                          )}
                        </TableCell>
                        <TableCell>
                          {config.scope.branchCode || (
                            <Chip label="ALL" size="small" variant="outlined" />
                          )}
                        </TableCell>
                        <TableCell>
                          <ScopeBadge scope={config.scope} />
                        </TableCell>
                        <TableCell>{config.version}</TableCell>
                        <TableCell>
                          <StatusChip status={config.status} />
                        </TableCell>
                        <TableCell>{formatDateTime(config.updatedAt)}</TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuOpen(e, config)}
                            aria-label="more actions"
                          >
                            <MoreVert />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                component="div"
                count={total}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[10, 25, 50, 100]}
              />
            </>
          )}
        </Card>

        <Menu
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
          <MenuItem onClick={handleDelete}>
            <ListItemIcon>
              <Delete fontSize="small" />
            </ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        </Menu>

        <ConfirmDialog
          open={deleteDialogOpen}
          title="Delete Configuration"
          message={`Are you sure you want to delete configuration "${selectedConfig?.title}"? This action cannot be undone.`}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteDialogOpen(false)}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          severity="error"
        />
      </DashboardLayout>
    </ProtectedRoute>
  );
}

