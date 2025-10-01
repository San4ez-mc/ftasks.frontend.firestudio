'use client';

const TOKEN_STORAGE_KEY = 'authToken';

/**
 * A generic fetch wrapper with enhanced error logging for making API requests 
 * to the Next.js proxy routes.
 * It automatically adds the Authorization header if a token is found in localStorage.
 */
async function fetchFromProxy<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `/${endpoint.replace(/^\//, '')}`; // Ensure the path is relative

  const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_STORAGE_KEY) : null;
  
  const headers = new Headers(options.headers || {});
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  options.headers = headers;

  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      const errorData = await response.json().catch(() => {
        return { message: 'Failed to parse error response from server.', details: { status: response.status, statusText: response.statusText }};
      });
      
      console.error(`[API Proxy Client ERROR] for ${endpoint}:`, errorData.details || errorData);
      
      if (errorData.details?.backendResponse) {
          console.error("--- RAW BACKEND RESPONSE ---");
          console.error(errorData.details.backendResponse);
          console.error("--------------------------");
      }
      
      throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
    }
    
    if (response.status === 204) { // No Content
      return null as T;
    }

    return response.json() as T;

  } catch (error) {
    console.error(`[API Proxy Client CATCH] for ${endpoint}:`, error);
    throw error;
  }
}


// --- Authentication Flow ---

/**
 * Fetches the list of companies associated with a temporary token.
 * @param tempToken The temporary JWT received in the callback.
 */
export async function getCompaniesForToken(tempToken: string): Promise<{ id: string; name: string }[]> {
  return fetchFromProxy<{ id: string; name: string }[]>('api/auth/companies', {
    headers: {
      'Authorization': `Bearer ${tempToken}`,
    },
  });
}

/**
 * Exchanges a temporary token and a selected company ID for a permanent token,
 * which is then stored in localStorage.
 * @param tempToken The temporary JWT.
 * @param companyId The ID of the company the user selected.
 */
export async function selectCompany(tempToken: string, companyId: string): Promise<void> {
  const response = await fetchFromProxy<{ token: string }>('api/auth/select-company', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${tempToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ companyId }),
  });
  if (response.token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, response.token);
  } else {
    throw new Error('Permanent token was not received from the server.');
  }
}

/**
 * Creates a new company and exchanges the temporary token for a permanent session,
 * storing the token in localStorage.
 * @param tempToken The temporary JWT.
 * @param companyName The name for the new company.
 */
export async function createCompanyAndLogin(tempToken: string, companyName: string): Promise<void> {
    const response = await fetchFromProxy<{ token: string }>('api/auth/create-company', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${tempToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ companyName }),
    });
    if (response.token) {
        localStorage.setItem(TOKEN_STORAGE_KEY, response.token);
    } else {
        throw new Error('Permanent token was not received from the server.');
    }
}


// --- Authenticated User API ---

type UserProfile = {
    id: string;
    firstName: string;
    lastName: string;
    // Add other fields as needed from your /auth/me endpoint
}

/**
 * Fetches the profile of the currently authenticated user.
 */
export async function getMe(): Promise<UserProfile> {
    try {
        return await fetchFromProxy<UserProfile>('api/auth/me');
    } catch (error: any) {
        if (typeof window !== 'undefined' && error.message.includes('401')) {
             console.log("Session expired or invalid. Logging out.");
             logout();
        }
        throw error;
    }
}

/**
 * Logs out the current user by clearing the token from localStorage and notifying the server.
 */
export async function logout() {
    try {
        // Notify the server, even if it's just to log the event.
        // This is a fire-and-forget call.
        fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
        console.warn("Server-side logout call failed, but proceeding with client-side logout.", error);
    } finally {
        if (typeof window !== 'undefined') {
            localStorage.removeItem(TOKEN_STORAGE_KEY);
            window.location.href = '/login';
        }
    }
}
