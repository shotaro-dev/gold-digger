const investBtn = document.getElementById("invest-btn");
const dialog = document.getElementById("dialog");
const closeDialogBtn = document.getElementById("close-dialog-btn");

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
