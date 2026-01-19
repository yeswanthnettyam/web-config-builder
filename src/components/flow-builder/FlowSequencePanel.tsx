'use client';

import React from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Switch,
  FormControlLabel,
  Button,
  Alert,
} from '@mui/material';
import {
  DragIndicator,
  Delete,
  Add,
  CheckCircle,
  RadioButtonUnchecked,
} from '@mui/icons-material';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FlowScreenConfig } from '@/types';

interface SortableListItemProps {
  screen: FlowScreenConfig;
  index: number;
  onRemove: (screenId: string) => void;
  onToggleRequired: (screenId: string, required: boolean) => void;
}

function SortableListItem({ screen, index, onRemove, onToggleRequired }: SortableListItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: screen.screenId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <ListItem
      ref={setNodeRef}
      style={style}
      sx={{
        bgcolor: isDragging ? 'action.selected' : 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
        '&:last-child': {
          borderBottom: 'none',
        },
      }}
    >
      <Box {...attributes} {...listeners} sx={{ mr: 1, cursor: 'grab' }}>
        <DragIndicator color="action" />
      </Box>

      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Chip
          label={screen.order ?? index + 1}
          size="small"
          color="primary"
          sx={{ minWidth: 40 }}
        />
        <ListItemText
          primary={screen.displayName || screen.screenId}
          secondary={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={screen.required ?? (index === 0)}
                    onChange={() =>
                      onToggleRequired(screen.screenId, screen.required ?? index === 0)
                    }
                  />
                }
                label={
                  <Typography variant="caption">
                    {screen.required ?? index === 0 ? (
                      <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CheckCircle fontSize="inherit" color="success" />
                        Required
                      </Box>
                    ) : (
                      <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <RadioButtonUnchecked fontSize="inherit" />
                        Optional
                      </Box>
                    )}
                  </Typography>
                }
              />
            </Box>
          }
        />
      </Box>

      <ListItemSecondaryAction>
        <IconButton
          edge="end"
          onClick={() => onRemove(screen.screenId)}
          color="error"
          size="small"
          title="Remove from flow"
        >
          <Delete />
        </IconButton>
      </ListItemSecondaryAction>
    </ListItem>
  );
}

interface FlowSequencePanelProps {
  /**
   * All available screens (Screen Registry)
   */
  allScreens: Array<{ screenId: string; screenName: string }>;
  /**
   * Screens currently in the flow (Flow Sequence)
   */
  flowScreens: FlowScreenConfig[];
  /**
   * Callback when a screen is added to the flow
   */
  onAddScreen: (screenId: string) => void;
  /**
   * Callback when a screen is removed from the flow
   */
  onRemoveScreen: (screenId: string) => void;
  /**
   * Callback when screens are reordered
   */
  onReorderScreens: (screenIds: string[]) => void;
  /**
   * Callback when a screen's required flag changes
   */
  onToggleRequired: (screenId: string, required: boolean) => void;
  /**
   * Callback when a screen config is updated
   */
  onUpdateScreen: (screenId: string, updates: Partial<FlowScreenConfig>) => void;
}

export default function FlowSequencePanel({
  allScreens,
  flowScreens,
  onAddScreen,
  onRemoveScreen,
  onReorderScreens,
  onToggleRequired,
  onUpdateScreen,
}: FlowSequencePanelProps) {
  // Get screen IDs currently in flow
  const flowScreenIds = new Set(flowScreens.map((s) => s.screenId));

  // Get screens NOT in flow (available to add)
  const availableScreens = allScreens.filter((s) => !flowScreenIds.has(s.screenId));

  // Sort flow screens by order
  const sortedFlowScreens = [...flowScreens].sort((a, b) => {
    const orderA = a.order ?? 999;
    const orderB = b.order ?? 999;
    return orderA - orderB;
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = sortedFlowScreens.findIndex((s) => s.screenId === active.id);
    const newIndex = sortedFlowScreens.findIndex((s) => s.screenId === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // Reorder screens
    const reordered = arrayMove(sortedFlowScreens, oldIndex, newIndex);

    // Update order values
    const updatedScreens = reordered.map((screen, index) => ({
      ...screen,
      order: index + 1,
    }));

    // Update all screens with new order
    updatedScreens.forEach((screen) => {
      onUpdateScreen(screen.screenId, { order: screen.order });
    });

    // Notify parent of reorder
    onReorderScreens(updatedScreens.map((s) => s.screenId));
  };

  const handleToggleRequired = (screenId: string, currentRequired: boolean) => {
    onToggleRequired(screenId, !currentRequired);
  };

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">Flow Screens</Typography>
          <Chip
            label={`${flowScreens.length} screen${flowScreens.length !== 1 ? 's' : ''}`}
            size="small"
            color="primary"
          />
        </Box>

        {flowScreens.length === 0 ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            No screens added to flow. Add screens from the Screen Registry below.
          </Alert>
        ) : (
          <Alert severity="success" sx={{ mb: 2 }}>
            Flow will execute screens in the order shown below. First screen is the start screen.
          </Alert>
        )}

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sortedFlowScreens.map((s) => s.screenId)}
            strategy={verticalListSortingStrategy}
          >
            <List
              sx={{
                minHeight: 100,
                bgcolor: 'background.paper',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              {sortedFlowScreens.map((screen, index) => (
                <SortableListItem
                  key={screen.screenId}
                  screen={screen}
                  index={index}
                  onRemove={onRemoveScreen}
                  onToggleRequired={(screenId, currentRequired) =>
                    handleToggleRequired(screenId, currentRequired)
                  }
                />
              ))}
            </List>
          </SortableContext>
        </DndContext>
      </Paper>

      {/* Screen Registry */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Screen Registry
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          All available screens. Click "Add to Flow" to include them in the flow sequence.
        </Typography>

        {availableScreens.length === 0 ? (
          <Alert severity="info">All screens are already in the flow.</Alert>
        ) : (
          <List>
            {availableScreens.map((screen) => (
              <ListItem
                key={screen.screenId}
                sx={{
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  '&:last-child': {
                    borderBottom: 'none',
                  },
                }}
              >
                <ListItemText
                  primary={screen.screenName}
                  secondary={screen.screenId}
                />
                <ListItemSecondaryAction>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<Add />}
                    onClick={() => onAddScreen(screen.screenId)}
                  >
                    Add to Flow
                  </Button>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}
      </Paper>
    </Box>
  );
}
