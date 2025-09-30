# API Documentation

This document provides a detailed overview of the API endpoints available in the PHP-Audit application.

## Authentication

All API endpoints (except the Telegram webhook) require a `Bearer` token for authentication. The token must be passed in the `Authorization` header.

**Example Header:**
```
Authorization: Bearer <your_jwt_token>
```

The JWT token is issued after a successful login via the Telegram bot. See [Login Flow](./login-flow.md) for more details.

---

## Endpoints

### 1. Get Organization Structure

Retrieves the full hierarchical structure of the company associated with the authenticated user.

- **Endpoint:** `GET /org-structure`
- **Method:** `GET`
- **Success Response (200 OK):**

  An array of departments. Each department contains its sections and users.

  ```json
  [
    {
      "id": 1,
      "name": "IT Department",
      "sections": [
        {
          "id": 1,
          "name": "Development",
          "users": [
            {
              "id": 1,
              "full_name": "Admin User"
            }
          ]
        },
        {
          "id": 2,
          "name": "QA",
          "users": [
            {
              "id": 2,
              "full_name": "Tester One"
            }
          ]
        }
      ],
      "users": [
        {
          "id": 4,
          "full_name": "IT Support"
        }
      ]
    },
    {
      "id": 2,
      "name": "Sales Department",
      "sections": [
        {
          "id": 3,
          "name": "B2B Sales",
          "users": [
            {
              "id": 3,
              "full_name": "Sales Manager"
            }
          ]
        }
      ],
      "users": []
    }
  ]
  ```

- **Error Responses:**
  - `401 Unauthorized`: If the token is missing or invalid.
  - `403 Forbidden`: If no company is associated with the user's token.

---

### 2. Create a New Task

Creates a new task within the user's company.

- **Endpoint:** `POST /tasks/create`
- **Method:** `POST`
- **Request Body:**

  ```json
  {
    "title": "Fix the login bug",
    "assignee_id": 2
  }
  ```

- **Success Response (201 Created):**

  ```json
  {
    "status": "success",
    "task_id": "1"
  }
  ```

- **Error Responses:**
  - `400 Bad Request`: If `title` or `assignee_id` are missing or invalid.
  - `401 Unauthorized`: If the token is missing or invalid.
  - `404 Not Found`: If the specified `assignee_id` does not exist within the user's company.

---

### 3. Get Tasks

Retrieves a list of tasks for the user's company. Can be filtered by `assignee_id`.

- **Endpoint:** `GET /tasks/get`
- **Method:** `GET`
- **Query Parameters (Optional):**
  - `assignee_id`: Filters tasks by the ID of the assigned user.

- **Example Usage:**
  - `GET /tasks/get` - Returns all tasks for the company.
  - `GET /tasks/get?assignee_id=2` - Returns all tasks assigned to user with ID 2.

- **Success Response (200 OK):**

  An array of task objects.

  ```json
  [
    {
      "id": 1,
      "title": "Fix the login bug",
      "company_id": 1,
      "assignee_id": 2,
      "reporter_id": 1,
      "status": "new",
      "created_at": "2024-05-21 10:00:00",
      "assignee_name": "Tester One",
      "reporter_name": "Admin User"
    }
  ]
  ```

- **Error Responses:**
  - `401 Unauthorized`: If the token is missing or invalid.
