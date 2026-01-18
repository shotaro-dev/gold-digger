const investBtn = document.getElementById("invest-btn");
const dialog = document.getElementById("dialog");
const closeDialogBtn = document.getElementById("close-dialog-btn");
const priceDisplay = document.getElementById("price-display");

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

// 金価格を取得して表示（1 Oz あたり USD）
async function loadGoldPrice() {
  if (!priceDisplay) return;
  try {
    const res = await fetch("/api/price");
    const { price, error } = await res.json();
    if (typeof price === "number" && !Number.isNaN(price)) {
      priceDisplay.textContent = price.toFixed(2);
    } else {
      priceDisplay.textContent = "----.--";
      if (error) console.warn("Gold price error:", error);
    }
  } catch (e) {
    priceDisplay.textContent = "----.--";
    console.warn("Gold price fetch failed:", e);
  }
}

loadGoldPrice();
