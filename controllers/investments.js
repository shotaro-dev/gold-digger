// controllers/investments.js
// ルートハンドラを生成するファクトリをエクスポートします

export function makeCreateInvestment(db) {
  return async function createInvestment(req, res, next) {
    try {
      const userId = req.session.userId;
      const { investmentAmount, pricePerOz } = req.body;
      if (!investmentAmount || !pricePerOz) {
        return res.status(400).json({ error: 'investmentAmount, pricePerOz は必須です' });
      }
      const amount = parseFloat(investmentAmount);
      const price = parseFloat(pricePerOz);
      if (isNaN(amount) || amount <= 0 || isNaN(price) || price <= 0) {
        return res.status(400).json({ error: 'investmentAmount と pricePerOz は正の数値である必要があります' });
      }
      const goldAmount = amount / price;
      const result = await db.query(
        `INSERT INTO investments (user_id, investment_amount, price_per_oz, gold_amount)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [userId, amount, price, goldAmount]
      );
      res.json({
        id: result.rows[0].id,
        goldAmount: goldAmount,
        investmentAmount: amount
      });
    } catch (err) {
      next(err);
    }
  };
}

export function makeGetPortfolio(db) {
  return async function getPortfolio(req, res, next) {
    try {
      const userId = req.session.userId;
      const result = await db.query(
        `SELECT 
           COALESCE(SUM(investment_amount), 0) as totalInvestedUSD,
           COALESCE(SUM(gold_amount), 0) as totalGoldOz,
           CASE 
             WHEN SUM(gold_amount) > 0 
             THEN SUM(investment_amount) / SUM(gold_amount)
             ELSE 0 
           END as averagePrice
         FROM investments
         WHERE user_id = $1`,
        [userId]
      );
      const portfolio = result.rows[0];
      const totalInvestedUSD = parseFloat(portfolio.totalinvestedusd) || 0;
      const totalGoldOz = parseFloat(portfolio.totalgoldoz) || 0;
      const averagePrice = parseFloat(portfolio.averageprice) || 0;
      res.json({ totalInvestedUSD, totalGoldOz, averagePrice });
    } catch (err) {
      next(err);
    }
  };
}

export function makeListInvestments(db) {
  return async function listInvestments(req, res, next) {
    try {
      const userId = req.session.userId;
      const result = await db.query(
        `SELECT id, user_id, investment_amount, price_per_oz, gold_amount, created_at
         FROM investments
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [userId]
      );
      res.json(result.rows);
    } catch (err) {
      next(err);
    }
  };
}

export function makeStreamHandler(priceEmitter) {
  return function streamHandler(req, res, next) {
    try {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.write(': connected\n\n');

      const sendPriceUpdate = (price) => {
        res.write(`data: ${JSON.stringify({ price })}\n\n`);
      };
      const sendError = (error) => {
        res.write(`data: ${JSON.stringify({ error: error.message || String(error) })}\n\n`);
      };
      priceEmitter.on('priceUpdate', sendPriceUpdate);
      priceEmitter.on('error', sendError);
      req.on('close', () => {
        priceEmitter.removeListener('priceUpdate', sendPriceUpdate);
        priceEmitter.removeListener('error', sendError);
        console.log('SSE接続が閉じられました');
      });
    } catch (err) {
      next(err);
    }
  };
}

