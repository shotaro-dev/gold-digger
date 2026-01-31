import express from 'express';
import session from 'express-session';
import path from 'node:path';
import db from './lib/db.js';
import PriceEmitter from './lib/priceEmitter.js';
import createApiRouter from './routes/api.js';
import createAuthRouter from './routes/auth.js';
import createAdminRouter from './routes/admin.js';
import notFound from './middleware/notFound.js';
import errorHandler from './middleware/errorHandler.js';

const __dirname = import.meta.dirname;

const app = express();
app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true }
  })
);
app.use(express.static(path.join(__dirname, 'public')));

const priceEmitter = new PriceEmitter();
app.use('/api/auth', createAuthRouter(db));
app.use('/api/admin', createAdminRouter(db));
const apiRouter = createApiRouter(db, priceEmitter);
app.use('/api', apiRouter);

// modular middleware
app.use(notFound);
app.use(errorHandler);

export { app, priceEmitter };

