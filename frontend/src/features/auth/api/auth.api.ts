/**
 * Authentication API module
 * Handles user registration, login, logout, and current user retrieval
 */

import { apiClient, setAuthToken, clearAuthToken } from '@/lib/api.client';
import type { UserRegister, UserLogin, TokenResponse, UserResponse } from '@/types';

export const authApi = {
  /**
   * Register a new user
   */
  async register(data: UserRegister): Promise<TokenResponse> {
    const result = await apiClient.post<TokenResponse>('/api/auth/register', data);

    // Store token in localStorage
    setAuthToken(result.access_token);

    return result;
  },

  /**
   * Login an existing user
   */
  async login(data: UserLogin): Promise<TokenResponse> {
    const result = await apiClient.post<TokenResponse>('/api/auth/login', data);

    // Store token in localStorage
    setAuthToken(result.access_token);

    return result;
  },

  /**
   * Get current authenticated user information
   */
  async getCurrentUser(): Promise<UserResponse> {
    return apiClient.get<UserResponse>('/api/auth/me');
  },

  /**
   * Logout the current user
   */
  async logout(): Promise<void> {
    await apiClient.post<void>('/api/auth/logout');

    // Clear token from localStorage
    clearAuthToken();
  },
};
