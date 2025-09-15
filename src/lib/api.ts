
'use client';

import { User } from '@/types/user';

// The API base URL is now relative, pointing to our own Next.js backend.
const API_BASE_URL = '/api';
const TOKEN_STORAGE_KEY = 'auth_token';

// --- Helper Functions ---

/**
 * Retrieves the permanent authentication token from localStorage.
 */
function getToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  }
  return null;
}

/**
 * Sets the permanent authentication token in localStorage and as a cookie.
 */
function setToken(token: string, rememberMe: boolean): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60; // 30 days or 7 days
    document.cookie = `${TOKEN_STORAGE_KEY}=${token}; path=/; max-age=${maxAge}; SameSite=Lax; Secure`;
  }
}


/**
 * Removes the authentication token from localStorage and cookies.
 */
export function clearToken(): void {
    if (typeof window !== 'undefined') {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        // Expire the cookie by setting its expiration date to the past
        document.cookie = `${TOKEN_STORAGE_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    }
}

/**
 * A generic fetch wrapper for making API requests.
 */
async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  // For client-side requests, the browser will automatically send the cookie.
  // For scenarios where we might still use localStorage token (e.g., legacy), we can keep this logic.
  const permanentToken = getToken();
  if (permanentToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${permanentToken}`);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  if (response.status === 204) { // No Content
    return null as T;
  }

  return response.json() as T;
}


// --- Authentication API ---

type Company = {
    id: string;
    name: string;
};

/**
 * Fetches the user's companies using a temporary token from the Telegram bot.
 */
export async function getCompaniesForToken(tempToken: string): Promise<Company[]> {
    return apiFetch('/auth/telegram/companies', {
        headers: {
            'Authorization': `Bearer ${tempToken}`
        }
    });
}

/**
 * Exchanges the temporary token and selected company for a permanent session token.
 */
export async function selectCompany(tempToken: string, companyId: string): Promise<{ token: string; rememberMe?: boolean }> {
    const response = await apiFetch<{ token: string; rememberMe?: boolean }>('/auth/telegram/select-company', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${tempToken}`
        },
        body: JSON.stringify({ companyId }),
    });
    
    if (response.token) {
        setToken(response.token, response.rememberMe || false);
    }
    return response;
}

/**
 * Creates a new company and logs the user in, returning a permanent token.
 */
export async function createCompanyAndLogin(tempToken: string, companyName: string): Promise<{ token: string; rememberMe?: boolean }> {
    const response = await apiFetch<{ token: string; rememberMe?: boolean }>('/auth/telegram/create-company-and-login', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${tempToken}`
        },
        body: JSON.stringify({ companyName }),
    });
    
    if (response.token) {
        setToken(response.token, response.rememberMe || false);
    }
    return response;
}


/**
 * Fetches the currently authenticated user's profile using the permanent token.
 */
export async function getMe(): Promise<User & { companies: {id: string, name: string}[] }> {
    return apiFetch('/auth/me');
}

/**
 * Logs out the current user.
 */
export async function logout() {
    try {
        await apiFetch('/auth/logout', { method: 'POST' });
    } catch (error) {
        console.warn("Logout API call failed, but clearing token anyway.", error);
    } finally {
        clearToken();
    }
}


// --- Company API ---

/**
 * Fetches the list of companies for the authenticated user (using permanent token).
 */
export async function getCompanies(): Promise<Company[]> {
    return apiFetch('/companies');
}
