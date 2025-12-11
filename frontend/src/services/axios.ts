import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'

// Create axios instance
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - attach JWT token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token')

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - handle errors globally
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ error?: string; detail?: string }>) => {
    // Handle 401 Unauthorized - logout user
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
      return Promise.reject(new Error('Session expired. Please log in again.'))
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      return Promise.reject(new Error('You do not have permission to perform this action.'))
    }

    // Handle 404 Not Found
    if (error.response?.status === 404) {
      return Promise.reject(new Error('Resource not found.'))
    }

    // Handle 500 Server Error
    if (error.response?.status === 500) {
      return Promise.reject(new Error('Server error. Please try again later.'))
    }

    // Extract error message from backend response
    const errorMessage = error.response?.data?.detail || error.message || 'An error occurred'

    return Promise.reject(new Error(errorMessage))
  }
)
