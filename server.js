// ============================================
// ステップ1: 最小限のHTTPサーバー ✅
// ステップ2: fs/pathモジュールで静的ファイル配信 ✅
// ステップ3: 簡単なルーティングを実装 ✅
// ステップ4: EventEmitterの基本を理解
// ============================================
// このステップでは、EventEmitterを使って
// イベント駆動型のプログラミングを学びます

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
  } else if (pathname === '/api/price') {
    // 金価格API: 1 Oz あたり USD（Gold-API.com）
    const { price, error } = await fetchGoldPrice();
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.end(JSON.stringify({ price, error }));
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
  console.log('ブラウザでアクセスして確認してください！');
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

// ============================================
// ステップ4の検証方法:
// 1. ターミナルで `node server.js` を実行
// 2. ターミナルに以下のように表示されることを確認:
//    こんにちは、太郎さん！
//    Hello, 花子!
//    --- EventEmitterのデモ完了 ---
// 3. サーバーが起動したら、ブラウザで http://localhost:3000 を開く
// 4. 正常に動作することを確認
//
// 学習ポイント:
// - EventEmitterは「イベントを発火する側」と「イベントを受け取る側」を分離できる
// - 複数のリスナーを登録できる（1つのイベントで複数の処理を実行可能）
// - 次のステップで、この仕組みを使って価格更新を通知します
// ============================================
