import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Paper,
  Divider,
  Avatar,
} from '@mui/material';
import {
  Add as CreateIcon,
  Edit as UpdateIcon,
  CheckCircle as ActivateIcon,
  Cancel as DeprecateIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { AuditLogEntry } from '@/types';
import { formatDateTime } from '@/lib/utils';

interface AuditTrailProps {
  logs: AuditLogEntry[];
}

const getActionIcon = (action: string) => {
  switch (action) {
    case 'CREATE':
      return <CreateIcon />;
    case 'UPDATE':
      return <UpdateIcon />;
    case 'ACTIVATE':
      return <ActivateIcon />;
    case 'DEPRECATE':
      return <DeprecateIcon />;
    case 'DELETE':
      return <DeleteIcon />;
    default:
      return <UpdateIcon />;
  }
};

const getActionColor = (action: string) => {
  switch (action) {
    case 'CREATE':
      return 'success';
    case 'UPDATE':
      return 'primary';
    case 'ACTIVATE':
      return 'success';
    case 'DEPRECATE':
      return 'warning';
    case 'DELETE':
      return 'error';
    default:
      return 'default';
  }
};

export default function AuditTrail({ logs }: AuditTrailProps) {
  if (!logs || logs.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="body2" color="text.secondary" align="center">
            No audit logs available
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Audit Trail
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {logs.map((log, index) => (
            <Box key={log.auditId} sx={{ display: 'flex', gap: 2 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 60 }}>
                <Avatar
                  sx={{
                    bgcolor: `${getActionColor(log.action)}.main`,
                    width: 40,
                    height: 40,
                  }}
                >
                  {getActionIcon(log.action)}
                </Avatar>
                {index < logs.length - 1 && (
                  <Box
                    sx={{
                      width: 2,
                      height: 40,
                      bgcolor: 'divider',
                      marginTop: 1,
                    }}
                  />
                )}
              </Box>

              <Box sx={{ flex: 1 }}>
                <Paper elevation={0} sx={{ padding: 2, backgroundColor: 'background.default' }}>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', marginBottom: 1, flexWrap: 'wrap' }}>
                    <Chip
                      label={log.action}
                      size="small"
                      color={getActionColor(log.action) as any}
                    />
                    <Chip
                      label={log.configType}
                      size="small"
                      variant="outlined"
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ marginLeft: 'auto' }}>
                      {formatDateTime(log.timestamp)}
                    </Typography>
                  </Box>

                  <Typography variant="body2" gutterBottom>
                    <strong>{log.userName}</strong> {log.action.toLowerCase()}d the configuration
                  </Typography>

                  {log.changeReason && (
                    <Typography variant="caption" color="text.secondary" display="block">
                      Reason: {log.changeReason}
                    </Typography>
                  )}
                </Paper>
              </Box>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}

