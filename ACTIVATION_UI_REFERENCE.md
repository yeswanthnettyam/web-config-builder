# Config Activation - UI Reference

## Visual Guide to UI Changes

This document provides a visual reference for the UI changes made to implement the activation workflow.

---

## Table Layout Changes

### BEFORE (Old Table)

```
+-------------+--------+---------+-------------+---------+
| Screen ID   | Count  | Version | Last Update | Actions |
+-------------+--------+---------+-------------+---------+
| KYC_FORM    | 15     | v1.0    | 2026-01-10  | [View] [Edit] [Clone] [Delete] |
+-------------+--------+---------+-------------+---------+
```

### AFTER (New Table with Status)

```
+-------------+--------+---------+--------+-------------+---------+
| Screen ID   | Count  | Version | Status | Last Update | Actions |
+-------------+--------+---------+--------+-------------+---------+
| KYC_FORM    | 15     | v1.0    | 🟢 ACTIVE    | 2026-01-10  | [View] [Clone] |
| KYC_FORM    | 15     | v0.9    | ⚪ DEPRECATED | 2026-01-08  | [View] [Clone] |
| ADDRESS     | 8      | v1.0    | 🟡 DRAFT     | 2026-01-12  | [View] [Edit] [✓ Activate] [Clone] [Delete] |
+-------------+--------+---------+--------+-------------+---------+
```

---

## Action Buttons by Status

### DRAFT Configuration

**Buttons Visible:**
```
[View] [Edit] [✓ Activate] [Clone] [Delete]
```

**Visual:**
- View: Outlined button
- Edit: Outlined button
- **Activate: Contained GREEN button with checkmark icon** ⭐ NEW
- Clone: Outlined button
- Delete: Red text button

**Behavior:**
- All actions enabled
- Activate button triggers confirmation dialog

---

### ACTIVE Configuration

**Buttons Visible:**
```
[View] [Clone]
```

**Visual:**
- View: Outlined button
- Clone: Outlined button

**Hidden:**
- ❌ Edit (cannot modify ACTIVE config)
- ❌ Activate (already active)
- ❌ Delete (cannot delete ACTIVE config)

**Behavior:**
- Must clone to create new DRAFT version

---

### DEPRECATED Configuration

**Buttons Visible:**
```
[View] [Clone]
```

**Visual:**
- Same as ACTIVE
- View: Outlined button
- Clone: Outlined button

**Hidden:**
- ❌ Edit (cannot modify DEPRECATED config)
- ❌ Activate (can clone instead)
- ❌ Delete (cannot delete DEPRECATED config)

---

## Activation Dialog

### Dialog Appearance

```
┌─────────────────────────────────────────────────┐
│ ⚠️  Activate Screen Configuration              │
├─────────────────────────────────────────────────┤
│                                                 │
│ Are you sure you want to activate KYC_FORM?    │
│                                                 │
│ ┌─────────────────────────────────────────┐   │
│ │ ⚠️  Important:                          │   │
│ │                                         │   │
│ │ Activating this configuration will:    │   │
│ │ • Mark this configuration as ACTIVE    │   │
│ │ • Automatically deprecate any existing │   │
│ │   ACTIVE configuration for same scope  │   │
│ │ • Apply to NEW loan applications only  │   │
│ └─────────────────────────────────────────┘   │
│                                                 │
│ ┌─────────────────────────────────────────┐   │
│ │ ℹ️  Runtime Behavior:                   │   │
│ │                                         │   │
│ │ Existing loan applications will         │   │
│ │ continue using their original          │   │
│ │ configuration. This change affects     │   │
│ │ new applications only.                 │   │
│ └─────────────────────────────────────────┘   │
│                                                 │
│                          [Cancel] [✓ Activate] │
└─────────────────────────────────────────────────┘
```

### Dialog During Activation

```
┌─────────────────────────────────────────────────┐
│ ⚠️  Activate Screen Configuration              │
├─────────────────────────────────────────────────┤
│                                                 │
│ Are you sure you want to activate KYC_FORM?    │
│                                                 │
│ ... (same content as above) ...                │
│                                                 │
│                   [Cancel] [⏳ Activating...]   │
│                                   (disabled)    │
└─────────────────────────────────────────────────┘
```

---

## Status Chip Colors

### Visual Reference

```
ACTIVE:      🟢 Chip with green background
             color="success"

DRAFT:       🟡 Chip with yellow/orange background
             color="warning"

DEPRECATED:  ⚪ Chip with gray background
             color="default"
```

### Code Implementation

```typescript
<Chip
  label={config.status || 'DRAFT'}
  color={
    config.status === 'ACTIVE' ? 'success' :
    config.status === 'DEPRECATED' ? 'default' :
    'warning'
  }
  size="small"
/>
```

---

## Menu Items (Screen Builder & Flow Builder)

### BEFORE (Old Menu)

```
┌────────────────┐
│ 👁️  View       │
│ ✏️  Edit       │
│ 📋 Clone       │
│ 🗑️  Delete     │
└────────────────┘
```

### AFTER (Menu for DRAFT config)

```
┌────────────────┐
│ 👁️  View       │  ← Always visible
│ ✏️  Edit       │  ← Only for DRAFT
│ ✓  Activate    │  ← NEW - Only for DRAFT
│ 📋 Clone       │  ← Always visible
│ 🗑️  Delete     │  ← Only for DRAFT
└────────────────┘
```

### AFTER (Menu for ACTIVE config)

```
┌────────────────┐
│ 👁️  View       │  ← Always visible
│ 📋 Clone       │  ← Always visible
└────────────────┘
```

---

## Page-by-Page UI Changes

### 1. Screen Builder (`/screen-builder`)

**Status Column:** ✅ Added  
**Activate Button:** ✅ Added (menu item)  
**Status-based Actions:** ✅ Implemented  
**Activation Dialog:** ✅ Integrated  

---

### 2. Flow Builder (`/flow-builder`)

**Status Column:** ✅ Already existed  
**Activate Button:** ✅ Added (menu item)  
**Status-based Actions:** ✅ Implemented  
**Activation Dialog:** ✅ Integrated  

---

### 3. Validation Builder (`/validation-builder`)

**Status Column:** ✅ Added  
**Activate Button:** ✅ Added (inline button)  
**Status-based Actions:** ✅ Implemented  
**Activation Dialog:** ✅ Integrated  

**Note:** Uses inline buttons instead of menu (different design pattern)

```
Actions for DRAFT:
[View] [Edit] [✓ Activate] [Delete]

Actions for ACTIVE:
[View]
```

---

### 4. Field Mapping (`/field-mapping`)

**Status Column:** ✅ Added  
**Activate Button:** ✅ Added (inline button)  
**Status-based Actions:** ✅ Implemented  
**Activation Dialog:** ✅ Integrated  

**Note:** Uses inline buttons instead of menu (same as Validation Builder)

```
Actions for DRAFT:
[View] [Edit] [✓ Activate] [Delete]

Actions for ACTIVE:
[View]
```

---

## Success/Error Messages

### Success Message (Toast)
```
┌──────────────────────────────────────────┐
│ ✓ Configuration activated successfully   │
└──────────────────────────────────────────┘
```

### Error Message (Toast)
```
┌──────────────────────────────────────────┐
│ ✗ Failed to activate configuration       │
└──────────────────────────────────────────┘
```

---

## User Flow Diagram

```
┌─────────────┐
│ Create New  │
│   Config    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Status:   │
│    DRAFT    │  ← Can Edit, Delete
└──────┬──────┘
       │
       │ Click "Activate"
       ▼
┌─────────────┐
│ Confirmation│
│   Dialog    │
└──────┬──────┘
       │
       │ User confirms
       ▼
┌─────────────┐
│   Status:   │
│   ACTIVE    │  ← Cannot Edit, Delete
└──────┬──────┘  ← Old ACTIVE → DEPRECATED
       │
       │ Create new version
       │ (via Clone)
       ▼
┌─────────────┐
│   Status:   │
│    DRAFT    │  ← New version starts as DRAFT
└─────────────┘
```

---

## Responsive Design

All UI elements are responsive and work across different screen sizes:

- **Desktop:** Full table with all columns
- **Tablet:** Same layout, slightly compressed
- **Mobile:** Action buttons may stack vertically

---

## Accessibility

✅ **Keyboard Navigation:** All buttons and dialogs are keyboard accessible  
✅ **Screen Readers:** Proper ARIA labels on all interactive elements  
✅ **Color Contrast:** Status chips meet WCAG AA standards  
✅ **Focus Indicators:** Clear focus states on all buttons  

---

## Icon Reference

| Element | Icon | Library |
|---------|------|---------|
| Activate Button | ✓ CheckCircle | @mui/icons-material |
| View Button | 👁️ Visibility | @mui/icons-material |
| Edit Button | ✏️ Edit | @mui/icons-material |
| Clone Button | 📋 ContentCopy | @mui/icons-material |
| Delete Button | 🗑️ Delete | @mui/icons-material |
| Warning (Dialog) | ⚠️ Warning | @mui/icons-material |
| Info (Dialog) | ℹ️ CheckCircle | @mui/icons-material |

---

**Last Updated:** January 12, 2026  
**Version:** 1.0  
**Status:** ✅ Complete
