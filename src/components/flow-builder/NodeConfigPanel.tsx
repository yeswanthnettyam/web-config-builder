'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  TextField,
  MenuItem,
  Button,
  Typography,
  Divider,
  Paper,
  IconButton,
  Chip,
  Switch,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  ArrowForward,
  Close,
} from '@mui/icons-material';
import { FlowScreenConfig, ServiceCall, NavigationCondition } from '@/types';
import ServiceConfigModal from './ServiceConfigModal';
import ConditionBuilder from './ConditionBuilder';
import toast from 'react-hot-toast';

interface NodeConfigPanelProps {
  screen: FlowScreenConfig;
  availableScreens: Array<{ screenId: string; screenName: string }>;
  availableFields?: string[];
  availableServices?: string[];
  onChange: (screen: FlowScreenConfig) => void;
  onSave?: () => void; // Optional callback to close panel after save
}

export default function NodeConfigPanel({
  screen,
  availableScreens,
  availableFields = [],
  availableServices = [],
  onChange,
  onSave,
}: NodeConfigPanelProps) {
  // Use local state to track changes
  const [localScreen, setLocalScreen] = useState<FlowScreenConfig>({
    ...screen,
    conditions: screen.conditions || [],
  });
  const [editingService, setEditingService] = useState<{
    service: ServiceCall;
    type: 'preLoad' | 'onSubmit' | 'background';
    index: number;
  } | null>(null);
  const [editingCondition, setEditingCondition] = useState<NavigationCondition | null>(null);
  
  // Use ref to track if we have unsaved local conditions
  const hasLocalChangesRef = useRef(false);
  const localConditionsRef = useRef<NavigationCondition[]>(screen.conditions || []);

  // Update ref when localScreen conditions change
  useEffect(() => {
    if (localScreen.conditions && localScreen.conditions.length > 0) {
      localConditionsRef.current = localScreen.conditions;
      hasLocalChangesRef.current = true;
      console.log('📌 Local conditions ref updated:', localConditionsRef.current);
    }
  }, [localScreen.conditions]);

  // Update local state when screen prop changes, but preserve local conditions if they exist
  useEffect(() => {
    console.log('🔄 NodeConfigPanel: screen prop changed:', screen);
    console.log('🔄 NodeConfigPanel: screen.conditions:', screen.conditions);
    console.log('🔄 NodeConfigPanel: current localScreen.conditions:', localScreen.conditions);
    console.log('🔄 NodeConfigPanel: localConditionsRef.current:', localConditionsRef.current);
    console.log('🔄 NodeConfigPanel: hasLocalChangesRef.current:', hasLocalChangesRef.current);
    
    // Use a ref or comparison to determine if we should update
    // If localScreen has conditions and screen.conditions is empty, preserve local conditions
    const hasLocalConditions = (localScreen.conditions && localScreen.conditions.length > 0) || 
                                (localConditionsRef.current && localConditionsRef.current.length > 0);
    const hasScreenConditions = screen.conditions && screen.conditions.length > 0;
    
    // Only update if screen actually changed (by comparing screenId)
    // OR if screen has conditions that localScreen doesn't have
    const shouldUpdate = 
      screen.screenId !== localScreen.screenId ||
      (hasScreenConditions && !hasLocalConditions);
    
    if (shouldUpdate) {
      // If localScreen has conditions and screen doesn't, preserve local conditions
      const conditionsToUse = 
        (hasLocalConditions && !hasScreenConditions)
          ? (localScreen.conditions && localScreen.conditions.length > 0 
              ? localScreen.conditions 
              : localConditionsRef.current)
          : (screen.conditions || []);
      
      console.log('🔄 Updating localScreen. Using conditions:', conditionsToUse);
      setLocalScreen((prev) => ({
        ...screen,
        conditions: conditionsToUse,
      }));
      localConditionsRef.current = conditionsToUse;
      hasLocalChangesRef.current = false;
    } else {
      console.log('⏭️ Skipping update to preserve local conditions');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen.screenId, screen.displayName, screen.defaultNext]); // Only depend on key fields, not conditions to avoid overwriting local changes

  const handleFieldChange = (field: keyof FlowScreenConfig, value: any) => {
    setLocalScreen((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    try {
      console.log('💾 ========== NodeConfigPanel handleSave START ==========');
      console.log('💾 localScreen:', JSON.stringify(localScreen, null, 2));
      console.log('💾 localScreen.conditions:', localScreen.conditions);
      console.log('💾 localScreen.conditions length:', localScreen.conditions?.length || 0);
      console.log('💾 localConditionsRef.current:', localConditionsRef.current);
      console.log('💾 localConditionsRef.current length:', localConditionsRef.current?.length || 0);
      
      // Get conditions from localScreen or ref (whichever has data)
      // ALWAYS prefer ref first since it's updated synchronously, then fallback to localScreen
      let conditionsToSave: NavigationCondition[] = [];
      
      // Check ref first (updated synchronously in handleSaveCondition)
      if (localConditionsRef.current && Array.isArray(localConditionsRef.current) && localConditionsRef.current.length > 0) {
        conditionsToSave = localConditionsRef.current;
        console.log('✅ Using localConditionsRef.current (synchronous)');
      } else if (localScreen.conditions && Array.isArray(localScreen.conditions) && localScreen.conditions.length > 0) {
        conditionsToSave = localScreen.conditions;
        console.log('✅ Using localScreen.conditions (async state)');
      } else {
        console.warn('⚠️ No conditions found in localScreen or ref!');
        console.warn('⚠️ localScreen.conditions:', localScreen.conditions);
        console.warn('⚠️ localConditionsRef.current:', localConditionsRef.current);
      }
      
      console.log('💾 conditionsToSave:', JSON.stringify(conditionsToSave, null, 2));
      console.log('💾 conditionsToSave length:', conditionsToSave.length);
      
      // Validate conditions structure
      conditionsToSave.forEach((cond, idx) => {
        console.log(`💾 Condition ${idx}:`, JSON.stringify(cond, null, 2));
        if (!cond.id) {
          console.error(`❌ Condition ${idx} missing id!`);
        }
        if (!cond.condition) {
          console.error(`❌ Condition ${idx} missing condition object!`);
        }
        if (!cond.action) {
          console.error(`❌ Condition ${idx} missing action object!`);
        }
      });
      
      // Ensure conditions array exists and is properly structured
      // Only filter out conditions without id
      const conditions = Array.isArray(conditionsToSave) 
        ? conditionsToSave.filter(cond => {
            const isValid = cond && cond.id;
            if (!isValid) {
              console.warn('⚠️ Filtering out condition without id:', cond);
            }
            return isValid;
          })
        : [];
      
      console.log('💾 Filtered conditions:', conditions);
      console.log('💾 Filtered conditions length:', conditions.length);
      
      if (conditions.length === 0) {
        console.error('❌ ERROR: No valid conditions to save!');
        console.error('❌ conditionsToSave:', conditionsToSave);
        console.error('❌ localScreen:', localScreen);
        console.error('❌ localConditionsRef.current:', localConditionsRef.current);
      }
      
      const screenToSave: FlowScreenConfig = {
        ...localScreen,
        conditions: conditions,
      };
      
      console.log('💾 screenToSave:', JSON.stringify(screenToSave, null, 2));
      console.log('💾 screenToSave.conditions:', screenToSave.conditions);
      console.log('💾 screenToSave.conditions.length:', screenToSave.conditions.length);
      
      if (screenToSave.conditions.length === 0) {
        console.error('❌ CRITICAL ERROR: screenToSave has 0 conditions!');
        toast.error('No conditions to save. Please add at least one condition.');
        return;
      }
      
      console.log('💾 Calling onChange with screenToSave...');
      onChange(screenToSave);
      hasLocalChangesRef.current = false; // Reset flag after saving
      toast.success('Node configuration saved successfully!');
      console.log('✅ ========== NodeConfigPanel handleSave END ==========');
      
      // Close panel after save if onSave callback is provided
      if (onSave) {
        setTimeout(() => {
          onSave();
        }, 500); // Small delay to show toast
      }
    } catch (error) {
      console.error('❌ Error saving node configuration:', error);
      toast.error('Failed to save node configuration');
    }
  };

  const handleAddService = (type: 'preLoad' | 'onSubmit' | 'background') => {
    const newService: ServiceCall = {
      serviceId: '',
      serviceName: '',
      endpoint: '',
      method: 'POST',
    };
    setEditingService({ service: newService, type, index: -1 });
  };

  const handleEditService = (
    service: ServiceCall,
    type: 'preLoad' | 'onSubmit' | 'background',
    index: number
  ) => {
    setEditingService({ service, type, index });
  };

  const handleSaveService = (service: ServiceCall) => {
    if (!editingService) return;

    const services = { ...localScreen.services };
    const serviceList = [...(services[editingService.type as keyof typeof services] || [])];

    if (editingService.index === -1) {
      serviceList.push(service);
    } else {
      serviceList[editingService.index] = service;
    }

    setLocalScreen({
      ...localScreen,
      services: {
        ...services,
        [editingService.type]: serviceList,
      },
    });

    setEditingService(null);
  };

  const handleDeleteService = (type: 'preLoad' | 'onSubmit' | 'background', index: number) => {
    const services = { ...localScreen.services };
    const serviceList = [...(services[type] || [])];
    serviceList.splice(index, 1);

    setLocalScreen({
      ...localScreen,
      services: {
        ...services,
        [type]: serviceList,
      },
    });
  };

  const handleAddCondition = () => {
    console.log('➕ ========== handleAddCondition START ==========');
    
    // Use functional update to ensure we have the latest state
    setLocalScreen((prev) => {
      const currentConditions = prev.conditions || [];
      const newCondition: NavigationCondition = {
        id: `cond_${Date.now()}`,
        priority: currentConditions.length + 1,
        enabled: true,
        name: 'New Condition',
        condition: {
          source: 'FORM_DATA',
          operator: 'EQUALS',
          value: '',
        },
        action: {
          type: 'NAVIGATE',
          targetScreen: '',
        },
      };
      
      console.log('➕ Current conditions:', currentConditions);
      console.log('➕ New condition:', newCondition);
      
      const newConditions = [...currentConditions, newCondition];
      console.log('➕ New conditions array:', newConditions);
      console.log('➕ New conditions array length:', newConditions.length);
      
      // Update ref immediately
      localConditionsRef.current = newConditions;
      hasLocalChangesRef.current = true;
      
      const updatedScreen = {
        ...prev,
        conditions: newConditions,
      };
      
      console.log('➕ Updated screen:', JSON.stringify(updatedScreen, null, 2));
      console.log('➕ Updated screen.conditions:', updatedScreen.conditions);
      console.log('➕ Updated screen.conditions.length:', updatedScreen.conditions.length);
      
      return updatedScreen;
    });
    
    console.log('✅ ========== handleAddCondition END ==========');
  };

  const handleEditCondition = (condition: NavigationCondition) => {
    setEditingCondition(condition);
  };

  const handleSaveCondition = (updatedCondition: NavigationCondition) => {
    console.log('💾 ========== handleSaveCondition START ==========');
    console.log('💾 Updated condition received:', JSON.stringify(updatedCondition, null, 2));
    console.log('💾 Updated condition.id:', updatedCondition.id);
    console.log('💾 Updated condition.condition:', updatedCondition.condition);
    console.log('💾 Updated condition.action:', updatedCondition.action);
    
    // Ensure condition has all required fields with proper structure
    const completeCondition: NavigationCondition = {
      id: updatedCondition.id || `cond_${Date.now()}`,
      name: updatedCondition.name || 'New Condition',
      priority: updatedCondition.priority || 1,
      enabled: updatedCondition.enabled !== false,
      condition: updatedCondition.condition ? {
        source: updatedCondition.condition.source || 'FORM_DATA',
        operator: updatedCondition.condition.operator || 'EQUALS',
        field: updatedCondition.condition.field,
        value: updatedCondition.condition.value,
      } : {
        source: 'FORM_DATA',
        operator: 'EQUALS',
        value: '',
      },
      action: updatedCondition.action ? {
        type: updatedCondition.action.type || 'NAVIGATE',
        targetScreen: updatedCondition.action.targetScreen || '',
      } : {
        type: 'NAVIGATE',
        targetScreen: '',
      },
    };
    
    console.log('💾 Complete condition after processing:', JSON.stringify(completeCondition, null, 2));
    console.log('💾 Complete condition.id:', completeCondition.id);
    console.log('💾 Complete condition.condition:', completeCondition.condition);
    console.log('💾 Complete condition.action:', completeCondition.action);
    
    // Use functional update to ensure we have the latest state
    setLocalScreen((prev) => {
      const currentConditions = prev.conditions || [];
      console.log('💾 Previous conditions:', currentConditions);
      console.log('💾 Previous conditions length:', currentConditions.length);
      
      // Check if condition already exists
      const existingIndex = currentConditions.findIndex((c) => c.id === completeCondition.id);
      let newConditions: NavigationCondition[];
      
      if (existingIndex >= 0) {
        // Update existing condition
        newConditions = currentConditions.map((c, idx) =>
          idx === existingIndex ? completeCondition : c
        );
        console.log('💾 Updating existing condition at index:', existingIndex);
      } else {
        // Add new condition
        newConditions = [...currentConditions, completeCondition];
        console.log('💾 Adding new condition');
      }
      
      console.log('💾 New conditions array:', newConditions);
      console.log('💾 New conditions array length:', newConditions.length);
      
      // Validate each condition has required fields
      newConditions.forEach((cond, idx) => {
        if (!cond.id) {
          console.error(`❌ Condition ${idx} missing id:`, cond);
        }
        if (!cond.condition) {
          console.error(`❌ Condition ${idx} missing condition:`, cond);
        }
        if (!cond.action) {
          console.error(`❌ Condition ${idx} missing action:`, cond);
        }
      });
      
      // Update ref immediately (synchronously)
      localConditionsRef.current = newConditions;
      hasLocalChangesRef.current = true;
      
      console.log('💾 Updated localConditionsRef.current:', localConditionsRef.current);
      console.log('💾 Updated localConditionsRef.current length:', localConditionsRef.current.length);
      
      const updatedScreen = {
        ...prev,
        conditions: newConditions,
      };
      
      console.log('💾 Updated screen:', JSON.stringify(updatedScreen, null, 2));
      console.log('💾 Updated screen.conditions:', updatedScreen.conditions);
      console.log('💾 Updated screen.conditions.length:', updatedScreen.conditions.length);
      
      // CRITICAL: Auto-save conditions immediately when they're saved in the modal
      // This ensures conditions are persisted to screenConfigs without requiring "Save Changes"
      console.log('💾 Auto-saving conditions after condition save...');
      const screenToAutoSave: FlowScreenConfig = {
        ...updatedScreen,
        conditions: newConditions,
      };
      
      // Call onChange immediately to persist to parent
      onChange(screenToAutoSave);
      console.log('✅ Auto-saved conditions to parent');
      
      return updatedScreen;
    });
    
    setEditingCondition(null);
    console.log('✅ ========== handleSaveCondition END ==========');
  };

  const handleDeleteCondition = (id: string) => {
    const currentConditions = localScreen.conditions || [];
    setLocalScreen({
      ...localScreen,
      conditions: currentConditions.filter((c) => c.id !== id),
    });
  };

  const sortedConditions = [...(localScreen.conditions || [])].sort((a, b) => a.priority - b.priority);

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Node Configuration
      </Typography>

      <Divider sx={{ marginY: 2 }} />

      <TextField
        fullWidth
        label="Screen ID"
        value={localScreen.screenId}
        onChange={(e) => handleFieldChange('screenId', e.target.value)}
        sx={{ marginBottom: 2 }}
        disabled
      />

      <TextField
        fullWidth
        label="Display Name"
        value={localScreen.displayName}
        onChange={(e) => handleFieldChange('displayName', e.target.value)}
        sx={{ marginBottom: 2 }}
      />

      <TextField
        fullWidth
        label="Default Next Screen"
        select
        value={localScreen.defaultNext}
        onChange={(e) => handleFieldChange('defaultNext', e.target.value)}
        sx={{ marginBottom: 3 }}
      >
        <MenuItem value="__FLOW_END__">Flow End</MenuItem>
        {availableScreens.map((s) => (
          <MenuItem key={s.screenId} value={s.screenId}>
            {s.screenName}
          </MenuItem>
        ))}
      </TextField>

      <Divider sx={{ marginY: 2 }} />

      <Typography variant="subtitle1" gutterBottom>
        📥 Pre-Load Services
      </Typography>

      <List dense>
        {(localScreen.services?.preLoad || []).map((service, index) => (
          <ListItem key={index}>
            <ListItemText
              primary={service.serviceName || service.serviceId}
              secondary={service.endpoint}
            />
            <ListItemSecondaryAction>
              <IconButton
                edge="end"
                size="small"
                onClick={() => handleEditService(service, 'preLoad', index)}
              >
                <Edit fontSize="small" />
              </IconButton>
              <IconButton
                edge="end"
                size="small"
                onClick={() => handleDeleteService('preLoad', index)}
                color="error"
              >
                <Delete fontSize="small" />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>

      <Button
        variant="outlined"
        size="small"
        startIcon={<Add />}
        onClick={() => handleAddService('preLoad')}
        sx={{ marginBottom: 3 }}
      >
        Add Pre-Load Service
      </Button>

      <Divider sx={{ marginY: 2 }} />

      <Typography variant="subtitle1" gutterBottom>
        📤 On-Submit Services
      </Typography>

      <List dense>
        {(localScreen.services?.onSubmit || []).map((service, index) => (
          <ListItem key={index}>
            <ListItemText
              primary={service.serviceName || service.serviceId}
              secondary={
                <Box>
                  <Typography variant="caption" display="block">
                    Endpoint: {service.endpoint}
                  </Typography>
                  {service.timeout && (
                    <Typography variant="caption" display="block">
                      Timeout: {service.timeout}ms
                    </Typography>
                  )}
                </Box>
              }
            />
            <ListItemSecondaryAction>
              <IconButton
                edge="end"
                size="small"
                onClick={() => handleEditService(service, 'onSubmit', index)}
              >
                <Edit fontSize="small" />
              </IconButton>
              <IconButton
                edge="end"
                size="small"
                onClick={() => handleDeleteService('onSubmit', index)}
                color="error"
              >
                <Delete fontSize="small" />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>

      <Button
        variant="outlined"
        size="small"
        startIcon={<Add />}
        onClick={() => handleAddService('onSubmit')}
        sx={{ marginBottom: 3 }}
      >
        Add On-Submit Service
      </Button>

      <Divider sx={{ marginY: 2 }} />

      <Typography variant="subtitle1" gutterBottom>
        Outgoing Conditions
      </Typography>

      {sortedConditions.map((condition, index) => {
        const targetScreen = availableScreens.find((s) => s.screenId === condition.action?.targetScreen);
        return (
          <Paper key={condition.id} sx={{ padding: 2, marginBottom: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip
                  label={`Priority ${condition.priority}`}
                  size="small"
                  color={condition.priority === 1 ? 'warning' : 'default'}
                />
                <Typography variant="body2" fontWeight="medium">
                  {targetScreen?.screenName || condition.action?.targetScreen || condition.action?.type || 'Unknown'}
                </Typography>
              </Box>
              <Box>
                <IconButton
                  size="small"
                  onClick={() => handleEditCondition(condition)}
                >
                  <Edit fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => handleDeleteCondition(condition.id)}
                  color="error"
                >
                  <Delete fontSize="small" />
                </IconButton>
              </Box>
            </Box>
            <Typography variant="body2" color="text.secondary">
              {condition.name}
            </Typography>
          </Paper>
        );
      })}

      <Button
        variant="outlined"
        size="small"
        startIcon={<Add />}
        onClick={handleAddCondition}
        sx={{ marginBottom: 3 }}
      >
        Add New Condition
      </Button>

      <Divider sx={{ marginY: 2 }} />

      <Typography variant="subtitle1" gutterBottom>
        Journey Rules
      </Typography>

      <Typography variant="caption" color="text.secondary" sx={{ marginBottom: 2, display: 'block' }}>
        These settings define journey-level rules enforced by the backend at runtime.
        Flow Builder determines WHERE navigation goes, not WHETHER UI controls are visible.
        The backend validates and enforces these rules when processing navigation requests.
      </Typography>

      <FormControlLabel
        control={
          <Switch
            checked={localScreen.allowBack ?? true}
            onChange={(e) => handleFieldChange('allowBack', e.target.checked)}
          />
        }
        label="Allow Back Navigation"
        sx={{ marginBottom: 1 }}
      />
      <Typography variant="caption" color="text.secondary" sx={{ marginBottom: 2, display: 'block', marginLeft: 4 }}>
        Journey Rule: Determines if the backend permits moving backward from this screen.
        Backend checks this rule along with retry limits and flow history before allowing back navigation.
        This does NOT control UI button visibility - that is handled by the frontend independently.
      </Typography>

      <FormControlLabel
        control={
          <Switch
            checked={localScreen.allowSkip ?? false}
            onChange={(e) => handleFieldChange('allowSkip', e.target.checked)}
          />
        }
        label="Allow Skip"
        sx={{ marginBottom: 2 }}
      />
      <Typography variant="caption" color="text.secondary" sx={{ marginBottom: 2, display: 'block', marginLeft: 4 }}>
        Journey Rule: Determines if the backend permits skipping this screen in the journey.
        Backend validates this rule when processing skip requests.
        This does NOT control UI button visibility - that is handled by the frontend independently.
      </Typography>

      <TextField
        fullWidth
        label="Max Retries"
        type="number"
        value={localScreen.maxRetries || 3}
        onChange={(e) => handleFieldChange('maxRetries', parseInt(e.target.value) || 3)}
        sx={{ marginBottom: 1 }}
        helperText="Journey Rule: Maximum number of retry attempts allowed for this screen. Backend enforces this limit."
      />

      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', marginTop: 3, paddingTop: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button variant="outlined" onClick={() => setLocalScreen(screen)}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSave}>
          Save Changes
        </Button>
      </Box>

      {editingService && (
        <ServiceConfigModal
          open={!!editingService}
          onClose={() => setEditingService(null)}
          onSave={handleSaveService}
          service={editingService.service}
          availableFields={availableFields}
        />
      )}

      {editingCondition && (
        <ConditionEditorModal
          open={!!editingCondition}
          onClose={() => setEditingCondition(null)}
          onSave={handleSaveCondition}
          condition={editingCondition}
          availableScreens={availableScreens}
          availableFields={availableFields}
          availableServices={availableServices}
        />
      )}
    </Box>
  );
}

interface ConditionEditorModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (condition: NavigationCondition) => void;
  condition: NavigationCondition;
  availableScreens: Array<{ screenId: string; screenName: string }>;
  availableFields?: string[];
  availableServices?: string[];
}

function ConditionEditorModal({
  open,
  onClose,
  onSave,
  condition,
  availableScreens,
  availableFields = [],
  availableServices = [],
}: ConditionEditorModalProps) {
  const [formData, setFormData] = useState<NavigationCondition>(condition);

  // Update formData when condition prop changes (important for edit mode)
  useEffect(() => {
    if (condition) {
      setFormData(condition);
    }
  }, [condition]);

  const handleSave = () => {
    onSave(formData);
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 1300,
        display: open ? 'flex' : 'none',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 3,
      }}
      onClick={onClose}
    >
      <Box
        sx={{
          backgroundColor: 'white',
          borderRadius: 2,
          padding: 3,
          maxWidth: 800,
          maxHeight: '90vh',
          overflow: 'auto',
          width: '100%',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
          <Typography variant="h6">Edit Condition</Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>

        <TextField
          fullWidth
          label="Condition Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          sx={{ marginBottom: 2 }}
        />

        <TextField
          fullWidth
          label="Priority"
          type="number"
          value={formData.priority}
          onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 1 })}
          sx={{ marginBottom: 2 }}
          helperText="Higher priority = earlier evaluation"
        />

        <FormControlLabel
          control={
            <Switch
              checked={formData.enabled}
              onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
            />
          }
          label="Enable Condition"
          sx={{ marginBottom: 2 }}
        />

        <Divider sx={{ marginY: 2 }} />

        <Typography variant="subtitle1" gutterBottom>
          Condition Builder
        </Typography>

        <ConditionBuilder
          condition={formData.condition}
          onChange={(cond) => setFormData({ ...formData, condition: cond })}
          availableFields={availableFields}
          availableServices={availableServices}
        />

        <Divider sx={{ marginY: 2 }} />

        <Typography variant="subtitle1" gutterBottom>
          Action
        </Typography>

        <TextField
          fullWidth
          label="Action Type"
          select
          value={formData.action.type}
          onChange={(e) =>
            setFormData({
              ...formData,
              action: { ...formData.action, type: e.target.value as any },
            })
          }
          sx={{ marginBottom: 2 }}
        >
          <MenuItem value="NAVIGATE">Navigate to Screen</MenuItem>
          <MenuItem value="CALL_SERVICE">Call Service (then navigate)</MenuItem>
          <MenuItem value="SKIP">Skip Screen</MenuItem>
          <MenuItem value="END_FLOW">End Flow</MenuItem>
          <MenuItem value="LOOP_BACK">Loop Back</MenuItem>
        </TextField>

        {(formData.action.type === 'NAVIGATE' || formData.action.type === 'CALL_SERVICE') && (
          <TextField
            fullWidth
            label="Target Screen"
            select
            value={formData.action.targetScreen || ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                action: { ...formData.action, targetScreen: e.target.value },
              })
            }
            sx={{ marginBottom: 2 }}
          >
            {availableScreens.map((s) => (
              <MenuItem key={s.screenId} value={s.screenId}>
                {s.screenName}
              </MenuItem>
            ))}
          </TextField>
        )}

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', marginTop: 3 }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            Save Condition
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

