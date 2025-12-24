# 🎯 Error Navigation Feature - Complete Guide

## ✨ Overview
The Screen Builder now includes **automatic error navigation** that scrolls to and highlights error fields from top to bottom, making it easy to fix validation errors!

---

## 🚀 Key Features

### 1. **Automatic Scrolling to First Error**
- When validation fails, the system automatically:
  - Switches to the Configuration tab (if you're on Preview)
  - Scrolls smoothly to the **first error field** (top to bottom)
  - Centers the error field in the viewport

### 2. **Visual Highlight Animation**
- Error fields are highlighted with:
  - 🔴 **Red pulsing border** (3 pulse animations)
  - 🌟 **Glowing shadow effect**
  - ⏰ **3-second duration** (auto-removes after)

### 3. **Auto-Focus**
- The error field automatically receives focus
- Allows immediate editing without clicking

### 4. **Error Toast Notification**
- Shows up to **5 validation errors**
- Displays total error count if more than 5
- Remains visible for 8 seconds

---

## 📋 How It Works

### **Step 1: Fill Form with Errors**
Example: Leave Screen ID empty, add section without fields

### **Step 2: Click "Save Configuration"**

### **Step 3: Automatic Error Navigation**
```
1. ✅ Switches to Configuration tab
2. 🎯 Scrolls to Screen ID field (first error)
3. 🔴 Shows red pulsing border
4. 💡 Auto-focuses the field
5. 🗨️ Shows error toast with all errors
```

---

## 🎨 Visual Effects

### **Error Highlight Animation**
```css
🔴 Red Border (2px solid)
🌊 Pulsing Shadow (3 pulses)
⏱️ Duration: 3 seconds
✨ Smooth fade out
```

### **Scroll Behavior**
```javascript
Behavior: Smooth scroll
Position: Center of viewport
Timing: Instant switch + 300ms delay for scroll
```

---

## 📊 Error Priority (Top to Bottom)

Errors are navigated in this order:

1. **Basic Information**
   - Screen ID
   - Screen Name
   - Configuration Title
   - Partner
   - Layout Type

2. **Sections**
   - Section Title
   - Section Content (fields/subsections)

3. **Fields** (within each section)
   - Field ID
   - Field Label
   - Field Type
   - Field-specific properties

4. **SubSections**
   - SubSection Title
   - SubSection Fields

5. **Actions**
   - Action Label
   - API Endpoint
   - HTTP Method

---

## 🧪 Test Scenarios

### **Test 1: Empty Form**
```
1. Open new screen configuration
2. Click "Save Configuration" immediately
3. Result: Scrolls to Screen ID field
4. Visual: Red pulsing border on Screen ID
```

### **Test 2: Missing Section Title**
```
1. Fill basic info
2. Add section but leave title empty
3. Click "Save Configuration"
4. Result: Scrolls to the section accordion
5. Visual: Red pulsing border on section card
```

### **Test 3: Missing Field Properties**
```
1. Fill basic info
2. Add section with field
3. Leave Field ID empty
4. Click "Save Configuration"
5. Result: Scrolls to the field's ID input
6. Visual: Red pulsing border on field input
```

### **Test 4: Invalid Dropdown Configuration**
```
1. Fill basic info
2. Add dropdown field
3. Select "Static JSON" but don't add options
4. Click "Save Configuration"
5. Result: Scrolls to the static data text area
6. Visual: Red pulsing border on the field card
```

### **Test 5: Multiple Errors**
```
1. Leave multiple fields empty
2. Click "Save Configuration"
3. Result: Scrolls to FIRST error only
4. Toast: Shows first 5 errors + count
5. Fix first error and save again
6. Result: Scrolls to NEXT error
```

---

## 🔍 Error Detection Rules

### **Basic Fields**
| Field | Validation |
|-------|-----------|
| Screen ID | Required, cannot be empty |
| Screen Name | Required, cannot be empty |
| Title | Required, cannot be empty |
| Partner | Required, must select from dropdown |
| Layout | Required, must select from dropdown |

### **Sections**
| Rule | Description |
|------|-------------|
| Count | At least 1 section required |
| Title | Each section must have a title |
| Content | Must have either fields OR subsections |

### **Fields**
| Property | Validation |
|----------|-----------|
| Field ID | Required, must be unique |
| Label | Required, cannot be empty |
| Type | Required, must select from dropdown |
| Data Source | Required for DROPDOWN/RADIO types |
| Static Options | Required if data source is Static JSON |
| File Types | Required for FILE_UPLOAD type |
| OTP Channel | Required for OTP_VERIFICATION type |
| Linked Field | Required for OTP_VERIFICATION type |

### **Actions**
| Property | Validation |
|----------|-----------|
| Count | At least 1 action required |
| Label | Required, cannot be empty |
| API Endpoint | Required, cannot be empty |
| HTTP Method | Required, must select from dropdown |

---

## 💡 Pro Tips

### **Tip 1: Fix Errors Top to Bottom**
The system always navigates to the **first** error. Fix it, then save again to find the next error.

### **Tip 2: Use Toast for Error Overview**
The toast shows all errors at once. Use it to understand all issues before fixing.

### **Tip 3: Visual Feedback**
The pulsing red border makes it obvious which field has an error.

### **Tip 4: Auto-Focus Editing**
After scrolling, the field is focused. Just start typing to fix.

### **Tip 5: Preview Before Saving**
Check JSON Preview to catch structural issues early.

---

## 🎯 Complete Workflow Example

### **Scenario: Create Customer Details Screen**

**Step 1: Fill Basic Info (with errors)**
```
✅ Screen ID: (empty) ❌
✅ Screen Name: "Customer Details"
✅ Title: "Customer Details Form"
✅ Partner: "Partner One"
✅ Layout: "FORM"
```

**Step 2: Add Section (with errors)**
```
Section 1:
  ✅ Title: (empty) ❌
  ✅ Type: Fields
  ✅ Fields: (empty) ❌
```

**Step 3: Click "Save Configuration"**

**Step 4: Error Navigation Happens**
```
1. System validates
2. Finds 3 errors:
   - Screen ID is required
   - Section 1: Title is required
   - Section must have at least one field
3. Switches to Configuration tab
4. Scrolls to Screen ID field (first error)
5. Shows red pulsing border on Screen ID
6. Auto-focuses Screen ID input
7. Shows toast with all 3 errors
```

**Step 5: Fix First Error**
```
Enter Screen ID: "customer_details"
```

**Step 6: Click "Save Configuration" Again**

**Step 7: Next Error Navigation**
```
1. System validates
2. Finds 2 remaining errors
3. Scrolls to Section Title (next error)
4. Shows red pulsing border
5. Shows toast with remaining errors
```

**Step 8: Fix All Errors**
```
Section Title: "Personal Information"
Add Field: full_name (TEXT)
```

**Step 9: Save Successfully**
```
✅ All validations pass
✅ Green success toast
✅ Redirects to Screen Builder list
```

---

## 🔧 Technical Details

### **Validation Flow**
```javascript
onSubmit() {
  1. validateConfiguration(data)
  2. Returns: { errors: [], firstErrorField: 'fieldName' }
  3. If errors exist:
     a. Switch to Configuration tab
     b. Call scrollToField(firstErrorField)
     c. Show error toast
     d. Block save
  4. If no errors:
     a. Build config
     b. Call API
     c. Show success
     d. Redirect
}
```

### **Scroll Function**
```javascript
scrollToField(fieldName) {
  1. Find element by name attribute
  2. If not found, try data-field-id
  3. If not found, try section accordion
  4. Scroll to element (smooth, center)
  5. Add error-highlight class
  6. Auto-focus input after 500ms
  7. Remove class after 3000ms
}
```

### **CSS Animation**
```css
.error-highlight {
  animation: errorPulse 0.6s ease-in-out 3;
  border: 2px solid #d32f2f;
}

@keyframes errorPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(211, 47, 47, 0); }
  50%      { box-shadow: 0 0 0 8px rgba(211, 47, 47, 0.3); }
}
```

---

## ✅ Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Smooth Scroll | ✅ | ✅ | ✅ | ✅ |
| CSS Animation | ✅ | ✅ | ✅ | ✅ |
| Auto Focus | ✅ | ✅ | ✅ | ✅ |
| Toast Notifications | ✅ | ✅ | ✅ | ✅ |

---

## 🎊 Benefits

1. **⚡ Faster Error Fixing**: No manual scrolling needed
2. **🎯 Clear Visual Feedback**: Pulsing red border is unmistakable
3. **📱 Better UX**: Smooth animations and auto-focus
4. **🔍 Easy Discovery**: Errors found top to bottom
5. **💯 Complete Validation**: All fields checked
6. **🚀 Productivity Boost**: Fix errors in seconds

---

## 🚀 Access the Feature

**URL**: http://localhost:3001/screen-builder/new

**Try It Now**:
1. Open the URL
2. Click "Save Configuration" without filling anything
3. Watch the magic happen! ✨

---

## 📝 Summary

The error navigation feature provides:
- ✅ Automatic scrolling to first error
- ✅ Visual pulsing highlight animation
- ✅ Auto-focus for immediate editing
- ✅ Clear error messages in toast
- ✅ Top-to-bottom error priority
- ✅ Smooth user experience

**Result**: Validation errors are now easy to find and fix! 🎉

