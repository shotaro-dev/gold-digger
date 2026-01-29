import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import db from './lib/db.js';
import PriceEmitter from './lib/priceEmitter.js';
import createApiRouter from './routes/api.js';

const __dirname = import.meta.dirname;

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const priceEmitter = new PriceEmitter();
const apiRouter = createApiRouter(db, priceEmitter);
app.use('/api', apiRouter);

// 404 handler
app.use((req, res, next) => {
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

// error handler
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

export { app, priceEmitter };

