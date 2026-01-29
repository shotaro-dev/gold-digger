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

export default db;

