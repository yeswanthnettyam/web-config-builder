'use client';

import React from 'react';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Collapse,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  CheckCircle,
  Error as ErrorIcon,
  Warning,
  ExpandMore,
  ExpandLess,
} from '@mui/icons-material';
import { FlowValidationResult } from '@/types';

interface ValidationBannerProps {
  validation: FlowValidationResult | null;
  onViewAll?: () => void;
  onReviewWarnings?: () => void;
}

export default function ValidationBanner({
  validation,
  onViewAll,
  onReviewWarnings,
}: ValidationBannerProps) {
  const [expanded, setExpanded] = React.useState(false);

  if (!validation) {
    return null;
  }

  const { isValid, errors, warnings, summary } = validation;

  if (isValid && warnings.length === 0) {
    return (
      <Alert
        severity="success"
        icon={<CheckCircle />}
        sx={{ marginBottom: 2 }}
      >
        <AlertTitle>Flow Configuration Valid</AlertTitle>
        {summary && (
          <Box component="span">
            {summary.screens} screens • {summary.conditionalRoutes} conditional routes •{' '}
            {summary.services} services • {summary.warnings} warnings
          </Box>
        )}
      </Alert>
    );
  }

  if (errors.length > 0) {
    return (
      <Alert
        severity="error"
        icon={<ErrorIcon />}
        sx={{ marginBottom: 2 }}
        action={
          errors.length > 3 && (
            <Button
              color="inherit"
              size="small"
              onClick={() => setExpanded(!expanded)}
              endIcon={expanded ? <ExpandLess /> : <ExpandMore />}
            >
              {expanded ? 'Show Less' : 'View All Issues'}
            </Button>
          )
        }
      >
        <AlertTitle>
          Flow Configuration Invalid - {errors.length} Error{errors.length !== 1 ? 's' : ''} Found
        </AlertTitle>
        <Collapse in={expanded || errors.length <= 3}>
          <List dense sx={{ marginTop: 1, padding: 0 }}>
            {errors.slice(0, expanded ? errors.length : 3).map((error, index) => (
              <ListItem key={index} sx={{ padding: 0, paddingLeft: 1 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <ErrorIcon fontSize="small" color="error" />
                </ListItemIcon>
                <ListItemText primary={error} />
              </ListItem>
            ))}
          </List>
        </Collapse>
        {errors.length > 3 && !expanded && (
          <Box sx={{ marginTop: 1, fontSize: '0.875rem' }}>
            ... and {errors.length - 3} more error{errors.length - 3 !== 1 ? 's' : ''}
          </Box>
        )}
        {onViewAll && errors.length > 0 && (
          <Box sx={{ marginTop: 1 }}>
            <Button size="small" onClick={onViewAll}>
              View All Issues
            </Button>
          </Box>
        )}
      </Alert>
    );
  }

  if (warnings.length > 0) {
    return (
      <Alert
        severity="warning"
        icon={<Warning />}
        sx={{ marginBottom: 2 }}
        action={
          warnings.length > 3 && (
            <Button
              color="inherit"
              size="small"
              onClick={() => setExpanded(!expanded)}
              endIcon={expanded ? <ExpandLess /> : <ExpandMore />}
            >
              {expanded ? 'Show Less' : 'Review Warnings'}
            </Button>
          )
        }
      >
        <AlertTitle>
          {warnings.length} Warning{warnings.length !== 1 ? 's' : ''}
        </AlertTitle>
        <Collapse in={expanded || warnings.length <= 3}>
          <List dense sx={{ marginTop: 1, padding: 0 }}>
            {warnings.slice(0, expanded ? warnings.length : 3).map((warning, index) => (
              <ListItem key={index} sx={{ padding: 0, paddingLeft: 1 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <Warning fontSize="small" color="warning" />
                </ListItemIcon>
                <ListItemText primary={warning} />
              </ListItem>
            ))}
          </List>
        </Collapse>
        {warnings.length > 3 && !expanded && (
          <Box sx={{ marginTop: 1, fontSize: '0.875rem' }}>
            ... and {warnings.length - 3} more warning{warnings.length - 3 !== 1 ? 's' : ''}
          </Box>
        )}
        {onReviewWarnings && warnings.length > 0 && (
          <Box sx={{ marginTop: 1 }}>
            <Button size="small" onClick={onReviewWarnings}>
              Review Warnings
            </Button>
          </Box>
        )}
      </Alert>
    );
  }

  return null;
}

