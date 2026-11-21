"use strict";
const fields = ["cloudApiKey", "folderId", "directOAuthToken"];
chrome.storage.local.get(fields).then(values => fields.forEach(id => { document.getElementById(id).value = values[id] || ""; }));
document.querySelectorAll("[data-eye]").forEach(button => button.addEventListener("click", () => {
  const input = document.getElementById(button.dataset.eye);
  input.type = input.type === "password" ? "text" : "password";
  button.textContent = input.type === "password" ? "Показать" : "Скрыть";
}));
document.querySelectorAll("input[type=password]").forEach(input => input.addEventListener("blur", () => {
  input.type = "password";
  const button = document.querySelector(`[data-eye="${input.id}"]`);
  if (button) button.textContent = "Показать";
}));
document.getElementById("save").addEventListener("click", async () => {
  const values = Object.fromEntries(fields.map(id => [id, document.getElementById(id).value.trim()]));
  await chrome.storage.local.set(values);
  const status = document.getElementById("status"); status.textContent = "Сохранено"; setTimeout(() => { status.textContent = ""; }, 1500);
});
