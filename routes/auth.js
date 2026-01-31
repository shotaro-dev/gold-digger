import express from 'express';
import {
  makeRegisterHandler,
  makeLoginHandler,
  makeLogoutHandler,
  makeMeHandler
} from '../controllers/auth.js';

export default function createAuthRouter(db) {
  const router = express.Router();
  router.post('/register', makeRegisterHandler(db));
  router.post('/login', makeLoginHandler(db));
  router.post('/logout', makeLogoutHandler());
  router.get('/me', makeMeHandler(db));
  return router;
}
