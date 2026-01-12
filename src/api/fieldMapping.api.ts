/**
 * Field Mapping Configuration API Service
 * 
 * Handles all API calls related to field mapping configurations.
 * Uses centralized API client for consistent error handling.
 */

import { apiClient } from '@/lib/api-client';
import { MAPPING_ENDPOINTS } from '@/lib/api-endpoints';
import { BackendFieldMappingConfig } from '@/types';

export const fieldMappingApi = {
  /**
   * Get all field mapping configurations
   */
  async getAll(): Promise<BackendFieldMappingConfig[]> {
    return apiClient.get<BackendFieldMappingConfig[]>(MAPPING_ENDPOINTS.LIST);
  },

  /**
   * Get field mapping configuration by ID
   */
  async getById(configId: number): Promise<BackendFieldMappingConfig> {
    return apiClient.get<BackendFieldMappingConfig>(
      MAPPING_ENDPOINTS.GET_BY_ID(configId)
    );
  },

  /**
   * Create new field mapping configuration
   */
  async create(
    data: Partial<BackendFieldMappingConfig>
  ): Promise<BackendFieldMappingConfig> {
    return apiClient.post<BackendFieldMappingConfig>(
      MAPPING_ENDPOINTS.CREATE,
      data
    );
  },

  /**
   * Update existing field mapping configuration
   */
  async update(
    configId: number,
    data: Partial<BackendFieldMappingConfig>
  ): Promise<BackendFieldMappingConfig> {
    return apiClient.put<BackendFieldMappingConfig>(
      MAPPING_ENDPOINTS.UPDATE(configId),
      data
    );
  },

  /**
   * Delete field mapping configuration
   */
  async delete(configId: number): Promise<void> {
    return apiClient.delete<void>(MAPPING_ENDPOINTS.DELETE(configId));
  },

  /**
   * Clone field mapping configuration
   */
  async clone(configId: number): Promise<BackendFieldMappingConfig> {
    return apiClient.post<BackendFieldMappingConfig>(
      MAPPING_ENDPOINTS.CLONE(configId)
    );
  },

  /**
   * Activate field mapping configuration
   * This will make the config ACTIVE and deprecate any existing ACTIVE config for the same scope
   */
  async activate(configId: number): Promise<BackendFieldMappingConfig> {
    return apiClient.post<BackendFieldMappingConfig>(
      MAPPING_ENDPOINTS.ACTIVATE(configId)
    );
  },

  /**
   * Deprecate field mapping configuration
   */
  async deprecate(configId: number): Promise<BackendFieldMappingConfig> {
    return apiClient.post<BackendFieldMappingConfig>(
      MAPPING_ENDPOINTS.DEPRECATE(configId)
    );
  },
};
