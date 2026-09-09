import * as SQLite from 'react-native-sqlite-storage';
import {SQLiteDatabase} from 'react-native-sqlite-storage';
import {StockSummary} from '../types/stock';

SQLite.enablePromise(true);

let dbPromise: Promise<SQLiteDatabase> | null = null;

// 여러 화면(검색/상세/관심종목)이 동시에 DB 함수를 불러도 앱이 켜져 있는 동안 파일 열기 + 테이블 생성은
// 딱 한 번만 일어나도록 Promise 자체를 캐시해서 재사용한다.
function getDb(): Promise<SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabase({name: 'favorites.db', location: 'default'}).then(async db => {
      await db.executeSql(
        `CREATE TABLE IF NOT EXISTS favorites (
          code TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          market TEXT NOT NULL,
          added_at TEXT NOT NULL
        )`,
      );
      return db;
    });
  }
  return dbPromise;
}

export async function initDatabase(): Promise<void> {
  await getDb();
}

export async function addFavorite(code: string, name: string, market: string): Promise<void> {
  const db = await getDb();
  await db.executeSql('INSERT OR REPLACE INTO favorites (code, name, market, added_at) VALUES (?, ?, ?, ?)', [
    code,
    name,
    market,
    new Date().toISOString(),
  ]);
}

export async function removeFavorite(code: string): Promise<void> {
  const db = await getDb();
  await db.executeSql('DELETE FROM favorites WHERE code = ?', [code]);
}

export async function getFavorites(): Promise<StockSummary[]> {
  const db = await getDb();
  const [result] = await db.executeSql('SELECT code, name, market FROM favorites ORDER BY added_at DESC');
  const items: StockSummary[] = [];
  for (let i = 0; i < result.rows.length; i++) {
    items.push(result.rows.item(i));
  }
  return items;
}

export async function isFavorite(code: string): Promise<boolean> {
  const db = await getDb();
  const [result] = await db.executeSql('SELECT 1 FROM favorites WHERE code = ? LIMIT 1', [code]);
  return result.rows.length > 0;
}
