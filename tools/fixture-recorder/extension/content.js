// NFH Fixture Recorder: the panel on Torn pages.
//
// Read-only on Torn by design (Torn's Scripting Abuse rule): it never clicks,
// types, submits, scrolls or navigates, and never asks Torn for anything. It
// reads the page you are looking at, notes what YOU click while a scenario is
// recording, and sends a capture to the companion server on 127.0.0.1 only
// when you press a button (or, during a scenario you started, after each of
// your own actions settles).
(() => {
  "use strict";
  if (window.__nfhRecorderLoaded) return;
  window.__nfhRecorderLoaded = true;

  const HOST_ID = "nfh-recorder-host";
  const DEFAULTS = { port: 47821, network: true, screenshot: true, autoSnapshot: true, collapsed: true };
  const QUIET_MS = 800; // DOM quiet this long after an action => snapshot
  const GIVE_UP_MS = 8000; // an action that changed nothing in this long gets no step
  const MAX_SCREENSHOT_HEIGHT = 16000;
  const api = typeof browser !== "undefined" ? browser : null;

  // ---- helpers ---------------------------------------------------------------
  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const ours = (node) => {
    const host = document.getElementById(HOST_ID);
    return !!host && (node === host || host.contains(node));
  };
  const send = (message) => (api ? api.runtime.sendMessage(message) : Promise.reject(new Error("no extension API")));
  async function server(method, path, body) {
    const res = await send({ type: "server", method, path, body });
    if (!res || !res.ok) throw new Error((res && res.error) || "no answer from the extension");
    return res.data;
  }
  const ago = (iso) => {
    if (!iso) return "?";
    const days = Math.floor((Date.now() - Date.parse(iso)) / 86400000);
    return days <= 0 ? "today" : days === 1 ? "1 day ago" : `${days} days ago`;
  };

  // A selector that finds the element again in this page and in a later
  // capture of it. Torn's build-hashed classes ("title___x8Fq2") are matched by
  // their stable prefix.
  function cssPath(el) {
    const parts = [];
    while (el && el.nodeType === 1 && el !== document.documentElement) {
      if (el.id && /^[A-Za-z][\w-]*$/.test(el.id) && !/\d{4,}/.test(el.id) && document.querySelectorAll(`#${CSS.escape(el.id)}`).length === 1) {
        parts.unshift(`#${CSS.escape(el.id)}`);
        break;
      }
      let part = el.localName;
      part += [...el.classList]
        .filter((c) => !c.startsWith("nfh-"))
        .slice(0, 2)
        .map((c) => {
          const hashed = c.match(/^(.+?)___[\w-]+$/);
          return hashed ? `[class*="${hashed[1]}___"]` : `.${CSS.escape(c)}`;
        })
        .join("");
      const parent = el.parentElement;
      if (parent) {
        const same = [...parent.children].filter((c) => c.localName === el.localName);
        if (same.length > 1) part += `:nth-of-type(${same.indexOf(el) + 1})`;
      }
      parts.unshift(part);
      el = parent;
    }
    return parts.join(" > ");
  }

  function layout() {
    const width = (sel) => {
      const el = document.querySelector(sel);
      return el ? Math.round(el.getBoundingClientRect().width) : null;
    };
    const name = matchMedia("(max-width: 784px)").matches ? "mobile" : matchMedia("(max-width: 1000px)").matches ? "tablet" : "desktop";
    return { name, innerWidth: innerWidth, container: width("#mainContainer"), content: width(".content-wrapper") };
  }
  const theme = () => (document.body && document.body.classList.contains("dark-mode") ? "dark" : "light");

  // Other scripts' marks on the page. Ours should be off while capturing (the
  // war board reorders rows, which can't be undone in a capture); BSP and FF
  // Scouter are sometimes wanted, so they are only recorded.
  function otherScripts() {
    const has = (sel) => {
      try {
        return [...document.querySelectorAll(sel)].some((el) => !ours(el));
      } catch {
        return false;
      }
    };
    const found = [];
    if (has('[id^="nfh-"], [class^="nfh-"], [class*=" nfh-"]')) found.push("nfh");
    if (has(".iconStats, [data-bsp-stats]")) found.push("bsp");
    if (has('[class*="ffscouter"], [data-est-value]')) found.push("ffscouter");
    if (has('[class^="tt-"], [class*=" tt-"]')) found.push("torntools");
    return found;
  }

  function suggestId() {
    const u = new URL(location.href);
    const parts = [];
    let base = u.pathname.replace(/^\//, "").replace(/\.php$/, "").replace(/\//g, "-") || "home";
    if (base === "page" && u.searchParams.get("sid")) base = u.searchParams.get("sid");
    parts.push(base);
    for (const [k, v] of u.searchParams) {
      if (["sid", "type", "ID", "XID", "userID", "rfcv"].includes(k) || (k === "step" && v === "your")) continue;
      parts.push(v);
    }
    const hash = u.hash.replace(/^#\/?/, "");
    if (hash.includes("=")) {
      for (const [k, v] of new URLSearchParams(hash)) if (!["ID", "XID", "start"].includes(k)) parts.push(v);
    } else if (hash) parts.push(hash);
    if (theme() === "light") parts.push("light");
    const l = layout().name;
    if (l !== "desktop") parts.push(l);
    return parts
      .join("-")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80);
  }

  // ---- serialising the page --------------------------------------------------
  function disableScripts(root) {
    for (const s of root.querySelectorAll("script")) {
      const type = (s.getAttribute("type") || "").toLowerCase();
      if (type.includes("json")) continue; // data, keep as is
      if (type) s.setAttribute("data-nfh-type", type);
      s.setAttribute("type", "text/x-nfh-disabled");
    }
  }

  function serializeDocument(doc, { removeHost }) {
    const clone = doc.documentElement.cloneNode(true);
    // Live form state is not in the markup: copy it into attributes.
    const live = doc.documentElement.querySelectorAll("input, textarea, select");
    const copies = clone.querySelectorAll("input, textarea, select");
    live.forEach((el, i) => {
      const copy = copies[i];
      if (!copy) return;
      if (el.localName === "textarea") copy.textContent = el.value;
      else if (el.localName === "select") {
        [...el.options].forEach((o, j) => copy.options[j] && copy.options[j].toggleAttribute("selected", o.selected));
      } else if (el.type === "checkbox" || el.type === "radio") copy.toggleAttribute("checked", el.checked);
      else if (el.type === "password") copy.setAttribute("value", "");
      else if (el.type !== "file") copy.setAttribute("value", el.value);
    });
    // Same-origin frames (the mail editor) go in as srcdoc so the harness
    // renders them in place.
    const liveFrames = doc.documentElement.querySelectorAll("iframe");
    const frameCopies = clone.querySelectorAll("iframe");
    liveFrames.forEach((frame, i) => {
      const copy = frameCopies[i];
      try {
        const inner = frame.contentDocument;
        if (!copy || !inner || !inner.documentElement) return;
        copy.setAttribute("srcdoc", "<!DOCTYPE html>" + serializeDocument(inner, { removeHost: false }));
        if (copy.hasAttribute("src")) {
          copy.setAttribute("data-nfh-src", copy.getAttribute("src"));
          copy.removeAttribute("src");
        }
      } catch {
        if (copy) copy.setAttribute("data-nfh-frame", "cross-origin, not captured");
      }
    });
    if (removeHost) clone.querySelector(`#${HOST_ID}`)?.remove();
    disableScripts(clone);
    return clone.outerHTML;
  }

  function serializePage(info = {}) {
    const header = `<!-- nfh-fixture ${JSON.stringify({ ...info, url: location.href, capturedAt: new Date().toISOString() }).replace(/--/g, "- -")} -->\n`;
    return "<!DOCTYPE html>\n" + header + serializeDocument(document, { removeHost: true });
  }

  // Torn's stylesheets as the page has them (same origin, so readable).
  function stylesheets() {
    const out = {};
    for (const sheet of document.styleSheets) {
      if (!sheet.href || !sheet.ownerNode || ours(sheet.ownerNode)) continue;
      const u = new URL(sheet.href);
      if (u.origin !== location.origin) continue;
      try {
        out[u.pathname + u.search] = () => [...sheet.cssRules].map((r) => r.cssText).join("\n");
      } catch {
        // not readable; npm run fixtures:css can fetch it
      }
    }
    return out;
  }

  // ---- page contracts ----------------------------------------------------------
  function checkContracts(contracts) {
    return contracts.map((c) => {
      if (c.when && !document.querySelector(c.when)) return { ...c, status: "waiting", results: [] };
      const results = c.expect.map((e) => {
        let count = 0;
        try {
          count = document.querySelectorAll(e.selector).length;
        } catch {
          count = -1;
        }
        return { ...e, count, ok: count >= (e.min ?? 1) };
      });
      return { ...c, status: results.every((r) => r.ok) ? "ok" : "broken", results };
    });
  }

  // ---- state -----------------------------------------------------------------
  const state = {
    settings: { ...DEFAULTS },
    serverOk: null,
    serverInfo: null,
    coverage: null,
    contractResults: [],
    form: { id: "", title: "", notes: "", wantedId: "" },
    busy: false,
    message: null, // { kind: "ok"|"error"|"warn", text }
    replaceOffer: null,
    scenario: null, // { id, steps, actions[], lastSeq, pending, label }
    lastUrl: location.href,
  };

  // ---- scenario: watching your own actions ----------------------------------
  let structuralSince = []; // targets of element additions/removals since last step
  let lastStructuralAt = 0;
  const observer = new MutationObserver((records) => {
    if (!state.scenario) return;
    for (const r of records) {
      if (ours(r.target)) continue;
      const elements = [...r.addedNodes, ...r.removedNodes].some((n) => n.nodeType === 1 && !ours(n));
      if (!elements) continue;
      structuralSince.push(r.target);
      lastStructuralAt = Date.now();
    }
  });

  function commonAncestor(nodes) {
    const alive = nodes.filter((n) => n.isConnected);
    if (!alive.length) return document.body;
    let anc = alive[0];
    for (const n of alive.slice(1)) {
      while (anc && !anc.contains(n)) anc = anc.parentElement;
    }
    if (!anc || anc.nodeType !== 1 || anc === document.documentElement) return document.body;
    return anc;
  }

  function describeTarget(target) {
    const el = target.closest('a, button, [role="button"], input, select, textarea, label, li, [class*="button"], [class*="btn"]') || target;
    const text = (el.innerText || el.value || el.getAttribute("aria-label") || el.title || "").trim().replace(/\s+/g, " ").slice(0, 80);
    return { selector: cssPath(el), text, tag: el.localName };
  }

  function noteAction(action) {
    const s = state.scenario;
    if (!s) return;
    s.actions.push({ ...action, at: new Date().toISOString(), url: location.href });
    s.pending = { at: Date.now(), structuralAtStart: structuralSince.length, url: location.href };
    render();
  }

  document.addEventListener(
    "click",
    (event) => {
      if (!state.scenario || !event.isTrusted || ours(event.target) || !(event.target instanceof Element)) return;
      noteAction({ type: "click", ...describeTarget(event.target) });
    },
    true,
  );
  document.addEventListener(
    "change",
    (event) => {
      const el = event.target;
      if (!state.scenario || !event.isTrusted || ours(el) || !(el instanceof Element)) return;
      const value = el.type === "password" ? "(hidden)" : el.type === "checkbox" || el.type === "radio" ? String(el.checked) : String(el.value ?? "").slice(0, 500);
      noteAction({ type: "input", selector: cssPath(el), tag: el.localName, value });
    },
    true,
  );

  setInterval(() => {
    // URL changes (Torn switches tabs through the hash or pushState).
    if (location.href !== state.lastUrl) {
      state.lastUrl = location.href;
      if (state.scenario) noteAction({ type: "navigate", to: location.href });
      refreshCoverage();
      setTimeout(runContracts, 2000);
    }
    const s = state.scenario;
    if (!s || !s.pending || state.busy || document.visibilityState !== "visible") return;
    const changed = structuralSince.length > s.pending.structuralAtStart || location.href !== s.pending.url;
    const now = Date.now();
    if (changed && state.settings.autoSnapshot && now - Math.max(lastStructuralAt, s.pending.at) >= QUIET_MS) {
      snapshot("auto");
    } else if (!changed && now - s.pending.at > GIVE_UP_MS) {
      s.pending = null; // nothing visible happened; the action rides along with the next step
    }
  }, 200);

  // Contracts are re-checked while visible (they read the page, nothing more).
  setInterval(() => {
    if (document.visibilityState === "visible") runContracts();
  }, 5000);

  // ---- capturing ---------------------------------------------------------------
  async function screenshot() {
    if (!state.settings.screenshot) return undefined;
    const host = document.getElementById(HOST_ID);
    host.style.display = "none";
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    try {
      const res = await send({
        type: "screenshot",
        width: document.documentElement.scrollWidth,
        height: Math.min(document.documentElement.scrollHeight, MAX_SCREENSHOT_HEIGHT),
      });
      if (!res.ok) throw new Error(res.error);
      return res.dataUrl;
    } catch (error) {
      state.message = { kind: "warn", text: `No screenshot: ${error.message}` };
      return undefined;
    } finally {
      host.style.display = "";
    }
  }

  async function missingCss() {
    const sheets = stylesheets();
    const { missing } = await server("POST", "/api/css/missing", { hrefs: Object.keys(sheets) });
    const out = {};
    for (const href of missing) {
      try {
        out[href] = sheets[href]();
      } catch {
        // unreadable
      }
    }
    return Object.keys(out).length ? out : undefined;
  }

  async function network(since) {
    if (!state.settings.network) return { entries: [], lastSeq: since };
    const res = await send({ type: "network", since });
    return {
      entries: res.entries.map(({ seq, ...entry }) => entry),
      lastSeq: res.lastSeq,
    };
  }

  function stepInfo(trigger, extra = {}) {
    return {
      url: location.href,
      pageTitle: document.title,
      theme: theme(),
      layout: layout(),
      trigger,
      otherScripts: otherScripts(),
      userAgent: navigator.userAgent,
      scroll: { x: Math.round(scrollX), y: Math.round(scrollY) },
      ...extra,
    };
  }

  async function capture({ mode, trigger, since = 0, extra = {}, fixture }) {
    const id = fixture.id;
    const step = stepInfo(trigger, extra);
    step.html = serializePage({ id, trigger, label: extra.label });
    const net = await network(since);
    const shot = await screenshot();
    const css = await missingCss();
    const result = await server("POST", "/api/capture", {
      id,
      mode,
      title: fixture.title || undefined,
      notes: fixture.notes || undefined,
      wantedId: fixture.wantedId || undefined,
      step,
      network: net.entries,
      css,
      screenshot: shot,
    });
    return { ...result, lastSeq: net.lastSeq };
  }

  function formFixture() {
    const f = state.form;
    return { id: (f.id || suggestId()).trim(), title: f.title.trim(), notes: f.notes.trim(), wantedId: f.wantedId };
  }

  async function run(work) {
    if (state.busy) return;
    state.busy = true;
    state.replaceOffer = null;
    render();
    try {
      await work();
    } catch (error) {
      state.message = { kind: "error", text: error.message };
      if (/already exists/.test(error.message)) state.replaceOffer = state.lastAttempt;
    } finally {
      state.busy = false;
      render();
    }
  }

  function captureOnce(mode = "new", fixture = formFixture()) {
    state.lastAttempt = { kind: "once", fixture };
    return run(async () => {
      const r = await capture({ mode, trigger: "manual", fixture, extra: { label: "page" } });
      state.message = { kind: "ok", text: `Saved ${r.id} (${r.steps} step${r.steps > 1 ? "s" : ""})` };
      state.form = { id: "", title: "", notes: "", wantedId: "" };
      await refreshCoverage();
    });
  }

  function startScenario(mode = "new", fixture = formFixture()) {
    state.lastAttempt = { kind: "scenario", fixture };
    return run(async () => {
      structuralSince = [];
      const r = await capture({ mode, trigger: "start", fixture, extra: { label: "start", actions: [] } });
      state.scenario = { fixture, steps: 1, actions: [], lastSeq: r.lastSeq, pending: null, label: "" };
      state.message = { kind: "ok", text: `Recording ${r.id}: step 0 saved. Do the actions; each settles into a step.` };
      observer.observe(document.documentElement, { childList: true, subtree: true });
    });
  }

  function snapshot(trigger = "manual") {
    const s = state.scenario;
    if (!s) return captureOnce();
    return run(async () => {
      const root = structuralSince.length ? commonAncestor(structuralSince) : null;
      const last = s.actions[s.actions.length - 1];
      const label =
        s.label.trim() ||
        (last ? `after ${last.type}${last.text ? ` "${last.text}"` : last.to ? ` to ${last.to}` : ""}` : trigger);
      const r = await capture({
        mode: "append",
        trigger,
        since: s.lastSeq,
        fixture: s.fixture,
        extra: { label, actions: s.actions, changedRoot: root ? cssPath(root) : undefined },
      });
      s.steps = r.steps;
      s.lastSeq = r.lastSeq;
      s.actions = [];
      s.pending = null;
      s.label = "";
      structuralSince = [];
      state.message = { kind: "ok", text: `Step ${r.step} saved (${label})` };
    });
  }

  function finishScenario() {
    observer.disconnect();
    const s = state.scenario;
    state.scenario = null;
    state.message = { kind: "ok", text: `Finished ${s.fixture.id}: ${s.steps} step(s)` };
    refreshCoverage();
  }

  // ---- talking to the server -----------------------------------------------------
  async function refreshCoverage() {
    try {
      state.serverInfo = await server("GET", "/api/status");
      state.coverage = await server("GET", `/api/coverage?url=${encodeURIComponent(location.href)}`);
      state.serverOk = true;
    } catch (error) {
      state.serverOk = false;
      state.coverage = null;
      state.serverError = error.message;
    }
    lastContractKey = null; // always redraw after new coverage
    runContracts();
  }

  let lastContractKey = null;
  function runContracts() {
    state.contractResults = checkContracts(state.coverage ? state.coverage.contracts : []);
    const key = JSON.stringify(state.contractResults.map((c) => [c.id, c.status, c.results.map((r) => r.count)]));
    if (key !== lastContractKey) {
      lastContractKey = key;
      render();
    }
  }

  // ---- UI ---------------------------------------------------------------------
  const STYLE = `
    :host { all: initial; }
    * { box-sizing: border-box; font: 12px/1.35 system-ui, sans-serif; }
    .pill { position: fixed; left: 8px; bottom: 8px; z-index: 2147483646; background: #222; color: #eee; border: 1px solid #555;
      border-radius: 14px; padding: 4px 10px; cursor: pointer; box-shadow: 0 2px 8px #0008; }
    .pill .dot { color: #d33; } .pill.rec .dot { animation: blink 1s infinite; }
    @keyframes blink { 50% { opacity: .2; } }
    .badge { margin-left: 6px; padding: 0 5px; border-radius: 8px; }
    .badge.ok { background: #285; } .badge.bad { background: #b33; }
    .panel { position: fixed; left: 8px; bottom: 40px; z-index: 2147483647; width: 340px; max-height: 75vh; overflow: auto;
      background: #1e1e1e; color: #ddd; border: 1px solid #555; border-radius: 8px; padding: 8px 10px; box-shadow: 0 4px 16px #000a; }
    h3 { margin: 10px 0 4px; font-weight: 600; color: #fff; font-size: 12px; text-transform: uppercase; letter-spacing: .04em; }
    h3:first-child { margin-top: 0; }
    .muted { color: #999; } .ok { color: #6c6; } .bad { color: #f77; } .warn { color: #fc6; }
    .row { border-top: 1px solid #333; padding: 4px 0; }
    .row:first-of-type { border-top: 0; }
    button { background: #3a3a3a; color: #eee; border: 1px solid #666; border-radius: 4px; padding: 2px 8px; cursor: pointer; margin: 2px 4px 2px 0; }
    button.primary { background: #2d5d8a; border-color: #4a86c0; }
    button:disabled { opacity: .5; cursor: default; }
    input[type=text], textarea { width: 100%; background: #111; color: #eee; border: 1px solid #555; border-radius: 4px; padding: 3px 5px; margin: 2px 0; }
    textarea { height: 44px; resize: vertical; }
    label.check { margin-right: 10px; white-space: nowrap; }
    .msg { margin: 6px 0; padding: 4px 6px; border-radius: 4px; background: #2a2a2a; }
    code { font-family: ui-monospace, monospace; font-size: 11px; color: #bcd; word-break: break-all; }
    ol { margin: 2px 0 2px 18px; padding: 0; }
  `;

  let shadow;
  function mount() {
    if (document.getElementById(HOST_ID)) return;
    const host = document.createElement("div");
    host.id = HOST_ID;
    shadow = host.attachShadow({ mode: "open" });
    shadow.innerHTML = `<style>${STYLE}</style><div class="root"></div>`;
    document.documentElement.appendChild(host);
    shadow.addEventListener("click", onClick);
    shadow.addEventListener("input", onInput);
  }

  function contractBadge() {
    const applicable = state.contractResults.filter((c) => c.status !== "waiting");
    if (!applicable.length) return "";
    const broken = applicable.filter((c) => c.status === "broken").length;
    return broken
      ? `<span class="badge bad" title="Page contracts broken">✗ ${broken}</span>`
      : `<span class="badge ok" title="Page contracts hold">✓ ${applicable.length}</span>`;
  }

  function renderPanel() {
    const s = state.scenario;
    const cov = state.coverage;
    const scripts = otherScripts();
    const parts = [];

    parts.push(`<h3>Fixture recorder <button data-act="collapse" style="float:right">–</button></h3>`);
    if (state.serverOk === false) {
      parts.push(`<div class="bad">Companion not reachable on port ${esc(state.settings.port)}. Run <code>npm run recorder</code> in the script repo, then <button data-act="retry">Retry</button></div>`);
    } else if (state.serverInfo) {
      parts.push(`<div class="muted">${esc(state.serverInfo.fixtures)} fixtures · ${esc(state.serverInfo.wantedOpen)} wanted open${state.serverInfo.isRepo ? "" : ' · <span class="warn">fixtures folder is not a git repo</span>'}</div>`);
    }
    const l = layout();
    parts.push(`<div class="muted">${esc(theme())} · ${esc(l.name)} (${esc(l.innerWidth)}px window, content ${esc(l.content ?? "?")}px)${scripts.length ? ` · seen: ${esc(scripts.join(", "))}` : ""}</div>`);
    if (scripts.includes("nfh")) parts.push(`<div class="warn">Nuke Assistant UI is on this page. Turn the userscript off and reload before capturing.</div>`);
    if (state.message) parts.push(`<div class="msg ${esc(state.message.kind === "error" ? "bad" : state.message.kind)}">${esc(state.message.text)}</div>`);
    if (state.replaceOffer) parts.push(`<div><button data-act="replace" class="primary">Replace the existing fixture</button></div>`);

    if (s) {
      parts.push(`<h3>Recording · ${esc(s.fixture.id)}</h3>`);
      parts.push(`<div>${esc(s.steps)} step(s) saved. ${s.pending ? '<span class="warn">waiting for the page to settle…</span>' : "Your actions since the last step:"}</div>`);
      parts.push(s.actions.length ? `<ol>${s.actions.map((a) => `<li>${esc(a.type)} ${a.text ? `"${esc(a.text)}"` : ""} <code>${esc(a.selector || a.to || "")}</code></li>`).join("")}</ol>` : `<div class="muted">none yet</div>`);
      parts.push(`<input type="text" data-field="label" placeholder="Label for the next step (optional)" value="${esc(s.label)}">`);
      parts.push(`<label class="check"><input type="checkbox" data-setting="autoSnapshot" ${state.settings.autoSnapshot ? "checked" : ""}> auto step after each action</label>`);
      parts.push(`<div><button data-act="snapshot" class="primary" ${state.busy ? "disabled" : ""}>Snapshot now (Alt+Shift+S)</button><button data-act="finish" ${state.busy ? "disabled" : ""}>Finish</button></div>`);
      parts.push(`<div class="muted">Stop before anything you don't want to really happen (e.g. leave a Kick dialog unconfirmed).</div>`);
    }

    const broken = state.contractResults.filter((c) => c.status === "broken");
    if (state.contractResults.length) {
      parts.push(`<h3>Page contracts</h3>`);
      for (const c of state.contractResults) {
        const status = c.status === "ok" ? '<span class="ok">ok</span>' : c.status === "waiting" ? '<span class="muted">not on screen</span>' : '<span class="bad">broken</span>';
        parts.push(`<div class="row">${status} <b>${esc(c.feature)}</b>: ${esc(c.description || c.id)}`);
        if (c.status === "broken") {
          for (const r of c.results.filter((r) => !r.ok)) {
            parts.push(`<div class="bad">✗ <code>${esc(r.selector)}</code> found ${esc(r.count)}${r.note ? ` (${esc(r.note)})` : ""}</div>`);
          }
          if (c.fixtures?.length) parts.push(`<div class="muted">Fixtures to refresh: ${esc(c.fixtures.join(", "))}</div>`);
        }
        parts.push(`</div>`);
      }
      if (broken.length) parts.push(`<div class="warn">Torn's markup changed here: tell Claude, and refresh the fixtures listed.</div>`);
    }

    if (cov && !s) {
      parts.push(`<h3>Captured for this page</h3>`);
      if (!cov.fixtures.length) parts.push(`<div class="muted">Nothing yet.</div>`);
      for (const f of cov.fixtures) {
        parts.push(`<div class="row"><b>${esc(f.id)}</b> <span class="muted">${esc(f.steps)} step(s) · ${esc(f.themes.join("/"))} · ${esc(f.layouts.join("/") || "?")} · ${esc(ago(f.updatedAt))}${f.source === "legacy-sanitized" ? " · old sanitized" : ""}</span>
          <div class="muted">${esc(f.title)}${f.steps > 1 ? `: ${esc(f.labels.join(" → "))}` : ""}</div>
          <button data-act="refresh" data-id="${esc(f.id)}" data-scenario="${f.steps > 1 ? 1 : ""}" ${state.busy ? "disabled" : ""}>${f.steps > 1 ? "Re-record" : "Refresh"}</button></div>`);
      }
      const wanted = cov.wanted.filter((w) => w.status !== "done");
      if (wanted.length) {
        parts.push(`<h3>Wanted here</h3>`);
        for (const w of wanted) {
          parts.push(`<div class="row"><b>${esc(w.id)}</b> <span class="muted">${esc(w.theme || "any theme")}${w.layout ? ` · ${esc(w.layout)}` : ""}${w.scenario ? " · scenario" : ""}</span>
            <div>${esc(w.instructions)}</div>
            <button data-act="use-wanted" data-id="${esc(w.id)}">Use</button></div>`);
        }
      }
    }

    if (!s) {
      parts.push(`<h3>New capture</h3>`);
      parts.push(`<input type="text" data-field="id" placeholder="id: ${esc(suggestId())}" value="${esc(state.form.id)}">`);
      parts.push(`<input type="text" data-field="title" placeholder="Title (what this page/state is)" value="${esc(state.form.title)}">`);
      parts.push(`<textarea data-field="notes" placeholder="Notes for Claude (what you did, what to look at)">${esc(state.form.notes)}</textarea>`);
      parts.push(`<label class="check"><input type="checkbox" data-setting="screenshot" ${state.settings.screenshot ? "checked" : ""}> screenshot</label>`);
      parts.push(`<label class="check"><input type="checkbox" data-setting="network" ${state.settings.network ? "checked" : ""}> page's network responses</label>`);
      const off = state.busy || state.serverOk === false ? "disabled" : "";
      parts.push(`<div><button data-act="capture" class="primary" ${off}>Capture page</button><button data-act="start" ${off}>Start scenario</button></div>`);
      if (state.form.wantedId) parts.push(`<div class="muted">For wanted capture ${esc(state.form.wantedId)}</div>`);
    }
    return parts.join("");
  }

  function render() {
    if (!shadow) return;
    const root = shadow.querySelector(".root");
    const focused = shadow.activeElement && shadow.activeElement.dataset ? shadow.activeElement.dataset.field : null;
    const pill = `<div class="pill ${state.scenario ? "rec" : ""}" data-act="toggle"><span class="dot">●</span> ${state.scenario ? `REC ${esc(state.scenario.steps)}` : "Fixtures"}${contractBadge()}</div>`;
    root.innerHTML = pill + (state.settings.collapsed ? "" : `<div class="panel">${renderPanel()}</div>`);
    if (focused) {
      const el = root.querySelector(`[data-field="${focused}"]`);
      if (el) {
        el.focus();
        el.setSelectionRange?.(el.value.length, el.value.length);
      }
    }
  }

  function saveSetting(key, value) {
    state.settings[key] = value;
    if (api) api.storage.local.set({ [key]: value });
  }

  function onInput(event) {
    const el = event.target;
    if (el.dataset.field === "label" && state.scenario) state.scenario.label = el.value;
    else if (el.dataset.field) state.form[el.dataset.field] = el.value;
    if (el.dataset.setting) saveSetting(el.dataset.setting, el.checked);
  }

  function onClick(event) {
    const el = event.target.closest("[data-act]");
    if (!el) return;
    const act = el.dataset.act;
    if (act === "toggle" || act === "collapse") {
      saveSetting("collapsed", !state.settings.collapsed);
      if (!state.settings.collapsed) refreshCoverage();
      render();
    } else if (act === "retry") refreshCoverage();
    else if (act === "capture") captureOnce();
    else if (act === "start") startScenario();
    else if (act === "snapshot") snapshot("manual");
    else if (act === "finish") finishScenario();
    else if (act === "replace" && state.lastAttempt) {
      const { kind, fixture } = state.lastAttempt;
      kind === "scenario" ? startScenario("replace", fixture) : captureOnce("replace", fixture);
    } else if (act === "refresh") {
      const f = state.coverage.fixtures.find((x) => x.id === el.dataset.id);
      const fixture = { id: f.id, title: f.title, notes: f.notes };
      el.dataset.scenario ? startScenario("replace", fixture) : captureOnce("replace", fixture);
    } else if (act === "use-wanted") {
      const w = state.coverage.wanted.find((x) => x.id === el.dataset.id);
      state.form = { id: w.id, title: w.title || "", notes: w.instructions || "", wantedId: w.id };
      state.message = { kind: "ok", text: w.scenario ? "Filled in. Press Start scenario, then do the actions." : "Filled in. Press Capture page when the page shows what is asked." };
      render();
    }
  }

  if (api) {
    api.runtime.onMessage.addListener((message) => {
      if (message.type === "hotkey") snapshot("manual");
    });
  }

  // Exposed for the recorder's own tests (test/recorder/).
  window.__nfhRecorderTest = { serializePage, cssPath, suggestId, checkContracts, commonAncestor, state, snapshot };

  (async () => {
    if (api) state.settings = { ...DEFAULTS, ...(await api.storage.local.get(DEFAULTS)) };
    mount();
    render();
    await refreshCoverage();
  })();
})();
