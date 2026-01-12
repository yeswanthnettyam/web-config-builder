# Backend API Integration Guide

## Overview

This document describes the integration between the Config Builder frontend and the Spring Boot backend (LOS Config Service).

**Backend Base URL:** `http://localhost:8080`  
**Swagger UI:** `http://localhost:8080/swagger-ui.html`  
**API Version:** `v1`

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

## 🚧 Partial Integration (In Progress)

### Screen Builder List Page

**File:** `src/app/screen-builder/page.tsx`

**Status:** Partially integrated with backend APIs

**Changes Made:**
- ✅ Replaced cache storage with `screenConfigApi.getAll()`
- ✅ Added error handling with `AxiosError` types
- ✅ Added Snackbar for success/error messages
- ✅ Implemented `clone()` API call
- ✅ Implemented `delete()` API call
- ✅ Updated table columns to match backend response format

**What Still Needs Work:**
- The edit flow needs to be updated (currently passes `configId` correctly)
- Need to test with live backend to verify data format

---

## ⏳ Pending Integration

The following pages still use cache storage and need to be updated:

### 1. Screen Builder Create/Edit Page
**File:** `src/app/screen-builder/new/page.tsx`

**Current State:** Uses `cache-storage.ts` for:
- `getScreenConfigById()`
- `saveScreenConfig()`

**Required Changes:**
```typescript
// Replace cache loading with:
const config = await screenConfigApi.getById(configId);

// Replace save with:
if (isEditMode) {
  await screenConfigApi.update(configId, payload);
} else {
  await screenConfigApi.create(payload);
}
```

### 2. Flow Builder Pages
**Files:**
- `src/app/flow-builder/page.tsx` (list)
- `src/app/flow-builder/new/page.tsx` (create/edit)

**Required Changes:**
- Replace cache storage calls with `flowConfigApi.*`
- Update to use `BackendFlowConfig` type
- Handle `flowDefinition` field (instead of nested config structure)

### 3. Field Mapping Page
**File:** `src/app/field-mapping/page.tsx`

**Required Changes:**
- Replace cache storage calls with `fieldMappingApi.*`
- Update to use `BackendFieldMappingConfig` type
- Handle `mappings` field

### 4. Validation Builder Page
**File:** `src/app/validation-builder/page.tsx`

**Required Changes:**
- Replace cache storage calls with `validationConfigApi.*`
- Update to use `BackendValidationConfig` type
- Handle `validationRules` field

### 5. React Query Hooks
**File:** `src/hooks/use-screen-configs.ts`

**Current State:** Uses old endpoint signatures expecting `string` IDs

**Required Changes:**
- Update `GET_BY_ID` calls to pass `number` instead of `string`
- Replace mock API calls with real backend calls
- Update return types to `Backend*Config` types

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

- [x] Create API service layer
- [x] Add TypeScript types from Swagger
- [x] Update API endpoints
- [x] Disable authentication temporarily
- [x] Update constants (base URL)
- [ ] Integrate Screen Builder list page (partial)
- [ ] Integrate Screen Builder create/edit page
- [ ] Integrate Flow Builder pages
- [ ] Integrate Field Mapping page
- [ ] Integrate Validation Builder page
- [ ] Update React Query hooks
- [ ] Test all CRUD operations
- [ ] Test error handling
- [ ] Test clone operations
- [ ] Re-enable authentication
- [ ] Update documentation

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
