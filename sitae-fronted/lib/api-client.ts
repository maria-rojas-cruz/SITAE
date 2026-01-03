// lib/api-client.ts
import { signOut } from 'next-auth/react';

type FetchOptions = Omit<RequestInit, 'method' | 'body'> & {
  body?: any;
};

// global error callback
let errorCallback: ((message: string) => void) | null = null;

// function to set the error handler
export function setErrorHandler(callback: (message: string) => void) {
  errorCallback = callback;
}

class ApiClient {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheDuration = 5 * 60 * 1000;

  private async request<T>(
    endpoint: string,
    method: string,
    options?: FetchOptions
  ): Promise<T> {
    const path = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    const url = `/api/proxy/${path}`;

    if (method === 'GET') {
      const cached = this.cache.get(url);
      if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
        return cached.data as T;
      }
    }

    const config: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      credentials: 'include',
      ...options,
    };

    if (options?.body) {
      config.body = JSON.stringify(options.body);
    }

    const response = await fetch(url, config);

    if (response.status === 401) {
      // show error using callback
      if (errorCallback) {
        errorCallback('Sesión expirada');
      }
      
      this.cache.clear();
      if (typeof window !== 'undefined') {
        localStorage.clear();
      }
      
      await signOut({ callbackUrl: '/login' });
      
      throw new Error('Session expired');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: `HTTP ${response.status}`
      }));
      
      const errorMessage = error.error || error.detail || error.message || `HTTP ${response.status}`;
      
      // show error using callback
      if (errorCallback) {
        errorCallback(errorMessage);
      }
      
      throw new Error(errorMessage);
    }

    if (response.status === 204) return null as T;
    
    const data = await response.json();

    if (method === 'GET') {
      this.cache.set(url, { data, timestamp: Date.now() });
    }

    return data;
  }

  get<T = any>(endpoint: string, options?: FetchOptions) {
    return this.request<T>(endpoint, 'GET', options);
  }

  post<T = any>(endpoint: string, body?: any, options?: FetchOptions) {
    return this.request<T>(endpoint, 'POST', { ...options, body });
  }

  put<T = any>(endpoint: string, body?: any, options?: FetchOptions) {
    return this.request<T>(endpoint, 'PUT', { ...options, body });
  }

  patch<T = any>(endpoint: string, body?: any, options?: FetchOptions) {
    return this.request<T>(endpoint, 'PATCH', { ...options, body });
  }

  delete<T = any>(endpoint: string, options?: FetchOptions) {
    return this.request<T>(endpoint, 'DELETE', options);
  }

  clearCache(pattern?: string) {
    if (pattern) {
      Array.from(this.cache.keys()).forEach(key => {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      });
    } else {
      this.cache.clear();
    }
  }
}

export const api = new ApiClient();

export const fetcher = (url: string) => api.get(url);