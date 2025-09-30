
'use server';

/**
 * A server action to log client-side errors to the server console.
 * This can be expanded later to send errors to a dedicated logging service.
 * @param error An object containing details about the client-side error.
 */
export async function reportClientError(error: { message: string; stack?: string; page?: string, digest?: string }) {
    console.error("--- CLIENT-SIDE ERROR REPORT ---");
    console.error("Page:", error.page || "Unknown");
    console.error("Digest:", error.digest || "N/A");
    console.error("Message:", error.message);
    console.error("Stack:", error.stack || "No stack trace available");
    console.error("---------------------------------");
}

/**
 * Sends a message from the user to the support team (e.g., via Telegram).
 * @param message The user's message.
 * @returns An object indicating success or failure.
 */
export async function sendSupportMessage(message: string): Promise<{success: boolean}> {
    // In a real application, you would use a service to send this message.
    // For example, using the Telegram Bot API if you have a support chat.
    console.log("--- NEW SUPPORT MESSAGE ---");
    console.log("Message:", message);
    console.log("---------------------------");
    
    // Simulate a successful operation.
    return { success: true };
}
