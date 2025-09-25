# Telegram Bot Setup & Technical Specification

This document provides a guide for setting up the Telegram bot and outlines the technical requirements for its backend logic.

## 1. Creating the Bot in Telegram

1.  **Find BotFather**: Open Telegram and search for the official `@BotFather` bot.
2.  **Create a New Bot**: Send the `/newbot` command to BotFather.
3.  **Choose a Name and Username**:
    *   **Name**: This is the display name (e.g., `FINEKO Tasks`).
    *   **Username**: This must be unique and end in `bot` (e.g., `FinekoTasks_Bot`).
4.  **Save the HTTP API Token**: BotFather will provide you with a token. This is your bot's secret key. Store it securely in your backend's environment variables (e.g., `TELEGRAM_BOT_TOKEN`). **Do not expose this token on the frontend.**

## 2. Bot Backend Logic

Your backend server (e.g., `https://your-backend-api.com/`) needs to handle incoming updates from Telegram. The recommended method is to use a **webhook**.

### Setting the Webhook

You need to tell Telegram where to send updates for your bot. This is done by making a single API call. You can do this by pasting the following URL into your browser after filling in your details:

`https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=<YOUR_BACKEND_WEBHOOK_URL>`

-   `<YOUR_BOT_TOKEN>`: The token you got from BotFather.
-   `<YOUR_BACKEND_WEBHOOK_URL>`: The public URL on your new backend that will receive POST requests from Telegram (e.g., `https://your-backend-api.com/telegram/webhook`).

Your backend server is now responsible for handling all logic related to Telegram commands, as described in the `api-documentation.md`.
