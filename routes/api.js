import express from 'express';

export default function createApiRouter(db, priceEmitter) {
  const apiRouter = express.Router();

  apiRouter.post('/invest', async (req, res) => {
    try {
      const { investmentAmount, pricePerOz, clientId } = req.body;
      if (!investmentAmount || !pricePerOz || !clientId) {
        return res.status(400).json({ error: 'investmentAmount, pricePerOz, clientId は必須です' });
      }
      const amount = parseFloat(investmentAmount);
      const price = parseFloat(pricePerOz);
      if (isNaN(amount) || amount <= 0 || isNaN(price) || price <= 0) {
        return res.status(400).json({ error: 'investmentAmount と pricePerOz は正の数値である必要があります' });
      }
      const goldAmount = amount / price;
      const result = await db.query(
        `INSERT INTO investments (client_id, investment_amount, price_per_oz, gold_amount)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [clientId, amount, price, goldAmount]
      );
      res.json({
        id: result.rows[0].id,
        goldAmount: goldAmount,
        investmentAmount: amount
      });
    } catch (error) {
      console.error('投資情報の保存エラー:', error);
      res.status(500).json({ error: '投資情報の保存に失敗しました' });
    }
  });

  apiRouter.get('/portfolio', async (req, res) => {
    try {
      const { clientId } = req.query;
      if (!clientId) {
        return res.status(400).json({ error: 'clientId は必須です' });
      }
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
         WHERE client_id = $1`,
        [clientId]
      );
      const portfolio = result.rows[0];
      const totalInvestedUSD = parseFloat(portfolio.totalinvestedusd) || 0;
      const totalGoldOz = parseFloat(portfolio.totalgoldoz) || 0;
      const averagePrice = parseFloat(portfolio.averageprice) || 0;
      res.json({
        totalInvestedUSD,
        totalGoldOz,
        averagePrice
      });
    } catch (error) {
      console.error('ポートフォリオ取得エラー:', error);
      res.status(500).json({ error: 'ポートフォリオ情報の取得に失敗しました' });
    }
  });

  apiRouter.get('/investments', async (req, res) => {
    try {
      const result = await db.query(
        `SELECT id, client_id, investment_amount, price_per_oz, gold_amount, created_at
         FROM investments
         ORDER BY created_at DESC`
      );
      res.json(result.rows);
    } catch (error) {
      console.error('投資一覧取得エラー:', error);
      res.status(500).json({ error: '投資データの取得に失敗しました' });
    }
  });

  apiRouter.get('/stream', (req, res) => {
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
  });

  return apiRouter;
}

