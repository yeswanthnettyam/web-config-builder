'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Box,
  Card,
  Grid,
  TextField,
  MenuItem,
  Button,
  IconButton,
  Typography,
  Divider,
  FormControlLabel,
  Checkbox,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
} from '@mui/material';
import {
  Add,
  Delete,
  ExpandMore,
  DragIndicator,
} from '@mui/icons-material';
import { Control, Controller, useFieldArray, UseFormWatch, UseFormTrigger, useFormContext } from 'react-hook-form';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import SortableField from './SortableField';
import FieldConditionBuilder from './FieldConditionBuilder';
import {
  FIELD_TYPES,
  DATA_SOURCE_TYPES,
  KEYBOARD_TYPES,
  OTP_CHANNELS,
  OPERATORS,
  VERIFICATION_MODES,
  INPUT_DATA_TYPES,
  INPUT_KEYBOARD_TYPES,
  HTTP_METHODS,
} from '@/lib/constants';

// Component for static data input with local state
function StaticDataInput({ value, onChange }: { value: any[]; onChange: (value: any[]) => void }) {
  const [textValue, setTextValue] = useState(() => {
    if (Array.isArray(value) && value.length > 0) {
      return value
        .map((opt: any) => {
          if (typeof opt === 'string') return opt;
          return `${opt.value}:${opt.label}`;
        })
        .join(', ');
    }
    return '';
  });

  const parseOptions = (input: string) => {
    if (!input.trim()) {
      return [];
    }

    // Split by comma first
    const items = input.split(',').map(item => item.trim()).filter(item => item);
    
    const options = items.map((item) => {
      // Check if it has value:label format (key:value pairs)
      const colonIndex = item.indexOf(':');
      
      if (colonIndex > 0) {
        const value = item.substring(0, colonIndex).trim();
        const label = item.substring(colonIndex + 1).trim();
        
        if (value && label) {
          return { value, label };
        }
      }

      // Simple format - use the whole item as label, create value from it
      if (item) {
        return {
          value: item.toLowerCase().replace(/\s+/g, '_'),
          label: item,
        };
      }
      
      return null;
    }).filter((opt): opt is { value: string; label: string } => 
      opt !== null && opt.value !== '' && opt.label !== ''
    );

    return options;
  };

  return (
    <TextField
      fullWidth
      label="Options (Key:Value Pairs)"
      multiline
      rows={4}
      size="small"
      placeholder="m:Married, s:Single, d:Divorced"
      helperText="Enter comma-separated key:value pairs (e.g., 'm:Married, s:Single, d:Divorced')"
      value={textValue}
      onChange={(e) => {
        const input = e.target.value;
        setTextValue(input);
        
        // Parse and update the actual field value
        const options = parseOptions(input);
        onChange(options);
      }}
      sx={{
        '& .MuiInputBase-input': {
          fontFamily: 'monospace',
          fontSize: '0.9rem',
        },
      }}
    />
  );
}

function KeyValueMappingInput({
  label,
  helperText,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  helperText: string;
  placeholder: string;
  value: Record<string, string> | undefined;
  onChange: (value: Record<string, string>) => void;
}) {
  const [textValue, setTextValue] = useState(() => {
    if (value && typeof value === 'object') {
      const entries = Object.entries(value).filter(([k, v]) => k && v);
      return entries.map(([k, v]) => `${k}:${v}`).join(', ');
    }
    return '';
  });

  const parsePairs = (input: string): Record<string, string> => {
    const out: Record<string, string> = {};
    if (!input.trim()) return out;

    const items = input
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    for (const item of items) {
      const colonIndex = item.indexOf(':');
      if (colonIndex <= 0) continue;
      const key = item.substring(0, colonIndex).trim();
      const val = item.substring(colonIndex + 1).trim();
      if (key && val) out[key] = val;
    }
    return out;
  };

  return (
    <TextField
      fullWidth
      label={label}
      multiline
      rows={3}
      size="small"
      placeholder={placeholder}
      helperText={helperText}
      value={textValue}
      onChange={(e) => {
        const input = e.target.value;
        setTextValue(input);
        onChange(parsePairs(input));
      }}
      sx={{
        '& .MuiInputBase-input': {
          fontFamily: 'monospace',
          fontSize: '0.9rem',
        },
      }}
    />
  );
}

interface FieldBuilderProps {
  control: Control<any>;
  watch: UseFormWatch<any>;
  trigger: UseFormTrigger<any>;
  sectionIndex: number;
  subSectionIndex?: number;
  fieldArrayName: string;
  onFieldDragEnd?: (event: DragEndEvent) => void;
}

export default function FieldBuilder({
  control,
  watch,
  trigger,
  sectionIndex,
  subSectionIndex,
  fieldArrayName,
  onFieldDragEnd,
}: FieldBuilderProps) {
  const {
    fields: fieldFields,
    append: appendField,
    remove: removeField,
    move: moveField,
  } = useFieldArray({
    control,
    name: fieldArrayName,
  });

  const { setValue } = useFormContext();
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  
  // Track _keys for fields that don't have them yet (for existing fields)
  const fieldKeysRef = useRef<Map<number, string>>(new Map());

  // Track previous validation types to detect changes
  const prevValidationTypesRef = useRef<Record<string, string>>({});

  // Clear irrelevant dateConfig values when validationType changes
  useEffect(() => {
    fieldFields.forEach((_, fieldIndex: number) => {
      const fieldPath = `${fieldArrayName}.${fieldIndex}`;
      const fieldType = watch(`${fieldPath}.type`);
      const validationType = watch(`${fieldPath}.dateConfig.validationType`);
      
      if (fieldType === 'DATE' && validationType) {
        const fieldKey = `${fieldPath}`;
        const prevValidationType = prevValidationTypesRef.current[fieldKey];
        
        // Only clear if validationType actually changed
        if (prevValidationType && prevValidationType !== validationType) {
          // Clear irrelevant values based on new validationType
          if (validationType === 'ANY' || validationType === 'FUTURE' || validationType === 'PAST') {
            // Clear AGE_RANGE, DATE_RANGE, and OFFSET specific fields
            setValue(`${fieldPath}.dateConfig.minAge`, null);
            setValue(`${fieldPath}.dateConfig.maxAge`, null);
            setValue(`${fieldPath}.dateConfig.minDate`, null);
            setValue(`${fieldPath}.dateConfig.maxDate`, null);
            setValue(`${fieldPath}.dateConfig.offset`, null);
            setValue(`${fieldPath}.dateConfig.unit`, null);
          } else if (validationType === 'AGE_RANGE') {
            // Clear DATE_RANGE and OFFSET fields
            setValue(`${fieldPath}.dateConfig.minDate`, null);
            setValue(`${fieldPath}.dateConfig.maxDate`, null);
            setValue(`${fieldPath}.dateConfig.offset`, null);
            setValue(`${fieldPath}.dateConfig.unit`, null);
          } else if (validationType === 'DATE_RANGE') {
            // Clear AGE_RANGE and OFFSET fields
            setValue(`${fieldPath}.dateConfig.minAge`, null);
            setValue(`${fieldPath}.dateConfig.maxAge`, null);
            setValue(`${fieldPath}.dateConfig.offset`, null);
            setValue(`${fieldPath}.dateConfig.unit`, null);
          } else if (validationType === 'OFFSET') {
            // Clear AGE_RANGE and DATE_RANGE fields
            setValue(`${fieldPath}.dateConfig.minAge`, null);
            setValue(`${fieldPath}.dateConfig.maxAge`, null);
            setValue(`${fieldPath}.dateConfig.minDate`, null);
            setValue(`${fieldPath}.dateConfig.maxDate`, null);
            // Set default unit to MONTH if not set
            const currentUnit = watch(`${fieldPath}.dateConfig.unit`);
            if (!currentUnit) {
              setValue(`${fieldPath}.dateConfig.unit`, 'MONTH');
            }
          }
        }
        
        // Update the ref with current validationType
        prevValidationTypesRef.current[fieldKey] = validationType;
      }
    });
  }, [fieldFields, fieldArrayName, watch, setValue]);

  // Setup sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle field drag end
  const handleFieldDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);

    if (!over || active.id === over.id) return;

    const fields = watch(fieldArrayName) || [];
    // Use _key instead of id for finding fields (id is user-editable)
    const oldIndex = fields.findIndex((f: any) => (f._key || f.id) === active.id);
    const newIndex = fields.findIndex((f: any) => (f._key || f.id) === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // Use moveField from useFieldArray to update the form state
    moveField(oldIndex, newIndex);

    // Update order properties after reordering
    setTimeout(() => {
      const updatedFields = watch(fieldArrayName) || [];
      updatedFields.forEach((field: any, index: number) => {
        const fieldPath = `${fieldArrayName}.${index}.order`;
        const currentOrder = watch(fieldPath);
        if (currentOrder !== index) {
          // This will be handled by the parent component's onFieldDragEnd
        }
      });
    }, 0);

    // Call parent handler if provided (for updating order)
    if (onFieldDragEnd) {
      onFieldDragEnd(event);
    }
  };

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  };

  const handleAddField = () => {
    const currentFields = watch(fieldArrayName) || [];
    const sectionId = watch(`sections.${sectionIndex}.id`);
    const subsectionId = subSectionIndex !== undefined 
      ? watch(`sections.${sectionIndex}.subSections.${subSectionIndex}.id`)
      : undefined;
    
    appendField({
      _key: crypto.randomUUID(), // Immutable internal key for React keys and dnd-kit
      id: `field_${Date.now()}`,
      type: 'TEXT',
      label: '',
      required: false,
      readOnly: false,
      placeholder: '',
      order: currentFields.length,
      parentId: subsectionId || sectionId,
      parentType: subsectionId ? 'SUBSECTION' : 'SECTION',
    });
  };

  // Get all field IDs for conditional logic dropdown
  const getAllFieldIds = () => {
    const fields = watch(fieldArrayName) || [];
    return fields
      .filter((f: any) => f.id)
      .map((f: any) => ({
        value: f.id,
        label: `${f.id} (${f.label || 'Unlabeled'})`,
      }));
  };

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 2,
        }}
      >
        <Typography variant="subtitle2" fontWeight={600}>
          Fields
        </Typography>
        <Button
          size="small"
          startIcon={<Add />}
          onClick={handleAddField}
          variant="outlined"
        >
          Add Field
        </Button>
      </Box>

      {fieldFields.length === 0 ? (
        <Card variant="outlined" sx={{ padding: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            No fields added yet. Click &quot;Add Field&quot; to create one.
          </Typography>
        </Card>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleFieldDragEnd}
        >
          <SortableContext
            items={(() => {
              return fieldFields.map((f: any, idx: number) => {
                const fieldData = watch(`${fieldArrayName}.${idx}`);
                // Use immutable _key for sortable items (never use field.id)
                if (!fieldData) return null;
                // Use existing _key or get/generate from ref (stable across renders)
                if (fieldData._key) return fieldData._key;
                if (!fieldKeysRef.current.has(idx)) {
                  fieldKeysRef.current.set(idx, crypto.randomUUID());
                }
                return fieldKeysRef.current.get(idx)!;
              }).filter(Boolean) as string[];
            })()}
            strategy={verticalListSortingStrategy}
          >
            {fieldFields.map((field: any, fieldIndex: number) => {
          const currentFieldType = watch(`${fieldArrayName}.${fieldIndex}.type`);
          const hasDataSource = ['DROPDOWN', 'RADIO'].includes(currentFieldType);
          const hasOtpConfig = currentFieldType === 'OTP_VERIFICATION';
          const hasVerifiedInputConfig = currentFieldType === 'VERIFIED_INPUT';
          const hasApiVerificationConfig = currentFieldType === 'API_VERIFICATION';
          const hasFileConfig = currentFieldType === 'FILE_UPLOAD';
          const hasDateConfig = currentFieldType === 'DATE';
          const hasCameraCaptureConfig = currentFieldType === 'CAMERA_CAPTURE';
          const hasWebviewLaunchConfig = currentFieldType === 'WEBVIEW_LAUNCH';
          const hasQrScannerConfig = currentFieldType === 'QR_SCANNER';
          const hasTextInput = ['TEXT', 'NUMBER', 'TEXTAREA', 'OTP_VERIFICATION', 'API_VERIFICATION'].includes(currentFieldType);
          const hasInputCapable = ['TEXT', 'NUMBER', 'DATE', 'DROPDOWN', 'TEXTAREA', 'VERIFIED_INPUT', 'OTP_VERIFICATION', 'API_VERIFICATION', 'FILE_UPLOAD'].includes(currentFieldType);
          const verificationMode = watch(`${fieldArrayName}.${fieldIndex}.verifiedInputConfig.verification.mode`);
              const currentField = watch(`${fieldArrayName}.${fieldIndex}`);

              // Guard against missing field
              if (!currentField) {
                return null;
              }

              // Use immutable _key for React key (never use field.id which is user-editable)
              // Use existing _key or get from ref (stable across renders)
              let fieldKey = currentField._key;
              if (!fieldKey) {
                if (!fieldKeysRef.current.has(fieldIndex)) {
                  fieldKeysRef.current.set(fieldIndex, crypto.randomUUID());
                }
                fieldKey = fieldKeysRef.current.get(fieldIndex)!;
              }
              const hasId = !!currentField.id;

          return (
                <SortableField
                  key={fieldKey}
                  fieldKey={fieldKey}
                  field={currentField}
                  fieldIndex={fieldIndex}
                  disabled={!hasId}
                >
                  <Accordion sx={{ marginBottom: 1, marginLeft: hasId ? 4 : 0 }} defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    width: '100%',
                    gap: 1,
                  }}
                >
                        <Typography sx={{ flexGrow: 1, color: hasId ? 'text.primary' : 'text.secondary', fontStyle: hasId ? 'normal' : 'italic' }}>
                    {watch(`${fieldArrayName}.${fieldIndex}.label`) ||
                      watch(`${fieldArrayName}.${fieldIndex}.id`) ||
                            `Field ${fieldIndex + 1}${hasId ? '' : ' (ID required)'}`}
                  </Typography>
                  <Chip
                    label={watch(`${fieldArrayName}.${fieldIndex}.type`) || 'TEXT'}
                    size="small"
                          color={hasId ? 'primary' : 'warning'}
                    variant="outlined"
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  {/* Basic Field Properties */}
                  <Grid item xs={12}>
                    <Typography variant="caption" fontWeight={600} color="primary">
                      Basic Properties
                    </Typography>
                    <Divider sx={{ marginTop: 0.5, marginBottom: 1.5 }} />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Controller
                      name={`${fieldArrayName}.${fieldIndex}.id`}
                      control={control}
                            shouldUnregister={false}
                      rules={{
                        required: 'Field ID is required',
                        pattern: {
                          value: /^[a-z][a-z0-9_]*$/,
                          message: 'Use snake_case (lowercase with underscores)',
                        },
                      }}
                            render={({ field, fieldState }: { field: any; fieldState: any }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Field ID"
                          required
                          size="small"
                          error={!!fieldState.error}
                          helperText={
                            fieldState.error?.message ||
                            'Use snake_case (e.g., full_name)'
                          }
                          placeholder="e.g., email_address"
                                onBlur={field.onBlur}
                                autoComplete="off"
                                inputProps={{
                                  autoComplete: 'off',
                                  'data-field-index': fieldIndex,
                                }}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Controller
                      name={`${fieldArrayName}.${fieldIndex}.label`}
                      control={control}
                      rules={{ required: 'Label is required' }}
                      render={({ field, fieldState }: { field: any; fieldState: any }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Field Label"
                          required
                          size="small"
                          error={!!fieldState.error}
                          helperText={fieldState.error?.message}
                          placeholder="e.g., Email Address"
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Controller
                      name={`${fieldArrayName}.${fieldIndex}.type`}
                      control={control}
                      render={({ field }: { field: any }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Field Type"
                          select
                          required
                          size="small"
                        >
                          {FIELD_TYPES.map((type) => (
                            <MenuItem key={type.value} value={type.value}>
                              {type.label}
                            </MenuItem>
                          ))}
                        </TextField>
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <FormControlLabel
                        control={
                          <Controller
                            name={`${fieldArrayName}.${fieldIndex}.required`}
                            control={control}
                            render={({ field }: { field: any }) => (
                              <Checkbox
                                {...field}
                                checked={field.value || false}
                              />
                            )}
                          />
                        }
                        label="Required"
                      />
                      <FormControlLabel
                        control={
                          <Controller
                            name={`${fieldArrayName}.${fieldIndex}.readOnly`}
                            control={control}
                            render={({ field }: { field: any }) => (
                              <Checkbox
                                {...field}
                                checked={field.value || false}
                              />
                            )}
                          />
                        }
                        label="Read Only"
                      />
                    </Box>
                  </Grid>

                  {/* Default Value - for all input-capable fields */}
                  {['TEXT', 'NUMBER', 'DATE', 'DROPDOWN', 'TEXTAREA', 'VERIFIED_INPUT', 'CHECKBOX', 'RADIO'].includes(currentFieldType) && (
                    <Grid item xs={12} md={6}>
                      <Controller
                        name={`${fieldArrayName}.${fieldIndex}.value`}
                        control={control}
                        render={({ field }: { field: any }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="Default Value (Optional)"
                            size="small"
                            placeholder="Pre-fill field with this value"
                            helperText="Optional: Field will be pre-filled with this value on screen load"
                            value={field.value !== undefined && field.value !== null ? String(field.value) : ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              // For NUMBER type, try to parse as number if possible
                              if (currentFieldType === 'NUMBER' && val !== '') {
                                const numVal = Number(val);
                                field.onChange(isNaN(numVal) ? val : numVal);
                              } else {
                                field.onChange(val === '' ? undefined : val);
                              }
                            }}
                          />
                        )}
                      />
                      </Grid>
                  )}

                  {/* Placeholder - for all input-capable fields */}
                  {hasInputCapable && (
                      <Grid item xs={12} md={6}>
                        <Controller
                          name={`${fieldArrayName}.${fieldIndex}.placeholder`}
                          control={control}
                          render={({ field }: { field: any }) => (
                            <TextField
                              {...field}
                              fullWidth
                            label="Placeholder (Optional)"
                              size="small"
                              placeholder="e.g., Enter your email"
                            helperText="Optional: Placeholder text shown when field is empty"
                            />
                          )}
                        />
                    </Grid>
                  )}

                  {/* Text Input Specific */}
                  {hasTextInput && (
                    <>
                      <Grid item xs={12}>
                        <Typography
                          variant="caption"
                          fontWeight={600}
                          color="primary"
                        >
                          Text Input Properties
                        </Typography>
                        <Divider sx={{ marginTop: 0.5, marginBottom: 1.5 }} />
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <Controller
                          name={`${fieldArrayName}.${fieldIndex}.keyboard`}
                          control={control}
                          render={({ field }: { field: any }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="Keyboard Type"
                              select
                              size="small"
                            >
                              {KEYBOARD_TYPES.map((type) => (
                                <MenuItem key={type.value} value={type.value}>
                                  {type.label}
                                </MenuItem>
                              ))}
                            </TextField>
                          )}
                        />
                      </Grid>

                      {currentFieldType === 'NUMBER' && (
                        <>
                          <Grid item xs={12} md={6}>
                            <Controller
                              name={`${fieldArrayName}.${fieldIndex}.min`}
                              control={control}
                              render={({ field }: { field: any }) => (
                                <TextField
                                  {...field}
                                  fullWidth
                                  label="Minimum Value"
                                  type="number"
                                  size="small"
                                />
                              )}
                            />
                          </Grid>

                          <Grid item xs={12} md={6}>
                            <Controller
                              name={`${fieldArrayName}.${fieldIndex}.max`}
                              control={control}
                              render={({ field }: { field: any }) => (
                                <TextField
                                  {...field}
                                  fullWidth
                                  label="Maximum Value"
                                  type="number"
                                  size="small"
                                />
                              )}
                            />
                          </Grid>
                        </>
                      )}

                      {(currentFieldType === 'TEXT' || currentFieldType === 'NUMBER' || currentFieldType === 'TEXTAREA') && (
                        <>
                          <Grid item xs={12} md={6}>
                            <Controller
                              name={`${fieldArrayName}.${fieldIndex}.minLength`}
                              control={control}
                              render={({ field }: { field: any }) => (
                                <TextField
                                  {...field}
                                  fullWidth
                                  label="Min Length"
                                  type="number"
                                  size="small"
                                  inputProps={{ min: 0 }}
                                  helperText="Minimum character length"
                                />
                              )}
                            />
                          </Grid>
                        <Grid item xs={12} md={6}>
                          <Controller
                            name={`${fieldArrayName}.${fieldIndex}.maxLength`}
                            control={control}
                            render={({ field }: { field: any }) => (
                              <TextField
                                {...field}
                                fullWidth
                                label="Max Length"
                                type="number"
                                size="small"
                                  inputProps={{ min: 0 }}
                                  helperText="Maximum character length"
                              />
                            )}
                          />
                        </Grid>
                        </>
                      )}
                    </>
                  )}

                  {/* Dropdown / Data Source */}
                  {hasDataSource && (
                    <>
                      <Grid item xs={12}>
                        <Typography
                          variant="caption"
                          fontWeight={600}
                          color="primary"
                        >
                          Data Source Configuration
                        </Typography>
                        <Divider sx={{ marginTop: 0.5, marginBottom: 1.5 }} />
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <Controller
                          name={`${fieldArrayName}.${fieldIndex}.dataSource.type`}
                          control={control}
                          render={({ field }: { field: any }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="Data Source Type"
                              select
                              required
                              size="small"
                            >
                              {DATA_SOURCE_TYPES.map((type) => (
                                <MenuItem key={type.value} value={type.value}>
                                  {type.label}
                                </MenuItem>
                              ))}
                            </TextField>
                          )}
                        />
                      </Grid>

                      {/* Selection Mode (for DROPDOWN only) */}
                      {currentFieldType === 'DROPDOWN' && (
                        <>
                          <Grid item xs={12} md={6}>
                            <Controller
                              name={`${fieldArrayName}.${fieldIndex}.selectionMode`}
                              control={control}
                              render={({ field }: { field: any }) => (
                                <TextField
                                  {...field}
                                  fullWidth
                                  label="Selection Mode"
                                  select
                                  size="small"
                                  value={field.value || 'SINGLE'}
                                  helperText="SINGLE: One selection | MULTIPLE: Multiple selections"
                                >
                                  <MenuItem value="SINGLE">Single Select</MenuItem>
                                  <MenuItem value="MULTIPLE">Multiple Select</MenuItem>
                                </TextField>
                              )}
                            />
                          </Grid>

                          {/* Min/Max Selections (only for MULTIPLE mode) */}
                          {watch(`${fieldArrayName}.${fieldIndex}.selectionMode`) === 'MULTIPLE' && (
                            <>
                              <Grid item xs={12} md={6}>
                                <Controller
                                  name={`${fieldArrayName}.${fieldIndex}.minSelections`}
                                  control={control}
                                  render={({ field }: { field: any }) => {
                                    const maxSelections = watch(`${fieldArrayName}.${fieldIndex}.maxSelections`);
                                    return (
                                      <TextField
                                        {...field}
                                        fullWidth
                                        label="Minimum Selections"
                                        type="number"
                                        size="small"
                                        inputProps={{ min: 0 }}
                                        helperText={
                                          maxSelections && field.value > maxSelections
                                            ? 'Must be ≤ Maximum Selections'
                                            : 'Minimum number of items to select'
                                        }
                                        error={maxSelections && field.value > maxSelections}
                                        onChange={(e) => {
                                          const value = parseInt(e.target.value) || 0;
                                          field.onChange(value >= 0 ? value : 0);
                                        }}
                                      />
                                    );
                                  }}
                                />
                              </Grid>
                              <Grid item xs={12} md={6}>
                                <Controller
                                  name={`${fieldArrayName}.${fieldIndex}.maxSelections`}
                                  control={control}
                                  render={({ field }: { field: any }) => {
                                    const minSelections = watch(`${fieldArrayName}.${fieldIndex}.minSelections`);
                                    return (
                                      <TextField
                                        {...field}
                                        fullWidth
                                        label="Maximum Selections"
                                        type="number"
                                        size="small"
                                        inputProps={{ min: 1 }}
                                        helperText={
                                          minSelections && field.value < minSelections
                                            ? 'Must be ≥ Minimum Selections'
                                            : field.value < 1
                                            ? 'Must be at least 1'
                                            : 'Maximum number of items to select'
                                        }
                                        error={(minSelections && field.value < minSelections) || field.value < 1}
                                        onChange={(e) => {
                                          const value = parseInt(e.target.value) || 1;
                                          field.onChange(value >= 1 ? value : 1);
                                        }}
                                      />
                                    );
                                  }}
                                />
                              </Grid>
                            </>
                          )}
                        </>
                      )}

                      {watch(
                        `${fieldArrayName}.${fieldIndex}.dataSource.type`
                      ) === 'STATIC_JSON' && (
                        <Grid item xs={12}>
                          <Controller
                            name={`${fieldArrayName}.${fieldIndex}.dataSource.staticData`}
                            control={control}
                            render={({ field }: { field: any }) => (
                              <StaticDataInput
                                value={field.value || []}
                                onChange={field.onChange}
                              />
                            )}
                          />
                        </Grid>
                      )}

                      {watch(
                        `${fieldArrayName}.${fieldIndex}.dataSource.type`
                      ) === 'MASTER_DATA' && (
                        <Grid item xs={12} md={6}>
                          <Controller
                            name={`${fieldArrayName}.${fieldIndex}.dataSource.masterDataKey`}
                            control={control}
                            render={({ field }: { field: any }) => (
                              <TextField
                                {...field}
                                fullWidth
                                label="Master Data Key"
                                size="small"
                                placeholder="e.g., COUNTRIES, STATES"
                              />
                            )}
                          />
                        </Grid>
                      )}

                      {watch(
                        `${fieldArrayName}.${fieldIndex}.dataSource.type`
                      ) === 'API' && (
                        <Grid item xs={12} md={6}>
                          <Controller
                            name={`${fieldArrayName}.${fieldIndex}.dataSource.apiEndpoint`}
                            control={control}
                            render={({ field }: { field: any }) => (
                              <TextField
                                {...field}
                                fullWidth
                                label="API Endpoint"
                                required
                                size="small"
                                placeholder="/api/data/options"
                              />
                            )}
                          />
                        </Grid>
                      )}
                    </>
                  )}

                  {/* File Upload */}
                  {hasFileConfig && (
                    <>
                      <Grid item xs={12}>
                        <Typography
                          variant="caption"
                          fontWeight={600}
                          color="primary"
                        >
                          File Upload Configuration
                        </Typography>
                        <Divider sx={{ marginTop: 0.5, marginBottom: 1.5 }} />
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <Controller
                          name={`${fieldArrayName}.${fieldIndex}.allowedFileTypes`}
                          control={control}
                          render={({ field }: { field: any }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="Allowed File Types"
                              size="small"
                              placeholder="e.g., .pdf, .jpg, .png"
                              helperText="Comma-separated list"
                              value={Array.isArray(field.value) ? field.value.join(', ') : field.value || ''}
                              onChange={(e) => {
                                const types = e.target.value.split(',').map(t => t.trim());
                                field.onChange(types);
                              }}
                            />
                          )}
                        />
                      </Grid>

                      <Grid item xs={12} md={3}>
                        <Controller
                          name={`${fieldArrayName}.${fieldIndex}.maxFileSizeMB`}
                          control={control}
                          render={({ field }: { field: any }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="Max File Size (MB)"
                              type="number"
                              size="small"
                              inputProps={{ min: 1, max: 100 }}
                            />
                          )}
                        />
                      </Grid>

                      <Grid item xs={12} md={3}>
                        <Controller
                          name={`${fieldArrayName}.${fieldIndex}.maxFiles`}
                          control={control}
                          render={({ field }: { field: any }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="Max Files"
                              type="number"
                              size="small"
                              inputProps={{ min: 1, max: 10 }}
                            />
                          )}
                        />
                      </Grid>
                    </>
                  )}

                  {/* Camera Capture Configuration */}
                  {hasCameraCaptureConfig && (
                    <>
                      <Grid item xs={12}>
                        <Typography variant="caption" fontWeight={600} color="primary">
                          Camera Capture Configuration
                        </Typography>
                        <Divider sx={{ marginTop: 0.5, marginBottom: 1.5 }} />
                      </Grid>

                      <Grid item xs={12} md={4}>
                        <Controller
                          name={`${fieldArrayName}.${fieldIndex}.cameraConfig.cameraFacing`}
                          control={control}
                          render={({ field }: { field: any }) => (
                            <TextField {...field} fullWidth label="Camera Facing" select required size="small">
                              <MenuItem value="BACK">Back</MenuItem>
                              <MenuItem value="FRONT">Front</MenuItem>
                            </TextField>
                          )}
                        />
                      </Grid>

                      <Grid item xs={12} md={4}>
                        <FormControlLabel
                          control={
                            <Controller
                              name={`${fieldArrayName}.${fieldIndex}.cameraConfig.allowGallery`}
                              control={control}
                              render={({ field }: { field: any }) => (
                                <Checkbox {...field} checked={field.value || false} />
                              )}
                            />
                          }
                          label="Allow Gallery"
                        />
                      </Grid>

                      <Grid item xs={12} md={4}>
                        <Controller
                          name={`${fieldArrayName}.${fieldIndex}.cameraConfig.maxImages`}
                          control={control}
                          render={({ field }: { field: any }) => (
                            <TextField {...field} fullWidth label="Max Images" type="number" size="small" placeholder="e.g., 1" />
                          )}
                        />
                      </Grid>

                      <Grid item xs={12}>
                        <Typography variant="caption" fontWeight={600} color="secondary" sx={{ mt: 2 }}>
                          Quality Checks (Optional)
                        </Typography>
                        <Divider sx={{ marginTop: 0.5, marginBottom: 1.5 }} />
                      </Grid>

                      <Grid item xs={12} md={4}>
                        <FormControlLabel
                          control={
                            <Controller
                              name={`${fieldArrayName}.${fieldIndex}.cameraConfig.qualityChecks.blurDetection`}
                              control={control}
                              render={({ field }: { field: any }) => (
                                <Checkbox {...field} checked={field.value || false} />
                              )}
                            />
                          }
                          label="Enable Blur Detection"
                        />
                      </Grid>

                      <Grid item xs={12} md={4}>
                        <Controller
                          name={`${fieldArrayName}.${fieldIndex}.cameraConfig.qualityChecks.minResolution.width`}
                          control={control}
                          render={({ field }: { field: any }) => (
                            <TextField {...field} fullWidth label="Min Width (px)" type="number" size="small" />
                          )}
                        />
                      </Grid>

                      <Grid item xs={12} md={4}>
                        <Controller
                          name={`${fieldArrayName}.${fieldIndex}.cameraConfig.qualityChecks.minResolution.height`}
                          control={control}
                          render={({ field }: { field: any }) => (
                            <TextField {...field} fullWidth label="Min Height (px)" type="number" size="small" />
                          )}
                        />
                      </Grid>

                      <Grid item xs={12}>
                        <Typography variant="caption" fontWeight={600} color="primary" sx={{ mt: 2 }}>
                          Storage / Upload
                        </Typography>
                        <Divider sx={{ marginTop: 0.5, marginBottom: 1.5 }} />
                      </Grid>

                      <Grid item xs={12} md={4}>
                        <FormControlLabel
                          control={
                            <Controller
                              name={`${fieldArrayName}.${fieldIndex}.storage.uploadOnCapture`}
                              control={control}
                              render={({ field }: { field: any }) => (
                                <Checkbox {...field} checked={field.value || false} />
                              )}
                            />
                          }
                          label="Upload on Capture"
                        />
                      </Grid>

                      {watch(`${fieldArrayName}.${fieldIndex}.storage.uploadOnCapture`) && (
                        <>
                          <Grid item xs={12} md={6}>
                            <Controller
                              name={`${fieldArrayName}.${fieldIndex}.storage.uploadApi`}
                              control={control}
                              render={({ field }: { field: any }) => (
                                <TextField
                                  {...field}
                                  fullWidth
                                  label="Upload API"
                                  required
                                  size="small"
                                  placeholder="/api/v1/files/upload"
                                />
                              )}
                            />
                          </Grid>

                          <Grid item xs={12} md={3}>
                            <Controller
                              name={`${fieldArrayName}.${fieldIndex}.storage.fileType`}
                              control={control}
                              render={({ field }: { field: any }) => (
                                <TextField {...field} fullWidth label="File Type" select size="small">
                                  <MenuItem value="IMAGE">IMAGE</MenuItem>
                                </TextField>
                              )}
                            />
                          </Grid>
                        </>
                      )}
                    </>
                  )}

                  {/* WebView Launch Configuration */}
                  {hasWebviewLaunchConfig && (
                    <>
                      <Grid item xs={12}>
                        <Typography variant="caption" fontWeight={600} color="primary">
                          WebView Launch Configuration
                        </Typography>
                        <Divider sx={{ marginTop: 0.5, marginBottom: 1.5 }} />
                      </Grid>

                      <Grid item xs={12} md={4}>
                        <Controller
                          name={`${fieldArrayName}.${fieldIndex}.webviewConfig.urlSource`}
                          control={control}
                          render={({ field }: { field: any }) => (
                            <TextField {...field} fullWidth label="URL Source" select required size="small">
                              <MenuItem value="API">API</MenuItem>
                            </TextField>
                          )}
                        />
                      </Grid>

                      <Grid item xs={12} md={5}>
                        <Controller
                          name={`${fieldArrayName}.${fieldIndex}.webviewConfig.launchApi`}
                          control={control}
                          render={({ field }: { field: any }) => (
                            <TextField {...field} fullWidth label="Launch API" required size="small" placeholder="/api/v1/esign/init" />
                          )}
                        />
                      </Grid>

                      <Grid item xs={12} md={3}>
                        <Controller
                          name={`${fieldArrayName}.${fieldIndex}.webviewConfig.httpMethod`}
                          control={control}
                          render={({ field }: { field: any }) => (
                            <TextField {...field} fullWidth label="HTTP Method" select required size="small">
                              {HTTP_METHODS.map((m) => (
                                <MenuItem key={m.value} value={m.value}>
                                  {m.label}
                                </MenuItem>
                              ))}
                            </TextField>
                          )}
                        />
                      </Grid>

                      <Grid item xs={12}>
                        <Typography variant="caption" fontWeight={600} color="secondary" sx={{ mt: 2 }}>
                          Success Condition (Optional)
                        </Typography>
                        <Divider sx={{ marginTop: 0.5, marginBottom: 1.5 }} />
                      </Grid>

                      <Grid item xs={12} md={4}>
                        <Controller
                          name={`${fieldArrayName}.${fieldIndex}.webviewConfig.successCondition.source`}
                          control={control}
                          render={({ field }: { field: any }) => (
                            <TextField {...field} fullWidth label="Source" select size="small">
                              <MenuItem value="CALLBACK">Callback</MenuItem>
                              <MenuItem value="POLLING">Polling</MenuItem>
                            </TextField>
                          )}
                        />
                      </Grid>

                      <Grid item xs={12} md={4}>
                        <Controller
                          name={`${fieldArrayName}.${fieldIndex}.webviewConfig.successCondition.field`}
                          control={control}
                          render={({ field }: { field: any }) => (
                            <TextField {...field} fullWidth label="Response Field" size="small" placeholder="e.g., status" />
                          )}
                        />
                      </Grid>

                      <Grid item xs={12} md={4}>
                        <Controller
                          name={`${fieldArrayName}.${fieldIndex}.webviewConfig.successCondition.equals`}
                          control={control}
                          render={({ field }: { field: any }) => (
                            <TextField {...field} fullWidth label="Equals" size="small" placeholder="e.g., COMPLETED" />
                          )}
                        />
                      </Grid>
                    </>
                  )}

                  {/* QR Scanner Configuration */}
                  {hasQrScannerConfig && (
                    <>
                      <Grid item xs={12}>
                        <Typography variant="caption" fontWeight={600} color="primary">
                          QR Scanner Configuration
                        </Typography>
                        <Divider sx={{ marginTop: 0.5, marginBottom: 1.5 }} />
                      </Grid>

                      <Grid item xs={12}>
                        <Controller
                          name={`${fieldArrayName}.${fieldIndex}.qrConfig.prefillMapping`}
                          control={control}
                          render={({ field }: { field: any }) => (
                            <KeyValueMappingInput
                              label="Prefill Mapping (fieldId:qrKey)"
                              placeholder="gst_number:gstin, business_name:legalName"
                              helperText="Comma-separated key:value pairs. Left = target screen fieldId, right = QR payload key."
                              value={field.value}
                              onChange={(obj) => {
                                setValue(`${fieldArrayName}.${fieldIndex}.qrConfig.prefillMapping`, obj, { shouldDirty: true });
                              }}
                            />
                          )}
                        />
                      </Grid>
                    </>
                  )}

                  {/* Date Picker Configuration */}
                  {hasDateConfig && (() => {
                    const validationType = watch(`${fieldArrayName}.${fieldIndex}.dateConfig.validationType`);
                    return (
                    <>
                      <Grid item xs={12}>
                        <Typography
                          variant="caption"
                          fontWeight={600}
                          color="primary"
                        >
                          Date Picker Configuration
                        </Typography>
                        <Divider sx={{ marginTop: 0.5, marginBottom: 1.5 }} />
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <Controller
                            name={`${fieldArrayName}.${fieldIndex}.dateConfig.dateFormat`}
                          control={control}
                          render={({ field }: { field: any }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="Date Format"
                              select
                              size="small"
                              helperText="Format for displaying and parsing dates"
                                defaultValue="YYYY-MM-DD"
                            >
                              <MenuItem value="DD/MM/YYYY">DD/MM/YYYY</MenuItem>
                              <MenuItem value="MM/DD/YYYY">MM/DD/YYYY</MenuItem>
                              <MenuItem value="YYYY-MM-DD">YYYY-MM-DD</MenuItem>
                              <MenuItem value="DD-MM-YYYY">DD-MM-YYYY</MenuItem>
                              <MenuItem value="DD.MM.YYYY">DD.MM.YYYY</MenuItem>
                            </TextField>
                          )}
                        />
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <Controller
                          name={`${fieldArrayName}.${fieldIndex}.dateConfig.validationType`}
                          control={control}
                          render={({ field }: { field: any }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="Date Validation Type"
                              select
                              size="small"
                              helperText="Type of date validation"
                            >
                              <MenuItem value="ANY">Any Date</MenuItem>
                                <MenuItem value="FUTURE">Future Only</MenuItem>
                                <MenuItem value="PAST">Past Only</MenuItem>
                              <MenuItem value="AGE_RANGE">Age Range</MenuItem>
                              <MenuItem value="DATE_RANGE">Date Range</MenuItem>
                                <MenuItem value="OFFSET">Offset</MenuItem>
                            </TextField>
                            )}
                          />
                        </Grid>

                        {/* AGE_RANGE: Show minAge and maxAge */}
                        {validationType === 'AGE_RANGE' && (
                          <>
                            <Grid item xs={12} md={6}>
                              <Controller
                                name={`${fieldArrayName}.${fieldIndex}.dateConfig.minAge`}
                                control={control}
                                render={({ field }: { field: any }) => (
                                  <TextField
                                    {...field}
                                    fullWidth
                                    label="Minimum Age"
                                    type="number"
                                    size="small"
                                    helperText="Minimum age in years"
                                    value={field.value ?? ''}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      field.onChange(val === '' ? null : Number(val));
                                    }}
                                  />
                                )}
                              />
                            </Grid>
                            <Grid item xs={12} md={6}>
                              <Controller
                                name={`${fieldArrayName}.${fieldIndex}.dateConfig.maxAge`}
                                control={control}
                                render={({ field }: { field: any }) => (
                                  <TextField
                                    {...field}
                                    fullWidth
                                    label="Maximum Age"
                                    type="number"
                                    size="small"
                                    helperText="Maximum age in years"
                                    value={field.value ?? ''}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      field.onChange(val === '' ? null : Number(val));
                                    }}
                                  />
                          )}
                        />
                      </Grid>
                    </>
                  )}

                        {/* DATE_RANGE: Show minDate and maxDate */}
                        {validationType === 'DATE_RANGE' && (
                          <>
                            <Grid item xs={12} md={6}>
                              <Controller
                                name={`${fieldArrayName}.${fieldIndex}.dateConfig.minDate`}
                                control={control}
                                render={({ field }: { field: any }) => (
                                  <TextField
                                    {...field}
                                    fullWidth
                                    label="Minimum Date"
                                    type="date"
                                    size="small"
                                    helperText="Minimum allowed date (YYYY-MM-DD)"
                                    InputLabelProps={{ shrink: true }}
                                    value={field.value ?? ''}
                                    onChange={(e) => {
                                      field.onChange(e.target.value === '' ? null : e.target.value);
                                    }}
                                  />
                                )}
                              />
                            </Grid>
                            <Grid item xs={12} md={6}>
                              <Controller
                                name={`${fieldArrayName}.${fieldIndex}.dateConfig.maxDate`}
                                control={control}
                                render={({ field }: { field: any }) => (
                                  <TextField
                                    {...field}
                                    fullWidth
                                    label="Maximum Date"
                                    type="date"
                                    size="small"
                                    helperText="Maximum allowed date (YYYY-MM-DD)"
                                    InputLabelProps={{ shrink: true }}
                                    value={field.value ?? ''}
                                    onChange={(e) => {
                                      field.onChange(e.target.value === '' ? null : e.target.value);
                                    }}
                                  />
                                )}
                              />
                            </Grid>
                          </>
                        )}

                        {/* OFFSET: Show offset and unit */}
                        {validationType === 'OFFSET' && (
                          <>
                            <Grid item xs={12} md={6}>
                              <Controller
                                name={`${fieldArrayName}.${fieldIndex}.dateConfig.offset`}
                                control={control}
                                render={({ field }: { field: any }) => (
                                  <TextField
                                    {...field}
                                    fullWidth
                                    label="Offset"
                                    type="number"
                                    size="small"
                                    helperText="Number of units (e.g., 3 for 3 months)"
                                    value={field.value ?? ''}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      field.onChange(val === '' ? null : Number(val));
                                    }}
                                  />
                                )}
                              />
                            </Grid>
                            <Grid item xs={12} md={6}>
                              <Controller
                                name={`${fieldArrayName}.${fieldIndex}.dateConfig.unit`}
                                control={control}
                                render={({ field }: { field: any }) => (
                                  <TextField
                                    {...field}
                                    fullWidth
                                    label="Unit"
                                    select
                                    size="small"
                                    helperText="Time unit for offset (default: MONTH)"
                                    defaultValue="MONTH"
                                  >
                                    <MenuItem value="DAY">Day</MenuItem>
                                    <MenuItem value="MONTH">Month</MenuItem>
                                    <MenuItem value="YEAR">Year</MenuItem>
                                  </TextField>
                                )}
                              />
                            </Grid>
                          </>
                        )}
                      </>
                    );
                  })()}

                  {/* OTP Verification */}
                  {hasOtpConfig && (
                    <>
                      <Grid item xs={12}>
                        <Typography
                          variant="caption"
                          fontWeight={600}
                          color="primary"
                        >
                          OTP Configuration
                        </Typography>
                        <Divider sx={{ marginTop: 0.5, marginBottom: 1.5 }} />
                      </Grid>

                      <Grid item xs={12} md={4}>
                        <Controller
                          name={`${fieldArrayName}.${fieldIndex}.otpConfig.channel`}
                          control={control}
                          render={({ field }: { field: any }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="OTP Channel"
                              select
                              required
                              size="small"
                            >
                              {OTP_CHANNELS.map((channel) => (
                                <MenuItem
                                  key={channel.value}
                                  value={channel.value}
                                >
                                  {channel.label}
                                </MenuItem>
                              ))}
                            </TextField>
                          )}
                        />
                      </Grid>

                      <Grid item xs={12} md={4}>
                        <Controller
                          name={`${fieldArrayName}.${fieldIndex}.otpConfig.linkedField`}
                          control={control}
                          render={({ field }: { field: any }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="Linked Field ID"
                              size="small"
                              placeholder="e.g., mobile"
                              helperText="Field to send OTP to"
                            />
                          )}
                        />
                      </Grid>

                      <Grid item xs={12} md={4}>
                        <Controller
                          name={`${fieldArrayName}.${fieldIndex}.otpConfig.otpLength`}
                          control={control}
                          render={({ field }: { field: any }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="OTP Length"
                              type="number"
                              required
                              size="small"
                              inputProps={{ min: 4, max: 8 }}
                            />
                          )}
                        />
                      </Grid>

                      <Grid item xs={12} md={4}>
                        <Controller
                          name={`${fieldArrayName}.${fieldIndex}.otpConfig.resendIntervalSeconds`}
                          control={control}
                          render={({ field }: { field: any }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="Resend Interval (seconds)"
                              type="number"
                              size="small"
                              inputProps={{ min: 10 }}
                            />
                          )}
                        />
                      </Grid>

                      {/* Consent UI Configuration (Optional) */}
                      <Grid item xs={12}>
                        <Typography variant="caption" fontWeight={600} color="secondary" sx={{ mt: 2 }}>
                          Consent UI (Optional)
                        </Typography>
                        <Divider sx={{ marginTop: 0.5, marginBottom: 1.5 }} />
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <Controller
                          name={`${fieldArrayName}.${fieldIndex}.otpConfig.consent.title`}
                          control={control}
                          render={({ field }: { field: any }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="Consent Title"
                              size="small"
                              placeholder="e.g., Mobile Number Verification"
                            />
                          )}
                        />
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <Controller
                          name={`${fieldArrayName}.${fieldIndex}.otpConfig.consent.subTitle`}
                          control={control}
                          render={({ field }: { field: any }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="Consent Subtitle"
                              size="small"
                              placeholder="e.g., We will send an OTP to verify your mobile number"
                            />
                          )}
                        />
                      </Grid>

                      <Grid item xs={12}>
                        <Controller
                          name={`${fieldArrayName}.${fieldIndex}.otpConfig.consent.message`}
                          control={control}
                          render={({ field }: { field: any }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="Consent Message"
                              multiline
                              rows={2}
                              size="small"
                              placeholder="e.g., By continuing, you consent to receive OTP."
                            />
                          )}
                        />
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <Controller
                          name={`${fieldArrayName}.${fieldIndex}.otpConfig.consent.positiveButtonText`}
                          control={control}
                          render={({ field }: { field: any }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="Positive Button Text"
                              size="small"
                              placeholder="e.g., Agree & Continue"
                            />
                          )}
                        />
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <Controller
                          name={`${fieldArrayName}.${fieldIndex}.otpConfig.consent.negativeButtonText`}
                          control={control}
                          render={({ field }: { field: any }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="Negative Button Text"
                              size="small"
                              placeholder="e.g., Cancel"
                            />
                          )}
                        />
                      </Grid>

                      {/* API Configuration for OTP */}
                      <Grid item xs={12}>
                        <Typography variant="caption" fontWeight={600} color="secondary" sx={{ mt: 2 }}>
                          API Configuration
                        </Typography>
                        <Divider sx={{ marginTop: 0.5, marginBottom: 1.5 }} />
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <Controller
                          name={`${fieldArrayName}.${fieldIndex}.otpConfig.api.sendOtp.endpoint`}
                          control={control}
                          render={({ field }: { field: any }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="Send OTP Endpoint"
                              required
                              size="small"
                              placeholder="/api/otp/send"
                            />
                          )}
                        />
                      </Grid>

                      <Grid item xs={12} md={3}>
                        <Controller
                          name={`${fieldArrayName}.${fieldIndex}.otpConfig.api.sendOtp.method`}
                          control={control}
                          render={({ field }: { field: any }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="Method"
                              select
                              size="small"
                            >
                              {HTTP_METHODS.map((method) => (
                                <MenuItem key={method.value} value={method.value}>
                                  {method.label}
                                </MenuItem>
                              ))}
                            </TextField>
                          )}
                        />
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <Controller
                          name={`${fieldArrayName}.${fieldIndex}.otpConfig.api.verifyOtp.endpoint`}
                          control={control}
                          render={({ field }: { field: any }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="Verify OTP Endpoint"
                              required
                              size="small"
                              placeholder="/api/otp/verify"
                            />
                          )}
                        />
                      </Grid>

                      <Grid item xs={12} md={3}>
                        <Controller
                          name={`${fieldArrayName}.${fieldIndex}.otpConfig.api.verifyOtp.method`}
                          control={control}
                          render={({ field }: { field: any }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="Method"
                              select
                              size="small"
                            >
                              {HTTP_METHODS.map((method) => (
                                <MenuItem key={method.value} value={method.value}>
                                  {method.label}
                                </MenuItem>
                              ))}
                            </TextField>
                          )}
                        />
                      </Grid>
                    </>
                  )}

                  {/* API Verification Configuration */}
                  {hasApiVerificationConfig && (
                    <>
                  <Grid item xs={12}>
                    <Typography
                      variant="caption"
                      fontWeight={600}
                          color="primary"
                    >
                          API Verification Configuration
                    </Typography>
                    <Divider sx={{ marginTop: 0.5, marginBottom: 1.5 }} />
                  </Grid>

                      <Grid item xs={12} md={6}>
                    <Controller
                          name={`${fieldArrayName}.${fieldIndex}.apiVerificationConfig.endpoint`}
                          control={control}
                          render={({ field }: { field: any }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="Verification API Endpoint"
                              required
                              size="small"
                              placeholder="/api/verification/pan"
                              helperText="API endpoint for verification"
                            />
                          )}
                        />
                      </Grid>

                      <Grid item xs={12} md={3}>
                        <Controller
                          name={`${fieldArrayName}.${fieldIndex}.apiVerificationConfig.method`}
                          control={control}
                          render={({ field }: { field: any }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="HTTP Method"
                              select
                              required
                              size="small"
                            >
                              {HTTP_METHODS.map((method) => (
                                <MenuItem key={method.value} value={method.value}>
                                  {method.label}
                                </MenuItem>
                              ))}
                            </TextField>
                          )}
                        />
                      </Grid>

                      <Grid item xs={12} md={3}>
                        <Controller
                          name={`${fieldArrayName}.${fieldIndex}.apiVerificationConfig.linkedFieldId`}
                      control={control}
                      render={({ field }: { field: any }) => {
                        const availableFields = getAllFieldIds();
                        return (
                          <TextField
                            {...field}
                            fullWidth
                                label="Linked Field ID (Optional)"
                            select
                            size="small"
                                helperText="Field to verify"
                          >
                            <MenuItem value="">
                              <em>None</em>
                            </MenuItem>
                            {availableFields.map((f: { value: string; label: string }) => (
                              <MenuItem key={f.value} value={f.value}>
                                {f.label}
                              </MenuItem>
                            ))}
                          </TextField>
                        );
                      }}
                    />
                  </Grid>

                      <Grid item xs={12}>
                        <Typography variant="caption" fontWeight={600} color="secondary" sx={{ mt: 2 }}>
                          Text Input Properties
                        </Typography>
                        <Divider sx={{ marginTop: 0.5, marginBottom: 1.5 }} />
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <Controller
                          name={`${fieldArrayName}.${fieldIndex}.apiVerificationConfig.minLength`}
                          control={control}
                          render={({ field }: { field: any }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="Min Length"
                              type="number"
                              size="small"
                              placeholder="Optional"
                              helperText="Minimum input length"
                            />
                          )}
                        />
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <Controller
                          name={`${fieldArrayName}.${fieldIndex}.apiVerificationConfig.maxLength`}
                          control={control}
                          render={({ field }: { field: any }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="Max Length"
                              type="number"
                              size="small"
                              placeholder="Optional"
                              helperText="Maximum input length"
                            />
                          )}
                        />
                      </Grid>

                      <Grid item xs={12}>
                        <Typography variant="caption" fontWeight={600} color="secondary" sx={{ mt: 2 }}>
                          Request Mapping (Optional)
                        </Typography>
                        <Divider sx={{ marginTop: 0.5, marginBottom: 1.5 }} />
                      </Grid>

                      <Grid item xs={12}>
                        <Controller
                          name={`${fieldArrayName}.${fieldIndex}.apiVerificationConfig.requestMapping`}
                          control={control}
                          render={({ field }: { field: any }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="Request Mapping (JSON)"
                              multiline
                              rows={3}
                              size="small"
                              placeholder='{"value": "{{value}}"}'
                              helperText="JSON object mapping field values to API request"
                            />
                          )}
                        />
                      </Grid>

                      <Grid item xs={12}>
                        <Typography variant="caption" fontWeight={600} color="secondary" sx={{ mt: 2 }}>
                          Success Condition (Optional)
                        </Typography>
                        <Divider sx={{ marginTop: 0.5, marginBottom: 1.5 }} />
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <Controller
                          name={`${fieldArrayName}.${fieldIndex}.apiVerificationConfig.successCondition.field`}
                          control={control}
                          render={({ field }: { field: any }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="Response Field"
                              size="small"
                              placeholder="e.g., status"
                              helperText="Field name in API response"
                            />
                          )}
                        />
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <Controller
                          name={`${fieldArrayName}.${fieldIndex}.apiVerificationConfig.successCondition.equals`}
                          control={control}
                          render={({ field }: { field: any }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="Expected Value"
                              size="small"
                              placeholder="e.g., VERIFIED"
                              helperText="Value that indicates success"
                            />
                          )}
                        />
                      </Grid>

                      <Grid item xs={12}>
                        <Typography variant="caption" fontWeight={600} color="secondary" sx={{ mt: 2 }}>
                          Verification Messages
                        </Typography>
                        <Divider sx={{ marginTop: 0.5, marginBottom: 1.5 }} />
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <Controller
                          name={`${fieldArrayName}.${fieldIndex}.apiVerificationConfig.messages.success`}
                          control={control}
                          render={({ field }: { field: any }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="Success Message"
                              size="small"
                              placeholder="e.g., Verification successful"
                              helperText="Message shown on successful verification"
                            />
                          )}
                        />
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <Controller
                          name={`${fieldArrayName}.${fieldIndex}.apiVerificationConfig.messages.failure`}
                          control={control}
                          render={({ field }: { field: any }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="Failure Message"
                              size="small"
                              placeholder="e.g., Verification failed"
                              helperText="Message shown on failed verification"
                            />
                          )}
                        />
                      </Grid>

                      <Grid item xs={12}>
                        <FormControlLabel
                          control={
                            <Controller
                              name={`${fieldArrayName}.${fieldIndex}.apiVerificationConfig.showDialog`}
                              control={control}
                              render={({ field }: { field: any }) => (
                                <Checkbox {...field} checked={field.value || false} />
                              )}
                            />
                          }
                          label="Show Success/Failure Messages in Dialog"
                        />
                      </Grid>
                    </>
                  )}

                  {/* Verified Input Configuration */}
                  {hasVerifiedInputConfig && (
                    <>
                      <Grid item xs={12}>
                        <Typography
                          variant="caption"
                          fontWeight={600}
                          color="primary"
                        >
                          Input Configuration
                        </Typography>
                        <Divider sx={{ marginTop: 0.5, marginBottom: 1.5 }} />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Controller
                          name={`${fieldArrayName}.${fieldIndex}.verifiedInputConfig.input.dataType`}
                      control={control}
                      render={({ field }: { field: any }) => (
                        <TextField
                          {...field}
                          fullWidth
                              label="Data Type"
                          select
                              required
                          size="small"
                        >
                              {INPUT_DATA_TYPES.map((type) => (
                                <MenuItem key={type.value} value={type.value}>
                                  {type.label}
                            </MenuItem>
                          ))}
                        </TextField>
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Controller
                          name={`${fieldArrayName}.${fieldIndex}.verifiedInputConfig.input.keyboard`}
                      control={control}
                          render={({ field }: { field: any }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="Keyboard Type"
                              select
                              size="small"
                            >
                              {INPUT_KEYBOARD_TYPES.map((type) => (
                                <MenuItem key={type.value} value={type.value}>
                                  {type.label}
                                </MenuItem>
                              ))}
                            </TextField>
                          )}
                        />
                      </Grid>

                      <Grid item xs={12} md={4}>
                        <Controller
                          name={`${fieldArrayName}.${fieldIndex}.verifiedInputConfig.input.minLength`}
                          control={control}
                          render={({ field }: { field: any }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="Min Length"
                              type="number"
                              size="small"
                              placeholder="Optional"
                              helperText="Minimum input length"
                            />
                          )}
                        />
                      </Grid>

                      <Grid item xs={12} md={4}>
                        <Controller
                          name={`${fieldArrayName}.${fieldIndex}.verifiedInputConfig.input.maxLength`}
                          control={control}
                          render={({ field }: { field: any }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="Max Length"
                              type="number"
                              size="small"
                              placeholder="Optional"
                              helperText="Maximum input length"
                            />
                          )}
                        />
                      </Grid>

                      {watch(`${fieldArrayName}.${fieldIndex}.verifiedInputConfig.input.dataType`) === 'NUMBER' && (
                        <>
                          <Grid item xs={12} md={4}>
                            <Controller
                              name={`${fieldArrayName}.${fieldIndex}.verifiedInputConfig.input.min`}
                              control={control}
                              render={({ field }: { field: any }) => (
                                <TextField
                                  {...field}
                                  fullWidth
                                  label="Min Value"
                                  type="number"
                                  size="small"
                                />
                              )}
                            />
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <Controller
                              name={`${fieldArrayName}.${fieldIndex}.verifiedInputConfig.input.max`}
                              control={control}
                              render={({ field }: { field: any }) => (
                                <TextField
                                  {...field}
                                  fullWidth
                                  label="Max Value"
                                  type="number"
                                  size="small"
                                />
                              )}
                            />
                          </Grid>
                        </>
                      )}

                      <Grid item xs={12}>
                        <Typography
                          variant="caption"
                          fontWeight={600}
                          color="primary"
                          sx={{ mt: 2 }}
                        >
                          Verification Configuration
                        </Typography>
                        <Divider sx={{ marginTop: 0.5, marginBottom: 1.5 }} />
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <Controller
                          name={`${fieldArrayName}.${fieldIndex}.verifiedInputConfig.verification.mode`}
                          control={control}
                          render={({ field }: { field: any }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="Verification Mode"
                              select
                              required
                              size="small"
                            >
                              {VERIFICATION_MODES.map((mode) => (
                                <MenuItem key={mode.value} value={mode.value}>
                                  {mode.label}
                                </MenuItem>
                              ))}
                            </TextField>
                          )}
                        />
                      </Grid>

                      {/* OTP Verification Mode */}
                      {verificationMode === 'OTP' && (
                        <>
                          <Grid item xs={12} md={4}>
                            <Controller
                              name={`${fieldArrayName}.${fieldIndex}.verifiedInputConfig.verification.otp.channel`}
                              control={control}
                              render={({ field }: { field: any }) => (
                          <TextField
                            {...field}
                            fullWidth
                                  label="OTP Channel"
                                  select
                                  required
                            size="small"
                                >
                                  {OTP_CHANNELS.map((channel) => (
                                    <MenuItem key={channel.value} value={channel.value}>
                                      {channel.label}
                                    </MenuItem>
                                  ))}
                                </TextField>
                              )}
                            />
                          </Grid>

                          <Grid item xs={12} md={4}>
                            <Controller
                              name={`${fieldArrayName}.${fieldIndex}.verifiedInputConfig.verification.otp.otpLength`}
                              control={control}
                              render={({ field }: { field: any }) => (
                                <TextField
                                  {...field}
                                  fullWidth
                                  label="OTP Length"
                                  type="number"
                                  required
                                  size="small"
                                  inputProps={{ min: 4, max: 8 }}
                                />
                              )}
                            />
                          </Grid>

                          <Grid item xs={12} md={4}>
                            <Controller
                              name={`${fieldArrayName}.${fieldIndex}.verifiedInputConfig.verification.otp.resendIntervalSeconds`}
                              control={control}
                              render={({ field }: { field: any }) => (
                                <TextField
                                  {...field}
                                  fullWidth
                                  label="Resend Interval (seconds)"
                                  type="number"
                                  size="small"
                                  inputProps={{ min: 10 }}
                                />
                              )}
                            />
                          </Grid>

                          {/* Consent UI for OTP */}
                          <Grid item xs={12}>
                            <Typography variant="caption" fontWeight={600} color="secondary" sx={{ mt: 2 }}>
                              Consent UI (Optional)
                            </Typography>
                            <Divider sx={{ marginTop: 0.5, marginBottom: 1.5 }} />
                          </Grid>

                          <Grid item xs={12} md={6}>
                            <Controller
                              name={`${fieldArrayName}.${fieldIndex}.verifiedInputConfig.verification.otp.consent.title`}
                              control={control}
                              render={({ field }: { field: any }) => (
                                <TextField
                                  {...field}
                                  fullWidth
                                  label="Consent Title"
                                  size="small"
                                  placeholder="e.g., Mobile Number Verification"
                                />
                              )}
                            />
                          </Grid>

                          <Grid item xs={12} md={6}>
                            <Controller
                              name={`${fieldArrayName}.${fieldIndex}.verifiedInputConfig.verification.otp.consent.subTitle`}
                              control={control}
                              render={({ field }: { field: any }) => (
                                <TextField
                                  {...field}
                                  fullWidth
                                  label="Consent Subtitle"
                                  size="small"
                                  placeholder="e.g., We will send an OTP to verify your mobile number"
                                />
                              )}
                            />
                          </Grid>

                          <Grid item xs={12}>
                            <Controller
                              name={`${fieldArrayName}.${fieldIndex}.verifiedInputConfig.verification.otp.consent.message`}
                              control={control}
                              render={({ field }: { field: any }) => (
                                <TextField
                                  {...field}
                                  fullWidth
                                  label="Consent Message"
                                  multiline
                                  rows={2}
                                  size="small"
                                  placeholder="e.g., By continuing, you consent to receive OTP."
                                />
                              )}
                            />
                          </Grid>

                          <Grid item xs={12} md={6}>
                            <Controller
                              name={`${fieldArrayName}.${fieldIndex}.verifiedInputConfig.verification.otp.consent.positiveButtonText`}
                              control={control}
                              render={({ field }: { field: any }) => (
                                <TextField
                                  {...field}
                                  fullWidth
                                  label="Positive Button Text"
                                  size="small"
                                  placeholder="e.g., Agree & Continue"
                                />
                              )}
                            />
                          </Grid>

                          <Grid item xs={12} md={6}>
                            <Controller
                              name={`${fieldArrayName}.${fieldIndex}.verifiedInputConfig.verification.otp.consent.negativeButtonText`}
                              control={control}
                              render={({ field }: { field: any }) => (
                                <TextField
                                  {...field}
                                  fullWidth
                                  label="Negative Button Text"
                                  size="small"
                                  placeholder="e.g., Cancel"
                                />
                              )}
                            />
                          </Grid>

                          {/* OTP API Configuration */}
                          <Grid item xs={12}>
                            <Typography variant="caption" fontWeight={600} color="secondary" sx={{ mt: 2 }}>
                              OTP API Configuration
                            </Typography>
                            <Divider sx={{ marginTop: 0.5, marginBottom: 1.5 }} />
                          </Grid>

                          <Grid item xs={12} md={6}>
                            <Controller
                              name={`${fieldArrayName}.${fieldIndex}.verifiedInputConfig.verification.otp.api.sendOtp.endpoint`}
                              control={control}
                              render={({ field }: { field: any }) => (
                                <TextField
                                  {...field}
                                  fullWidth
                                  label="Send OTP Endpoint"
                                  required
                                  size="small"
                                  placeholder="/api/otp/send"
                                />
                              )}
                            />
                          </Grid>

                          <Grid item xs={12} md={3}>
                            <Controller
                              name={`${fieldArrayName}.${fieldIndex}.verifiedInputConfig.verification.otp.api.sendOtp.method`}
                              control={control}
                              render={({ field }: { field: any }) => (
                                <TextField
                                  {...field}
                                  fullWidth
                                  label="Method"
                                  select
                                  size="small"
                                >
                                  {HTTP_METHODS.map((method) => (
                                    <MenuItem key={method.value} value={method.value}>
                                      {method.label}
                                    </MenuItem>
                                  ))}
                                </TextField>
                              )}
                            />
                          </Grid>

                          <Grid item xs={12} md={6}>
                            <Controller
                              name={`${fieldArrayName}.${fieldIndex}.verifiedInputConfig.verification.otp.api.verifyOtp.endpoint`}
                              control={control}
                              render={({ field }: { field: any }) => (
                                <TextField
                                  {...field}
                                  fullWidth
                                  label="Verify OTP Endpoint"
                                  required
                                  size="small"
                                  placeholder="/api/otp/verify"
                                />
                              )}
                            />
                          </Grid>

                          <Grid item xs={12} md={3}>
                            <Controller
                              name={`${fieldArrayName}.${fieldIndex}.verifiedInputConfig.verification.otp.api.verifyOtp.method`}
                              control={control}
                              render={({ field }: { field: any }) => (
                                <TextField
                                  {...field}
                                  fullWidth
                                  label="Method"
                                  select
                                  size="small"
                                >
                                  {HTTP_METHODS.map((method) => (
                                    <MenuItem key={method.value} value={method.value}>
                                      {method.label}
                                    </MenuItem>
                                  ))}
                                </TextField>
                              )}
                            />
                          </Grid>
                        </>
                      )}

                      {/* API Verification Mode */}
                      {verificationMode === 'API' && (
                        <>
                          <Grid item xs={12} md={6}>
                            <Controller
                              name={`${fieldArrayName}.${fieldIndex}.verifiedInputConfig.verification.api.endpoint`}
                              control={control}
                              render={({ field }: { field: any }) => (
                                <TextField
                                  {...field}
                                  fullWidth
                                  label="Verification API Endpoint"
                                  required
                                  size="small"
                                  placeholder="/api/verification/pan"
                                />
                              )}
                            />
                          </Grid>

                          <Grid item xs={12} md={3}>
                            <Controller
                              name={`${fieldArrayName}.${fieldIndex}.verifiedInputConfig.verification.api.method`}
                              control={control}
                              render={({ field }: { field: any }) => (
                                <TextField
                                  {...field}
                                  fullWidth
                                  label="Method"
                                  select
                                  size="small"
                                >
                                  {HTTP_METHODS.map((method) => (
                                    <MenuItem key={method.value} value={method.value}>
                                      {method.label}
                                    </MenuItem>
                                  ))}
                                </TextField>
                              )}
                            />
                          </Grid>

                          <Grid item xs={12}>
                            <Typography variant="caption" fontWeight={600} color="secondary" sx={{ mt: 2 }}>
                              Request Mapping (Optional)
                            </Typography>
                            <Divider sx={{ marginTop: 0.5, marginBottom: 1.5 }} />
                          </Grid>

                          <Grid item xs={12}>
                            <Controller
                              name={`${fieldArrayName}.${fieldIndex}.verifiedInputConfig.verification.api.requestMapping`}
                              control={control}
                              render={({ field }: { field: any }) => (
                                <TextField
                                  {...field}
                                  fullWidth
                                  label="Request Mapping (JSON)"
                                  multiline
                                  rows={3}
                                  size="small"
                                  placeholder='{"value": "{{value}}"}'
                                  helperText="JSON object mapping field values to API request"
                                />
                              )}
                            />
                          </Grid>

                          <Grid item xs={12}>
                            <Typography variant="caption" fontWeight={600} color="secondary" sx={{ mt: 2 }}>
                              Success Condition (Optional)
                            </Typography>
                            <Divider sx={{ marginTop: 0.5, marginBottom: 1.5 }} />
                          </Grid>

                          <Grid item xs={12} md={4}>
                            <Controller
                              name={`${fieldArrayName}.${fieldIndex}.verifiedInputConfig.verification.api.successCondition.field`}
                              control={control}
                              render={({ field }: { field: any }) => (
                                <TextField
                                  {...field}
                                  fullWidth
                                  label="Response Field"
                                  size="small"
                                  placeholder="e.g., status"
                                />
                              )}
                            />
                          </Grid>

                          <Grid item xs={12} md={4}>
                            <Controller
                              name={`${fieldArrayName}.${fieldIndex}.verifiedInputConfig.verification.api.successCondition.equals`}
                              control={control}
                              render={({ field }: { field: any }) => (
                                <TextField
                                  {...field}
                                  fullWidth
                                  label="Expected Value"
                                  size="small"
                                  placeholder="e.g., VERIFIED"
                                />
                              )}
                            />
                          </Grid>
                        </>
                      )}

                      {/* Verification Messages */}
                      <Grid item xs={12}>
                        <Typography variant="caption" fontWeight={600} color="secondary" sx={{ mt: 2 }}>
                          Verification Messages (Optional)
                        </Typography>
                        <Divider sx={{ marginTop: 0.5, marginBottom: 1.5 }} />
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <Controller
                          name={`${fieldArrayName}.${fieldIndex}.verifiedInputConfig.verification.messages.success`}
                          control={control}
                          render={({ field }: { field: any }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="Success Message"
                              size="small"
                              placeholder="e.g., Verification successful"
                            />
                          )}
                        />
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <Controller
                          name={`${fieldArrayName}.${fieldIndex}.verifiedInputConfig.verification.messages.failure`}
                          control={control}
                          render={({ field }: { field: any }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="Failure Message"
                              size="small"
                              placeholder="e.g., Verification failed"
                            />
                          )}
                        />
                      </Grid>

                      <Grid item xs={12}>
                        <FormControlLabel
                          control={
                            <Controller
                              name={`${fieldArrayName}.${fieldIndex}.verifiedInputConfig.verification.showDialog`}
                              control={control}
                              render={({ field }: { field: any }) => (
                                <Checkbox {...field} checked={field.value || false} />
                              )}
                            />
                          }
                          label="Show Success/Failure Messages in Dialog"
                        />
                      </Grid>
                    </>
                  )}

                  {/* Conditional Logic */}
                  <Grid item xs={12}>
                    <Typography
                      variant="caption"
                      fontWeight={600}
                      color="secondary"
                    >
                      Visibility Condition (Optional)
                    </Typography>
                    <Divider sx={{ marginTop: 0.5, marginBottom: 1.5 }} />
                    <FieldConditionBuilder
                      control={control}
                      watch={watch}
                      fieldArrayName={fieldArrayName}
                      fieldIndex={fieldIndex}
                      conditionType="visibleWhen"
                      getAllFieldIds={getAllFieldIds}
                    />
                  </Grid>

                  {/* Enabled When */}
                  <Grid item xs={12}>
                    <Typography
                      variant="caption"
                      fontWeight={600}
                      color="secondary"
                      sx={{ mt: 2 }}
                    >
                      Enabled Condition (Optional)
                    </Typography>
                    <Divider sx={{ marginTop: 0.5, marginBottom: 1.5 }} />
                    <FieldConditionBuilder
                      control={control}
                      watch={watch}
                      fieldArrayName={fieldArrayName}
                      fieldIndex={fieldIndex}
                      conditionType="enabledWhen"
                      getAllFieldIds={getAllFieldIds}
                    />
                  </Grid>

                  {/* Required When */}
                  <Grid item xs={12}>
                    <Typography
                      variant="caption"
                      fontWeight={600}
                      color="secondary"
                      sx={{ mt: 2 }}
                    >
                      Required Condition (Optional)
                    </Typography>
                    <Divider sx={{ marginTop: 0.5, marginBottom: 1.5 }} />
                    <FieldConditionBuilder
                      control={control}
                      watch={watch}
                      fieldArrayName={fieldArrayName}
                      fieldIndex={fieldIndex}
                      conditionType="requiredWhen"
                      getAllFieldIds={getAllFieldIds}
                    />
                  </Grid>

                  {/* Actions */}
                  <Grid item xs={12}>
                    <Divider sx={{ marginY: 1 }} />
                    <Button
                      color="error"
                      startIcon={<Delete />}
                      onClick={() => removeField(fieldIndex)}
                      size="small"
                    >
                      Remove Field
                    </Button>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
                </SortableField>
          );
            })}
          </SortableContext>
        </DndContext>
      )}
    </Box>
  );
}
