'use client';

import React, { useState, useRef, useMemo } from 'react';
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
import { Control, Controller, useFieldArray, UseFormWatch, UseFormTrigger } from 'react-hook-form';
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
import {
  FIELD_TYPES,
  DATA_SOURCE_TYPES,
  KEYBOARD_TYPES,
  OTP_CHANNELS,
  OPERATORS,
} from '@/lib/constants';

// Component for static data input with local state
function StaticDataInput({ value, onChange }: { value: any[]; onChange: (value: any[]) => void }) {
  const [textValue, setTextValue] = React.useState(() => {
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
      label="Dropdown Options (Key:Value Pairs)"
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

  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  
  // Track _keys for fields that don't have them yet (for existing fields)
  const fieldKeysRef = useRef<Map<number, string>>(new Map());

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
          const hasFileConfig = currentFieldType === 'FILE_UPLOAD';
          const hasDateConfig = currentFieldType === 'DATE';
          const hasTextInput = ['TEXT', 'NUMBER', 'TEXTAREA'].includes(currentFieldType);
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
                          name={`${fieldArrayName}.${fieldIndex}.placeholder`}
                          control={control}
                          render={({ field }: { field: any }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="Placeholder"
                              size="small"
                              placeholder="e.g., Enter your email"
                            />
                          )}
                        />
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

                      {currentFieldType === 'TEXT' && (
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
                              />
                            )}
                          />
                        </Grid>
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

                  {/* Date Picker Configuration */}
                  {hasDateConfig && (
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
                          name={`${fieldArrayName}.${fieldIndex}.dateConfig.format`}
                          control={control}
                          render={({ field }: { field: any }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="Date Format"
                              select
                              size="small"
                              helperText="Format for displaying and parsing dates"
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
                              <MenuItem value="FUTURE_ONLY">Future Only</MenuItem>
                              <MenuItem value="PAST_ONLY">Past Only</MenuItem>
                              <MenuItem value="AGE_RANGE">Age Range</MenuItem>
                              <MenuItem value="DATE_RANGE">Date Range</MenuItem>
                              <MenuItem value="FROM_LAST_MONTH">From Last Month</MenuItem>
                            </TextField>
                          )}
                        />
                      </Grid>
                    </>
                  )}

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
                              size="small"
                              inputProps={{ min: 4, max: 8 }}
                            />
                          )}
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
                      Conditional Logic (Optional)
                    </Typography>
                    <Divider sx={{ marginTop: 0.5, marginBottom: 1.5 }} />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Controller
                      name={`${fieldArrayName}.${fieldIndex}.visibleWhen.field`}
                      control={control}
                      render={({ field }: { field: any }) => {
                        const availableFields = getAllFieldIds();
                        return (
                          <TextField
                            {...field}
                            fullWidth
                            label="Visible When Field"
                            select
                            size="small"
                            helperText="Select a field from this section"
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

                  <Grid item xs={12} md={4}>
                    <Controller
                      name={`${fieldArrayName}.${fieldIndex}.visibleWhen.operator`}
                      control={control}
                      render={({ field }: { field: any }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Operator"
                          select
                          size="small"
                        >
                          {OPERATORS.map((op) => (
                            <MenuItem key={op.value} value={op.value}>
                              {op.label}
                            </MenuItem>
                          ))}
                        </TextField>
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Controller
                      name={`${fieldArrayName}.${fieldIndex}.visibleWhen.value`}
                      control={control}
                      render={({ field }: { field: any }) => {
                        const selectedField = watch(
                          `${fieldArrayName}.${fieldIndex}.visibleWhen.field`
                        );
                        const allFields = watch(fieldArrayName) || [];
                        const parentField = allFields.find((f: any) => f.id === selectedField);
                        const isDropdown = parentField?.type === 'DROPDOWN' || parentField?.type === 'RADIO';
                        const hasStaticData = parentField?.dataSource?.type === 'STATIC_JSON';
                        const staticOptions = parentField?.dataSource?.staticData || [];

                        if (isDropdown && hasStaticData && staticOptions.length > 0) {
                          return (
                            <TextField
                              {...field}
                              fullWidth
                              label="Value"
                              select
                              size="small"
                              helperText="Select from parent field options"
                            >
                              {staticOptions.map((opt: any) => (
                                <MenuItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </MenuItem>
                              ))}
                            </TextField>
                          );
                        }

                        return (
                          <TextField
                            {...field}
                            fullWidth
                            label="Value"
                            size="small"
                            placeholder="expected_value"
                          />
                        );
                      }}
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
