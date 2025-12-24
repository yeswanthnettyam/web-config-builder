import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ScreenConfig, ConfigFilters } from '@/types';
import { mockScreenConfigs } from '@/lib/mock-api';
import toast from 'react-hot-toast';

// Mock delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Fetch all screen configs
export const useScreenConfigs = (filters?: ConfigFilters) => {
  return useQuery<ScreenConfig[]>({
    queryKey: ['screen-configs', filters],
    queryFn: async () => {
      await delay(800);
      // TODO: Replace with actual API call
      let configs = [...mockScreenConfigs];

      // Apply filters
      if (filters?.partnerCode) {
        configs = configs.filter(
          (c) => c.scope.partnerCode === filters.partnerCode
        );
      }
      if (filters?.screenId) {
        configs = configs.filter((c) => c.screenId === filters.screenId);
      }
      if (filters?.status) {
        configs = configs.filter((c) => c.status === filters.status);
      }

      return configs;
    },
  });
};

// Fetch single screen config
export const useScreenConfig = (configId: string) => {
  return useQuery<ScreenConfig>({
    queryKey: ['screen-config', configId],
    queryFn: async () => {
      await delay(500);
      // TODO: Replace with actual API call
      const config = mockScreenConfigs.find((c) => c.configId === configId);
      if (!config) {
        throw new Error('Config not found');
      }
      return config;
    },
    enabled: !!configId,
  });
};

// Create screen config
export const useCreateScreenConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: Partial<ScreenConfig>) => {
      await delay(1000);
      // TODO: Replace with actual API call
      toast.success('Screen configuration created successfully');
      return config;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['screen-configs'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create configuration');
    },
  });
};

// Update screen config
export const useUpdateScreenConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      configId,
      config,
    }: {
      configId: string;
      config: Partial<ScreenConfig>;
    }) => {
      await delay(1000);
      // TODO: Replace with actual API call
      toast.success('Screen configuration updated successfully');
      return config;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['screen-configs'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update configuration');
    },
  });
};

// Activate screen config
export const useActivateScreenConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (configId: string) => {
      await delay(800);
      // TODO: Replace with actual API call
      toast.success('Configuration activated successfully');
      return configId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['screen-configs'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to activate configuration');
    },
  });
};

// Deprecate screen config
export const useDeprecateScreenConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (configId: string) => {
      await delay(800);
      // TODO: Replace with actual API call
      toast.success('Configuration deprecated successfully');
      return configId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['screen-configs'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to deprecate configuration');
    },
  });
};

// Delete screen config
export const useDeleteScreenConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (configId: string) => {
      await delay(800);
      // TODO: Replace with actual API call
      toast.success('Configuration deleted successfully');
      return configId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['screen-configs'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete configuration');
    },
  });
};

