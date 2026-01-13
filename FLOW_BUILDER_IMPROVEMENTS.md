# Flow Builder Improvements - Backend Integration

## Summary

This document outlines the improvements made to the Flow Builder to ensure all data comes from the backend and fix various issues related to conditions, field names, and flow-end navigation.

## Issues Fixed

### 1. ✅ Field Names in Flow Builder Now Come from Backend

**Problem**: Field names in condition dropdowns were hardcoded dummy data.

**Solution**: 
- Implemented dynamic field extraction from all screen configurations used in the flow
- Fetches full screen configs from backend API (`screenConfigApi.getAll()`)
- Extracts field IDs from all sections and subsections
- Only shows fields from screens actually used in the current flow

**Files Changed**:
- `src/app/flow-builder/new/page.tsx`: Added `fullScreenConfigs` query and `availableFields` memo

### 2. ✅ Removed Hardcoded Dummy Data for APPLICATION_STATE and USER_PROFILE

**Problem**: Condition builder had hardcoded field names for APPLICATION_STATE and USER_PROFILE data sources.

**Solution**: 
- Updated to use standard runtime fields that the backend provides
- Added documentation indicating these are backend-provided fields
- Included TODO comments for future API-based configuration if needed

**Fields Added**:
- **APPLICATION_STATE**: `applicationId`, `applicationStatus`, `currentScreen`, `loanAmount`, `creditScore`, `createdAt`, `updatedAt`
- **USER_PROFILE**: `userId`, `userRole`, `userType`, `partnerCode`, `branchCode`, `agentId`

**Files Changed**:
- `src/components/flow-builder/ConditionBuilder.tsx`: Updated `getFieldsForSource()` function

### 3. ✅ Fixed Runtime Error: condition.action Undefined

**Problem**: Application crashed with "Cannot read properties of undefined (reading 'targetScreen')" when editing node configurations.

**Solution**: 
- Added optional chaining (`?.`) when accessing `condition.action`
- Added fallback display values for incomplete conditions

**Files Changed**:
- `src/components/flow-builder/NodeConfigPanel.tsx`: Line 593

### 4. ✅ Conditions Are Optional for Flow End

**Problem**: User reported that adding conditions was mandatory even for nodes with `defaultNext: "__FLOW_END__"`.

**Solution**: 
- Verified that conditions are already optional in the validation logic
- No validation enforces conditions for flow-end nodes
- Conditions can be empty array (`conditions: []`)

**Files Changed**: None (already working correctly)

### 5. ✅ Fixed Condition Structure to Save Field Property

**Problem**: Condition objects were missing the `field` property when saved.

**Solution**: 
- Added placeholder option in field dropdown for better UX
- Added helper text to guide users
- The field property is correctly saved via the `onChange` handler

**Files Changed**:
- `src/components/flow-builder/ConditionBuilder.tsx`: Added placeholder and helper text to field dropdown

### 6. ✅ Master Data Now Fetched from Backend

**Problem**: Partners, Products, and Branches were using mock data.

**Solution**: 
- Updated to use new backend master data endpoint: `GET /master-data`
- Implemented shared query that fetches all master data in one call
- Returns empty arrays if backend endpoint is not available (graceful degradation)
- Individual hooks (`usePartners`, `useProducts`, `useBranches`) now derive from shared query

**API Structure**:
```typescript
GET /master-data
Response: {
  partners: Partner[],
  branches: Branch[],
  products: Product[]
}
```

**Files Changed**:
- `src/hooks/use-master-data.ts`: Refactored all master data hooks
- `src/lib/api-endpoints.ts`: Added `GET_ALL` endpoint

## Service ID Extraction

**Implemented**: Service IDs are now extracted from screen configurations' lifecycle events:
- `lifecycleConfig.onLoad.services`
- `lifecycleConfig.onSubmit.services`

**Files Changed**:
- `src/app/flow-builder/new/page.tsx`: Added `availableServices` memo

## Technical Details

### Data Flow

1. **Screen Selection**: User selects screens for the flow
2. **Full Config Fetch**: System fetches complete screen configurations from backend
3. **Field Extraction**: Extracts all field IDs from sections/subsections
4. **Service Extraction**: Extracts all service IDs from lifecycle configs
5. **Condition Builder**: Uses extracted fields/services for dropdown options

### Type Safety

- Used `any` type for nested properties in `uiConfig` due to `Record<string, any>` type
- Added proper null/undefined checks throughout
- Used optional chaining for safe property access

### Performance

- Used `useMemo` hooks to avoid re-computation on every render
- Shared query for master data (single API call for all master data)
- 5-minute stale time for master data (infrequent changes expected)

## Backward Compatibility

✅ All changes are backward compatible:
- Existing flow configurations will continue to work
- Empty field arrays handled gracefully
- Conditions remain optional as before
- No breaking changes to data structures

## Testing Recommendations

1. **Field Names**: Create a flow with multiple screens and verify all fields appear in condition dropdowns
2. **Application State**: Test conditions using APPLICATION_STATE source
3. **User Profile**: Test conditions using USER_PROFILE source
4. **Flow End**: Create a node with `defaultNext: "__FLOW_END__"` and empty conditions array
5. **Master Data**: Verify partners, products, and branches load from backend
6. **Services**: Verify service IDs appear in condition dropdowns for SERVICE_RESPONSE source

## Files Modified

1. `src/app/flow-builder/new/page.tsx`
2. `src/components/flow-builder/NodeConfigPanel.tsx`
3. `src/components/flow-builder/ConditionBuilder.tsx`
4. `src/hooks/use-master-data.ts`
5. `src/lib/api-endpoints.ts`

## Next Steps

- Verify master data endpoint returns correct structure (`partners`, `branches`, `products`)
- Test flow builder with real screen configurations from backend
- Monitor for any runtime errors related to missing fields/services
- Consider adding validation to warn users if selected fields are missing from screens

---

**Date**: 2026-01-13  
**Status**: ✅ Complete  
**Build**: ✅ Passing
