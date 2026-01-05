'use client';

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  Button,
  Divider,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Paper,
} from '@mui/material';
import {
  ArrowBack,
  ContentCopy,
  ExpandMore,
  Info,
} from '@mui/icons-material';
import { useRouter, useParams } from 'next/navigation';
import { useForm, FormProvider } from 'react-hook-form';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import PageHeader from '@/components/shared/PageHeader';
import LoadingState from '@/components/shared/LoadingState';
import ErrorState from '@/components/shared/ErrorState';
import { ConfigScopeSelector } from '@/components/config/ConfigScopeSelector';
import { ScopeBadge } from '@/components/config/ScopeBadge';
import StatusChip from '@/components/shared/StatusChip';
import { useConfig, useConfigVersions, useUpdateConfig, useConfigList } from '@/hooks/use-configs';
import { useConfigResolver } from '@/hooks/useConfigResolver';
import { getScopeIdentifier } from '@/utils/configValidation';
import { formatDateTime } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function ConfigEditPage() {
  const router = useRouter();
  const params = useParams();
  const configId = params?.configId as string;

  const { data: config, isLoading, error } = useConfig(configId);
  const { data: allVersions } = useConfigVersions(config?.screenId || '');
  const { data: allConfigsData } = useConfigList({ screenId: config?.screenId });
  const updateConfigMutation = useUpdateConfig();

  // Get all configs for resolution
  const allConfigs = allConfigsData?.items || (config ? [config] : []);

  // Use hook unconditionally (React hooks rule)
  const resolutionResult = useConfigResolver({
    screenId: config?.screenId || '',
    scope: config?.scope || { type: 'PRODUCT', productCode: '' },
    allConfigs: allConfigs,
  });

  const resolvedConfig = resolutionResult?.resolvedConfig || null;
  const inheritanceChain = resolutionResult?.inheritanceChain || [];

  const methods = useForm({
    defaultValues: config
      ? {
          scope: {
            type: config.scope.type,
            productCode: config.scope.productCode,
            partnerCode: config.scope.partnerCode || '',
            branchCode: config.scope.branchCode || '',
          },
        }
      : {
          scope: {
            type: 'PRODUCT' as const,
            productCode: '',
            partnerCode: '',
            branchCode: '',
          },
        },
    values: config
      ? {
          scope: {
            type: config.scope.type,
            productCode: config.scope.productCode,
            partnerCode: config.scope.partnerCode || '',
            branchCode: config.scope.branchCode || '',
          },
        }
      : undefined,
  });

  const [showDiff, setShowDiff] = useState(false);

  const handleClone = () => {
    if (config) {
      router.push(`/configs/new?clone=${config.configId}`);
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute requiresEdit>
        <DashboardLayout>
          <LoadingState message="Loading configuration..." />
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (error || !config) {
    return (
      <ProtectedRoute requiresEdit>
        <DashboardLayout>
          <ErrorState
            error="Failed to load configuration"
            onRetry={() => router.refresh()}
          />
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiresEdit>
      <DashboardLayout>
        <FormProvider {...methods}>
          <PageHeader
            title={`Edit Configuration: ${config.title}`}
            description={`Screen: ${config.screenId} | Version: ${config.version}`}
            breadcrumbs={[
              { label: 'Home', href: '/' },
              { label: 'Configurations', href: '/configs' },
              { label: 'Edit Configuration' },
            ]}
            action={
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<ArrowBack />}
                  onClick={() => router.push('/configs')}
                >
                  Back
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<ContentCopy />}
                  onClick={handleClone}
                >
                  Clone to Different Scope
                </Button>
              </Box>
            }
          />

          <Grid container spacing={3}>
            {/* Left Column - Main Form */}
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Configuration Details
                  </Typography>
                  <Divider sx={{ my: 2 }} />

                  {/* Scope Section - Read Only */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" gutterBottom fontWeight={600}>
                      Configuration Scope (Immutable)
                    </Typography>
                    <Alert severity="info" sx={{ mb: 2 }}>
                      Scope cannot be changed after creation. Use &quot;Clone to Different Scope&quot; to
                      create a new configuration with a different scope.
                    </Alert>
                    <ConfigScopeSelector readOnly showErrors={false} />
                  </Box>

                  {/* Inheritance Chain */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" gutterBottom fontWeight={600}>
                      Inheritance Chain
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {inheritanceChain && inheritanceChain.length > 0 ? (
                          inheritanceChain.map((item, index) => (
                            <Box
                              key={index}
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                py: 0.5,
                              }}
                            >
                              <Chip
                                label={index === 0 ? 'Resolved From' : 'Fallback'}
                                size="small"
                                color={index === 0 ? 'primary' : 'default'}
                                variant={index === 0 ? 'filled' : 'outlined'}
                              />
                              <Typography variant="body2">{item}</Typography>
                            </Box>
                          ))
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No inheritance chain available
                          </Typography>
                        )}
                      </Box>
                    </Paper>
                  </Box>

                  {/* Configuration Status */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" gutterBottom fontWeight={600}>
                      Status
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <StatusChip status={config.status} />
                      <Typography variant="body2" color="text.secondary">
                        Created: {formatDateTime(config.createdAt)} | Updated:{' '}
                        {formatDateTime(config.updatedAt)}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Metadata */}
                  <Box>
                    <Typography variant="subtitle2" gutterBottom fontWeight={600}>
                      Metadata
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="caption" color="text.secondary">
                            Created By
                          </Typography>
                          <Typography variant="body2">{config.createdBy}</Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="caption" color="text.secondary">
                            Updated By
                          </Typography>
                          <Typography variant="body2">{config.updatedBy}</Typography>
                        </Grid>
                        {config.changeReason && (
                          <Grid item xs={12}>
                            <Typography variant="caption" color="text.secondary">
                              Change Reason
                            </Typography>
                            <Typography variant="body2">{config.changeReason}</Typography>
                          </Grid>
                        )}
                      </Grid>
                    </Paper>
                  </Box>
                </CardContent>
              </Card>

              {/* Diff Section (Collapsible) */}
              <Card sx={{ mt: 3 }}>
                <CardContent>
                  <Accordion expanded={showDiff} onChange={() => setShowDiff(!showDiff)}>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Typography variant="subtitle1" fontWeight={600}>
                        Compare with Parent Configuration
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Alert severity="info" sx={{ mb: 2 }}>
                        <Typography variant="body2">
                          This feature shows differences between this configuration and its parent
                          in the inheritance chain. Full diff implementation would require
                          additional utilities.
                        </Typography>
                      </Alert>
                      <Typography variant="body2" color="text.secondary">
                        Diff visualization can be implemented here to highlight overridden fields.
                      </Typography>
                    </AccordionDetails>
                  </Accordion>
                </CardContent>
              </Card>
            </Grid>

            {/* Right Column - Info Panel */}
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Configuration Info
                  </Typography>
                  <Divider sx={{ my: 2 }} />

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Screen ID
                      </Typography>
                      <Typography variant="body1" fontWeight={600}>
                        {config.screenId}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Scope
                      </Typography>
                      <Box sx={{ mt: 0.5 }}>
                        <ScopeBadge scope={config.scope} />
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {getScopeIdentifier(config.scope)}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Version
                      </Typography>
                      <Typography variant="body1" fontWeight={600}>
                        {config.version}
                      </Typography>
                    </Box>

                    <Divider />

                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Resolved From
                      </Typography>
                      {resolvedConfig && (
                        <Box sx={{ mt: 0.5 }}>
                          <ScopeBadge scope={resolvedConfig.config.scope} />
                        </Box>
                      )}
                    </Box>

                    {allVersions && allVersions.length > 1 && (
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Total Versions
                        </Typography>
                        <Typography variant="body1" fontWeight={600}>
                          {allVersions.length}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>

              {/* Scope Hierarchy Info */}
              <Card sx={{ mt: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Info color="primary" />
                    <Typography variant="subtitle2" fontWeight={600}>
                      Scope Hierarchy
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Configuration resolution follows this order:
                  </Typography>
                  <Box component="ol" sx={{ pl: 2, m: 0 }}>
                    <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                      <strong>BRANCH</strong> (if exists) - Highest priority
                    </Typography>
                    <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                      <strong>PARTNER</strong> (if exists) - Medium priority
                    </Typography>
                    <Typography component="li" variant="body2">
                      <strong>PRODUCT</strong> - Base configuration (always required)
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </FormProvider>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

