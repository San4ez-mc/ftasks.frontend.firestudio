
'use client';

import { User } from '@/types/user';

// The API base URL is now relative, pointing to our own Next.js backend.
const API_BASE_URL = '/api';

/**
 * A generic fetch wrapper for making API requests.
 * The browser automatically sends the httpOnly session cookie.
 */
async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

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
 * Exchanges the temporary token and selected company for a permanent session cookie.
 */
export async function selectCompany(tempToken: string, companyId: string): Promise<{ success: boolean }> {
    return apiFetch('/auth/telegram/select-company', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${tempToken}`
        },
        body: JSON.stringify({ companyId }),
    });
}

/**
 * Creates a new company and logs the user in by setting a permanent session cookie.
 */
export async function createCompanyAndLogin(tempToken: string, companyName: string): Promise<{ success: boolean }> {
    return apiFetch('/auth/telegram/create-company-and-login', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${tempToken}`
        },
        body: JSON.stringify({ companyName }),
    });
}


/**
 * Fetches the currently authenticated user's profile using the session cookie.
 */
export async function getMe(): Promise<User & { companies: {id: string, name: string}[] }> {
    return apiFetch('/auth/me');
}

/**
 * Logs out the current user by calling the logout endpoint, which clears the session cookie.
 */
export async function logout() {
    try {
        await apiFetch('/auth/logout', { method: 'POST' });
    } catch (error) {
        console.warn("Logout API call failed, but redirecting anyway.", error);
    } finally {
        // Force a full reload to clear all client-side state and redirect via middleware.
        window.location.href = '/login';
    }
}


// --- Company API ---

/**
 * Fetches the list of companies for the authenticated user (using session cookie).
 */
export async function getCompanies(): Promise<Company[]> {
    return apiFetch('/companies');
}
