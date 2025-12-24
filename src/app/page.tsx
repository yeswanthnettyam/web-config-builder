'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
} from '@mui/material';
import {
  ViewModule,
  Rule,
  AccountTree,
  Article,
  ArrowForward,
} from '@mui/icons-material';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import { canEdit } from '@/lib/utils';

const moduleCards = [
  {
    title: 'Screen Builder',
    description: 'Define UI structure, fields, and actions for each screen',
    icon: <ViewModule sx={{ fontSize: 48, color: 'primary.main' }} />,
    path: '/screen-builder',
    color: '#0B2F70',
    requiresEdit: true,
  },
  {
    title: 'Validation Builder',
    description: 'Configure business rules and validation logic',
    icon: <Rule sx={{ fontSize: 48, color: 'secondary.main' }} />,
    path: '/validation-builder',
    color: '#00B2FF',
    requiresEdit: true,
  },
  {
    title: 'Field Mapping Manager',
    description: 'Map UI fields to database columns with transformations',
    icon: <Article sx={{ fontSize: 48, color: 'success.main' }} />,
    path: '/field-mapping',
    color: '#2E7D32',
    requiresEdit: true,
  },
  {
    title: 'Flow Builder',
    description: 'Design cross-screen navigation and customer journeys',
    icon: <AccountTree sx={{ fontSize: 48, color: 'warning.main' }} />,
    path: '/flow-builder',
    color: '#ED6C02',
    requiresEdit: true,
  },
];

function DashboardContent() {
  const router = useRouter();
  const { user } = useAuth();

  const userCanEdit = canEdit(user?.role || '');

  return (
    <Box>
      {/* Welcome Section */}
      <Box sx={{ marginBottom: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight={700}>
          Welcome, {user?.name}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Configure your Loan Origination System with ease. Select a module to get
          started.
        </Typography>
      </Box>

      {/* Module Cards */}
      <Grid container spacing={3}>
        {moduleCards
          .filter((module) => !module.requiresEdit || userCanEdit)
          .map((module) => (
            <Grid item xs={12} sm={6} lg={3} key={module.path}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.12)',
                  },
                }}
              >
                <CardContent
                  sx={{
                    flexGrow: 1,
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <Box sx={{ marginBottom: 2 }}>{module.icon}</Box>

                  <Typography variant="h6" gutterBottom fontWeight={600}>
                    {module.title}
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ marginBottom: 2, flexGrow: 1 }}
                  >
                    {module.description}
                  </Typography>

                  <Button
                    variant="contained"
                    endIcon={<ArrowForward />}
                    onClick={() => router.push(module.path)}
                    sx={{
                      backgroundColor: module.color,
                      '&:hover': {
                        backgroundColor: module.color,
                        opacity: 0.9,
                      },
                    }}
                  >
                    Open
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
      </Grid>

      {/* Quick Stats */}
      <Box sx={{ marginTop: 6 }}>
        <Typography variant="h5" gutterBottom fontWeight={600}>
          Quick Stats
        </Typography>
        <Grid container spacing={3} sx={{ marginTop: 1 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Active Screens
                </Typography>
                <Typography variant="h4" fontWeight={700}>
                  12
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Active Flows
                </Typography>
                <Typography variant="h4" fontWeight={700}>
                  4
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Total Partners
                </Typography>
                <Typography variant="h4" fontWeight={700}>
                  3
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Draft Configs
                </Typography>
                <Typography variant="h4" fontWeight={700}>
                  5
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}

export default function Dashboard() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <DashboardContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}

