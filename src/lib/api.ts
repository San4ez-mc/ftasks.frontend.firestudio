
'use client';

import { User } from '@/types/user';

const API_BASE_URL = 'https://api.tasks.fineko.space';

// --- Helper Functions ---

/**
 * Retrieves the permanent authentication token from cookies.
 */
function getToken(): string | null {
  if (typeof window !== 'undefined') {
    // Read from cookies instead of localStorage for middleware compatibility
    return document.cookie.split('; ').find(row => row.startsWith('auth_token='))?.split('=')[1] || null;
  }
  return null;
}

/**
 * Sets the permanent authentication token in a session cookie.
 */
function setToken(token: string): void {
  if (typeof window !== 'undefined') {
    // Set as a session cookie
    document.cookie = `auth_token=${token}; path=/; SameSite=Lax`;
  }
}

/**
 * Removes the authentication token cookie.
 */
export function clearToken(): void {
    if (typeof window !== 'undefined') {
        document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
}

/**
 * A generic fetch wrapper for making API requests.
 */
async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  // Check for a permanent token for general requests
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
export async function selectCompany(tempToken: string, companyId: string): Promise<{ token: string }> {
    const response = await apiFetch<{ token: string }>('/auth/telegram/select-company', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${tempToken}`
        },
        body: JSON.stringify({ companyId }),
    });
    
    if (response.token) {
        setToken(response.token);
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
    await apiFetch('/auth/logout', { method: 'POST' });
    clearToken();
}


// --- Company API ---

/**
 * Fetches the list of companies for the authenticated user (using permanent token).
 */
export async function getCompanies(): Promise<Company[]> {
    return apiFetch('/companies');
}
