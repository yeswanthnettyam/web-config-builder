'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  TextField,
  MenuItem,
  Button,
  IconButton,
  Typography,
  Paper,
  Divider,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Chip,
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import { Control, Controller, UseFormWatch, useFormContext } from 'react-hook-form';
import { Condition, ConditionGroup, FieldCondition } from '@/types';
import { OPERATORS } from '@/lib/constants';

interface FieldConditionBuilderProps {
  control: Control<any>;
  watch: UseFormWatch<any>;
  fieldArrayName: string;
  fieldIndex: number;
  conditionType: 'visibleWhen' | 'enabledWhen' | 'requiredWhen';
  getAllFieldIds: () => Array<{ value: string; label: string }>;
}

/**
 * Normalizes a condition to a condition group for backward compatibility.
 * Single conditions are wrapped in an AND group with one condition.
 */
function normalizeToConditionGroup(condition: FieldCondition | undefined): ConditionGroup | null {
  if (!condition) return null;
  
  // If it's already a condition group, return it
  if ('operator' in condition && (condition.operator === 'AND' || condition.operator === 'OR')) {
    return condition as ConditionGroup;
  }
  
  // If it's a single condition, wrap it in an AND group
  if ('field' in condition && condition.field) {
    return {
      operator: 'AND',
      conditions: [condition as Condition],
    };
  }
  
  return null;
}

/**
 * Checks if a condition is a simple single condition (for backward compatibility display)
 */
function isSimpleCondition(condition: FieldCondition | undefined): boolean {
  if (!condition) return false;
  if (!('field' in condition) || !condition.field) return false;
  if ('operator' in condition && (condition.operator === 'AND' || condition.operator === 'OR')) return false;
  return true;
}

export default function FieldConditionBuilder({
  control,
  watch,
  fieldArrayName,
  fieldIndex,
  conditionType,
  getAllFieldIds,
}: FieldConditionBuilderProps) {
  const { setValue } = useFormContext();
  const conditionPath = `${fieldArrayName}.${fieldIndex}.${conditionType}`;
  const currentCondition = watch(conditionPath);
  
  // Track if we're updating from within this component (to prevent useEffect from overriding)
  const isInternalUpdateRef = useRef(false);
  
  // Normalize to condition group for internal handling
  const [conditionGroup, setConditionGroup] = useState<ConditionGroup | null>(() => 
    normalizeToConditionGroup(currentCondition)
  );
  
  // Update when external value changes (e.g., from form load or initial mount)
  // Skip update if we're in the middle of an internal update
  useEffect(() => {
    if (isInternalUpdateRef.current) {
      return;
    }
    
    const normalized = normalizeToConditionGroup(currentCondition);
    // Use functional update to get current state
    setConditionGroup((prevGroup) => {
      const currentNormalized = normalizeToConditionGroup(prevGroup);
      // Only update if the normalized values are different
      if (JSON.stringify(normalized) !== JSON.stringify(currentNormalized)) {
        return normalized;
      }
      return prevGroup;
    });
  }, [currentCondition]);

  const updateCondition = (newGroup: ConditionGroup | null) => {
    // Mark that we're doing an internal update
    isInternalUpdateRef.current = true;
    
    // Update local state first - this will trigger a re-render
    setConditionGroup(newGroup);
    
    // Update form value using setValue with shouldValidate and shouldDirty flags
    if (newGroup) {
      // If it's a simple AND group with one condition, save as single condition for backward compatibility
      if (newGroup.operator === 'AND' && newGroup.conditions.length === 1 && 
          !('operator' in newGroup.conditions[0] && (newGroup.conditions[0].operator === 'AND' || newGroup.conditions[0].operator === 'OR'))) {
        const singleCondition = newGroup.conditions[0] as Condition;
        setValue(conditionPath, singleCondition, { shouldValidate: true, shouldDirty: true });
      } else {
        setValue(conditionPath, newGroup, { shouldValidate: true, shouldDirty: true });
      }
    } else {
      setValue(conditionPath, null, { shouldValidate: true, shouldDirty: true });
    }
    
    // Reset the flag after a short delay to allow useEffect to process
    setTimeout(() => {
      isInternalUpdateRef.current = false;
    }, 50);
  };

  const handleLogicTypeChange = (newType: 'AND' | 'OR') => {
    if (!conditionGroup) {
      // Create new group
      updateCondition({
        operator: newType,
        conditions: [createEmptyCondition()],
      });
    } else {
      updateCondition({
        ...conditionGroup,
        operator: newType,
      });
    }
  };

  const handleAddCondition = () => {
    if (!conditionGroup) {
      updateCondition({
        operator: 'AND',
        conditions: [createEmptyCondition()],
      });
    } else {
      updateCondition({
        ...conditionGroup,
        conditions: [...conditionGroup.conditions, createEmptyCondition()],
      });
    }
  };

  const handleRemoveCondition = (index: number) => {
    if (!conditionGroup) return;
    const newConditions = conditionGroup.conditions.filter((_, i) => i !== index);
    if (newConditions.length === 0) {
      updateCondition(null);
    } else {
      updateCondition({
        ...conditionGroup,
        conditions: newConditions,
      });
    }
  };

  const handleConditionChange = (index: number, updatedCondition: Condition) => {
    if (!conditionGroup) return;
    const newConditions = [...conditionGroup.conditions];
    newConditions[index] = updatedCondition;
    updateCondition({
      ...conditionGroup,
      conditions: newConditions,
    });
  };

  const handleAddNestedGroup = (type: 'AND' | 'OR') => {
    if (!conditionGroup) {
      updateCondition({
        operator: 'AND',
        conditions: [{
          operator: type,
          conditions: [createEmptyCondition()],
        }],
      });
    } else {
      updateCondition({
        ...conditionGroup,
        conditions: [
          ...conditionGroup.conditions,
          {
            operator: type,
            conditions: [createEmptyCondition()],
          },
        ],
      });
    }
  };

  // If no condition, show simple toggle
  if (!conditionGroup) {
    return (
      <Box>
        <Button
          variant="outlined"
          size="small"
          startIcon={<Add />}
          onClick={() => updateCondition({
            operator: 'AND',
            conditions: [createEmptyCondition()],
          })}
        >
          Add {conditionType === 'visibleWhen' ? 'Visibility' : conditionType === 'enabledWhen' ? 'Enabled' : 'Required'} Condition
        </Button>
      </Box>
    );
  }

  const isSimple = conditionGroup.operator === 'AND' && conditionGroup.conditions.length === 1 && 
                   !('operator' in conditionGroup.conditions[0] && (conditionGroup.conditions[0].operator === 'AND' || conditionGroup.conditions[0].operator === 'OR'));

  return (
    <Box>
      <FormControl component="fieldset" sx={{ marginBottom: 2 }}>
        <FormLabel component="legend">Logic Type</FormLabel>
        <RadioGroup
          row
          value={conditionGroup.operator}
          onChange={(e) => handleLogicTypeChange(e.target.value as 'AND' | 'OR')}
        >
          <FormControlLabel 
            value="AND" 
            control={<Radio size="small" />} 
            label="AND (All must match)" 
          />
          <FormControlLabel 
            value="OR" 
            control={<Radio size="small" />} 
            label="OR (Any can match)" 
          />
        </RadioGroup>
      </FormControl>

      <Divider sx={{ marginY: 1 }} />

      {conditionGroup.conditions.map((cond, index) => {
        // Check if this is a nested group
        if ('operator' in cond && (cond.operator === 'AND' || cond.operator === 'OR')) {
          const nestedGroup = cond as ConditionGroup;
          return (
            <Box key={index} sx={{ marginBottom: 2 }}>
              <Paper sx={{ padding: 2, backgroundColor: 'grey.50', border: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 1 }}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    {nestedGroup.operator} Group
                  </Typography>
                  {conditionGroup.conditions.length > 1 && (
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleRemoveCondition(index)}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  )}
                </Box>
                <NestedConditionGroup
                  group={nestedGroup}
                  onChange={(updatedGroup) => {
                    const newConditions = [...conditionGroup.conditions];
                    newConditions[index] = updatedGroup;
                    updateCondition({
                      ...conditionGroup,
                      conditions: newConditions,
                    });
                  }}
                  getAllFieldIds={getAllFieldIds}
                  watch={watch}
                  fieldArrayName={fieldArrayName}
                  fieldIndex={fieldIndex}
                />
              </Paper>
              {index < conditionGroup.conditions.length - 1 && (
                <Box sx={{ textAlign: 'center', marginY: 1 }}>
                  <Chip 
                    label={conditionGroup.operator} 
                    size="small" 
                    color="primary" 
                    variant="outlined"
                  />
                </Box>
              )}
            </Box>
          );
        }

        return (
          <Box key={index} sx={{ marginBottom: 2 }}>
            <SingleConditionEditor
              condition={cond as Condition}
              onChange={(updated) => handleConditionChange(index, updated)}
              onRemove={conditionGroup.conditions.length > 1 ? () => handleRemoveCondition(index) : undefined}
              getAllFieldIds={getAllFieldIds}
              watch={watch}
              fieldArrayName={fieldArrayName}
              fieldIndex={fieldIndex}
            />
            {index < conditionGroup.conditions.length - 1 && (
              <Box sx={{ textAlign: 'center', marginY: 1 }}>
                <Chip 
                  label={conditionGroup.operator} 
                  size="small" 
                  color="primary" 
                  variant="outlined"
                />
              </Box>
            )}
          </Box>
        );
      })}

      <Box sx={{ display: 'flex', gap: 1, marginTop: 2, flexWrap: 'wrap' }}>
        <Button
          variant="outlined"
          size="small"
          startIcon={<Add />}
          onClick={handleAddCondition}
        >
          Add Condition
        </Button>
        <Button
          variant="outlined"
          size="small"
          onClick={() => handleAddNestedGroup('AND')}
        >
          + Add AND Group
        </Button>
        <Button
          variant="outlined"
          size="small"
          onClick={() => handleAddNestedGroup('OR')}
        >
          + Add OR Group
        </Button>
        {conditionGroup && (
          <Button
            variant="text"
            size="small"
            color="error"
            onClick={() => updateCondition(null)}
          >
            Remove All
          </Button>
        )}
      </Box>
    </Box>
  );
}

interface SingleConditionEditorProps {
  condition: Condition;
  onChange: (condition: Condition) => void;
  onRemove?: () => void;
  getAllFieldIds: () => Array<{ value: string; label: string }>;
  watch: UseFormWatch<any>;
  fieldArrayName: string;
  fieldIndex: number;
}

function SingleConditionEditor({
  condition,
  onChange,
  onRemove,
  getAllFieldIds,
  watch,
  fieldArrayName,
  fieldIndex,
}: SingleConditionEditorProps) {
  const availableFields = getAllFieldIds();
  const allFields = watch(fieldArrayName) || [];
  const selectedField = allFields.find((f: any) => f.id === condition.field);
  const isDropdown = selectedField?.type === 'DROPDOWN' || selectedField?.type === 'RADIO';
  const hasStaticData = selectedField?.dataSource?.type === 'STATIC_JSON';
  const staticOptions = selectedField?.dataSource?.staticData || [];
  const isExistsOperator = condition.operator === 'EXISTS' || condition.operator === 'NOT_EXISTS';
  const needsValue = !isExistsOperator;

  return (
    <Paper sx={{ padding: 2, border: '1px solid', borderColor: 'divider' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 }}>
        <Typography variant="subtitle2" fontWeight={600}>
          Condition
        </Typography>
        {onRemove && (
          <IconButton size="small" color="error" onClick={onRemove}>
            <Delete fontSize="small" />
          </IconButton>
        )}
      </Box>

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          fullWidth
          select
          label="Field"
          size="small"
          value={condition.field || ''}
          onChange={(e) => onChange({ ...condition, field: e.target.value, value: undefined })}
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="">
            <em>Select field</em>
          </MenuItem>
          {availableFields.map((f) => (
            <MenuItem key={f.value} value={f.value}>
              {f.label}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          fullWidth
          select
          label="Operator"
          size="small"
          value={condition.operator || 'EQUALS'}
          onChange={(e) => {
            const newOperator = e.target.value as Condition['operator'];
            onChange({
              ...condition,
              operator: newOperator,
              value: (newOperator === 'EXISTS' || newOperator === 'NOT_EXISTS') ? undefined : condition.value,
            });
          }}
          sx={{ minWidth: 180 }}
        >
          {OPERATORS.map((op) => (
            <MenuItem key={op.value} value={op.value}>
              {op.label}
            </MenuItem>
          ))}
        </TextField>

        {needsValue && (
          <TextField
            fullWidth
            label="Value"
            size="small"
            value={condition.value || ''}
            onChange={(e) => {
              const value = e.target.value;
              // Try to parse as number if it looks like a number
              const numValue = !isNaN(Number(value)) && value !== '' ? Number(value) : value;
              onChange({ ...condition, value: numValue });
            }}
            select={isDropdown && hasStaticData && staticOptions.length > 0}
            sx={{ minWidth: 200 }}
            placeholder={isDropdown ? 'Select value' : 'Enter value'}
            helperText={
              isDropdown && hasStaticData
                ? 'Select from field options'
                : condition.operator === 'IN' || condition.operator === 'NOT_IN'
                ? 'Comma-separated values'
                : 'Enter expected value'
            }
          >
            {isDropdown && hasStaticData && staticOptions.length > 0
              ? staticOptions.map((opt: any) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))
              : null}
          </TextField>
        )}

        {isExistsOperator && (
          <TextField
            fullWidth
            label="Value"
            size="small"
            disabled
            value=""
            helperText="Not needed for EXISTS/NOT_EXISTS"
            sx={{ minWidth: 200 }}
          />
        )}
      </Box>
    </Paper>
  );
}

interface NestedConditionGroupProps {
  group: ConditionGroup;
  onChange: (group: ConditionGroup) => void;
  getAllFieldIds: () => Array<{ value: string; label: string }>;
  watch: UseFormWatch<any>;
  fieldArrayName: string;
  fieldIndex: number;
}

function NestedConditionGroup({
  group,
  onChange,
  getAllFieldIds,
  watch,
  fieldArrayName,
  fieldIndex,
}: NestedConditionGroupProps) {
  const handleLogicTypeChange = (newType: 'AND' | 'OR') => {
    onChange({
      ...group,
      operator: newType,
    });
  };

  const handleAddCondition = () => {
    onChange({
      ...group,
      conditions: [...group.conditions, createEmptyCondition()],
    });
  };

  const handleRemoveCondition = (index: number) => {
    const newConditions = group.conditions.filter((_, i) => i !== index);
    if (newConditions.length === 0) {
      // If no conditions left, replace with empty condition
      onChange({
        ...group,
        conditions: [createEmptyCondition()],
      });
    } else {
      onChange({
        ...group,
        conditions: newConditions,
      });
    }
  };

  const handleConditionChange = (index: number, updatedCondition: Condition) => {
    const newConditions = [...group.conditions];
    newConditions[index] = updatedCondition;
    onChange({
      ...group,
      conditions: newConditions,
    });
  };

  const handleNestedGroupChange = (index: number, updatedGroup: ConditionGroup) => {
    const newConditions = [...group.conditions];
    newConditions[index] = updatedGroup;
    onChange({
      ...group,
      conditions: newConditions,
    });
  };

  return (
    <Box>
      <FormControl component="fieldset" sx={{ marginBottom: 2 }}>
        <FormLabel component="legend">Nested Logic Type</FormLabel>
        <RadioGroup
          row
          value={group.operator}
          onChange={(e) => handleLogicTypeChange(e.target.value as 'AND' | 'OR')}
        >
          <FormControlLabel 
            value="AND" 
            control={<Radio size="small" />} 
            label="AND" 
          />
          <FormControlLabel 
            value="OR" 
            control={<Radio size="small" />} 
            label="OR" 
          />
        </RadioGroup>
      </FormControl>

      {group.conditions.map((cond, index) => {
        if ('operator' in cond && (cond.operator === 'AND' || cond.operator === 'OR')) {
          return (
            <Box key={index} sx={{ marginBottom: 2 }}>
              <Paper sx={{ padding: 2, backgroundColor: 'grey.100', border: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 1 }}>
                  <Typography variant="caption" fontWeight={600}>
                    Nested {cond.operator} Group
                  </Typography>
                  {group.conditions.length > 1 && (
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleRemoveCondition(index)}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  )}
                </Box>
                <NestedConditionGroup
                  group={cond as ConditionGroup}
                  onChange={(updated) => handleNestedGroupChange(index, updated)}
                  getAllFieldIds={getAllFieldIds}
                  watch={watch}
                  fieldArrayName={fieldArrayName}
                  fieldIndex={fieldIndex}
                />
              </Paper>
              {index < group.conditions.length - 1 && (
                <Box sx={{ textAlign: 'center', marginY: 1 }}>
                  <Chip 
                    label={group.operator} 
                    size="small" 
                    color="secondary" 
                    variant="outlined"
                  />
                </Box>
              )}
            </Box>
          );
        }

        return (
          <Box key={index} sx={{ marginBottom: 1 }}>
            <SingleConditionEditor
              condition={cond as Condition}
              onChange={(updated) => handleConditionChange(index, updated)}
              onRemove={group.conditions.length > 1 ? () => handleRemoveCondition(index) : undefined}
              getAllFieldIds={getAllFieldIds}
              watch={watch}
              fieldArrayName={fieldArrayName}
              fieldIndex={fieldIndex}
            />
            {index < group.conditions.length - 1 && (
              <Box sx={{ textAlign: 'center', marginY: 0.5 }}>
                <Chip 
                  label={group.operator} 
                  size="small" 
                  color="secondary" 
                  variant="outlined"
                />
              </Box>
            )}
          </Box>
        );
      })}

      <Box sx={{ display: 'flex', gap: 1, marginTop: 2 }}>
        <Button
          variant="outlined"
          size="small"
          startIcon={<Add />}
          onClick={handleAddCondition}
        >
          Add Condition
        </Button>
      </Box>
    </Box>
  );
}

function createEmptyCondition(): Condition {
  return {
    field: '',
    operator: 'EQUALS',
    value: undefined,
  };
}

