import React from 'react';
import {
  Box,
  TextField,
  MenuItem,
  Button,
  Paper,
  Grid,
} from '@mui/material';
import { FilterList, Clear } from '@mui/icons-material';

export interface Filter {
  name: string;
  label: string;
  type: 'text' | 'select';
  options?: Array<{ value: string; label: string }>;
  value: string;
}

interface FilterPanelProps {
  filters: Filter[];
  onFilterChange: (name: string, value: string) => void;
  onClearFilters: () => void;
}

export default function FilterPanel({
  filters,
  onFilterChange,
  onClearFilters,
}: FilterPanelProps) {
  const hasActiveFilters = filters.some((f) => f.value !== '');

  return (
    <Paper sx={{ padding: 2, marginBottom: 3 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          marginBottom: 2,
        }}
      >
        <FilterList />
        <Box sx={{ flexGrow: 1 }}>Filters</Box>
        {hasActiveFilters && (
          <Button
            size="small"
            startIcon={<Clear />}
            onClick={onClearFilters}
          >
            Clear All
          </Button>
        )}
      </Box>

      <Grid container spacing={2}>
        {filters.map((filter) => (
          <Grid item xs={12} sm={6} md={3} key={filter.name}>
            <TextField
              fullWidth
              label={filter.label}
              value={filter.value}
              onChange={(e) => onFilterChange(filter.name, e.target.value)}
              select={filter.type === 'select'}
              size="small"
              inputProps={{
                'aria-label': filter.label,
              }}
            >
              {filter.type === 'select' &&
                filter.options?.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
            </TextField>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
}

