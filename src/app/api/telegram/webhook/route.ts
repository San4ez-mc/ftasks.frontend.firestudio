
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { handleTelegramLogin, generateGroupLinkCode, findUserByTelegramId } from '@/lib/telegram-auth';
import { parseTelegramCommand } from '@/ai/flows/telegram-command-flow';
import { getAllEmployees, createTaskInDb, createResultInDb } from '@/lib/firestore-service';
import type { Task } from '@/types/task';
import type { Result } from '@/types/result';


interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

interface TelegramChat {
    id: number;
    title: string;
    type: 'private' | 'group' | 'supergroup';
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://studio--fineko-tasktracker.us-central1.hosted.app";
const BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME || "FinekoTasks_Bot";

const mainMenu = {
    keyboard: [
        [{ text: "Задачі", web_app: { url: `${APP_URL}/` } }, { text: "Результати", web_app: { url: `${APP_URL}/results` } }],
        [{ text: "Орг.структура", web_app: { url: `${APP_URL}/org-structure` } }, { text: "Шаблони", web_app: { url: `${APP_URL}/templates` } }]
    ],
    resize_keyboard: true,
};

async function sendTelegramReply(chatId: number, message: {text: string, reply_markup?: any}) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken) {
    console.error("TELEGRAM_BOT_TOKEN is not defined.");
    return;
  }

  const apiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
  
  const finalReplyMarkup = message.reply_markup ? message.reply_markup : mainMenu;
  
  const payload = {
    chat_id: chatId,
    text: message.text,
    reply_markup: finalReplyMarkup,
    parse_mode: 'Markdown'
  };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error(`Failed to send Telegram message:`, responseData);
    } else {
        console.log("Successfully sent Telegram message.");
    }
  } catch(error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown fetch error";
      console.error("Failed to execute fetch request to Telegram API.", errorMessage, error);
  }
}

async function handleNaturalLanguageCommand(chat: TelegramChat, user: TelegramUser, text: string) {
    const finekoUser = await findUserByTelegramId(user.id.toString());
    if (!finekoUser) {
        await sendTelegramReply(chat.id, { text: "Вибачте, я не можу знайти ваш профіль в системі. Будь ласка, спочатку увійдіть через додаток." });
        return;
    }

    try {
        const employees = await getAllEmployees();
        const employeeList = employees.map(e => ({ id: e.id, name: `${e.firstName} ${e.lastName}` }));

        const aiResult = await parseTelegramCommand({
            command: text,
            employees: employeeList,
        });

        switch (aiResult.command) {
            case 'create_task':
                if (aiResult.parameters?.title) {
                    const assigneeName = aiResult.parameters.assigneeName || `${finekoUser.firstName} ${finekoUser.lastName}`;
                    const assignee = employees.find(e => `${e.firstName} ${e.lastName}` === assigneeName);

                    const newTaskData: Omit<Task, 'id'> = {
                        title: aiResult.parameters.title,
                        dueDate: aiResult.parameters.dueDate || new Date().toISOString().split('T')[0],
                        status: 'todo',
                        type: 'important-not-urgent',
                        expectedTime: 30,
                        assignee: assignee ? { id: assignee.id, name: `${assignee.firstName} ${assignee.lastName}`, avatar: assignee.avatar } : { name: assigneeName },
                        reporter: { id: finekoUser.id, name: `${finekoUser.firstName} ${finekoUser.lastName}` },
                    };
                    const createdTask = await createTaskInDb(newTaskData);
                    await sendTelegramReply(chat.id, { text: `✅ Задачу створено: "${createdTask.title}" для ${assigneeName}.` });
                } else {
                     await sendTelegramReply(chat.id, { text: "Не вдалося створити задачу. Спробуйте ще раз, вказавши назву." });
                }
                break;
            
            case 'create_result':
                 if (aiResult.parameters?.title) {
                    const assigneeName = aiResult.parameters.assigneeName || `${finekoUser.firstName} ${finekoUser.lastName}`;
                    const assignee = employees.find(e => `${e.firstName} ${e.lastName}` === assigneeName);
                    const twoWeeksFromNow = new Date();
                    twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);

                    const newResultData: Omit<Result, 'id'> = {
                        name: aiResult.parameters.title,
                        status: 'Заплановано',
                        completed: false,
                        deadline: aiResult.parameters.dueDate || twoWeeksFromNow.toISOString().split('T')[0],
                        assignee: assignee ? { id: assignee.id, name: `${assignee.firstName} ${assignee.lastName}`, avatar: assignee.avatar } : { name: assigneeName, id: '' },
                        reporter: { id: finekoUser.id, name: `${finekoUser.firstName} ${finekoUser.lastName}` },
                        description: '',
                        expectedResult: '',
                        subResults: [], tasks: [], templates: [], comments: [], accessList: [],
                    };
                    const createdResult = await createResultInDb(newResultData);
                    await sendTelegramReply(chat.id, { text: `🎯 Результат створено: "${createdResult.name}" для ${assigneeName}.` });
                } else {
                     await sendTelegramReply(chat.id, { text: "Не вдалося створити результат. Спробуйте ще раз, вказавши назву." });
                }
                break;

            case 'list_employees':
                const employeeNames = employees.map(e => `- ${e.firstName} ${e.lastName}`).join('\n');
                await sendTelegramReply(chat.id, { text: `Ось список співробітників:\n${employeeNames}` });
                break;

            case 'clarify':
                await sendTelegramReply(chat.id, { text: `🤔 ${aiResult.missingInfo}` });
                break;

            case 'unknown':
            default:
                await sendTelegramReply(chat.id, { text: aiResult.reply || "Вибачте, я не зрозумів ваш запит. Спробуйте перефразувати." });
                break;
        }
    } catch (error) {
        console.error("Error processing natural language command:", error);
        await sendTelegramReply(chat.id, { text: "Виникла помилка під час обробки вашого запиту." });
    }
}


/**
 * This is the Next.js backend endpoint that Telegram will call.
 */
export async function POST(request: NextRequest) {
  console.log("Webhook request received");
  
  try {
    const body = await request.json();
    console.log("Webhook body:", JSON.stringify(body, null, 2));

    if (body.message) {
        const message = body.message;
        const chat: TelegramChat = message.chat;
        const fromUser: TelegramUser = message.from;
        const text = (message.text || '') as string;
        const isReplyToBot = message.reply_to_message?.from?.username === BOT_USERNAME;
        const isBotMentioned = text.includes(`@${BOT_USERNAME}`);

        // --- /start command handler ---
        if (text.startsWith('/start')) {
            // Group Linking Flow
            if (chat.type === 'group' || chat.type === 'supergroup') {
                const { code, error } = await generateGroupLinkCode(chat.id.toString(), chat.title);
                if (error || !code) {
                     await sendTelegramReply(chat.id, { text: `Не вдалося згенерувати код для прив'язки: ${error}` });
                     return NextResponse.json({ status: 'error', message: error }, { status: 500 });
                }
                
                const linkUrl = `${APP_URL}/telegram-groups?action=add-group`;
                
                await sendTelegramReply(chat.id, {
                    text: `Для прив'язки цієї групи до FINEKO, адміністратор має ввести цей код на сторінці 'Телеграм групи':\n\n*${code}*\n\nКод дійсний 10 хвилин.`,
                    reply_markup: {
                        inline_keyboard: [[{ text: "Перейти до FINEKO", url: linkUrl }]]
                    }
                });
                return NextResponse.json({ status: 'ok', message: 'Group link code sent.' });
            }
            
            // Private Chat Login Flow
            if (chat.type === 'private') {
                const payload = text.split(' ')[1] || 'auth';
                const rememberMe = payload === 'auth_remember';

                const { tempToken, error, details } = await handleTelegramLogin(fromUser, rememberMe);
                console.log(`User lookup/creation result: ${details}`);

                if (error || !tempToken) {
                    const errorMessage = error || 'Authentication failed. No token provided.';
                    await sendTelegramReply(chat.id, { text: `Помилка автентифікації: ${errorMessage}` });
                    return NextResponse.json({ status: 'error', message: errorMessage }, { status: 500 });
                }
                
                const redirectUrl = `${APP_URL}/auth/telegram/callback?token=${tempToken}`;

                await sendTelegramReply(chat.id, {
                    text: "Будь ласка, натисніть кнопку нижче, щоб завершити вхід. Також ви можете використовувати меню для швидкого доступу до основних розділів.",
                    reply_markup: {
                        inline_keyboard: [[{ text: "Завершити вхід у FINEKO", url: redirectUrl }]],
                        ...mainMenu
                    }
                });
                return NextResponse.json({ status: 'ok', message: 'Login link sent.' });
            }
        } 
        // --- Natural Language Command Handler ---
        else if (chat.type === 'private' || ( (chat.type === 'group' || chat.type === 'supergroup') && (isBotMentioned || isReplyToBot) )) {
            await handleNaturalLanguageCommand(chat, fromUser, text);
            return NextResponse.json({ status: 'ok', message: 'Command processed.' });
        }
    }


    return NextResponse.json({ status: 'ok', message: 'Webhook received, but no action taken.' });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('Critical error in webhook handler:', errorMessage, error);
    return NextResponse.json({ status: 'error', message: 'Internal Server Error' }, { status: 500 });
  }
}
