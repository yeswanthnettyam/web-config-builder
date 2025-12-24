# 🎯 Validation Builder & Field Mapping Guide

## ✅ What's Implemented

### **1. Validation Builder** ✨
- ✅ Select previously created screens
- ✅ Automatically load fields from selected screen
- ✅ Add multiple validation rules
- ✅ Save to cache storage
- ✅ View all validation configs
- ✅ Delete configurations

### **2. Field Mapping** ✨
- ✅ Select previously created screens
- ✅ Automatically load fields from selected screen
- ✅ Map UI fields to database columns
- ✅ Add transformers
- ✅ Save to cache storage
- ✅ View all mapping configs
- ✅ Delete configurations

---

## 🚀 Complete Workflow

### **Phase 1: Create Screen Configuration**

#### **Step 1: Go to Screen Builder**
```
URL: http://localhost:3001/screen-builder
```

#### **Step 2: Create Screen**
```
Screen ID:   customer_details
Screen Name: Customer Details
Title:       Customer Details Form
Partner:     Partner One

Section: Personal Information
Fields:
  - full_name (TEXT)
  - email (TEXT, keyboard: email)
  - mobile (NUMBER, keyboard: tel)
  - marital_status (DROPDOWN)

Actions:
  - Submit (/api/submit, POST)
```

#### **Step 3: Activate Screen**
```
Click ⋮ → Activate
Status: DRAFT → ACTIVE ✅
```

**Important**: Only ACTIVE screens appear in other modules!

---

### **Phase 2: Add Validations**

#### **Step 1: Go to Validation Builder**
```
URL: http://localhost:3001/validation-builder
```

#### **Step 2: Click "New Validation Config"**

#### **Step 3: Select Screen**
```
Screen: Customer Details (customer_details)
```

Once selected, the field dropdown will populate with:
- full_name
- email
- mobile
- marital_status

#### **Step 4: Click "Add Rule"**

#### **Step 5: Configure Validation Rule**

**Example 1: Email Validation**
```
Field ID:        email
Validation Type: REGEX
Pattern:         ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$
Error Message:   Please enter a valid email address
Execution:       BOTH (Client & Server)
```

**Example 2: Mobile Validation**
```
Field ID:        mobile
Validation Type: LENGTH
Min:             10
Max:             10
Error Message:   Mobile number must be exactly 10 digits
Execution:       BOTH
```

**Example 3: Name Required**
```
Field ID:        full_name
Validation Type: REQUIRED
Error Message:   Full name is required
Execution:       CLIENT
```

#### **Step 6: Add More Rules**
Click "Add Rule" for each field validation

#### **Step 7: Save Configuration**
- Click "Save Configuration"
- ✅ Saved to cache
- ✅ Success toast shown
- ✅ Returns to list page

---

### **Phase 3: Add Field Mappings**

#### **Step 1: Go to Field Mapping**
```
URL: http://localhost:3001/field-mapping
```

#### **Step 2: Click "New Field Mapping"**

#### **Step 3: Select Screen**
```
Screen: Customer Details (customer_details)
```

Fields populate automatically:
- full_name
- email
- mobile
- marital_status

#### **Step 4: Click "Add Mapping"**

#### **Step 5: Configure Field Mapping**

**Example 1: Direct Mapping**
```
UI Field:       full_name
Mapping Type:   DIRECT
Transformer:    -
DB Column:      customer_name
Table:          customers
Data Type:      VARCHAR(255)
```

**Example 2: Email with Lowercase Transform**
```
UI Field:       email
Mapping Type:   TRANSFORMED
Transformer:    LOWERCASE
DB Column:      email_address
Table:          customers
Data Type:      VARCHAR(255)
```

**Example 3: Mobile with Formatting**
```
UI Field:       mobile
Mapping Type:   TRANSFORMED
Transformer:    PHONE_FORMAT
DB Column:      mobile_number
Table:          customers
Data Type:      VARCHAR(15)
```

**Example 4: Dropdown Value**
```
UI Field:       marital_status
Mapping Type:   DIRECT
Transformer:    -
DB Column:      marital_status
Table:          customers
Data Type:      VARCHAR(20)
```

#### **Step 6: Add More Mappings**
Click "Add Mapping" for each field

#### **Step 7: Save Configuration**
- Click "Save Configuration"
- ✅ Saved to cache
- ✅ Success toast shown
- ✅ Returns to list page

---

## 📊 How It Works

### **Screen Selection Flow**

```
┌─────────────────────────────────────────────┐
│ 1. Create Screen in Screen Builder         │
│    - Add fields                             │
│    - Add actions                            │
│    - Save as DRAFT                          │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│ 2. Activate Screen                          │
│    - Click ⋮ → Activate                     │
│    - Status: DRAFT → ACTIVE                 │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│ 3. Screen Appears in Dropdowns              │
│    - Validation Builder ✅                  │
│    - Field Mapping ✅                       │
│    - Flow Builder ✅                        │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│ 4. Select Screen                            │
│    - Choose from dropdown                   │
│    - Fields load automatically              │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│ 5. Add Validations/Mappings                │
│    - Select field from dropdown             │
│    - Configure rules/mappings               │
│    - Save to cache                          │
└─────────────────────────────────────────────┘
```

---

## 🎨 Field Loading

### **Automatic Field Extraction**

When you select a screen, the system:

1. **Loads Screen Config from Cache**
```javascript
const screenConfig = getScreenConfigByScreenId(selectedScreenId);
```

2. **Extracts All Fields**
```javascript
// From sections with fields
section.fields → [field1, field2, ...]

// From subsections
section.subSections[].fields → [field1, field2, ...]
```

3. **Populates Dropdown**
```javascript
Available Fields:
- full_name
- email
- mobile
- marital_status
```

4. **Enable Selection**
```javascript
<MenuItem value="full_name">full_name</MenuItem>
<MenuItem value="email">email</MenuItem>
...
```

---

## 📋 Data Structure

### **Validation Config in Cache**

```javascript
localStorage['los_validation_configs'] = [
  {
    id: "validation_customer_details_1703123456789",
    screenId: "customer_details",
    version: "1.0",
    validations: {
      rules: [
        {
          id: "rule_1",
          fieldId: "email",
          type: "REGEX",
          pattern: "^[a-zA-Z0-9._%+-]+@...",
          message: "Please enter a valid email",
          executionTarget: "BOTH"
        },
        {
          id: "rule_2",
          fieldId: "mobile",
          type: "LENGTH",
          min: 10,
          max: 10,
          message: "Mobile must be 10 digits",
          executionTarget: "BOTH"
        }
      ]
    },
    createdAt: "2024-12-24T10:30:00Z",
    updatedAt: "2024-12-24T10:30:00Z"
  }
]
```

### **Mapping Config in Cache**

```javascript
localStorage['los_mapping_configs'] = [
  {
    id: "mapping_customer_details_1703123456789",
    screenId: "customer_details",
    version: "1.0",
    mappings: {
      fields: [
        {
          fieldId: "full_name",
          mappingType: "DIRECT",
          dbColumn: "customer_name",
          table: "customers",
          dataType: "VARCHAR(255)"
        },
        {
          fieldId: "email",
          mappingType: "TRANSFORMED",
          transformer: "LOWERCASE",
          dbColumn: "email_address",
          table: "customers",
          dataType: "VARCHAR(255)"
        }
      ]
    },
    createdAt: "2024-12-24T10:35:00Z",
    updatedAt: "2024-12-24T10:35:00Z"
  }
]
```

---

## 🧪 Testing the Complete Flow

### **End-to-End Test**

#### **Step 1: Create Screen**
```
1. Go to Screen Builder
2. Create "customer_details" with 4 fields:
   - full_name
   - email  
   - mobile
   - marital_status
3. Activate the screen
```

#### **Step 2: Add Validations**
```
1. Go to Validation Builder
2. Select "customer_details"
3. See 4 fields in dropdown ✅
4. Add validation for email (REGEX)
5. Add validation for mobile (LENGTH)
6. Save
7. Check list page - 1 config shown ✅
```

#### **Step 3: Add Mappings**
```
1. Go to Field Mapping
2. Select "customer_details"
3. See 4 fields in dropdown ✅
4. Add mapping for each field
5. Save
6. Check list page - 1 config shown ✅
```

#### **Step 4: Verify Cache**
```javascript
// Open browser console (F12)

// Check validations
JSON.parse(localStorage.getItem('los_validation_configs'))

// Check mappings
JSON.parse(localStorage.getItem('los_mapping_configs'))
```

---

## 🎯 Key Features

### **1. Only ACTIVE Screens Show**
```javascript
// Hook automatically filters
const activeConfigs = cachedConfigs.filter(
  config => config.status === 'ACTIVE'
);
```

This ensures only ready-to-use screens appear!

### **2. Real-Time Field Loading**
```javascript
useEffect(() => {
  if (selectedScreenId) {
    // Load screen config
    // Extract fields
    // Update dropdown
  }
}, [selectedScreenId]);
```

Fields update immediately when screen selected!

### **3. Field Dropdown (Not Text Input)**
```javascript
<TextField
  select
  disabled={!selectedScreenId}
>
  {availableFields.map(fieldId => (
    <MenuItem value={fieldId}>{fieldId}</MenuItem>
  ))}
</TextField>
```

No typing errors - just select from list!

### **4. Cache Storage**
```javascript
// Save validation
saveValidationConfig({
  id: `validation_${screenId}_${timestamp}`,
  screenId,
  validations: { rules }
});

// Save mapping
saveMappingConfig({
  id: `mapping_${screenId}_${timestamp}`,
  screenId,
  mappings: { fields }
});
```

All saved locally, no backend needed!

---

## ⚠️ Important Notes

### **1. Activate Screens First**
```
Screen Status: DRAFT ❌ (Won't appear in dropdowns)
Screen Status: ACTIVE ✅ (Appears in dropdowns)
```

### **2. Field Extraction**
Fields are extracted from:
- `section.fields[]`
- `section.subSections[].fields[]`

All field IDs are collected automatically!

### **3. Multiple Configs Per Screen**
You can create:
- Multiple validation configs for same screen
- Multiple mapping configs for same screen

Each gets a unique ID with timestamp.

### **4. Cache Persistence**
All configs persist in localStorage:
- Survives page refresh
- Survives browser restart
- Survives computer restart

---

## 🔍 View Cache Data

### **Browser Console Commands**

```javascript
// View all validation configs
console.table(
  JSON.parse(localStorage.getItem('los_validation_configs'))
);

// View all mapping configs
console.table(
  JSON.parse(localStorage.getItem('los_mapping_configs'))
);

// Count validation rules for a screen
const validations = JSON.parse(
  localStorage.getItem('los_validation_configs')
);
const customerValidations = validations.find(
  v => v.screenId === 'customer_details'
);
console.log('Rules:', customerValidations.validations.rules.length);

// Count mappings for a screen
const mappings = JSON.parse(
  localStorage.getItem('los_mapping_configs')
);
const customerMappings = mappings.find(
  m => m.screenId === 'customer_details'
);
console.log('Mappings:', customerMappings.mappings.fields.length);
```

---

## 🎊 Summary

### **What You Can Do Now**:

1. ✅ **Create screens** in Screen Builder
2. ✅ **Activate screens** to make them available
3. ✅ **Select screens** in Validation Builder
4. ✅ **Select fields** from dropdown (auto-populated)
5. ✅ **Add validation rules** for each field
6. ✅ **Save validations** to cache
7. ✅ **Select screens** in Field Mapping
8. ✅ **Select fields** from dropdown (auto-populated)
9. ✅ **Map fields** to database columns
10. ✅ **Save mappings** to cache
11. ✅ **View all configs** in list pages
12. ✅ **Delete configs** when needed

### **Complete Integration**:
- Screen Builder → Validation Builder ✅
- Screen Builder → Field Mapping ✅
- All data cached locally ✅
- No backend needed ✅

---

## 🚀 Start Testing!

**URLs**:
- Screen Builder: http://localhost:3001/screen-builder
- Validation Builder: http://localhost:3001/validation-builder
- Field Mapping: http://localhost:3001/field-mapping

Create a screen, activate it, then add validations and mappings! 🎉

