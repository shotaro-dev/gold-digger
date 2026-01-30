import express from 'express';
import { makeCreateInvestment, makeGetPortfolio, makeListInvestments, makeStreamHandler } from '../controllers/investments.js';

export default function createApiRouter(db, priceEmitter) {
  const apiRouter = express.Router();

  apiRouter.post('/invest', makeCreateInvestment(db));
  apiRouter.get('/portfolio', makeGetPortfolio(db));
  apiRouter.get('/investments', makeListInvestments(db));
  apiRouter.get('/stream', makeStreamHandler(priceEmitter));

  return apiRouter;
}

