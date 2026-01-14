# Flow Builder Condition Field Dropdown Fix

## Problem

In Flow Builder → Condition Configuration:
- The "Field" dropdown was EMPTY
- Even though the selected screen had fields defined in Screen Builder
- This made condition configuration unusable

## Root Cause

Flow Builder was not context-aware:
- Conditions were showing fields from ALL screens in the flow
- No screen-specific field fetching
- Conditions must be evaluated against the CURRENT NODE'S SCREEN (source screen)

## Solution Implemented

### 1. Screen Context Establishment ✅

Each flow node already has `screenId`. This is now used as the condition context.

**Location:** `NodeConfigPanel` component

### 2. Screen-Specific Field Fetching ✅

When opening Condition Configuration:
- Reads the selected node's `screenId`
- Fetches screen config using: `GET /configs/screens` (filters for ACTIVE status)
- Extracts fields from:
  - `uiConfig.sections[].fields[]`
  - `uiConfig.sections[].subsections[].fields[]`
- Flattens into a list with field metadata:
  ```typescript
  {
    fieldId: string,
    label: string,
    type: string
  }
  ```

**Implementation:**
```typescript
// Fetch screen config for the current node's screenId
const { data: screenConfig, isLoading: isLoadingScreenConfig } = useQuery({
  queryKey: ['screen-config-by-screenId', screen.screenId],
  queryFn: async () => {
    const allConfigs = await screenConfigApi.getAll();
    const activeConfig = allConfigs.find(
      (config) => config.screenId === screen.screenId && config.status === 'ACTIVE'
    );
    return activeConfig || null;
  },
  enabled: !!screen.screenId,
});
```

### 3. Field Dropdown Population ✅

**Data Source = FORM_DATA:**
- ✅ Populates dropdown using current screen's fields
- ✅ Shows screen name in placeholder: "Select a field from <screen name>"

**Data Source = SERVICE_RESPONSE:**
- ✅ Populates dropdown using selected service response keys
- ✅ (No change needed - already working)

**Data Source = VALIDATION_RESULT:**
- ✅ Populates dropdown using validation rule identifiers
- ✅ (No change needed - already working)

### 4. UI Behavior Rules ✅

**Loading State:**
- ✅ Field dropdown disabled until screen config is loaded
- ✅ Shows: "Loading fields from <screen name>..."

**Empty State:**
- ✅ If screen has NO fields:
  - Shows error state
  - Message: "No fields configured for <screen name>. Please add fields in Screen Builder first."
  - Dropdown disabled

**Placeholder:**
- ✅ Shows: "Select a field from <screen name>"
- ✅ Context-aware based on current screen

### 5. Runtime Alignment ✅

- ✅ Stores selected `fieldId` as-is in flow config
- ✅ Backend will resolve it against formData at runtime
- ✅ Frontend does NOT evaluate condition logic
- ✅ Backward compatible - existing flows continue to work

## Files Modified

### 1. `src/components/flow-builder/NodeConfigPanel.tsx`

**Changes:**
- Added `useQuery` hook to fetch screen config by `screenId`
- Added `useMemo` to extract fields from screen config
- Added screen context props to `ConditionEditorModal`
- Updated field extraction logic to handle sections and subsections
- Added loading and empty state handling

**Key Code:**
```typescript
// Fetch screen config for current node
const { data: screenConfig, isLoading: isLoadingScreenConfig } = useQuery({
  queryKey: ['screen-config-by-screenId', screen.screenId],
  queryFn: async () => {
    const allConfigs = await screenConfigApi.getAll();
    return allConfigs.find(
      (config) => config.screenId === screen.screenId && config.status === 'ACTIVE'
    ) || null;
  },
});

// Extract fields from screen config
const screenFields = useMemo(() => {
  if (!screenConfig?.uiConfig) return [];
  // Extract from sections and subsections
  // Returns: [{ fieldId, label, type }]
}, [screenConfig]);

// Convert to field ID array
const currentScreenFieldIds = useMemo(() => {
  return screenFields.map(f => f.fieldId).filter(Boolean);
}, [screenFields]);
```

### 2. `src/components/flow-builder/ConditionBuilder.tsx`

**Changes:**
- Added props: `screenName`, `isLoadingFields`, `hasNoFields`
- Updated Field dropdown to show screen context
- Added loading state handling
- Added empty state with error message
- Updated placeholder text to be context-aware
- Passed props to nested ConditionBuilder calls (for AND/OR groups)

**Key Code:**
```typescript
<TextField
  label="Field"
  select
  disabled={isLoadingFields || hasNoFields}
  helperText={
    isLoadingFields
      ? `Loading fields from ${screenName || 'screen'}...`
      : hasNoFields
      ? `No fields configured for ${screenName || 'this screen'}. Please add fields in Screen Builder first.`
      : screenName
      ? `Select a field from ${screenName}`
      : 'Select the field to evaluate in this condition'
  }
  error={hasNoFields}
>
  <MenuItem value="" disabled={isLoadingFields || hasNoFields}>
    <em>
      {isLoadingFields
        ? 'Loading fields...'
        : hasNoFields
        ? 'No fields available'
        : screenName
        ? `Select a field from ${screenName}`
        : 'Select a field'}
    </em>
  </MenuItem>
  {/* Field options */}
</TextField>
```

## Verification Checklist

- [x] Create a screen with fields in Screen Builder
- [x] Add that screen as a node in Flow Builder
- [x] Open Condition Configuration
- [x] Verify Field dropdown shows correct fields from that screen
- [x] Verify condition JSON stores correct fieldId
- [x] Ensure existing flows are NOT broken
- [x] Verify loading state works
- [x] Verify empty state works (screen with no fields)
- [x] Verify screen name appears in placeholder
- [x] Verify nested AND/OR conditions also get screen context

## Backward Compatibility

✅ **No Breaking Changes:**
- Existing flows continue to work
- Field IDs stored as before
- Backend evaluation unchanged
- Only UI improvements

✅ **Graceful Degradation:**
- If screen config not found → shows empty state
- If screen has no fields → shows helpful error message
- Loading states prevent user confusion

## Testing Scenarios

### Scenario 1: Screen with Fields
1. Create screen "Personal Details" with fields: `name`, `panNumber`, `email`
2. Add screen as node in Flow Builder
3. Open Condition Configuration
4. **Expected:** Field dropdown shows: `name`, `panNumber`, `email`
5. **Expected:** Placeholder: "Select a field from Personal Details"

### Scenario 2: Screen without Fields
1. Create screen "Empty Screen" with no fields
2. Add screen as node in Flow Builder
3. Open Condition Configuration
4. **Expected:** Field dropdown disabled
5. **Expected:** Error message: "No fields configured for Empty Screen. Please add fields in Screen Builder first."

### Scenario 3: Loading State
1. Add screen as node in Flow Builder
2. Open Condition Configuration immediately
3. **Expected:** Field dropdown shows "Loading fields from <screen>..."
4. **Expected:** Dropdown disabled until fields load

### Scenario 4: Multiple Screens
1. Create Flow with Screen A (fields: `field1`, `field2`) and Screen B (fields: `field3`, `field4`)
2. Open Condition Configuration for Screen A
3. **Expected:** Only shows `field1`, `field2`
4. Open Condition Configuration for Screen B
5. **Expected:** Only shows `field3`, `field4`

## Technical Details

### Field Extraction Logic

```typescript
// Extracts from:
uiConfig.sections[].fields[]
uiConfig.sections[].subsections[].fields[]

// Returns:
[
  { fieldId: 'name', label: 'Full Name', type: 'TEXT' },
  { fieldId: 'panNumber', label: 'PAN Number', type: 'TEXT' },
  // ...
]
```

### API Call Pattern

```typescript
// Fetches all screen configs
GET /configs/screens

// Filters client-side:
- screenId === current node's screenId
- status === 'ACTIVE'
```

### Caching Strategy

- Query key: `['screen-config-by-screenId', screenId]`
- Stale time: 60 seconds
- Enabled only when `screenId` exists
- Automatically refetches when screenId changes

## Performance Considerations

- ✅ Screen configs cached for 60 seconds
- ✅ Field extraction memoized
- ✅ Only fetches when screenId is available
- ✅ No unnecessary re-renders

## Future Enhancements

1. **Edge Conditions:** Update `EdgeConfigPanel` to also use source screen's fields
2. **Field Labels:** Show field labels instead of just IDs in dropdown
3. **Field Types:** Filter fields by type based on operator (e.g., numeric fields for GREATER_THAN)
4. **Validation:** Warn if selected field doesn't exist in screen config

---

**Date**: 2026-01-13  
**Status**: ✅ Fixed  
**Build**: ✅ Passing  
**Type**: Critical Bug Fix
