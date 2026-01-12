# Swagger API Verification Checklist

## How to Verify Activation Endpoints in Swagger

Visit: `http://localhost:8080/swagger-ui/index.html`

---

## ✅ Endpoints to Verify

### 1. **Screen Config Activation**

**Expected Endpoints:**
```
POST /api/v1/configs/screens/{configId}/activate
POST /api/v1/configs/screens/{configId}/deprecate
```

**To Verify in Swagger:**
1. Navigate to **screen-config-controller** section
2. Look for `POST /configs/screens/{configId}/activate`
3. Expand the endpoint
4. Check parameters: `configId` (path parameter, integer)
5. Check response: Returns `BackendScreenConfig` with status = "ACTIVE"

**Frontend Code Using:**
```typescript
// src/api/screenConfig.api.ts
async activate(configId: number): Promise<BackendScreenConfig> {
  return apiClient.post<BackendScreenConfig>(
    SCREEN_CONFIG_ENDPOINTS.ACTIVATE(configId)
  );
}
```

---

### 2. **Flow Config Activation**

**Expected Endpoints:**
```
POST /api/v1/configs/flows/{configId}/activate
POST /api/v1/configs/flows/{configId}/deprecate
```

**To Verify in Swagger:**
1. Navigate to **flow-config-controller** section
2. Look for `POST /configs/flows/{configId}/activate`
3. Expand the endpoint
4. Check parameters: `configId` (path parameter, integer)
5. Check response: Returns `BackendFlowConfig` with status = "ACTIVE"

**Frontend Code Using:**
```typescript
// src/api/flowConfig.api.ts
async activate(configId: number): Promise<BackendFlowConfig> {
  return apiClient.post<BackendFlowConfig>(
    FLOW_CONFIG_ENDPOINTS.ACTIVATE(configId)
  );
}
```

---

### 3. **Validation Config Activation** ⚠️ CRITICAL

**Expected Endpoints:**
```
POST /api/v1/configs/validations/{configId}/activate
POST /api/v1/configs/validations/{configId}/deprecate
```

**To Verify in Swagger:**
1. Navigate to **validation-config-controller** section
2. Look for `POST /configs/validations/{configId}/activate`
3. Expand the endpoint
4. Check parameters: `configId` (path parameter, integer)
5. Check response: Returns `BackendValidationConfig` with status = "ACTIVE"

**Frontend Code Using:**
```typescript
// src/api/validationConfig.api.ts
async activate(configId: number): Promise<BackendValidationConfig> {
  return apiClient.post<BackendValidationConfig>(
    VALIDATION_CONFIG_ENDPOINTS.ACTIVATE(configId)
  );
}
```

---

### 4. **Field Mapping Config Activation**

**Expected Endpoints:**
```
POST /api/v1/configs/field-mappings/{configId}/activate
POST /api/v1/configs/field-mappings/{configId}/deprecate
```

**To Verify in Swagger:**
1. Navigate to **field-mapping-config-controller** section
2. Look for `POST /configs/field-mappings/{configId}/activate`
3. Expand the endpoint
4. Check parameters: `configId` (path parameter, integer)
5. Check response: Returns `BackendFieldMappingConfig` with status = "ACTIVE"

**Frontend Code Using:**
```typescript
// src/api/fieldMapping.api.ts
async activate(configId: number): Promise<BackendFieldMappingConfig> {
  return apiClient.post<BackendFieldMappingConfig>(
    MAPPING_ENDPOINTS.ACTIVATE(configId)
  );
}
```

---

## 🔍 What to Look For in Each Endpoint

### Request Details:
- **HTTP Method:** POST
- **Path Parameter:** `configId` (integer, required)
- **Request Body:** None (empty POST request)
- **Authentication:** Token required (if your backend uses auth)

### Response Details:
- **Success Response (200 OK):**
  ```json
  {
    "configId": 123,
    "status": "ACTIVE",
    "version": "1.0",
    "screenId": "KYC_FORM",
    "uiConfig": { ... },
    "createdBy": "user@example.com",
    "updatedAt": "2026-01-12T15:30:00",
    ...
  }
  ```

- **Error Responses:**
  - `404 Not Found` - Config with ID doesn't exist
  - `400 Bad Request` - Config is not in DRAFT status
  - `409 Conflict` - Activation conflict (shouldn't happen)

---

## 🧪 Testing in Swagger UI

### For Each Endpoint:

1. **Expand the endpoint** (click on it)
2. **Click "Try it out"** button
3. **Enter a configId** (use an existing DRAFT config ID)
4. **Click "Execute"** button
5. **Verify Response:**
   - Status code should be `200`
   - Response body should have `status: "ACTIVE"`
   - Any previous ACTIVE config should now be DEPRECATED

---

## ❌ What if Endpoints Don't Exist?

### If activation endpoints are MISSING from Swagger:

You have **two options**:

### Option 1: Request Backend Team to Add Endpoints (RECOMMENDED)

**Backend needs to implement:**

```java
@PostMapping("/{configId}/activate")
public ResponseEntity<ConfigResponse> activateConfig(@PathVariable Long configId) {
    // 1. Find config by ID
    Config config = configRepository.findById(configId)
        .orElseThrow(() -> new NotFoundException("Config not found"));
    
    // 2. Validate: Must be DRAFT
    if (!config.getStatus().equals(Status.DRAFT)) {
        throw new BadRequestException("Only DRAFT configs can be activated");
    }
    
    // 3. Find existing ACTIVE config with same scope
    Optional<Config> existingActive = configRepository
        .findByScreenIdAndStatus(config.getScreenId(), Status.ACTIVE);
    
    // 4. Transaction: Set new ACTIVE, deprecate old
    if (existingActive.isPresent()) {
        existingActive.get().setStatus(Status.DEPRECATED);
        configRepository.save(existingActive.get());
    }
    
    config.setStatus(Status.ACTIVE);
    Config activated = configRepository.save(config);
    
    return ResponseEntity.ok(toResponse(activated));
}
```

### Option 2: Modify Frontend to Use Status Update (WORKAROUND)

If activation endpoints don't exist, we can use PUT/PATCH to update status:

**Modify frontend API calls:**

```typescript
// Instead of:
async activate(configId: number): Promise<BackendValidationConfig> {
  return apiClient.post<BackendValidationConfig>(
    VALIDATION_CONFIG_ENDPOINTS.ACTIVATE(configId)
  );
}

// Use:
async activate(configId: number): Promise<BackendValidationConfig> {
  return apiClient.put<BackendValidationConfig>(
    VALIDATION_CONFIG_ENDPOINTS.UPDATE(configId),
    { status: 'ACTIVE' }
  );
}
```

**⚠️ WARNING:** This workaround has limitations:
- Won't automatically deprecate old ACTIVE configs
- Backend may reject status change if validation exists
- May allow multiple ACTIVE configs (data integrity issue)

---

## 🎯 Verification Steps (Do This Now)

### Step 1: Open Swagger
```
http://localhost:8080/swagger-ui/index.html
```

### Step 2: Check Each Controller

- [ ] **screen-config-controller**
  - [ ] Has `/configs/screens/{configId}/activate`
  - [ ] Has `/configs/screens/{configId}/deprecate`

- [ ] **flow-config-controller**
  - [ ] Has `/configs/flows/{configId}/activate`
  - [ ] Has `/configs/flows/{configId}/deprecate`

- [ ] **validation-config-controller** ⚠️
  - [ ] Has `/configs/validations/{configId}/activate`
  - [ ] Has `/configs/validations/{configId}/deprecate`

- [ ] **field-mapping-config-controller**
  - [ ] Has `/configs/field-mappings/{configId}/activate`
  - [ ] Has `/configs/field-mappings/{configId}/deprecate`

### Step 3: Test ONE Endpoint

Pick one endpoint (e.g., validation activate) and test it:

1. Create a DRAFT validation config first (if needed)
2. Note its `configId`
3. Go to Swagger: `POST /configs/validations/{configId}/activate`
4. Click "Try it out"
5. Enter the `configId`
6. Click "Execute"
7. Check response status and body

### Step 4: Report Back

**If endpoints exist:** ✅ Great! Frontend is ready to use them.

**If endpoints don't exist:** ❌ You need to either:
- Ask backend team to implement activation endpoints
- Use the workaround (status update via PUT)

---

## 📝 Quick Check Command (Alternative)

If you have `curl` available, test from terminal:

```bash
# Check if validation activate endpoint exists
curl -X POST "http://localhost:8080/api/v1/configs/validations/1/activate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Expected:
# - 200 OK → Endpoint exists and worked
# - 404 Not Found (on configId) → Endpoint exists, but config ID wrong
# - 404 Not Found (on endpoint) → Endpoint doesn't exist in backend
# - 401 Unauthorized → Need auth token
```

---

## 🚨 IMPORTANT: Backend Must Support This

The frontend implementation assumes these endpoints exist. If they don't exist in your backend:

**❌ Frontend will fail with:**
- Network errors (404)
- "Failed to activate configuration" error messages
- Console errors about missing endpoints

**✅ Backend MUST implement:**
- Activation endpoints for all 4 config types
- Auto-deprecation of old ACTIVE configs
- Status validation (only DRAFT can be activated)
- Scope-based activation (one ACTIVE per scope)

---

## 📞 Next Steps

1. **Check Swagger UI now** using the checklist above
2. **Test at least one activation endpoint** in Swagger
3. **Report back if endpoints are missing**
4. **If missing:** Decide between requesting backend changes or using workaround

---

**Created:** January 12, 2026  
**Purpose:** Verify backend activation endpoints before using frontend
