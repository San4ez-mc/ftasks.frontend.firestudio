
'use client';

const TOKEN_STORAGE_KEY = 'authToken';
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, "");

if (!API_BASE_URL) {
    console.error("Помилка конфігурації: Змінна NEXT_PUBLIC_API_BASE_URL не встановлена. Додаток не зможе спілкуватися з бекендом.");
}

type BackendResponse<T> = {
  status: 'success' | 'error';
  data?: T;
  message?: string;
  details?: any;
};

/**
 * A generic fetch wrapper for making API requests directly to the external backend.
 */
async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<BackendResponse<T>> {
  const url = `${API_BASE_URL}/${endpoint.replace(/^\/?(api\/)?/, '')}`;

  const headers = new Headers(options.headers || {});
  
  if (!headers.has('Authorization')) {
    const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_STORAGE_KEY) : null;
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }
  
  if (!headers.has('Content-Type') && options.body) {
      headers.set('Content-Type', 'application/json');
  }

  options.headers = headers;

  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
        let errorData;
        try {
            errorData = await response.json();
        } catch (e) {
            throw new Error(`HTTP error! Status: ${response.status}. Не вдалося розпарсити відповідь про помилку.`);
        }
        console.error(`[API Client ERROR] for ${endpoint}:`, errorData);
        throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
    }
    
    if (response.status === 204) {
        return { status: 'success' } as BackendResponse<T>;
    }
    
    const responseBody = await response.json();
    return responseBody as BackendResponse<T>;

  } catch (error) {
    console.error(`[API Client CATCH] for ${endpoint}:`, error);
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
  const response = await apiFetch<{ companies: CompanyFromApi[] }>('auth/telegram-companies', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${tempToken}`,
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
  const response = await apiFetch<{ jwt: string }>('auth/telegram-select-company', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${tempToken}`,
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
    const response = await apiFetch<{ jwt: string }>('auth/telegram-create-company', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${tempToken}`,
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
        const response = await apiFetch<{user: UserProfile}>('auth/me');
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
        await apiFetch('/auth/logout', { method: 'POST' });
    } catch (error) {
        console.warn("Server-side logout call failed, but proceeding with client-side logout.", error);
    } finally {
        if (typeof window !== 'undefined') {
            localStorage.removeItem(TOKEN_STORAGE_KEY);
            window.location.href = '/login';
        }
    }
}
