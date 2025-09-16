
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


// --- Parameter Parsing Functions ---
const parseTitle = (text: string): string => {
    // Match content within single or double quotes
    const quoteMatch = text.match(/['"](.+?)['"]/);
    if (quoteMatch) return quoteMatch[1];

    // Fallback for commands without quotes, e.g., "ціль Підготувати звіт"
    const commandWords = ['створи задачу', 'створи', 'задача', 'ціль', 'результат', 'створити новий результат'];
    let title = text;
    for (const word of commandWords) {
        if (title.toLowerCase().startsWith(word)) {
            title = title.substring(word.length).trim();
        }
    }
    // Take everything before the next keyword like 'для' or 'на' or ','
    const endMatch = title.match(/(.*?)(?:\s+(?:для|на|,|підрезультати)|$)/i);
    return endMatch ? endMatch[1].trim() : title.trim();
};


const findAssignee = (text: string, employees: {id: string, name: string}[], currentUser: {id: string, name: string}) => {
    const lowerText = text.toLowerCase();
    // Look for 'для ...' pattern
    const forMatch = lowerText.match(/\sдля\s+([^,]+)/);
    if (forMatch) {
        const name = forMatch[1].trim();
        for (const employee of employees) {
            if (employee.name.toLowerCase().includes(name)) {
                return employee;
            }
        }
    }
    return currentUser; // Default to current user
};

const parseDate = (text: string): string => {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('завтра')) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
    }
    if (lowerText.includes('сьогодні')) {
        return new Date().toISOString().split('T')[0];
    }
    const dateMatch = text.match(/\d{4}-\d{2}-\d{2}/);
    if (dateMatch) {
        return dateMatch[0];
    }
     // Match for dd.mm.yyyy or dd.mm.yy
    const shortDateMatch = text.match(/(\d{2})\.(\d{2})\.(\d{2,4})/);
    if (shortDateMatch) {
        const day = shortDateMatch[1];
        const month = shortDateMatch[2];
        let year = shortDateMatch[3];
        if (year.length === 2) {
            year = `20${year}`;
        }
        return `${year}-${month}-${day}`;
    }

    return new Date().toISOString().split('T')[0]; // Default to today
};


const parseSubResults = (text: string): string[] => {
    const match = text.match(/(?:підрезультати|підпункти):?\s*(.+)/i);
    if (!match || !match[1]) return [];

    let subResultsText = match[1];

    // Handle "в ... є підпункти ..." case
    const nestedMatch = subResultsText.match(/в\s+['"]?(.+?)['"]?\s+є\s+підпункти\s+(.+)/i);
    if (nestedMatch) {
        // For simplicity, we'll just merge them all for now.
        // The first part is also a sub-result.
        const parentSubResult = nestedMatch[1].trim();
        const childSubResults = nestedMatch[2].split(/,\s*/).map(s => s.trim());
        return [parentSubResult, ...childSubResults].filter(Boolean);
    }
    
    // Split by commas
    return subResultsText.split(/[,"]+/).map(s => s.trim()).filter(Boolean);
};


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
        
        if (!currentEmployee) {
            await sendTelegramMessage(chat.id, { text: "Ваш профіль не прив'язаний до профілю співробітника в компанії." });
            return;
        }

        const allowedCommands = currentEmployee?.telegramPermissions || [];
        const employeeListForAI = allEmployees.map(e => ({ id: e.id, name: `${e.firstName} ${e.lastName}` }));
        const templateListForAI = allTemplates.map(t => ({ id: t.id, name: t.name }));
        const currentUserForAI = { id: currentEmployee.id, name: `${currentEmployee.firstName} ${currentEmployee.lastName}` };
        
        const aiResults = await parseTelegramCommand({
            command: text,
            employees: employeeListForAI,
            templates: templateListForAI,
            allowedCommands: allowedCommands,
            currentUser: currentUserForAI,
        });

        // The webhook now executes a sequence of commands
        for (const aiResult of aiResults) {
            const commandText = aiResult.text || '';

            switch (aiResult.command) {
                case 'create_task': {
                    const title = parseTitle(commandText);
                    const assigneeInfo = findAssignee(commandText, employeeListForAI, currentUserForAI);
                    const assignee = allEmployees.find(e => e.id === assigneeInfo.id);
                    if (!assignee) {
                        await sendTelegramMessage(chat.id, { text: `Не знайдено співробітника ${assigneeInfo.name}.` });
                        continue;
                    }
                    const dueDate = parseDate(commandText);
                    const assigneeName = `${assignee.firstName} ${assignee.lastName}`;

                    const newTaskData: Omit<Task, 'id' | 'companyId'> = {
                        title: title,
                        dueDate: dueDate,
                        status: 'todo',
                        type: 'important-not-urgent',
                        expectedTime: 30,
                        assignee: { id: assignee.id, name: assigneeName, avatar: assignee.avatar || '' },
                        reporter: { id: currentEmployee.id, name: `${currentEmployee.firstName} ${currentEmployee.lastName}`, avatar: currentEmployee.avatar || '' },
                    };
                    const createdTask = await createTaskInDb(companyId, newTaskData);
                    await sendTelegramMessage(chat.id, { text: `✅ Задачу створено: "${createdTask.title}" для ${assigneeName}.` });
                    break;
                }
                
                case 'create_result': {
                    const params = { title: parseTitle(commandText) };
                    const assigneeInfo = findAssignee(commandText, employeeListForAI, currentUserForAI);
                    const assignee = allEmployees.find(e => e.id === assigneeInfo.id);
                     if (!assignee) {
                        await sendTelegramMessage(chat.id, { text: `Не знайдено співробітника ${assigneeInfo.name}.` });
                        continue;
                    }
                    const deadline = parseDate(commandText);

                    const twoWeeksFromNow = new Date();
                    twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);

                    const newResultData: Omit<Result, 'id' | 'companyId'> = {
                        name: params.title,
                        status: 'Заплановано',
                        completed: false,
                        deadline: deadline || twoWeeksFromNow.toISOString().split('T')[0],
                        assignee: { id: assignee.id, name: `${assignee.firstName} ${assignee.lastName}`, avatar: assignee.avatar || '' },
                        reporter: { id: currentEmployee.id, name: `${currentEmployee.firstName} ${currentEmployee.lastName}`, avatar: currentEmployee.avatar || '' },
                        subResults: [],
                        tasks: [],
                        templates: [],
                        comments: [],
                        accessList: [],
                        description: '',
                        expectedResult: '',
                    };
                    const createdResult = await createResultInDb(companyId, newResultData);
                    await sendTelegramMessage(chat.id, { text: `🎯 Результат "${createdResult.name}" створено.` });
                    
                    const subResultNames = parseSubResults(commandText);
                    if (subResultNames.length > 0) {
                        const newSubResults: SubResult[] = subResultNames.map(name => ({
                           id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                           name,
                           completed: false,
                       }));
                       await updateResultInDb(companyId, createdResult.id, { subResults: newSubResults });
                       await sendTelegramMessage(chat.id, { text: `📝 Додано підрезультати:\n- ${subResultNames.join('\n- ')}` });
                    }
                    break;
                }
                 case 'add_sub_results': {
                    const allResults = await getAllResultsForCompany(companyId);
                    const params = {
                        parentResultTitle: parseTitle(commandText),
                        subResultNames: parseSubResults(commandText)
                    };
                    
                    const parentResult = allResults.find(r => r.name.toLowerCase().includes(params.parentResultTitle.toLowerCase()));

                    if (parentResult) {
                        const newSubResults: SubResult[] = params.subResultNames.map(name => ({
                            id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                            name,
                            completed: false,
                        }));
                        const updatedSubResults = [...(parentResult.subResults || []), ...newSubResults];
                        await updateResultInDb(companyId, parentResult.id, { subResults: updatedSubResults });
                        await sendTelegramMessage(chat.id, { text: `📝 Додано підрезультати до "${parentResult.name}":\n- ${params.subResultNames.join('\n- ')}` });
                    } else {
                        await sendTelegramMessage(chat.id, { text: `🤔 Не вдалося знайти результат "${params.parentResultTitle}", щоб додати підрезультати.` });
                    }
                    break;
                }

                case 'view_my_tasks': {
                    const allTasks = await getAllTasksForCompany(companyId);
                    const date = parseDate(commandText || 'сьогодні');
                    const isTodo = commandText.includes('невиконані');
                    
                    let filteredTasks = allTasks.filter(t => t.dueDate === date && t.assignee?.id === currentEmployee.id);
                    if(isTodo) {
                        filteredTasks = filteredTasks.filter(t => t.status === 'todo');
                    }
                    
                    if (filteredTasks.length === 0) {
                        await sendTelegramMessage(chat.id, { text: `✅ Ваших задач на ${date} не знайдено.` });
                    } else {
                        const taskList = filteredTasks.map(t => `- ${t.status === 'done' ? '✅' : '📝'} ${t.title}`).join('\n');
                        await sendTelegramMessage(chat.id, { text: `Ось ваші задачі на ${date}:\n${taskList}` });
                    }
                    break;
                }
                 case 'view_tasks': {
                    const allTasks = await getAllTasksForCompany(companyId);
                    const date = parseDate(commandText || 'сьогодні');
                    const assigneeInfo = findAssignee(commandText, employeeListForAI, currentUserForAI);
                    
                    let filteredTasks = allTasks.filter(t => t.dueDate === date);
                    if (assigneeInfo && assigneeInfo.id !== currentUserForAI.id) {
                       filteredTasks = filteredTasks.filter(t => t.assignee?.id === assigneeInfo.id);
                    }
                    
                    if (filteredTasks.length === 0) {
                        const forWhom = assigneeInfo && assigneeInfo.id !== currentUserForAI.id ? `для ${assigneeInfo.name}` : '';
                        await sendTelegramMessage(chat.id, { text: `✅ Задач ${forWhom} на ${date} не знайдено.` });
                    } else {
                        const taskList = filteredTasks.map(t => `- ${t.status === 'done' ? '✅' : '📝'} ${t.title} (виконавець: ${t.assignee.name})`).join('\n');
                        await sendTelegramMessage(chat.id, { text: `Ось задачі на ${date}:\n${taskList}` });
                    }
                    break;
                }
                
                case 'list_employees': {
                    const employeeNames = allEmployees.map(e => `- ${e.firstName} ${e.lastName}`).join('\n');
                    await sendTelegramMessage(chat.id, { text: `Ось список співробітників:\n${employeeNames}` });
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
                
                 case 'view_results':
                 case 'view_my_results': {
                    let results = await getAllResultsForCompany(companyId);
                    let title = "Ось список результатів";
                    if(aiResult.command === 'view_my_results') {
                        results = results.filter(r => r.assignee?.id === currentEmployee.id);
                        title = "Ось ваші результати";
                    }

                     if (results.length === 0) {
                        await sendTelegramMessage(chat.id, { text: `✅ Результатів не знайдено.` });
                    } else {
                        const resultList = results.map(r => `- ${r.completed ? '✅' : '🎯'} ${r.name}`).join('\n');
                        await sendTelegramMessage(chat.id, { text: `${title}:\n${resultList}` });
                    }
                    break;
                }
                
                 case 'create_template': {
                    const title = parseTitle(commandText);
                    const repeatability = commandText.includes('щодня') ? 'Щоденно' : 'Щотижня'; // Simple parsing
                    
                    const newTemplateData: Omit<Template, 'id' | 'companyId'> = {
                        name: title,
                        repeatability: repeatability,
                        startDate: new Date().toISOString().split('T')[0],
                        tasksGenerated: [],
                    };
                    const createdTemplate = await createTemplateInDb(companyId, newTemplateData);
                    await sendTelegramMessage(chat.id, { text: `✅ Шаблон "${createdTemplate.name}" створено з повторенням "${repeatability}".` });
                    break;
                }

                case 'show_help':
                    await sendTelegramMessage(chat.id, { text: commandText });
                    break;
                
                case 'clarify':
                     await sendTelegramMessage(chat.id, { text: "🤔 Не вдалося розпізнати команду. Будь ласка, спробуйте перефразувати." });
                     break;

                case 'unknown':
                default:
                    await sendTelegramMessage(chat.id, { text: "Я не зміг вас зрозуміти. Спробуйте сказати, що ви хочете зробити, наприклад: 'створи задачу', 'створи результат', або 'список співробітників'." });
                    break;
            }
        }
    } catch (error) {
        console.error("Error processing natural language command:", error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        await sendTelegramMessage(chat.id, { text: `🔴 Виникла помилка під час обробки команди: ${errorMessage}` });
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
    
    // Assuming the audio is ogg format, which is common for Telegram voice messages.
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
                await sendTelegramMessage(chat.id, { text: `🔴 Помилка обробки аудіо: ${errorMessage}` });
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
