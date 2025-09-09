// ЦЕЙ ФАЙЛ Є ЗАГЛУШКОЮ ДЛЯ ПІДКЛЮЧЕННЯ ДО РЕАЛЬНОЇ БАЗИ ДАНИХ.
// Ваш бекенд-розробник має реалізувати логіку в цьому файлі.

// Приклад для PostgreSQL з пакетом 'pg'
/*
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // Секретний ключ доступу до БД
  ssl: {
    rejectUnauthorized: false
  }
});

export const dbClient = {
  query: (text: string, params: any[]) => pool.query(text, params),
};
*/

// Приклад для Firebase Firestore
/*
import { initializeApp, getApps, getApp } from "firebase/admin/app";
import { getFirestore } from "firebase/admin/firestore";
import { credential } from "firebase-admin";

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string);

const app = !getApps().length
  ? initializeApp({ credential: credential.cert(serviceAccount) })
  : getApp();

export const firestoreDB = getFirestore(app);
*/

// Поки що експортуємо порожній об'єкт, щоб уникнути помилок компіляції.
// Розробник має розкоментувати та адаптувати один із прикладів вище.
export const dbClient = {};

console.log("УВАГА: Використовується заглушка для реальної бази даних. Підключіть справжню БД у src/lib/real-db.ts");
