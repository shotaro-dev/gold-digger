/**
 * requireAuth: 認証必須。req.session.userId が無い場合 401 を返す。
 */
export function requireAuth(req, res, next) {
  if (!req.session?.userId) {
    return res.status(401).json({ error: '認証が必要です' });
  }
  next();
}
