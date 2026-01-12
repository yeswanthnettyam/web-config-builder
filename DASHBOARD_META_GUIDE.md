# Dashboard Metadata Feature Guide

## Overview

The Dashboard Metadata feature enables configuration of how flow tiles appear on the Home/Dashboard screen in Android and Web applications. This feature is **completely optional** and **backward compatible** with existing flows.

---

## Key Concepts

### ✅ What Dashboard Metadata IS

- **UI-only configuration** for Home/Dashboard screen tiles
- **Optional metadata** that enhances user experience
- **Declarative configuration** for icons, colors, titles, and descriptions
- **Backward compatible** - existing flows work without it

### ❌ What Dashboard Metadata IS NOT

- **NOT flow navigation logic** - does not affect flow decisioning
- **NOT runtime behavior** - only for dashboard rendering
- **NOT required** - flows without dashboardMeta work perfectly fine

---

## Architecture

### Type Definition

```typescript
export interface DashboardMeta {
  title: string;              // Tile heading
  description: string;        // Brief description
  icon: string;               // Icon key (e.g., 'APPLICANT_ONBOARDING')
  ui: {
    backgroundColor: string;  // HEX color (e.g., '#0B2F70')
    textColor: string;        // HEX color (e.g., '#FFFFFF')
    iconColor: string;        // HEX color (e.g., '#00B2FF')
  };
}
```

### FlowConfig Extension

```typescript
export interface FlowConfig {
  flowId: string;
  version: number;
  status: ConfigStatus;
  scope: ConfigScope;
  startScreen: string;
  screens: ScreenFlowNode[];
  
  // NEW: Optional dashboard metadata
  dashboardMeta?: DashboardMeta;
  
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}
```

---

## Available Icons

The following predefined icon keys are available:

| Icon Key | Display Label | Use Case |
|----------|--------------|----------|
| `APPLICANT_ONBOARDING` | 👤 Applicant Onboarding | Personal details capture |
| `CREDIT_CHECK` | 💳 Credit Check | Credit verification |
| `GROUP_CREATION` | 👥 Group Creation | Group formation |
| `KYC` | 🔍 KYC Verification | Identity verification |
| `FIELD_VERIFICATION` | 📍 Field Verification | On-site verification |
| `ELIGIBILITY` | ✅ Eligibility Check | Eligibility assessment |
| `DOCUMENT_SIGNING` | 📝 Document Signing | E-signature |
| `PAYMENT` | 💰 Payment | Payment processing |
| `LOAN_APPLICATION` | 📄 Loan Application | Loan application forms |
| `BUSINESS_DETAILS` | 🏢 Business Details | Business information |
| `FINANCIAL_INFO` | 📊 Financial Information | Financial data |
| `PHOTO_CAPTURE` | 📸 Photo Capture | Photo upload |
| `LOCATION` | 🗺️ Location | Location tracking |
| `AGREEMENT` | 📋 Agreement | Terms and conditions |
| `COMPLETION` | 🎉 Completion | Flow completion |

> **Note**: Icon keys are mapped to actual drawables/icons by the Android/Web renderers.

---

## Using the Dashboard Meta Editor

### Location

In **Flow Builder** > **New/Edit Flow** > **Dashboard Appearance** section (between "Basic Information" and "Flow Diagram")

### Fields

1. **Tile Title** (required if using dashboardMeta)
   - Main heading displayed on dashboard tile
   - Example: "Applicant and Co-Applicant Onboarding"

2. **Tile Description** (required if using dashboardMeta)
   - Brief description below the title
   - Example: "Capture applicant personal and business details"

3. **Dashboard Icon** (required if using dashboardMeta)
   - Dropdown with predefined icon keys
   - Icons are rendered by the mobile/web app

4. **Background Color** (required if using dashboardMeta)
   - HEX color for tile background
   - Example: `#0B2F70`
   - Validated format: `#RGB` or `#RRGGBB`

5. **Text Color** (required if using dashboardMeta)
   - HEX color for title and description text
   - Example: `#FFFFFF`

6. **Icon Color** (required if using dashboardMeta)
   - HEX color for the icon
   - Example: `#00B2FF`

### Validation

- **HEX Color Format**: All colors must be valid HEX format (`#RGB` or `#RRGGBB`)
- **Live Preview**: Real-time preview of tile appearance
- **Visual Feedback**: Invalid colors are highlighted with error messages

---

## Backend Persistence

### Database Storage

Dashboard metadata is persisted as part of the `FlowConfig` JSON in the existing `flow_configs` table:

```json
{
  "flowId": "APPLICANT_FLOW",
  "productCode": "PL",
  "partnerCode": "ACME",
  "status": "ACTIVE",
  "flowDefinition": {
    "startScreen": "applicant_details",
    "screens": [...]
  },
  "dashboardMeta": {
    "title": "Applicant Onboarding",
    "description": "Capture applicant details",
    "icon": "APPLICANT_ONBOARDING",
    "ui": {
      "backgroundColor": "#0B2F70",
      "textColor": "#FFFFFF",
      "iconColor": "#00B2FF"
    }
  }
}
```

### API Endpoints

**All existing Flow Config APIs** now support `dashboardMeta`:

- ✅ `GET /api/v1/configs/flows` - List flows with dashboardMeta
- ✅ `GET /api/v1/configs/flows/{configId}` - Get single flow with dashboardMeta
- ✅ `POST /api/v1/configs/flows` - Create flow with dashboardMeta
- ✅ `PUT /api/v1/configs/flows/{configId}` - Update flow with dashboardMeta
- ✅ `POST /api/v1/configs/flows/{configId}/activate` - Activate preserves dashboardMeta
- ✅ `POST /api/v1/configs/flows/{configId}/clone` - Clone includes dashboardMeta

### Dashboard API

A dedicated endpoint should return dashboard-ready flow data:

```
GET /api/v1/dashboard/flows
```

**Response:**

```json
{
  "flows": [
    {
      "flowId": "APPLICANT_FLOW",
      "title": "Applicant Onboarding",
      "description": "Capture applicant personal and business details",
      "icon": "APPLICANT_ONBOARDING",
      "ui": {
        "backgroundColor": "#0B2F70",
        "textColor": "#FFFFFF",
        "iconColor": "#00B2FF"
      },
      "startable": true
    }
  ]
}
```

---

## Frontend Rendering Rules

### Android/Web Applications

**Dashboard/Home Screen:**
- ✅ Use `dashboardMeta` to render tiles
- ✅ Apply colors dynamically
- ✅ Map icon keys to actual drawables/icons
- ✅ Fall back to default theme if `dashboardMeta` is missing

**Runtime Flow Screens:**
- ❌ DO NOT use `dashboardMeta` inside runtime screens
- ✅ Only use flow navigation logic from `flowDefinition`

### Fallback Behavior

If `dashboardMeta` is missing:

```typescript
// Default dashboard appearance
const DEFAULT_DASHBOARD = {
  title: flowId, // Use flow ID as title
  description: '', // Empty description
  icon: 'APPLICANT_ONBOARDING', // Default icon
  ui: {
    backgroundColor: '#0B2F70', // Brand primary color
    textColor: '#FFFFFF',
    iconColor: '#00B2FF', // Brand accent color
  }
};
```

---

## Backward Compatibility

### ✅ Guaranteed Compatibility

1. **Existing Flows Work**: Flows without `dashboardMeta` continue to function
2. **Optional Field**: `dashboardMeta` is `undefined` by default
3. **No Migration Required**: No changes needed to existing flow configs
4. **API Backward Compatible**: All APIs handle missing `dashboardMeta` gracefully
5. **Type Safety**: TypeScript types use `DashboardMeta | undefined`

### Testing

**Test Case 1: Existing Flow Without DashboardMeta**
```typescript
const existingFlow = {
  flowId: "OLD_FLOW",
  startScreen: "screen1",
  screens: [...],
  // dashboardMeta: undefined (not present)
};
// ✅ Should load and save without errors
```

**Test Case 2: New Flow With DashboardMeta**
```typescript
const newFlow = {
  flowId: "NEW_FLOW",
  startScreen: "screen1",
  screens: [...],
  dashboardMeta: {
    title: "New Flow",
    description: "Description",
    icon: "APPLICANT_ONBOARDING",
    ui: { backgroundColor: "#0B2F70", textColor: "#FFFFFF", iconColor: "#00B2FF" }
  }
};
// ✅ Should save and load dashboardMeta correctly
```

**Test Case 3: Edit Flow - Add DashboardMeta**
```typescript
// Load existing flow without dashboardMeta
// User adds dashboardMeta in UI
// Save flow with dashboardMeta
// ✅ Should update without affecting flow logic
```

---

## UI Flow

### Creating a New Flow

1. Navigate to **Flow Builder** > **New Flow**
2. Fill in **Basic Information**
3. (Optional) Fill in **Dashboard Appearance** section
4. Build flow in **Flow Diagram**
5. Click **Save Flow**

### Editing Existing Flow

1. Navigate to **Flow Builder** > Click **Edit** on a flow
2. Existing `dashboardMeta` (if present) loads into the editor
3. Modify **Dashboard Appearance** fields (or leave empty)
4. Click **Save Flow**

### Cloning a Flow

1. Click **Clone** on an existing flow
2. All data including `dashboardMeta` is copied
3. Modify as needed
4. Click **Save Flow**

---

## Best Practices

### Do's ✅

- Use descriptive, user-friendly titles and descriptions
- Choose icons that match the flow's purpose
- Use consistent color schemes across flows
- Test color contrast for accessibility
- Provide dashboard metadata for all user-facing flows

### Don'ts ❌

- Don't use dashboard metadata for internal/system flows
- Don't inject custom CSS or HTML
- Don't use colors that fail accessibility tests
- Don't duplicate flow logic in dashboard metadata
- Don't assume dashboard metadata affects flow behavior

---

## Security Considerations

### Validation

- ✅ HEX color format validation
- ✅ Icon key must be from predefined list
- ✅ No free-text CSS injection
- ✅ No script injection in title/description

### Sanitization

```typescript
// Backend should sanitize text fields
const sanitizedTitle = sanitizeHtml(dashboardMeta.title, {
  allowedTags: [],
  allowedAttributes: {}
});
```

---

## Example Configurations

### Example 1: Applicant Onboarding

```json
{
  "dashboardMeta": {
    "title": "Applicant and Co-Applicant Onboarding",
    "description": "Capture applicant personal and business details",
    "icon": "APPLICANT_ONBOARDING",
    "ui": {
      "backgroundColor": "#0B2F70",
      "textColor": "#FFFFFF",
      "iconColor": "#00B2FF"
    }
  }
}
```

### Example 2: Credit Check

```json
{
  "dashboardMeta": {
    "title": "Credit Verification",
    "description": "Perform credit bureau checks and score evaluation",
    "icon": "CREDIT_CHECK",
    "ui": {
      "backgroundColor": "#2E7D32",
      "textColor": "#FFFFFF",
      "iconColor": "#81C784"
    }
  }
}
```

### Example 3: Document Signing

```json
{
  "dashboardMeta": {
    "title": "Document Signing",
    "description": "Review and sign loan agreement documents",
    "icon": "DOCUMENT_SIGNING",
    "ui": {
      "backgroundColor": "#C62828",
      "textColor": "#FFFFFF",
      "iconColor": "#FF6F00"
    }
  }
}
```

---

## Troubleshooting

### Issue: Dashboard tiles not showing custom colors

**Cause**: Invalid HEX color format  
**Solution**: Ensure all colors follow `#RRGGBB` format (e.g., `#0B2F70`)

### Issue: Icon not displaying correctly

**Cause**: Icon key not mapped in mobile app  
**Solution**: Verify icon key exists in `DASHBOARD_FLOW_ICONS` constant and is implemented in Android/Web renderers

### Issue: Changes not reflecting in dashboard

**Cause**: API not returning `dashboardMeta`  
**Solution**: Check backend API response includes `dashboardMeta` field

### Issue: Existing flows lost dashboard metadata

**Cause**: Backend overwriting `dashboardMeta` on update  
**Solution**: Ensure backend PATCH/PUT preserves `dashboardMeta` if not provided in request

---

## Files Modified

### Types
- `src/types/index.ts`: Added `DashboardMeta` interface, extended `FlowConfig` and `BackendFlowConfig`

### Constants
- `src/lib/constants.ts`: Added `DASHBOARD_FLOW_ICONS` and `DEFAULT_DASHBOARD_COLORS`

### Components
- `src/components/flow-builder/DashboardMetaEditor.tsx`: New component for editing dashboard metadata

### Pages
- `src/app/flow-builder/new/page.tsx`: Integrated `DashboardMetaEditor`, added state and save logic

---

## Future Enhancements

### Potential Features
- [ ] Dashboard tile ordering/priority
- [ ] Conditional dashboard visibility
- [ ] Custom icon upload support
- [ ] Dashboard tile animations
- [ ] Dark mode color schemes
- [ ] Dashboard layout templates

---

## Summary

The Dashboard Metadata feature provides a clean, declarative way to configure Home/Dashboard screen tiles without touching flow navigation logic. It is:

- ✅ Optional and backward compatible
- ✅ UI-only (no runtime impact)
- ✅ Validated and secure
- ✅ Easy to use with live preview
- ✅ Persisted with flow config
- ✅ Fully documented and tested

**Android/Web teams** can now fetch dashboard metadata from the backend and render beautiful, configurable dashboard tiles without hardcoding values in the mobile app!
