'use client';

import React, { useState } from 'react';
import {
  Box,
  TextField,
  MenuItem,
  Button,
  IconButton,
  Typography,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Paper,
  Divider,
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import { FlowConditionExpression, ConditionSource, ConditionOperator } from '@/types';
import { CONDITION_SOURCES, OPERATORS } from '@/lib/constants';

interface ConditionBuilderProps {
  condition: FlowConditionExpression;
  onChange: (condition: FlowConditionExpression) => void;
  availableFields?: string[];
  availableServices?: string[];
}

export default function ConditionBuilder({
  condition,
  onChange,
  availableFields = [],
  availableServices = [],
}: ConditionBuilderProps) {
  const [logicType, setLogicType] = useState<'single' | 'AND' | 'OR'>(
    condition.logicOperator || 'single'
  );

  const handleLogicTypeChange = (newType: 'single' | 'AND' | 'OR') => {
    setLogicType(newType);
    if (newType === 'single') {
      onChange({
        ...condition,
        logicOperator: undefined,
        conditions: undefined,
      });
    } else {
      onChange({
        ...condition,
        logicOperator: newType,
        conditions: condition.conditions || [createEmptyCondition()],
      });
    }
  };

  const handleConditionChange = (index: number, updatedCondition: FlowConditionExpression) => {
    if (!condition.conditions) return;
    const newConditions = [...condition.conditions];
    newConditions[index] = updatedCondition;
    onChange({
      ...condition,
      conditions: newConditions,
    });
  };

  const handleAddCondition = () => {
    const newConditions = [...(condition.conditions || []), createEmptyCondition()];
    onChange({
      ...condition,
      conditions: newConditions,
    });
  };

  const handleRemoveCondition = (index: number) => {
    if (!condition.conditions) return;
    const newConditions = condition.conditions.filter((_, i) => i !== index);
    onChange({
      ...condition,
      conditions: newConditions,
    });
  };

  const handleNestedGroupAdd = (type: 'AND' | 'OR') => {
    const newCondition: FlowConditionExpression = {
      logicOperator: type,
      conditions: [createEmptyCondition()],
    };
    const newConditions = [...(condition.conditions || []), newCondition];
    onChange({
      ...condition,
      conditions: newConditions,
    });
  };

  if (logicType !== 'single' && condition.conditions) {
    return (
      <Box>
        <FormControl component="fieldset" sx={{ marginBottom: 2 }}>
          <FormLabel component="legend">Logic Type</FormLabel>
          <RadioGroup
            row
            value={logicType}
            onChange={(e) => handleLogicTypeChange(e.target.value as 'single' | 'AND' | 'OR')}
          >
            <FormControlLabel value="single" control={<Radio />} label="Single Condition" />
            <FormControlLabel value="AND" control={<Radio />} label="AND (All must match)" />
            <FormControlLabel value="OR" control={<Radio />} label="OR (Any can match)" />
          </RadioGroup>
        </FormControl>

        <Divider sx={{ marginY: 2 }} />

        {condition.conditions.map((cond, index) => (
          <Box key={index} sx={{ marginBottom: 2 }}>
            {cond.logicOperator ? (
              <Paper sx={{ padding: 2, backgroundColor: 'grey.50' }}>
                <Typography variant="subtitle2" gutterBottom>
                  {cond.logicOperator} Group
                </Typography>
                <ConditionBuilder
                  condition={cond}
                  onChange={(updated) => handleConditionChange(index, updated)}
                  availableFields={availableFields}
                  availableServices={availableServices}
                />
              </Paper>
            ) : (
              <SingleConditionEditor
                condition={cond}
                onChange={(updated) => handleConditionChange(index, updated)}
                availableFields={availableFields}
                availableServices={availableServices}
                onRemove={() => handleRemoveCondition(index)}
                showRemove={condition.conditions!.length > 1}
              />
            )}
            {index < condition.conditions!.length - 1 && (
              <Box sx={{ textAlign: 'center', marginY: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  🔗 {condition.logicOperator}
                </Typography>
              </Box>
            )}
          </Box>
        ))}

        <Box sx={{ display: 'flex', gap: 1, marginTop: 2 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Add />}
            onClick={handleAddCondition}
          >
            Add Condition to {condition.logicOperator} Group
          </Button>
        </Box>

        <Divider sx={{ marginY: 2 }} />

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => handleNestedGroupAdd('AND')}
          >
            + Add AND Group
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={() => handleNestedGroupAdd('OR')}
          >
            + Add OR Group
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <FormControl component="fieldset" sx={{ marginBottom: 2 }}>
        <FormLabel component="legend">Logic Type</FormLabel>
        <RadioGroup
          row
          value={logicType}
          onChange={(e) => handleLogicTypeChange(e.target.value as 'single' | 'AND' | 'OR')}
        >
          <FormControlLabel value="single" control={<Radio />} label="Single Condition" />
          <FormControlLabel value="AND" control={<Radio />} label="AND (All must match)" />
          <FormControlLabel value="OR" control={<Radio />} label="OR (Any can match)" />
        </RadioGroup>
      </FormControl>

      <SingleConditionEditor
        condition={condition}
        onChange={onChange}
        availableFields={availableFields}
        availableServices={availableServices}
      />
    </Box>
  );
}

interface SingleConditionEditorProps {
  condition: FlowConditionExpression;
  onChange: (condition: FlowConditionExpression) => void;
  availableFields?: string[];
  availableServices?: string[];
  onRemove?: () => void;
  showRemove?: boolean;
}

function SingleConditionEditor({
  condition,
  onChange,
  availableFields = [],
  availableServices = [],
  onRemove,
  showRemove = false,
}: SingleConditionEditorProps) {
  const isCustomCode = condition.source === 'CUSTOM_CODE';

  if (isCustomCode) {
    return (
      <Box>
        <TextField
          fullWidth
          label="Language"
          select
          value={condition.customCode?.language || 'JAVASCRIPT'}
          onChange={(e) =>
            onChange({
              ...condition,
              customCode: {
                ...condition.customCode!,
                language: e.target.value as 'JAVASCRIPT',
              },
            })
          }
          sx={{ marginBottom: 2 }}
        >
          <MenuItem value="JAVASCRIPT">JavaScript</MenuItem>
        </TextField>

        <TextField
          fullWidth
          label="Code Editor"
          multiline
          rows={10}
          value={condition.customCode?.code || ''}
          onChange={(e) =>
            onChange({
              ...condition,
              customCode: {
                ...condition.customCode!,
                code: e.target.value,
              },
            })
          }
          placeholder="// Available context:
// - context.formData
// - context.services
// - context.applicationState
// - context.userProfile

// Return true/false"
          sx={{ marginBottom: 2 }}
        />

        <TextField
          fullWidth
          label="Timeout (ms)"
          type="number"
          value={condition.customCode?.timeout || 2000}
          onChange={(e) =>
            onChange({
              ...condition,
              customCode: {
                ...condition.customCode!,
                timeout: parseInt(e.target.value) || 2000,
              },
            })
          }
        />

        {showRemove && onRemove && (
          <Box sx={{ marginTop: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <IconButton onClick={onRemove} color="error" size="small">
              <Delete />
            </IconButton>
          </Box>
        )}
      </Box>
    );
  }

  return (
    <Box>
      <TextField
        fullWidth
        label="Data Source"
        select
        value={condition.source || 'FORM_DATA'}
        onChange={(e) =>
          onChange({
            ...condition,
            source: e.target.value as ConditionSource,
            field: undefined,
          })
        }
        sx={{ marginBottom: 2 }}
      >
        {CONDITION_SOURCES.map((source) => (
          <MenuItem key={source.value} value={source.value}>
            {source.label}
          </MenuItem>
        ))}
      </TextField>

      {condition.source !== 'CUSTOM_CODE' && condition.source !== 'VALIDATION_RESULT' && (
        <TextField
          fullWidth
          label="Field"
          select
          value={condition.field || ''}
          onChange={(e) => onChange({ ...condition, field: e.target.value })}
          sx={{ marginBottom: 2 }}
          helperText="Select the field to evaluate in this condition"
        >
          <MenuItem value="">
            <em>Select a field</em>
          </MenuItem>
          {getFieldsForSource(condition.source, availableFields, availableServices).map(
            (field) => (
              <MenuItem key={field} value={field}>
                {field}
              </MenuItem>
            )
          )}
        </TextField>
      )}

      <TextField
        fullWidth
        label="Operator"
        select
        value={condition.operator || 'EQUALS'}
        onChange={(e) => onChange({ ...condition, operator: e.target.value as ConditionOperator })}
        sx={{ marginBottom: 2 }}
      >
        {OPERATORS.map((op) => (
          <MenuItem key={op.value} value={op.value}>
            {op.label}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        fullWidth
        label="Value"
        value={condition.value || ''}
        onChange={(e) => {
          const value = e.target.value;
          // Try to parse as number if it looks like a number
          const numValue = !isNaN(Number(value)) && value !== '' ? Number(value) : value;
          onChange({ ...condition, value: numValue });
        }}
        placeholder="Enter value"
      />

      {showRemove && onRemove && (
        <Box sx={{ marginTop: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <IconButton onClick={onRemove} color="error" size="small">
            <Delete />
          </IconButton>
        </Box>
      )}
    </Box>
  );
}

function createEmptyCondition(): FlowConditionExpression {
  return {
    source: 'FORM_DATA',
    operator: 'EQUALS',
    value: '',
  };
}

function getFieldsForSource(
  source: ConditionSource | undefined,
  availableFields: string[],
  availableServices: string[]
): string[] {
  switch (source) {
    case 'FORM_DATA':
      return availableFields;
    case 'SERVICE_RESPONSE':
      return availableServices.flatMap((service) => [
        `${service}.score`,
        `${service}.status`,
        `${service}.result`,
      ]);
    case 'APPLICATION_STATE':
      // These are standard runtime fields provided by the backend
      // TODO: Fetch from backend API if these become configurable
      return [
        'applicationId',
        'applicationStatus',
        'currentScreen',
        'loanAmount',
        'creditScore',
        'createdAt',
        'updatedAt',
      ];
    case 'USER_PROFILE':
      // These are standard user/session fields provided by the backend
      // TODO: Fetch from backend API if these become configurable
      return [
        'userId',
        'userRole',
        'userType',
        'partnerCode',
        'branchCode',
        'agentId',
      ];
    default:
      return [];
  }
}

