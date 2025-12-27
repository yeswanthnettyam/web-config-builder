'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Box } from '@mui/material';
import { DragIndicator } from '@mui/icons-material';
interface SortableFieldProps {
  field: any; // Using any to match form data type
  fieldKey: string; // Immutable internal key (never changes)
  fieldIndex: number;
  disabled?: boolean; // Disable drag when field.id is empty
  children: React.ReactNode;
}

export default function SortableField({
  field,
  fieldKey,
  fieldIndex,
  disabled = false,
  children,
}: SortableFieldProps) {
  // Always use immutable fieldKey for useSortable (never use field.id)
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: fieldKey,
    disabled: disabled || !field,
  });

  // Always render - never conditionally mount/unmount
  if (!field) {
    return <>{children}</>;
  }

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Box
      ref={setNodeRef}
      style={style}
      className="sortable-field"
      sx={{
        position: 'relative',
        marginBottom: 1,
        '&:hover .drag-handle-field': {
          opacity: 1,
        },
      }}
    >
      {!disabled && (
        <Box
          {...attributes}
          {...listeners}
          className="drag-handle-field"
          sx={{
            position: 'absolute',
            left: -32,
            top: 8,
            cursor: isDragging ? 'grabbing' : 'grab',
            color: '#9e9e9e',
            padding: '4px',
            opacity: 0,
            transition: 'all 0.2s ease',
            zIndex: 10,
            '&:hover': {
              background: '#f5f5f5',
              color: '#1976d2',
              borderRadius: '4px',
            },
            '&:active': {
              cursor: 'grabbing',
            },
          }}
          aria-label={`Drag to reorder field: ${field.label || field.id || 'Unnamed'}`}
          role="button"
          tabIndex={0}
        >
          <DragIndicator />
        </Box>
      )}
      {children}
    </Box>
  );
}

