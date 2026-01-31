# GoldDigger 🪙

リアルタイム金価格表示と投資シミュレーションアプリケーション

## 📝 プロジェクトについて

このプロジェクトは、**Scrimbaのソロプロジェクト**をベースにしています。

- CSS、HTML、画像はScrimbaから提供された素材を使用
- Cursor（AIアシスタント）を使用して実装とコードレビューを行いました
- **Express.js** と **認証（セッション）** の学習を目的とした学習用プロジェクトです

## 📋 概要

Express.js で構築した Web アプリです。外部 API から金価格を取得し、SSE でリアルタイム表示。ユーザー登録・ログイン後は投資シミュレーション（購入履歴・ポートフォリオ）が利用できます。DB は Pglite（PostgreSQL 互換）を使用しています。

## ✨ 機能

- **リアルタイム価格表示**: Server-Sent Events (SSE) で金価格をリアルタイム表示
- **認証**: サインアップ・ログイン・ログアウト（セッション + Cookie）
- **投資シミュレーション**: ログイン中のみ、投資金額を入力して金の購入量を計算・保存
- **ポートフォリオ**: 合計投資額・保有金量・平均購入単価・現在評価を表示
- **管理用 API**: 全ユーザー・全投資履歴を JSON で取得（`/api/admin/users`, `/api/admin/investments`）
- **レスポンシブデザイン**: モダンな UI/UX

## 🛠️ 技術スタック

- **バックエンド**: Node.js + Express.js
- **データベース**: Pglite（@electric-sql/pglite）
- **認証**: express-session（セッション）、bcrypt（パスワードハッシュ）、validator（入力検証）
- **フロントエンド**: Vanilla JavaScript (ES6+)
- **リアルタイム通信**: Server-Sent Events (SSE)、EventEmitter（価格ポーリング）
- **開発ツール**: nodemon
- **外部API**: [Gold-API.com](https://api.gold-api.com/)（金価格・APIキー不要）

## 📁 プロジェクト構造

```
gold-digger/
├── app.js              # Express アプリ定義（ルート・ミドルウェア）
├── server.js           # サーバー起動・価格ポーリング開始
├── package.json
├── controllers/        # ルートハンドラ
│   ├── admin.js        # 全 users / 全 investments
│   ├── auth.js         # 登録・ログイン・ログアウト・me
│   └── investments.js  # 投資・ポートフォリオ・一覧・SSE
├── routes/
│   ├── api.js          # /api/* 投資・SSE
│   ├── auth.js         # /api/auth/* 認証
│   └── admin.js        # /api/admin/* 管理用
├── middleware/
│   ├── auth.js         # requireAuth
│   ├── errorHandler.js
│   └── notFound.js
├── lib/
│   ├── db.js           # Pglite 初期化・テーブル作成
│   └── priceEmitter.js # 金価格ポーリング・EventEmitter
└── public/             # 静的ファイル
    ├── index.html      # メイン（価格・投資・ポートフォリオ）
    ├── index.js / index.css
    ├── login.html, login.js
    ├── signup.html, signup.js
    ├── nav.js          # 共通ナビ（ログイン時は Login/Signup 非表示）
    ├── 404.html
    └── gold.png
```

## 🔄 API エンドポイント

| メソッド | パス | 説明 |
|----------|------|------|
| POST | `/api/auth/register` | ユーザー登録 |
| POST | `/api/auth/login` | ログイン |
| POST | `/api/auth/logout` | ログアウト |
| GET | `/api/auth/me` | 現在のユーザー（認証不要・未ログインは 401） |
| GET | `/api/stream` | SSE ストリーム（リアルタイム金価格） |
| POST | `/api/invest` | 投資実行（**要ログイン**） |
| GET | `/api/portfolio` | ポートフォリオ取得（**要ログイン**） |
| GET | `/api/investments` | 投資一覧（**要ログイン**） |
| GET | `/api/admin/users` | 全ユーザー（JSON・認証なし） |
| GET | `/api/admin/investments` | 全投資履歴（JSON・認証なし） |

## 🚀 セットアップ

### 必要な環境

- Node.js（v18 以上推奨）

### インストール

```bash
npm install
```

### 実行

```bash
# 開発モード（推奨）
npm run dev

# 本番モード
npm start
```

ブラウザで `http://localhost:3000` にアクセスしてください。

### 環境変数（任意）

- `PORT` - サーバーポート（既定: 3000）
- `SESSION_SECRET` - セッション署名用（本番では必ず設定推奨）

## 📚 学習で押さえている内容

- **Express**: ルーティング、ミドルウェア、静的ファイル、JSON ボディ、エラーハンドリング・404
- **認証**: セッション（express-session）、Cookie、bcrypt、保護ルート（requireAuth）
- **DB**: Pglite、SQL（users / investments テーブル）
- **SSE**: リアルタイム価格配信、EventEmitter によるポーリング
- **フロント**: フォーム送信、`credentials: 'include'`、ナビの出し分け

## 📝 ライセンス

ISC
