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
