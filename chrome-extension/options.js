"use strict";
const YANDEX_OAUTH_CLIENT_ID = "110b2abc47ec4422893a89a100d00586";
const YANDEX_OAUTH_REDIRECT = "https://oauth.yandex.ru/verification_code";
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
document.getElementById("authorizeDirect").addEventListener("click", () => {
  const url = new URL("https://oauth.yandex.ru/authorize");
  url.searchParams.set("response_type", "token");
  url.searchParams.set("client_id", YANDEX_OAUTH_CLIENT_ID);
  url.searchParams.set("redirect_uri", YANDEX_OAUTH_REDIRECT);
  url.searchParams.set("force_confirm", "yes");
  window.open(url.href, "_blank", "noopener,noreferrer");
});
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local" || !changes.directOAuthToken?.newValue) return;
  document.getElementById("directOAuthToken").value = changes.directOAuthToken.newValue;
  const status = document.getElementById("status");
  status.textContent = "Авторизация выполнена";
  setTimeout(() => { status.textContent = ""; }, 2500);
});
document.getElementById("save").addEventListener("click", async () => {
  const values = Object.fromEntries(fields.map(id => [id, document.getElementById(id).value.trim()]));
  await chrome.storage.local.set(values);
  const status = document.getElementById("status"); status.textContent = "Сохранено"; setTimeout(() => { status.textContent = ""; }, 1500);
});
