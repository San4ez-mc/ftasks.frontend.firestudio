
'use client';

// The API base URL is now set to your external backend.
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || 'https://9000-firebase-php-audit-1758820822645.cluster-ha3ykp7smfgsutjta5qfx7ssnm.cloudworkstations.dev').replace(/\/$/, "");

/**
 * A generic fetch wrapper with enhanced error logging for making API requests 
 * to the Next.js proxy routes.
 */
async function fetchFromProxy<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `/${endpoint.replace(/^\//, "")}`; // Ensure it's a relative path

  try {
    const response = await fetch(url, options);

    if (!response.ok) {
        // Attempt to parse the error response as JSON.
        const errorData = await response.json().catch(() => {
            // If JSON parsing fails, it means the server sent something else (like HTML error page).
            return {
                message: `Сервер відповів зі статусом ${response.status}. Можливо, URL проксі-маршруту (${url}) неправильний або файл відсутній.`,
                details: 'Не вдалося розпарсити відповідь про помилку від сервера як JSON.'
            };
        });

        // Log the detailed error information to the browser console.
        console.error(`[API Proxy Client] Помилка для '${url}':`, errorData.message);
        if (errorData.details) {
            console.error(`[API Proxy Client] Деталі:`, errorData.details);
             if (errorData.details.backendResponse) {
                console.error("--- RAW BACKEND RESPONSE ---");
                console.error(errorData.details.backendResponse);
                console.error("--------------------------");
            }
        }

        // Throw a user-friendly error to be caught by the calling function.
        throw new Error(errorData.message || `HTTP помилка! Статус: ${response.status}`);
    }
    
    if (response.status === 204) { // No Content
      return null as T;
    }

    return response.json() as T;

  } catch (error) {
    // This catches network errors or errors thrown from the block above
    console.error(`[API Proxy Client] Критична помилка запиту до '${url}':`, error);
    throw error;
  }
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
 */
export async function getCompaniesForToken(tempToken: string): Promise<Company[]> {
    return fetchFromProxy<Company[]>('api/auth/companies', {
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
    return fetchFromProxy<{ success: boolean }>('api/auth/select-company', {
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
     return fetchFromProxy<{ success: boolean }>('api/auth/create-company', {
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
    try {
        return await fetchFromProxy<UserProfile>('api/auth/me');
    } catch (error: any) {
        if (typeof window !== 'undefined' && error.message.includes('401')) {
             console.log("Сесія застаріла або недійсна. Виконується вихід...");
             window.location.href = '/login';
        }
        // Re-throw other errors to be handled by the calling component
        throw error;
    }
}
