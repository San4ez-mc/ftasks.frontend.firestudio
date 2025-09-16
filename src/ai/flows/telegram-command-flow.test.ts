
'use server';

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

const mockTemplates = [
    { id: 'tpl-1', name: 'Щотижневий звіт' },
];

// Define all test cases
const testCases: { description: string; input: string; expected: Partial<TelegramCommandOutput> }[] = [
    {
        description: 'Should create a simple task for the current user',
        input: 'Створи задачу "Підготувати звіт"',
        expected: {
            command: 'create_task',
            parameters: { title: 'Підготувати звіт' }
        }
    },
    {
        description: 'Should create a task with an assignee and a date',
        input: 'Створи задачу \'Підготувати щотижневий звіт\' для Марії Сидоренко на завтра',
        expected: {
            command: 'create_task',
            parameters: {
                title: 'Підготувати щотижневий звіт',
                assigneeName: 'Марія Сидоренко',
                dueDate: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0]
            }
        }
    },
    {
        description: 'Should view user\'s own tasks for today',
        input: 'Покажи мої невиконані задачі',
        expected: {
            command: 'view_tasks',
            parameters: {
                assigneeName: 'мої',
                status: 'todo',
                startDate: new Date().toISOString().split('T')[0],
                endDate: new Date().toISOString().split('T')[0],
            }
        }
    },
    {
        description: 'Should create a result with sub-results',
        input: 'Створити новий результат \'Збільшити конверсію сайту на 15%\', підрезультати: "проаналізувати трафік", "оновити головну сторінку"',
        expected: {
            command: 'create_result',
            parameters: {
                title: 'Збільшити конверсію сайту на 15%',
                subResults: [
                    { name: 'проаналізувати трафік' },
                    { name: 'оновити головну сторінку' }
                ]
            }
        }
    },
    {
        description: 'Should create a result with complex nested sub-results',
        input: 'ціль Підготувати квартальний звіт, підрезультати Зібрати дані, Створити презентацію. в Зібрати дані є підпункти аналітика з GA, дані з CRM',
        expected: {
            command: 'create_result',
            parameters: {
                title: 'Підготувати квартальний звіт',
                subResults: [
                    { 
                        name: 'Зібрати дані',
                        subResults: [
                            { name: 'аналітика з GA' },
                            { name: 'дані з CRM' }
                        ] 
                    },
                    { name: 'Створити презентацію' }
                ]
            }
        }
    },
     {
        description: 'Should correctly identify a command to list employees',
        input: 'список співробітників',
        expected: {
            command: 'list_employees',
        }
    },
     {
        description: 'Should ask for clarification if task title is missing',
        input: 'Створити задачу для Петра',
        expected: {
            command: 'clarify',
        }
    }
];

// Helper function for deep object comparison
function deepEqual(obj1: any, obj2: any): boolean {
    if (obj1 === obj2) return true;

    if (obj1 && typeof obj1 === 'object' && obj2 && typeof obj2 === 'object') {
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
        };

        try {
            const result = await parseTelegramCommand(input);
            
            // We only compare the fields present in the 'expected' object
            const partialResult: Partial<TelegramCommandOutput> = { command: result.command };
            if (result.parameters && testCase.expected.parameters) {
                partialResult.parameters = {};
                for (const key in testCase.expected.parameters) {
                    if (Object.prototype.hasOwnProperty.call(result.parameters, key)) {
                         (partialResult.parameters as any)[key] = (result.parameters as any)[key];
                    }
                }
            }


            if (deepEqual(partialResult, testCase.expected)) {
                console.log(`\x1b[32m✔ PASS:\x1b[0m ${testCase.description}`);
                passed++;
            } else {
                failed++;
                console.log(`\x1b[31m✖ FAIL:\x1b[0m ${testCase.description}`);
                console.log(`  Input: "${testCase.input}"`);
                console.log(`  \x1b[31mExpected:\x1b[0m ${inspect(testCase.expected, { depth: null, colors: true })}`);
                console.log(`  \x1b[32mGot:\x1b[0m      ${inspect(result, { depth: null, colors: true })}\n`);
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
