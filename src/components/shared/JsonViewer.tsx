import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
} from '@mui/material';
import {
  ContentCopy,
  Download,
  ExpandMore,
  ExpandLess,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import { downloadJson } from '@/lib/utils';

interface JsonViewerProps {
  data: unknown;
  title?: string;
  filename?: string;
}

export default function JsonViewer({ data, title = 'JSON Preview', filename = 'config.json' }: JsonViewerProps) {
  const [expanded, setExpanded] = useState(false);

  const jsonString = JSON.stringify(data, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    toast.success('Copied to clipboard');
  };

  const handleDownload = () => {
    downloadJson(data, filename);
    toast.success('Downloaded successfully');
  };

  return (
    <Card>
      <CardContent>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 2,
          }}
        >
          <Typography variant="h6">{title}</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Copy to clipboard">
              <IconButton onClick={handleCopy} size="small" aria-label="copy json">
                <ContentCopy fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Download JSON">
              <IconButton onClick={handleDownload} size="small" aria-label="download json">
                <Download fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={expanded ? 'Collapse' : 'Expand'}>
              <IconButton
                onClick={() => setExpanded(!expanded)}
                size="small"
                aria-label={expanded ? 'collapse' : 'expand'}
              >
                {expanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Box
          component="pre"
          sx={{
            backgroundColor: '#1e1e1e',
            color: '#d4d4d4',
            padding: 2,
            borderRadius: 1,
            overflow: 'auto',
            maxHeight: expanded ? 'none' : 400,
            fontSize: '0.875rem',
            fontFamily: '"Consolas", "Monaco", "Courier New", monospace',
          }}
        >
          <code>{jsonString}</code>
        </Box>
      </CardContent>
    </Card>
  );
}
