
'use client';

const TOKEN_STORAGE_KEY = 'authToken';

type BackendResponse<T> = {
  status: 'success' | 'error';
  data?: T;
  message?: string;
  details?: any;
};

async function fetchFromProxy<T>(endpoint: string, options: RequestInit = {}): Promise<BackendResponse<T>> {
  const url = `/${endpoint.replace(/^\//, '')}`;

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

    let data: BackendResponse<T>;
    try {
        data = JSON.parse(responseBody);
    } catch (e) {
         console.error(`[API Proxy Client CATCH] Invalid JSON from ${endpoint}:`, responseBody);
         throw new Error('Відповідь від зовнішнього бекенду не є валідним JSON.');
    }
    
    if (!response.ok || data.status === 'error') {
        console.error(`[API Proxy Client ERROR] for ${endpoint}:`, data.details || data);
        if (data.details?.backendResponse) {
          console.error("--- RAW BACKEND RESPONSE ---");
          console.error(data.details.backendResponse);
          console.error("--------------------------");
        }
        throw new Error(data.message || `HTTP error! Status: ${response.status}`);
    }
    
    return data;

  } catch (error) {
    console.error(`[API Proxy Client CATCH] for ${endpoint}:`, error);
    throw error;
  }
}


// --- Authentication Flow ---

type CompanyFromApi = { id: number; name: string; role: string };

/**
 * Fetches the list of companies associated with a temporary token.
 * @param tempToken The temporary JWT received in the callback.
 */
export async function getCompaniesForToken(tempToken: string): Promise<CompanyFromApi[]> {
  const response = await fetchFromProxy<{ companies: CompanyFromApi[] }>('api/auth/companies', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${tempToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });
  return response.data?.companies || [];
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
    body: JSON.stringify({ company_id: companyId }), 
  });
  if (response.data?.jwt) {
    return response.data.jwt;
  }
  throw new Error('Permanent token (jwt) was not received from the server.');
}

/**
 * Creates a new company and exchanges the temporary token for a permanent one.
 * @param tempToken The temporary JWT.
 * @param companyName The name for the new company.
 * @param description An optional description for the new company.
 */
export async function createCompanyAndLogin(tempToken: string, companyName: string, description: string): Promise<string> {
    const response = await fetchFromProxy<{ jwt: string }>('api/auth/create-company', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${tempToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: companyName, description: description || '' }),
    });
    if (response.data?.jwt) {
        return response.data.jwt;
    }
    throw new Error('Permanent token (jwt) was not received from the server.');
}


// --- Authenticated User API ---

type UserProfile = {
    id: string;
    firstName: string;
    lastName: string;
};

/**
 * Fetches the profile of the currently authenticated user.
 */
export async function getMe(): Promise<UserProfile> {
    try {
        const response = await fetchFromProxy<{user: UserProfile}>('api/auth/me');
        if (response.data?.user) {
            return response.data.user;
        }
        throw new Error('User profile not found in response');
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
