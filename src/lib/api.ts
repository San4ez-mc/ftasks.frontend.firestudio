'use client';

const TOKEN_STORAGE_KEY = 'authToken';

type BackendResponse<T> = {
  status: 'success' | 'error';
  data?: T;
  message?: string;
};

/**
 * A generic fetch wrapper with enhanced error logging for making API requests 
 * to the Next.js proxy routes.
 */
async function fetchFromProxy<T>(endpoint: string, options: RequestInit = {}): Promise<BackendResponse<T>> {
  const url = `/${endpoint.replace(/^\//, '')}`; // Ensure the path is relative

  const headers = new Headers(options.headers || {});
  
  if (!headers.has('Authorization')) {
    const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_STORAGE_KEY) : null;
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  options.headers = headers;

  try {
    const response = await fetch(url, options);
    const responseBody = await response.text();

    if (!response.ok) {
        let errorData;
        try {
            errorData = JSON.parse(responseBody);
        } catch (e) {
            errorData = { message: 'Failed to parse error response from server.', details: { status: response.status, statusText: response.statusText, body: responseBody }};
        }
      
        console.error(`[API Proxy Client ERROR] for ${endpoint}:`, errorData.details || errorData);
        throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
    }
    
    if (response.status === 204) { // No Content
      return { status: 'success' };
    }

    try {
        return JSON.parse(responseBody) as BackendResponse<T>;
    } catch (e) {
         console.error(`[API Proxy Client CATCH] Invalid JSON from ${endpoint}:`, responseBody);
         throw new Error('Відповідь від сервера не є валідним JSON.');
    }

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
export async function getCompaniesForToken(tempToken: string): Promise<{ id: number; name: string, role: string }[]> {
  const response = await fetchFromProxy<{ companies: { id: number; name: string, role: string }[] }>('api/auth/companies', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${tempToken}`,
    },
  });
  
  if (response.status === 'success' && response.data?.companies) {
      return response.data.companies;
  }
  throw new Error(response.message || 'Could not fetch companies.');
}

/**
 * Exchanges a temporary token and a selected company ID for a permanent token.
 * @param tempToken The temporary JWT.
 * @param companyId The ID of the company the user selected.
 */
export async function selectCompany(tempToken: string, companyId: number): Promise<string> {
  const response = await fetchFromProxy<{ jwt: string }>('api/auth/select-company', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${tempToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ company_id: companyId }), // Use snake_case as per the new spec
  });
  if (response.status === 'success' && response.data?.jwt) {
    return response.data.jwt;
  }
  throw new Error(response.message || 'Permanent token was not received from the server.');
}

/**
 * Creates a new company and exchanges the temporary token for a permanent one.
 * @param tempToken The temporary JWT.
 * @param companyName The name for the new company.
 */
export async function createCompanyAndLogin(tempToken: string, companyName: string): Promise<string> {
    const response = await fetchFromProxy<{ jwt: string }>('api/auth/create-company', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${tempToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: companyName }), // Use 'name' as per the new spec
    });
    if (response.status === 'success' && response.data?.jwt) {
        return response.data.jwt;
    }
    throw new Error(response.message || 'Permanent token was not received from the server.');
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
        const response = await fetchFromProxy<UserProfile>('api/auth/me');
        if (response.status === 'success' && response.data) {
            return response.data;
        }
        throw new Error(response.message || 'Failed to fetch user profile.');
    } catch (error: any) {
        if (typeof window !== 'undefined' && (error.message.includes('401') || error.message.includes('Not authenticated'))) {
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
        await fetchFromProxy('/api/auth/logout', { method: 'POST' });
    } catch (error) {
        console.warn("Server-side logout call failed, but proceeding with client-side logout.", error);
    } finally {
        if (typeof window !== 'undefined') {
            localStorage.removeItem(TOKEN_STORAGE_KEY);
            window.location.href = '/login';
        }
    }
}