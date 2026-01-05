'use client';

import React from 'react';
import { Chip, Tooltip, ChipProps } from '@mui/material';
import { ScopeType, ConfigScope } from '@/types';
import { getScopeIdentifier } from '@/utils/configValidation';

interface ScopeBadgeProps extends Omit<ChipProps, 'color' | 'label'> {
  scope: ConfigScope;
  showTooltip?: boolean;
  inheritanceChain?: string[];
}

const scopeColors: Record<ScopeType, ChipProps['color']> = {
  PRODUCT: 'primary', // Blue
  PARTNER: 'success', // Green
  BRANCH: 'warning', // Orange
};

export function ScopeBadge({
  scope,
  showTooltip = true,
  inheritanceChain,
  ...props
}: ScopeBadgeProps) {
  const color = scopeColors[scope.type];
  const label = scope.type;
  const identifier = getScopeIdentifier(scope);

  const tooltipTitle = inheritanceChain
    ? `Inheritance Chain:\n${inheritanceChain.join('\n')}\n\nScope: ${identifier}`
    : `Scope: ${identifier}`;

  const chip = (
    <Chip
      label={label}
      color={color}
      size="small"
      {...props}
    />
  );

  if (showTooltip) {
    return (
      <Tooltip title={tooltipTitle} arrow>
        {chip}
      </Tooltip>
    );
  }

  return chip;
}

