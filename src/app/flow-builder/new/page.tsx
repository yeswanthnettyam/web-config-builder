'use client';

import React, { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  MenuItem,
  Typography,
  Paper,
  Chip,
  Alert,
  Tabs,
  Tab,
} from '@mui/material';
import { Save, Cancel, Add } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import PageHeader from '@/components/shared/PageHeader';
import JsonViewer from '@/components/shared/JsonViewer';
import { usePartners, useProducts, useConfiguredScreens } from '@/hooks/use-master-data';

// Dynamically import ReactFlow to avoid SSR issues
const ReactFlow = dynamic(
  () => import('reactflow').then((mod) => mod.default),
  { ssr: false }
);

// Import ReactFlow styles
import 'reactflow/dist/style.css';

interface FlowFormData {
  flowId: string;
  partnerCode: string;
  productCode: string;
  startScreen: string;
}

export default function NewFlowPage() {
  const router = useRouter();
  const { data: partners } = usePartners();
  const { data: products } = useProducts();
  const { data: configuredScreens, isLoading: screensLoading } = useConfiguredScreens();
  const [activeTab, setActiveTab] = useState(0);
  
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FlowFormData>({
    defaultValues: {
      flowId: '',
      partnerCode: '',
      productCode: '',
      startScreen: '',
    },
  });

  // Sample nodes and edges for React Flow
  const [nodes, setNodes] = useState([
    {
      id: '1',
      type: 'input',
      data: { label: 'Start: Personal Details' },
      position: { x: 250, y: 0 },
      style: { background: '#0B2F70', color: 'white', border: '2px solid #0B2F70' },
    },
    {
      id: '2',
      data: { label: 'Income Details' },
      position: { x: 250, y: 100 },
      style: { background: '#00B2FF', color: 'white' },
    },
    {
      id: '3',
      data: { label: 'Document Upload' },
      position: { x: 100, y: 200 },
    },
    {
      id: '4',
      data: { label: 'Bank Details' },
      position: { x: 400, y: 200 },
    },
    {
      id: '5',
      type: 'output',
      data: { label: 'Review & Submit' },
      position: { x: 250, y: 300 },
      style: { background: '#2E7D32', color: 'white', border: '2px solid #2E7D32' },
    },
  ]);

  const [edges, setEdges] = useState([
    {
      id: 'e1-2',
      source: '1',
      target: '2',
      label: 'Next',
      animated: true,
    },
    {
      id: 'e2-3',
      source: '2',
      target: '3',
      label: 'Self-employed',
      style: { stroke: '#ED6C02' },
    },
    {
      id: 'e2-4',
      source: '2',
      target: '4',
      label: 'Salaried',
      style: { stroke: '#00B2FF' },
    },
    { id: 'e3-5', source: '3', target: '5' },
    { id: 'e4-5', source: '4', target: '5' },
  ]);

  const onSubmit = (data: FlowFormData) => {
    console.log('Creating flow:', data);
    // TODO: Save flow configuration
    router.push('/flow-builder');
  };

  const handleCancel = () => {
    router.push('/flow-builder');
  };

  return (
    <ProtectedRoute requiresEdit>
      <DashboardLayout>
        <PageHeader
          title="New Flow Configuration"
          description="Define cross-screen navigation and customer journey"
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Flow Builder', href: '/flow-builder' },
            { label: 'New Flow' },
          ]}
        />

        {(!configuredScreens || configuredScreens.length === 0) && !screensLoading && (
          <Alert severity="warning" sx={{ marginBottom: 3 }}>
            No screen configurations found. Please create screens in Screen Builder first before creating flows.
          </Alert>
        )}

        {/* Tabs for Configuration and Preview */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', marginBottom: 3 }}>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
            <Tab label="Configuration" />
            <Tab label="JSON Preview" />
          </Tabs>
        </Box>

        <form onSubmit={handleSubmit(onSubmit)}>
          {activeTab === 0 && (
          <Box>
          <Card sx={{ marginBottom: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Basic Information
              </Typography>

              <Grid container spacing={3} sx={{ marginTop: 1 }}>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="flowId"
                    control={control}
                    rules={{ required: 'Flow ID is required' }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Flow ID"
                        required
                        error={!!errors.flowId}
                        helperText={errors.flowId?.message}
                        placeholder="e.g., pl_flow_001"
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Controller
                    name="partnerCode"
                    control={control}
                    rules={{ required: 'Partner is required' }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Partner"
                        select
                        required
                        error={!!errors.partnerCode}
                        helperText={errors.partnerCode?.message}
                      >
                        {partners?.map((partner) => (
                          <MenuItem
                            key={partner.partnerCode}
                            value={partner.partnerCode}
                          >
                            {partner.partnerName}
                          </MenuItem>
                        ))}
                      </TextField>
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Controller
                    name="productCode"
                    control={control}
                    rules={{ required: 'Product is required' }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Product"
                        select
                        required
                        error={!!errors.productCode}
                        helperText={errors.productCode?.message}
                      >
                        {products?.map((product) => (
                          <MenuItem
                            key={product.productCode}
                            value={product.productCode}
                          >
                            {product.productName}
                          </MenuItem>
                        ))}
                      </TextField>
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Controller
                    name="startScreen"
                    control={control}
                    rules={{ required: 'Start screen is required' }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Start Screen"
                        select
                        required
                        error={!!errors.startScreen}
                        helperText={errors.startScreen?.message || 'Select from configured screens'}
                      >
                        {configuredScreens?.map((screen) => (
                          <MenuItem key={screen.screenId} value={screen.screenId}>
                            {screen.screenName}
                          </MenuItem>
                        ))}
                      </TextField>
                    )}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Visual Flow Builder */}
          <Card sx={{ marginBottom: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Flow Diagram
              </Typography>

              <Alert severity="info" sx={{ marginBottom: 2 }}>
                Drag nodes to reposition. In a full implementation, you can add/remove
                screens, define conditions, and configure transitions visually.
              </Alert>

              <Paper
                sx={{
                  height: 500,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  fitView
                  attributionPosition="bottom-left"
                />
              </Paper>

              <Box sx={{ marginTop: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Legend:
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Chip
                    label="Start Screen"
                    size="small"
                    sx={{ bgcolor: '#0B2F70', color: 'white' }}
                  />
                  <Chip
                    label="Regular Screen"
                    size="small"
                    sx={{ bgcolor: '#00B2FF', color: 'white' }}
                  />
                  <Chip
                    label="End Screen"
                    size="small"
                    sx={{ bgcolor: '#2E7D32', color: 'white' }}
                  />
                  <Chip
                    label="Conditional Path"
                    size="small"
                    variant="outlined"
                    sx={{ borderColor: '#ED6C02' }}
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              startIcon={<Cancel />}
              onClick={handleCancel}
            >
              Cancel
            </Button>
            <Button type="submit" variant="contained" startIcon={<Save />}>
              Save Flow
            </Button>
          </Box>
          </Box>
          )}
        </form>

        {activeTab === 1 && (
          <Card>
            <CardContent>
              <JsonViewer
                data={{
                  flowId: control._formValues.flowId,
                  partnerCode: control._formValues.partnerCode,
                  productCode: control._formValues.productCode,
                  startScreen: control._formValues.startScreen,
                  nodes: nodes,
                  edges: edges,
                }}
                title="Flow Configuration Preview"
                filename={`${control._formValues.flowId || 'flow'}_config.json`}
              />
            </CardContent>
          </Card>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}

