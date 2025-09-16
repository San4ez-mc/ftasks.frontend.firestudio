
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { handleTelegramLogin, generateGroupLinkCode, findUserByTelegramId } from '@/lib/telegram-auth';
import { parseTelegramCommand } from '@/ai/flows/telegram-command-flow';
import { 
    createTaskInDb, 
    createResultInDb, 
    updateTaskInDb, 
    updateResultInDb,
    getAllTasksForCompany,
    getAllResultsForCompany,
    getAllEmployeesForCompany,
    getEmployeeLinkForUser,
    findTelegramGroupByTgId,
    upsertTelegramMember,
    getMembersForGroupDb,
    getAllTemplatesForCompany,
    createTemplateInDb,
} from '@/lib/firestore-service';
import { sendTelegramMessage } from '@/lib/telegram-service';
import type { Task } from '@/types/task';
import type { Result, SubResult } from '@/types/result';
import { ai } from '@/ai/genkit';
import type { Template } from '@/types/template';


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

    const employeeLink = await getEmployeeLinkForUser(finekoUser.id);
    if (!employeeLink) {
        await sendTelegramMessage(chat.id, { text: "Ваш профіль не прив'язаний до жодної компанії." });
        return;
    }
    const { companyId } = employeeLink;

    try {
        const allEmployees = await getAllEmployeesForCompany(companyId);
        const allTemplates = await getAllTemplatesForCompany(companyId);
        const currentEmployee = allEmployees.find(e => e.userId === finekoUser.id);
        const allowedCommands = currentEmployee?.telegramPermissions || [];

        const employeeList = allEmployees.map(e => ({ id: e.id, name: `${e.firstName} ${e.lastName}` }));
        const templateList = allTemplates.map(t => ({ id: t.id, name: t.name }));

        const aiResult = await parseTelegramCommand({
            command: text,
            employees: employeeList,
            templates: templateList,
            allowedCommands: allowedCommands,
        });

        const params = aiResult.parameters;

        switch (aiResult.command) {
            case 'create_task':
                if (params?.title) {
                    const assigneeName = params.assigneeName || `${finekoUser.firstName} ${finekoUser.lastName}`;
                    const assignee = allEmployees.find(e => `${e.firstName} ${e.lastName}` === assigneeName);

                    const newTaskData: Omit<Task, 'id' | 'companyId'> = {
                        title: params.title,
                        dueDate: params.dueDate || new Date().toISOString().split('T')[0],
                        status: 'todo',
                        type: 'important-not-urgent',
                        expectedTime: 30,
                        assignee: assignee ? { id: assignee.id, name: `${assignee.firstName} ${assignee.lastName}`, avatar: assignee.avatar } : { id: 'unknown', name: assigneeName },
                        reporter: { id: finekoUser.id, name: `${finekoUser.firstName} ${finekoUser.lastName}`, avatar: finekoUser.avatar },
                    };
                    const createdTask = await createTaskInDb(companyId, newTaskData);
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

                    const transformToDbSubResults = (items: any[] | undefined): SubResult[] => {
                        if (!items || items.length === 0) return [];
                        return items.map(item => ({
                            id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                            name: item.name,
                            completed: false,
                            subResults: item.subResults ? transformToDbSubResults(item.subResults) : []
                        }));
                    };

                    const newResultData: Omit<Result, 'id' | 'companyId'> = {
                        name: params.title,
                        status: 'Заплановано',
                        completed: false,
                        deadline: params.dueDate || twoWeeksFromNow.toISOString().split('T')[0],
                        assignee: assignee ? { id: assignee.id, name: `${assignee.firstName} ${assignee.lastName}`, avatar: assignee.avatar } : { name: assigneeName, id: '' },
                        reporter: { id: finekoUser.id, name: `${finekoUser.firstName} ${finekoUser.lastName}`, avatar: finekoUser.avatar },
                        description: '',
                        expectedResult: '',
                        subResults: transformToDbSubResults(params.subResults), 
                        tasks: [], 
                        templates: [], 
                        comments: [], 
                        accessList: [],
                    };
                    const createdResult = await createResultInDb(companyId, newResultData);
                    await sendTelegramMessage(chat.id, { text: `🎯 Результат "${createdResult.name}" та його підрезультати було створено.` });
                } else {
                     await sendTelegramMessage(chat.id, { text: "Не вдалося створити результат. Спробуйте ще раз, вказавши назву." });
                }
                break;
            
            case 'edit_task_title':
                if (params?.targetTitle && params.newTitle) {
                    const allTasks = await getAllTasksForCompany(companyId);
                    const taskToEdit = allTasks.find(t => t.title.toLowerCase() === params.targetTitle?.toLowerCase());
                    if (taskToEdit) {
                        await updateTaskInDb(companyId, taskToEdit.id, { title: params.newTitle });
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
                    const allResults = await getAllResultsForCompany(companyId);
                    const resultToComment = allResults.find(r => r.name.toLowerCase() === params.targetTitle?.toLowerCase());
                    if (resultToComment) {
                        const newComment = {
                            id: `comment-${Date.now()}`,
                            text: params.commentText,
                            author: { id: finekoUser.id, name: `${finekoUser.firstName} ${finekoUser.lastName}`, avatar: finekoUser.avatar },
                            timestamp: new Date().toLocaleString('uk-UA')
                        };
                        const updatedComments = [...(resultToComment.comments || []), newComment];
                        await updateResultInDb(companyId, resultToComment.id, { comments: updatedComments });
                        await sendTelegramMessage(chat.id, { text: `💬 Коментар додано до результату "${params.targetTitle}".` });
                    } else {
                        await sendTelegramMessage(chat.id, { text: `❌ Не знайдено результат з назвою "${params.targetTitle}".` });
                    }
                } else {
                    await sendTelegramMessage(chat.id, { text: `🤔 Щоб додати коментар, вкажіть назву результату та текст коментаря.` });
                }
                break;
            
            case 'view_tasks': {
                const allTasks = await getAllTasksForCompany(companyId);
                let filteredTasks = allTasks;

                const today = new Date().toISOString().split('T')[0];
                const startDate = params?.startDate || today;
                const endDate = params?.endDate || startDate;
                filteredTasks = filteredTasks.filter(t => t.dueDate >= startDate && t.dueDate <= endDate);
                
                let assigneeName = params?.assigneeName;
                if (assigneeName === 'мої' || !assigneeName) {
                    assigneeName = `${finekoUser.firstName} ${finekoUser.lastName}`;
                }
                const assignee = allEmployees.find(e => `${e.firstName} ${e.lastName}` === assigneeName);
                if (assignee) {
                    filteredTasks = filteredTasks.filter(t => t.assignee && t.assignee.id === assignee.id);
                }
                
                if (params?.status) {
                    filteredTasks = filteredTasks.filter(t => t.status === params.status);
                }

                if (filteredTasks.length === 0) {
                    await sendTelegramMessage(chat.id, { text: `✅ Задач на ${startDate} для ${assigneeName} не знайдено.` });
                } else {
                    const taskList = filteredTasks.map(t => {
                        const status = t.status === 'done' ? '✅' : '📝';
                        const title = t.title || 'Без назви';
                        return `- ${status} ${title}`;
                    }).join('\n');
                    await sendTelegramMessage(chat.id, { text: `Ось задачі для ${assigneeName} на ${startDate}:\n${taskList}` });
                }
                break;
            }

            case 'view_results': {
                const allResults = await getAllResultsForCompany(companyId);
                let filteredResults = allResults;

                let assigneeName = params?.assigneeName;
                if (assigneeName === 'мої' || !assigneeName) {
                    assigneeName = `${finekoUser.firstName} ${finekoUser.lastName}`;
                }
                const assignee = allEmployees.find(e => `${e.firstName} ${e.lastName}` === assigneeName);
                if (assignee) {
                    filteredResults = filteredResults.filter(r => r.assignee && r.assignee.id === assignee.id);
                }

                if (params?.status) {
                    filteredResults = filteredResults.filter(r => r.status === params.status);
                }

                if (filteredResults.length === 0) {
                    await sendTelegramMessage(chat.id, { text: `✅ Результатів для ${assigneeName} не знайдено.` });
                } else {
                    const resultList = filteredResults.map(r => `- ${r.completed ? '✅' : '🎯'} ${r.name}`).join('\n');
                    await sendTelegramMessage(chat.id, { text: `Ось результати для ${assigneeName}:\n${resultList}` });
                }
                break;
            }

            case 'list_employees':
                const employeeNames = allEmployees.map(e => `- ${e.firstName} ${e.lastName}`).join('\n');
                await sendTelegramMessage(chat.id, { text: `Ось список співробітників:\n${employeeNames}` });
                break;
            
            case 'view_task_details': {
                if (!params?.title) {
                    await sendTelegramMessage(chat.id, { text: "Будь ласка, вкажіть назву задачі, яку хочете переглянути." });
                    break;
                }
                const allTasks = await getAllTasksForCompany(companyId);
                const task = allTasks.find(t => t.title && t.title.toLowerCase() === params.title?.toLowerCase());
                if (task) {
                    const details = `
*Задача:* ${task.title}
*Статус:* ${task.status}
*Виконавець:* ${task.assignee?.name || 'Не призначено'}
*Дедлайн:* ${task.dueDate}
*Опис:* ${task.description || 'Немає'}
                    `.trim();
                    await sendTelegramMessage(chat.id, { text: details });
                } else {
                    await sendTelegramMessage(chat.id, { text: `❌ Не знайдено задачу з назвою "${params.title}".` });
                }
                break;
            }

            case 'add_comment_to_task': {
                if (params?.targetTitle && params.commentText) {
                    const allTasks = await getAllTasksForCompany(companyId);
                    const taskToComment = allTasks.find(t => t.title && t.title.toLowerCase() === params.targetTitle?.toLowerCase());
                    if (taskToComment) {
                        const newComment = {
                            id: `comment-${Date.now()}`,
                            text: params.commentText,
                            author: { id: finekoUser.id, name: `${finekoUser.firstName} ${finekoUser.lastName}`, avatar: finekoUser.avatar },
                            timestamp: new Date().toLocaleString('uk-UA')
                        };
                        const updatedComments = [...(taskToComment.comments || []), newComment];
                        await updateTaskInDb(companyId, taskToComment.id, { comments: updatedComments });
                        await sendTelegramMessage(chat.id, { text: `💬 Коментар додано до задачі "${params.targetTitle}".` });
                    } else {
                        await sendTelegramMessage(chat.id, { text: `❌ Не знайдено задачу з назвою "${params.targetTitle}".` });
                    }
                } else {
                    await sendTelegramMessage(chat.id, { text: `🤔 Щоб додати коментар, вкажіть назву задачі та текст коментаря.` });
                }
                break;
            }

            case 'update_task_status': {
                if (params?.targetTitle && params.status && ['todo', 'done'].includes(params.status)) {
                    const allTasks = await getAllTasksForCompany(companyId);
                    const taskToUpdate = allTasks.find(t => t.title && t.title.toLowerCase() === params.targetTitle?.toLowerCase());
                    if (taskToUpdate) {
                        await updateTaskInDb(companyId, taskToUpdate.id, { status: params.status as 'todo' | 'done' });
                        await sendTelegramMessage(chat.id, { text: `✅ Статус задачі "${params.targetTitle}" оновлено на "${params.status}".` });
                    } else {
                        await sendTelegramMessage(chat.id, { text: `❌ Не знайдено задачу з назвою "${params.targetTitle}".` });
                    }
                } else {
                    await sendTelegramMessage(chat.id, { text: `🤔 Для зміни статусу, вкажіть назву задачі та новий статус ('todo' або 'done').` });
                }
                break;
            }

            case 'update_task_date': {
                if (params?.targetTitle && params.newDueDate) {
                    const allTasks = await getAllTasksForCompany(companyId);
                    const taskToUpdate = allTasks.find(t => t.title && t.title.toLowerCase() === params.targetTitle?.toLowerCase());
                    if (taskToUpdate) {
                        await updateTaskInDb(companyId, taskToUpdate.id, { dueDate: params.newDueDate });
                        await sendTelegramMessage(chat.id, { text: `✅ Дату задачі "${params.targetTitle}" перенесено на ${params.newDueDate}.` });
                    } else {
                        await sendTelegramMessage(chat.id, { text: `❌ Не знайдено задачу з назвою "${params.targetTitle}".` });
                    }
                } else {
                    await sendTelegramMessage(chat.id, { text: `🤔 Для переносу задачі, вкажіть її назву та нову дату.` });
                }
                break;
            }

            case 'list_templates': {
                const templates = await getAllTemplatesForCompany(companyId);
                if (templates.length === 0) {
                    await sendTelegramMessage(chat.id, { text: "У вас ще немає жодного шаблону." });
                } else {
                    const templateList = templates.map(t => `- ${t.name} (${t.repeatability})`).join('\n');
                    await sendTelegramMessage(chat.id, { text: `Ось ваші шаблони:\n${templateList}` });
                }
                break;
            }
            
            case 'create_template': {
                if (params?.title && params.repeatability) {
                    const newTemplateData: Omit<Template, 'id' | 'companyId'> = {
                        name: params.title,
                        repeatability: params.repeatability,
                        startDate: new Date().toISOString().split('T')[0],
                        tasksGenerated: [],
                    };
                    const createdTemplate = await createTemplateInDb(companyId, newTemplateData);
                    await sendTelegramMessage(chat.id, { text: `✅ Шаблон "${createdTemplate.name}" створено з повторенням "${createdTemplate.repeatability}".` });
                } else {
                     await sendTelegramMessage(chat.id, { text: "Для створення шаблону вкажіть назву та правило повторення (наприклад, 'щоденно')." });
                }
                break;
            }
            
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
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        const errorStack = error instanceof Error ? `\n\nStack: ${error.stack}` : '';
        await sendTelegramMessage(chat.id, { text: `🔴 Помилка:\n\n${errorMessage}${errorStack}` });
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

async function handleFirstGroupMessage(chatId: number, chatTitle: string, user: TelegramUser) {
    const group = await findTelegramGroupByTgId(chatId.toString());
    if (!group) return; // Not a group linked to our system

    const members = await getMembersForGroupDb(group.companyId, group.id);
    const isExistingMember = members.some(m => m.tgUserId === user.id.toString());

    if (!isExistingMember) {
        await upsertTelegramMember(group.companyId, {
            groupId: group.id,
            tgUserId: user.id.toString(),
            tgFirstName: user.first_name,
            tgLastName: user.last_name || '',
            tgUsername: user.username || '',
        });
        const username = user.username ? `@${user.username}` : `${user.first_name} ${user.last_name || ''}`;
        await sendTelegramMessage(chatId, { text: `✅ Користувача ${username} додано до компанії "${group.title}".` });
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
                const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
                const errorStack = error instanceof Error ? `\n\nStack: ${error.stack}` : '';
                await sendTelegramMessage(chat.id, { text: `🔴 Помилка обробки аудіо:\n\n${errorMessage}${errorStack}` });
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
        // --- New Member Discovery Handler ---
        else if (text && (chat.type === 'group' || chat.type === 'supergroup')) {
            await handleFirstGroupMessage(chat.id, chat.title, fromUser);
            // This can fall through, so the message is not just "swallowed" if other logic needs to process it.
            // For now, we'll stop here.
            return NextResponse.json({ status: 'ok', message: 'Member discovery checked.' });
        }
    }


    return NextResponse.json({ status: 'ok', message: 'Webhook received, but no action taken.' });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('Critical error in webhook handler:', errorMessage, error);
    // Try to send a message back to the user if we have a chat ID, but this might fail.
    try {
        const body = await request.json().catch(() => ({}));
        const chatId = body?.message?.chat?.id;
        if (chatId) {
            await sendTelegramMessage(chatId, { text: `Критична помилка на сервері. Зверніться до адміністратора.` });
        }
    } catch (sendError) {
        console.error("Failed to send critical error message to user:", sendError);
    }
    return NextResponse.json({ status: 'error', message: 'Internal Server Error' }, { status: 500 });
  }
}
