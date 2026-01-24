const investBtn = document.getElementById("invest-btn");
const dialog = document.getElementById("dialog");
const closeDialogBtn = document.getElementById("close-dialog-btn");
const priceDisplay = document.getElementById("price-display");
const connectionStatus = document.getElementById("connection-status");
const investmentSummary = document.getElementById("investment-summary");

// ユーザー識別用のID管理
const STORAGE_KEY_CLIENT_ID = 'gold_digger_client_id';
let clientId = localStorage.getItem(STORAGE_KEY_CLIENT_ID);

if (!clientId) {
  // ランダムなIDを生成（簡易的なUUID）
  clientId = crypto.randomUUID ? crypto.randomUUID() : 'user_' + Math.random().toString(36).substring(2, 15);
  localStorage.setItem(STORAGE_KEY_CLIENT_ID, clientId);
  console.log('New Client ID generated:', clientId);
} else {
  console.log('Existing Client ID:', clientId);
}

// ポートフォリオ表示要素
const pfTotalUsd = document.getElementById("pf-total-usd");
const pfTotalGold = document.getElementById("pf-total-gold");
const pfAvgPrice = document.getElementById("pf-avg-price");
const pfCurrentValue = document.getElementById("pf-current-value");
const pfProfitLoss = document.getElementById("pf-profit-loss");

// ポートフォリオデータを保持
let myPortfolio = {
  totalInvestedUSD: 0,
  totalGoldOz: 0,
  averagePrice: 0
};

/**
 * サーバーからポートフォリオ情報を取得して表示
 */
async function fetchAndDisplayPortfolio() {
  try {
    const res = await fetch(`/api/portfolio?clientId=${clientId}`);
    if (!res.ok) return;
    
    const data = await res.json();
    myPortfolio = data;
    
    // 表示更新
    if (pfTotalUsd) pfTotalUsd.textContent = `$${data.totalInvestedUSD.toFixed(2)}`;
    if (pfTotalGold) pfTotalGold.textContent = `${data.totalGoldOz.toFixed(4)} oz`;
    if (pfAvgPrice) pfAvgPrice.textContent = `$${data.averagePrice.toFixed(2)} / oz`;
    
    // 現在価値と損益の計算（現在の価格がある場合）
    updatePortfolioValue();
    
  } catch (err) {
    console.error('ポートフォリオ取得エラー:', err);
  }
}

/**
 * 現在の市場価格に基づいてポートフォリオの価値を再計算
 */
function updatePortfolioValue() {
  if (currentPrice && myPortfolio.totalGoldOz > 0) {
    const currentValue = myPortfolio.totalGoldOz * currentPrice;
    const profitLoss = currentValue - myPortfolio.totalInvestedUSD;
    const profitLossPercent = (profitLoss / myPortfolio.totalInvestedUSD) * 100;
    
    if (pfCurrentValue) pfCurrentValue.textContent = `$${currentValue.toFixed(2)}`;
    
    if (pfProfitLoss) {
      const sign = profitLoss >= 0 ? '+' : '';
      const color = profitLoss >= 0 ? '#4ade80' : '#ff6b6b'; // 緑 or 赤
      pfProfitLoss.textContent = `${sign}$${profitLoss.toFixed(2)} (${sign}${profitLossPercent.toFixed(1)}%)`;
      pfProfitLoss.style.color = color;
    }
  }
}



// ダイアログ内のボタンで閉じる（存在チェック）
if (closeDialogBtn) {
  closeDialogBtn.addEventListener("click", () => {
    dialog.close();
  });
}

investBtn.addEventListener("click", async (e) => {
  e.preventDefault();
  
  // 投資金額を取得
  const investmentAmountInput = document.getElementById("investment-amount");
  const investmentAmount = parseFloat(investmentAmountInput.value);
  
  // バリデーション
  if (!investmentAmount || investmentAmount <= 0) {
    alert("有効な投資金額を入力してください");
    return;
  }
  
  // 現在の価格を取得
  if (currentPrice === null || isNaN(currentPrice)) {
    alert("価格情報が取得できていません。しばらく待ってから再度お試しください。");
    return;
  }
  
  // サーバーに投資情報を送信
  try {
    const response = await fetch("/api/invest", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        investmentAmount: investmentAmount,
        pricePerOz: currentPrice,
        clientId: clientId, // ユーザーIDを追加
      }),
    });
    
    if (!response.ok) {
      console.error("投資情報の送信に失敗しました");
      return
    }

    const data = await response.json();
    investmentSummary.textContent = `You just bought ${data.goldAmount.toFixed(6)} ounces (ozt) for $${data.investmentAmount.toFixed(2)}. \n You will receive documentation shortly.`;
    
    // ポートフォリオを更新
    fetchAndDisplayPortfolio();
    
  } catch (error) {
    console.error("投資情報の送信エラー:", error);
  }
  
  dialog.showModal();
});

// modalの外側（バックドロップ）をクリックで閉じる
dialog.addEventListener("click", (e) => {
  const rect = dialog.getBoundingClientRect();
  const isInsideDialogBox =
    e.clientX >= rect.left &&
    e.clientX <= rect.right &&
    e.clientY >= rect.top &&
    e.clientY <= rect.bottom;
  // ダイアログ枠外（バックドロップ）をクリックしたときのみ閉じる
  if (!isInsideDialogBox) {
    dialog.close();
  }
});

// ============================================
// Server-Sent Events (SSE) でリアルタイム価格を取得
// ============================================

let eventSource = null;
let currentPrice = null; // 現在の価格を保持

/**
 * 価格を表示に更新
 */
function updatePrice(price) {
  if (!priceDisplay) return;
  
  if (typeof price === "number" && !Number.isNaN(price)) {
    currentPrice = price; // 現在の価格を保存
    priceDisplay.textContent = price.toFixed(2);
    
    // 価格更新時のアニメーション効果
    priceDisplay.style.transition = "color 0.3s ease";
    priceDisplay.style.color = "var(--gold)";
    setTimeout(() => {
      priceDisplay.style.color = "";
    }, 300);

    // 価格が変わるたびにポートフォリオの価値も再計算
    updatePortfolioValue();
  } else {
    priceDisplay.textContent = "----.--";
  }
}

/**
 * 接続状態を更新
 */
function updateConnectionStatus(status, message = "") {
  if (!connectionStatus) return;
  
  switch (status) {
    case "connecting":
      connectionStatus.textContent = "Connecting... 🟡";
      connectionStatus.style.color = "var(--dark-gold)";
      break;
    case "connected":
      connectionStatus.textContent = "Live Price 🟢";
      connectionStatus.style.color = "var(--gold)";
      break;
    case "disconnected":
      connectionStatus.textContent = "Disconnected 🔴";
      connectionStatus.style.color = "#ff6b6b";
      break;
    case "error":
      connectionStatus.textContent = `Error: ${message} 🔴`;
      connectionStatus.style.color = "#ff6b6b";
      break;
  }

  console.log("Updated connectionStatus.textContent:", connectionStatus.textContent);
  console.log("Updated connectionStatus.style.color:", connectionStatus.style.color);
}

/**
 * SSE接続を開始
 */
function connectSSE() {
  // 既存の接続があれば閉じる
  if (eventSource) {
    eventSource.close();
  }
  
  updateConnectionStatus("connecting");
  
  // EventSourceでSSE接続を確立
  eventSource = new EventSource("/api/stream");
  // メッセージを受信したとき
  eventSource.addEventListener("message", (event) => {
    try {
      // console.log(eventSource)
      // console.log(eventSource.readyState)
      // console.log(event)
      // console.log("eventSource.readyState:", eventSource.readyState);
      // console.log("EventSource.CONNECTING:", EventSource.CONNECTING);  // 0
      // console.log("EventSource.OPEN:", EventSource.OPEN);              // 1
      // console.log("EventSource.CLOSED:", EventSource.CLOSED);          // 2
      const data = JSON.parse(event.data);
      
      if (data.price !== undefined) {
        updatePrice(data.price);
        updateConnectionStatus("connected");
      } else if (data.error) {
        console.error("価格取得エラー:", data.error);
        updateConnectionStatus("error", data.error);
      }
    } catch (error) {
      console.error("SSEメッセージの解析エラー:", error);
    }
  });
  
  // 接続が開いたとき
  eventSource.addEventListener("open", () => {
    console.log("SSE接続が開きました");
    updateConnectionStatus("connected");
  });
  
  // エラーが発生したとき
  eventSource.addEventListener("error", (error) => {
    console.error("SSEエラー:", error);
    
    // 接続が切断された場合、5秒後に再接続を試みる
    if (eventSource.readyState === EventSource.CLOSED) {
      updateConnectionStatus("disconnected");
      
      setTimeout(() => {
        console.log("再接続を試みます...");
        connectSSE();
      }, 5000);
    } else if (eventSource.readyState === EventSource.CONNECTING) {
      updateConnectionStatus("connecting");
    }
  });
}

// ページ読み込み時にSSE接続を開始
connectSSE();

// 初回ポートフォリオ取得
fetchAndDisplayPortfolio();

// ページがアンロードされる際に接続を閉じる
window.addEventListener("beforeunload", () => {
  if (eventSource) {
    eventSource.close();
  }
});
