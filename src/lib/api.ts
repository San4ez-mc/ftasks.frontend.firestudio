
'use client';

/**
 * A generic fetch wrapper with enhanced error logging for making API requests 
 * to the Next.js proxy routes.
 */
async function fetchFromProxy<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `/api/${endpoint.replace(/^\/api\//, '')}`; // Ensure the path starts with /api/

  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      if (response.status === 404) {
        const errorMessage = `Помилка 404 (Не знайдено) для проксі-маршруту: '${url}'. Перевірте, чи існує файл-обробник за шляхом 'src/app${url}/route.ts'.`;
        console.error(`[API Proxy Client]`, errorMessage);
        throw new Error(errorMessage);
      }

      const errorData = await response.json().catch(() => ({}));
      const errorMessage = `Помилка від проксі-маршруту '${url}' (Статус: ${response.status}): ${errorData.message || 'Невідома помилка сервера.'}`;
      
      console.error(`[API Proxy Client] Деталі:`, errorData.details || errorData);
      if(errorData.details?.backendResponse) {
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
    console.error(`[API Proxy Client] Критична помилка запиту до '${url}':`, error);
    throw error;
  }
}


// --- Authentication API ---

type UserProfile = {
    id: string;
    firstName: string;
    lastName: string;
    // Add other fields as needed from your /auth/me endpoint
}

/**
 * Sends a JWT to the server to be set as a secure httpOnly cookie.
 * @param token The JWT string received from the Telegram bot.
 */
export async function setAuthToken(token: string): Promise<{ success: boolean }> {
    return fetchFromProxy<{ success: boolean }>('auth/set-token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
    });
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

// --- New App API ---

export async function getOrgStructure(): Promise<any> {
    return fetchFromProxy<any>('org-structure');
}

export async function createTask(title: string, assignee_id: number): Promise<{ status: string; task_id: string; }> {
    return fetchFromProxy<{ status: string; task_id: string; }>('tasks/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, assignee_id }),
    });
}

export async function getTasks(assignee_id?: number): Promise<any[]> {
    const endpoint = assignee_id ? `tasks/get?assignee_id=${assignee_id}` : 'tasks/get';
    return fetchFromProxy<any[]>(endpoint);
}

