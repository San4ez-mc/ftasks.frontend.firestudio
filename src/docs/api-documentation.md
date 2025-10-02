# Документація API

Цей документ є вичерпним довідником по всіх кінцевих точках (ендпоінтах) API, включаючи детальний опис процесу автентифікації.

**Базова URL-адреса:** `https://9000-firebase-php-audit-1758820822645.cluster-ha3ykp7smfgsutjta5qfx7ssnm.cloudworkstations.dev`

---
## Процес Авторизації

### Покроковий Процес

**1. Початок на Фронтенді**
- Користувач заходить на сайт.
- Фронтенд перевіряє наявність валідного JWT. **На час перевірки відображається сторінка завантаження.**
- Якщо токен недійсний, користувач бачить сторінку входу `/login`.

**2. Перехід до Telegram**
- На сторінці входу фронтенд генерує посилання для переходу в Telegram (`https://t.me/FinekoTasks_Bot?start=tasks`).

**3. Ідентифікація та Отримання Тимчасового Токена**
- Користувач переходить за посиланням, команда `/start` автоматично відправляється боту.
- Бекенд отримує запит через вебхук (`POST /telegram/webhook`)- **Повна URL:** `https://9000-firebase-php-audit-1758820822645.cluster-ha3ykp7smfgsutjta5qfx7ssnm.cloudworkstations.dev/telegram/webhook`
    - **Приклад тіла запиту від Telegram:**
      ```json
      {
          "update_id": 123456789,
          "message": {
              "from": {
                  "id": 345126254,
                  "first_name": "Oleksandr",
                  "last_name": "Matsuk",
                  "username": "olexandrmatsuk"
              },
              "text": "/start"
          }
      }
      ```, знаходить або створює користувача в таблиці `users` і генерує **тимчасовий токен**.
- Бот надсилає кнопку **"Увійти"** з посиланням: `https://studio--fineko-tasktracker.us-central1.hosted.app/auth/telegram/callback?token=<тимчасовий_токен>`.

**4. Запит Списку Компаній**
- Фронтенд отримує тимчасовий токен. **На час виконання запиту відображається індикатор завантаження.**
- Відбувається запит на наступний ендпоінт:

#### `POST /api/auth/telegram-companies`
- **Повна URL:** `https://9000-firebase-php-audit-1758820822645.cluster-ha3ykp7smfgsutjta5qfx7ssnm.cloudworkstations.dev/api/auth/telegram-companies`
- **Автентифікація:** `Bearer <тимчасовий_токен>`
- **Успішна відповідь (200 OK):**
  ```json
  {
    "status": "success",
    "data": {
      "companies": [
        { "id": 1, "name": "Моя Компанія", "role": "owner" },
        { "id": 2, "name": "Інша Компанія", "role": "employee" }
      ]
    }
  }
  ```
- **Помилка (401 Unauthorized):**
  ```json
  {
    "status": "error",
    "message": "Недійсний або прострочений тимчасовий токен."
  }
  ```

**5. Логіка на Фронтенді (Вибір/Створення Компанії)**
- Після отримання відповіді від `/api/auth/telegram-companies`, фронтенд аналізує список `companies`.
- **Якщо список порожній (`companies: []`):**
    - Фронтенд перенаправляє користувача на сторінку `/create-company`.
    - На цій сторінці знаходиться форма для створення нової компанії з полями:
        - **Назва компанії:** обов'язкове поле.
        - **Опис:** необов'язкове поле.
    - При натисканні на кнопку "Створити", фронтенд відправляє запит на `POST /api/auth/telegram-create-company`.
- **Якщо в списку одна компанія:**
    - Фронтенд автоматично, без участі користувача, відправляє запит на `POST /api/auth/telegram-select-company`, використовуючи `id` цієї компанії.
- **Якщо в списку кілька компаній:**
    - Фронтенд відображає сторінку `/select-company` зі списком доступних компаній.
    - Користувач вибирає потрібну компанію зі списку.
    - Після кліку на компанію, фронтенд відправляє запит на `POST /api/auth/telegram-select-company` з `id` вибраної компанії.

**6. Отримання Постійного Токена**

#### `POST /api/auth/telegram-create-company`
- **Повна URL:** `https://9000-firebase-php-audit-1758820822645.cluster-ha3ykp7smfgsutjta5qfx7ssnm.cloudworkstations.dev/api/auth/telegram-create-company`
- **Опис:** Створює нову компанію і повертає **постійний JWT**.
- **Автентифікація:** `Bearer <тимчасовий_токен>`
- **Тіло запиту:** `{ "name": "Назва нової компанії" }`
- **Успішна відповідь (201C Created):**
  ```json
  {
    "status": "success",
    "data": {
      "jwt": "<постійний_jwt_токен>"
    }
  }
  ```
- **Помилка (400 Bad Request):**
  ```json
  {
    "status": "error",
    "message": "Назва компанії не може бути порожньою."
  }
  ```

#### `POST /api/auth/telegram-select-company`
- **Повна URL:** `https://9000-firebase-php-audit-1758820822645.cluster-ha3ykp7smfgsutjta5qfx7ssnm.cloudworkstations.dev/api/auth/telegram-select-company`
- **Опис:** Вибирає існуючу компанію і повертає **постійний JWT**.
- **Автентифікація:** `Bearer <тимчасовий_токен>`
- **Тіло запиту:** `{ "company_id": 1 }`
- **Успішна відповідь (200 OK):**
  ```json
  {
    "status": "success",
    "data": {
      "jwt": "<постійний_jwt_токен>"
    }
  }
  ```
- **Помилка (403 Forbidden):**
  ```json
  {
    "status": "error",
    "message": "Ви не є членом цієї компанії."
  }
  ```

**7. Завершення Авторизації**
- Фронтенд зберігає постійний JWT. **Може відображатись екран завантаження.**

---
## Інші Кінцеві точки (Endpoints)

*Всі наступні ендпоінти вимагають постійний JWT у заголовку `Authorization`.*