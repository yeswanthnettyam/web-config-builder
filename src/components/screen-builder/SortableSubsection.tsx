'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Box } from '@mui/material';
import { DragIndicator } from '@mui/icons-material';
interface SortableSubsectionProps {
  subsection: any; // Using any to match form data type
  subsectionIndex: number;
  children: React.ReactNode;
}

export default function SortableSubsection({
  subsection,
  subsectionIndex,
  children,
}: SortableSubsectionProps) {
  // Use a fallback id to prevent hook errors
  const subsectionId = subsection?.id || `subsection-${subsectionIndex}-${Date.now()}`;
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: subsectionId });

  // Guard against undefined subsection - render children without drag functionality
  if (!subsection || !subsection.id) {
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
      className="sortable-subsection"
      sx={{
        position: 'relative',
        marginBottom: 2,
        '&:hover .drag-handle-subsection': {
          opacity: 1,
        },
      }}
    >
      <Box
        {...attributes}
        {...listeners}
        className="drag-handle-subsection"
        sx={{
          position: 'absolute',
          left: -32,
          top: 16,
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
        aria-label={`Drag to reorder subsection: ${subsection.title}`}
        role="button"
        tabIndex={0}
      >
        <DragIndicator />
      </Box>
      {children}
    </Box>
  );
}

