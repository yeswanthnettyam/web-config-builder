'use client';

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress,
  Link,
} from '@mui/material';
import { Visibility, VisibilityOff, Email, Lock } from '@mui/icons-material';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login({ email, password });
    } catch (err) {
      setError('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0B2F70 0%, #00B2FF 100%)',
        padding: 2,
      }}
    >
      <Card
        sx={{
          maxWidth: 450,
          width: '100%',
          boxShadow: '0px 8px 32px rgba(0, 0, 0, 0.12)',
        }}
      >
        <CardContent sx={{ padding: 4 }}>
          {/* Logo */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: 3,
            }}
          >
            <Image
              src="/logo.svg"
              alt="Kaleidofin"
              width={200}
              height={32}
              priority
            />
          </Box>

          {/* Title */}
          <Typography
            variant="h5"
            component="h1"
            align="center"
            gutterBottom
            sx={{ fontWeight: 600, color: 'primary.main' }}
          >
            Configuration Platform
          </Typography>
          <Typography
            variant="body2"
            align="center"
            color="text.secondary"
            sx={{ marginBottom: 3 }}
          >
            Sign in to manage your LOS configurations
          </Typography>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ marginBottom: 2 }}>
              {error}
            </Alert>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              autoFocus
              sx={{ 
                marginBottom: 2,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'transparent !important',
                  '& fieldset': {
                    borderColor: 'rgba(0, 0, 0, 0.23)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(0, 0, 0, 0.87)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'primary.main',
                  },
                },
                '& .MuiInputBase-input': {
                  backgroundColor: 'transparent !important',
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email color="action" />
                  </InputAdornment>
                ),
              }}
              inputProps={{
                'aria-label': 'Email address',
                'aria-required': 'true',
              }}
            />

            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              sx={{ 
                marginBottom: 3,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'transparent !important',
                  '& fieldset': {
                    borderColor: 'rgba(0, 0, 0, 0.23)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(0, 0, 0, 0.87)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'primary.main',
                  },
                },
                '& .MuiInputBase-input': {
                  backgroundColor: 'transparent !important',
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              inputProps={{
                'aria-label': 'Password',
                'aria-required': 'true',
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ marginBottom: 2 }}
            >
              {loading ? (
                <>
                  <CircularProgress size={24} sx={{ marginRight: 1 }} />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          {/* Demo Credentials */}
          <Box
            sx={{
              marginTop: 3,
              padding: 2,
              backgroundColor: 'background.default',
              borderRadius: 1,
            }}
          >
            <Typography variant="caption" color="text.secondary" display="block">
              Demo Credentials:
            </Typography>
            <Typography variant="caption" display="block">
              <strong>Admin:</strong> admin@kaleidofin.com / admin123
            </Typography>
            <Typography variant="caption" display="block">
              <strong>Editor:</strong> editor@kaleidofin.com / admin123
            </Typography>
            <Typography variant="caption" display="block">
              <strong>Viewer:</strong> viewer@kaleidofin.com / admin123
            </Typography>
          </Box>

          {/* Footer Links */}
          <Box
            sx={{
              marginTop: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Need help?{' '}
              <Link
                href="mailto:support@kaleidofin.com"
                sx={{
                  color: '#28B2B6',
                  textDecoration: 'underline',
                  '&:hover': {
                    color: '#0F547E',
                  },
                }}
              >
                Contact Us
              </Link>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Powered by and partnered with{' '}
              <Link
                href="https://www.kaleidofin.com"
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  color: '#28B2B6',
                  textDecoration: 'underline',
                  '&:hover': {
                    color: '#0F547E',
                  },
                }}
              >
                Kaleidofin
              </Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

