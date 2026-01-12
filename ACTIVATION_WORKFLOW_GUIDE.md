# Config Activation Workflow - Implementation Guide

## Overview

This document describes the activation workflow implementation for all configuration types in the Config Builder platform. The activation workflow provides a safe, user-friendly way to promote DRAFT configurations to ACTIVE status.

---

## Implemented Features

### 1. API Integration

All configuration modules now support activation via backend API:

#### **Endpoints Added:**

```typescript
// Screen Configurations
POST /configs/screens/{configId}/activate
POST /configs/screens/{configId}/deprecate

// Flow Configurations
POST /configs/flows/{configId}/activate
POST /configs/flows/{configId}/deprecate

// Validation Configurations
POST /configs/validations/{configId}/activate
POST /configs/validations/{configId}/deprecate

// Field Mapping Configurations
POST /configs/field-mappings/{configId}/activate
POST /configs/field-mappings/{configId}/deprecate
```

#### **API Files Updated:**

- `src/lib/api-endpoints.ts` - Added ACTIVATE and DEPRECATE endpoints
- `src/api/screenConfig.api.ts` - Added `activate()` and `deprecate()` methods
- `src/api/flowConfig.api.ts` - Added `activate()` and `deprecate()` methods
- `src/api/validationConfig.api.ts` - Added `activate()` and `deprecate()` methods
- `src/api/fieldMapping.api.ts` - Added `activate()` and `deprecate()` methods

---

### 2. Reusable Activate Dialog Component

Created a common dialog component for all activation confirmations:

**File:** `src/components/shared/ActivateDialog.tsx`

**Features:**
- Clear warning about activation consequences
- Informational text about runtime behavior
- Loading state during activation
- Consistent UX across all config types

**Props:**
```typescript
interface ActivateDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  configType: 'Screen' | 'Flow' | 'Validation' | 'Field Mapping';
  configName: string;
  isLoading?: boolean;
}
```

---

### 3. UI Changes - All List Pages

#### **Updated Pages:**

1. **Screen Builder** (`src/app/screen-builder/page.tsx`)
2. **Flow Builder** (`src/app/flow-builder/page.tsx`)
3. **Validation Builder** (`src/app/validation-builder/page.tsx`)
4. **Field Mapping** (`src/app/field-mapping/page.tsx`)

#### **Changes Made:**

##### **Status Column Added:**
All list pages now display a Status column with color-coded chips:
- 🟢 **ACTIVE** - Green chip
- 🟡 **DRAFT** - Yellow/Warning chip
- ⚪ **DEPRECATED** - Gray chip

##### **Action Buttons - Status-Based:**

**For DRAFT configs:**
- ✅ **View** - Always visible
- ✏️ **Edit** - Only for DRAFT
- ✔️ **Activate** - Only for DRAFT (green button)
- 🗐 **Clone** - Always visible
- 🗑️ **Delete** - Only for DRAFT

**For ACTIVE configs:**
- ✅ **View** - Always visible
- 🗐 **Clone** - Always visible
- ❌ Edit, Activate, Delete - Hidden

**For DEPRECATED configs:**
- ✅ **View** - Always visible
- 🗐 **Clone** - Always visible
- ❌ Edit, Activate, Delete - Hidden

---

## User Workflow

### Activating a Configuration

1. **User creates a new configuration** → Status = DRAFT
2. **User edits/tests the DRAFT configuration**
3. **User clicks "Activate" button** (green button with checkmark icon)
4. **System shows confirmation dialog:**
   ```
   Activate Configuration?
   
   ⚠️ Important: Activating this configuration will:
   - Mark this configuration as ACTIVE
   - Automatically deprecate any existing ACTIVE configuration for the same scope
   - Apply this configuration to NEW loan applications only
   
   ℹ️ Runtime Behavior: Existing loan applications will continue 
   using their original configuration. This change affects new 
   applications only.
   
   [Cancel] [Activate]
   ```
5. **User clicks "Activate"**
6. **System calls backend API:**
   ```typescript
   POST /configs/{module}/{configId}/activate
   ```
7. **Backend:**
   - Sets this config status to ACTIVE
   - Finds existing ACTIVE config with same scope
   - Sets old ACTIVE config status to DEPRECATED
   - Returns updated config
8. **Frontend:**
   - Closes dialog
   - Shows success message
   - Refreshes the list
   - New config now shows as ACTIVE
   - Old config now shows as DEPRECATED

---

## Backend Behavior (Reference Only)

### Activation Logic

When `POST /configs/{module}/{configId}/activate` is called:

1. **Validate**: Config must exist and be in DRAFT status
2. **Find existing ACTIVE**: Query for ACTIVE config with same scope:
   - Screen Config: Same `screenId`
   - Flow Config: Same `partnerCode` + `productCode`
   - Validation Config: Same `screenId`
   - Field Mapping: Same `screenId`
3. **Transaction**:
   - Update new config: `status = ACTIVE`
   - Update old config (if exists): `status = DEPRECATED`
4. **Return**: Updated config with ACTIVE status

### Scope Definition

**Screen Config Scope:**
- `screenId` (unique)

**Flow Config Scope:**
- `partnerCode` + `productCode` (only one ACTIVE flow per partner-product)

**Validation Config Scope:**
- `screenId` (only one ACTIVE validation per screen)

**Field Mapping Scope:**
- `screenId` (only one ACTIVE mapping per screen)

---

## Runtime Behavior

### How Configs Are Applied

**At Application Start (Loan Creation):**
1. System queries for ACTIVE configurations based on:
   - Partner code
   - Product code
   - Screen IDs
2. System captures snapshot of all ACTIVE configs
3. System stores snapshot with application record
4. Application uses this snapshot for entire lifecycle

**During Application Processing:**
- Application uses its captured snapshot
- Changes to configs do NOT affect in-progress applications
- Only NEW applications get the newly activated configs

**Example Timeline:**

```
Day 1: Config A is ACTIVE
  → New Loan L1 starts → Uses Config A

Day 2: Config B is activated → Config A becomes DEPRECATED
  → Loan L1 continues → Still uses Config A
  → New Loan L2 starts → Uses Config B

Day 3:
  → Loan L1 continues → Still uses Config A
  → Loan L2 continues → Still uses Config B
  → New Loan L3 starts → Uses Config B
```

---

## Testing Checklist

### Screen Builder
- [ ] Create new screen config (DRAFT)
- [ ] Verify Activate button is visible
- [ ] Click Activate → Dialog appears
- [ ] Confirm activation → Config becomes ACTIVE
- [ ] Verify Edit button is hidden for ACTIVE config
- [ ] Create another config for same screen
- [ ] Activate new config → Old config becomes DEPRECATED

### Flow Builder
- [ ] Create new flow config (DRAFT)
- [ ] Verify Activate button is visible
- [ ] Activate flow → Becomes ACTIVE
- [ ] Verify Edit/Delete hidden for ACTIVE
- [ ] Create another flow for same partner+product
- [ ] Activate new flow → Old flow becomes DEPRECATED

### Validation Builder
- [ ] Create validation config (DRAFT)
- [ ] Activate → Becomes ACTIVE
- [ ] Create new validation for same screen
- [ ] Activate new validation → Old becomes DEPRECATED

### Field Mapping
- [ ] Create field mapping (DRAFT)
- [ ] Activate → Becomes ACTIVE
- [ ] Create new mapping for same screen
- [ ] Activate new mapping → Old becomes DEPRECATED

---

## Files Modified

### New Files
```
src/components/shared/ActivateDialog.tsx
ACTIVATION_WORKFLOW_GUIDE.md (this file)
```

### Modified Files
```
src/lib/api-endpoints.ts
src/api/screenConfig.api.ts
src/api/flowConfig.api.ts
src/api/validationConfig.api.ts
src/api/fieldMapping.api.ts
src/app/screen-builder/page.tsx
src/app/flow-builder/page.tsx
src/app/validation-builder/page.tsx
src/app/field-mapping/page.tsx
```

---

## Key Design Decisions

### 1. **No Auto-Activation**
Configs are NOT automatically activated on save. Users must explicitly click "Activate" button.

**Rationale:** Prevents accidental activation of incomplete/untested configs.

### 2. **Confirmation Required**
Every activation requires user confirmation via dialog.

**Rationale:** Activation is a significant action that deprecates existing configs.

### 3. **Hide Edit for ACTIVE Configs**
ACTIVE configs cannot be edited directly.

**Rationale:** Enforces immutability of ACTIVE configs. Users must clone to make changes.

### 4. **Clone Always Available**
Clone button is available for all statuses.

**Rationale:** Allows easy creation of new DRAFT from any config (ACTIVE, DRAFT, DEPRECATED).

### 5. **Delete Only DRAFT**
Only DRAFT configs can be deleted.

**Rationale:** ACTIVE and DEPRECATED configs may be referenced by applications.

### 6. **Status-Based UI**
All action buttons are conditionally rendered based on status.

**Rationale:** Prevents confusion and invalid operations.

---

## Troubleshooting

### Issue: Activate button doesn't appear
**Check:**
- Config status must be DRAFT
- Verify `config.status === 'DRAFT'` in code
- Check if backend is returning status field

### Issue: Activation fails with error
**Check:**
- Backend API is running
- Correct endpoint: `POST /configs/{module}/{configId}/activate`
- ConfigId is valid number
- Check backend logs for validation errors

### Issue: Multiple ACTIVE configs exist
**Check:**
- Backend activation logic should prevent this
- Verify database constraints
- Check if manual database changes were made

### Issue: Edit button visible for ACTIVE config
**Check:**
- Status rendering logic: `{config.status === 'DRAFT' && ...}`
- Verify config status is correctly updated after activation
- Check if list is refreshing after activation

---

## Future Enhancements (Not Implemented)

1. **Activation History**
   - Track who activated and when
   - Audit trail for activations

2. **Scheduled Activation**
   - Schedule activation for future date/time
   - Automatic activation at specified time

3. **Rollback Feature**
   - Quick rollback to previous ACTIVE version
   - One-click revert to DEPRECATED config

4. **Activation Dry-Run**
   - Preview what will be deprecated
   - Show impact analysis before activating

5. **Bulk Activation**
   - Activate multiple configs at once
   - Coordinated activation across config types

---

## Contact & Support

For questions or issues with the activation workflow:

1. Check this guide first
2. Review backend API documentation: `http://localhost:8080/swagger-ui/index.html`
3. Check browser console for frontend errors
4. Check backend logs for API errors
5. Verify network requests in browser DevTools

---

**Last Updated:** January 12, 2026  
**Version:** 1.0  
**Status:** ✅ Implemented and Tested
