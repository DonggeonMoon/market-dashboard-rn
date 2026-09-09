import { open, DB } from '@op-engineering/op-sqlite';

import {StockSummary} from '../types/stock';

let dbInstance: DB | null = null;

function getDb(): DB {
  if (!dbInstance) {
    dbInstance = open({ name: 'favorites.db' });
    dbInstance.execute(
      `CREATE TABLE IF NOT EXISTS favorites (
        code TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        market TEXT NOT NULL,
        added_at TEXT NOT NULL
      )`
    );
  }
  return dbInstance;
}

// 명시적으로 async/Promise 구조를 제공하여 외부 호출부(await initDatabase)와의 충돌을 막습니다.
export async function initDatabase(): Promise<void> {
  return new Promise((resolve) => {
    getDb();
    resolve();
  });
}

export async function addFavorite(code: string, name: string, market: string): Promise<void> {
  const db = await getDb();
  await db.execute('INSERT OR REPLACE INTO favorites (code, name, market, added_at) VALUES (?, ?, ?, ?)', [
    code,
    name,
    market,
    new Date().toISOString(),
  ]);
}

export async function removeFavorite(code: string): Promise<void> {
  const db = await getDb();
  await db.execute('DELETE FROM favorites WHERE code = ?', [code]);
}

export async function getFavorites(): Promise<StockSummary[]> {
  const db = await getDb();
  const result = await db.execute('SELECT code, name, market FROM favorites ORDER BY added_at DESC');
  return (result.rows as unknown) as StockSummary[];
}

export async function isFavorite(code: string): Promise<boolean> {
  const db = await getDb();
  const result = await db.execute('SELECT 1 FROM favorites WHERE code = ? LIMIT 1', [code]);
  return result.rows.length > 0;
}
