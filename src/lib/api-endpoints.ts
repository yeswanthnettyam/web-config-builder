// Authentication APIs
export const AUTH_ENDPOINTS = {
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  REFRESH: '/auth/refresh',
  ME: '/auth/me',
};

// Screen Config APIs
export const SCREEN_CONFIG_ENDPOINTS = {
  LIST: '/configs/screens',
  GET_BY_SCREEN: (screenId: string) => `/configs/screens/${screenId}`,
  GET_VERSIONS: (screenId: string) => `/configs/screens/${screenId}/versions`,
  GET_BY_ID: (configId: string) => `/configs/screens/${configId}`,
  CREATE: '/configs/screens',
  UPDATE: (configId: string) => `/configs/screens/${configId}`,
  ACTIVATE: (configId: string) => `/configs/screens/${configId}/activate`,
  DEPRECATE: (configId: string) => `/configs/screens/${configId}/deprecate`,
  DELETE: (configId: string) => `/configs/screens/${configId}`,
  RESOLVE: '/configs/screens/resolve',
};

// Validation Config APIs
export const VALIDATION_CONFIG_ENDPOINTS = {
  GET_BY_SCREEN: (screenId: string) => `/configs/validations/${screenId}`,
  GET_BY_ID: (configId: string) => `/configs/validations/${configId}`,
  CREATE: '/configs/validations',
  UPDATE: (configId: string) => `/configs/validations/${configId}`,
  ACTIVATE: (configId: string) => `/configs/validations/${configId}/activate`,
  DEPRECATE: (configId: string) => `/configs/validations/${configId}/deprecate`,
};

// Flow Config APIs
export const FLOW_CONFIG_ENDPOINTS = {
  LIST: '/configs/flows',
  GET_BY_ID: (flowId: string) => `/configs/flows/${flowId}`,
  GET_VERSIONS: (flowId: string) => `/configs/flows/${flowId}/versions`,
  CREATE: '/configs/flows',
  UPDATE: (flowId: string) => `/configs/flows/${flowId}`,
  ACTIVATE: (flowId: string) => `/configs/flows/${flowId}/activate`,
  DEPRECATE: (flowId: string) => `/configs/flows/${flowId}/deprecate`,
  DELETE: (flowId: string) => `/configs/flows/${flowId}`,
};

// Field Mapping APIs
export const MAPPING_ENDPOINTS = {
  LIST: '/mappings',
  GET_BY_SCREEN: (screenId: string) => `/mappings/screen/${screenId}`,
  GET_BY_ID: (mappingId: string) => `/mappings/${mappingId}`,
  CREATE: '/mappings',
  UPDATE: (mappingId: string) => `/mappings/${mappingId}`,
  DELETE: (mappingId: string) => `/mappings/${mappingId}`,
  ACTIVATE: (mappingId: string) => `/mappings/${mappingId}/activate`,
  DEPRECATE: (mappingId: string) => `/mappings/${mappingId}/deprecate`,
};

// Master Data APIs
export const MASTER_DATA_ENDPOINTS = {
  PARTNERS: '/master-data/partners',
  BRANCHES: '/master-data/branches',
  PRODUCTS: '/master-data/products',
  SCREENS: '/master-data/screens',
};

// Audit Trail APIs
export const AUDIT_ENDPOINTS = {
  LIST: '/audit/logs',
  GET_BY_CONFIG: (configType: string, configId: string) =>
    `/audit/logs/${configType}/${configId}`,
};

