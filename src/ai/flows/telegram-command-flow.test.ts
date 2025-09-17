/**
 * @fileOverview Test script for the Telegram command parser.
 * This script runs a series of predefined test cases against the `parseTelegramCommand` flow
 * to ensure that various natural language inputs are correctly interpreted and converted
 * into structured commands.
 *
 * To run this test, use the command: `npm run test:bot`
 */

import { parseTelegramCommand } from './telegram-command-flow';
import type { TelegramCommandInput, TelegramCommandOutput } from '../types';
import { inspect } from 'util';

// Mock data that mimics the data passed from the webhook
const mockEmployees = [
    { id: 'emp-1', name: 'Марія Сидоренко' },
    { id: 'emp-2', name: 'Петро Іваненко' },
];
const mockCurrentUser = { id: 'emp-1', name: 'Марія Сидоренко' };


const mockTemplates = [
    { id: 'tpl-1', name: 'Щотижневий звіт' },
];

const today = new Date().toISOString().split('T')[0];
const tomorrow = new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0];

// Define all test cases
const testCases: { description: string; input: string; expected: Partial<TelegramCommandOutput>[] }[] = [
    {
        description: 'Should create a simple task for the current user',
        input: 'Створи задачу "Підготувати звіт"',
        expected: [{
            command: 'create_task',
            text: 'Створи задачу "Підготувати звіт"',
        }]
    },
    {
        description: 'Should create a task with an assignee and a date',
        input: 'Створи задачу \'Підготувати щотижневий звіт\' для Марії Сидоренко на завтра',
        expected: [{
            command: 'create_task',
            text: 'Створи задачу \'Підготувати щотижневий звіт\' для Марії Сидоренко на завтра',
        }]
    },
    {
        description: 'Should view user\'s own tasks for today',
        input: 'Покажи мої невиконані задачі',
        expected: [{
            command: 'view_my_tasks',
            text: 'Покажи мої невиконані задачі',
        }]
    },
    {
        description: 'Should create a result with sub-results by decomposing the command',
        input: 'Створити новий результат \'Збільшити конверсію сайту на 15%\', підрезультати: "проаналізувати трафік", "оновити головну сторінку"',
        expected: [
            {
                command: 'create_result',
                text: 'Створити новий результат \'Збільшити конверсію сайту на 15%\', підрезультати: "проаналізувати трафік", "оновити головну сторінку"',
            }
        ]
    },
    {
        description: 'Should create a result with complex nested sub-results (L1 only)',
        input: 'ціль Підготувати квартальний звіт, підрезультати Зібрати дані, Створити презентацію. в Зібрати дані є підпункти аналітика з GA, дані з CRM',
        expected: [
            {
                command: 'create_result',
                text: 'ціль Підготувати квартальний звіт, підрезультати Зібрати дані, Створити презентацію. в Зібрати дані є підпункти аналітика з GA, дані з CRM'
            }
        ]
    },
    {
        description: 'Should correctly identify a command to list employees',
        input: 'список співробітників',
        expected: [{
            command: 'list_employees',
            text: 'список співробітників'
        }]
    },
    {
        description: 'Should ask for clarification if task title is missing',
        input: 'Створити задачу для Петра',
        expected: [{
            command: 'clarify',
            text: 'Створити задачу для Петра'
        }]
    },
    {
        description: 'Should create a simple result without sub-results',
        input: 'Створити результат "Запустити нову маркетингову кампанію"',
        expected: [{
            command: 'create_result',
            text: 'Створити результат "Запустити нову маркетингову кампанію"'
        }]
    },
    {
        description: 'Should create a simple template',
        input: 'Створи шаблон "Щоденний звіт" з повторенням щодня',
        expected: [{
            command: 'create_template',
            text: 'Створи шаблон "Щоденний звіт" з повторенням щодня'
        }]
    },
    {
        description: 'Should view tasks for a specific date',
        input: `Покажи задачі на ${tomorrow}`,
        expected: [{
            command: 'view_tasks',
            text: `Покажи задачі на ${tomorrow}`,
        }]
    },
    {
        description: 'Should view a list of results',
        input: 'Покажи список результатів',
        expected: [{
            command: 'view_results',
            text: 'Покажи список результатів'
        }]
    },
    {
        description: 'Should view a list of templates',
        input: 'Які є шаблони?',
        expected: [{
            command: 'list_templates',
            text: 'Які є шаблони?'
        }]
    },
    {
        description: 'Should parse a delete task command',
        input: 'Видали задачу "Підготувати звіт"',
        expected: [{
            command: 'delete_task',
            text: 'Видали задачу "Підготувати звіт"'
        }]
    },
    {
        description: 'Should parse a delete result command',
        input: 'удали результат "Запустити кампанію"',
        expected: [{
            command: 'delete_result',
            text: 'удали результат "Запустити кампанію"'
        }]
    },
    {
        description: 'Should parse a delete template command',
        input: 'знищ шаблон "Щотижневий звіт"',
        expected: [{
            command: 'delete_template',
            text: 'знищ шаблон "Щотижневий звіт"'
        }]
    }
];

// Helper function for deep object comparison
function deepEqual(obj1: any, obj2: any): boolean {
    if (obj1 === obj2) return true;

    if (obj1 && typeof obj1 === 'object' && obj2 && typeof obj2 === 'object') {
        if (Array.isArray(obj1) !== Array.isArray(obj2)) return false;

        if(Array.isArray(obj1)) {
            if (obj1.length !== obj2.length) return false;
            for (let i = 0; i < obj1.length; i++) {
                if (!deepEqual(obj1[i], obj2[i])) return false;
            }
            return true;
        }

        if (Object.keys(obj1).length !== Object.keys(obj2).length) return false;

        for (const key in obj1) {
            if (Object.prototype.hasOwnProperty.call(obj1, key)) {
                if (!Object.prototype.hasOwnProperty.call(obj2, key)) return false;
                if (!deepEqual(obj1[key], obj2[key])) return false;
            }
        }
        return true;
    }
    return false;
}


async function runTests() {
    console.log('Starting Telegram command parser tests...\n');
    let passed = 0;
    let failed = 0;

    for (const testCase of testCases) {
        const input: TelegramCommandInput = {
            command: testCase.input,
            employees: mockEmployees,
            templates: mockTemplates,
            allowedCommands: [], // For testing, allow all commands
            currentUser: mockCurrentUser,
        };

        try {
            const results = await parseTelegramCommand(input);
            
            // We only compare the fields present in the 'expected' object
            const partialResults = results.map(result => {
                const partialResult: Partial<TelegramCommandOutput> = { command: result.command };
                if (result.text && testCase.expected.find(exp => exp.command === result.command)?.text) {
                    partialResult.text = result.text;
                }
                return partialResult;
            });


            if (deepEqual(partialResults, testCase.expected)) {
                console.log(`\x1b[32m✔ PASS:\x1b[0m ${testCase.description}`);
                passed++;
            } else {
                failed++;
                console.log(`\x1b[31m✖ FAIL:\x1b[0m ${testCase.description}`);
                console.log(`  Input: "${testCase.input}"`);
                console.log(`  \x1b[31mExpected:\x1b[0m ${inspect(testCase.expected, { depth: null, colors: true })}`);
                console.log(`  \x1b[32mGot:\x1b[0m      ${inspect(results, { depth: null, colors: true })}\n`);
            }
        } catch (error) {
            failed++;
            console.log(`\x1b[31m✖ ERROR:\x1b[0m ${testCase.description}`);
            console.log(error);
        }
    }

    console.log('\n--------------------');
    console.log('Test Summary:');
    console.log(`\x1b[32mPassed: ${passed}\x1b[0m`);
    console.log(`\x1b[31mFailed: ${failed}\x1b[0m`);
    console.log('--------------------\n');

    if (failed > 0) {
        process.exit(1); // Exit with error code if any test fails
    }
}

runTests();
