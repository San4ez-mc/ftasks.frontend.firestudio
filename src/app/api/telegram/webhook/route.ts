
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
    deleteTaskFromDb,
    deleteResultFromDb,
    deleteTemplateFromDb,
} from '@/lib/firestore-service';
import { sendTelegramMessage } from '@/lib/telegram-service';
import type { Task, TaskType } from '@/types/task';
import type { Result, SubResult } from '@/types/result';
import { ai } from '@/ai/genkit';
import type { Template } from '@/types/template';
import { formatDate } from '@/lib/utils';
import { formatTime } from '@/lib/timeUtils';


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


// --- Formatting Functions ---
const taskTypeLabels: Record<TaskType, string> = {
    'important-urgent': 'Важлива, термінова',
    'important-not-urgent': 'Важлива, нетермінова',
    'not-important-urgent': 'Неважлива, термінова',
    'not-important-not-urgent': 'Неважлива, нетермінова',
};

function formatTaskForTelegram(task: Task, action: 'created' | 'updated' | 'viewed'): string {
    const actionText = action === 'created' ? 'створена' : (action === 'updated' ? 'оновлена' : '');
    
    let executionTimeText = '';
    if (task.executionTime) {
        executionTimeText = `\n*Час виконання:* ${task.executionTime}`;
    }

    let commentsText = '';
    if (task.comments && task.comments.length > 0) {
        commentsText = '\n*Коментарі:*\n' + task.comments.map(c => `- ${c.author.name}: ${c.text}`).join('\n');
    }

    return `
*📝 Задача ${actionText}*
*Назва:* ${task.title}
*Виконавець:* ${task.assignee.name}
*Постановник:* ${task.reporter.name}
*Дата виконання:* ${formatDate(task.dueDate)}${executionTimeText}
*Тривалість:* ${formatTime(task.expectedTime)}
*Тип:* ${taskTypeLabels[task.type]}
*Очікуваний результат:* ${task.expectedResult || 'Не вказано'}
${commentsText}
    `.trim();
}

function formatResultForTelegram(result: Result, action: 'created' | 'updated'): string {
    const actionText = action === 'created' ? 'створено' : 'оновлено';
    let subResultsText = '';
    if (result.subResults && result.subResults.length > 0) {
        subResultsText = `\n*Підрезультати:*\n` + result.subResults.map(sr => `- ${sr.name}`).join('\n');
    }
    return `
*🎯 Результат ${actionText}*
*Назва:* ${result.name}
*Виконавець:* ${result.assignee.name}
*Дедлайн:* ${formatDate(result.deadline)}
*Статус:* ${result.status}
*Очікуваний результат:* ${result.expectedResult || 'Не вказано'}
${subResultsText}
    `.trim();
}


// --- Parameter Parsing Functions ---
const parseTitle = (text: string): string => {
    // Match content within single or double quotes
    const quoteMatch = text.match(/['"](.+?)['"]/);
    if (quoteMatch) return quoteMatch[1];

    // Fallback for commands without quotes, e.g., "ціль Підготувати звіт"
    const commandWords = ['створи задачу', 'створи', 'задача', 'ціль', 'результат', 'створити новий результат', 'деталі по задачі', 'що по задачі', 'видали задачу', 'удали результат', 'знищ шаблон'];
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

function getKyivDate(): Date {
    const now = new Date();
    const kyivOffset = 3 * 60 * 60 * 1000;
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    return new Date(utc + kyivOffset);
}

const parseDate = (text: string): string => {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('завтра')) {
        const tomorrow = getKyivDate();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
    }
    if (lowerText.includes('сьогодні')) {
        return getKyivDate().toISOString().split('T')[0];
    }
    if (lowerText.includes('п\'ятницю') || lowerText.includes('пт')) {
        const today = getKyivDate();
        const dayOfWeek = today.getDay(); // 0 (Sun) to 6 (Sat)
        const daysUntilFriday = (5 - dayOfWeek + 7) % 7;
        const friday = new Date(today);
        friday.setDate(today.getDate() + (daysUntilFriday === 0 ? 7 : daysUntilFriday)); // if today is Friday, go to next Friday
        return friday.toISOString().split('T')[0];
    }
    const dateMatch = text.match(/\d{4}-\d{2}-\d{2}/);
    if (dateMatch) {
        return dateMatch[0];
    }
     // Match for dd.mm.yyyy or dd.mm.yy
    const shortDateMatch = text.match(/(\d{1,2})\.(\d{1,2})\.(\d{2,4})/);
    if (shortDateMatch) {
        const day = shortDateMatch[1].padStart(2, '0');
        const month = shortDateMatch[2].padStart(2, '0');
        let year = shortDateMatch[3];
        if (year.length === 2) {
            year = `20${year}`;
        }
        return `${year}-${month}-${day}`;
    }

    return getKyivDate().toISOString().split('T')[0]; // Default to today
};

const parseExecutionTime = (text: string): string | null => {
    const timeMatch = text.match(/(?:о|at)\s*(\d{1,2}:\d{2})/i);
    return timeMatch ? timeMatch[1] : null;
};


const parseSubResults = (text: string): string[] => {
    const match = text.match(/(?:підрезультати|підпункти):?\s*(.+)/i);
    if (!match || !match[1]) return [];

    let subResultsText = match[1];

    // Handle "в ... є підпункти ..." case
    const nestedMatch = subResultsText.match(/в\s+['"]?(.+?)['"]?\s+є\s+підпункти\s+(.+)/i);
    if (nestedMatch) {
        const parentSubResult = nestedMatch[1].trim();
        const childSubResults = nestedMatch[2].split(/,\s*/).map(s => s.trim());
        return [parentSubResult, ...childSubResults].filter(Boolean);
    }
    
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

        for (const aiResult of aiResults) {
            const commandText = aiResult.text || '';

            switch (aiResult.command) {
                case 'create_task': {
                    const title = parseTitle(commandText);
                    const assignee = (aiResult.assigneeId ? allEmployees.find(e => e.id === aiResult.assigneeId) : currentEmployee) || currentEmployee;
                    
                    const dueDate = parseDate(commandText);
                    const executionTime = parseExecutionTime(commandText);
                    const assigneeName = `${assignee.firstName} ${assignee.lastName}`;

                    const newTaskData: Omit<Task, 'id' | 'companyId'> = {
                        title: title,
                        dueDate: dueDate,
                        status: 'todo',
                        type: 'important-not-urgent',
                        expectedTime: 30,
                        expectedResult: 'Очікуваний результат генерується GPT',
                        assignee: { id: assignee.id, name: assigneeName, avatar: assignee.avatar || '' },
                        reporter: { id: currentEmployee.id, name: `${currentEmployee.firstName} ${currentEmployee.lastName}`, avatar: currentEmployee.avatar || '' },
                        ...(executionTime && { executionTime }),
                    };
                    const createdTask = await createTaskInDb(companyId, newTaskData);
                    await sendTelegramMessage(chat.id, { text: formatTaskForTelegram(createdTask, 'created') });
                    break;
                }
                
                case 'create_result': {
                    const title = parseTitle(commandText);
                    const assignee = (aiResult.assigneeId ? allEmployees.find(e => e.id === aiResult.assigneeId) : currentEmployee) || currentEmployee;
                    const deadline = parseDate(commandText);
                    const twoWeeksFromNow = new Date();
                    twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);

                    const newResultData: Omit<Result, 'id' | 'companyId'> = {
                        name: title,
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
                        expectedResult: 'Очікуваний результат генерується GPT',
                    };
                    const createdResult = await createResultInDb(companyId, newResultData);
                    
                    const subResultNames = parseSubResults(commandText);
                    if (subResultNames.length > 0) {
                        const newSubResults: SubResult[] = subResultNames.map(name => ({
                           id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                           name,
                           completed: false,
                       }));
                       const finalResult = await updateResultInDb(companyId, createdResult.id, { subResults: newSubResults });
                       if (finalResult) await sendTelegramMessage(chat.id, { text: formatResultForTelegram(finalResult, 'created') });
                    } else {
                        await sendTelegramMessage(chat.id, { text: formatResultForTelegram(createdResult, 'created') });
                    }
                    break;
                }
                
                case 'view_tasks': {
                    const date = parseDate(commandText || 'сьогодні');
                    
                    let targetEmployee = currentEmployee;
                    if (aiResult.assigneeId) {
                        const foundEmployee = allEmployees.find(e => e.id === aiResult.assigneeId);
                        if (foundEmployee) {
                            targetEmployee = foundEmployee;
                        } else {
                            await sendTelegramMessage(chat.id, { text: `🤔 Співробітника не знайдено. Перевірте ім'я.` });
                            return;
                        }
                    }
                    
                    const allTasks = await getAllTasksForCompany(companyId);
                    const filteredTasks = allTasks.filter(t => t.dueDate === date && t.assignee?.id === targetEmployee.id);
                    
                    if (filteredTasks.length === 0) {
                        await sendTelegramMessage(chat.id, { text: `✅ Задач для ${targetEmployee.firstName} на ${formatDate(date)} не знайдено.` });
                    } else {
                        const taskList = filteredTasks.map(t => `- ${t.status === 'done' ? '✅' : '📝'} ${t.title}`).join('\n');
                        await sendTelegramMessage(chat.id, { text: `Ось задачі для ${targetEmployee.firstName} на ${formatDate(date)}:\n${taskList}` });
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
                        await sendTelegramMessage(chat.id, { text: `✅ Ваших задач на ${formatDate(date)} не знайдено.` });
                    } else {
                        const taskList = filteredTasks.map(t => `- ${t.status === 'done' ? '✅' : '📝'} ${t.title}`).join('\n');
                        await sendTelegramMessage(chat.id, { text: `Ось ваші задачі на ${formatDate(date)}:\n${taskList}` });
                    }
                    break;
                }
                 case 'view_task_details': {
                    const titleToFind = parseTitle(commandText);
                    if (!titleToFind) {
                        await sendTelegramMessage(chat.id, { text: "Будь ласка, вкажіть назву задачі, деталі якої ви хочете побачити." });
                        break;
                    }
                    const allTasks = await getAllTasksForCompany(companyId);
                    // Simple case-insensitive search
                    const foundTask = allTasks.find(t => t.title.toLowerCase().includes(titleToFind.toLowerCase()));

                    if (foundTask) {
                        await sendTelegramMessage(chat.id, { text: formatTaskForTelegram(foundTask, 'viewed') });
                    } else {
                        await sendTelegramMessage(chat.id, { text: `Не вдалося знайти задачу, що містить "${titleToFind}".` });
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
                        const resultList = results.map(r => {
                            let resultText = `- ${r.completed ? '✅' : '🎯'} ${r.name}`;
                            if (r.subResults && r.subResults.length > 0) {
                                const subResultsText = r.subResults.map(sr => `  - ${sr.completed ? '✅' : '📝'} ${sr.name}`).join('\n');
                                resultText += `\n${subResultsText}`;
                            }
                            return resultText;
                        }).join('\n\n');
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

                case 'delete_task': {
                    const title = parseTitle(commandText);
                    if (!title) {
                        await sendTelegramMessage(chat.id, { text: "Будь ласка, вкажіть назву задачі для видалення." });
                        break;
                    }
                    const tasks = await getAllTasksForCompany(companyId);
                    const taskToDelete = tasks.find(t => t.title.toLowerCase() === title.toLowerCase());
                    if (!taskToDelete) {
                        await sendTelegramMessage(chat.id, { text: `Задача з назвою "${title}" не знайдена.` });
                        break;
                    }
                    if (taskToDelete.reporter.id !== currentEmployee.id) {
                        await sendTelegramMessage(chat.id, { text: `🚫 Відмовлено. Ви можете видаляти тільки ті задачі, які самі створили.` });
                        break;
                    }
                    await deleteTaskFromDb(companyId, taskToDelete.id);
                    await sendTelegramMessage(chat.id, { text: `🗑️ Задача "${title}" видалена.` });
                    break;
                }

                case 'delete_result': {
                    const title = parseTitle(commandText);
                    if (!title) {
                        await sendTelegramMessage(chat.id, { text: "Будь ласка, вкажіть назву результату для видалення." });
                        break;
                    }
                    const results = await getAllResultsForCompany(companyId);
                    const resultToDelete = results.find(r => r.name.toLowerCase() === title.toLowerCase());
                    if (!resultToDelete) {
                        await sendTelegramMessage(chat.id, { text: `Результат з назвою "${title}" не знайдений.` });
                        break;
                    }
                    if (resultToDelete.reporter.id !== currentEmployee.id) {
                        await sendTelegramMessage(chat.id, { text: `🚫 Відмовлено. Ви можете видаляти тільки ті результати, які самі створили.` });
                        break;
                    }
                    await deleteResultFromDb(companyId, resultToDelete.id);
                    await sendTelegramMessage(chat.id, { text: `🗑️ Результат "${title}" видалено.` });
                    break;
                }

                case 'delete_template': {
                    const title = parseTitle(commandText);
                    if (!title) {
                        await sendTelegramMessage(chat.id, { text: "Будь ласка, вкажіть назву шаблону для видалення." });
                        break;
                    }
                    const templates = await getAllTemplatesForCompany(companyId);
                    const templateToDelete = templates.find(t => t.name.toLowerCase() === title.toLowerCase());
                    if (!templateToDelete) {
                        await sendTelegramMessage(chat.id, { text: `Шаблон з назвою "${title}" не знайдений.` });
                        break;
                    }
                    // Note: Templates don't have a reporter, so anyone can delete them for now.
                    // This could be changed by adding a reporterId to the template model.
                    await deleteTemplateFromDb(companyId, templateToDelete.id);
                    await sendTelegramMessage(chat.id, { text: `🗑️ Шаблон "${title}" видалено.` });
                    break;
                }


                case 'show_help':
                    await sendTelegramMessage(chat.id, { text: commandText });
                    break;
                
                case 'clarify':
                     await sendTelegramMessage(chat.id, { text: "🤔 Не вдалося розпізнати команду. Будь ласка, спробуйте перефразувати або надайте більше інформації." });
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
    
    return `data:audio/ogg;base64,${base64String}`;
}

async function handleFirstGroupMessage(chatId: number, chatTitle: string, user: TelegramUser) {
    const group = await findTelegramGroupByTgId(chatId.toString());
    if (!group) return;

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

        if (text.startsWith('/start')) {
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
        else if (text && (chat.type === 'private' || ( (chat.type === 'group' || chat.type === 'supergroup') && (isBotMentioned || isReplyToBot) ))) {
            const commandText = text.replace(`@${BOT_USERNAME}`, '').trim();
            await handleNaturalLanguageCommand(chat, fromUser, commandText);
            return NextResponse.json({ status: 'ok', message: 'Command processed.' });
        }
        else if (text && (chat.type === 'group' || chat.type === 'supergroup')) {
            await handleFirstGroupMessage(chat.id, chat.title, fromUser);
            return NextResponse.json({ status: 'ok', message: 'Member discovery checked.' });
        }
    }


    return NextResponse.json({ status: 'ok', message: 'Webhook received, but no action taken.' });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('Critical error in webhook handler:', errorMessage, error);
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
