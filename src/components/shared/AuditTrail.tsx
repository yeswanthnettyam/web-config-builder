import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
  Chip,
  Paper,
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

        <Timeline position="right">
          {logs.map((log, index) => (
            <TimelineItem key={log.auditId}>
              <TimelineOppositeContent color="text.secondary" sx={{ flex: 0.3 }}>
                <Typography variant="caption">
                  {formatDateTime(log.timestamp)}
                </Typography>
              </TimelineOppositeContent>

              <TimelineSeparator>
                <TimelineDot color={getActionColor(log.action) as any}>
                  {getActionIcon(log.action)}
                </TimelineDot>
                {index < logs.length - 1 && <TimelineConnector />}
              </TimelineSeparator>

              <TimelineContent>
                <Paper elevation={0} sx={{ padding: 2, backgroundColor: 'background.default' }}>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', marginBottom: 1 }}>
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
              </TimelineContent>
            </TimelineItem>
          ))}
        </Timeline>
      </CardContent>
    </Card>
  );
}

