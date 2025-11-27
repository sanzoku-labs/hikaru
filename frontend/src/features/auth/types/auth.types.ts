/**
 * Authentication Type Definitions
 */

export interface UserRegister {
  email: string;
  username: string;
  password: string;
  full_name?: string;
}

export interface UserLogin {
  username: string; // Can be username or email
  password: string;
}

export interface UserResponse {
  id: number;
  email: string;
  username: string;
  full_name?: string;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: UserResponse;
}
