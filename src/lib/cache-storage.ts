/**
 * Client-side cache storage for configurations
 * Uses localStorage for persistence across sessions
 */

export interface CachedScreenConfig {
  id: string;
  screenId: string;
  screenName: string;
  version: string;
  status: 'DRAFT' | 'ACTIVE' | 'DEPRECATED';
  config: any;
  createdAt: string;
  updatedAt: string;
}

export interface CachedValidationConfig {
  id: string;
  screenId: string;
  version: string;
  validations: any;
  createdAt: string;
  updatedAt: string;
}

export interface CachedMappingConfig {
  id: string;
  screenId: string;
  version: string;
  mappings: any;
  createdAt: string;
  updatedAt: string;
}

export interface CachedFlowConfig {
  id: string;
  flowId: string;
  flowName: string;
  version: string;
  status: 'DRAFT' | 'ACTIVE' | 'DEPRECATED';
  config: any;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEYS = {
  SCREEN_CONFIGS: 'los_screen_configs',
  VALIDATION_CONFIGS: 'los_validation_configs',
  MAPPING_CONFIGS: 'los_mapping_configs',
  FLOW_CONFIGS: 'los_flow_configs',
};

// Helper to safely parse JSON from localStorage
const safeJSONParse = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error parsing ${key} from localStorage:`, error);
    return defaultValue;
  }
};

// Helper to safely stringify and save to localStorage
const safeJSONStringify = (key: string, value: any): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
};

// ==================== SCREEN CONFIGS ====================

export const getAllScreenConfigs = (): CachedScreenConfig[] => {
  return safeJSONParse<CachedScreenConfig[]>(STORAGE_KEYS.SCREEN_CONFIGS, []);
};

export const getScreenConfigById = (id: string): CachedScreenConfig | null => {
  const configs = getAllScreenConfigs();
  return configs.find((c) => c.id === id) || null;
};

export const getScreenConfigByScreenId = (screenId: string): CachedScreenConfig | null => {
  const configs = getAllScreenConfigs();
  return configs.find((c) => c.screenId === screenId) || null;
};

export const saveScreenConfig = (config: Omit<CachedScreenConfig, 'createdAt' | 'updatedAt'>): CachedScreenConfig => {
  const configs = getAllScreenConfigs();
  const existingIndex = configs.findIndex((c) => c.id === config.id);
  
  const now = new Date().toISOString();
  const savedConfig: CachedScreenConfig = {
    ...config,
    createdAt: existingIndex >= 0 ? configs[existingIndex].createdAt : now,
    updatedAt: now,
  };

  if (existingIndex >= 0) {
    configs[existingIndex] = savedConfig;
  } else {
    configs.push(savedConfig);
  }

  safeJSONStringify(STORAGE_KEYS.SCREEN_CONFIGS, configs);
  return savedConfig;
};

export const deleteScreenConfig = (id: string): void => {
  const configs = getAllScreenConfigs();
  const filtered = configs.filter((c) => c.id !== id);
  safeJSONStringify(STORAGE_KEYS.SCREEN_CONFIGS, filtered);
};

export const updateScreenConfigStatus = (id: string, status: 'DRAFT' | 'ACTIVE' | 'DEPRECATED'): void => {
  const configs = getAllScreenConfigs();
  const config = configs.find((c) => c.id === id);
  if (config) {
    config.status = status;
    config.updatedAt = new Date().toISOString();
    safeJSONStringify(STORAGE_KEYS.SCREEN_CONFIGS, configs);
  }
};

// ==================== VALIDATION CONFIGS ====================

export const getAllValidationConfigs = (): CachedValidationConfig[] => {
  return safeJSONParse<CachedValidationConfig[]>(STORAGE_KEYS.VALIDATION_CONFIGS, []);
};

export const getValidationConfigById = (id: string): CachedValidationConfig | null => {
  const configs = getAllValidationConfigs();
  return configs.find((c) => c.id === id) || null;
};

export const getValidationConfigByScreenId = (screenId: string): CachedValidationConfig | null => {
  const configs = getAllValidationConfigs();
  return configs.find((c) => c.screenId === screenId) || null;
};

export const saveValidationConfig = (config: Omit<CachedValidationConfig, 'createdAt' | 'updatedAt'>): CachedValidationConfig => {
  const configs = getAllValidationConfigs();
  const existingIndex = configs.findIndex((c) => c.id === config.id);
  
  const now = new Date().toISOString();
  const savedConfig: CachedValidationConfig = {
    ...config,
    createdAt: existingIndex >= 0 ? configs[existingIndex].createdAt : now,
    updatedAt: now,
  };

  if (existingIndex >= 0) {
    configs[existingIndex] = savedConfig;
  } else {
    configs.push(savedConfig);
  }

  safeJSONStringify(STORAGE_KEYS.VALIDATION_CONFIGS, configs);
  return savedConfig;
};

export const deleteValidationConfig = (id: string): void => {
  const configs = getAllValidationConfigs();
  const filtered = configs.filter((c) => c.id !== id);
  safeJSONStringify(STORAGE_KEYS.VALIDATION_CONFIGS, filtered);
};

// ==================== MAPPING CONFIGS ====================

export const getAllMappingConfigs = (): CachedMappingConfig[] => {
  return safeJSONParse<CachedMappingConfig[]>(STORAGE_KEYS.MAPPING_CONFIGS, []);
};

export const getMappingConfigById = (id: string): CachedMappingConfig | null => {
  const configs = getAllMappingConfigs();
  return configs.find((c) => c.id === id) || null;
};

export const getMappingConfigByScreenId = (screenId: string): CachedMappingConfig | null => {
  const configs = getAllMappingConfigs();
  return configs.find((c) => c.screenId === screenId) || null;
};

export const saveMappingConfig = (config: Omit<CachedMappingConfig, 'createdAt' | 'updatedAt'>): CachedMappingConfig => {
  const configs = getAllMappingConfigs();
  const existingIndex = configs.findIndex((c) => c.id === config.id);
  
  const now = new Date().toISOString();
  const savedConfig: CachedMappingConfig = {
    ...config,
    createdAt: existingIndex >= 0 ? configs[existingIndex].createdAt : now,
    updatedAt: now,
  };

  if (existingIndex >= 0) {
    configs[existingIndex] = savedConfig;
  } else {
    configs.push(savedConfig);
  }

  safeJSONStringify(STORAGE_KEYS.MAPPING_CONFIGS, configs);
  return savedConfig;
};

export const deleteMappingConfig = (id: string): void => {
  const configs = getAllMappingConfigs();
  const filtered = configs.filter((c) => c.id !== id);
  safeJSONStringify(STORAGE_KEYS.MAPPING_CONFIGS, filtered);
};

// ==================== FLOW CONFIGS ====================

export const getAllFlowConfigs = (): CachedFlowConfig[] => {
  return safeJSONParse<CachedFlowConfig[]>(STORAGE_KEYS.FLOW_CONFIGS, []);
};

export const getFlowConfigById = (id: string): CachedFlowConfig | null => {
  const configs = getAllFlowConfigs();
  return configs.find((c) => c.id === id) || null;
};

export const getFlowConfigByFlowId = (flowId: string): CachedFlowConfig | null => {
  const configs = getAllFlowConfigs();
  return configs.find((c) => c.flowId === flowId) || null;
};

export const saveFlowConfig = (config: Omit<CachedFlowConfig, 'createdAt' | 'updatedAt'>): CachedFlowConfig => {
  const configs = getAllFlowConfigs();
  const existingIndex = configs.findIndex((c) => c.id === config.id);
  
  const now = new Date().toISOString();
  const savedConfig: CachedFlowConfig = {
    ...config,
    createdAt: existingIndex >= 0 ? configs[existingIndex].createdAt : now,
    updatedAt: now,
  };

  if (existingIndex >= 0) {
    configs[existingIndex] = savedConfig;
  } else {
    configs.push(savedConfig);
  }

  safeJSONStringify(STORAGE_KEYS.FLOW_CONFIGS, configs);
  return savedConfig;
};

export const deleteFlowConfig = (id: string): void => {
  const configs = getAllFlowConfigs();
  const filtered = configs.filter((c) => c.id !== id);
  safeJSONStringify(STORAGE_KEYS.FLOW_CONFIGS, filtered);
};

export const updateFlowConfigStatus = (id: string, status: 'DRAFT' | 'ACTIVE' | 'DEPRECATED'): void => {
  const configs = getAllFlowConfigs();
  const config = configs.find((c) => c.id === id);
  if (config) {
    config.status = status;
    config.updatedAt = new Date().toISOString();
    safeJSONStringify(STORAGE_KEYS.FLOW_CONFIGS, configs);
  }
};

// ==================== UTILITY FUNCTIONS ====================

export const clearAllConfigs = (): void => {
  localStorage.removeItem(STORAGE_KEYS.SCREEN_CONFIGS);
  localStorage.removeItem(STORAGE_KEYS.VALIDATION_CONFIGS);
  localStorage.removeItem(STORAGE_KEYS.MAPPING_CONFIGS);
  localStorage.removeItem(STORAGE_KEYS.FLOW_CONFIGS);
};

export const exportAllConfigs = () => {
  return {
    screenConfigs: getAllScreenConfigs(),
    validationConfigs: getAllValidationConfigs(),
    mappingConfigs: getAllMappingConfigs(),
    flowConfigs: getAllFlowConfigs(),
    exportedAt: new Date().toISOString(),
  };
};

export const importAllConfigs = (data: {
  screenConfigs?: CachedScreenConfig[];
  validationConfigs?: CachedValidationConfig[];
  mappingConfigs?: CachedMappingConfig[];
  flowConfigs?: CachedFlowConfig[];
}) => {
  if (data.screenConfigs) {
    safeJSONStringify(STORAGE_KEYS.SCREEN_CONFIGS, data.screenConfigs);
  }
  if (data.validationConfigs) {
    safeJSONStringify(STORAGE_KEYS.VALIDATION_CONFIGS, data.validationConfigs);
  }
  if (data.mappingConfigs) {
    safeJSONStringify(STORAGE_KEYS.MAPPING_CONFIGS, data.mappingConfigs);
  }
  if (data.flowConfigs) {
    safeJSONStringify(STORAGE_KEYS.FLOW_CONFIGS, data.flowConfigs);
  }
};

