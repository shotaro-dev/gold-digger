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

import express from 'express';
import path from 'node:path';

const PORT = 3000;
const __dirname = import.meta.dirname;

const app = express();

// express.staticミドルウェアでpublicフォルダを配信
// これにより、CSS、JS、画像ファイルが自動的に配信されます
// index.htmlも自動的にルートパス（/）で配信されます
app.use(express.static(path.join(__dirname, 'public')));

// API用のルーターを作成
// express.Router()は、ルートをモジュール化するための機能です
// これにより、API関連のルートを一箇所にまとめて管理できます
const apiRouter = express.Router();

// ルーターをマウント
// app.use('/api', apiRouter)により、apiRouterで定義されたルートは
// /api プレフィックスが自動的に付与されます
// 例: apiRouter.get('/portfolio', ...) → /api/portfolio でアクセス可能
app.use('/api', apiRouter);

app.listen(PORT, () => {
  console.log(`サーバーが http://localhost:${PORT} で起動しました`);
});
