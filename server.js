// ============================================
// ステップ1: 最小限のHTTPサーバー ✅
// ステップ2: fs/pathモジュールで静的ファイル配信 ✅
// ステップ3: 簡単なルーティングを実装 ✅
// ステップ4: EventEmitterの基本を理解 ✅
// ステップ5: 外部APIから価格を取得 ✅
// ステップ6: EventEmitterで価格更新を管理 ✅
// ステップ7: Server-Sent Events (SSE) エンドポイントを実装
// ============================================
// このステップでは、SSEを使ってリアルタイムで
// 価格更新をクライアントに配信します

import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { EventEmitter } from 'node:events';

const PORT = 3000;
const __dirname = import.meta.dirname;

// ============================================
// EventEmitterの基本例
// ============================================
// EventEmitterは、イベントを発火（emit）して
// それをリッスン（on）する仕組みです

// 1. EventEmitterのインスタンスを作成
const myEmitter = new EventEmitter();

// 2. イベントをリッスン（待ち受け）する
// 'greet'というイベントが発火されたら、この関数が実行される
myEmitter.on('greet', (name) => {
  console.log(`こんにちは、${name}さん！`);
});
myEmitter.on('sum', (a, b) => {
  console.log(`${a} + ${b} = ${a + b}`);
});
myEmitter.emit('sum', 4,6);

// 3. イベントを発火する
// この行が実行されると、上で登録した関数が呼ばれる
myEmitter.emit('greet', '太郎');

// 4. 複数のリスナーを登録することもできる
myEmitter.on('greet', (name) => {
  console.log(`Hello, ${name}!`);
});

// 5. もう一度発火すると、両方のリスナーが実行される
myEmitter.emit('greet', '花子');

console.log('--- EventEmitterのデモ完了 ---\n');

// ============================================
// PriceEmitterクラス: EventEmitterを継承
// ============================================
// 定期的に金価格を取得し、更新時にイベントを発火します

class PriceEmitter extends EventEmitter {
  constructor() {
    super();
    this.currentPrice = null;
    this.intervalId = null;
    this.isPolling = false;
  }

  /**
   * 価格ポーリングを開始（10秒ごとに取得）
   */
  startPolling() {
    if (this.isPolling) {
      console.log('価格ポーリングは既に開始されています');
      return;
    }

    this.isPolling = true;
    console.log('価格ポーリングを開始します（10秒ごと）');

    // 即座に1回実行
    this.fetchAndEmitPrice();

    // 10秒ごとに価格を取得
    this.intervalId = setInterval(() => {
      this.fetchAndEmitPrice();
    }, 10000); // 10秒 = 10000ミリ秒
  }

  /**
   * 価格を取得して、更新があればイベントを発火
   */
  async fetchAndEmitPrice() {
    try {
      const { price, error } = await fetchGoldPrice();

      if (error) {
        console.error(`価格取得エラー: ${error}`);
        this.emit('priceError', { error });
        return;
      }

      if (price === null) {
        console.warn('価格が null です');
        return;
      }

      // 価格が変更された場合のみイベントを発火
      if (this.currentPrice !== price) {
        const previousPrice = this.currentPrice;
        this.currentPrice = price;
        
        console.log(`価格更新: $${previousPrice?.toFixed(2) ?? 'N/A'} → $${price.toFixed(2)}`);
        this.emit('priceUpdate', price);
      } else {
        console.log(`価格は変更なし: $${price.toFixed(2)}`);
      }
    } catch (error) {
      console.error(`価格取得中の例外: ${error.message}`);
      this.emit('priceError', { error: error.message });
    }
  }

  /**
   * 現在の価格を取得
   * @returns {number | null}
   */
  getCurrentPrice() {
    return this.currentPrice;
  }

  /**
   * ポーリングを停止
   */
  stopPolling() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.isPolling = false;
      console.log('価格ポーリングを停止しました');
    }
  }
}

// PriceEmitterのインスタンスを作成
const priceEmitter = new PriceEmitter();

// Content-Typeマッピング
const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
};

/**
 * Gold-API.com から金価格（XAU）を取得する（1 troy oz あたり USD）
 * GET https://api.gold-api.com/price/XAU
 * 無料・APIキー不要・リアルタイムは無制限
 * @returns {Promise<{ price: number | null; error?: string }>}
 */
async function fetchGoldPrice() {
  try {
    const res = await fetch('https://api.gold-api.com/price/XAU');
    
    if (!res.ok) {
      const errorText = await res.text();
      return { price: null, error: `API Error ${res.status}: ${errorText}` };
    }
    
    const json = await res.json();
    const price = json?.price;
    
    if (typeof price === 'number' && !Number.isNaN(price)) {
      return { price };
    } else {
      return { price: null, error: 'Invalid price in response' };
    }
  } catch (e) {
    return { price: null, error: `Request error: ${e.message}` };
  }
}

// 静的ファイルを配信する関数
async function serveStaticFile(fileName, res) {
  const filePath = path.join(__dirname, 'public', fileName);
  
  console.log(`ファイルを読み込み中: ${filePath}`);
  
  try {
    const data = await fs.readFile(filePath);
    // 拡張子からContent-Typeを判定
    const ext = path.extname(fileName).toLowerCase();
    const contentType = CONTENT_TYPES[ext] || 'text/plain';
    
    res.statusCode = 200;
    res.setHeader('Content-Type', contentType);
    res.end(data);
    console.log(`ファイルを配信しました: ${fileName}`);
  } catch (err) {
    // ファイルが見つからない場合、404.htmlを表示
    console.error(`ファイルが見つかりません: ${filePath}`);
    try {
      const notFoundPath = path.join(__dirname, 'public', '404.html');
      const notFoundData = await fs.readFile(notFoundPath);
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.end(notFoundData);
    } catch (notFoundErr) {
      // 404.htmlも見つからない場合のフォールバック
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end('ファイルが見つかりません');
    }
  }
}

/**
 * Server-Sent Events (SSE) 接続を処理
 * PriceEmitterの価格更新イベントをクライアントに配信
 */
function handleSSEConnection(req, res) {
  // SSE用のヘッダーを設定
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  console.log('SSE接続が確立されました');

  // 接続時に現在の価格を送信（あれば）
  const currentPrice = priceEmitter.getCurrentPrice();
  if (currentPrice !== null) {
    const data = JSON.stringify({ price: currentPrice });
    res.write(`data: ${data}\n\n`);
  }

  // 価格更新イベントのリスナー
  const onPriceUpdate = (price) => {
    if (res.writableEnded || res.destroyed) return;
    
    try {
      const data = JSON.stringify({ price });
      res.write(`data: ${data}\n\n`);
    } catch (error) {
      console.error('価格送信エラー:', error);
    }
  };

  // エラーイベントのリスナー
  const onPriceError = ({ error }) => {
    if (res.writableEnded || res.destroyed) return;
    
    try {
      const data = JSON.stringify({ error });
      res.write(`data: ${data}\n\n`);
    } catch (error) {
      console.error('エラー送信エラー:', error);
    }
  };

  // イベントリスナーを登録
  priceEmitter.on('priceUpdate', onPriceUpdate);
  priceEmitter.on('priceError', onPriceError);

  // 定期的にpingを送信（接続が生きているか確認）
  const pingInterval = setInterval(() => {
    // 接続が終了または破棄されているかチェック
    if (res.writableEnded || res.destroyed) {
      clearInterval(pingInterval);
      return;
    }
    
    try {
      res.write(': ping\n\n');
    } catch (error) {
      // 書き込みエラーが発生したら、インターバルを停止
      console.error('ping送信エラー:', error);
      clearInterval(pingInterval);
    }
  }, 30000); // 30秒ごと

  // 接続が切断されたときのクリーンアップ
  req.on('close', () => {
    priceEmitter.removeListener('priceUpdate', onPriceUpdate);
    priceEmitter.removeListener('priceError', onPriceError);
    clearInterval(pingInterval);
    console.log('SSE接続が切断されました');
  });

}

const server = http.createServer(async (req, res) => {
  console.log(`リクエスト受信: ${req.method} ${req.url}`);
  
  // URLを解析

  const url = new URL(req.url, `http://${req.headers.host}`);
  console.log('req.url:', req.url);
  const pathname = url.pathname;
  
  // ルーティング処理
  if (pathname === '/') {
    // ルートパス: index.htmlを配信
    await serveStaticFile('index.html', res);
  }  else if (pathname === '/api/stream') {
    // SSEエンドポイント: リアルタイム価格更新を配信
    handleSSEConnection(req, res);
  } else if (pathname.startsWith('/')) {
    // 静的ファイルのリクエスト（例: /index.css, /index.js, /gold.png）
    // 先頭の '/' を削除してファイル名を取得
    const fileName = pathname.substring(1);
    await serveStaticFile(fileName, res);
  } else {
    // その他のURLの場合、404.htmlを表示
    try {
      const notFoundPath = path.join(__dirname, 'public', '404.html');
      const notFoundData = await fs.readFile(notFoundPath);
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.end(notFoundData);
    } catch (err) {
      // 404.htmlも見つからない場合のフォールバック
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end('Not Found');
    }
  }
});


server.listen(PORT, () => {
  console.log(`サーバーが起動しました: http://localhost:${PORT}`);
  console.log('ブラウザでアクセスして確認してください！\n');
  
  // 価格ポーリングを開始
  priceEmitter.startPolling();
});


server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\nエラー: ポート ${PORT} は既に使用されています。`);
    console.error('以下のいずれかの方法で解決できます:');
    console.error(`1. ポート ${PORT} を使用しているプロセスを終了する:`);
    console.error(`   lsof -i :${PORT}  # プロセスを確認`);
    console.error(`   kill -9 <PID>     # プロセスを終了`);
    console.error(`2. または、別のポートを使用するように PORT を変更してください。`);
    process.exit(1);
  } else {
    console.error('サーバーエラー:', err);
    process.exit(1);
  }
});

// プロセス終了時のクリーンアップ
process.on('SIGINT', () => {
  console.log('\nサーバーを終了しています...');
  priceEmitter.stopPolling();
  server.close(() => {
    console.log('サーバーを終了しました');
    process.exit(0);
  });
});

// ============================================
// ステップ7の検証方法:
// 1. ターミナルで `node server.js` を実行
// 2. ブラウザで http://localhost:3000/api/stream を開く
//    - ストリーミングデータが表示されることを確認
//    - 価格更新があると、新しいデータが送信される
// 3. 開発者ツール（F12）のNetworkタブで確認:
//    - /api/stream のリクエストが "EventStream" タイプ
//    - 接続が維持されている（pending状態）
// 4. ターミナルで "SSE接続が確立されました" が表示される
// 5. 価格が更新されると、SSE経由でクライアントに送信される
// 6. ブラウザタブを閉じると "SSE接続が切断されました" が表示される
//
// 学習ポイント:
// - Server-Sent Events (SSE) でサーバー→クライアントの一方向通信
// - Content-Type: text/event-stream ヘッダーが必要
// - データ形式: "data: {JSON}\n\n" の形式で送信
// - EventEmitterのイベントをSSEクライアントに配信
// - 接続切断時のクリーンアップ（removeListener）
// - 定期的なpingで接続を維持
// ============================================
