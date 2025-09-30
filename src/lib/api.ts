
'use client';

/**
 * A generic fetch wrapper with enhanced error logging for making API requests 
 * to the Next.js proxy routes.
 */
async function fetchFromProxy<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `/${endpoint.replace(/^\//, '')}`; // Ensure the path is relative

  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      if (response.status === 404) {
        const errorMessage = `Помилка 404: Не знайдено. Проксі-маршрут для '${url}' не існує. Перевірте, чи існує файл за шляхом 'src/app${url}/route.ts'.`;
        console.error(`[API Proxy Client]`, errorMessage);
        throw new Error(errorMessage);
      }
      
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = `Помилка від проксі-маршруту '${url}' (Статус: ${response.status}): ${errorData.message || 'Невідома помилка сервера.'}`;
      
      console.error(`[API Proxy Client] Деталі:`, errorData.details || errorData);
       if (errorData.details?.backendResponse) {
        console.error("--- RAW BACKEND RESPONSE ---");
        console.error(errorData.details.backendResponse);
        console.error("--------------------------");
      }

      throw new Error(errorMessage);
    }
    
    if (response.status === 204) { // No Content
      return null as T;
    }

    return response.json() as T;

  } catch (error) {
    console.error(`[API Proxy Client] Помилка мережі або парсингу для '${url}':`, error);
    throw error;
  }
}

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
 * Exchanges a temporary token and a selected company ID for a permanent session.
 * @param tempToken The temporary JWT.
 * @param companyId The ID of the company the user selected.
 */
export async function selectCompany(tempToken: string, companyId: string): Promise<{ success: boolean }> {
  return fetchFromProxy<{ success: boolean }>('api/auth/select-company', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${tempToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ companyId }),
  });
}

/**
 * Creates a new company and exchanges the temporary token for a permanent session.
 * @param tempToken The temporary JWT.
 * @param companyName The name for the new company.
 */
export async function createCompanyAndLogin(tempToken: string, companyName: string): Promise<{ success: boolean }> {
    return fetchFromProxy<{ success: boolean }>('api/auth/create-company', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${tempToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ companyName }),
    });
}


// --- Authentication API ---

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
             console.log("Сесія застаріла або недійсна. Виконується вихід...");
             window.location.href = '/login';
        }
        throw error;
    }
}

/**
 * Logs out the current user by clearing the auth cookie.
 */
export async function logout() {
    try {
        await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
        console.warn("Помилка при виході з системи, але все одно перенаправляємо.", error);
    } finally {
        window.location.href = '/login';
    }
}
