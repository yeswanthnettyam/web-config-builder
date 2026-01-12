import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ScreenConfig, ConfigFilters, BackendScreenConfig } from '@/types';
import { screenConfigApi } from '@/api';
import toast from 'react-hot-toast';

// Fetch all screen configs
export const useScreenConfigs = (filters?: ConfigFilters) => {
  return useQuery<BackendScreenConfig[]>({
    queryKey: ['screen-configs', filters],
    queryFn: async () => {
      let configs = await screenConfigApi.getAll();

      // Apply filters
      if (filters?.partnerCode) {
        configs = configs.filter(
          (c) => c.partnerCode === filters.partnerCode
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
export const useScreenConfig = (configId: number) => {
  return useQuery<BackendScreenConfig>({
    queryKey: ['screen-config', configId],
    queryFn: async () => {
      return screenConfigApi.getById(configId);
    },
    enabled: !!configId,
  });
};

// Create screen config
export const useCreateScreenConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: Partial<BackendScreenConfig>) => {
      return screenConfigApi.create(config);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['screen-configs'] });
      toast.success('Screen configuration created successfully');
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
      configId: number;
      config: Partial<BackendScreenConfig>;
    }) => {
      return screenConfigApi.update(configId, config);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['screen-configs'] });
      toast.success('Screen configuration updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update configuration');
    },
  });
};

// Clone screen config
export const useCloneScreenConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (configId: number) => {
      return screenConfigApi.clone(configId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['screen-configs'] });
      toast.success('Configuration cloned successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to clone configuration');
    },
  });
};

// Delete screen config
export const useDeleteScreenConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (configId: number) => {
      return screenConfigApi.delete(configId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['screen-configs'] });
      toast.success('Configuration deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete configuration');
    },
  });
};

