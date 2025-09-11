
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { handleTelegramLogin, generateGroupLinkCode, findUserByTelegramId } from '@/lib/telegram-auth';
import { parseTelegramCommand } from '@/ai/flows/telegram-command-flow';
import { getAllEmployees, createTaskInDb, createResultInDb, getAllTasks, updateTaskInDb, getAllResults, updateResultInDb } from '@/lib/firestore-service';
import { sendTelegramMessage } from '@/lib/telegram-service';
import type { Task } from '@/types/task';
import type { Result } from '@/types/result';
import type { Employee } from '@/types/company';
import { ai } from '@/ai/genkit';


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

interface TelegramVoice {
    file_id: string;
    duration: number;
    // ... other voice fields
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://studio--fineko-tasktracker.us-central1.hosted.app";
const BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME || "FinekoTasks_Bot";

async function handleNaturalLanguageCommand(chat: TelegramChat, user: TelegramUser, text: string) {
    const finekoUser = await findUserByTelegramId(user.id.toString());
    if (!finekoUser) {
        await sendTelegramMessage(chat.id, { text: "Вибачте, я не можу знайти ваш профіль в системі. Будь ласка, спочатку увійдіть через додаток." });
        return;
    }

    try {
        const allEmployees = await getAllEmployees();
        // Find the employee profile linked to the user
        const currentEmployee = allEmployees.find(e => e.id === finekoUser.id);
        const allowedCommands = currentEmployee?.telegramPermissions || [];

        const employeeList = allEmployees.map(e => ({ id: e.id, name: `${e.firstName} ${e.lastName}` }));

        const aiResult = await parseTelegramCommand({
            command: text,
            employees: employeeList,
            allowedCommands: allowedCommands,
        });

        const params = aiResult.parameters;

        switch (aiResult.command) {
            case 'create_task':
                if (params?.title) {
                    const assigneeName = params.assigneeName || `${finekoUser.firstName} ${finekoUser.lastName}`;
                    const assignee = allEmployees.find(e => `${e.firstName} ${e.lastName}` === assigneeName);

                    const newTaskData: Omit<Task, 'id'> = {
                        title: params.title,
                        dueDate: params.dueDate || new Date().toISOString().split('T')[0],
                        status: 'todo',
                        type: 'important-not-urgent',
                        expectedTime: 30,
                        assignee: assignee ? { id: assignee.id, name: `${assignee.firstName} ${assignee.lastName}`, avatar: assignee.avatar } : { id: 'unknown', name: assigneeName },
                        reporter: { id: finekoUser.id, name: `${finekoUser.firstName} ${finekoUser.lastName}` },
                    };
                    const createdTask = await createTaskInDb(newTaskData);
                    await sendTelegramMessage(chat.id, { text: `✅ Задачу створено: "${createdTask.title}" для ${assigneeName}.` });
                } else {
                     await sendTelegramMessage(chat.id, { text: "Не вдалося створити задачу. Спробуйте ще раз, вказавши назву." });
                }
                break;
            
            case 'create_result':
                 if (params?.title) {
                    const assigneeName = params.assigneeName || `${finekoUser.firstName} ${finekoUser.lastName}`;
                    const assignee = allEmployees.find(e => `${e.firstName} ${e.lastName}` === assigneeName);
                    const twoWeeksFromNow = new Date();
                    twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);

                    const newResultData: Omit<Result, 'id'> = {
                        name: params.title,
                        status: 'Заплановано',
                        completed: false,
                        deadline: params.dueDate || twoWeeksFromNow.toISOString().split('T')[0],
                        assignee: assignee ? { id: assignee.id, name: `${assignee.firstName} ${assignee.lastName}`, avatar: assignee.avatar } : { name: assigneeName, id: '' },
                        reporter: { id: finekoUser.id, name: `${finekoUser.firstName} ${finekoUser.lastName}` },
                        description: '',
                        expectedResult: '',
                        subResults: [], tasks: [], templates: [], comments: [], accessList: [],
                    };
                    const createdResult = await createResultInDb(newResultData);
                    await sendTelegramMessage(chat.id, { text: `🎯 Результат створено: "${createdResult.name}" для ${assigneeName}.` });
                } else {
                     await sendTelegramMessage(chat.id, { text: "Не вдалося створити результат. Спробуйте ще раз, вказавши назву." });
                }
                break;
            
            case 'edit_task_title':
                if (params?.targetTitle && params.newTitle) {
                    const allTasks = await getAllTasks();
                    const taskToEdit = allTasks.find(t => t.title.toLowerCase() === params.targetTitle?.toLowerCase());
                    if (taskToEdit) {
                        await updateTaskInDb(taskToEdit.id, { title: params.newTitle });
                        await sendTelegramMessage(chat.id, { text: `✅ Назву задачі оновлено на "${params.newTitle}".` });
                    } else {
                        await sendTelegramMessage(chat.id, { text: `❌ Не знайдено задачу з назвою "${params.targetTitle}".` });
                    }
                } else {
                    await sendTelegramMessage(chat.id, { text: `🤔 Для зміни назви задачі, вкажіть поточну та нову назву.` });
                }
                break;

            case 'add_comment_to_result':
                 if (params?.targetTitle && params.commentText) {
                    const allResults = await getAllResults();
                    const resultToComment = allResults.find(r => r.name.toLowerCase() === params.targetTitle?.toLowerCase());
                    if (resultToComment) {
                        const newComment = {
                            id: `comment-${Date.now()}`,
                            text: params.commentText,
                            author: { id: finekoUser.id, name: `${finekoUser.firstName} ${finekoUser.lastName}`, avatar: finekoUser.avatar },
                            timestamp: new Date().toLocaleString('uk-UA')
                        };
                        const updatedComments = [...(resultToComment.comments || []), newComment];
                        await updateResultInDb(resultToComment.id, { comments: updatedComments });
                        await sendTelegramMessage(chat.id, { text: `💬 Коментар додано до результату "${params.targetTitle}".` });
                    } else {
                        await sendTelegramMessage(chat.id, { text: `❌ Не знайдено результат з назвою "${params.targetTitle}".` });
                    }
                } else {
                    await sendTelegramMessage(chat.id, { text: `🤔 Щоб додати коментар, вкажіть назву результату та текст коментаря.` });
                }
                break;

            case 'list_employees':
                const employeeNames = allEmployees.map(e => `- ${e.firstName} ${e.lastName}`).join('\n');
                await sendTelegramMessage(chat.id, { text: `Ось список співробітників:\n${employeeNames}` });
                break;
            
            case 'show_help':
                await sendTelegramMessage(chat.id, { text: aiResult.reply || "Я можу допомогти вам з керуванням завдань та результатів." });
                break;

            case 'clarify':
                await sendTelegramMessage(chat.id, { text: `🤔 ${aiResult.missingInfo}` });
                break;

            case 'unknown':
            default:
                await sendTelegramMessage(chat.id, { text: aiResult.reply || "Я не зміг вас зрозуміти. Спробуйте сказати, що ви хочете зробити, наприклад: 'створи задачу', 'створи результат', або 'список співробітників'." });
                break;
        }
    } catch (error) {
        console.error("Error processing natural language command:", error);
        await sendTelegramMessage(chat.id, { text: "Виникла помилка під час обробки вашого запиту." });
    }
}

async function getTelegramAudioDataUri(fileId: string): Promise<string> {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) throw new Error("TELEGRAM_BOT_TOKEN is not defined.");

    const getFileUrl = `https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`;
    const fileInfoResponse = await fetch(getFileUrl);
    if (!fileInfoResponse.ok) throw new Error("Failed to get file info from Telegram.");
    const fileInfo = await fileInfoResponse.json();
    const filePath = fileInfo.result.file_path;
    if (!filePath) throw new Error("File path not found in Telegram response.");

    const downloadUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;
    const audioResponse = await fetch(downloadUrl);
    if (!audioResponse.ok) throw new Error("Failed to download audio file from Telegram.");
    
    const audioBuffer = await audioResponse.arrayBuffer();
    const base64String = Buffer.from(audioBuffer).toString('base64');
    
    return `data:audio/ogg;base64,${base64String}`;
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
        const voice = message.voice as TelegramVoice | undefined;
        const isReplyToBot = message.reply_to_message?.from?.username === BOT_USERNAME;
        const isBotMentioned = text.includes(`@${BOT_USERNAME}`);

        // --- Voice Message Handler ---
        if (voice) {
             try {
                const audioDataUri = await getTelegramAudioDataUri(voice.file_id);

                const transcribeResponse = await ai.generate({
                    model: 'googleai/gemini-1.5-flash-latest',
                    prompt: [{media: {url: audioDataUri, contentType: 'audio/ogg'}}, {text: 'Транскрибуй це аудіо українською мовою. Прибери будь-які слова-паразити та заповнювачі пауз, щоб текст був чистим та лаконічним.'}],
                });
                const transcribedText = transcribeResponse.text;

                if (!transcribedText) {
                    await sendTelegramMessage(chat.id, { text: "Не вдалося розпізнати аудіо. Спробуйте ще раз." });
                    return NextResponse.json({ status: 'ok', message: 'Audio transcription failed.' });
                }

                await handleNaturalLanguageCommand(chat, fromUser, transcribedText);
                return NextResponse.json({ status: 'ok', message: 'Voice command processed.' });

            } catch (error) {
                console.error("Error processing voice message:", error);
                await sendTelegramMessage(chat.id, { text: "Виникла помилка під час обробки вашого голосового повідомлення." });
                return NextResponse.json({ status: 'error', message: 'Failed to process voice command.' });
            }
        }


        // --- /start command handler ---
        if (text.startsWith('/start')) {
            // Group Linking Flow
            if (chat.type === 'group' || chat.type === 'supergroup') {
                const { code, error } = await generateGroupLinkCode(chat.id.toString(), chat.title);
                if (error || !code) {
                     await sendTelegramMessage(chat.id, { text: `Не вдалося згенерувати код для прив'язки: ${error}` });
                     return NextResponse.json({ status: 'error', message: error }, { status: 500 });
                }
                
                const linkUrl = `${APP_URL}/telegram-groups?action=add-group`;
                
                await sendTelegramMessage(chat.id, {
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
                    await sendTelegramMessage(chat.id, { text: `Помилка автентифікації: ${errorMessage}` });
                    return NextResponse.json({ status: 'error', message: errorMessage }, { status: 500 });
                }
                
                const redirectUrl = `${APP_URL}/auth/telegram/callback?token=${tempToken}`;

                await sendTelegramMessage(chat.id, {
                    text: "Будь ласка, натисніть кнопку нижче, щоб завершити вхід.",
                    reply_markup: {
                        inline_keyboard: [[{ text: "Завершити вхід у FINEKO", url: redirectUrl }]],
                    }
                });
                return NextResponse.json({ status: 'ok', message: 'Login link sent.' });
            }
        } 
        // --- Natural Language Command Handler (Text only) ---
        else if (text && (chat.type === 'private' || ( (chat.type === 'group' || chat.type === 'supergroup') && (isBotMentioned || isReplyToBot) ))) {
            const commandText = text.replace(`@${BOT_USERNAME}`, '').trim();
            await handleNaturalLanguageCommand(chat, fromUser, commandText);
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
