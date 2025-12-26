'use client';

import React from 'react';
import { Box, Drawer, IconButton, useTheme, useMediaQuery } from '@mui/material';
import { Close } from '@mui/icons-material';

interface RightPanelProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  width?: number;
}

export default function RightPanel({
  open,
  onClose,
  children,
  width = 400,
}: RightPanelProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <>
      {/* Backdrop */}
      {open && (
        <Box
          onClick={onClose}
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: theme.zIndex.drawer - 1,
            transition: 'opacity 0.3s ease-in-out',
          }}
        />
      )}

      {/* Drawer */}
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        variant={isMobile ? 'temporary' : 'persistent'}
        PaperProps={{
          sx: {
            width: isMobile ? '100%' : width,
            maxWidth: '90vw',
            boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.1)',
          },
        }}
        ModalProps={{
          keepMounted: true,
        }}
      >
        <Box
          sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
          }}
        >
          {/* Close Button */}
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              zIndex: 1,
            }}
          >
            <IconButton
              onClick={onClose}
              size="small"
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 1)',
                },
              }}
            >
              <Close fontSize="small" />
            </IconButton>
          </Box>

          {/* Content */}
          <Box
            sx={{
              flex: 1,
              overflow: 'auto',
              padding: 3,
              paddingTop: 4,
            }}
          >
            {children}
          </Box>
        </Box>
      </Drawer>
    </>
  );
}

