// ============================================
// ステップ1: 最小限のHTTPサーバー ✅
// ステップ2: fs/pathモジュールで静的ファイル配信
// ============================================
// このステップでは、fsとpathモジュールを使って
// HTMLファイルを読み込んで配信します

import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';

const PORT = 3000;
const __dirname = import.meta.dirname;

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
    // ファイルが見つからない場合
    console.error(`ファイルが見つかりません: ${filePath}`);
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('ファイルが見つかりません');
  }
}

const server = http.createServer(async (req, res) => {
  console.log(`リクエスト受信: ${req.method} ${req.url}`);
  
  // URLが '/' の場合、index.htmlを配信
  if (req.url === '/') {
    await serveStaticFile('index.html', res);
  } else {
    // その他のURLの場合、404を返す（後で改善します）
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('Not Found');
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
// ステップ2の検証方法:
// 1. ターミナルで `node server.js` を実行
// 2. ブラウザで http://localhost:3000 を開く
// 3. public/index.html が表示されればOK！
// 4. ターミナルに「ファイルを読み込み中」「ファイルを配信しました」が表示される
// ============================================
