import React from 'react';
import { Chip, ChipProps } from '@mui/material';
import { getStatusColor } from '@/lib/utils';

interface StatusChipProps extends Omit<ChipProps, 'color'> {
  status: string;
}

export default function StatusChip({ status, ...props }: StatusChipProps) {
  return (
    <Chip
      label={status}
      color={getStatusColor(status)}
      size="small"
      {...props}
    />
  );
}

