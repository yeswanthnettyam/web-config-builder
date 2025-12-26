import React from 'react';
import { Box, Typography, Breadcrumbs, Link, Button } from '@mui/material';
import { NavigateNext } from '@mui/icons-material';

interface Breadcrumb {
  label: string;
  href?: string;
}

interface PageHeaderAction {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: Breadcrumb[];
  action?: React.ReactNode | PageHeaderAction;
}

export default function PageHeader({
  title,
  description,
  breadcrumbs,
  action,
}: PageHeaderProps) {
  return (
    <Box sx={{ marginBottom: 3 }}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs
          separator={<NavigateNext fontSize="small" />}
          aria-label="breadcrumb"
          sx={{ marginBottom: 1 }}
        >
          {breadcrumbs.map((crumb, index) =>
            crumb.href ? (
              <Link
                key={index}
                underline="hover"
                color="inherit"
                href={crumb.href}
              >
                {crumb.label}
              </Link>
            ) : (
              <Typography key={index} color="text.primary">
                {crumb.label}
              </Typography>
            )
          )}
        </Breadcrumbs>
      )}

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h4" component="h1" gutterBottom fontWeight={700}>
            {title}
          </Typography>
          {description && (
            <Typography variant="body1" color="text.secondary">
              {description}
            </Typography>
          )}
        </Box>

        {action && (
          typeof action === 'object' && 'label' in action ? (
            <Button
              variant="contained"
              onClick={action.onClick}
              startIcon={action.icon}
              disabled={action.disabled}
              sx={{ minWidth: 140 }}
            >
              {action.label}
            </Button>
          ) : (
            action
          )
        )}
      </Box>
    </Box>
  );
}

