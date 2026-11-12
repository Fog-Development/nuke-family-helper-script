// NFH Fixture Recorder: background page.
//
// 1. Network log: keeps, per Torn tab and in memory only, the responses to the
//    XHR/fetch requests the page itself makes (Firefox's filterResponseData
//    passes every byte through untouched and keeps a copy). Nothing is ever
//    requested; the log is emptied when the tab loads a new page and only
//    leaves memory inside a capture you started.
// 2. Talks to the companion server (npm run recorder) for the content script.
// 3. Full-page screenshots of the tab, on a capture.
// 4. Window width for layout captures: resizes the browser window (or, when
//    the window can't get that narrow, zooms the tab) on your click, so Torn's
//    own media queries switch layout. The user agent is never touched, unlike
//    Responsive Design Mode, which Cloudflare's checks on Torn trip over.
//
// With "private windows only" on (the default), nothing is copied from tabs in
// normal windows; the content script stays off there too.
"use strict";

const DEFAULTS = { port: 47821, network: true, privateOnly: true };
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

// ---- window width ------------------------------------------------------------
const savedWindows = new Map(); // windowId -> { state, left, top, width, height }
const zoomedTabs = new Set();

async function resizeWindow(tab, { width, chrome }) {
  const win = await browser.windows.get(tab.windowId);
  if (!savedWindows.has(win.id)) {
    savedWindows.set(win.id, { state: win.state, left: win.left, top: win.top, width: win.width, height: win.height });
  }
  if (win.state !== "normal") await browser.windows.update(win.id, { state: "normal" });
  await browser.windows.update(win.id, { width: Math.round(width + Math.max(0, chrome || 0)) });
  return { ok: true };
}

// The tab's CSS viewport becomes `width` px by zooming: zoom = window px / CSS px.
async function zoomTo(tab, { width, cssWidth }) {
  const current = await browser.tabs.getZoom(tab.id);
  const factor = Math.min(5, Math.max(0.3, (current * cssWidth) / width));
  try {
    await browser.tabs.setZoomSettings(tab.id, { scope: "per-tab" });
  } catch {
    // older Firefox: per-site zoom, undone by Restore all the same
  }
  await browser.tabs.setZoom(tab.id, factor);
  zoomedTabs.add(tab.id);
  return { ok: true, zoom: factor };
}

async function restoreWindow(tab) {
  if (zoomedTabs.delete(tab.id)) await browser.tabs.setZoom(tab.id, 1).catch(() => {});
  const saved = savedWindows.get(tab.windowId);
  if (!saved) return { ok: true };
  savedWindows.delete(tab.windowId);
  if (saved.state === "normal") {
    const { state, ...bounds } = saved;
    await browser.windows.update(tab.windowId, bounds);
  } else {
    await browser.windows.update(tab.windowId, { state: saved.state });
  }
  return { ok: true };
}

const reply = (promise) =>
  promise.then(
    (value) => value,
    (error) => ({ ok: false, error: error.message }),
  );

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
      if (settings.privateOnly && !details.incognito) return {};
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
      case "resize":
        return reply(resizeWindow(sender.tab, message));
      case "zoom":
        return reply(zoomTo(sender.tab, message));
      case "restore":
        return reply(restoreWindow(sender.tab));
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
