import bcrypt from 'bcrypt';
import validator from 'validator';

function sanitizeUser(row) {
  return {
    id: row.id,
    name: row.name,
    username: row.username,
    email: row.email,
    created_at: row.created_at
  };
}

export function makeRegisterHandler(db) {
  return async function register(req, res, next) {
    try {
      const { name, username, email, password } = req.body;
      if (!name || !username || !email || !password) {
        return res.status(400).json({
          error: 'name, username, email, password は必須です'
        });
      }
      if (!validator.isEmail(email)) {
        return res.status(400).json({ error: '有効なメールアドレスを入力してください' });
      }
      const password_hash = await bcrypt.hash(password, 10);
      const result = await db.query(
        `INSERT INTO users (name, username, email, password_hash)
         VALUES ($1, $2, $3, $4)
         RETURNING id, name, username, email, created_at`,
        [name.trim(), username.trim(), email.trim().toLowerCase(), password_hash]
      );
      const user = result.rows[0];
      res.status(201).json(sanitizeUser(user));
    } catch (err) {
      if (err.code === '23505') {
        return res.status(409).json({ error: 'このメールアドレスは既に登録されています' });
      }
      next(err);
    }
  };
}

export function makeLoginHandler(db) {
  return async function login(req, res, next) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'email, password は必須です' });
      }
      if (!validator.isEmail(email)) {
        return res.status(400).json({ error: '有効なメールアドレスを入力してください' });
      }
      const result = await db.query(
        'SELECT id, name, username, email, password_hash, created_at FROM users WHERE email = $1',
        [email.trim().toLowerCase()]
      );
      const user = result.rows[0];
      if (!user) {
        return res.status(401).json({ error: 'メールアドレスまたはパスワードが正しくありません' });
      }
      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) {
        return res.status(401).json({ error: 'メールアドレスまたはパスワードが正しくありません' });
      }
      req.session.userId = user.id;
      res.json(sanitizeUser(user));
    } catch (err) {
      next(err);
    }
  };
}

export function makeLogoutHandler() {
  return function logout(req, res, next) {
    req.session.destroy((err) => {
      if (err) return next(err);
      res.clearCookie('connect.sid', { path: '/' });
      res.status(204).send();
    });
  };
}

export function makeMeHandler(db) {
  return async function me(req, res, next) {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: '認証が必要です' });
      }
      const result = await db.query(
        'SELECT id, name, username, email, created_at FROM users WHERE id = $1',
        [req.session.userId]
      );
      const user = result.rows[0];
      if (!user) {
        req.session.destroy(() => {});
        return res.status(401).json({ error: '認証が必要です' });
      }
      res.json(sanitizeUser(user));
    } catch (err) {
      next(err);
    }
  };
}
