import { PGlite } from '@electric-sql/pglite';
import path from 'node:path';

const __dirname = import.meta.dirname;

// PGlite データベース初期化
const db = new PGlite(path.join(__dirname, 'gold-db'));

// トップレベル await を使って初期化とテーブル作成を実行
await db.waitReady;

await db.exec(`
  CREATE TABLE IF NOT EXISTS investments (
    id SERIAL PRIMARY KEY,
    client_id TEXT NOT NULL,
    investment_amount DECIMAL(10,2) NOT NULL,
    price_per_oz DECIMAL(10,2) NOT NULL,
    gold_amount DECIMAL(10,6) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

await db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    username TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

// investments に user_id を追加（既存行は NULL のまま）
await db.exec(`
  ALTER TABLE investments ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id)
`);
// 新規は user_id のみ使うため client_id を nullable に
await db.exec(`
  ALTER TABLE investments ALTER COLUMN client_id DROP NOT NULL
`);

export default db;

