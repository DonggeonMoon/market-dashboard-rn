import { open, DB } from '@op-engineering/op-sqlite';

import {StockSummary} from '../types/stock';

let dbPromise: Promise<DB> | null = null;

async function getDb(): Promise<DB> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = open({ name: 'favorites.db' });
      await db.execute(
        `CREATE TABLE IF NOT EXISTS favorites (
          code TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          market TEXT NOT NULL,
          added_at TEXT NOT NULL,
          reuters_code TEXT NOT NULL DEFAULT '',
          is_foreign INTEGER NOT NULL DEFAULT 0
        )`
      );
      // 기존 설치본은 위 CREATE TABLE이 스킵되므로 컬럼을 직접 추가한다. 이미 있으면 에러가 나므로 무시한다.
      await db.execute("ALTER TABLE favorites ADD COLUMN reuters_code TEXT NOT NULL DEFAULT ''").catch(() => {});
      await db.execute('ALTER TABLE favorites ADD COLUMN is_foreign INTEGER NOT NULL DEFAULT 0').catch(() => {});
      return db;
    })();
  }
  return dbPromise;
}

export async function initDatabase(): Promise<void> {
  await getDb();
}

export async function addFavorite(
  code: string,
  name: string,
  market: string,
  reutersCode: string,
  isForeign: boolean,
): Promise<void> {
  const db = await getDb();
  await db.execute(
    'INSERT OR REPLACE INTO favorites (code, name, market, added_at, reuters_code, is_foreign) VALUES (?, ?, ?, ?, ?, ?)',
    [code, name, market, new Date().toISOString(), reutersCode, isForeign ? 1 : 0],
  );
}

export async function removeFavorite(code: string): Promise<void> {
  const db = await getDb();
  await db.execute('DELETE FROM favorites WHERE code = ?', [code]);
}

export async function getFavorites(): Promise<StockSummary[]> {
  const db = await getDb();
  const result = await db.execute(
    'SELECT code, name, market, reuters_code, is_foreign FROM favorites ORDER BY added_at DESC',
  );
  return (result.rows as unknown as Array<{
    code: string;
    name: string;
    market: string;
    reuters_code: string;
    is_foreign: number;
  }>).map(row => ({
    code: row.code,
    name: row.name,
    market: row.market,
    reutersCode: row.reuters_code || row.code,
    isForeign: !!row.is_foreign,
  }));
}

export async function isFavorite(code: string): Promise<boolean> {
  const db = await getDb();
  const result = await db.execute('SELECT 1 FROM favorites WHERE code = ? LIMIT 1', [code]);
  return result.rows.length > 0;
}
