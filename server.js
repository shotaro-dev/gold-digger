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

import express from 'express';
import path from 'node:path';

const PORT = 3000;
const __dirname = import.meta.dirname;

const app = express();

// express.staticミドルウェアでpublicフォルダを配信
// これにより、CSS、JS、画像ファイルが自動的に配信されます
// index.htmlも自動的にルートパス（/）で配信されます
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`サーバーが http://localhost:${PORT} で起動しました`);
});
