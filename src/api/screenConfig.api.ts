/**
 * Screen Configuration API Service
 * 
 * Handles all API calls related to screen configurations.
 * Uses centralized API client for consistent error handling.
 */

import { apiClient } from '@/lib/api-client';
import { SCREEN_CONFIG_ENDPOINTS } from '@/lib/api-endpoints';
import { BackendScreenConfig } from '@/types';

export const screenConfigApi = {
  /**
   * Get all screen configurations
   */
  async getAll(): Promise<BackendScreenConfig[]> {
    return apiClient.get<BackendScreenConfig[]>(SCREEN_CONFIG_ENDPOINTS.LIST);
  },

  /**
   * Get screen configuration by ID
   */
  async getById(configId: number): Promise<BackendScreenConfig> {
    return apiClient.get<BackendScreenConfig>(
      SCREEN_CONFIG_ENDPOINTS.GET_BY_ID(configId)
    );
  },

  /**
   * Create new screen configuration
   */
  async create(data: Partial<BackendScreenConfig>): Promise<BackendScreenConfig> {
    return apiClient.post<BackendScreenConfig>(
      SCREEN_CONFIG_ENDPOINTS.CREATE,
      data
    );
  },

  /**
   * Update existing screen configuration
   */
  async update(
    configId: number,
    data: Partial<BackendScreenConfig>
  ): Promise<BackendScreenConfig> {
    return apiClient.put<BackendScreenConfig>(
      SCREEN_CONFIG_ENDPOINTS.UPDATE(configId),
      data
    );
  },

  /**
   * Delete screen configuration
   */
  async delete(configId: number): Promise<void> {
    return apiClient.delete<void>(SCREEN_CONFIG_ENDPOINTS.DELETE(configId));
  },

  /**
   * Clone screen configuration
   */
  async clone(configId: number): Promise<BackendScreenConfig> {
    return apiClient.post<BackendScreenConfig>(
      SCREEN_CONFIG_ENDPOINTS.CLONE(configId)
    );
  },

  /**
   * Activate screen configuration
   * This will make the config ACTIVE and deprecate any existing ACTIVE config for the same scope
   */
  async activate(configId: number): Promise<BackendScreenConfig> {
    return apiClient.post<BackendScreenConfig>(
      SCREEN_CONFIG_ENDPOINTS.ACTIVATE(configId)
    );
  },

  /**
   * Deprecate screen configuration
   */
  async deprecate(configId: number): Promise<BackendScreenConfig> {
    return apiClient.post<BackendScreenConfig>(
      SCREEN_CONFIG_ENDPOINTS.DEPRECATE(configId)
    );
  },
};
