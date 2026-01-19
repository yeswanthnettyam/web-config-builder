# Flow Sequence Feature - Screen Registry vs Flow Sequence

## Overview

This feature introduces a clear separation between **Screen Registry** (all available screens) and **Flow Sequence** (screens actually included in the flow). This enables users to:

- Explicitly select which screens belong to a flow
- Reorder screens using drag & drop
- Mark screens as required or optional
- Reduce confusion across multiple modules
- Ensure runtime executes ONLY intended screens

## Key Changes

### 1. Type Updates (`src/types/index.ts`)

Added two new optional fields to `FlowScreenConfig` and `ScreenFlowNode`:

- **`order?: number`** - Execution order in the flow sequence (lower number = earlier execution, 1 is first)
- **`required?: boolean`** - Whether this screen is REQUIRED in the flow
  - `true`: User must complete this screen (cannot be skipped)
  - `false`: Screen may be skipped via conditions
  - Default: `false` (except first screen which defaults to `true`)

### 2. FlowSequencePanel Component (`src/components/flow-builder/FlowSequencePanel.tsx`)

New dedicated component for managing flow screens:

**Features:**
- **Flow Screens Panel**: Shows screens currently in the flow with drag & drop ordering
- **Screen Registry Panel**: Shows all available screens that can be added to the flow
- **Add to Flow**: Button to add screens from registry to flow
- **Remove from Flow**: Button to remove screens from flow (removes all connections)
- **Drag & Drop**: Reorder screens using `@dnd-kit` library
- **Required Toggle**: Switch to mark screens as required or optional
- **Visual Indicators**: Order numbers, required/optional badges

**Dependencies:**
- Uses `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` for drag & drop

### 3. Flow Builder Page Updates (`src/app/flow-builder/new/page.tsx`)

**Major Changes:**

1. **Screen Configs Map**: Now contains ONLY screens that are part of the flow sequence (not all screens)

2. **New Handlers:**
   - `handleAddScreen`: Adds a screen to the flow with default order and required=false (except first screen)
   - `handleRemoveScreen`: Removes screen from flow, cleans up edges/conditions, updates start screen if needed
   - `handleReorderScreens`: Handles drag & drop reordering
   - `handleToggleRequired`: Toggles required flag for a screen
   - `handleUpdateScreen`: Updates screen config (used for order updates)

3. **Node Generation**: Only shows screens that are in the flow sequence
   - Required screens: Blue background (`#00B2FF`)
   - Optional screens: Grey background with dashed border (`#9E9E9E`)
   - Start screen: Dark blue (`#0B2F70`)
   - End screen: Green (`#2E7D32`)

4. **Start Screen Dropdown**: Now only shows screens that are in the flow sequence

5. **Validation Updates**:
   - Validates that flow has at least one screen
   - Validates that start screen is in the flow sequence
   - Validates that `defaultNext` references only screens in the flow
   - Validates that condition `targetScreen` references only screens in the flow
   - Errors prevent saving if conditions reference screens not in flow

6. **Backward Compatibility**:
   - When loading existing flows without `order`/`required`:
     - Auto-derives `order` from array index (1, 2, 3...)
     - Sets `required` to `true` for first screen, `false` for others
   - Existing flows continue to work without modification

7. **buildFlowConfig Updates**:
   - Sorts screens by `order` before building config
   - Includes `order` and `required` fields in persisted config

## User Experience

### Adding Screens to Flow

1. User sees "Screen Registry" panel with all available screens
2. Clicks "Add to Flow" button next to desired screen
3. Screen appears in "Flow Screens" panel with order number
4. First screen automatically marked as "Required"

### Reordering Screens

1. User drags screen in "Flow Screens" panel using drag handle (⋮⋮ icon)
2. Order numbers automatically update (1, 2, 3...)
3. First screen in order becomes the start screen candidate

### Marking Screens as Required/Optional

1. User toggles "Required" switch in "Flow Screens" panel
2. Required screens: Blue background in flow diagram
3. Optional screens: Grey background with dashed border in flow diagram

### Removing Screens from Flow

1. User clicks "Remove" button (🗑️ icon) next to screen
2. Screen is removed from flow sequence
3. All edges/conditions connected to that screen are automatically removed
4. If removed screen was start screen, first remaining screen becomes new start screen
5. Order numbers are automatically renumbered

## Backend Compatibility

The flow config structure now includes `order` and `required` fields:

```json
{
  "flowId": "applicant_flow",
  "screens": [
    {
      "screenId": "applicant_identity",
      "order": 1,
      "required": true,
      "defaultNext": "kyc_applicant",
      "conditions": []
    },
    {
      "screenId": "kyc_applicant",
      "order": 2,
      "required": true,
      "defaultNext": "kyc_co_applicant",
      "conditions": []
    },
    {
      "screenId": "kyc_co_applicant",
      "order": 3,
      "required": false,
      "defaultNext": "__FLOW_END__",
      "conditions": []
    }
  ]
}
```

**Backward Compatibility:**
- Existing flows without `order`/`required` are auto-migrated on load
- Backend can safely ignore these fields if not yet supported
- Frontend falls back to defaults if fields are missing

## Validation Rules

1. **Flow must have at least one screen** - Error prevents saving
2. **Start screen must be in flow sequence** - Error prevents saving
3. **Conditions can only reference screens in flow** - Error prevents saving
4. **defaultNext can only reference screens in flow** - Error prevents saving

## Technical Notes

- Uses `@dnd-kit` library (already installed) for drag & drop
- Order is 1-indexed (1, 2, 3...)
- First screen in order is treated as start screen candidate
- Removing a screen automatically cleans up all related edges and conditions
- Start screen dropdown only shows screens in the flow sequence
- Flow diagram only displays screens in the flow sequence

## Files Modified

1. `src/types/index.ts` - Added `order` and `required` fields
2. `src/components/flow-builder/FlowSequencePanel.tsx` - New component
3. `src/app/flow-builder/new/page.tsx` - Major refactoring

## Testing Checklist

- [ ] Add screens to flow from registry
- [ ] Remove screens from flow
- [ ] Reorder screens using drag & drop
- [ ] Toggle required/optional flag
- [ ] Verify start screen updates when first screen changes
- [ ] Verify validation errors for conditions referencing screens not in flow
- [ ] Verify backward compatibility with existing flows
- [ ] Verify order and required fields are persisted
- [ ] Verify flow diagram only shows screens in flow
- [ ] Verify edges/conditions are cleaned up when screen removed
