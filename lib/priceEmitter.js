import { EventEmitter } from 'node:events';

/**
 * PriceEmitter
 * 外部APIから定期的に金価格を取得して 'priceUpdate' を発火するクラス
 */
export default class PriceEmitter extends EventEmitter {
  constructor() {
    super();
    this.pollInterval = 10000;
    this.pollTimer = null;
    this.currentPrice = null;
    this.apiUrl = 'https://api.gold-api.com/price/XAU';
  }

  async fetchPrice() {
    try {
      const response = await fetch(this.apiUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const price = parseFloat(data.price);
      if (isNaN(price) || price <= 0) {
        throw new Error('無効な価格データが返されました');
      }
      return price;
    } catch (error) {
      throw new Error(`価格取得エラー: ${error.message}`);
    }
  }

  async updatePrice() {
    try {
      const price = await this.fetchPrice();
      this.currentPrice = price;
      this.emit('priceUpdate', price);
      console.log(`[${new Date().toLocaleTimeString()}] 金価格を更新しました: $${price.toFixed(2)}/oz`);
    } catch (error) {
      this.emit('error', error);
      console.error(`[${new Date().toLocaleTimeString()}] 価格取得エラー:`, error.message);
    }
  }

  start() {
    if (this.pollTimer !== null) return;
    console.log('価格ポーリングを開始します（10秒間隔）');
    this.updatePrice();
    this.pollTimer = setInterval(() => this.updatePrice(), this.pollInterval);
  }

  stop() {
    if (this.pollTimer !== null) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
      console.log('価格ポーリングを停止しました');
    }
  }
}

