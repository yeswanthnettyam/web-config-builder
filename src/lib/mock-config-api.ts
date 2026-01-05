// Mock API handlers for config management with hierarchy support
// This simulates backend behavior for PRODUCT -> PARTNER -> BRANCH hierarchy

import { delay } from './mock-api';
import {
  ScreenConfig,
  ConfigScope,
  ResolvedConfig,
  PaginatedResponse,
  ConfigStatus,
} from '@/types';

// In-memory storage for mock configs (simulates database)
let mockConfigsStore: ScreenConfig[] = [];

// Initialize with sample hierarchy configs
export function initializeMockConfigs() {
  mockConfigsStore = [
    // PRODUCT level configs (base)
    {
      configId: 'config_product_pl_personal',
      screenId: 'personal_details',
      title: 'Personal Details - Product Level',
      version: 1,
      status: 'ACTIVE',
      scope: {
        type: 'PRODUCT',
        productCode: 'PL',
      },
      ui: {
        layout: 'FORM',
        sections: [],
        actions: [],
      },
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
      createdBy: 'admin@kaleidofin.com',
      updatedBy: 'admin@kaleidofin.com',
    },
    {
      configId: 'config_product_pl_income',
      screenId: 'income_details',
      title: 'Income Details - Product Level',
      version: 1,
      status: 'ACTIVE',
      scope: {
        type: 'PRODUCT',
        productCode: 'PL',
      },
      ui: {
        layout: 'FORM',
        sections: [],
        actions: [],
      },
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
      createdBy: 'admin@kaleidofin.com',
      updatedBy: 'admin@kaleidofin.com',
    },
    // PARTNER level configs (overrides)
    {
      configId: 'config_partner_pl_p001_personal',
      screenId: 'personal_details',
      title: 'Personal Details - Partner Override',
      version: 1,
      status: 'ACTIVE',
      scope: {
        type: 'PARTNER',
        productCode: 'PL',
        partnerCode: 'PARTNER_001',
      },
      ui: {
        layout: 'FORM',
        sections: [],
        actions: [],
      },
      createdAt: '2025-01-02T00:00:00Z',
      updatedAt: '2025-01-02T00:00:00Z',
      createdBy: 'admin@kaleidofin.com',
      updatedBy: 'admin@kaleidofin.com',
    },
    // BRANCH level configs (overrides)
    {
      configId: 'config_branch_pl_p001_b001_personal',
      screenId: 'personal_details',
      title: 'Personal Details - Branch Override',
      version: 1,
      status: 'ACTIVE',
      scope: {
        type: 'BRANCH',
        productCode: 'PL',
        partnerCode: 'PARTNER_001',
        branchCode: 'BRANCH_001',
      },
      ui: {
        layout: 'FORM',
        sections: [],
        actions: [],
      },
      createdAt: '2025-01-03T00:00:00Z',
      updatedAt: '2025-01-03T00:00:00Z',
      createdBy: 'admin@kaleidofin.com',
      updatedBy: 'admin@kaleidofin.com',
    },
  ];
}

// Initialize on import
initializeMockConfigs();

// ConfigListFilters is defined in hooks/use-configs.ts
// This is just for the mock function signature

/**
 * Mock handler: List configs with filters and pagination
 */
export async function mockListConfigs(
  filters: {
    productCode?: string;
    partnerCode?: string;
    branchCode?: string;
    screenId?: string;
    scopeType?: 'PRODUCT' | 'PARTNER' | 'BRANCH';
    status?: ConfigStatus;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<PaginatedResponse<ScreenConfig>> {
  await delay(500);

  let filtered = [...mockConfigsStore];

  // Apply filters
  if (filters.productCode) {
    filtered = filtered.filter((c) => c.scope.productCode === filters.productCode);
  }
  if (filters.partnerCode) {
    filtered = filtered.filter((c) => c.scope.partnerCode === filters.partnerCode);
  }
  if (filters.branchCode) {
    filtered = filtered.filter((c) => c.scope.branchCode === filters.branchCode);
  }
  if (filters.screenId) {
    filtered = filtered.filter((c) => c.screenId === filters.screenId);
  }
  if (filters.scopeType) {
    filtered = filtered.filter((c) => c.scope.type === filters.scopeType);
  }
  if (filters.status) {
    filtered = filtered.filter((c) => c.status === filters.status);
  }

  // Pagination
  const page = filters.page || 1;
  const pageSize = filters.pageSize || 50;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const items = filtered.slice(start, end);

  return {
    items,
    total: filtered.length,
    page,
    pageSize,
  };
}

/**
 * Mock handler: Get config by ID
 */
export async function mockGetConfig(configId: string): Promise<ScreenConfig> {
  await delay(300);
  const config = mockConfigsStore.find((c) => c.configId === configId);
  if (!config) {
    throw new Error(`Config not found: ${configId}`);
  }
  return config;
}

/**
 * Mock handler: Get versions of a screen config
 */
export async function mockGetConfigVersions(screenId: string): Promise<ScreenConfig[]> {
  await delay(300);
  return mockConfigsStore.filter((c) => c.screenId === screenId);
}

/**
 * Mock handler: Resolve config using hierarchy
 */
export async function mockResolveConfig(params: {
  screenId: string;
  scope: ConfigScope;
}): Promise<ResolvedConfig<ScreenConfig>> {
  await delay(400);

  // Filter ACTIVE configs for the same screen and product
  const relevantConfigs = mockConfigsStore.filter(
    (c) =>
      c.screenId === params.screenId &&
      c.scope.productCode === params.scope.productCode &&
      c.status === 'ACTIVE'
  );

  let resolvedConfig: ScreenConfig | null = null;
  let resolvedFrom: 'PRODUCT' | 'PARTNER' | 'BRANCH' | null = null;
  const inheritanceChain: string[] = [];

  // Resolution order: BRANCH → PARTNER → PRODUCT
  if (params.scope.branchCode) {
    const branchConfig = relevantConfigs.find(
      (c) =>
        c.scope.type === 'BRANCH' &&
        c.scope.partnerCode === params.scope.partnerCode &&
        c.scope.branchCode === params.scope.branchCode
    );
    if (branchConfig) {
      resolvedConfig = branchConfig;
      resolvedFrom = 'BRANCH';
      inheritanceChain.push(
        `BRANCH: ${params.scope.productCode} > ${params.scope.partnerCode} > ${params.scope.branchCode}`
      );
    }
  }

  if (!resolvedConfig && params.scope.partnerCode) {
    const partnerConfig = relevantConfigs.find(
      (c) => c.scope.type === 'PARTNER' && c.scope.partnerCode === params.scope.partnerCode
    );
    if (partnerConfig) {
      resolvedConfig = partnerConfig;
      resolvedFrom = 'PARTNER';
      inheritanceChain.push(`PARTNER: ${params.scope.productCode} > ${params.scope.partnerCode}`);
    }
  }

  if (!resolvedConfig) {
    const productConfig = relevantConfigs.find((c) => c.scope.type === 'PRODUCT');
    if (productConfig) {
      resolvedConfig = productConfig;
      resolvedFrom = 'PRODUCT';
      inheritanceChain.push(`PRODUCT: ${params.scope.productCode}`);
    } else {
      throw new Error(
        `PRODUCT configuration not found for screen ${params.screenId} and product ${params.scope.productCode}`
      );
    }
  }

  return {
    config: resolvedConfig,
    resolvedFrom: resolvedFrom!,
    inheritanceChain,
  };
}

/**
 * Mock handler: Create config
 */
export async function mockCreateConfig(
  data: Omit<ScreenConfig, 'configId' | 'version' | 'status' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>
): Promise<ScreenConfig> {
  await delay(500);

  // Generate new config ID
  const configId = `config_${Date.now()}`;
  const now = new Date().toISOString();

  const newConfig: ScreenConfig = {
    ...data,
    configId,
    version: 1,
    status: 'DRAFT',
    createdAt: now,
    updatedAt: now,
    createdBy: 'current_user',
    updatedBy: 'current_user',
  };

  mockConfigsStore.push(newConfig);
  return newConfig;
}

/**
 * Mock handler: Update config
 */
export async function mockUpdateConfig(
  configId: string,
  data: Partial<ScreenConfig>
): Promise<ScreenConfig> {
  await delay(500);

  const index = mockConfigsStore.findIndex((c) => c.configId === configId);
  if (index === -1) {
    throw new Error(`Config not found: ${configId}`);
  }

  const existing = mockConfigsStore[index];
  const updated: ScreenConfig = {
    ...existing,
    ...data,
    updatedAt: new Date().toISOString(),
    updatedBy: 'current_user',
  };

  mockConfigsStore[index] = updated;
  return updated;
}

/**
 * Mock handler: Activate config
 */
export async function mockActivateConfig(
  configId: string,
  changeReason?: string
): Promise<ScreenConfig> {
  await delay(500);

  const config = await mockGetConfig(configId);
  const updated = await mockUpdateConfig(configId, {
    status: 'ACTIVE',
    changeReason,
  });

  return updated;
}

/**
 * Mock handler: Deprecate config
 */
export async function mockDeprecateConfig(
  configId: string,
  changeReason?: string
): Promise<ScreenConfig> {
  await delay(500);

  const updated = await mockUpdateConfig(configId, {
    status: 'DEPRECATED',
    changeReason,
  });

  return updated;
}

/**
 * Mock handler: Delete config
 */
export async function mockDeleteConfig(configId: string): Promise<void> {
  await delay(300);

  const index = mockConfigsStore.findIndex((c) => c.configId === configId);
  if (index === -1) {
    throw new Error(`Config not found: ${configId}`);
  }

  mockConfigsStore.splice(index, 1);
}

/**
 * Get all mock configs (for testing/debugging)
 */
export function getMockConfigs(): ScreenConfig[] {
  return [...mockConfigsStore];
}

/**
 * Reset mock configs to initial state
 */
export function resetMockConfigs() {
  initializeMockConfigs();
}

