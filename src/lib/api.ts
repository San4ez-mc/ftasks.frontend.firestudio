
'use client';

import { User } from '@/types/user';

const API_BASE_URL = 'https://api.tasks.fineko.space';

// --- Helper Functions ---

/**
 * Retrieves the authentication token from localStorage.
 */
function getToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token');
  }
  return null;
}

/**
 * Sets the authentication token in localStorage.
 */
function setToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_token', token);
  }
}

/**
 * Removes the authentication token from localStorage.
 */
export function clearToken(): void {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
    }
}

/**
 * A generic fetch wrapper for making authenticated API requests.
 */
async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    // Attempt to parse error response from the server
    const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  if (response.status === 204) { // No Content
    return null as T;
  }

  return response.json() as T;
}


// --- Authentication API ---

type LoginRequest = {
  tgUserId: string;
  username: string;
  firstName: string;
  lastName?: string;
  photoUrl?: string;
};

type LoginResponse = {
  token: string;
  user: User;
};

/**
 * Logs in a user via Telegram data.
 */
export async function loginWithTelegram(userData: LoginRequest): Promise<LoginResponse> {
  const response = await apiFetch<LoginResponse>('/auth/telegram/login', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
  if (response.token) {
    setToken(response.token);
  }
  return response;
}

/**
 * Fetches the currently authenticated user's profile.
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

type Company = {
    id: string;
    name: string;
};

/**
 * Fetches the list of companies for the authenticated user.
 */
export async function getCompanies(): Promise<Company[]> {
    return apiFetch('/companies');
}

