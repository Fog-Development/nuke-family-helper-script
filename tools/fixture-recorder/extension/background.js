// NFH Fixture Recorder: background page.
//
// 1. Network log: keeps, per Torn tab and in memory only, the responses to the
//    XHR/fetch requests the page itself makes (Firefox's filterResponseData
//    passes every byte through untouched and keeps a copy). Nothing is ever
//    requested; the log is emptied when the tab loads a new page and only
//    leaves memory inside a capture you started.
// 2. Talks to the companion server (npm run recorder) for the content script.
// 3. Full-page screenshots of the tab, on a capture.
"use strict";

const DEFAULTS = { port: 47821, network: true };
const MAX_BODY = 3 * 1024 * 1024; // keep at most 3 MB of any one response
const MAX_ENTRIES = 300; // per tab
const SECRET_KEYS = /rfcv|password|token|secret|key|sid_?token/i;

let settings = { ...DEFAULTS };

function redactUrl(url) {
  try {
    const u = new URL(url);
    for (const k of [...u.searchParams.keys()]) if (SECRET_KEYS.test(k)) u.searchParams.set(k, "REDACTED");
    return u.toString();
  } catch {
    return url;
  }
}

function requestBodyOf(details) {
  const body = details.requestBody;
  if (!body) return undefined;
  if (body.formData) {
    const out = {};
    for (const [k, v] of Object.entries(body.formData)) out[k] = SECRET_KEYS.test(k) ? ["REDACTED"] : v;
    return { formData: out };
  }
  if (body.raw) {
    try {
      const text = body.raw
        .filter((part) => part.bytes)
        .map((part) => new TextDecoder().decode(part.bytes))
        .join("");
      return { raw: text.replace(/(rfcv|password|token)=([^&]*)/gi, "$1=REDACTED").slice(0, 100000) };
    } catch {
      return { raw: "(unreadable)" };
    }
  }
  return undefined;
}

// The per-tab log. Exposed as a factory so it can be tested without Firefox.
function makeNetworkLog() {
  const tabs = new Map(); // tabId -> entries[]
  const pending = new Map(); // requestId -> entry
  let seq = 0;

  return {
    clearTab(tabId) {
      tabs.delete(tabId);
    },
    start(details) {
      const entry = {
        seq: 0,
        at: new Date(details.timeStamp || Date.now()).toISOString(),
        method: details.method,
        url: redactUrl(details.url),
        requestBody: requestBodyOf(details),
        chunks: [],
        size: 0,
        truncated: false,
        tabId: details.tabId,
      };
      pending.set(details.requestId, entry);
      return entry;
    },
    headers(details) {
      const entry = pending.get(details.requestId);
      if (!entry) return;
      entry.status = details.statusCode;
      const type = (details.responseHeaders || []).find((h) => h.name.toLowerCase() === "content-type");
      entry.contentType = type ? type.value : "";
    },
    data(requestId, buffer) {
      const entry = pending.get(requestId);
      if (!entry || entry.truncated) return;
      if (entry.size + buffer.byteLength > MAX_BODY) {
        entry.truncated = true;
        return;
      }
      entry.chunks.push(new Uint8Array(buffer));
      entry.size += buffer.byteLength;
    },
    finish(requestId) {
      const entry = pending.get(requestId);
      pending.delete(requestId);
      if (!entry) return null;
      if (/^(image|font|audio|video)\//.test(entry.contentType || "")) return null;
      const all = new Uint8Array(entry.size);
      let offset = 0;
      for (const chunk of entry.chunks) {
        all.set(chunk, offset);
        offset += chunk.byteLength;
      }
      const { chunks, size, tabId, ...kept } = entry;
      kept.responseText = new TextDecoder().decode(all);
      kept.seq = ++seq;
      const list = tabs.get(tabId) || [];
      list.push(kept);
      if (list.length > MAX_ENTRIES) list.splice(0, list.length - MAX_ENTRIES);
      tabs.set(tabId, list);
      return kept;
    },
    fail(requestId) {
      pending.delete(requestId);
    },
    since(tabId, after = 0) {
      const list = (tabs.get(tabId) || []).filter((e) => e.seq > after);
      return { entries: list, lastSeq: list.length ? list[list.length - 1].seq : after };
    },
  };
}

const network = makeNetworkLog();

async function server(method, path, body) {
  const res = await fetch(`http://127.0.0.1:${settings.port}${path}`, {
    method,
    headers: { "content-type": "application/json", "x-nfh-recorder": "1" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
  if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
  return json;
}

function wire() {
  browser.storage.local.get(DEFAULTS).then((stored) => {
    settings = { ...DEFAULTS, ...stored };
  });
  browser.storage.onChanged.addListener((changes) => {
    for (const [k, { newValue }] of Object.entries(changes)) settings[k] = newValue;
  });

  const filter = { urls: ["https://www.torn.com/*"] };

  // A new page in the tab: its log starts over.
  browser.webRequest.onBeforeRequest.addListener(
    (details) => {
      if (details.type === "main_frame") network.clearTab(details.tabId);
    },
    { ...filter, types: ["main_frame"] },
  );

  browser.webRequest.onBeforeRequest.addListener(
    (details) => {
      if (!settings.network || details.tabId < 0) return {};
      let stream;
      try {
        stream = browser.webRequest.filterResponseData(details.requestId);
      } catch {
        return {};
      }
      network.start(details);
      // Pass every byte straight through first; recording must never hold
      // up or change what the page receives.
      stream.ondata = (event) => {
        let copy = null;
        try {
          copy = event.data.slice(0);
        } catch {
          // recording failed; the page is unaffected
        }
        stream.write(event.data);
        if (copy) {
          try {
            network.data(details.requestId, copy);
          } catch {
            // as above
          }
        }
      };
      stream.onstop = () => {
        try {
          stream.close();
        } finally {
          network.finish(details.requestId);
        }
      };
      stream.onerror = () => network.fail(details.requestId);
      return {};
    },
    { ...filter, types: ["xmlhttprequest"] },
    ["blocking", "requestBody"],
  );
  browser.webRequest.onHeadersReceived.addListener((details) => network.headers(details), {
    ...filter,
    types: ["xmlhttprequest"],
  }, ["responseHeaders"]);
  browser.webRequest.onErrorOccurred.addListener((details) => network.fail(details.requestId), {
    ...filter,
    types: ["xmlhttprequest"],
  });
  browser.tabs.onRemoved.addListener((tabId) => network.clearTab(tabId));

  browser.runtime.onMessage.addListener((message, sender) => {
    const tabId = sender.tab && sender.tab.id;
    switch (message.type) {
      case "server":
        return server(message.method || "GET", message.path, message.body).then(
          (data) => ({ ok: true, data }),
          (error) => ({ ok: false, error: error.message }),
        );
      case "network":
        return Promise.resolve(network.since(tabId, message.since || 0));
      case "screenshot":
        return browser.tabs
          .captureTab(tabId, {
            format: "png",
            rect: { x: 0, y: 0, width: message.width, height: message.height },
          })
          .then(
            (dataUrl) => ({ ok: true, dataUrl }),
            (error) => ({ ok: false, error: error.message }),
          );
      default:
        return undefined;
    }
  });

  browser.commands.onCommand.addListener(async (command) => {
    if (command !== "snapshot") return;
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (tab) browser.tabs.sendMessage(tab.id, { type: "hotkey" }).catch(() => {});
  });
}

if (typeof browser !== "undefined" && browser.webRequest) wire();
if (typeof module !== "undefined") module.exports = { makeNetworkLog, redactUrl, requestBodyOf };
