import { app, priceEmitter } from './app.js';

const PORT = process.env.PORT || 3000;

// サーバーを起動
const server = app.listen(PORT, () => {
  console.log(`サーバーが http://localhost:${PORT} で起動しました`);
  priceEmitter.start();
});

// プロセス終了時のクリーンアップ処理
process.on('SIGTERM', () => {
  console.log('SIGTERMシグナルを受信しました。サーバーを停止します...');
  priceEmitter.stop();
  server.close(() => {
    console.log('サーバーを停止しました');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\\nSIGINTシグナルを受信しました（Ctrl+C）。サーバーを停止します...');
  priceEmitter.stop();
  server.close(() => {
    console.log('サーバーを停止しました');
    process.exit(0);
  });
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err && err.stack ? err.stack : err);
  try {
    priceEmitter.stop();
    server.close(() => {
      console.log('サーバーを停止しました（uncaughtExceptionハンドラ）');
      process.exit(1);
    });
    setTimeout(() => process.exit(1), 5000).unref();
  } catch (e) {
    console.error('uncaughtException処理中のエラー:', e);
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  priceEmitter.stop();
});

import { app, priceEmitter } from './app.js';

const PORT = process.env.PORT || 3000;

// サーバーを起動
const server = app.listen(PORT, () => {
  console.log(`サーバーが http://localhost:${PORT} で起動しました`);
  priceEmitter.start();
});

// プロセス終了時のクリーンアップ処理
process.on('SIGTERM', () => {
  console.log('SIGTERMシグナルを受信しました。サーバーを停止します...');
  priceEmitter.stop();
  server.close(() => {
    console.log('サーバーを停止しました');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\\nSIGINTシグナルを受信しました（Ctrl+C）。サーバーを停止します...');
  priceEmitter.stop();
  server.close(() => {
    console.log('サーバーを停止しました');
    process.exit(0);
  });
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err && err.stack ? err.stack : err);
  try {
    priceEmitter.stop();
    server.close(() => {
      console.log('サーバーを停止しました（uncaughtExceptionハンドラ）');
      process.exit(1);
    });
    setTimeout(() => process.exit(1), 5000).unref();
  } catch (e) {
    console.error('uncaughtException処理中のエラー:', e);
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  priceEmitter.stop();
});

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
import fs from 'node:fs';
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
    client_id TEXT NOT NULL,
    investment_amount DECIMAL(10, 2) NOT NULL,
    price_per_oz DECIMAL(10, 2) NOT NULL,
    gold_amount DECIMAL(10, 6) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

    // データベースに投資情報を保存（snake_case カラム名）
    const result = await db.query(
      `INSERT INTO investments (client_id, investment_amount, price_per_oz, gold_amount)
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
         COALESCE(SUM(investment_amount), 0) as totalInvestedUSD,
         COALESCE(SUM(gold_amount), 0) as totalGoldOz,
         CASE 
           WHEN SUM(gold_amount) > 0 
           THEN SUM(investment_amount) / SUM(gold_amount)
           ELSE 0 
         END as averagePrice
       FROM investments
       WHERE client_id = $1`,
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

// GET /api/investments - 全投資レコードを取得（clientId 指定なし）
apiRouter.get('/investments', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, client_id, investment_amount, price_per_oz, gold_amount, created_at
       FROM investments
       ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('投資一覧取得エラー:', error);
    res.status(500).json({ error: '投資データの取得に失敗しました' });
  }
});

// ============================================
// ステップ6: Server-Sent Events (SSE) の実装 ✅
// ============================================
// apiRouter.get('/stream', ...)でSSEエンドポイントを実装
// ExpressでSSEを実装する方法（res.write()を使用）
// EventEmitterとの連携

// ============================================
// ステップ7: PriceEmitterクラスと価格取得機能の統合 ✅
// ============================================
// PriceEmitterクラスの実装（既存コードをExpress版に適応）
// 外部API（Gold-API.com）からの価格取得
// 価格ポーリングの開始と停止

/**
 * PriceEmitterクラス
 * EventEmitterを継承し、外部APIから金価格を定期的に取得してイベントを発火します
 */
class PriceEmitter extends EventEmitter {
  constructor() {
    super();
    // ポーリング間隔（ミリ秒）
    // 10秒ごとに価格を取得します
    this.pollInterval = 10000; // 10秒
    // ポーリングタイマーのIDを保持
    // clearInterval()でタイマーを停止するために使用します
    this.pollTimer = null;
    // 現在の価格を保持
    this.currentPrice = null;
    // Gold-API.comのエンドポイント
    // 無料でAPIキー不要の金価格APIです
    // XAUは金のシンボル、USDは通貨です
    this.apiUrl = 'https://api.gold-api.com/price/XAU';
  }

  /**
   * 外部APIから金価格を取得
   * @returns {Promise<number>} 金価格（USD/oz）
   */
  async fetchPrice() {
    try {
      // fetch APIを使用して外部APIから価格を取得
      // Gold-API.comは無料でAPIキー不要です
      const response = await fetch(this.apiUrl);

      // HTTPエラーステータスのチェック
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // JSONレスポンスをパース
      const data = await response.json();

      // APIレスポンスの構造に応じて価格を取得
      // Gold-API.comのレスポンス形式は様々な可能性があります：
      // - { price: 2650.50, currency: "USD", ... }
      // - { price_per_ounce: 2650.50, ... }
      // - { value: 2650.50, ... }
      // - { data: { price: 2650.50 }, ... }
      // 実際のAPIレスポンスに合わせて調整します
      const price = parseFloat(
        data.price

      );

      // 価格が有効な数値かチェック
      if (isNaN(price) || price <= 0) {
        throw new Error('無効な価格データが返されました');
      }

      return price;
    } catch (error) {
      // エラーを再スローして、呼び出し元で処理できるようにします
      throw new Error(`価格取得エラー: ${error.message}`);
    }
  }

  /**
   * 価格を取得してイベントを発火
   * このメソッドは、fetchPrice()を呼び出し、成功した場合は'priceUpdate'イベントを発火します
   * エラーが発生した場合は'error'イベントを発火します
   */
  async updatePrice() {
    try {
      // 外部APIから価格を取得
      const price = await this.fetchPrice();

      // 価格が変更された場合のみイベントを発火（オプション）
      // この実装では、毎回イベントを発火します
      this.currentPrice = price;

      // 'priceUpdate'イベントを発火
      // このイベントは、SSEエンドポイントでリスニングされ、
      // 接続されているクライアントに価格を配信します
      this.emit('priceUpdate', price);

      // コンソールにログを出力（検証用）
      console.log(`[${new Date().toLocaleTimeString()}] 金価格を更新しました: $${price.toFixed(2)}/oz`);
    } catch (error) {
      // エラーイベントを発火
      // SSEエンドポイントでリスニングされ、クライアントにエラーを通知します
      this.emit('error', error);
      console.error(`[${new Date().toLocaleTimeString()}] 価格取得エラー:`, error.message);
    }
  }

  /**
   * 価格ポーリングを開始
   * setInterval()を使用して、定期的に価格を取得します
   */
  start() {
    // 既にポーリングが開始されている場合は何もしない
    if (this.pollTimer !== null) {
      console.log('価格ポーリングは既に開始されています');
      return;
    }

    console.log('価格ポーリングを開始します（10秒間隔）');

    // 即座に1回価格を取得（初回）
    this.updatePrice();

    // その後、指定された間隔で価格を取得
    // setInterval()は、指定された間隔（ミリ秒）ごとにコールバック関数を実行します
    this.pollTimer = setInterval(() => {
      this.updatePrice();
    }, this.pollInterval);
  }

  /**
   * 価格ポーリングを停止
   * clearInterval()を使用してタイマーをクリアします
   * プロセス終了時やサーバー停止時に呼び出されます
   */
  stop() {
    if (this.pollTimer !== null) {
      // タイマーをクリアしてポーリングを停止
      clearInterval(this.pollTimer);
      this.pollTimer = null;
      console.log('価格ポーリングを停止しました');
    }
  }
}

// PriceEmitterインスタンスを作成
// このインスタンスは、価格更新イベントを発火し、
// SSEエンドポイントでリスニングされます
const priceEmitter = new PriceEmitter();

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

// 404 ハンドラ（存在しないルートへの対応）
app.use((req, res, next) => {
  // public/404.html が存在すればそれを返す。なければ簡易テキストを返す
  const notFoundPage = path.join(__dirname, 'public', '404.html');
  res.status(404);
  if (req.accepts('html')) {
    if (fs.existsSync(notFoundPage)) {
      return res.sendFile(notFoundPage);
    } else {
      return res.type('txt').send('404 Not Found');
    }
  }
  if (req.accepts('json')) {
    return res.json({ error: 'Not Found' });
  }
  return res.type('txt').send('Not Found');
});

// エラーハンドリングミドルウェア
// 4引数を受け取ることで Express がエラーハンドラとして認識します
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err && err.stack ? err.stack : err);
  if (res.headersSent) {
    return next(err);
  }
  const status = err && err.status ? err.status : 500;
  res.status(status);
  if (req.accepts('json')) {
    return res.json({ error: err && err.message ? err.message : 'Internal Server Error' });
  }
  if (req.accepts('html')) {
    const errorPage = path.join(__dirname, 'public', '500.html');
    if (fs.existsSync(errorPage)) {
      return res.sendFile(errorPage);
    }
    return res.type('txt').send('Internal Server Error');
  }
  return res.type('txt').send(err && err.message ? err.message : 'Internal Server Error');
});

// サーバーを起動
const server = app.listen(PORT, () => {
  console.log(`サーバーが http://localhost:${PORT} で起動しました`);
  
  // サーバー起動後、価格ポーリングを開始
  // これにより、サーバーが起動すると同時に価格の取得が開始されます
  priceEmitter.start();
});

// プロセス終了時のクリーンアップ処理
// サーバーが停止される際に、価格ポーリングも停止します
// これにより、メモリリークやバックグラウンド処理の残存を防ぎます
process.on('SIGTERM', () => {
  console.log('SIGTERMシグナルを受信しました。サーバーを停止します...');
  priceEmitter.stop();
  server.close(() => {
    console.log('サーバーを停止しました');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\nSIGINTシグナルを受信しました（Ctrl+C）。サーバーを停止します...');
  priceEmitter.stop();
  server.close(() => {
    console.log('サーバーを停止しました');
    process.exit(0);
  });
});

// 予期しない例外や未処理のPromise拒否に対するフェイルセーフ処理
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err && err.stack ? err.stack : err);
  try {
    priceEmitter.stop();
    server.close(() => {
      console.log('サーバーを停止しました（uncaughtExceptionハンドラ）');
      process.exit(1);
    });
    // タイムアウトしてもプロセスを終了する
    setTimeout(() => process.exit(1), 5000).unref();
  } catch (e) {
    console.error('uncaughtException処理中のエラー:', e);
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // サーバーを停止して価格ポーリングをクリア
  priceEmitter.stop();
  // すぐにプロセスを終了する代わりに、状況に応じて再起動する戦略を採ることもできます
});
