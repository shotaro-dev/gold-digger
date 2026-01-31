// DOM elements
const dialog = document.getElementById("dialog");
const closeDialogBtn = document.getElementById("close-dialog-btn");
const priceDisplay = document.getElementById("price-display");
const connectionStatus = document.getElementById("connection-status");
const investmentSummary = document.getElementById("investment-summary");
const loggedInSection = document.getElementById("logged-in-section");
const portfolioSection = document.getElementById("portfolio-section");
const loginRequiredMsg = document.getElementById("login-required-msg");
const userInfoEl = document.getElementById("user-info");
const investForm = document.getElementById("invest-form");

// Portfolio display elements
const pfTotalUsd = document.getElementById("pf-total-usd");
const pfTotalGold = document.getElementById("pf-total-gold");
const pfAvgPrice = document.getElementById("pf-avg-price");
const pfCurrentValue = document.getElementById("pf-current-value");
const pfProfitLoss = document.getElementById("pf-profit-loss");

// Portfolio data
let myPortfolio = {
  totalInvestedUSD: 0,
  totalGoldOz: 0,
  averagePrice: 0
};

let currentUser = null;
let currentPrice = null;

const fetchOpts = { credentials: 'include' };

// 初期状態: 投資・ポートフォリオは非表示（checkAuth でログイン時のみ表示する）
if (loggedInSection) loggedInSection.hidden = true;
if (portfolioSection) portfolioSection.hidden = true;

/**
 * ログイン状態を取得し、UI を切り替える
 */
async function checkAuth() {
  try {
    const res = await fetch("/api/auth/me", fetchOpts);
    if (res.ok) {
      currentUser = await res.json();
      if (loginRequiredMsg) loginRequiredMsg.hidden = true;
      if (loggedInSection) loggedInSection.hidden = false;
      if (portfolioSection) portfolioSection.hidden = false;
      if (userInfoEl) userInfoEl.textContent = `Logged in as ${currentUser.name} (${currentUser.email})`;
      fetchAndDisplayPortfolio();
    } else {
      currentUser = null;
      if (loginRequiredMsg) loginRequiredMsg.hidden = false;
      if (loggedInSection) loggedInSection.hidden = true;
      if (portfolioSection) portfolioSection.hidden = true;
    }
  } catch (err) {
    console.error("Auth check error:", err);
    currentUser = null;
    if (loginRequiredMsg) loginRequiredMsg.hidden = false;
    if (loggedInSection) loggedInSection.hidden = true;
    if (portfolioSection) portfolioSection.hidden = true;
  }
}

/**
 * サーバーからポートフォリオ情報を取得して表示（ログイン中のみ）
 */
async function fetchAndDisplayPortfolio() {
  if (!currentUser) return;
  try {
    const res = await fetch("/api/portfolio", fetchOpts);
    if (res.status === 401) {
      checkAuth();
      return;
    }
    if (!res.ok) return;
    const data = await res.json();
    myPortfolio = data;
    if (pfTotalUsd) pfTotalUsd.textContent = `$${data.totalInvestedUSD.toFixed(2)}`;
    if (pfTotalGold) pfTotalGold.textContent = `${data.totalGoldOz.toFixed(4)} oz`;
    if (pfAvgPrice) pfAvgPrice.textContent = `$${data.averagePrice.toFixed(2)} / oz`;
    updatePortfolioValue();
  } catch (err) {
    console.error("ポートフォリオ取得エラー:", err);
  }
}

function updatePortfolioValue() {
  if (currentPrice != null && !isNaN(currentPrice) && myPortfolio.totalGoldOz > 0) {
    const currentValue = myPortfolio.totalGoldOz * currentPrice;
    const profitLoss = currentValue - myPortfolio.totalInvestedUSD;
    const profitLossPercent = (profitLoss / myPortfolio.totalInvestedUSD) * 100;
    if (pfCurrentValue) pfCurrentValue.textContent = `$${currentValue.toFixed(2)}`;
    if (pfProfitLoss) {
      const sign = profitLoss >= 0 ? '+' : '';
      pfProfitLoss.textContent = `${sign}$${profitLoss.toFixed(2)} (${sign}${profitLossPercent.toFixed(1)}%)`;
      pfProfitLoss.style.color = profitLoss >= 0 ? '#4ade80' : '#ff6b6b';
    }
  }
}

// Invest form (submit; button was type="submit")
if (investForm) {
  investForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const investmentAmountInput = document.getElementById("investment-amount");
    const investmentAmount = parseFloat(investmentAmountInput?.value);
    if (!investmentAmount || investmentAmount <= 0) {
      alert("有効な投資金額を入力してください");
      return;
    }
    if (currentPrice == null || isNaN(currentPrice)) {
      alert("価格情報が取得できていません。しばらく待ってから再度お試しください。");
      return;
    }
    try {
      const response = await fetch("/api/invest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          investmentAmount,
          pricePerOz: currentPrice
        })
      });
      if (response.status === 401) {
        alert("ログインしてください。");
        checkAuth();
        return;
      }
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        alert(errData.error || "投資情報の送信に失敗しました");
        return;
      }
      const data = await response.json();
      if (investmentSummary) {
        investmentSummary.textContent = `You just bought ${data.goldAmount.toFixed(6)} ounces (ozt) for $${data.investmentAmount.toFixed(2)}. You will receive documentation shortly.`;
      }
      if (dialog) dialog.showModal();
      fetchAndDisplayPortfolio();
    } catch (error) {
      console.error("投資情報の送信エラー:", error);
      alert("送信に失敗しました。");
    }
  });
}

if (closeDialogBtn && dialog) {
  closeDialogBtn.addEventListener("click", () => dialog.close());
}

if (dialog) {
  dialog.addEventListener("click", (e) => {
    const rect = dialog.getBoundingClientRect();
    const isInside = e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
    if (!isInside) dialog.close();
  });
}

// SSE price stream
let eventSource = null;

function updatePrice(price) {
  if (!priceDisplay) return;
  if (typeof price === "number" && !Number.isNaN(price)) {
    currentPrice = price;
    priceDisplay.textContent = price.toFixed(2);
    priceDisplay.style.transition = "color 0.3s ease";
    priceDisplay.style.color = "var(--gold)";
    setTimeout(() => { priceDisplay.style.color = ""; }, 300);
    updatePortfolioValue();
  } else {
    priceDisplay.textContent = "----.--";
  }
}

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
}

function connectSSE() {
  if (eventSource) eventSource.close();
  updateConnectionStatus("connecting");
  eventSource = new EventSource("/api/stream");
  eventSource.addEventListener("message", (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.price !== undefined) {
        updatePrice(data.price);
        updateConnectionStatus("connected");
      } else if (data.error) {
        updateConnectionStatus("error", data.error);
      }
    } catch (err) {
      console.error("SSE parse error:", err);
    }
  });
  eventSource.addEventListener("open", () => updateConnectionStatus("connected"));
  eventSource.addEventListener("error", () => {
    if (eventSource?.readyState === EventSource.CLOSED) {
      updateConnectionStatus("disconnected");
      setTimeout(connectSSE, 5000);
    } else if (eventSource?.readyState === EventSource.CONNECTING) {
      updateConnectionStatus("connecting");
    }
  });
}

connectSSE();
checkAuth();

window.addEventListener("beforeunload", () => {
  if (eventSource) eventSource.close();
});
