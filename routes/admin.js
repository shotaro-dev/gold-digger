import express from 'express';
import { makeListAllUsers, makeListAllInvestments } from '../controllers/admin.js';

export default function createAdminRouter(db) {
  const router = express.Router();
  router.get('/users', makeListAllUsers(db));
  router.get('/investments', makeListAllInvestments(db));
  return router;
}
