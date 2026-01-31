import express from 'express';
import { makeCreateInvestment, makeGetPortfolio, makeListInvestments, makeStreamHandler } from '../controllers/investments.js';
import { requireAuth } from '../middleware/auth.js';

export default function createApiRouter(db, priceEmitter) {
  const apiRouter = express.Router();

  apiRouter.post('/invest', requireAuth, makeCreateInvestment(db));
  apiRouter.get('/portfolio', requireAuth, makeGetPortfolio(db));
  apiRouter.get('/investments', requireAuth, makeListInvestments(db));
  apiRouter.get('/stream', makeStreamHandler(priceEmitter));

  return apiRouter;
}

