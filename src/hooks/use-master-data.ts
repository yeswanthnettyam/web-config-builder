import { useQuery } from '@tanstack/react-query';
import React, { useState, useEffect, useCallback } from 'react';
import { Partner, Branch, Product, Screen } from '@/types';
import { mockMasterData, mockScreenConfigs, mockScreens } from '@/lib/mock-api';
import { getAllScreenConfigs } from '@/lib/cache-storage';

// Mock delay for realistic loading
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Hook to fetch partners
export const usePartners = () => {
  return useQuery<Partner[]>({
    queryKey: ['partners'],
    queryFn: async () => {
      await delay(500);
      // TODO: Replace with actual API call
      // return apiClient.get<Partner[]>(MASTER_DATA_ENDPOINTS.PARTNERS);
      return mockMasterData.partners;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook to fetch branches
export const useBranches = (partnerCode?: string) => {
  return useQuery<Branch[]>({
    queryKey: ['branches', partnerCode],
    queryFn: async () => {
      await delay(500);
      // TODO: Replace with actual API call
      const allBranches = mockMasterData.branches;
      return partnerCode
        ? allBranches.filter((b) => b.partnerCode === partnerCode)
        : allBranches;
    },
    staleTime: 5 * 60 * 1000,
    enabled: partnerCode !== undefined || !partnerCode,
  });
};

// Hook to fetch products
export const useProducts = () => {
  return useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      await delay(500);
      // TODO: Replace with actual API call
      return mockMasterData.products;
    },
    staleTime: 5 * 60 * 1000,
  });
};

// Hook to fetch screens - now fetches from created screen configs
export const useScreens = () => {
  return useQuery<Screen[]>({
    queryKey: ['screens'],
    queryFn: async () => {
      await delay(500);
      // TODO: Replace with actual API call
      // Build screens list from screen configs
      const screensFromConfigs = mockScreenConfigs.map(config => ({
        screenId: config.screenId,
        screenName: config.title,
        description: `Screen: ${config.title}`,
      }));

      // Combine with existing mock screens (remove duplicates)
      const allScreens = [...mockScreens];
      screensFromConfigs.forEach(configScreen => {
        if (!allScreens.find(s => s.screenId === configScreen.screenId)) {
          allScreens.push(configScreen);
        }
      });

      return allScreens;
    },
    staleTime: 30 * 1000, // 30 seconds - shorter since screens can be added
  });
};

// Hook to fetch screens for dropdowns (in modules 2, 3, 4)
// This only returns screens that have configs (from cache storage)
export const useConfiguredScreens = () => {
  return useQuery<Screen[]>({
    queryKey: ['configured-screens'], // Fixed query key (no Date.now()!)
    queryFn: async () => {
      console.log('🔄 Fetching configured screens from cache...');
      
      // Read from cache storage instead of mock data
      const cachedConfigs = getAllScreenConfigs();
      console.log('📦 All cached configs:', cachedConfigs);
      
      // Only return ACTIVE screens for use in other modules
      const activeConfigs = cachedConfigs.filter(config => config.status === 'ACTIVE');
      console.log('✅ Active configs:', activeConfigs);
      
      // Convert to Screen format
      const uniqueScreens = Array.from(
        new Map(
          activeConfigs.map(config => [
            config.screenId,
            {
              screenId: config.screenId,
              screenName: config.screenName,
              description: config.config.title || config.screenName,
            }
          ])
        ).values()
      );
      
      console.log('📋 Screens for dropdown:', uniqueScreens);
      return uniqueScreens;
    },
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache
    refetchOnMount: 'always', // Always refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window regains focus
  });
};

// Simpler hook using useState (alternative to React Query)
// Returns ALL screens regardless of status
export const useConfiguredScreensSimple = () => {
  const [screens, setScreens] = useState<Screen[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Use useCallback to memoize the function and prevent infinite loops
  const loadScreens = useCallback(() => {
    console.log('🔄 Loading all screens from cache...');
    
    try {
      // Read from cache storage
      const cachedConfigs = getAllScreenConfigs();
      console.log('📦 All cached configs:', cachedConfigs);
      
      // Return ALL screens (not filtering by status)
      const uniqueScreens = Array.from(
        new Map(
          cachedConfigs.map(config => [
            config.screenId,
            {
              screenId: config.screenId,
              screenName: config.screenName,
              description: config.config.title || config.screenName,
            }
          ])
        ).values()
      );
      
      console.log('📋 All screens for dropdown:', uniqueScreens);
      setScreens(uniqueScreens);
      setIsLoading(false);
    } catch (error) {
      console.error('❌ Error loading screens:', error);
      setScreens([]);
      setIsLoading(false);
    }
  }, []); // Empty deps = stable function

  useEffect(() => {
    loadScreens();
  }, [loadScreens]);

  return {
    data: screens,
    isLoading,
    refetch: loadScreens,
  };
};

// Hook for Field Mapping - only returns COMPLETE screens (with validations)
export const useCompleteScreens = () => {
  const [screens, setScreens] = useState<Screen[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadScreens = useCallback(() => {
    console.log('🔄 Loading complete screens (with validations) from cache...');
    
    try {
      const cachedConfigs = getAllScreenConfigs();
      console.log('📦 All cached configs:', cachedConfigs);
      
      // Filter to only screens that have validations
      const completeScreens = cachedConfigs.filter(
        config => config.config.validations && config.config.validations.rules
      );
      console.log('✅ Complete screens (with validations):', completeScreens);
      
      // Convert to Screen format
      const uniqueScreens = Array.from(
        new Map(
          completeScreens.map(config => [
            config.screenId,
            {
              screenId: config.screenId,
              screenName: config.screenName,
              description: config.config.title || config.screenName,
            }
          ])
        ).values()
      );
      
      console.log('📋 Complete screens for Field Mapping:', uniqueScreens);
      setScreens(uniqueScreens);
      setIsLoading(false);
    } catch (error) {
      console.error('❌ Error loading screens:', error);
      setScreens([]);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadScreens();
  }, [loadScreens]);

  return {
    data: screens,
    isLoading,
    refetch: loadScreens,
  };
};
