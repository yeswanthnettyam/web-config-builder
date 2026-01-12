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
} from '@mui/icons-material';
import { Chip } from '@mui/material';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import PageHeader from '@/components/shared/PageHeader';
import FilterPanel, { Filter } from '@/components/shared/FilterPanel';
import LoadingState from '@/components/shared/LoadingState';
import EmptyState from '@/components/shared/EmptyState';
import StatusChip from '@/components/shared/StatusChip';
import { ScopeBadge } from '@/components/config/ScopeBadge';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import ActivateDialog from '@/components/shared/ActivateDialog';
import JsonViewer from '@/components/shared/JsonViewer';
import { usePartners, useProducts } from '@/hooks/use-master-data';
import { formatDateTime } from '@/lib/utils';
import { flowConfigApi } from '@/api/flowConfig.api';
import { BackendFlowConfig } from '@/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

export default function FlowBuilderPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    partnerCode: '',
    productCode: '',
    status: '',
  });
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedFlow, setSelectedFlow] = useState<BackendFlowConfig | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [activateDialogOpen, setActivateDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [isActivating, setIsActivating] = useState(false);

  const { data: partners } = usePartners();
  const { data: products } = useProducts();

  // Fetch flows from backend
  const { data: flows = [], isLoading, refetch } = useQuery({
    queryKey: ['flow-configs'],
    queryFn: () => flowConfigApi.getAll(),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (configId: number) => flowConfigApi.delete(configId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flow-configs'] });
      toast.success('Flow deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedFlow(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete flow');
    },
  });

  // Filter flows based on selected criteria
  const filteredFlows = flows.filter(flow => {
    if (filters.partnerCode) {
      if (flow.partnerCode !== filters.partnerCode) return false;
    }
    
    if (filters.productCode) {
      if (flow.productCode !== filters.productCode) return false;
    }
    
    if (filters.status) {
      if (flow.status !== filters.status) return false;
    }
    
    return true;
  });

  const handleFilterChange = (name: string, value: string) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleClearFilters = () => {
    setFilters({
      partnerCode: '',
      productCode: '',
      status: '',
    });
  };

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    flow: BackendFlowConfig
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedFlow(flow);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleView = () => {
    handleMenuClose();
    setViewDialogOpen(true);
  };

  const handleEdit = () => {
    if (selectedFlow) {
      router.push(`/flow-builder/new?edit=${selectedFlow.configId}`);
    }
    handleMenuClose();
  };

  const handleClone = () => {
    if (selectedFlow) {
      router.push(`/flow-builder/new?clone=${selectedFlow.configId}`);
    }
    handleMenuClose();
  };

  const handleActivate = () => {
    handleMenuClose();
    setActivateDialogOpen(true);
  };

  const handleConfirmActivate = async () => {
    if (selectedFlow && selectedFlow.configId) {
      setIsActivating(true);
      try {
        await flowConfigApi.activate(selectedFlow.configId);
        toast.success('Flow activated successfully');
        setActivateDialogOpen(false);
        setSelectedFlow(null);
        refetch();
      } catch (error: any) {
        toast.error(error.message || 'Failed to activate flow');
      } finally {
        setIsActivating(false);
      }
    }
  };

  const handleDelete = () => {
    handleMenuClose();
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedFlow && selectedFlow.configId) {
      deleteMutation.mutate(selectedFlow.configId);
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
      name: 'productCode',
      label: 'Product',
      type: 'select',
      value: filters.productCode,
      options: [
        { value: '', label: 'All Products' },
        ...(products?.map((p) => ({
          value: p.productCode,
          label: p.productName,
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
          title="Flow Builder"
          description="Design cross-screen navigation and customer journeys"
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Flow Builder' },
          ]}
          action={{
            label: 'New Flow',
            icon: <Add />,
            onClick: () => router.push('/flow-builder/new'),
          }}
        />

        <FilterPanel
          filters={filterConfig}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
        />

        <Card>
          {isLoading ? (
            <LoadingState message="Loading flows..." />
          ) : !filteredFlows || filteredFlows.length === 0 ? (
            <EmptyState
              title="No flows found"
              description="Create your first flow to define customer journeys"
              action={{
                label: 'Create Flow',
                onClick: () => router.push('/flow-builder/new'),
              }}
            />
          ) : (
            <TableContainer>
              <Table aria-label="flows table">
                <TableHead>
                  <TableRow>
                    <TableCell>Flow ID</TableCell>
                    <TableCell>Product</TableCell>
                    <TableCell>Partner</TableCell>
                    <TableCell>Scope</TableCell>
                    <TableCell>Start Screen</TableCell>
                    <TableCell>Screens</TableCell>
                    <TableCell>Version</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Last Updated</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredFlows.map((flow) => (
                    <TableRow
                      key={flow.flowId}
                      hover
                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    >
                      <TableCell>{flow.flowId}</TableCell>
                      <TableCell>
                        {flow.productCode || '-'}
                      </TableCell>
                      <TableCell>
                        {flow.partnerCode || <Chip label="ALL" size="small" variant="outlined" />}
                      </TableCell>
                      <TableCell>
                        <Chip label="PARTNER" size="small" color="success" />
                      </TableCell>
                      <TableCell>{(flow.flowDefinition as any)?.startScreen || '-'}</TableCell>
                      <TableCell>{(flow.flowDefinition as any)?.screens?.length || 0}</TableCell>
                      <TableCell>v{flow.version || '1.0'}</TableCell>
                      <TableCell>
                        <StatusChip status={flow.status} />
                      </TableCell>
                      <TableCell>
                        {flow.updatedAt ? formatDateTime(flow.updatedAt) : '-'}
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="More actions">
                          <IconButton
                            onClick={(e) => handleMenuOpen(e, flow)}
                            aria-label="more actions"
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
          {selectedFlow?.status === 'DRAFT' && (
            <>
              <MenuItem onClick={handleEdit}>
                <ListItemIcon>
                  <Edit fontSize="small" />
                </ListItemIcon>
                <ListItemText>Edit</ListItemText>
              </MenuItem>
              <MenuItem onClick={handleActivate}>
                <ListItemIcon>
                  <CheckCircle fontSize="small" color="success" />
                </ListItemIcon>
                <ListItemText>Activate</ListItemText>
              </MenuItem>
            </>
          )}
          <MenuItem onClick={handleClone}>
            <ListItemIcon>
              <ContentCopy fontSize="small" />
            </ListItemIcon>
            <ListItemText>Clone</ListItemText>
          </MenuItem>
          {selectedFlow?.status === 'DRAFT' && (
            <MenuItem onClick={handleDelete}>
              <ListItemIcon>
                <Delete fontSize="small" color="error" />
              </ListItemIcon>
              <ListItemText>Delete</ListItemText>
            </MenuItem>
          )}
        </Menu>

        {/* Activate Confirmation Dialog */}
        <ActivateDialog
          open={activateDialogOpen}
          onClose={() => setActivateDialogOpen(false)}
          onConfirm={handleConfirmActivate}
          configType="Flow"
          configName={selectedFlow?.flowId || ''}
          isLoading={isActivating}
        />

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          open={deleteDialogOpen}
          title="Delete Flow"
          message={`Are you sure you want to delete the flow "${selectedFlow?.flowId}"? This action cannot be undone.`}
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
            View Flow Configuration - {selectedFlow?.flowId}
          </DialogTitle>
          <DialogContent>
            {selectedFlow && (
              <Box sx={{ paddingTop: 2 }}>
                <JsonViewer
                  data={selectedFlow.flowDefinition}
                  title="Flow Configuration"
                  filename={`${selectedFlow.flowId}_flow_config.json`}
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

