# Backend API Integration Guide

## 🎉 Integration Status: ✅ COMPLETE (Screen Builder)

**Screen Builder is fully integrated with backend APIs!**
- ✅ Build passes with zero errors
- ✅ All TypeScript checks pass
- ✅ CRUD operations implemented
- ✅ Error handling in place
- ✅ Ready for testing with live backend

## Overview

This document describes the integration between the Config Builder frontend and the Spring Boot backend (LOS Config Service).

**Backend Base URL:** `http://localhost:8080`  
**Swagger UI:** `http://localhost:8080/swagger-ui.html`  
**API Version:** `v1`

**Last Updated:** January 12, 2026  
**Commits:**
- `933585b` - feat: Add backend API integration layer (WIP)
- `0289d5e` - feat: Complete backend API integration for Screen Builder

---

## ✅ Completed Integration Steps

### 1. API Service Layer Created

A centralized API service layer has been created in `src/api/` with the following modules:

- **`src/api/screenConfig.api.ts`** - Screen Configuration APIs
- **`src/api/flowConfig.api.ts`** - Flow Configuration APIs
- **`src/api/validationConfig.api.ts`** - Validation Configuration APIs
- **`src/api/fieldMapping.api.ts`** - Field Mapping Configuration APIs
- **`src/api/runtime.api.ts`** - Runtime Orchestration APIs
- **`src/api/index.ts`** - Centralized exports

### 2. TypeScript Types

All backend entity types have been added to `src/types/index.ts`:

- `BackendScreenConfig`
- `BackendFlowConfig`
- `BackendValidationConfig`
- `BackendFieldMappingConfig`
- `NextScreenRequest`
- `BackendNextScreenResponse`
- `BackendErrorResponse`

### 3. API Client Configuration

**File:** `src/lib/api-client.ts`

- ✅ Axios instance configured with base URL: `http://localhost:8080/api/v1`
- ✅ Authentication **temporarily disabled** for testing (JWT headers commented out)
- ✅ Error interceptors in place (401 handling commented out)
- ✅ Ready for authentication re-enablement via uncommenting

### 4. API Endpoints Updated

**File:** `src/lib/api-endpoints.ts`

All endpoints have been updated to match the backend Swagger specification:

```typescript
// Screen Config APIs
GET    /configs/screens
GET    /configs/screens/{configId}
POST   /configs/screens
PUT    /configs/screens/{configId}
DELETE /configs/screens/{configId}
POST   /configs/screens/{configId}/clone

// Flow Config APIs
GET    /configs/flows
GET    /configs/flows/{configId}
POST   /configs/flows
PUT    /configs/flows/{configId}
DELETE /configs/flows/{configId}
POST   /configs/flows/{configId}/clone

// Validation Config APIs
GET    /configs/validations
GET    /configs/validations/{configId}
POST   /configs/validations
PUT    /configs/validations/{configId}
DELETE /configs/validations/{configId}
POST   /configs/validations/{configId}/clone

// Field Mapping APIs
GET    /configs/field-mappings
GET    /configs/field-mappings/{configId}
POST   /configs/field-mappings
PUT    /configs/field-mappings/{configId}
DELETE /configs/field-mappings/{configId}
POST   /configs/field-mappings/{configId}/clone

// Runtime API
POST   /runtime/next-screen
```

### 5. Constants Updated

**File:** `src/lib/constants.ts`

- Base URL changed from `http://localhost:3001/api` to `http://localhost:8080/api/v1`

---

## ✅ Completed Integration

### 1. Screen Builder List Page

**File:** `src/app/screen-builder/page.tsx`

**Status:** ✅ Fully integrated with backend APIs

**Changes Made:**
- ✅ Replaced cache storage with `screenConfigApi.getAll()`
- ✅ Added error handling with `AxiosError` types
- ✅ Added Snackbar for success/error messages
- ✅ Implemented `clone()` API call
- ✅ Implemented `delete()` API call
- ✅ Updated table columns to match backend response format

### 2. Screen Builder Create/Edit Page

**File:** `src/app/screen-builder/new/page.tsx`

**Status:** ✅ Fully integrated with backend APIs

**Changes Made:**
- ✅ Load existing config: `await screenConfigApi.getById(Number(configId))`
- ✅ Create new config: `await screenConfigApi.create(backendPayload)`
- ✅ Update existing: `await screenConfigApi.update(Number(editId), backendPayload)`
- ✅ Proper backend payload format (BackendScreenConfig)
- ✅ Field-level error handling from backend
- ✅ Removed all cache storage dependencies

### 3. React Query Hooks

**File:** `src/hooks/use-screen-configs.ts`

**Status:** ✅ Fully integrated with backend APIs

**Changes Made:**
- ✅ `useScreenConfigs()` uses `screenConfigApi.getAll()`
- ✅ `useScreenConfig()` uses `screenConfigApi.getById()`
- ✅ `useCreateScreenConfig()` uses `screenConfigApi.create()`
- ✅ `useUpdateScreenConfig()` uses `screenConfigApi.update()`
- ✅ `useCloneScreenConfig()` uses `screenConfigApi.clone()`
- ✅ `useDeleteScreenConfig()` uses `screenConfigApi.delete()`

**File:** `src/hooks/use-configs.ts`

**Status:** ✅ Updated for backend compatibility

**Changes Made:**
- ✅ Updated `useConfig()` to accept number IDs
- ✅ Updated `useUpdateConfig()` to accept number IDs
- ✅ Updated `useDeleteConfig()` to use backend API
- ⏳ `useConfigVersions()` uses mock (backend endpoint pending)
- ⏳ `useResolvedConfig()` uses mock (backend endpoint pending)
- ⏳ `useActivateConfig()` uses mock (backend endpoint pending)
- ⏳ `useDeprecateConfig()` uses mock (backend endpoint pending)

---

## ⏳ Pending Integration (Optional)

The following modules still use cache storage but are NOT required for core functionality:

### Flow Builder Pages
**Files:**
- `src/app/flow-builder/page.tsx` (list)
- `src/app/flow-builder/new/page.tsx` (create/edit)

**Status:** Still using cache storage

**Migration Pattern:**
```typescript
// Import API
import { flowConfigApi } from '@/api';

// Replace getFlowConfigById with:
const config = await flowConfigApi.getById(Number(configId));

// Replace save with:
await flowConfigApi.create({
  flowId: 'flow_id',
  productCode: 'PRODUCT',
  status: 'DRAFT',
  flowDefinition: { /* flow JSON */ }
});
```

### Field Mapping Page
**File:** `src/app/field-mapping/page.tsx`

**Status:** Still using cache storage

**Migration Pattern:**
```typescript
import { fieldMappingApi } from '@/api';

await fieldMappingApi.create({
  screenId: 'screen_id',
  productCode: 'PRODUCT',
  status: 'DRAFT',
  mappings: { /* mappings JSON */ }
});
```

### Validation Builder Page
**File:** `src/app/validation-builder/page.tsx`

**Status:** Still using cache storage

**Migration Pattern:**
```typescript
import { validationConfigApi } from '@/api';

await validationConfigApi.create({
  screenId: 'screen_id',
  productCode: 'PRODUCT',
  status: 'DRAFT',
  validationRules: { /* rules JSON */ }
});
```

---

##API Usage Examples

### Creating a Screen Configuration

```typescript
import { screenConfigApi } from '@/api';

const newConfig = await screenConfigApi.create({
  screenId: 'personal_info',
  productCode: 'HOME_LOAN',
  partnerCode: 'PARTNER_001',
  status: 'DRAFT',
  uiConfig: {
    title: 'Personal Information',
    ui: {
      layout: {
        type: 'FORM',
        allowBackNavigation: true
      },
      sections: [/* ... */],
      actions: [/* ... */]
    }
  }
});
```

### Fetching All Configurations

```typescript
import { screenConfigApi } from '@/api';

try {
  const configs = await screenConfigApi.getAll();
  console.log('Loaded configs:', configs);
} catch (error) {
  if (axios.isAxiosError(error)) {
    const backendError = error.response?.data as BackendErrorResponse;
    console.error('Error:', backendError.message);
  }
}
```

### Updating a Configuration

```typescript
await screenConfigApi.update(configId, {
  status: 'ACTIVE',
  uiConfig: { /* updated config */ }
});
```

### Error Handling Pattern

```typescript
import { AxiosError } from 'axios';
import { BackendErrorResponse } from '@/types';

try {
  await screenConfigApi.create(payload);
  setSnackbar({
    open: true,
    message: 'Configuration created successfully',
    severity: 'success'
  });
} catch (err) {
  const axiosError = err as AxiosError<BackendErrorResponse>;
  const errorMessage = axiosError.response?.data?.message || 'Operation failed';
  
  // Handle field-level errors
  const fieldErrors = axiosError.response?.data?.fieldErrors || [];
  fieldErrors.forEach(fe => {
    setError(fe.fieldId, { message: fe.message });
  });
  
  setSnackbar({
    open: true,
    message: errorMessage,
    severity: 'error'
  });
}
```

---

## Authentication (Currently Disabled)

**Status:** Authentication headers are temporarily disabled for testing.

**To Re-Enable Authentication:**

1. Open `src/lib/api-client.ts`
2. Uncomment the JWT token attachment code in the request interceptor
3. Uncomment the 401 redirect logic in the response interceptor

```typescript
// Request Interceptor (uncomment this block)
if (typeof window !== 'undefined') {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
}

// Response Interceptor (uncomment this block)
if (error.response?.status === 401) {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
    window.location.href = '/login';
  }
}
```

---

## Testing the Integration

### Prerequisites

1. **Backend must be running:**
   ```bash
   # Start Spring Boot backend
   cd los-config-service
   ./mvnw spring-boot:run
   ```

2. **Verify backend is accessible:**
   ```bash
   curl http://localhost:8080/actuator/health
   ```

3. **Check Swagger UI:**
   Open `http://localhost:8080/swagger-ui.html` in browser

### Running the Frontend

```bash
cd web-config-builder
npm install
npm run dev
```

### Testing API Calls

1. Open browser DevTools → Network tab
2. Navigate to `/screen-builder`
3. Verify API calls are going to `http://localhost:8080/api/v1/configs/screens`
4. Check request/response payloads match Swagger schema

### Common Issues

**CORS Errors:**
- Backend must enable CORS for `http://localhost:3000`
- Check Spring Boot `@CrossOrigin` annotations or global CORS config

**404 Not Found:**
- Verify backend base path is `/api/v1`
- Check Swagger UI for exact endpoint paths

**Type Mismatches:**
- Backend uses `configId` as `Long` (number)
- Frontend must pass numbers, not strings
- Update old code using string IDs

---

## Migration Checklist

### Core Infrastructure (✅ Complete)
- [x] Create API service layer
- [x] Add TypeScript types from Swagger
- [x] Update API endpoints
- [x] Disable authentication temporarily
- [x] Update constants (base URL)
- [x] Create comprehensive documentation

### Screen Builder (✅ Complete)
- [x] Integrate Screen Builder list page
- [x] Integrate Screen Builder create/edit page
- [x] Update React Query hooks for screen configs
- [x] Update use-configs.ts hooks
- [x] Test TypeScript compilation
- [x] Verify build succeeds

### Testing (⏳ Pending - Requires Live Backend)
- [ ] Test all CRUD operations with live backend
- [ ] Test error handling scenarios
- [ ] Test clone operations
- [ ] Test field-level validation errors
- [ ] Verify Snackbar notifications

### Optional Modules (⏳ Deferred)
- [ ] Integrate Flow Builder pages
- [ ] Integrate Field Mapping page
- [ ] Integrate Validation Builder page

### Future Enhancements
- [ ] Implement missing backend endpoints (versions, resolve, activate, deprecate)
- [ ] Re-enable authentication
- [ ] Migrate remaining modules

---

## Notes for Developers

1. **Always use the API service layer** - Never call Axios directly from components
2. **Use TypeScript types** - Import from `@/types` for type safety
3. **Handle errors consistently** - Use the `BackendErrorResponse` type
4. **Show user feedback** - Use Snackbar for success/error messages
5. **Loading states** - Disable buttons and show spinners during API calls
6. **Field validation errors** - Map `fieldErrors[]` array to form fields
7. **Config ID is a number** - Backend uses `Long`, not `String`

---

## Contact

For backend API questions, refer to:
- **Swagger UI:** http://localhost:8080/swagger-ui.html
- **API Docs:** http://localhost:8080/v3/api-docs

Last Updated: January 12, 2026
