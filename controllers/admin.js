/**
 * Admin: 全 users / 全 investments を返す（開発・確認用）
 */

function sanitizeUser(row) {
  return {
    id: row.id,
    name: row.name,
    username: row.username,
    email: row.email,
    created_at: row.created_at
  };
}

export function makeListAllUsers(db) {
  return async function listAllUsers(req, res, next) {
    try {
      const result = await db.query(
        'SELECT id, name, username, email, created_at FROM users ORDER BY id'
      );
      res.json(result.rows.map(sanitizeUser));
    } catch (err) {
      next(err);
    }
  };
}

export function makeListAllInvestments(db) {
  return async function listAllInvestments(req, res, next) {
    try {
      const result = await db.query(
        `SELECT id, user_id, investment_amount, price_per_oz, gold_amount, created_at
         FROM investments
         ORDER BY created_at DESC`
      );
      res.json(result.rows);
    } catch (err) {
      next(err);
    }
  };
}
