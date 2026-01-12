/**
 * Validation Configuration API Service
 * 
 * Handles all API calls related to validation configurations.
 * Uses centralized API client for consistent error handling.
 */

import { apiClient } from '@/lib/api-client';
import { VALIDATION_CONFIG_ENDPOINTS } from '@/lib/api-endpoints';
import { BackendValidationConfig } from '@/types';

export const validationConfigApi = {
  /**
   * Get all validation configurations
   */
  async getAll(): Promise<BackendValidationConfig[]> {
    return apiClient.get<BackendValidationConfig[]>(
      VALIDATION_CONFIG_ENDPOINTS.LIST
    );
  },

  /**
   * Get validation configuration by ID
   */
  async getById(configId: number): Promise<BackendValidationConfig> {
    return apiClient.get<BackendValidationConfig>(
      VALIDATION_CONFIG_ENDPOINTS.GET_BY_ID(configId)
    );
  },

  /**
   * Create new validation configuration
   */
  async create(
    data: Partial<BackendValidationConfig>
  ): Promise<BackendValidationConfig> {
    return apiClient.post<BackendValidationConfig>(
      VALIDATION_CONFIG_ENDPOINTS.CREATE,
      data
    );
  },

  /**
   * Update existing validation configuration
   */
  async update(
    configId: number,
    data: Partial<BackendValidationConfig>
  ): Promise<BackendValidationConfig> {
    return apiClient.put<BackendValidationConfig>(
      VALIDATION_CONFIG_ENDPOINTS.UPDATE(configId),
      data
    );
  },

  /**
   * Delete validation configuration
   */
  async delete(configId: number): Promise<void> {
    return apiClient.delete<void>(
      VALIDATION_CONFIG_ENDPOINTS.DELETE(configId)
    );
  },

  /**
   * Clone validation configuration
   */
  async clone(configId: number): Promise<BackendValidationConfig> {
    return apiClient.post<BackendValidationConfig>(
      VALIDATION_CONFIG_ENDPOINTS.CLONE(configId)
    );
  },
};
