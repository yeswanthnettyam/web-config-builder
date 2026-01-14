# Master Data API Integration Fix

## Issue

The backend master data API (`GET /master-data`) was returning data with the correct structure, but the frontend TypeScript interfaces were expecting different property names, causing the UI to show empty data.

### Backend Response (Correct)
```json
{
  "partners": [
    { "code": "BANDHAN", "name": "Bandhan Bank" }
  ],
  "products": [
    { "code": "PERSONAL_LOAN", "name": "Personal Loan" }
  ],
  "branches": [
    { "code": "AMEERPET", "name": "Ameerpet Branch", "partnerCode": "SAMASTA" }
  ]
}
```

### Frontend Types (Before - Incorrect)
```typescript
interface Partner {
  partnerCode: string;  // ❌ Wrong!
  partnerName: string;  // ❌ Wrong!
  active: boolean;
}
```

## Solution

Updated all frontend TypeScript interfaces and references to match the backend API response structure.

### Updated Types (After - Correct)
```typescript
interface Partner {
  code: string;        // ✅ Matches backend
  name: string;        // ✅ Matches backend
  active?: boolean;    // ✅ Optional (not always in response)
}

interface Product {
  code: string;
  name: string;
  active?: boolean;
}

interface Branch {
  code: string;
  name: string;
  partnerCode: string;  // ✅ Kept as-is (correct in backend)
  active?: boolean;
}
```

## Files Modified

1. **`src/types/index.ts`**
   - Updated `Partner`, `Product`, and `Branch` interfaces
   - Changed property names: `partnerCode` → `code`, `partnerName` → `name`
   - Made `active` optional (not always present in backend response)

2. **`src/components/config/ConfigScopeSelector.tsx`**
   - Updated dropdown mappings: `product.productCode` → `product.code`
   - Updated display labels: `product.productName` → `product.name`
   - Similar updates for partners and branches

3. **`src/components/config/FlowScopeSelector.tsx`**
   - Updated product and partner dropdown mappings
   - Changed property access to match new interface

4. **`src/app/configs/page.tsx`**
   - Updated filter options for products, partners, and branches
   - Changed property access in map functions

5. **`src/app/screen-builder/page.tsx`**
   - Updated partner dropdown options

6. **`src/app/flow-builder/page.tsx`**
   - Updated product and partner filter options

7. **`src/lib/mock-api.ts`**
   - Updated mock data to match new interface structure
   - Ensures backward compatibility for development/testing

## Testing

✅ **Build Status**: Passing  
✅ **Type Checking**: No errors  
✅ **Backward Compatibility**: Mock data updated

### Expected Behavior After Fix

1. **Scope Selectors**: Products, Partners, and Branches now display correctly in dropdowns
2. **Master Data**: Fetched from backend `/master-data` endpoint
3. **Data Structure**: Consistent between frontend and backend
4. **No Empty Dropdowns**: All master data dropdowns populate correctly

### Test Checklist

- [ ] Screen Builder: Product/Partner dropdowns show data
- [ ] Flow Builder: Product/Partner dropdowns show data  
- [ ] Config List: Filter dropdowns show master data
- [ ] All scopes (PRODUCT, PARTNER, BRANCH) work correctly
- [ ] Backend data displays with correct labels (name field)

## Related Changes

This fix is part of the larger backend integration effort:
- See `FLOW_BUILDER_IMPROVEMENTS.md` for related changes
- Master data API endpoint: `GET http://localhost:8080/api/v1/master-data`

---

**Date**: 2026-01-13  
**Status**: ✅ Fixed  
**Build**: ✅ Passing
