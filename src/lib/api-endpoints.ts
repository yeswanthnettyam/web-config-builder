// Authentication APIs
export const AUTH_ENDPOINTS = {
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  REFRESH: '/auth/refresh',
  ME: '/auth/me',
};

// Screen Config APIs (Updated to match backend Swagger)
export const SCREEN_CONFIG_ENDPOINTS = {
  LIST: '/configs/screens',
  GET_BY_ID: (configId: number) => `/configs/screens/${configId}`,
  CREATE: '/configs/screens',
  UPDATE: (configId: number) => `/configs/screens/${configId}`,
  DELETE: (configId: number) => `/configs/screens/${configId}`,
  CLONE: (configId: number) => `/configs/screens/${configId}/clone`,
};

// Validation Config APIs (Updated to match backend Swagger)
export const VALIDATION_CONFIG_ENDPOINTS = {
  LIST: '/configs/validations',
  GET_BY_ID: (configId: number) => `/configs/validations/${configId}`,
  CREATE: '/configs/validations',
  UPDATE: (configId: number) => `/configs/validations/${configId}`,
  DELETE: (configId: number) => `/configs/validations/${configId}`,
  CLONE: (configId: number) => `/configs/validations/${configId}/clone`,
};

// Flow Config APIs (Updated to match backend Swagger)
export const FLOW_CONFIG_ENDPOINTS = {
  LIST: '/configs/flows',
  GET_BY_ID: (configId: number) => `/configs/flows/${configId}`,
  CREATE: '/configs/flows',
  UPDATE: (configId: number) => `/configs/flows/${configId}`,
  DELETE: (configId: number) => `/configs/flows/${configId}`,
  CLONE: (configId: number) => `/configs/flows/${configId}/clone`,
};

// Field Mapping APIs (Updated to match backend Swagger)
export const MAPPING_ENDPOINTS = {
  LIST: '/configs/field-mappings',
  GET_BY_ID: (configId: number) => `/configs/field-mappings/${configId}`,
  CREATE: '/configs/field-mappings',
  UPDATE: (configId: number) => `/configs/field-mappings/${configId}`,
  DELETE: (configId: number) => `/configs/field-mappings/${configId}`,
  CLONE: (configId: number) => `/configs/field-mappings/${configId}/clone`,
};

// Master Data APIs
export const MASTER_DATA_ENDPOINTS = {
  PARTNERS: '/master-data/partners',
  BRANCHES: '/master-data/branches',
  PRODUCTS: '/master-data/products',
  SCREENS: '/master-data/screens',
};

// Runtime APIs
export const RUNTIME_ENDPOINTS = {
  NEXT_SCREEN: '/runtime/next-screen',
};

// Audit Trail APIs (Future implementation)
export const AUDIT_ENDPOINTS = {
  LIST: '/audit/logs',
  GET_BY_CONFIG: (configType: string, configId: string) =>
    `/audit/logs/${configType}/${configId}`,
};

