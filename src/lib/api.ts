
'use client';

// The API base URL is now set to your external backend.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://9000-firebase-php-audit-1758820822645.cluster-ha3ykp7smfgsutjta5qfx7ssnm.cloudworkstations.dev/';

/**
 * A generic fetch wrapper for making API requests to the external backend.
 * It automatically includes credentials (like the httpOnly auth_token cookie)
 * for requests to the same origin (our Next.js API routes). For direct requests
 * to a different-origin backend, CORS policies must be correctly configured on the backend.
 */
async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    // credentials: 'include' might be needed if your backend is on a different domain
    // and you need to send cookies. This requires proper CORS setup (Access-Control-Allow-Credentials).
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

type UserProfile = {
    id: string;
    firstName: string;
    lastName: string;
    companies: Company[];
}

/**
 * Fetches the user's companies using a temporary token from the Telegram bot.
 * This now calls our OWN API route, which proxies to the backend.
 * This avoids direct client-to-backend calls and the resulting CORS issues.
 */
export async function getCompaniesForToken(tempToken: string): Promise<Company[]> {
    const response = await fetch('/api/auth/telegram/companies', {
        headers: {
            'Authorization': `Bearer ${tempToken}`
        }
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch companies.');
    }

    return response.json();
}

/**
 * Calls our Next.js API route to exchange the temporary token and selected company
 * for a permanent token, which the Next.js route will set as an httpOnly cookie.
 */
export async function selectCompany(tempToken: string, companyId: string): Promise<{ success: boolean }> {
    const response = await fetch('/api/auth/select-company', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tempToken, companyId }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to select company.');
    }
    return response.json();
}

/**
 * Calls our Next.js API route to create a new company and log the user in.
 * The Next.js route handles setting the permanent token as an httpOnly cookie.
 */
export async function createCompanyAndLogin(tempToken: string, companyName: string): Promise<{ success: boolean }> {
     const response = await fetch('/api/auth/create-company', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tempToken, companyName }),
    });
     if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create company.');
    }
    return response.json();
}

/**
 * Logs out the current user by calling our own Next.js API route,
 * which clears the httpOnly cookie.
 */
export async function logout() {
    try {
        await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
        console.warn("Logout API call failed, but redirecting anyway.", error);
    } finally {
        // Force a full reload to clear all client-side state and redirect.
        window.location.href = '/login';
    }
}

/**
 * Fetches the profile of the currently authenticated user from our own API route,
 * which securely proxies the request to the main backend.
 */
export async function getMe(): Promise<UserProfile> {
    const response = await fetch('/api/auth/me');
    
    if (!response.ok) {
        if (response.status === 401) {
             console.log("Session expired or invalid. Logging out.");
             // Don't call logout() here to avoid potential loops, just redirect.
             if (typeof window !== 'undefined') {
                 window.location.href = '/login';
             }
        }
        const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    return response.json();
}


// --- Company API ---

/**
 * Fetches the list of companies for the authenticated user (using session cookie).
 * This now needs to go through our API proxy to include the cookie.
 */
export async function getCompanies(): Promise<Company[]> {
    // This assumes your backend handles getting companies based on the permanent token.
    return apiFetch('companies');
}
