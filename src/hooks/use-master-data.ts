import { useQuery } from '@tanstack/react-query';
import { Partner, Branch, Product, Screen } from '@/types';
import { screenConfigApi } from '@/api/screenConfig.api';
import { apiClient } from '@/lib/api-client';
import { MASTER_DATA_ENDPOINTS } from '@/lib/api-endpoints';

// Interface for the master data response from backend
interface MasterDataResponse {
  partners: Partner[];
  branches: Branch[];
  products: Product[];
}

// Hook to fetch all master data from backend (shared query)
const useAllMasterData = () => {
  return useQuery<MasterDataResponse>({
    queryKey: ['master-data-all'],
    queryFn: async () => {
      try {
        const data = await apiClient.get<MasterDataResponse>(MASTER_DATA_ENDPOINTS.GET_ALL);
        return data;
      } catch (error) {
        console.error('Failed to fetch master data from backend:', error);
        // Return empty arrays if backend endpoint not available yet
        return {
          partners: [],
          branches: [],
          products: [],
        };
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook to fetch partners from backend
export const usePartners = () => {
  const { data, isLoading, error } = useAllMasterData();
  
  return {
    data: data?.partners || [],
    isLoading,
    error,
  };
};

// Hook to fetch branches from backend
export const useBranches = (partnerCode?: string) => {
  const { data, isLoading, error } = useAllMasterData();
  
  const filteredBranches = partnerCode
    ? (data?.branches || []).filter((b) => b.partnerCode === partnerCode)
    : (data?.branches || []);
  
  return {
    data: filteredBranches,
    isLoading,
    error,
  };
};

// Hook to fetch products from backend
export const useProducts = () => {
  const { data, isLoading, error } = useAllMasterData();
  
  return {
    data: data?.products || [],
    isLoading,
    error,
  };
};

// Hook to fetch all screens from backend
export const useScreens = () => {
  return useQuery<Screen[]>({
    queryKey: ['screens-all'],
    queryFn: async () => {
      const screenConfigs = await screenConfigApi.getAll();
      
      // Convert to Screen format
      const uniqueScreens = Array.from(
        new Map(
          screenConfigs.map(config => [
            config.screenId,
            {
              screenId: config.screenId,
              screenName: (config.uiConfig as any)?.title || config.screenId,
              description: (config.uiConfig as any)?.description || `Screen: ${config.screenId}`,
            }
          ])
        ).values()
      );

      return uniqueScreens;
    },
    staleTime: 30 * 1000, // 30 seconds
  });
};

// Hook to fetch ACTIVE screens only (for use in other modules)
export const useConfiguredScreens = () => {
  return useQuery<Screen[]>({
    queryKey: ['screens-active'],
    queryFn: async () => {
      const screenConfigs = await screenConfigApi.getAll();
      
      // Only return ACTIVE screens
      const activeConfigs = screenConfigs.filter(config => config.status === 'ACTIVE');
      
      // Convert to Screen format
      const uniqueScreens = Array.from(
        new Map(
          activeConfigs.map(config => [
            config.screenId,
            {
              screenId: config.screenId,
              screenName: (config.uiConfig as any)?.title || config.screenId,
              description: (config.uiConfig as any)?.description || `Screen: ${config.screenId}`,
            }
          ])
        ).values()
      );
      
      return uniqueScreens;
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });
};

// Hook to fetch ALL screens (regardless of status)
// Used in Validation Builder
export const useConfiguredScreensSimple = () => {
  return useQuery<Screen[]>({
    queryKey: ['screens-all-simple'],
    queryFn: async () => {
      const screenConfigs = await screenConfigApi.getAll();
      
      // Convert to Screen format
      const uniqueScreens = Array.from(
        new Map(
          screenConfigs.map(config => [
            config.screenId,
            {
              screenId: config.screenId,
              screenName: (config.uiConfig as any)?.title || config.screenId,
              description: (config.uiConfig as any)?.description || `Screen: ${config.screenId}`,
            }
          ])
        ).values()
      );
      
      return uniqueScreens;
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchOnMount: 'always',
  });
};

// Hook to fetch screens that have validations (for Field Mapping)
export const useCompleteScreens = () => {
  return useQuery<Screen[]>({
    queryKey: ['screens-with-validations'],
    queryFn: async () => {
      // Get all screen configs from backend
      const screenConfigs = await screenConfigApi.getAll();
      
      // Filter to only screens that have validations
      // Note: We need to check if validations exist in the backend
      // For now, return all screens - backend should handle this logic
      const completeScreens = screenConfigs.filter(config => {
        // If validation configs exist separately, we'd check that
        // For now, return all screens
        return true;
      });
      
      // Convert to Screen format
      const uniqueScreens = Array.from(
        new Map(
          completeScreens.map(config => [
            config.screenId,
            {
              screenId: config.screenId,
              screenName: (config.uiConfig as any)?.title || config.screenId,
              description: (config.uiConfig as any)?.description || `Screen: ${config.screenId}`,
            }
          ])
        ).values()
      );
      
      return uniqueScreens;
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchOnMount: 'always',
  });
};
