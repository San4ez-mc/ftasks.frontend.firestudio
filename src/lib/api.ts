'use client';

// The API base URL is now set to your external backend.
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || 'https://9000-firebase-php-audit-1758820822645.cluster-ha3ykp7smfgsutjta5qfx7ssnm.cloudworkstations.dev').replace(/\/$/, "");

/**
 * A generic fetch wrapper for making API requests to the external backend.
 * This is intended for client-side use and calls Next.js API routes which act as proxies.
 */
async function fetchFromProxy<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `/${endpoint.replace(/^\//, "")}`; // Ensure it's a relative path for proxy calls
  const response = await fetch(url, options);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Сталася невідома помилка' }));
    throw new Error(errorData.message || `HTTP помилка! Статус: ${response.status}`);
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
 * It calls our Next.js proxy route, which forwards the request to the backend.
 */
export async function getCompaniesForToken(tempToken: string): Promise<Company[]> {
    return fetchFromProxy<Company[]>('/api/auth/companies', {
        headers: {
            'Authorization': `Bearer ${tempToken}`
        }
    });
}


/**
 * Calls our Next.js API route to exchange the temporary token and selected company
 * for a permanent token, which the Next.js route will set as an httpOnly cookie.
 */
export async function selectCompany(tempToken: string, companyId: string): Promise<{ success: boolean }> {
    return fetchFromProxy<{ success: boolean }>('/api/auth/select-company', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${tempToken}`,
        },
        body: JSON.stringify({ companyId }),
    });
}

/**
 * Calls our Next.js API route to create a new company and log the user in.
 * The Next.js route handles setting the permanent token as an httpOnly cookie.
 */
export async function createCompanyAndLogin(tempToken: string, companyName: string): Promise<{ success: boolean }> {
     return fetchFromProxy<{ success: boolean }>('/api/auth/create-company', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${tempToken}`,
        },
        body: JSON.stringify({ companyName }),
    });
}

/**
 * Logs out the current user by calling our own Next.js API route,
 * which clears the httpOnly cookie.
 */
export async function logout() {
    try {
        await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
        console.warn("Помилка при виході з системи, але все одно перенаправляємо.", error);
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
             console.log("Сесія застаріла або недійсна. Виконується вихід...");
             if (typeof window !== 'undefined') {
                 window.location.href = '/login';
             }
        }
        const errorData = await response.json().catch(() => ({ message: 'Сталася невідома помилка' }));
        throw new Error(errorData.message || `HTTP помилка! Статус: ${response.status}`);
    }
    
    return response.json();
}
