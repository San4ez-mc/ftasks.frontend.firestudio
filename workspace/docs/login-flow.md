# Login Flow via Telegram

This document describes the authentication process for users to gain access to the API.

## Overview

The entire authentication process is handled via a Telegram bot. The user interacts with the bot to prove their identity and select which company they want to work with. Upon successful authentication, the bot issues a long-lived JSON Web Token (JWT) that can be used to access the main API.

## Step-by-Step Process

1.  **User Starts Interaction with Telegram Bot**

    - The user finds the bot in Telegram and sends the `/start` command.

2.  **Bot Requests Authentication Code**

    - The bot asks the user to provide a unique authentication code. This code is typically provided to the user by a company administrator.
    - The user sends the code to the bot (e.g., `B4A-32C`).

3.  **Backend Verifies the Code**

    - The Telegram webhook receives the code and validates it against the `telegram_auth_codes` table in the database.
    - It checks:
        - If the code exists.
        - If the code has not expired.
        - If the code is associated with a valid company.

4.  **Bot Issues a JWT**

    - If the code is valid, the backend generates a JWT.
    - **The JWT payload contains:** `user_id`, `company_id`, and an expiration date (`exp`).
    - This token links the user's Telegram identity to a specific user profile and a specific company in the database.

5.  **Bot Sends Token to User**

    - The bot sends a message back to the user containing the generated JWT.
    - This token is now ready to be used for all subsequent API requests.

## Using the JWT

To make authenticated requests, the user must include the JWT in the `Authorization` header as a `Bearer` token.

**Example:**

```http
GET /org-structure
Host: your-api-domain.com
Authorization: Bearer <the_jwt_token_from_the_bot>
```

This simplified flow ensures that only verified users who have been explicitly granted access can interact with the API.
