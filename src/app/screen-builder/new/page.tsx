'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  MenuItem,
  Typography,
  Divider,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Alert,
  FormControlLabel,
  Checkbox,
  Switch,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Save,
  Cancel,
  Add,
  Delete,
  ExpandMore,
  DragIndicator,
  Visibility,
} from '@mui/icons-material';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import PageHeader from '@/components/shared/PageHeader';
import FieldBuilder from '@/components/screen-builder/FieldBuilder';
import JsonViewer from '@/components/shared/JsonViewer';
import { usePartners } from '@/hooks/use-master-data';
import { useCreateScreenConfig } from '@/hooks/use-screen-configs';
import toast from 'react-hot-toast';
import {
  LAYOUT_TYPES,
  FIELD_TYPES,
  HTTP_METHODS,
} from '@/lib/constants';
import { ScreenConfig, Section, SubSection, Field } from '@/types';
import {
  saveScreenConfig,
  getScreenConfigById,
  getScreenConfigByScreenId,
} from '@/lib/cache-storage';

// Validation schema
const screenConfigSchema = z.object({
  screenId: z.string().min(1, 'Screen ID is required').regex(/^[a-z][a-z0-9_]*$/, 'Screen ID must be snake_case (lowercase with underscores)'),
  screenName: z.string().min(1, 'Screen name is required'),
  title: z.string().min(1, 'Title is required'),
  partnerCode: z.string().min(1, 'Partner is required'),
  scopeType: z.enum(['PARTNER', 'BRANCH']),
  branchCode: z.string().optional(),
  layout: z.string().min(1, 'Layout is required'),
  sections: z.array(
    z.object({
      id: z.string(),
      title: z.string().min(1, 'Section title is required'),
      collapsible: z.boolean().optional(),
      defaultExpanded: z.boolean().optional(),
      hasSubSections: z.boolean().optional(),
      fields: z.array(z.any()).optional(),
      subSections: z.array(
        z.object({
          id: z.string(),
          title: z.string(),
          repeatable: z.boolean().optional(),
          minInstances: z.number().optional(),
          maxInstances: z.number().optional(),
          instanceLabel: z.string().optional(),
          fields: z.array(z.any()).optional(),
        })
      ).optional(),
    })
  ),
  actions: z.array(
    z.object({
      id: z.string(),
      label: z.string().min(1, 'Action label is required'),
      api: z.string().min(1, 'API endpoint is required'),
      method: z.string().min(1, 'HTTP method is required'),
      successMessage: z.string().optional(),
      failureMessage: z.string().optional(),
    })
  ),
});

type ScreenConfigFormData = z.infer<typeof screenConfigSchema>;

export default function NewScreenConfigPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams?.get('id');
  const cloneId = searchParams?.get('clone');
  const isEditMode = !!editId;
  const isCloneMode = !!cloneId;
  
  const { data: partners } = usePartners();
  const createConfig = useCreateScreenConfig();
  const [activeTab, setActiveTab] = useState(0);
  const [isLoading, setIsLoading] = useState(isEditMode || isCloneMode);
  const [completeConfig, setCompleteConfig] = useState<any>(null);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ScreenConfigFormData>({
    resolver: zodResolver(screenConfigSchema),
    defaultValues: {
      screenId: '',
      screenName: '',
      title: '',
      partnerCode: '',
      scopeType: 'PARTNER',
      layout: 'FORM',
      sections: [
        {
          id: 'section_1',
          title: 'Section 1',
          collapsible: false,
          defaultExpanded: true,
          hasSubSections: false,
          fields: [],
          subSections: [],
        },
      ],
      actions: [
        {
          id: 'action_1',
          label: 'Submit',
          api: '/api/submit',
          method: 'POST',
          successMessage: 'Submitted successfully',
          failureMessage: 'Failed to submit',
        },
      ],
    },
  });

  const {
    fields: sectionFields,
    append: appendSection,
    remove: removeSection,
  } = useFieldArray({
    control,
    name: 'sections',
  });

  const {
    fields: actionFields,
    append: appendAction,
    remove: removeAction,
  } = useFieldArray({
    control,
    name: 'actions',
  });

  // Load existing config in edit mode or clone mode
  useEffect(() => {
    const configIdToLoad = isEditMode ? editId : isCloneMode ? cloneId : null;
    
    if (configIdToLoad) {
      const existingConfig = getScreenConfigById(configIdToLoad);
      if (existingConfig) {
        console.log(isCloneMode ? '📋 Loading config for cloning:' : '📝 Loading existing config for edit:', existingConfig);
        
        // Populate form with existing data
        // For clone mode, generate new IDs
        setValue('screenId', isCloneMode ? `${existingConfig.screenId}_copy_${Date.now()}` : existingConfig.screenId);
        setValue('screenName', isCloneMode ? `${existingConfig.screenName} (Copy)` : existingConfig.screenName);
        setValue('title', existingConfig.config.title);
        setValue('partnerCode', existingConfig.config.scope?.partnerCode || '');
        setValue('branchCode', existingConfig.config.scope?.branchCode || '');
        setValue('scopeType', existingConfig.config.scope?.type || 'PARTNER');
        setValue('layout', existingConfig.config.ui?.layout || 'FORM');
        
        // Load sections
        if (existingConfig.config.ui?.sections) {
          setValue('sections', existingConfig.config.ui.sections.map((section: any) => ({
            ...section,
            hasSubSections: !!section.subSections,
          })));
        }
        
        // Load actions
        if (existingConfig.config.ui?.actions) {
          setValue('actions', existingConfig.config.ui.actions);
        }
        
        toast.success(isCloneMode ? 'Configuration loaded for cloning' : 'Configuration loaded for editing');
      } else {
        toast.error('Configuration not found');
        router.push('/screen-builder');
      }
      setIsLoading(false);
    }
  }, [isEditMode, isCloneMode, editId, cloneId, setValue, router]);

  // Update complete config for preview (including validations from saved config)
  const screenId = watch('screenId');
  
  useEffect(() => {
    const subscription = watch((formData) => {
      // Build complete config including validations
      let complete: any = {
        screenId: formData.screenId,
        screenName: formData.screenName,
        title: formData.title,
        partnerCode: formData.partnerCode,
        scopeType: formData.scopeType,
        layout: formData.layout,
        sections: formData.sections,
        actions: formData.actions,
        branchCode: formData.branchCode,
      };
      
      // If screen exists in cache, load its validations
      if (formData.screenId) {
        const savedConfig = getScreenConfigByScreenId(formData.screenId as string);
        if (savedConfig && savedConfig.config.validations) {
          complete.validations = savedConfig.config.validations;
        }
      }
      
      setCompleteConfig(complete);
    });
    
    return () => subscription.unsubscribe();
  }, [watch]);

  const scrollToField = (fieldName: string) => {
    console.log('🎯 Scrolling to field:', fieldName);
    
    let targetElement: HTMLElement | null = null;
    
    // Try different selectors to find the field
    // 1. Try by name attribute
    targetElement = document.querySelector(`[name="${fieldName}"]`) as HTMLElement;
    
    // 2. Try by data-field-id in input
    if (!targetElement) {
      const input = document.querySelector(`input[data-field-id="${fieldName}"]`) as HTMLElement;
      if (input) {
        targetElement = input.closest('.MuiFormControl-root') as HTMLElement;
      }
    }
    
    // 3. For section fields, try to find the accordion
    if (!targetElement && fieldName.includes('sections.')) {
      const parts = fieldName.split('.');
      const sectionIndex = parseInt(parts[1]);
      const accordions = document.querySelectorAll('.MuiAccordion-root');
      
      if (accordions[sectionIndex]) {
        targetElement = accordions[sectionIndex] as HTMLElement;
      }
    }
    
    // 4. Try finding by ID pattern (for basic fields)
    if (!targetElement) {
      // Map field names to possible container IDs
      const fieldContainers = document.querySelectorAll('.MuiFormControl-root, .MuiCard-root');
      fieldContainers.forEach((container) => {
        const input = container.querySelector('input, textarea, select');
        if (input && input.getAttribute('name') === fieldName) {
          targetElement = container as HTMLElement;
        }
      });
    }
    
    if (targetElement) {
      console.log('✅ Found element:', targetElement);
      
      // Scroll to the element
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Find the best parent to highlight
      let highlightElement: HTMLElement | null = null;
      
      // Try to find the form control first
      highlightElement = targetElement.closest('.MuiFormControl-root') as HTMLElement;
      
      // If not found, try other containers
      if (!highlightElement) {
        highlightElement = targetElement.closest('.MuiAccordion-root, .MuiCard-root, .MuiPaper-root') as HTMLElement;
      }
      
      // If still not found, use the target element itself
      if (!highlightElement) {
        highlightElement = targetElement;
      }
      
      console.log('🎨 Highlighting element:', highlightElement);
      
      // Add the error highlight class
      if (highlightElement) {
        // Remove any existing error-highlight classes and styles first
        document.querySelectorAll('.error-highlight').forEach(el => {
          el.classList.remove('error-highlight');
          (el as HTMLElement).style.removeProperty('border');
          (el as HTMLElement).style.removeProperty('animation');
        });
        
        // Store original styles
        const originalBorder = highlightElement.style.border;
        const originalBackground = highlightElement.style.backgroundColor;
        
        // Add the class
        highlightElement.classList.add('error-highlight');
        
        // Also set inline styles as backup - FORCE RED COLOR
        highlightElement.style.border = '3px solid #d32f2f';
        highlightElement.style.backgroundColor = 'rgba(211, 47, 47, 0.05)';
        highlightElement.style.borderRadius = '8px';
        highlightElement.style.animation = 'errorPulse 0.8s ease-in-out 3';
        highlightElement.style.outline = '2px solid #d32f2f';
        highlightElement.style.outlineOffset = '2px';
        highlightElement.style.boxShadow = '0 0 20px rgba(211, 47, 47, 0.4)';
        
        // Force red on nested MUI elements
        const muiOutline = highlightElement.querySelector('.MuiOutlinedInput-notchedOutline') as HTMLElement;
        if (muiOutline) {
          muiOutline.style.borderColor = '#d32f2f';
          muiOutline.style.borderWidth = '3px';
        }
        
        const muiLabel = highlightElement.querySelector('.MuiInputLabel-root') as HTMLElement;
        if (muiLabel) {
          muiLabel.style.color = '#d32f2f';
          muiLabel.style.fontWeight = '600';
        }
        
        console.log('✨ Class and inline styles added, animation should start');
        console.log('🔴 RED COLOR FORCED on element');
        console.log('📊 Element classes:', highlightElement.className);
        console.log('📊 Element styles:', highlightElement.style.cssText);
        
        // Remove after 3 seconds
        setTimeout(() => {
          if (highlightElement) {
            highlightElement.classList.remove('error-highlight');
            highlightElement.style.border = originalBorder;
            highlightElement.style.backgroundColor = originalBackground;
            highlightElement.style.removeProperty('animation');
            highlightElement.style.removeProperty('border-radius');
            highlightElement.style.removeProperty('outline');
            highlightElement.style.removeProperty('outline-offset');
            highlightElement.style.removeProperty('box-shadow');
            
            // Reset nested elements
            const muiOutline = highlightElement.querySelector('.MuiOutlinedInput-notchedOutline') as HTMLElement;
            if (muiOutline) {
              muiOutline.style.removeProperty('border-color');
              muiOutline.style.removeProperty('border-width');
            }
            
            const muiLabel = highlightElement.querySelector('.MuiInputLabel-root') as HTMLElement;
            if (muiLabel) {
              muiLabel.style.removeProperty('color');
              muiLabel.style.removeProperty('font-weight');
            }
            
            console.log('🧹 Class and styles removed');
          }
        }, 3000);
      }
      
      // Focus the field if it's an input
      setTimeout(() => {
        const input = targetElement?.querySelector('input, textarea, select') as HTMLElement;
        if (input) {
          input.focus();
          console.log('🔍 Input focused');
        } else if (targetElement instanceof HTMLInputElement || targetElement instanceof HTMLTextAreaElement) {
          targetElement.focus();
          console.log('🔍 Target focused');
        }
      }, 500);
    } else {
      console.log('❌ Element not found, scrolling to top');
      // If specific field not found, scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const validateConfiguration = (data: ScreenConfigFormData): { errors: string[], firstErrorField: string | null } => {
    const errors: string[] = [];
    let firstErrorField: string | null = null;

    // Validate basic fields
    if (!data.screenId) {
      errors.push('Screen ID is required');
      if (!firstErrorField) firstErrorField = 'screenId';
    }
    if (!data.screenName) {
      errors.push('Screen Name is required');
      if (!firstErrorField) firstErrorField = 'screenName';
    }
    if (!data.title) {
      errors.push('Configuration Title is required');
      if (!firstErrorField) firstErrorField = 'title';
    }
    if (!data.partnerCode) {
      errors.push('Partner is required');
      if (!firstErrorField) firstErrorField = 'partnerCode';
    }
    if (!data.layout) {
      errors.push('Layout Type is required');
      if (!firstErrorField) firstErrorField = 'layout';
    }

    // Validate sections
    if (!data.sections || data.sections.length === 0) {
      errors.push('At least one section is required');
    } else {
      data.sections.forEach((section, sIndex) => {
        if (!section.title) {
          errors.push(`Section ${sIndex + 1}: Title is required`);
          if (!firstErrorField) firstErrorField = `sections.${sIndex}.title`;
        }

        // Check if section has fields or subsections
        const hasFields = section.fields && section.fields.length > 0;
        const hasSubSections = section.subSections && section.subSections.length > 0;

        if (!hasFields && !hasSubSections) {
          errors.push(`Section "${section.title}": Must have at least one field or subsection`);
        }

        // Validate fields
        if (hasFields) {
          section.fields?.forEach((field: any, fIndex) => {
            if (!field.id) {
              errors.push(`Section "${section.title}", Field ${fIndex + 1}: Field ID is required`);
              if (!firstErrorField) firstErrorField = `sections.${sIndex}.fields.${fIndex}.id`;
            }
            if (!field.label) {
              errors.push(`Section "${section.title}", Field ${fIndex + 1}: Field Label is required`);
              if (!firstErrorField) firstErrorField = `sections.${sIndex}.fields.${fIndex}.label`;
            }
            if (!field.type) {
              errors.push(`Section "${section.title}", Field ${fIndex + 1}: Field Type is required`);
              if (!firstErrorField) firstErrorField = `sections.${sIndex}.fields.${fIndex}.type`;
            }

            // Validate dropdown data source
            if ((field.type === 'DROPDOWN' || field.type === 'RADIO') && !field.dataSource?.type) {
              errors.push(`Section "${section.title}", Field "${field.label || field.id}": Data Source is required for dropdown/radio fields`);
              if (!firstErrorField) firstErrorField = `sections.${sIndex}.fields.${fIndex}.dataSource.type`;
            }

            // Validate static JSON has options
            if (field.dataSource?.type === 'STATIC_JSON' && (!field.dataSource?.staticData || field.dataSource.staticData.length === 0)) {
              errors.push(`Section "${section.title}", Field "${field.label || field.id}": Static JSON must have at least one option`);
              if (!firstErrorField) firstErrorField = `sections.${sIndex}.fields.${fIndex}.dataSource.staticData`;
            }

            // Validate file upload configuration
            if (field.type === 'FILE_UPLOAD') {
              if (!field.allowedFileTypes || field.allowedFileTypes.length === 0) {
                errors.push(`Section "${section.title}", Field "${field.label || field.id}": Allowed file types are required`);
                if (!firstErrorField) firstErrorField = `sections.${sIndex}.fields.${fIndex}.allowedFileTypes`;
              }
            }

            // Validate OTP configuration
            if (field.type === 'OTP_VERIFICATION') {
              if (!field.otpConfig?.channel) {
                errors.push(`Section "${section.title}", Field "${field.label || field.id}": OTP channel is required`);
                if (!firstErrorField) firstErrorField = `sections.${sIndex}.fields.${fIndex}.otpConfig.channel`;
              }
              if (!field.otpConfig?.linkedField) {
                errors.push(`Section "${section.title}", Field "${field.label || field.id}": Linked field is required for OTP`);
                if (!firstErrorField) firstErrorField = `sections.${sIndex}.fields.${fIndex}.otpConfig.linkedField`;
              }
            }
          });
        }

        // Validate subsections
        if (hasSubSections) {
          section.subSections?.forEach((subSection: any, ssIndex) => {
            if (!subSection.title) {
              errors.push(`Section "${section.title}", SubSection ${ssIndex + 1}: Title is required`);
              if (!firstErrorField) firstErrorField = `sections.${sIndex}.subSections.${ssIndex}.title`;
            }
            if (!subSection.fields || subSection.fields.length === 0) {
              errors.push(`Section "${section.title}", SubSection "${subSection.title}": Must have at least one field`);
            }
          });
        }
      });
    }

    // Validate actions
    if (!data.actions || data.actions.length === 0) {
      errors.push('At least one action is required');
    } else {
      data.actions.forEach((action, aIndex) => {
        if (!action.label) {
          errors.push(`Action ${aIndex + 1}: Label is required`);
          if (!firstErrorField) firstErrorField = `actions.${aIndex}.label`;
        }
        if (!action.api) {
          errors.push(`Action ${aIndex + 1}: API endpoint is required`);
          if (!firstErrorField) firstErrorField = `actions.${aIndex}.api`;
        }
        if (!action.method) {
          errors.push(`Action ${aIndex + 1}: HTTP method is required`);
          if (!firstErrorField) firstErrorField = `actions.${aIndex}.method`;
        }
      });
    }

    return { errors, firstErrorField };
  };

  const onSubmit = async (data: ScreenConfigFormData) => {
    try {
      // Validate configuration
      const { errors: validationErrors, firstErrorField } = validateConfiguration(data);
      
      if (validationErrors.length > 0) {
        // Switch to configuration tab if on preview
        setActiveTab(0);
        
        // Scroll to first error field after a short delay
        if (firstErrorField) {
          setTimeout(() => {
            scrollToField(firstErrorField);
          }, 300);
        }
        
        // Show validation errors
        toast.error(
          <Box>
            <Typography fontWeight={600} gutterBottom>
              Please fix the following errors:
            </Typography>
            <Box component="ul" sx={{ margin: 0, paddingLeft: 2, fontSize: '0.875rem' }}>
              {validationErrors.slice(0, 5).map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </Box>
            {validationErrors.length > 5 && (
              <Typography variant="caption" display="block" mt={1}>
                ... and {validationErrors.length - 5} more errors
              </Typography>
            )}
          </Box>,
          { duration: 8000 }
        );
        return;
      }

      // Build the config with proper structure
      const sections: Section[] = data.sections.map(section => {
        if (section.hasSubSections) {
          return {
            id: section.id,
            title: section.title,
            collapsible: section.collapsible,
            defaultExpanded: section.defaultExpanded,
            subSections: section.subSections as SubSection[],
          };
        } else {
          return {
            id: section.id,
            title: section.title,
            collapsible: section.collapsible,
            defaultExpanded: section.defaultExpanded,
            fields: section.fields as Field[],
          };
        }
      });

      // Get existing config to preserve validations
      const existingConfig = isEditMode && !isCloneMode ? getScreenConfigById(editId) : null;
      
      const config: Partial<ScreenConfig> & { validations?: any } = {
        screenId: data.screenId,
        title: data.title,
        version: 1,
        status: 'DRAFT',
        scope: {
          type: data.scopeType,
          partnerCode: data.partnerCode,
          branchCode: data.branchCode,
        },
        ui: {
          layout: data.layout as any,
          sections: sections,
          actions: data.actions as any[],
        },
        // Preserve existing validations if they exist
        validations: existingConfig?.config?.validations || undefined,
        metadata: {
          createdAt: existingConfig?.metadata?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: existingConfig?.metadata?.createdBy || 'current_user',
          updatedBy: 'current_user',
        },
      };

      // Save to cache storage (temporary until backend is ready)
      // For clone mode, always create a new ID (don't use editId)
      const savedConfig = saveScreenConfig({
        id: (isEditMode && !isCloneMode) ? editId : `screen_${Date.now()}`,
        screenId: data.screenId,
        screenName: data.screenName,
        version: existingConfig?.version || '1.0',
        status: 'DRAFT',
        config: config,
      });

      console.log('💾 Saved to cache:', savedConfig);
      
      toast.success(
        isEditMode && !isCloneMode
          ? 'Screen configuration updated successfully!' 
          : isCloneMode
          ? 'Screen configuration cloned successfully!'
          : 'Screen configuration created successfully!'
      );
      
      router.push('/screen-builder');
    } catch (error) {
      console.error('Failed to create config:', error);
      toast.error('Failed to save configuration. Please try again.');
    }
  };

  const handleCancel = () => {
    router.push('/screen-builder');
  };

  const handleAddSection = () => {
    appendSection({
      id: `section_${sectionFields.length + 1}`,
      title: `Section ${sectionFields.length + 1}`,
      collapsible: false,
      defaultExpanded: true,
      hasSubSections: false,
      fields: [],
      subSections: [],
    });
  };

  const handleAddAction = () => {
    appendAction({
      id: `action_${actionFields.length + 1}`,
      label: 'Action',
      api: '/api/action',
      method: 'POST',
      successMessage: '',
      failureMessage: '',
    });
  };

  const handleAddSubSection = (sectionIndex: number) => {
    const currentSubSections = watch(`sections.${sectionIndex}.subSections`) || [];
    setValue(`sections.${sectionIndex}.subSections`, [
      ...currentSubSections,
      {
        id: `subsection_${currentSubSections.length + 1}`,
        title: `Sub Section ${currentSubSections.length + 1}`,
        repeatable: false,
        minInstances: 1,
        maxInstances: 5,
        instanceLabel: 'Instance',
        fields: [],
      },
    ]);
  };

  const handleRemoveSubSection = (sectionIndex: number, subSectionIndex: number) => {
    const currentSubSections = watch(`sections.${sectionIndex}.subSections`) || [];
    setValue(
      `sections.${sectionIndex}.subSections`,
      currentSubSections.filter((_, idx) => idx !== subSectionIndex)
    );
  };

  const handleToggleSectionType = (sectionIndex: number) => {
    const hasSubSections = watch(`sections.${sectionIndex}.hasSubSections`);
    setValue(`sections.${sectionIndex}.hasSubSections`, !hasSubSections);
    
    // Clear fields when switching to subsections
    if (!hasSubSections) {
      setValue(`sections.${sectionIndex}.fields`, []);
      setValue(`sections.${sectionIndex}.subSections`, []);
    } else {
      setValue(`sections.${sectionIndex}.subSections`, []);
      setValue(`sections.${sectionIndex}.fields`, []);
    }
  };

  return (
    <ProtectedRoute requiresEdit>
      <DashboardLayout>
        <PageHeader
          title={
            isEditMode 
              ? 'Edit Screen Configuration' 
              : isCloneMode 
              ? 'Clone Screen Configuration' 
              : 'New Screen Configuration'
          }
          description="Define the UI structure and behavior for a screen"
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Screen Builder', href: '/screen-builder' },
            { 
              label: isEditMode 
                ? 'Edit Configuration' 
                : isCloneMode 
                ? 'Clone Configuration' 
                : 'New Configuration' 
            },
          ]}
        />

        {/* Tabs for Configuration and Preview */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', marginBottom: 3 }}>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
            <Tab label="Configuration" />
            <Tab label="JSON Preview" icon={<Visibility />} iconPosition="start" />
          </Tabs>
        </Box>

        <form onSubmit={handleSubmit(onSubmit)}>
          {activeTab === 0 && (
            <>
              <Card sx={{ marginBottom: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Basic Information
              </Typography>
              <Divider sx={{ marginBottom: 3 }} />

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="screenId"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Screen ID"
                        required
                        error={!!errors.screenId}
                        helperText={errors.screenId?.message || 'Use snake_case format (e.g., personal_details)'}
                        placeholder="e.g., personal_details, income_verification"
                        inputProps={{ 'aria-label': 'Screen ID', 'data-field-id': 'screenId' }}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Controller
                    name="screenName"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Screen Name"
                        required
                        error={!!errors.screenName}
                        helperText={errors.screenName?.message || 'User-friendly name for the screen'}
                        placeholder="e.g., Personal Details, Income Verification"
                        inputProps={{ 'aria-label': 'Screen Name', 'data-field-id': 'screenName' }}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Controller
                    name="title"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Configuration Title"
                        required
                        error={!!errors.title}
                        helperText={errors.title?.message}
                        inputProps={{ 'data-field-id': 'title', 'aria-label': 'Configuration Title' }}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Controller
                    name="partnerCode"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Partner"
                        select
                        required
                        error={!!errors.partnerCode}
                        helperText={errors.partnerCode?.message}
                        inputProps={{ 'aria-label': 'Partner', 'data-field-id': 'partnerCode' }}
                      >
                        {partners?.map((partner) => (
                          <MenuItem
                            key={partner.partnerCode}
                            value={partner.partnerCode}
                          >
                            {partner.partnerName}
                          </MenuItem>
                        ))}
                      </TextField>
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Controller
                    name="scopeType"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Scope Type"
                        select
                        required
                        inputProps={{ 'aria-label': 'Scope Type' }}
                      >
                        <MenuItem value="PARTNER">Partner</MenuItem>
                        <MenuItem value="BRANCH">Branch</MenuItem>
                      </TextField>
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Controller
                    name="layout"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Layout Type"
                        select
                        required
                        error={!!errors.layout}
                        helperText={errors.layout?.message}
                        inputProps={{ 'aria-label': 'Layout Type', 'data-field-id': 'layout' }}
                      >
                        {LAYOUT_TYPES.map((layout) => (
                          <MenuItem key={layout.value} value={layout.value}>
                            {layout.label}
                          </MenuItem>
                        ))}
                      </TextField>
                    )}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Sections */}
          <Card sx={{ marginBottom: 3 }}>
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 2,
                }}
              >
                <Typography variant="h6">Sections</Typography>
                <Button
                  startIcon={<Add />}
                  onClick={handleAddSection}
                  variant="outlined"
                >
                  Add Section
                </Button>
              </Box>

              {sectionFields.map((section, sectionIndex) => (
                <Accordion key={section.id} defaultExpanded sx={{ marginBottom: 2 }}>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        width: '100%',
                        gap: 1,
                      }}
                    >
                      <DragIndicator color="action" />
                      <Typography sx={{ flexGrow: 1 }}>
                        {watch(`sections.${sectionIndex}.title`) || `Section ${sectionIndex + 1}`}
                      </Typography>
                      {watch(`sections.${sectionIndex}.hasSubSections`) ? (
                        <Chip label={`${watch(`sections.${sectionIndex}.subSections`)?.length || 0} subsections`} size="small" color="secondary" />
                      ) : (
                        <Chip label={`${watch(`sections.${sectionIndex}.fields`)?.length || 0} fields`} size="small" />
                      )}
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <Controller
                          name={`sections.${sectionIndex}.title`}
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="Section Title"
                              required
                              size="small"
                              inputProps={{ 'aria-label': 'Section Title' }}
                            />
                          )}
                        />
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <FormControlLabel
                          control={
                            <Controller
                              name={`sections.${sectionIndex}.collapsible`}
                              control={control}
                              render={({ field }) => (
                                <Checkbox {...field} checked={field.value || false} />
                              )}
                            />
                          }
                          label="Collapsible"
                        />
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <FormControlLabel
                          control={
                            <Controller
                              name={`sections.${sectionIndex}.defaultExpanded`}
                              control={control}
                              render={({ field }) => (
                                <Checkbox {...field} checked={field.value || false} />
                              )}
                            />
                          }
                          label="Default Expanded"
                        />
                      </Grid>

                      <Grid item xs={12}>
                        <Divider />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, marginY: 2 }}>
                          <Typography variant="body2">
                            Section contains:
                          </Typography>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={watch(`sections.${sectionIndex}.hasSubSections`) || false}
                                onChange={() => handleToggleSectionType(sectionIndex)}
                              />
                            }
                            label={watch(`sections.${sectionIndex}.hasSubSections`) ? 'Sub-Sections' : 'Fields'}
                          />
                        </Box>
                        <Divider />
                      </Grid>

                      {/* Sub-Sections */}
                      {watch(`sections.${sectionIndex}.hasSubSections`) && (
                        <Grid item xs={12}>
                          <Box sx={{ marginTop: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                              <Typography variant="subtitle2">Sub-Sections</Typography>
                              <Button
                                size="small"
                                startIcon={<Add />}
                                onClick={() => handleAddSubSection(sectionIndex)}
                                variant="outlined"
                              >
                                Add Sub-Section
                              </Button>
                            </Box>

                            {watch(`sections.${sectionIndex}.subSections`)?.map((subSection: any, subIndex: number) => (
                              <Card key={subIndex} variant="outlined" sx={{ marginBottom: 2, padding: 2, backgroundColor: 'grey.50' }}>
                                <Grid container spacing={2}>
                                  <Grid item xs={12}>
                                    <Controller
                                      name={`sections.${sectionIndex}.subSections.${subIndex}.title`}
                                      control={control}
                                      render={({ field }) => (
                                        <TextField
                                          {...field}
                                          fullWidth
                                          label="Sub-Section Title"
                                          size="small"
                                          required
                                        />
                                      )}
                                    />
                                  </Grid>

                                  <Grid item xs={12} md={6}>
                                    <FormControlLabel
                                      control={
                                        <Controller
                                          name={`sections.${sectionIndex}.subSections.${subIndex}.repeatable`}
                                          control={control}
                                          render={({ field }) => (
                                            <Checkbox {...field} checked={field.value || false} />
                                          )}
                                        />
                                      }
                                      label="Repeatable"
                                    />
                                  </Grid>

                                  {watch(`sections.${sectionIndex}.subSections.${subIndex}.repeatable`) && (
                                    <>
                                      <Grid item xs={12} md={4}>
                                        <Controller
                                          name={`sections.${sectionIndex}.subSections.${subIndex}.minInstances`}
                                          control={control}
                                          render={({ field }) => (
                                            <TextField
                                              {...field}
                                              fullWidth
                                              label="Min Instances"
                                              type="number"
                                              size="small"
                                              inputProps={{ min: 1 }}
                                            />
                                          )}
                                        />
                                      </Grid>

                                      <Grid item xs={12} md={4}>
                                        <Controller
                                          name={`sections.${sectionIndex}.subSections.${subIndex}.maxInstances`}
                                          control={control}
                                          render={({ field }) => (
                                            <TextField
                                              {...field}
                                              fullWidth
                                              label="Max Instances"
                                              type="number"
                                              size="small"
                                              inputProps={{ min: 1 }}
                                            />
                                          )}
                                        />
                                      </Grid>

                                      <Grid item xs={12} md={4}>
                                        <Controller
                                          name={`sections.${sectionIndex}.subSections.${subIndex}.instanceLabel`}
                                          control={control}
                                          render={({ field }) => (
                                            <TextField
                                              {...field}
                                              fullWidth
                                              label="Instance Label"
                                              size="small"
                                              placeholder="e.g., Guarantor"
                                            />
                                          )}
                                        />
                                      </Grid>
                                    </>
                                  )}

                                  <Grid item xs={12}>
                                    <FieldBuilder
                                      control={control}
                                      watch={watch}
                                      sectionIndex={sectionIndex}
                                      subSectionIndex={subIndex}
                                      fieldArrayName={`sections.${sectionIndex}.subSections.${subIndex}.fields`}
                                    />
                                  </Grid>

                                  <Grid item xs={12}>
                                    <Button
                                      color="error"
                                      startIcon={<Delete />}
                                      onClick={() => handleRemoveSubSection(sectionIndex, subIndex)}
                                      size="small"
                                    >
                                      Remove Sub-Section
                                    </Button>
                                  </Grid>
                                </Grid>
                              </Card>
                            ))}

                            {(!watch(`sections.${sectionIndex}.subSections`) || watch(`sections.${sectionIndex}.subSections`)?.length === 0) && (
                              <Alert severity="info">
                                No sub-sections defined. Click &quot;Add Sub-Section&quot; to create one.
                              </Alert>
                            )}
                          </Box>
                        </Grid>
                      )}

                      {/* Fields (when not using sub-sections) */}
                      {!watch(`sections.${sectionIndex}.hasSubSections`) && (
                        <Grid item xs={12}>
                          <FieldBuilder
                            control={control}
                            watch={watch}
                            sectionIndex={sectionIndex}
                            fieldArrayName={`sections.${sectionIndex}.fields`}
                          />
                        </Grid>
                      )}

                      <Grid item xs={12}>
                        <Button
                          color="error"
                          startIcon={<Delete />}
                          onClick={() => removeSection(sectionIndex)}
                          disabled={sectionFields.length === 1}
                        >
                          Remove Section
                        </Button>
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              ))}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card sx={{ marginBottom: 3 }}>
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 2,
                }}
              >
                <Typography variant="h6">Actions</Typography>
                <Button
                  startIcon={<Add />}
                  onClick={handleAddAction}
                  variant="outlined"
                >
                  Add Action
                </Button>
              </Box>

              {actionFields.map((action, index) => (
                <Card key={action.id} variant="outlined" sx={{ marginBottom: 2 }}>
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Controller
                          name={`actions.${index}.label`}
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="Action Label"
                              required
                              size="small"
                              inputProps={{ 'aria-label': 'Action Label' }}
                            />
                          )}
                        />
                      </Grid>

                      <Grid item xs={12} md={3}>
                        <Controller
                          name={`actions.${index}.method`}
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="HTTP Method"
                              select
                              required
                              size="small"
                              inputProps={{ 'aria-label': 'HTTP Method' }}
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
                        <Button
                          fullWidth
                          color="error"
                          startIcon={<Delete />}
                          onClick={() => removeAction(index)}
                          disabled={actionFields.length === 1}
                        >
                          Remove
                        </Button>
                      </Grid>

                      <Grid item xs={12}>
                        <Controller
                          name={`actions.${index}.api`}
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="API Endpoint"
                              required
                              size="small"
                              placeholder="/api/endpoint"
                              inputProps={{ 'aria-label': 'API Endpoint' }}
                            />
                          )}
                        />
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <Controller
                          name={`actions.${index}.successMessage`}
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="Success Message"
                              size="small"
                              inputProps={{ 'aria-label': 'Success Message' }}
                            />
                          )}
                        />
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <Controller
                          name={`actions.${index}.failureMessage`}
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="Failure Message"
                              size="small"
                              inputProps={{ 'aria-label': 'Failure Message' }}
                            />
                          )}
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>

              {/* Form Actions */}
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  startIcon={<Cancel />}
                  onClick={handleCancel}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Visibility />}
                  onClick={() => setActiveTab(1)}
                >
                  Preview
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<Save />}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Save Configuration'}
                </Button>
              </Box>
            </>
          )}

          {activeTab === 1 && (
            <Box>
              {/* JSON Preview - Shows complete config including validations */}
              <JsonViewer
                data={completeConfig || watch()}
                title="Complete Configuration Preview (Including Validations)"
                filename={`${watch('screenId') || 'screen'}_config.json`}
              />

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', marginTop: 3 }}>
                <Button
                  variant="outlined"
                  onClick={() => setActiveTab(0)}
                >
                  Back to Configuration
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<Save />}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Save Configuration'}
                </Button>
              </Box>
            </Box>
          )}
        </form>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
