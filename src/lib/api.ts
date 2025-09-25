
'use client';

// --- Helper Functions for Cookie Management ---
function setCookie(name: string, value: string, days: number) {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    // Use SameSite=Lax and Secure in production for better security
    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Lax" + secure;
}

function getCookie(name: string): string | null {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for(let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

function eraseCookie(name: string) {   
    document.cookie = name+'=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}


// The API base URL is now set to your external backend.
const API_BASE_URL = 'https://9000-firebase-php-audit-1758820822645.cluster-ha3ykp7smfgsutjta5qfx7ssnm.cloudworkstations.dev/';

/**
 * A generic fetch wrapper for making API requests.
 * It now reads the token from cookies and sends it as a Bearer token.
 */
async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  
  const token = getCookie('auth_token');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
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
 * Exchanges the temporary token and selected company for a permanent token,
 * then stores it in a cookie.
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
        setCookie('auth_token', response.token, 30); // Store for 30 days
    }
    return response;
}

/**
 * Creates a new company and logs the user in by getting a permanent token
 * and storing it in a cookie.
 */
export async function createCompanyAndLogin(tempToken: string, companyName: string): Promise<{ token: string }> {
    const response = await apiFetch<{ token: string }>('/auth/telegram/create-company-and-login', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${tempToken}`
        },
        body: JSON.stringify({ companyName }),
    });
     if (response.token) {
        setCookie('auth_token', response.token, 30); // Store for 30 days
    }
    return response;
}

/**
 * Logs out the current user by calling the backend to invalidate the token
 * and clearing the local cookie.
 */
export async function logout() {
    try {
        await apiFetch('/auth/logout', { method: 'POST' });
    } catch (error) {
        console.warn("Logout API call failed, but clearing local cookie anyway.", error);
    } finally {
        eraseCookie('auth_token');
        // Force a full reload to clear all client-side state and redirect.
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

    