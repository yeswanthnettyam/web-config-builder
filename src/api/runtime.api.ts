/**
 * Runtime API Service
 * 
 * Handles runtime orchestration APIs for screen navigation and flow execution.
 * Uses centralized API client for consistent error handling.
 */

import { apiClient } from '@/lib/api-client';
import { RUNTIME_ENDPOINTS } from '@/lib/api-endpoints';
import { NextScreenRequest, BackendNextScreenResponse } from '@/types';

export const runtimeApi = {
  /**
   * Process screen submission and get next screen
   */
  async getNextScreen(
    request: NextScreenRequest
  ): Promise<BackendNextScreenResponse> {
    return apiClient.post<BackendNextScreenResponse>(
      RUNTIME_ENDPOINTS.NEXT_SCREEN,
      request
    );
  },
};
