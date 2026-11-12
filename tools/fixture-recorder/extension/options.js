"use strict";
const DEFAULTS = { privateOnly: true, port: 47821 };
const privateOnly = document.getElementById("privateOnly");
const port = document.getElementById("port");

browser.storage.local.get(DEFAULTS).then((s) => {
  privateOnly.checked = s.privateOnly;
  port.value = s.port;
});
privateOnly.addEventListener("change", () => browser.storage.local.set({ privateOnly: privateOnly.checked }));
port.addEventListener("change", () => {
  const n = Number(port.value);
  if (Number.isInteger(n) && n > 0 && n < 65536) browser.storage.local.set({ port: n });
});
