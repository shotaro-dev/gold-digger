// ============================================
// ステップ1: Expressの基本セットアップ ✅
// ============================================
// Expressのインストールとインポート
// 最小限のExpressアプリケーション作成
// ルートパス（/）でindex.htmlを配信

// ============================================
// ステップ2: 静的ファイルの配信 ✅
// ============================================
// express.staticミドルウェアを使用してpublicフォルダを配信
// CSS、JS、画像ファイルが正しく読み込まれることを確認

// ============================================
// ステップ3: express.Router()でAPIルートを分離 ✅
// ============================================
// express.Router()の基本概念と使い方
// API用のルーター（apiRouter）を作成
// app.use('/api', apiRouter)でルーターをマウント

// ============================================
// ステップ4: APIエンドポイントの実装（投資情報の保存） ✅
// ============================================
// apiRouter.post('/invest', ...)でPOSTエンドポイントを実装
// Expressのexpress.json()ミドルウェアでリクエストボディをパース
// データベース接続と保存処理

import express from 'express';
import path from 'node:path';
import { PGlite } from '@electric-sql/pglite';

const PORT = 3000;

const __dirname = import.meta.dirname;

const app = express();

// express.json()ミドルウェアを追加
// これにより、JSON形式のリクエストボディが自動的にパースされ、
// req.bodyでアクセスできるようになります
app.use(express.json());

// express.staticミドルウェアでpublicフォルダを配信
// これにより、CSS、JS、画像ファイルが自動的に配信されます
// index.htmlも自動的にルートパス（/）で配信されます
app.use(express.static(path.join(__dirname, 'public')));

// データベースの初期化
// PGliteはPostgreSQL互換の軽量データベースです
// データはgold-dbディレクトリに保存されます
const db = new PGlite(path.join(__dirname, 'gold-db'));

// データベースの初期化を待機
await db.waitReady;

// 投資情報を保存するテーブルを作成（存在しない場合）
// clientId: ユーザー識別用のID
// investmentAmount: 投資金額（USD）
// pricePerOz: 購入時の金価格（USD/oz）
// goldAmount: 購入した金の量（oz）
// createdAt: 購入日時
await db.exec(`
  CREATE TABLE IF NOT EXISTS investments (
    id SERIAL PRIMARY KEY,
    clientId TEXT NOT NULL,
    investmentAmount DECIMAL(10, 2) NOT NULL,
    pricePerOz DECIMAL(10, 2) NOT NULL,
    goldAmount DECIMAL(10, 6) NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

// API用のルーターを作成
// express.Router()は、ルートをモジュール化するための機能です
// これにより、API関連のルートを一箇所にまとめて管理できます
const apiRouter = express.Router();

// POST /api/invest エンドポイントの実装
// 投資情報を受け取り、データベースに保存します
apiRouter.post('/invest', async (req, res) => {
  try {
    // リクエストボディからデータを取得
    // express.json()ミドルウェアにより、req.bodyにJSONデータが自動的にパースされています
    const { investmentAmount, pricePerOz, clientId } = req.body;

    // バリデーション: 必須フィールドのチェック
    if (!investmentAmount || !pricePerOz || !clientId) {
      return res.status(400).json({ 
        error: 'investmentAmount, pricePerOz, clientId は必須です' 
      });
    }

    // 数値のバリデーション
    const amount = parseFloat(investmentAmount);
    const price = parseFloat(pricePerOz);

    if (isNaN(amount) || amount <= 0 || isNaN(price) || price <= 0) {
      return res.status(400).json({ 
        error: 'investmentAmount と pricePerOz は正の数値である必要があります' 
      });
    }

    // 購入できる金の量を計算
    const goldAmount = amount / price;

    // データベースに投資情報を保存
    const result = await db.query(
      `INSERT INTO investments (clientId, investmentAmount, pricePerOz, goldAmount)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [clientId, amount, price, goldAmount]
    );

    // 成功レスポンスを返す
    // フロントエンドで使用するため、goldAmountとinvestmentAmountを返します
    res.json({
      id: result.rows[0].id,
      goldAmount: goldAmount,
      investmentAmount: amount
    });

  } catch (error) {
    console.error('投資情報の保存エラー:', error);
    res.status(500).json({ 
      error: '投資情報の保存に失敗しました' 
    });
  }
});

// ルーターをマウント
// app.use('/api', apiRouter)により、apiRouterで定義されたルートは
// /api プレフィックスが自動的に付与されます
// 例: apiRouter.post('/invest', ...) → /api/invest でアクセス可能
app.use('/api', apiRouter);

app.listen(PORT, () => {
  console.log(`サーバーが http://localhost:${PORT} で起動しました`);
});
