import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import db from './lib/db.js';
import PriceEmitter from './lib/priceEmitter.js';
import createApiRouter from './routes/api.js';
import notFound from './middleware/notFound.js';
import errorHandler from './middleware/errorHandler.js';

const __dirname = import.meta.dirname;

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const priceEmitter = new PriceEmitter();
const apiRouter = createApiRouter(db, priceEmitter);
app.use('/api', apiRouter);

// modular middleware
app.use(notFound);
app.use(errorHandler);

export { app, priceEmitter };

