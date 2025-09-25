# FINEKO API Documentation

This document outlines the API endpoints required for the FINEKO application to function with a standalone backend.

**Base URL**: `https://your-backend-api.com/`

---

## 1. Authentication

The authentication flow is based on Telegram and uses a two-token system: a short-lived temporary token for setup and a permanent token for the user session.

### `POST /auth/telegram/login`

**Note: This endpoint should be set as the webhook URL in your Telegram bot's settings.** Telegram will send a POST request with the user's data to this endpoint when they first interact with the bot via the login link.

This is the first step, called by the Next.js webhook. It receives user data from Telegram and issues a temporary JWT.

-   **Request Body**: The Telegram user object.
    ```json
    {
      "id": 123456789,
      "first_name": "John",
      "last_name": "Doe",
      "username": "johndoe",
      "language_code": "en",
      "photo_url": "..."
    }
    ```
-   **Response (200 OK)**: A JSON object containing the temporary token.
    ```json
    {
      "tempToken": "your_temporary_jwt_token"
    }
    ```
-   **Backend Logic**:
    -   Find a user in the `users` table by `tg_user_id`.
    -   If the user doesn't exist, create a new one.
    -   Generate a JWT with a very short expiration (e.g., 5 minutes) containing the internal `userId`.

---

### `GET /auth/telegram/companies`

Called by the frontend on the `/auth/telegram/callback` page to determine the user's next step.

-   **Headers**: `Authorization: Bearer <temporary_jwt_token>`
-   **Response (200 OK)**: An array of Company objects the user is a member of. Can be empty.
    ```json
    [
      { "id": "company-1", "name": "Fineko Development" },
      { "id": "company-2", "name": "My Startup Project" }
    ]
    ```
-   **Response (401 Unauthorized)**: If the temporary token is invalid or expired.

---

### `POST /auth/telegram/select-company`

Called from the `/select-company` page. Exchanges the temporary token and a selected `companyId` for a permanent session token.

-   **Headers**: `Authorization: Bearer <temporary_jwt_token>`
-   **Request Body**:
    ```json
    {
      "companyId": "company-1"
    }
    ```
-   **Response (200 OK)**: The permanent token. The frontend will store this in a secure, session cookie.
    ```json
    {
      "token": "your_permanent_jwt_auth_token"
    }
    ```
-   **Response (401 Unauthorized)**: If the temporary token is invalid.
-   **Response (403 Forbidden)**: If the user is not a member of the requested company.

---

### `POST /auth/telegram/create-company-and-login`

Called from the `/create-company` page for new users. Creates a company and issues a permanent session token.

-   **Headers**: `Authorization: Bearer <temporary_jwt_token>`
-   **Request Body**:
    ```json
    {
      "companyName": "My New Company"
    }
    ```
-   **Response (200 OK)**: The permanent token.
    ```json
    {
      "token": "your_permanent_jwt_auth_token"
    }
    ```
-   **Response (401 Unauthorized)**: If the temporary token is invalid.

---

### `GET /auth/me`

Retrieves the profile of the currently authenticated user using the permanent token. This should be called when the main app loads to get user context.

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

Logs out the current user by invalidating their session/token on the server side (e.g., by deleting it from a sessions table or adding to a denylist).

-   **Headers**: `Authorization: Bearer <your_permanent_jwt_auth_token>`
-   **Response (204 No Content)**

---

## 2. Companies

*All subsequent API endpoints must be protected and require the permanent session token.*
-   **Required Header**: `Authorization: Bearer <your_permanent_jwt_auth_token>`

### `GET /companies`
Get a list of companies the authenticated user is a member of.
- **Response (200 OK)**:
    ```json
    [
      { "id": "company-1", "name": "Fineko Development" },
      { "id": "company-2", "name": "My Startup Project" }
    ]
    ```

### `GET /companies/profile`
Get the profile of the currently selected company (from the JWT).
- **Response (200 OK)**: `CompanyProfile` object.

### `PUT /companies/profile`
Update the profile of the currently selected company.
- **Request Body**: `Partial<CompanyProfile>`
- **Response (200 OK)**: The updated `CompanyProfile` object.

---

## 3. Employees

### `GET /employees`
Get all employees for the current company.
- **Response (200 OK)**: Array of `Employee` objects.

### `POST /employees`
Create a new employee profile (manually).
- **Request Body**: `Omit<Employee, 'id' | 'companyId' | ...>`
- **Response (201 Created)**: The newly created `Employee` object.

### `PUT /employees/{id}`
Update a specific employee's details.
- **Request Body**: `Partial<Employee>`
- **Response (200 OK)**: The updated `Employee` object.

---

## 4. Tasks

### `GET /tasks?date={YYYY-MM-DD}`
Get tasks for a specific date. The backend should filter based on the user's role (self, subordinate, delegated) from the JWT.
- **Query Params**: `date` (required)
- **Response (200 OK)**: Array of `Task` objects.

### `POST /tasks`
Create a new task.
- **Request Body**: `Omit<Task, 'id' | 'companyId'>`
- **Response (201 Created)**: The newly created `Task` object.

### `PUT /tasks/{id}`
Update an existing task.
- **Backend Logic**: If `status` is changed to `'done'` and `assigneeId` is not the same as `reporterId`, the backend should automatically create a new "verification" task assigned to the reporter.
- **Request Body**: `Partial<Task>`
- **Response (200 OK)**: The updated `Task` object.

### `DELETE /tasks/{id}`
Delete a task.
- **Response (204 No Content)**

---

## 5. Results (Goals)

### `GET /results`
Get all results for the current company.
- **Response (200 OK)**: Array of `Result` objects.

### `POST /results`
Create a new result.
- **Request Body**: `Omit<Result, 'id' | 'companyId'>`
- **Response (201 Created)**: The newly created `Result` object.

### `PUT /results/{id}`
Update an existing result.
- **Backend Logic**: Similar to tasks, if `completed` is set to `true` by someone other than the reporter, a verification task should be created for the reporter.
- **Request Body**: `Partial<Result>`
- **Response (200 OK)**: The updated `Result` object.

### `DELETE /results/{id}`
Delete a result.
- **Response (204 No Content)**

---

## 6. Templates

### `GET /templates`
Get all task/result templates for the current company.
- **Response (200 OK)**: Array of `Template` objects.

### `POST /templates`
Create a new template.
- **Request Body**: `Omit<Template, 'id' | 'companyId'>`
- **Response (201 Created)**: The new `Template` object.

### `PUT /templates/{id}`
Update a template.
- **Request Body**: `Partial<Template>`
- **Response (200 OK)**: The updated `Template` object.

### `DELETE /templates/{id}`
Delete a template.
- **Response (204 No Content)**

---

## 7. Organizational Structure

### `GET /org-structure`
Get all data needed for the org structure page in one call.
- **Response (200 OK)**:
    ```json
    {
      "divisions": [...],
      "departments": [...],
      "employees": [...]
    }
    ```

### `POST /org-structure`
Save the entire org structure. This endpoint should handle creating, updating, and deleting entities in a transaction.
- **Request Body**:
    ```json
    {
      "divisions": [...],
      "departments": [...]
    }
    ```
- **Response (200 OK)**: `{ "success": true }`

---

## 8. Business Processes

### `GET /processes`
Get all business processes for the company.
- **Response (200 OK)**: Array of `Process` objects.

### `GET /processes/{id}`
Get a single business process by its ID.
- **Response (200 OK)**: `Process` object.

### `POST /processes`
Create a new process.
- **Request Body**: `Omit<Process, 'id' | 'companyId'>`
- **Response (201 Created)**: The new `Process` object.

### `PUT /processes/{id}`
Update a process.
- **Request Body**: `Partial<Process>`
- **Response (200 OK)**: The updated `Process` object.

### `DELETE /processes/{id}`
Delete a process.
- **Response (204 No Content)**

---

## 9. Instructions (Knowledge Base)

### `GET /instructions`
Get all instructions for the company.
- **Response (200 OK)**: Array of `Instruction` objects.

### `GET /instructions/{id}`
Get a single instruction by ID.
- **Response (200 OK)**: `Instruction` object.

### `POST /instructions`
Create a new instruction.
- **Request Body**: `Omit<Instruction, 'id' | 'companyId'>`
- **Response (201 Created)**: The new `Instruction` object.

### `PUT /instructions/{id}`
Update an instruction.
- **Request Body**: `Partial<Instruction>`
- **Response (200 OK)**: The updated `Instruction` object.

### `DELETE /instructions/{id}`
Delete an instruction.
- **Response (204 No Content)**

---

## 10. Telegram Integration

*(These endpoints are called by the Next.js server, acting as a proxy to the main backend)*

### `POST /telegram/link-group`
Links a Telegram group using a code.
- **Request Body**: `{ "code": "XYZ123" }`
- **Response (200 OK)**: `{ "success": true, "message": "...", "data": <TelegramGroup> }`

### `GET /telegram/groups`
Get linked Telegram groups.
- **Response (200 OK)**: Array of `TelegramGroup` objects.

### `GET /telegram/groups/{id}/members`
Get members of a specific linked group.
- **Response (200 OK)**: Array of `TelegramMember` objects.

### `POST /telegram/groups/{id}/refresh-members`
Trigger a refresh of the group's member list from the Telegram API.
- **Response (200 OK)**: Updated array of `TelegramMember` objects.

### `POST /telegram/groups/{id}/send-message`
Send a message to the group.
- **Request Body**: `{ "text": "Hello world" }`
- **Response (201 Created)**: The `MessageLog` object.

### `GET /telegram/groups/{id}/logs`
Get the message log for a group.
- **Response (200 OK)**: Array of `MessageLog` objects.

### `PUT /telegram/members/{id}`
Link a Telegram member to a company employee.
- **Request Body**: `{ "employeeId": "emp-1" }`
- **Response (200 OK)**: The updated `TelegramMember` object.
