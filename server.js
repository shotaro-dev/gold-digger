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

// ============================================
// ステップ5: APIエンドポイントの実装（ポートフォリオ取得） ✅
// ============================================
// apiRouter.get('/portfolio', ...)でGETエンドポイントを実装
// req.queryでクエリパラメータ（clientId）を取得
// データベースからの集計クエリ実行

import express from 'express';
import path from 'node:path';
import { EventEmitter } from 'node:events';
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

// GET /api/portfolio エンドポイントの実装
// クライアントIDに基づいてポートフォリオ情報を取得します
apiRouter.get('/portfolio', async (req, res) => {
  try {
    // req.queryでクエリパラメータを取得
    // Expressでは、URLのクエリパラメータ（?clientId=xxx）が
    // 自動的にreq.queryオブジェクトにパースされます
    const { clientId } = req.query;

    // バリデーション: clientIdが必須
    if (!clientId) {
      return res.status(400).json({ 
        error: 'clientId は必須です' 
      });
    }

    // データベースから該当クライアントの投資情報を集計
    // SUM()関数で合計を計算し、AVG()関数で平均価格を計算します
    const result = await db.query(
      `SELECT 
         COALESCE(SUM(investmentAmount), 0) as totalInvestedUSD,
         COALESCE(SUM(goldAmount), 0) as totalGoldOz,
         CASE 
           WHEN SUM(goldAmount) > 0 
           THEN SUM(investmentAmount) / SUM(goldAmount)
           ELSE 0 
         END as averagePrice
       FROM investments
       WHERE clientId = $1`,
      [clientId]
    );

    // 結果を取得（集計クエリなので1行のみ）
    const portfolio = result.rows[0];

    // 数値を適切な型に変換
    const totalInvestedUSD = parseFloat(portfolio.totalinvestedusd) || 0;
    const totalGoldOz = parseFloat(portfolio.totalgoldoz) || 0;
    const averagePrice = parseFloat(portfolio.averageprice) || 0;

    // ポートフォリオ情報をJSON形式で返す
    // フロントエンドで使用するため、キャメルケースで返します
    res.json({
      totalInvestedUSD: totalInvestedUSD,
      totalGoldOz: totalGoldOz,
      averagePrice: averagePrice
    });

  } catch (error) {
    console.error('ポートフォリオ取得エラー:', error);
    res.status(500).json({ 
      error: 'ポートフォリオ情報の取得に失敗しました' 
    });
  }
});

// ============================================
// ステップ6: Server-Sent Events (SSE) の実装 ✅
// ============================================
// apiRouter.get('/stream', ...)でSSEエンドポイントを実装
// ExpressでSSEを実装する方法（res.write()を使用）
// EventEmitterとの連携

// 価格更新イベントを発火するためのEventEmitterインスタンスを作成
// このEventEmitterは、価格が更新されたときに'priceUpdate'イベントを発火します
// ステップ7でPriceEmitterクラスが実装されると、このインスタンスが使用されます
const priceEmitter = new EventEmitter();

// GET /api/stream エンドポイントの実装
// Server-Sent Events (SSE) を使用してリアルタイムで価格を配信します
apiRouter.get('/stream', (req, res) => {
  // SSE用のHTTPヘッダーを設定
  // Content-Type: text/event-stream はSSEの標準的なMIMEタイプです
  // Cache-Control: no-cache は、プロキシがレスポンスをキャッシュしないようにします
  // Connection: keep-alive は、接続を維持するために必要です
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  // クライアントに接続確認メッセージを送信
  // SSEでは、各メッセージは "data: " で始まり、2つの改行で終わる必要があります
  res.write(': connected\n\n');

  // 価格更新イベントのリスナー関数を定義
  // priceEmitterが'priceUpdate'イベントを発火したときに実行されます
  const sendPriceUpdate = (price) => {
    // SSEメッセージの形式: "data: {JSONデータ}\n\n"
    // フロントエンドは、このJSONデータをパースして価格を取得します
    res.write(`data: ${JSON.stringify({ price })}\n\n`);
  };

  // エラーイベントのリスナー関数を定義
  // 価格取得時にエラーが発生した場合に実行されます
  const sendError = (error) => {
    res.write(`data: ${JSON.stringify({ error: error.message || String(error) })}\n\n`);
  };

  // EventEmitterにイベントリスナーを登録
  // 'priceUpdate'イベントが発火されたときにsendPriceUpdate関数が実行されます
  priceEmitter.on('priceUpdate', sendPriceUpdate);
  priceEmitter.on('error', sendError);

  // クライアントが接続を切断したときの処理
  // Expressでは、reqが閉じられたときに'close'イベントが発火されます
  req.on('close', () => {
    // イベントリスナーを削除してメモリリークを防ぎます
    priceEmitter.removeListener('priceUpdate', sendPriceUpdate);
    priceEmitter.removeListener('error', sendError);
    console.log('SSE接続が閉じられました');
  });
});

// ルーターをマウント
// app.use('/api', apiRouter)により、apiRouterで定義されたルートは
// /api プレフィックスが自動的に付与されます
// 例: apiRouter.post('/invest', ...) → /api/invest でアクセス可能
app.use('/api', apiRouter);

app.listen(PORT, () => {
  console.log(`サーバーが http://localhost:${PORT} で起動しました`);
});
