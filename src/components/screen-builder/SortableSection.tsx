'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Box, Typography } from '@mui/material';
import { DragIndicator } from '@mui/icons-material';
interface SortableSectionProps {
  section: any; // Using any to match form data type
  sectionIndex: number;
  children: React.ReactNode;
  onDragStart?: () => void;
}

export default function SortableSection({
  section,
  sectionIndex,
  children,
  onDragStart,
}: SortableSectionProps) {
  // Use a fallback id to prevent hook errors
  const sectionId = section?.id || `section-${sectionIndex}-${Date.now()}`;
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sectionId });

  // Guard against undefined section - render children without drag functionality
  if (!section || !section.id) {
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
      className="sortable-section"
      sx={{
        position: 'relative',
        '&:hover .drag-handle-section': {
          opacity: 1,
        },
      }}
    >
      <Box
        {...attributes}
        {...listeners}
        className="drag-handle-section"
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
        aria-label={`Drag to reorder section: ${section.title}`}
        role="button"
        tabIndex={0}
      >
        <DragIndicator />
      </Box>
      {children}
    </Box>
  );
}

