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
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import PageHeader from '@/components/shared/PageHeader';
import FilterPanel, { Filter } from '@/components/shared/FilterPanel';
import LoadingState from '@/components/shared/LoadingState';
import EmptyState from '@/components/shared/EmptyState';
import StatusChip from '@/components/shared/StatusChip';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import JsonViewer from '@/components/shared/JsonViewer';
import { usePartners, useProducts } from '@/hooks/use-master-data';
import { FlowConfig } from '@/types';
import { formatDateTime } from '@/lib/utils';
import { mockFlowConfigs } from '@/lib/mock-api';

export default function FlowBuilderPage() {
  const router = useRouter();
  const [filters, setFilters] = useState({
    partnerCode: '',
    productCode: '',
    status: '',
  });
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedFlow, setSelectedFlow] = useState<FlowConfig | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const { data: partners } = usePartners();
  const { data: products } = useProducts();

  // Mock data - replace with actual API call
  const flows = mockFlowConfigs;
  const isLoading = false;

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
    flow: FlowConfig
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
      router.push(`/flow-builder/${selectedFlow.flowId}/edit`);
    }
    handleMenuClose();
  };

  const handleClone = () => {
    if (selectedFlow) {
      router.push(`/flow-builder/new?clone=${selectedFlow.flowId}`);
    }
    handleMenuClose();
  };

  const handleDelete = () => {
    handleMenuClose();
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    console.log('Deleting flow:', selectedFlow?.flowId);
    setDeleteDialogOpen(false);
    setSelectedFlow(null);
    // TODO: Delete via API
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
          ) : !flows || flows.length === 0 ? (
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
                    <TableCell>Partner</TableCell>
                    <TableCell>Product</TableCell>
                    <TableCell>Start Screen</TableCell>
                    <TableCell>Screens</TableCell>
                    <TableCell>Version</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Last Updated</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {flows.map((flow) => (
                    <TableRow
                      key={flow.flowId}
                      hover
                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    >
                      <TableCell>{flow.flowId}</TableCell>
                      <TableCell>{flow.partnerCode}</TableCell>
                      <TableCell>{flow.productCode}</TableCell>
                      <TableCell>{flow.startScreen}</TableCell>
                      <TableCell>{flow.screens.length}</TableCell>
                      <TableCell>v{flow.version}</TableCell>
                      <TableCell>
                        <StatusChip status={flow.status} />
                      </TableCell>
                      <TableCell>
                        {formatDateTime(flow.metadata.updatedAt)}
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
          {selectedFlow?.status === 'DRAFT' && (
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
                  data={selectedFlow}
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

