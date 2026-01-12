import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import { API_BASE_URL, API_TIMEOUT, TOKEN_KEY } from './constants';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - attach token (TEMPORARILY DISABLED FOR TESTING)
    this.client.interceptors.request.use(
      (config) => {
        // TODO: Re-enable authentication when backend requires it
        // Authentication is currently disabled for testing purposes
        // Uncomment the following block to enable JWT token authentication:
        /*
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem(TOKEN_KEY);
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
        */
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - handle errors
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        // TODO: Re-enable 401 redirect when authentication is enabled
        /*
        if (error.response?.status === 401) {
          // Token expired or invalid
          if (typeof window !== 'undefined') {
            localStorage.removeItem(TOKEN_KEY);
            window.location.href = '/login';
          }
        }
        */
        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }
}

export const apiClient = new ApiClient();

