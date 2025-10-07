# Модуль "Результати": Специфікація API

Цей документ описує API-ендпоінти, необхідні для функціонування сторінки "Результати" (`/results`). Всі запити вимагають наявності валідного JWT у заголовку `Authorization`.

## 1. Отримання всіх результатів

### `GET /results`

-   **Опис:** Отримує повний список результатів для поточної компанії користувача.
-   **Headers:** `Authorization: Bearer <your_permanent_jwt_auth_token>`
-   **Query Parameters:** Немає.
-   **Успішна відповідь (200 OK):**
    ```json
    {
      "status": "success",
      "data": [
        {
          "id": "result-1",
          "name": "Збільшити конверсію сайту на 15%",
          "status": "В роботі",
          "completed": false,
          "deadline": "2024-12-31",
          "assigneeId": "emp-1",
          "reporterId": "emp-2",
          "description": "Покращити воронку продажів на сайті...",
          "expectedResult": "Конверсія на сторінці оплати досягла 5%",
          "subResults": [
            { "id": "sub-1", "name": "Провести A/B тест головної сторінки", "completed": true },
            { "id": "sub-2", "name": "Оптимізувати швидкість завантаження", "completed": false }
          ]
        }
      ]
    }
    ```

## 2. Створення нового результату

### `POST /results`

-   **Опис:** Створює новий результат (ціль).
-   **Headers:** `Authorization: Bearer <your_permanent_jwt_auth_token>`
-   **Request Body:** Об'єкт, що містить дані нового результату.
    ```json
    {
      "name": "Новий результат",
      "status": "Заплановано",
      "completed": false,
      "deadline": "2025-01-15",
      "assigneeId": "emp-1",
      "reporterId": "emp-1",
      "description": "",
      "expectedResult": "",
      "subResults": []
    }
    ```
-   **Успішна відповідь (201 Created):** Повертає повний об'єкт створеного результату.
    ```json
    {
        "status": "success",
        "data": {
            "id": "result-new",
            "name": "Новий результат",
            // ... all other fields
        }
    }
    ```

## 3. Оновлення існуючого результату

### `PUT /results/{id}`

-   **Опис:** Оновлює один або декілька полів існуючого результату.
-   **Headers:** `Authorization: Bearer <your_permanent_jwt_auth_token>`
-   **URL Parameters:**
    -   `{id}`: ID результату, що оновлюється.
-   **Request Body:** Об'єкт, що містить поля для оновлення.
    ```json
    {
      "status": "В роботі",
      "completed": true,
      "subResults": [
          { "id": "sub-1", "name": "Провести A/B тест", "completed": true },
          { "id": "sub-2", "name": "Оптимізувати швидкість", "completed": true }
      ]
    }
    ```
-   **Логіка на бекенді:**
    -   Якщо поле `completed` змінюється на `true`, і `assigneeId` не дорівнює `reporterId`, бекенд має автоматично створити нову задачу типу "перевірка" для `reporterId`.
-   **Успішна відповідь (200 OK):** Повертає повний, оновлений об'єкт результату.
    ```json
    {
        "status": "success",
        "data": {
            "id": "result-1",
            "status": "В роботі",
            "completed": true,
            // ... all other fields
        }
    }
    ```

## 4. Видалення результату

### `DELETE /results/{id}`

-   **Опис:** Видаляє результат.
-   **Headers:** `Authorization: Bearer <your_permanent_jwt_auth_token>`
-   **URL Parameters:**
    -   `{id}`: ID результату для видалення.
-   **Успішна відповідь (204 No Content):** Повертає порожнє тіло відповіді.
-   **Відповідь з помилкою (404 Not Found):** Якщо результат з таким ID не знайдено.
    ```json
    {
        "status": "error",
        "message": "Результат не знайдено."
    }
    ```