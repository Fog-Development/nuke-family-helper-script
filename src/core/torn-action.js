import { runInPage } from "./page-script.js";
import { getCookie } from "./torn-page.js";

// One request to Torn, made because the member clicked a button that says
// what it does (e.g. "Loan ATM Key to Alice"). Torn's scripting rule allows a
// non-API request only when the member starts it directly and by hand, so
// this must only ever be called from a click handler, once per click, and
// never from a timer, an observer or a page load.
//
// The request is made from the page (a script tag answering a DOM event), the
// way Torn's own buttons make it: same origin, the member's own cookies and
// Torn's `rfcv` token, no extra headers. A userscript's own window may be a
// sandbox whose requests don't look like the page's.

const REQUEST = "nfh:torn-action";
const RESPONSE = "nfh:torn-action-done";
const TIMEOUT_MS = 15000;

let installed = false;
let nextId = 1;

function pageBridge(requestEvent, responseEvent) {
  if (window.__nfhTornAction) return;
  window.__nfhTornAction = true;
  document.documentElement.setAttribute("data-nfh-torn-action", "1");
  document.addEventListener(requestEvent, (event) => {
    let request;
    try {
      request = JSON.parse(event.detail);
    } catch (error) {
      return;
    }
    const answer = (payload) => document.dispatchEvent(new CustomEvent(responseEvent, { detail: JSON.stringify({ id: request.id, ...payload }) }));
    fetch(request.url, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8", "X-Requested-With": "XMLHttpRequest" },
      body: request.body,
    })
      .then((response) => response.text().then((text) => answer({ ok: response.ok, status: response.status, text })))
      .catch((error) => answer({ ok: false, status: 0, text: String((error && error.message) || error) }));
  });
}

function install() {
  if (installed) return;
  installed = true;
  runInPage(`(${pageBridge.toString()})(${JSON.stringify(REQUEST)}, ${JSON.stringify(RESPONSE)});`);
}

// POST `fields` to a torn.com page (`factions.php`), as the page would.
// Resolves to { ok, status, text }.
export function postTornAction(page, fields) {
  const rfcv = getCookie("rfc_v");
  if (!rfcv) return Promise.reject(new Error("Torn's page token was not found. Reload the page and try again."));
  install();
  if (!document.documentElement.hasAttribute("data-nfh-torn-action")) {
    return Promise.reject(new Error("Torn's page blocked the script that sends it. Use the Loan box on the row instead."));
  }
  const id = nextId++;
  const url = `/${page}?rfcv=${encodeURIComponent(rfcv)}`;
  const body = new URLSearchParams(fields).toString();
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      document.removeEventListener(RESPONSE, listener);
      reject(new Error("Torn did not answer in time (or the page blocked the request). Check the armoury before trying again."));
    }, TIMEOUT_MS);
    function listener(event) {
      let answer;
      try {
        answer = JSON.parse(event.detail);
      } catch (error) {
        return;
      }
      if (answer.id !== id) return;
      clearTimeout(timer);
      document.removeEventListener(RESPONSE, listener);
      resolve(answer);
    }
    document.addEventListener(RESPONSE, listener);
    document.dispatchEvent(new CustomEvent(REQUEST, { detail: JSON.stringify({ id, url, body }) }));
  });
}
