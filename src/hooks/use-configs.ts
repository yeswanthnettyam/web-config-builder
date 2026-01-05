import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import {
  SCREEN_CONFIG_ENDPOINTS,
} from '@/lib/api-endpoints';
import {
  ScreenConfig,
  ConfigScope,
  ConfigStatus,
  PaginatedResponse,
  ResolvedConfig,
} from '@/types';
import {
  mockListConfigs,
  mockGetConfig,
  mockGetConfigVersions,
  mockResolveConfig,
  mockCreateConfig,
  mockUpdateConfig,
  mockActivateConfig,
  mockDeprecateConfig,
  mockDeleteConfig,
} from '@/lib/mock-config-api';
import { API_BASE_URL } from '@/lib/constants';

// Check if we're in mock mode (development without backend)
const USE_MOCK_API = !API_BASE_URL || API_BASE_URL.includes('localhost') || process.env.NODE_ENV === 'development';

// Query keys
export const configKeys = {
  all: ['configs'] as const,
  lists: () => [...configKeys.all, 'list'] as const,
  list: (filters: ConfigListFilters) => [...configKeys.lists(), filters] as const,
  details: () => [...configKeys.all, 'detail'] as const,
  detail: (id: string) => [...configKeys.details(), id] as const,
  versions: (screenId: string) => [...configKeys.all, 'versions', screenId] as const,
  resolved: (params: ResolveConfigParams) => [...configKeys.all, 'resolved', params] as const,
};

export interface ConfigListFilters {
  productCode?: string;
  partnerCode?: string;
  branchCode?: string;
  screenId?: string;
  scopeType?: 'PRODUCT' | 'PARTNER' | 'BRANCH';
  status?: ConfigStatus;
  page?: number;
  pageSize?: number;
}

export interface ResolveConfigParams {
  screenId: string;
  scope: ConfigScope;
}

export interface CreateConfigRequest {
  screenId: string;
  title: string;
  scope: ConfigScope;
  ui: object;
  validation?: object;
  changeReason?: string;
}

export interface UpdateConfigRequest {
  title?: string;
  ui?: object;
  validation?: object;
  changeReason?: string;
}

/**
 * Hook to fetch list of screen configs with filters
 */
export function useConfigList(filters: ConfigListFilters = {}) {
  return useQuery<PaginatedResponse<ScreenConfig>>({
    queryKey: configKeys.list(filters),
    queryFn: async () => {
      if (USE_MOCK_API) {
        return mockListConfigs(filters);
      }

      const params = new URLSearchParams();
      if (filters.productCode) params.append('productCode', filters.productCode);
      if (filters.partnerCode) params.append('partnerCode', filters.partnerCode);
      if (filters.branchCode) params.append('branchCode', filters.branchCode);
      if (filters.screenId) params.append('screenId', filters.screenId);
      if (filters.scopeType) params.append('scopeType', filters.scopeType);
      if (filters.status) params.append('status', filters.status);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.pageSize) params.append('pageSize', filters.pageSize.toString());

      const queryString = params.toString();
      const url = queryString
        ? `${SCREEN_CONFIG_ENDPOINTS.LIST}?${queryString}`
        : SCREEN_CONFIG_ENDPOINTS.LIST;

      return apiClient.get<PaginatedResponse<ScreenConfig>>(url);
    },
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to fetch a single config by ID
 */
export function useConfig(configId: string) {
  return useQuery<ScreenConfig>({
    queryKey: configKeys.detail(configId),
    queryFn: () => {
      if (USE_MOCK_API) {
        return mockGetConfig(configId);
      }
      return apiClient.get<ScreenConfig>(SCREEN_CONFIG_ENDPOINTS.GET_BY_ID(configId));
    },
    enabled: !!configId,
  });
}

/**
 * Hook to fetch versions of a screen config
 */
export function useConfigVersions(screenId: string) {
  return useQuery<ScreenConfig[]>({
    queryKey: configKeys.versions(screenId),
    queryFn: () => {
      if (USE_MOCK_API) {
        return mockGetConfigVersions(screenId);
      }
      return apiClient.get<ScreenConfig[]>(SCREEN_CONFIG_ENDPOINTS.GET_VERSIONS(screenId));
    },
    enabled: !!screenId,
  });
}

/**
 * Hook to resolve a config using hierarchy
 */
export function useResolvedConfig(params: ResolveConfigParams) {
  return useQuery<ResolvedConfig<ScreenConfig>>({
    queryKey: configKeys.resolved(params),
    queryFn: async () => {
      if (USE_MOCK_API) {
        return mockResolveConfig(params);
      }
      return apiClient.post<ResolvedConfig<ScreenConfig>>(
        SCREEN_CONFIG_ENDPOINTS.RESOLVE,
        params
      );
    },
    enabled: !!params.screenId && !!params.scope.productCode,
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Hook to create a new config
 */
export function useCreateConfig() {
  const queryClient = useQueryClient();

  return useMutation<ScreenConfig, Error, CreateConfigRequest>({
    mutationFn: async (data) => {
      if (USE_MOCK_API) {
        return mockCreateConfig(data as any);
      }
      return apiClient.post<ScreenConfig>(SCREEN_CONFIG_ENDPOINTS.CREATE, data);
    },
    onSuccess: () => {
      // Invalidate list queries
      queryClient.invalidateQueries({ queryKey: configKeys.lists() });
    },
  });
}

/**
 * Hook to update a config
 */
export function useUpdateConfig() {
  const queryClient = useQueryClient();

  return useMutation<
    ScreenConfig,
    Error,
    { configId: string; data: UpdateConfigRequest }
  >({
    mutationFn: async ({ configId, data }) => {
      if (USE_MOCK_API) {
        const existing = await mockGetConfig(configId);
        return mockUpdateConfig(configId, { ...existing, ...data } as any);
      }
      return apiClient.put<ScreenConfig>(SCREEN_CONFIG_ENDPOINTS.UPDATE(configId), data);
    },
    onSuccess: (data) => {
      // Invalidate specific config and lists
      queryClient.invalidateQueries({ queryKey: configKeys.detail(data.configId) });
      queryClient.invalidateQueries({ queryKey: configKeys.lists() });
    },
  });
}

/**
 * Hook to activate a config
 */
export function useActivateConfig() {
  const queryClient = useQueryClient();

  return useMutation<ScreenConfig, Error, { configId: string; changeReason?: string }>({
    mutationFn: async ({ configId, changeReason }) => {
      if (USE_MOCK_API) {
        return mockActivateConfig(configId, changeReason);
      }
      return apiClient.post<ScreenConfig>(SCREEN_CONFIG_ENDPOINTS.ACTIVATE(configId), {
        changeReason,
      });
    },
    onSuccess: (data) => {
      // Invalidate specific config, lists, and resolved configs
      queryClient.invalidateQueries({ queryKey: configKeys.detail(data.configId) });
      queryClient.invalidateQueries({ queryKey: configKeys.lists() });
      queryClient.invalidateQueries({ queryKey: configKeys.all });
    },
  });
}

/**
 * Hook to deprecate a config
 */
export function useDeprecateConfig() {
  const queryClient = useQueryClient();

  return useMutation<ScreenConfig, Error, { configId: string; changeReason?: string }>({
    mutationFn: async ({ configId, changeReason }) => {
      if (USE_MOCK_API) {
        return mockDeprecateConfig(configId, changeReason);
      }
      return apiClient.post<ScreenConfig>(SCREEN_CONFIG_ENDPOINTS.DEPRECATE(configId), {
        changeReason,
      });
    },
    onSuccess: (data) => {
      // Invalidate specific config and lists
      queryClient.invalidateQueries({ queryKey: configKeys.detail(data.configId) });
      queryClient.invalidateQueries({ queryKey: configKeys.lists() });
    },
  });
}

/**
 * Hook to delete a config
 */
export function useDeleteConfig() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (configId) => {
      if (USE_MOCK_API) {
        await mockDeleteConfig(configId);
        return;
      }
      return apiClient.delete<void>(SCREEN_CONFIG_ENDPOINTS.DELETE(configId));
    },
    onSuccess: () => {
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: configKeys.lists() });
    },
  });
}

