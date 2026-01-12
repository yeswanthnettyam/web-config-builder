/**
 * Flow Configuration API Service
 * 
 * Handles all API calls related to flow configurations.
 * Uses centralized API client for consistent error handling.
 */

import { apiClient } from '@/lib/api-client';
import { FLOW_CONFIG_ENDPOINTS } from '@/lib/api-endpoints';
import { BackendFlowConfig } from '@/types';

export const flowConfigApi = {
  /**
   * Get all flow configurations
   */
  async getAll(): Promise<BackendFlowConfig[]> {
    return apiClient.get<BackendFlowConfig[]>(FLOW_CONFIG_ENDPOINTS.LIST);
  },

  /**
   * Get flow configuration by ID
   */
  async getById(configId: number): Promise<BackendFlowConfig> {
    return apiClient.get<BackendFlowConfig>(
      FLOW_CONFIG_ENDPOINTS.GET_BY_ID(configId)
    );
  },

  /**
   * Create new flow configuration
   */
  async create(data: Partial<BackendFlowConfig>): Promise<BackendFlowConfig> {
    return apiClient.post<BackendFlowConfig>(
      FLOW_CONFIG_ENDPOINTS.CREATE,
      data
    );
  },

  /**
   * Update existing flow configuration
   */
  async update(
    configId: number,
    data: Partial<BackendFlowConfig>
  ): Promise<BackendFlowConfig> {
    return apiClient.put<BackendFlowConfig>(
      FLOW_CONFIG_ENDPOINTS.UPDATE(configId),
      data
    );
  },

  /**
   * Delete flow configuration
   */
  async delete(configId: number): Promise<void> {
    return apiClient.delete<void>(FLOW_CONFIG_ENDPOINTS.DELETE(configId));
  },

  /**
   * Clone flow configuration
   */
  async clone(configId: number): Promise<BackendFlowConfig> {
    return apiClient.post<BackendFlowConfig>(
      FLOW_CONFIG_ENDPOINTS.CLONE(configId)
    );
  },
};
