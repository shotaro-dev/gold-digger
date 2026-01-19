const investBtn = document.getElementById("invest-btn");
const dialog = document.getElementById("dialog");
const closeDialogBtn = document.getElementById("close-dialog-btn");
const priceDisplay = document.getElementById("price-display");
const connectionStatus = document.getElementById("connection-status");



// ダイアログ内のボタンで閉じる（存在チェック）
if (closeDialogBtn) {
  closeDialogBtn.addEventListener("click", () => {
    dialog.close();
  });
}

investBtn.addEventListener("click", (e) => {
  e.preventDefault();
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

/**
 * 価格を表示に更新
 */
function updatePrice(price) {
  if (!priceDisplay) return;
  
  if (typeof price === "number" && !Number.isNaN(price)) {
    priceDisplay.textContent = price.toFixed(2);
    
    // 価格更新時のアニメーション効果
    priceDisplay.style.transition = "color 0.3s ease";
    priceDisplay.style.color = "var(--gold)";
    setTimeout(() => {
      priceDisplay.style.color = "";
    }, 300);
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

// ページがアンロードされる際に接続を閉じる
window.addEventListener("beforeunload", () => {
  if (eventSource) {
    eventSource.close();
  }
});
