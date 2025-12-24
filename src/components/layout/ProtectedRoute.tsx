'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Box, CircularProgress } from '@mui/material';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiresEdit?: boolean;
  requiresAdmin?: boolean;
}

export default function ProtectedRoute({
  children,
  requiresEdit = false,
  requiresAdmin = false,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }

    if (
      !isLoading &&
      isAuthenticated &&
      requiresAdmin &&
      user?.role !== 'ADMIN'
    ) {
      router.push('/');
    }

    if (
      !isLoading &&
      isAuthenticated &&
      requiresEdit &&
      user?.role === 'VIEWER'
    ) {
      router.push('/');
    }
  }, [isLoading, isAuthenticated, router, requiresEdit, requiresAdmin, user]);

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

  if (requiresAdmin && user?.role !== 'ADMIN') {
    return null;
  }

  if (requiresEdit && user?.role === 'VIEWER') {
    return null;
  }

  return <>{children}</>;
}

