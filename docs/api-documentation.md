# FINEKO API Documentation

This document outlines the API endpoints required for the FINEKO application to function.

**Base URL**: `https://api.tasks.fineko.space/`

## 1. Authentication

The authentication flow is based on Telegram.

### Step 1: User Initiates Login

The user is redirected from the frontend to the Telegram Bot: `https://t.me/FinekoTasks_Bot?start=auth`

### Step 2: Telegram Bot Authenticates and Redirects

The bot authenticates the user and redirects them back to the application with a temporary token.
**Redirect URL**: `https://[YOUR_APP_URL]/auth/telegram/callback?token=<temporary_jwt_token>`

---

### `GET /auth/telegram/companies`

Validates a temporary token and retrieves the list of companies associated with that user. This is called on the `/auth/telegram/callback` page.

-   **Headers**: `Authorization: Bearer <temporary_jwt_token>`
-   **Response (200 OK)**: Array of Company objects.
    ```json
    [
      { "id": "company-1", "name": "Fineko Development" },
      { "id": "company-2", "name": "My Startup Project" }
    ]
    ```
-   **Response (401 Unauthorized)**: If the token is invalid or expired.

---

### `POST /auth/telegram/select-company`

Exchanges the temporary token and a selected `companyId` for a permanent session token. This token should be stored in a secure, HTTP-only cookie by the client. This is called when a user with multiple companies makes a selection on the `/select-company` page.

-   **Headers**: `Authorization: Bearer <temporary_jwt_token>`
-   **Request Body**:
    ```json
    {
      "companyId": "company-1"
    }
    ```
-   **Response (200 OK)**:
    ```json
    {
      "token": "your_permanent_jwt_auth_token"
    }
    ```
-   **Response (401 Unauthorized)**: If the temporary token is invalid.
-   **Response (403 Forbidden)**: If the user is not a member of the requested company.

---

### `POST /auth/telegram/create-company-and-login`

For new users without a company. Creates a new company for the user and immediately issues a permanent session token.

-   **Headers**: `Authorization: Bearer <temporary_jwt_token>`
-   **Request Body**:
    ```json
    {
      "companyName": "My New Company"
    }
    ```
-   **Response (200 OK)**:
    ```json
    {
      "token": "your_permanent_jwt_auth_token"
    }
    ```
-   **Response (401 Unauthorized)**: If the temporary token is invalid.

---

### `GET /auth/me`

Retrieves the profile of the currently authenticated user using the permanent token.

-   **Headers**: `Authorization: Bearer <your_permanent_jwt_auth_token>`
-   **Response (200 OK)**:
    ```json
    {
      "id": "user-1",
      "firstName": "Oleksandr",
      "lastName": "Matsuk",
      "companies": [
        { "id": "company-1", "name": "Fineko Development" }
      ]
    }
    ```

### `POST /auth/logout`

Logs out the current user by invalidating their session/token on the server side.

-   **Headers**: `Authorization: Bearer <your_permanent_jwt_auth_token>`
-   **Response (204 No Content)**

---

## 2. Companies

### `GET /companies`

Get a list of companies the authenticated user is a member of.

-   **Headers**: `Authorization: Bearer <your_permanent_jwt_auth_token>`
-   **Response (200 OK)**:
    ```json
    [
      { "id": "company-1", "name": "Fineko Development" },
      { "id": "company-2", "name": "My Startup Project" }
    ]
    ```

*(Other company endpoints remain the same)*

---

## 3. Employees
*(Endpoints remain the same, but require the permanent auth token)*

---

## 4. Tasks
*(Endpoints remain the same, but require the permanent auth token)*

---

## 5. Results
*(Endpoints remain the same, but require the permanent auth token)*

---
## 6. Organizational Structure
*(Endpoints remain the same, but require the permanent auth token)*

---
## 7. Processes
*(Endpoints remain the same, but require the permanent auth token)*

---
## 8. Instructions
*(Endpoints remain the same, but require the permanent auth token)*

---
## 9. Telegram Groups
*(Endpoints remain the same, but require the permanent auth token)*
