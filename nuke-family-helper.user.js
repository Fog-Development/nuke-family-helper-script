// ==UserScript==
// @name         Nuke Assistant
// @namespace    https://nuke.family/
// @version      2.22.0
// @description  Making things easier for the Nuke Family. This application will only function properly if you are a Nuke Member who has a site API key generated from https://nuke.family/user
// @author       Fogest <nuke@jhvisser.com>
// @match        https://www.torn.com/factions.php*
// @match        https://www.torn.com/profiles.php*
// @match        https://www.torn.com/hospitalview.php*
// @match        https://www.torn.com/messages.php*
// @match        https://www.torn.com/page.php?sid=stocks*
// @match        https://nuke.family/auth/token-generation*
// @icon         data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAAsVBMVEUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAADAgEIBwIJCAILCQMODAQUEQUYFQcaFgcfGgggGwklIAotJgwyKg46MhA8MxBKPxRQRBZgUhthUhthUxt1ZCB9aiOEcCSIdCaQeyihiSyiiS21mjLBpDXFpzbGqDfHqTfIqjjTszrXtzzZuTzlw0DmxEDnxEDpxkHuy0LxzUNZTIHlAAAAD3RSTlMAAh4tMVtig4WRlqvq8v4ZRfBIAAABcElEQVQ4y4VT2ZKCMBBEReTSVhEX8T5BFMVb8/8ftokhJB5b2w9U9VFkMpnRNImSbpiWZRp6SfuGiu0ih2tXPuyy04CChlN+9at1vKFeVf0aVX5Um5Hai+8np470O6fEVxJVIDgQspKBFSGHAMhPKdfhU5/ce8Lv3Sk9+KjzSh0gIQwbEdg8aQI4z/s3MCEcY+6PczpBg/XDRjPLlV2L+a1dTrMmbNpfFyMisGCBRUFHcEuaDsSFsmeBfUFjQNcMIBXCOehHUT84C54ChmYCNyHM+xdCLv254DfA1Cx4xS/DiH2jsBA8WDSggAdUxWJHSPAjVMVkRaoJWuSLYLBrSnRnYTjrqorOGiWxZjWsFYE2ira6wODBAo+BVGz+WAJbfrmtHM1K/twcU3H9qVAcMTBPtI8icGzng1suRo5hWTSQLLlSVYcawVUGrgE+xhrDTAay4avPF6c5ilP6sLc0HjXfF0eunud9X73/l/fP9f8FWPxZz4MGj9YAAAAASUVORK5CYII=
// @run-at       document-end
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_info
// @grant        unsafeWindow
// @connect      nuke.family
// @connect      nuke.test
// @connect      github.com
// @connect      raw.githubusercontent.com
// ==/UserScript==

(() => {
  // src/core/pda-polyfill.js
  var isPda = (() => {
    try {
      const handler = (window.GM_info && window.GM_info.scriptHandler || "").toLowerCase();
      return /com\.manuito\.tornpda/i.test(navigator.userAgent || "") || handler.includes("tornpda") || handler.includes("gmforpda");
    } catch (e) {
      return false;
    }
  })();
  if (isPda && typeof window.GM_xmlhttpRequest === "undefined") {
    ((window2, Object2, DOMException2, AbortController2, Promise2, localStorage2) => {
      const version = 2.2;
      const __GM_info = {
        script: {},
        scriptHandler: `GMforPDA version ${version}`,
        version
      };
      function __GM_getValue(key, defaultValue) {
        if (!key) throw new TypeError("No key supplied to GM_getValue");
        try {
          const r = localStorage2.getItem(key);
          if (typeof r !== "string") return defaultValue;
          if (r.startsWith("GMV2_"))
            return JSON.parse(r.slice(5)) ?? defaultValue;
          else return r ?? defaultValue;
        } catch (e) {
          console.error(e);
          return defaultValue;
        }
      }
      function __GM_setValue(key, value) {
        if (!key) throw new TypeError("No key supplied to GM_setValue");
        localStorage2.setItem(key, "GMV2_" + JSON.stringify(value));
      }
      function __GM_deleteValue(key) {
        if (!key) throw new TypeError("No key supplied to GM_deleteValue");
        localStorage2.removeItem(key);
      }
      function __GM_listValues() {
        return Object2.keys(localStorage2);
      }
      function __GM_addStyle(style) {
        if (!style || typeof style !== "string") return;
        const s = document.createElement("style");
        s.type = "text/css";
        s.innerHTML = style;
        document.head.appendChild(s);
      }
      function __GM_notification(...args) {
        if (typeof args[0] === "object") {
          const { text, title, onclick, ondone } = args[0];
          notify2(text, title, onclick, ondone);
        } else if (typeof args[0] === "string") {
          const [text, title, , onclick] = args;
          notify2(text, title, onclick);
        }
        return { remove: () => {
        } };
        function notify2(text, title, onclick, ondone) {
          if (!text)
            throw new TypeError(
              "No notification text supplied to GM_notification"
            );
          confirm(`${title ?? "No title specified"}
${text}`) && onclick?.();
          ondone?.();
        }
      }
      function __GM_setClipboard(text) {
        if (!text) throw new TypeError("No text supplied to GM_setClipboard");
        navigator.clipboard.writeText(text);
      }
      function __GM_xmlhttpRequest(details) {
        const { abortController } = ___coreXmlHttpRequest(details);
        if (!details || typeof details !== "object")
          throw new TypeError("Invalid details passed to GM_xmlHttpRequest");
        return { abort: () => abortController.abort() };
      }
      const GM = {
        version,
        info: __GM_info,
        addStyle: __GM_addStyle,
        deleteValue: async (key) => __GM_deleteValue(key),
        getValue: async (key, defaultValue) => __GM_getValue(key, defaultValue),
        listValues: async () => __GM_listValues(),
        notification: __GM_notification,
        setClipboard: __GM_setClipboard,
        setValue: async (key, value) => __GM_setValue(key, value),
        xmlHttpRequest: async (details) => {
          if (!details || typeof details !== "object")
            throw new TypeError("Invalid details passed to GM.xmlHttpRequest");
          const { abortController, prom } = ___coreXmlHttpRequest(details);
          prom.abort = () => abortController.abort();
          return prom;
        }
      };
      Object2.entries({
        GM: Object2.freeze(GM),
        GM_info: Object2.freeze(__GM_info),
        GM_getValue: __GM_getValue,
        GM_setValue: __GM_setValue,
        GM_deleteValue: __GM_deleteValue,
        GM_listValues: __GM_listValues,
        GM_addStyle: __GM_addStyle,
        GM_notification: __GM_notification,
        GM_setClipboard: __GM_setClipboard,
        GM_xmlhttpRequest: __GM_xmlhttpRequest,
        unsafeWindow: window2
      }).forEach(([key, value]) => {
        Object2.defineProperty(window2, key, {
          value,
          writable: false,
          enumerable: true,
          configurable: false
        });
      });
      function ___coreXmlHttpRequest(details) {
        const abortController = new AbortController2();
        const abortSignal = abortController.signal;
        const timeoutController = new AbortController2();
        const timeoutSignal = timeoutController.signal;
        const {
          url,
          method,
          headers,
          timeout,
          data,
          onabort,
          onerror,
          onload,
          onloadend,
          onprogress,
          onreadystatechange,
          ontimeout
        } = details;
        setTimeout(() => timeoutController.abort(), timeout ?? 3e4);
        const prom = new Promise2(async (res, rej) => {
          try {
            if (!url) rej("No URL supplied");
            abortSignal.addEventListener("abort", () => rej("Request aborted"));
            timeoutSignal.addEventListener(
              "abort",
              () => rej("Request timed out")
            );
            if (!method || method.toLowerCase() !== "post") {
              PDA_httpGet(url, headers ?? {}).then(res).catch(rej);
              onprogress?.();
            } else {
              PDA_httpPost(url, headers ?? {}, data ?? "").then(res).catch(rej);
              onprogress?.();
            }
          } catch (e) {
            rej(e);
          }
        }).then((r) => {
          onload?.(r);
          onloadend?.(r);
          onreadystatechange?.(r);
          return r;
        }).catch((e) => {
          switch (true) {
            case e === "Request aborted":
              e = new DOMException2("Request aborted", "AbortError");
              if (onabort) return onabort(e);
              else if (onerror) return onerror(e);
              else throw e;
            case e === "Request timed out":
              e = new DOMException2("Request timed out", "TimeoutError");
              if (ontimeout) return ontimeout(e);
              else if (onerror) return onerror(e);
              else throw e;
            case e === "No URL supplied":
              e = new TypeError("Failed to fetch: No URL supplied");
              if (onerror) return onerror(e);
              else throw e;
            default:
              if (!e || !(e instanceof Error))
                e = new Error(e ?? "Unknown Error");
              if (onerror) return onerror(e);
              else throw e;
          }
        });
        return { abortController, prom };
      }
    })(window, Object, DOMException, AbortController, Promise, localStorage);
  }

  // src/styles.css
  var styles_default = `/* Theme-aware CSS variables */
:root {
    --nfh-bg: #1a1a1a;
    --nfh-text: #ffffff;
    --nfh-section-bg: #2a2a2a;
    --nfh-container-bg: #222;
    --nfh-btn-bg: #333;
    --nfh-btn-hover: #444;
    --nfh-border: #444;
    --nfh-list-key: #b0b0b0;
    --nfh-hidden-count: #999;
}

/* Light theme overrides */
body:not(.dark-mode) {
    --nfh-bg: #f5f5f5;
    --nfh-text: #333333;
    --nfh-section-bg: #ffffff;
    --nfh-container-bg: #eaeaea;
    --nfh-btn-bg: #dddddd;
    --nfh-btn-hover: #cccccc;
    --nfh-border: #cccccc;
    --nfh-list-key: #666666;
    --nfh-hidden-count: #666666;
}

.nfh-section {
    margin-top: 10px;
    background-color: var(--nfh-bg);
    border-radius: 5px;
    overflow: hidden;
    font-family: 'Roboto', sans-serif;
}

.nfh-section-title {
    padding: 8px 12px;
    font-weight: 600;
    font-size: 14px;
    background-color: var(--nfh-section-bg);
    color: var(--nfh-text);
}

.nfh-section-container {
    padding: 10px 12px !important;
    background-color: var(--nfh-container-bg);
}

.nfh-section-list {
    list-style-type: none;
    padding-left: 0;
    margin: 0;
}

.nfh-section-list li {
    margin-bottom: 8px;
    padding: 8px 10px 8px 20px;
    background-color: var(--nfh-section-bg);
    border-radius: 3px;
    font-size: 13px;
    line-height: 1.4;
    color: var(--nfh-text);
    position: relative;
}

.nfh-shitlist-entry-profile-container {
  background-color: var(--nfh-container-bg) !important;
  border-bottom: 0px !important;
}

.nfh-section-list li::before {
    content: '\u25B6';
    position: absolute;
    left: 8px;
    top: 11px;
    color: #4caf50;
    font-size: 10px;
}

.nfh-shitlist-profile-list li {
  margin-bottom: 8px;
    padding: 8px 10px 8px 20px;
    background-color: var(--nfh-section-bg);
    border-radius: 3px;
    font-size: 13px;
    line-height: 1.4;
    color: var(--nfh-text);
    position: relative;
}

.nfh-shitlist-profile-list li::before {
    content: '\u25B6';
    position: absolute;
    left: 8px;
    top: 11px;
    color: #4caf50;
    font-size: 10px;
}

.nfh-list-key {
    font-weight: 600;
    color: var(--nfh-list-key);
    display: inline-block;
    width: 100px;
    vertical-align: top;
}

.nfh-list-value {
    display: inline-block;
    width: calc(100% - 105px);
    vertical-align: top;
}

.nfh-shitlist-entry-container {
    border-left: 3px solid #4caf50;
    background-color: var(--nfh-container-bg);
}

.nfh-extra-shitlist-entry-condition {
    font-size: 12px;
    color: #4caf50;
    margin-left: 5px;
}

.nfh-btn {
    background-color: var(--nfh-btn-bg);
    color: var(--nfh-text);
    border: none;
    padding: 6px 10px;
    border-radius: 3px;
    cursor: pointer;
    transition: background-color 0.2s ease;
    font-size: 13px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-top: 8px;
}

.nfh-btn:hover {
    background-color: var(--nfh-btn-hover);
}

.nfh-shitlist-entry-profile-container-friendly {
  border-right: 3px solid #4caf50;
}

.nfh-shitlist-entry-container-friendly {
  background-color: #00ff1466 !important;
  border-left: 0px !important;
}

/* Hospital row highlight styles */
.nfh-hospital-contract {
  background-color: #20b2aa7d !important;
}

.nfh-hospital-friendly {
  background-color: #009d0075 !important;
}

.nfh-hospital-shitlist {
  background-color: #f933337d !important;
}

/* Settings panel styles */
.nfh-shitlist-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: relative;
}

.nfh-settings-cog {
    cursor: pointer;
    color: var(--nfh-text);
    font-size: 16px;
    margin-right: 10px;
    transition: transform 0.3s ease;
}

.nfh-settings-cog:hover {
    color: #4caf50;
    transform: rotate(90deg);
}

.nfh-settings-panel {
    background-color: var(--nfh-section-bg);
    border-radius: 5px;
    padding: 15px;
    border: 1px solid var(--nfh-border);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
    position: fixed;
    z-index: 9999;
    width: 250px;
    right: 20px;
    bottom: 50px;
    max-height: calc(100vh - 100px);
    overflow-y: auto;
    max-width: 95vw;
    display: flex;
    flex-direction: column;
}

.nfh-settings-title {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 10px;
    color: var(--nfh-text);
    border-bottom: 1px solid var(--nfh-border);
    padding-bottom: 5px;
}

.nfh-category-item {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
    padding: 5px;
    border-radius: 3px;
    transition: background-color 0.2s;
}

.nfh-category-item:hover {
    background-color: var(--nfh-btn-bg);
}

.nfh-category-item input[type="checkbox"] {
    margin-right: 8px;
}

.nfh-category-item.faction-locked {
    opacity: 0.8;
    pointer-events: none;
}

.nfh-category-item.faction-locked input[type="checkbox"] {
    cursor: not-allowed;
}

/* A setting the script decides, with the reason on hover and in a note below
   (hover alone does nothing on a phone). Unlike faction-locked it keeps
   pointer events, or the tooltip would never show. */
.nfh-category-item.nfh-setting-locked {
    opacity: 0.8;
    cursor: not-allowed;
}

.nfh-setting-note {
    font-size: 11px;
    color: var(--nfh-hidden-count);
    margin: -4px 0 6px 5px;
    font-style: italic;
}

.nfh-hidden-count {
    font-size: 11px;
    color: var(--nfh-hidden-count);
    margin-top: 5px;
    font-style: italic;
}

.nfh-close-settings {
    background-color: var(--nfh-btn-bg);
    color: var(--nfh-text);
    border: none;
    padding: 5px 10px;
    border-radius: 3px;
    cursor: pointer;
    font-size: 12px;
    margin-top: 10px;
    transition: background-color 0.2s;
    width: 100%;
}

.nfh-close-settings:hover {
    background-color: var(--nfh-btn-hover);
}

/* Chain watch bar (own faction page) */
.nfh-cw {
    --nfh-cw-accent: #4caf50;
    --nfh-cw-warn: #f5a623;
    --nfh-cw-muted: #9a9a9a;
    --nfh-cw-empty: #c0392b;
    clear: both;
    margin-top: 10px;
    border-radius: 5px;
    border-left: 3px solid var(--nfh-border);
    background-color: var(--nfh-section-bg);
    color: var(--nfh-text);
    font-size: 12px;
    line-height: 1.4;
    overflow: hidden;
}

body:not(.dark-mode) .nfh-cw {
    --nfh-cw-accent: #256b29;
    --nfh-cw-warn: #b26a00;
    --nfh-cw-muted: #5c5c5c;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
}

.nfh-cw--in {
    border-left-color: var(--nfh-cw-accent);
}

.nfh-cw--attn {
    border-left-color: var(--nfh-cw-warn);
}

.nfh-cw [hidden] {
    display: none !important;
}

.nfh-cw a {
    color: inherit;
    text-decoration: none;
}

.nfh-cw a:hover {
    text-decoration: underline;
}

.nfh-cw-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 30px;
    padding: 0 8px;
}

.nfh-cw-toggle {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 0;
    border: none;
    background: none;
    color: inherit;
    font: inherit;
    font-weight: 700;
    white-space: nowrap;
    cursor: pointer;
}

.nfh-cw-toggle:disabled {
    cursor: default;
}

.nfh-cw-caret {
    display: inline-block;
    width: 9px;
    color: var(--nfh-cw-muted);
}

.nfh-cw-title,
.nfh-cw-muted {
    color: var(--nfh-cw-muted);
}

.nfh-cw-title {
    max-width: 180px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.nfh-cw-status {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.nfh-cw-status[data-action] {
    cursor: pointer;
}

.nfh-cw--attn .nfh-cw-status {
    color: var(--nfh-cw-warn);
    font-weight: 700;
}

.nfh-cw-need,
.nfh-cw-error {
    color: var(--nfh-cw-warn);
}

.nfh-cw-ok {
    color: var(--nfh-cw-accent);
}

.nfh-cw-actions,
.nfh-cw-detail-actions {
    display: inline-flex;
    align-items: center;
    gap: 6px;
}

.nfh-cw .is-busy {
    opacity: 0.5;
    pointer-events: none;
}

.nfh-cw-btn,
.nfh-cw-chip {
    padding: 3px 9px;
    border: 1px solid var(--nfh-border);
    border-radius: 3px;
    background-color: var(--nfh-btn-bg);
    color: var(--nfh-text);
    font: inherit;
    line-height: 1.3;
    white-space: nowrap;
    cursor: pointer;
}

.nfh-cw-btn:hover,
.nfh-cw-chip:hover {
    background-color: var(--nfh-btn-hover);
}

.nfh-cw-btn--primary {
    border-color: var(--nfh-cw-accent);
    background-color: var(--nfh-cw-accent);
    color: #fff;
    font-weight: 700;
}

.nfh-cw a.nfh-cw-btn--primary {
    color: #fff;
}

.nfh-cw-btn--primary:hover {
    background-color: var(--nfh-cw-accent);
    filter: brightness(1.1);
}

.nfh-cw-chip {
    border-radius: 10px;
    background: none;
    color: var(--nfh-cw-muted);
}

.nfh-cw-chip.is-armed {
    border-color: var(--nfh-cw-accent);
    color: var(--nfh-cw-accent);
}

.nfh-cw-picker,
.nfh-cw-settings select,
.nfh-cw-input {
    padding: 2px 4px;
    border: 1px solid var(--nfh-border);
    border-radius: 3px;
    background-color: var(--nfh-container-bg);
    color: var(--nfh-text);
    font: inherit;
}

.nfh-cw-picker {
    max-width: 180px;
}

.nfh-cw-settings,
.nfh-cw-panel {
    padding: 8px 10px;
    border-top: 1px solid var(--nfh-border);
    background-color: var(--nfh-container-bg);
}

.nfh-cw-settings-row,
.nfh-cw-footer {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 14px;
}

.nfh-cw-settings label,
.nfh-cw-footer label {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    white-space: nowrap;
}

.nfh-cw-settings input[type="range"] {
    width: 80px;
}

.nfh-cw-settings input[type="color"] {
    width: 26px;
    height: 20px;
    padding: 0;
    border: 1px solid var(--nfh-border);
    background: none;
}

.nfh-cw-time {
    width: 36px;
    text-align: center;
}

.nfh-cw-input.is-invalid {
    border-color: var(--nfh-cw-empty);
}

.nfh-cw-settings .nfh-cw-need,
.nfh-cw-help {
    margin-top: 6px;
}

.nfh-cw-section + .nfh-cw-section {
    margin-top: 10px;
}

.nfh-cw-heading {
    margin-bottom: 4px;
    font-weight: 700;
}

.nfh-cw-heading .nfh-cw-muted {
    margin-left: 6px;
    font-weight: 400;
}

.nfh-cw-roster-row {
    display: flex;
    align-items: baseline;
    gap: 8px;
    padding: 2px 0;
}

.nfh-cw-roster-when {
    width: 52px;
    color: var(--nfh-cw-muted);
}

.nfh-cw-roster-row.is-now .nfh-cw-roster-when {
    color: var(--nfh-cw-accent);
    font-weight: 700;
}

.nfh-cw-roster-time {
    width: 62px;
    font-variant-numeric: tabular-nums;
}

.nfh-cw-people {
    display: flex;
    flex: 1;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 12px;
}

.nfh-cw-person {
    display: inline-flex;
    align-items: center;
    gap: 5px;
}

.nfh-cw-person::before {
    content: "";
    width: 6px;
    height: 6px;
    border: 1px solid var(--nfh-cw-muted);
    border-radius: 50%;
}

.nfh-cw-person--plain::before {
    content: none;
}

.nfh-cw-person.is-present::before {
    border-color: var(--nfh-cw-accent);
    background-color: var(--nfh-cw-accent);
}

.nfh-cw-person.is-me > a,
.nfh-cw-person.is-me > span:first-child {
    font-weight: 700;
}

.nfh-cw-person .nfh-cw-btn {
    padding: 0 6px;
    font-size: 11px;
}

.nfh-cw-tag {
    padding: 0 5px;
    border-radius: 3px;
    background-color: var(--nfh-btn-bg);
    font-size: 11px;
}

.nfh-cw-tag--scheduled {
    color: var(--nfh-cw-accent);
}

.nfh-cw-tag--past_slot {
    color: var(--nfh-cw-warn);
}

.nfh-cw-staff {
    margin-top: 6px;
}

.nfh-cw-search {
    width: 280px;
    max-width: 100%;
    margin-bottom: 4px;
}

.nfh-cw-mine {
    margin-bottom: 6px;
}

.nfh-cw-day {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin-bottom: 4px;
}

.nfh-cw-day-label {
    width: 70px;
    padding-top: 6px;
    color: var(--nfh-cw-muted);
    white-space: nowrap;
}

.nfh-cw-grid {
    display: flex;
    flex: 1;
    flex-wrap: wrap;
    gap: 4px;
}

.nfh-cw-slot {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 34px;
    padding: 2px 0;
    border: 1px solid var(--nfh-border);
    border-radius: 4px;
    background-color: var(--nfh-section-bg);
    color: var(--nfh-text);
    font: inherit;
    line-height: 1.2;
    cursor: pointer;
}

.nfh-cw-slot-hour {
    font-weight: 700;
}

.nfh-cw-slot-fill {
    font-size: 10px;
    color: var(--nfh-cw-muted);
}

/* Fill level is carried by the count: open paid spots stand out, a full
   hour fades back. */
.nfh-cw-slot--empty .nfh-cw-slot-fill,
.nfh-cw-slot--short .nfh-cw-slot-fill {
    color: var(--nfh-cw-warn);
}

.nfh-cw-slot--full {
    opacity: 0.6;
}

.nfh-cw-slot.is-now {
    border-color: var(--nfh-cw-muted);
}

.nfh-cw-slot.is-mine {
    border-color: var(--nfh-cw-accent);
    background-color: var(--nfh-cw-accent);
    color: #fff;
    opacity: 1;
}

.nfh-cw-slot.is-mine .nfh-cw-slot-fill {
    color: #fff;
}

.nfh-cw-slot.is-selected {
    box-shadow: 0 0 0 2px var(--nfh-text);
}

.nfh-cw-slot:hover {
    border-color: var(--nfh-text);
}

.nfh-cw-detail {
    margin-top: 6px;
    padding: 6px 8px;
    border-radius: 4px;
    background-color: var(--nfh-section-bg);
}

.nfh-cw-detail > div + div {
    margin-top: 4px;
}

.nfh-cw-footer {
    margin-top: 10px;
    padding-top: 8px;
    border-top: 1px solid var(--nfh-border);
}

.nfh-cw-link {
    margin-left: auto;
    color: var(--nfh-cw-muted) !important;
}

/* Chain timer alert: click-through flash over the whole page */
#nfh-chain-flash {
    position: fixed;
    inset: 0;
    z-index: 99999;
    pointer-events: none;
    animation: nfh-chain-flash 2s steps(1, end) infinite;
}

@keyframes nfh-chain-flash {
    0% { opacity: 1; }
    50% { opacity: 0; }
}

/* Territory war walls: who not to hit, and who to hit */
body.nfh-mark-wall .faction-war .members-list .your .user.name {
    text-decoration: line-through !important;
    cursor: not-allowed !important;
}

body.nfh-mark-wall .faction-war .members-list .enemy .user.name {
    color: #e53935 !important;
}

body.nfh-mark-wall .faction-war .members-list .enemy .attack a {
    display: inline-block;
    animation: nfh-wall-ring 4s 0.7s ease-in-out infinite;
}

@keyframes nfh-wall-ring {
    0%, 39%, 100% { transform: rotate(0); }
    2% { transform: rotate(15deg); }
    6% { transform: rotate(-15deg); color: #e53935; }
    10% { transform: rotate(13deg); }
    14% { transform: rotate(-12deg); }
    18% { transform: rotate(10deg); }
    22% { transform: rotate(-8deg); }
    26% { transform: rotate(6deg); }
    30% { transform: rotate(-4deg); }
    34% { transform: rotate(2deg); }
}

@media (prefers-reduced-motion: reduce) {
    body.nfh-mark-wall .faction-war .members-list .enemy .attack a {
        animation: none;
    }
}

/* ---- Ranked war board (own faction's ranked war view) ---- */

.nfh-war-bar {
    margin-top: 0;
    margin-bottom: 10px;
}

.nfh-war-bar .nfh-cw-bar {
    flex-wrap: wrap;
    padding-top: 4px;
    padding-bottom: 4px;
}

.nfh-war-bar label {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    cursor: pointer;
}

.nfh-war-bar .nfh-cw-status {
    text-align: right;
}

/* The status cell's own text stays in the DOM (Torn keeps rewriting it); ours
   is drawn over it from an attribute, so the two never fight. */
.faction-war .members-list [data-nfh-war] {
    position: relative !important;
    color: transparent !important;
}

.faction-war .members-list [data-nfh-war]::after {
    content: attr(data-nfh-war);
    position: absolute;
    top: 0;
    left: 0;
    width: calc(100% - 10px);
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
    color: var(--user-status-red-color, #d83500);
}

.faction-war .members-list [data-nfh-war][data-nfh-war-tone="travel"]::after {
    color: var(--user-status-blue-color, #2f7fb5);
}

.faction-war .members-list li[data-nfh-war-row="soon"] {
    background-color: rgba(76, 175, 80, 0.3) !important;
}

.faction-war .members-list li[data-nfh-war-row="out"] {
    background-color: rgba(255, 152, 0, 0.32) !important;
}

.faction-war .members-list [data-nfh-war-stats] {
    position: relative !important;
}

.faction-war .members-list [data-nfh-war-stats]::after {
    content: attr(data-nfh-war-stats);
    position: absolute;
    right: 6px;
    top: 50%;
    transform: translateY(-50%);
    padding: 0 4px;
    border-radius: 3px;
    background-color: rgba(0, 0, 0, 0.45);
    color: #fff;
    font-size: 10px;
    line-height: 15px;
    pointer-events: none;
}

/* ---- OC Assistant (faction crimes page) ---- */

.nfh-oc-bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 10px;
    margin-bottom: 10px;
    padding: 8px 10px;
    border-left: 3px solid #7b3fb5;
    border-radius: 5px;
    background-color: var(--nfh-section-bg);
    color: var(--nfh-text);
    font-size: 13px;
    line-height: 1.4;
}

.nfh-oc-bar-label {
    flex: none;
    padding: 1px 6px;
    border-radius: 3px;
    background-color: #6a1b9a;
    color: #ffffff;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.03em;
}

.nfh-oc-bar-text {
    flex: 1 1 260px;
}

.nfh-oc-bar-muted {
    color: var(--nfh-list-key);
}

.nfh-oc-bar-button {
    flex: none;
    padding: 4px 10px;
    border: 1px solid var(--nfh-border);
    border-radius: 3px;
    background-color: var(--nfh-btn-bg);
    color: var(--nfh-text);
    font: inherit;
    font-weight: 600;
    cursor: pointer;
}

.nfh-oc-bar-button:hover {
    background-color: var(--nfh-btn-hover);
}

/* "Min CPR 63" under a slot's header */
.nfh-oc-min {
    padding: 0 4px;
    color: #ffffff;
    font-size: 10px;
    font-weight: 700;
    line-height: 14px;
    text-align: center;
    white-space: nowrap;
}

.nfh-oc-min--ok {
    background-color: #2e7d32;
}

.nfh-oc-min--below {
    background-color: #c62828;
}

.nfh-oc-min--filled,
.nfh-oc-min--weight {
    background-color: #5f6368;
}

/* The " \xB7 13.5%" after a minimum: there, but quieter than the minimum */
.nfh-oc-min-weight {
    font-weight: 400;
    opacity: 0.85;
}

/* Suggested slots */
.nfh-oc-pick {
    position: relative;
    border-radius: 5px;
}

.nfh-oc-pick--best {
    box-shadow: 0 0 0 2px #9c4dcc;
}

.nfh-oc-pick--good {
    box-shadow: 0 0 0 2px #1976d2;
}

.nfh-oc-tag {
    padding: 2px 6px;
    border-radius: 3px 3px 0 0;
    color: #ffffff;
    font-size: 11px;
    font-weight: 700;
    line-height: 15px;
    text-align: center;
}

.nfh-oc-pick--best > .nfh-oc-tag {
    background-color: #6a1b9a;
}

.nfh-oc-pick--good > .nfh-oc-tag {
    background-color: #1565c0;
}

/* Debug info dialog (faction controls page) */
.nfh-debug-overlay {
    position: fixed;
    inset: 0;
    z-index: 100000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 12px;
    background-color: rgba(0, 0, 0, 0.7);
}

.nfh-debug-dialog {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 640px;
    max-width: 100%;
    max-height: 100%;
    padding: 14px;
    border: 1px solid var(--nfh-border);
    border-radius: 6px;
    background-color: var(--nfh-section-bg);
    color: var(--nfh-text);
}

.nfh-debug-title {
    font-size: 15px;
    font-weight: 700;
}

.nfh-debug-note {
    margin: 0;
    color: var(--nfh-list-key);
}

.nfh-debug-text {
    box-sizing: border-box;
    width: 100%;
    height: 320px;
    max-height: 60vh;
    padding: 6px;
    border: 1px solid var(--nfh-border);
    border-radius: 4px;
    background-color: var(--nfh-bg);
    color: var(--nfh-text);
    font-family: monospace;
    font-size: 12px;
    resize: vertical;
}

.nfh-debug-sent {
    font-weight: 700;
}

.nfh-debug-reference {
    width: 90px;
    padding: 3px 6px;
    border: 1px solid var(--nfh-border);
    border-radius: 4px;
    background-color: var(--nfh-bg) !important;
    color: var(--nfh-text) !important;
    -webkit-text-fill-color: var(--nfh-text);
    opacity: 1;
    font-family: monospace;
    font-size: 15px;
    font-weight: 700;
    letter-spacing: 1px;
    text-align: center;
}

.nfh-debug-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
}

.nfh-debug-status {
    margin-right: auto;
    color: var(--nfh-list-key);
}

/* What is wrong with a suggested slot, under its tag's text */
.nfh-oc-tag > .nfh-oc-flag {
    margin: 2px -6px -2px;
}

/* Staff flags under a filled slot: one colour and one symbol per kind */
.nfh-oc-flags {
    display: flex;
    flex-direction: column;
}

.nfh-oc-flag {
    display: block;
    padding: 0 4px;
    color: #ffffff;
    font-size: 10px;
    font-weight: 700;
    line-height: 14px;
    text-align: center;
    white-space: nowrap;
}

.nfh-oc-flag--unqualified {
    background-color: #b71c1c;
}

.nfh-oc-flag--unproductive {
    background-color: #8a5300;
}

.nfh-oc-flag--underlevel {
    background-color: #1565c0;
}

.nfh-oc-bar-warning {
    color: #c62828;
}

body.dark-mode .nfh-oc-bar-warning {
    color: #ff8a80;
}

.nfh-oc-staff {
    flex: 1 1 100%;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    padding-top: 6px;
    border-top: 1px solid var(--nfh-border);
}

.nfh-oc-bar-label + .nfh-oc-staff {
    flex: 1 1 260px;
    padding-top: 0;
    border-top: none;
}

.nfh-oc-staff-panel {
    flex: 1 1 100%;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.nfh-oc-settings-group {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 14px;
}

.nfh-oc-settings-group + .nfh-oc-settings-group {
    padding-top: 8px;
    border-top: 1px solid var(--nfh-border);
}

.nfh-oc-settings-heading {
    flex: 1 1 100%;
    font-weight: 700;
}

.nfh-oc-link-button {
    padding: 0;
    border: none;
    background: none;
    color: inherit;
    font: inherit;
    text-decoration: underline;
    cursor: pointer;
}

.nfh-oc-staff-option {
    display: inline-flex;
    align-items: center;
    gap: 5px;
}

.nfh-oc-staff-option .nfh-oc-flag {
    border-radius: 3px;
}

.nfh-oc-staff-number {
    width: 52px;
    padding: 2px 4px;
    border: 1px solid var(--nfh-border);
    border-radius: 3px;
    background-color: var(--nfh-bg);
    color: var(--nfh-text);
    font: inherit;
}

.nfh-oc-spawn {
    flex: 1 1 100%;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
}

.nfh-oc-bar-button:disabled {
    opacity: 0.6;
    cursor: default;
}

/* Connection banner and notes (features/connect.js) */
.nfh-connect-banner {
    position: relative;
    z-index: 99999;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 6px 10px;
    padding: 8px 34px 8px 12px;
    border-bottom: 2px solid #b26a00;
    background-color: #3a2a08;
    color: #ffe2a8;
    font-size: 13px;
    line-height: 1.4;
    text-align: center;
}

body:not(.dark-mode) .nfh-connect-banner {
    background-color: #fff3d6;
    color: #5a3b00;
}

.nfh-connect-banner--ok,
body:not(.dark-mode) .nfh-connect-banner--ok {
    border-bottom-color: #2e7d32;
    background-color: #173a1a;
    color: #d5f5d7;
}

.nfh-connect-text {
    flex: 0 1 auto;
}

.nfh-connect-error {
    display: block;
    font-weight: bold;
}

.nfh-connect-banner .torn-btn,
.nfh-connect-banner a.torn-btn {
    flex: 0 0 auto;
    text-decoration: none;
}

.nfh-connect-manual,
.nfh-connect-note-link {
    padding: 0;
    border: 0;
    background: none;
    color: inherit;
    font: inherit;
    text-decoration: underline;
    cursor: pointer;
}

.nfh-connect-dismiss {
    position: absolute;
    top: 4px;
    right: 8px;
    padding: 0 4px;
    border: 0;
    background: none;
    color: inherit;
    font-size: 20px;
    line-height: 1;
    cursor: pointer;
}

.nfh-connect-note {
    margin: 6px 0;
    padding: 6px 10px;
    border-left: 3px solid #b26a00;
    border-radius: 3px;
    background-color: var(--nfh-section-bg);
    color: var(--nfh-text);
    font-size: 12px;
    line-height: 1.4;
}

/* Retal list under Torn's recent attacks (shares the chain watch bar's look) */
.nfh-rt {
    margin-top: 6px;
    border-left-color: var(--nfh-cw-warn);
    /* Torn's chain box uses a narrow display font, which has no real bold
       (Firefox fakes one); use the page font the chain watch bar uses. */
    font-family: Arial, Helvetica, sans-serif;
}

.nfh-rt[hidden] {
    display: none;
}

.nfh-rt-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 4px 10px;
}

.nfh-rt [data-region][hidden] {
    display: none;
}

.nfh-rt-settings {
    border-top: 1px solid var(--nfh-border);
}

.nfh-rt-settings input[type="range"] {
    width: 90px;
    vertical-align: middle;
}

.nfh-rt-who {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    position: relative;
}

/* BSP's cached estimate, for an enemy whose row BSP never drew: neutral,
   since BSP colours its own tag against the member's stats. */
.nfh-rt-bsp {
    padding: 0 4px;
    border: 1px solid var(--nfh-border);
    border-radius: 3px;
    color: var(--nfh-text);
    font-size: 11px;
    line-height: 1.4;
}

.nfh-rt-toast {
    font-family: Arial, Helvetica, sans-serif;
    position: fixed;
    left: 16px;
    bottom: 16px;
    z-index: 999999;
    display: flex;
    align-items: center;
    gap: 10px;
    max-width: min(420px, calc(100vw - 32px));
    padding: 8px 10px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.35);
}

/* Where the member put the notice (retal settings). Bottom left is the default. */
.nfh-rt-toast--bottom-right,
.nfh-rt-toast--middle-right,
.nfh-rt-toast--top-right {
    left: auto;
    right: 16px;
}

.nfh-rt-toast--top-left,
.nfh-rt-toast--top-center,
.nfh-rt-toast--top-right {
    bottom: auto;
    top: 16px;
}

.nfh-rt-toast--middle-left,
.nfh-rt-toast--middle-right {
    bottom: auto;
    top: 50%;
    transform: translateY(-50%);
}

.nfh-rt-toast--bottom-center,
.nfh-rt-toast--top-center {
    left: 50%;
    transform: translateX(-50%);
}

.nfh-rt-toast-text {
    flex: 1 1 auto;
    min-width: 0;
}

.nfh-rt-toast .nfh-rt-muted {
    margin-left: 4px;
}

.nfh-rt-title {
    font-weight: 700;
}

.nfh-rt-muted,
.nfh-rt-held {
    color: var(--nfh-cw-muted);
}

.nfh-rt-held.is-mine {
    color: var(--nfh-cw-accent);
    font-weight: 700;
}

.nfh-rt-list {
    margin: 0;
    padding: 0;
    list-style: none;
}

.nfh-rt-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 10px;
    padding: 4px 10px;
    border-top: 1px solid var(--nfh-border);
}

.nfh-rt-main {
    flex: 1 1 160px;
    min-width: 0;
}

.nfh-rt .nfh-rt-name {
    font-weight: 700;
}

.nfh-rt-tag {
    color: var(--nfh-cw-muted);
    font-size: 11px;
}

.nfh-rt-left {
    font-variant-numeric: tabular-nums;
    font-weight: 700;
}

.nfh-rt-row.is-ending .nfh-rt-left {
    color: var(--nfh-cw-warn);
}

.nfh-rt-actions {
    display: inline-flex;
    gap: 6px;
}

.nfh-rt .nfh-rt-attack,
.nfh-rt .nfh-rt-attack:hover {
    color: #fff;
    text-decoration: none;
}

.nfh-rt-row.is-done {
    opacity: 0.7;
}

.nfh-rt-row.is-taken .nfh-rt-attack {
    border-color: var(--nfh-border);
    background-color: var(--nfh-btn-bg);
    color: var(--nfh-text);
    font-weight: 400;
}

.nfh-rt-warn,
.nfh-rt-error {
    flex-basis: 100%;
    color: var(--nfh-cw-warn);
}

.nfh-rt-error {
    padding: 3px 10px 5px;
}

.nfh-rt-warn .nfh-cw-btn {
    margin-left: 6px;
    text-decoration: none;
}

.nfh-rt-settings .nfh-cw-settings-row + .nfh-cw-settings-row {
    margin-top: 6px;
}

/* Mail templates bar (compose page and faction newsletter) */
.nfh-mt {
    margin: 0 0 10px;
}

.nfh-mt-bar {
    flex-wrap: wrap;
    padding: 4px 8px;
}

.nfh-mt-title {
    font-weight: 700;
}

.nfh-mt-pins {
    display: flex;
    flex: 1 1 200px;
    flex-wrap: wrap;
    gap: 4px;
    min-width: 0;
}

.nfh-mt-chip {
    max-width: 180px;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--nfh-text);
}

.nfh-mt-badge {
    display: inline-block;
    margin-right: 4px;
    padding: 0 4px;
    border-radius: 3px;
    background-color: var(--nfh-cw-accent);
    color: #fff;
    font-size: 10px;
    font-weight: 700;
}

.nfh-mt-message,
.nfh-mt-confirm,
.nfh-mt-form,
.nfh-mt-help,
.nfh-mt-all {
    padding: 6px 8px;
    border-top: 1px solid var(--nfh-border);
}

.nfh-mt-confirm,
.nfh-mt-form {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
}

.nfh-mt-form input[type="text"] {
    flex: 1 1 160px;
    min-width: 0;
}

.nfh-mt-note {
    flex-basis: 100%;
}

.nfh-mt-message--ok {
    color: var(--nfh-cw-accent);
}

.nfh-mt-message--warn,
.nfh-mt-message--error {
    color: var(--nfh-cw-warn);
    font-weight: 700;
}

.nfh-mt-help ul {
    margin: 4px 0 4px 18px;
    padding: 0;
    list-style: disc;
}

.nfh-mt-help code,
.nfh-mt-help li code {
    font-family: Consolas, monospace;
    font-weight: 700;
}

.nfh-mt-search {
    width: 100%;
    margin-bottom: 6px;
    box-sizing: border-box;
}

.nfh-mt-heading {
    margin: 6px 0 2px;
    font-weight: 700;
}

.nfh-mt-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    padding: 3px 0;
    border-bottom: 1px dotted var(--nfh-border);
}

.nfh-mt-name {
    flex: 1 1 140px;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.nfh-mt-scope {
    white-space: nowrap;
}

.nfh-mt-foot {
    margin-top: 6px;
    text-align: right;
}

/* OC items panel (own faction's crimes and armoury pages) */
.nfh-oci {
    margin: 0 0 10px;
}

.nfh-oci-body {
    padding: 4px 8px 8px;
    border-top: 1px solid var(--nfh-border);
}

.nfh-oci-mine {
    margin: 4px 0;
    color: var(--nfh-cw-warn);
}

.nfh-oci-mine .nfh-cw-muted {
    color: var(--nfh-cw-muted);
}

.nfh-oci-mine a {
    text-decoration: underline;
}

.nfh-oci-heading {
    margin: 6px 0 2px;
    font-weight: 700;
}

.nfh-oci-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 8px;
    padding: 3px 0;
    border-bottom: 1px dotted var(--nfh-border);
}

.nfh-oci-who {
    flex: 0 0 120px;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.nfh-oci-what {
    flex: 1 1 180px;
    min-width: 0;
}

.nfh-oci-foot {
    margin-top: 6px;
}

.nfh-oci-message {
    margin: 4px 0;
    font-weight: 700;
}

.nfh-oci-message--ok {
    color: var(--nfh-cw-accent);
}

.nfh-oci-message--error {
    color: var(--nfh-cw-warn);
}

/* Marks on Torn's armoury rows */
li.nfh-oci-row--need {
    box-shadow: inset 3px 0 0 #4caf50;
}

li.nfh-oci-row--retrieve {
    box-shadow: inset 3px 0 0 #f5a623;
}

.nfh-oci-badge {
    display: inline-block;
    margin-right: 5px;
    padding: 0 5px;
    border-radius: 3px;
    color: #fff;
    font-size: 10px;
    font-weight: 700;
    line-height: 16px;
    vertical-align: middle;
}

.nfh-oci-badge--need {
    background-color: #2e7d32;
}

.nfh-oci-badge--retrieve {
    background-color: #a65d00;
}

.nfh-oci-fill {
    clear: both;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px;
    margin: 6px 0 0;
    padding: 4px 6px;
    border-left: none;
}

/* Kick risk on the faction controls Members list */
.nfh-kr-badge {
    margin-left: 6px;
    padding: 0 6px;
    border: 1px solid transparent;
    border-radius: 9px;
    background: none;
    font: 700 11px/16px Arial, Helvetica, sans-serif;
    white-space: nowrap;
    cursor: pointer;
}

.nfh-kr-badge--low {
    width: 8px;
    height: 8px;
    padding: 0;
    border-radius: 50%;
    background-color: #7a7a7a;
    vertical-align: middle;
}

.nfh-kr-badge--elevated {
    border-color: #4a90c2;
    color: #2b6f9e;
}

body.dark-mode .nfh-kr-badge--elevated {
    color: #8cc4ec;
}

.nfh-kr-badge--moderate {
    background-color: #b26a00;
    color: #fff;
}

.nfh-kr-badge--high {
    background-color: #c0392b;
    color: #fff;
}

.nfh-kr-detail,
.nfh-kr-kick {
    margin: 4px 8px 8px;
    padding: 6px 8px;
}

.nfh-kr-detail-head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 10px;
}

.nfh-kr-detail-links {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-left: auto;
}

.nfh-kr-stats,
.nfh-kr-missed {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 16px;
    margin-top: 4px;
}

.nfh-kr-stat--below strong {
    color: var(--nfh-cw-warn);
}

.nfh-kr-change--down {
    color: var(--nfh-cw-warn);
    font-weight: 700;
}

.nfh-kr-change--up {
    color: var(--nfh-cw-accent);
    font-weight: 700;
}

.nfh-kr-kick {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 10px;
}

.nfh-kr-reason {
    flex: 1 1 260px;
    min-width: 0;
}

.nfh-kr-offer {
    margin: 0 0 10px;
}

.nfh-kr-offer-body {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 8px;
}

.nfh-kr-offer-body textarea {
    width: 100%;
    box-sizing: border-box;
    resize: vertical;
}

.nfh-kr-return {
    position: fixed;
    top: 12px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 999998;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    max-width: calc(100vw - 32px);
    margin: 0;
    padding: 6px 10px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.35);
}

.nfh-kr-slot {
    outline: 3px solid #f5a623;
    outline-offset: 2px;
    box-shadow: 0 0 12px rgba(245, 166, 35, 0.8);
}

.nfh-kr-find-note {
    flex-basis: 100%;
    color: var(--nfh-cw-warn);
    font-weight: 700;
}

/* Stock signals on Torn's stock market */
.nfh-st-bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 12px;
    margin: 0 0 8px;
    padding: 6px 8px;
}

.nfh-st-lines {
    flex: 1 1 300px;
    min-width: 0;
}

.nfh-st-tags {
    display: inline-flex;
    flex-wrap: wrap;
    gap: 3px;
    margin-left: 6px;
    vertical-align: middle;
}

.nfh-st-tag,
.nfh-st-lot {
    display: inline-block;
    padding: 0 5px;
    border-radius: 3px;
    font: 700 10px/16px Arial, Helvetica, sans-serif;
    white-space: nowrap;
}

.nfh-st-tag--buy {
    background-color: #2e7d32;
    color: #fff;
}

.nfh-st-tag--sell,
.nfh-st-lot--sell {
    background-color: #c0392b;
    color: #fff;
}

.nfh-st-tag--hold,
.nfh-st-lot--hold,
.nfh-st-lot--other {
    border: 1px solid var(--nfh-border);
    color: var(--nfh-text);
    font-weight: 400;
}

.nfh-st-lotline {
    padding: 2px 8px 4px;
    line-height: 16px;
}

.nfh-st-advice {
    margin: 6px 8px;
    padding: 6px 8px;
}

.nfh-st-buy strong {
    color: var(--nfh-cw-accent);
}

.nfh-st-sell strong {
    color: #c0392b;
}

body.dark-mode .nfh-st-sell strong {
    color: #ff7b6b;
}

ul.nfh-st-row--sell,
ul.nfh-st-row--sell + .nfh-st-lotline {
    box-shadow: inset 3px 0 0 #c0392b;
}

/* Torn's armoury sub-tab the OC items panel sent the member to */
a.ui-tabs-anchor.nfh-oci-tab-hint {
    outline: 2px solid #4caf50;
    outline-offset: -2px;
    animation: nfh-oci-pulse 1.2s ease-in-out 3;
}

@keyframes nfh-oci-pulse {
    50% {
        outline-color: transparent;
    }
}

/* OC fines (features/oc-fines): profile box, shared form, crimes-page modal,
   unpaid banner, and the mail bar's recent fines. */
.nfh-ocf-open {
    cursor: pointer;
    width: 100%;
    padding: 5px 8px;
    border-radius: 5px;
    border: 1px solid var(--nfh-border, #444);
    background: var(--nfh-btn-bg, #333);
    color: inherit;
}

.nfh-ocf-open:hover {
    background: var(--nfh-btn-hover, #444);
}

.nfh-ocf-form {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-top: 6px;
    font-size: 12px;
    color: var(--nfh-text);
}

.nfh-ocf-field {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.nfh-ocf-field > span {
    color: var(--nfh-list-key);
}

.nfh-ocf-field select,
.nfh-ocf-field textarea {
    width: 100%;
    box-sizing: border-box;
}

.nfh-ocf-quote {
    padding: 4px 6px;
    border-left: 3px solid #3b82f6;
    background: var(--nfh-section-bg);
}

.nfh-ocf-error {
    color: #e5484d;
}

.nfh-ocf-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
}

.nfh-ocf-record ul {
    margin: 4px 0 0;
    padding-left: 16px;
    list-style: disc;
}

.nfh-ocf-flag-btn {
    cursor: pointer;
    border: 1px solid var(--nfh-border, #444);
    background: var(--nfh-btn-bg, #333);
    color: var(--nfh-text);
}

.nfh-ocf-modal {
    position: fixed;
    right: 16px;
    top: 50%;
    transform: translateY(-50%);
    z-index: 100000;
    width: min(360px, calc(100vw - 32px));
    max-height: calc(100vh - 32px);
    overflow-y: auto;
    padding: 8px 10px 10px;
    border: 1px solid var(--nfh-border, #444);
    border-radius: 6px;
    background: var(--nfh-container-bg, #222);
    color: var(--nfh-text);
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.45);
}

.nfh-ocf-modal--placed {
    right: auto;
    transform: none;
}

.nfh-ocf-modal__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: -8px -10px 0;
    padding: 8px 10px 4px;
    cursor: move;
    touch-action: none;
    user-select: none;
}

.nfh-ocf-modal__head button,
.nfh-ocf-banner button {
    cursor: pointer;
    border: 0;
    background: transparent;
    color: inherit;
    font-size: 14px;
}

.nfh-ocf-banner {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin: 0 0 8px;
    padding: 6px 10px;
    border-radius: 5px;
    border: 1px solid #e5484d;
    background: var(--nfh-section-bg);
    color: var(--nfh-text);
    font-size: 12px;
}

.nfh-ocf-banner__how {
    color: var(--nfh-list-key);
    white-space: pre-line;
}

.nfh-ocf-banner button {
    margin-left: auto;
}

.nfh-mt-fines {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px;
    margin-top: 4px;
}

.nfh-mt-chip--fine {
    border-color: #e5484d;
}

.nfh-mt-chip--match {
    font-weight: bold;
}
`;

  // src/core/storage.js
  var MANAGER_KEYS = ["apiToken", "apiTokenFirstTime", "nfhTokenReturnUrl", "nfhConnectPending"];
  var LOCAL_KEYS = [
    "hiddenShitlistCategories",
    "nfhShowReputation",
    "nfhShowActiveContract",
    "nfhChainWatch",
    "nfhRetals",
    "nfhRankedWar",
    "nfhOcStaffPrefs",
    "nfhOcWeights",
    "nfhOcItemShow",
    "nfhOcFinePanel"
  ];
  var UNSAVED_KEY = "nfhNativeStorageUnsaved";
  var LOAD_TIMEOUT_MS = 3e3;
  var native = null;
  var mirror = {};
  var info = { backend: "default", present: false, migrated: [], restored: [], error: null, write_error: null };
  function nativeStore() {
    try {
      const store = typeof PDA_storage !== "undefined" ? PDA_storage : null;
      return store && typeof store.loadAll === "function" && typeof store.setMany === "function" ? store : null;
    } catch (e) {
      return null;
    }
  }
  function hasNativeStorage() {
    return nativeStore() !== null;
  }
  function isManagerKey(key) {
    return MANAGER_KEYS.includes(key);
  }
  function legacyRead(key) {
    try {
      if (isManagerKey(key)) return GM_getValue(key, void 0);
      const value = localStorage.getItem(key);
      return value === null ? void 0 : value;
    } catch (e) {
      return void 0;
    }
  }
  function legacyWrite(key, value) {
    try {
      if (isManagerKey(key)) GM_setValue(key, value);
      else localStorage.setItem(key, value);
    } catch (e) {
    }
  }
  function unsavedKeys() {
    try {
      const keys = JSON.parse(localStorage.getItem(UNSAVED_KEY) || "[]");
      return Array.isArray(keys) ? keys : [];
    } catch (e) {
      return [];
    }
  }
  function setUnsaved(keys) {
    try {
      if (keys.length === 0) localStorage.removeItem(UNSAVED_KEY);
      else localStorage.setItem(UNSAVED_KEY, JSON.stringify(keys));
    } catch (e) {
    }
  }
  function push(pairs) {
    const keys = Object.keys(pairs);
    if (!native || keys.length === 0) return Promise.resolve();
    setUnsaved([.../* @__PURE__ */ new Set([...unsavedKeys(), ...keys])]);
    return Promise.resolve().then(() => native.setMany(pairs)).then(() => {
      setUnsaved(unsavedKeys().filter((key) => !keys.includes(key)));
      info.write_error = null;
    }).catch((error) => {
      info.write_error = String(error && (error.code || error.message) || error);
    });
  }
  function withTimeout(promise, ms) {
    return new Promise((resolve, reject) => {
      const timer3 = setTimeout(() => reject(new Error("timed out")), ms);
      Promise.resolve(promise).then(
        (value) => {
          clearTimeout(timer3);
          resolve(value);
        },
        (error) => {
          clearTimeout(timer3);
          reject(error);
        }
      );
    });
  }
  var same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  async function initStorage({ migrate = true } = {}) {
    const store = nativeStore();
    info.present = store !== null;
    if (!store) return;
    let stored;
    try {
      stored = await withTimeout(store.loadAll(), LOAD_TIMEOUT_MS) || {};
    } catch (error) {
      info.error = String(error && error.message || error);
      return;
    }
    native = store;
    mirror = {};
    info.backend = "pda_storage";
    const unsaved = migrate ? unsavedKeys() : [];
    const toPush = {};
    for (const key of [...MANAGER_KEYS, ...LOCAL_KEYS]) {
      const inApp = stored[key] !== void 0 && stored[key] !== null;
      const old = migrate ? legacyRead(key) : void 0;
      if (old !== void 0 && (!inApp || unsaved.includes(key))) {
        mirror[key] = old;
        if (!inApp || !same(stored[key], old)) {
          toPush[key] = old;
          info.migrated.push(key);
        }
      } else if (inApp) {
        mirror[key] = stored[key];
        if (migrate && !same(old, stored[key])) {
          legacyWrite(key, stored[key]);
          info.restored.push(key);
        }
      }
    }
    if (Object.keys(toPush).length > 0) await push(toPush);
    else if (unsaved.length > 0) setUnsaved([]);
  }
  function read(key, fallback) {
    if (native) return key in mirror ? mirror[key] : fallback;
    const value = legacyRead(key);
    return value === void 0 ? fallback : value;
  }
  function write(key, value) {
    legacyWrite(key, value);
    if (native) {
      mirror[key] = value;
      push({ [key]: value });
    }
  }
  function getValue(key, fallback) {
    return read(key, fallback);
  }
  function setValue(key, value) {
    write(key, value);
  }
  function getItem(key) {
    const value = read(key, null);
    return value === null || value === void 0 ? null : String(value);
  }
  function setItem(key, value) {
    write(key, String(value));
  }
  async function storageInfo() {
    const report2 = {
      ...info,
      keys: native ? Object.keys(mirror) : void 0,
      unsaved: info.present ? unsavedKeys() : void 0
    };
    if (native && typeof native.usage === "function") {
      try {
        report2.usage = await withTimeout(native.usage(), LOAD_TIMEOUT_MS);
      } catch (e) {
        report2.usage = null;
      }
    }
    return report2;
  }

  // src/core/auth.js
  var apiToken = "";
  var RETURN_URL_KEY = "nfhTokenReturnUrl";
  function initAuth() {
    apiToken = getValue("apiToken", "");
  }
  function getApiToken() {
    return apiToken;
  }
  function setApiToken(token) {
    apiToken = token;
    setValue("apiToken", token);
    rejected = false;
    noAnswers = 0;
    notify();
  }
  var Connection = {
    Connected: "connected",
    // No key stored: never connected, or storage was wiped.
    Missing: "missing",
    // nuke.family answered a call made with the key with "not logged in".
    Rejected: "rejected",
    // Calls are getting no answer at all, and none has got through.
    Unreachable: "unreachable"
  };
  var UNREACHABLE_AFTER = 2;
  var rejected = false;
  var answers = 0;
  var noAnswers = 0;
  var listeners = [];
  function connectionState() {
    if (!apiToken) return Connection.Missing;
    if (rejected) return Connection.Rejected;
    if (answers === 0 && noAnswers >= UNREACHABLE_AFTER) return Connection.Unreachable;
    return Connection.Connected;
  }
  function onConnectionChange(listener) {
    listeners.push(listener);
  }
  var lastState = null;
  function notify() {
    const state8 = connectionState();
    if (state8 === lastState) return;
    lastState = state8;
    for (const listener of listeners) {
      try {
        listener(state8);
      } catch (error) {
        console.error("[NFH] Connection listener failed:", error);
      }
    }
  }
  function noteAnswer() {
    answers += 1;
    notify();
  }
  function noteKeyRejected() {
    rejected = true;
    notify();
  }
  function noteNoAnswer() {
    noAnswers += 1;
    notify();
  }
  function takeTokenReturnUrl() {
    const url = getValue(RETURN_URL_KEY, "");
    if (!url) return null;
    setValue(RETURN_URL_KEY, "");
    return url.startsWith("https://www.torn.com/") ? url : null;
  }

  // src/core/config.js
  var DEBUG = false;
  var DEBUG_SITE = false;
  var DEFAULT_VERSION = "2.22.0";
  var CURRENT_VERSION = typeof GM_info !== "undefined" && GM_info.script && GM_info.script.version ? GM_info.script.version : DEFAULT_VERSION;
  var API_URL = DEBUG_SITE ? "http://nuke.test/api" : "https://nuke.family/api";
  var TOKEN_GENERATION_URL = DEBUG_SITE ? "http://nuke.test/auth/token-generation" : "https://nuke.family/auth/token-generation";
  var GITHUB_URL = "https://github.com/Fog-Development/nuke-family-helper-script/raw/master/nuke-family-helper.user.js";

  // src/core/api.js
  var SNIPPET_LENGTH = 200;
  function snippet(text) {
    return typeof text === "string" ? text.trim().slice(0, SNIPPET_LENGTH) : null;
  }
  var NoAnswerError = class extends Error {
    constructor(kind, detail = null, status = null) {
      super(`Request got no usable answer (${kind})`);
      this.name = "NoAnswerError";
      this.kind = kind;
      this.detail = detail;
      this.status = status;
    }
  };
  function failureDetail(failure2) {
    if (!failure2) return null;
    if (typeof failure2 === "string") return snippet(failure2);
    return snippet(failure2.error || failure2.message || failure2.statusText || "") || null;
  }
  function request(details) {
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        ...details,
        onload: resolve,
        onerror: (failure2) => reject(new NoAnswerError("network", failureDetail(failure2))),
        ontimeout: (failure2) => reject(new NoAnswerError("timeout", failureDetail(failure2)))
      });
    });
  }
  var ApiError = class extends Error {
    constructor(message, status, body, raw = null) {
      super(message);
      this.name = "ApiError";
      this.status = status;
      this.body = body;
      this.raw = raw;
    }
  };
  var FAILURES_KEY = "nfhUnansweredCalls";
  var requestLabel = null;
  function managerName() {
    try {
      const info2 = typeof GM_info !== "undefined" && GM_info ? GM_info : {};
      return info2.scriptHandler ? `${info2.scriptHandler} ${info2.version || ""}`.trim().slice(0, 60) : "";
    } catch (e) {
      return "";
    }
  }
  function unansweredCalls() {
    return parseInt(localStorage.getItem(FAILURES_KEY) || "0", 10) || 0;
  }
  function setUnansweredCalls(count) {
    try {
      if (count > 0) localStorage.setItem(FAILURES_KEY, String(Math.min(count, 9999)));
      else localStorage.removeItem(FAILURES_KEY);
    } catch (e) {
    }
  }
  async function labelRequests(label, work) {
    requestLabel = label;
    try {
      return await work();
    } finally {
      requestLabel = null;
    }
  }
  function scriptHeaders(feature) {
    const headers = {
      "X-NFH-Version": CURRENT_VERSION,
      "X-NFH-Client": isPda ? "TornPDA" : "browser"
    };
    const manager = managerName();
    if (manager) headers["X-NFH-Manager"] = manager;
    const label = feature || requestLabel;
    if (label) headers["X-NFH-Feature"] = label;
    return headers;
  }
  async function api(path, { method = "GET", data = void 0, token = void 0, feature = void 0 } = {}) {
    const stored = token === void 0;
    const key = stored ? getApiToken() : token;
    const headers = { Accept: "application/json", ...scriptHeaders(feature) };
    if (key) headers.Authorization = "Bearer " + key;
    if (data !== void 0) {
      headers["Content-Type"] = "application/json";
    }
    const failures = unansweredCalls();
    if (failures > 0) {
      headers["X-NFH-Failures"] = String(failures);
      setUnansweredCalls(0);
    }
    let response;
    try {
      response = await request({
        method,
        url: API_URL + path,
        headers,
        data: data !== void 0 ? JSON.stringify(data) : void 0
      });
    } catch (error) {
      setUnansweredCalls(unansweredCalls() + failures + 1);
      if (stored && key) noteNoAnswer();
      throw error;
    }
    if (!response || typeof response.status !== "number") {
      setUnansweredCalls(unansweredCalls() + failures + 1);
    }
    if (stored && key && response && typeof response.status === "number") {
      if (response.status === 401) noteKeyRejected();
      else noteAnswer();
    }
    return readReply(response, method, path);
  }
  async function publicApi(path, options = {}) {
    try {
      return await api(path, { ...options, token: "" });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      return pageRequest(path, options);
    }
  }
  function readReply(response, method, path) {
    if (!response || typeof response.status !== "number") {
      throw new NoAnswerError("empty");
    }
    let body = null;
    let parsed = false;
    try {
      body = JSON.parse(response.responseText);
      parsed = true;
    } catch (e) {
    }
    if (response.status >= 200 && response.status < 300) {
      if (!parsed) throw new NoAnswerError("not_json", snippet(response.responseText), response.status);
      return body;
    }
    throw new ApiError(
      `API ${method} ${path} failed with status ${response.status}`,
      response.status,
      body,
      parsed ? null : snippet(response.responseText)
    );
  }
  async function pageRequest(path, { method = "GET", data = void 0 } = {}) {
    let reply;
    try {
      reply = await fetch(API_URL + path, {
        method,
        headers: data !== void 0 ? { Accept: "application/json", "Content-Type": "application/json" } : void 0,
        body: data !== void 0 ? JSON.stringify(data) : void 0,
        credentials: "omit"
      });
    } catch (error) {
      throw new NoAnswerError("network", failureDetail(error));
    }
    return readReply({ status: reply.status, responseText: await reply.text() }, method, path);
  }

  // src/core/log.js
  function LogInfo(...values) {
    if (!DEBUG) return;
    const now = /* @__PURE__ */ new Date();
    console.log(": [//* NFH *\\\\] " + now.toISOString(), ...values);
  }

  // src/core/user.js
  var ROLE_CACHE_KEY = "nfhUserRole";
  var PERMISSIONS_CACHE_KEY = "nfhUserPermissions";
  var PERMISSIONS_CACHE_TTL_MS = 12 * 60 * 60 * 1e3;
  function getUserRole() {
    try {
      const saved2 = JSON.parse(localStorage.getItem(ROLE_CACHE_KEY) || "null");
      return saved2 && saved2.role || "";
    } catch (e) {
      return "";
    }
  }
  async function refreshUserRole() {
    try {
      const result = await api("/user/get-own-roles");
      localStorage.setItem(
        ROLE_CACHE_KEY,
        JSON.stringify({
          role: result["role"],
          // Absent from an older site: unknown, not "no".
          reviving: typeof result["in_reviving_faction"] === "boolean" ? result["in_reviving_faction"] : null,
          timestamp: Date.now()
        })
      );
      LogInfo("Updated users role from nuke.family in local storage");
      for (const listener of roleListeners) listener();
    } catch (error) {
      console.error("Error fetching user role:", error);
    }
  }
  var roleListeners = [];
  function onUserRoleRefreshed(listener) {
    roleListeners.push(listener);
  }
  var staleRefreshStarted = false;
  function inRevivingFaction() {
    let saved2 = null;
    try {
      saved2 = JSON.parse(localStorage.getItem(ROLE_CACHE_KEY) || "null");
    } catch (e) {
    }
    const known = saved2 && typeof saved2.reviving === "boolean";
    const fresh2 = known && saved2.timestamp && Date.now() - saved2.timestamp < PERMISSIONS_CACHE_TTL_MS;
    if (!fresh2 && !staleRefreshStarted && getApiToken()) {
      staleRefreshStarted = true;
      refreshUserRole();
    }
    return known ? saved2.reviving : null;
  }
  var RECRUITING_PERMISSION = "recruiting.predict";
  function cachedPermissions() {
    try {
      const cached = JSON.parse(localStorage.getItem(PERMISSIONS_CACHE_KEY));
      return cached && Array.isArray(cached.permissions) ? cached.permissions : null;
    } catch (e) {
      return null;
    }
  }
  var permissionListeners = [];
  function onPermissionsRefreshed(listener) {
    permissionListeners.push(listener);
  }
  async function getOwnPermissions() {
    try {
      const cached = JSON.parse(localStorage.getItem(PERMISSIONS_CACHE_KEY));
      if (cached && Array.isArray(cached.permissions) && cached.timestamp && Date.now() - cached.timestamp < PERMISSIONS_CACHE_TTL_MS) {
        return cached.permissions;
      }
    } catch (e) {
    }
    try {
      const result = await api("/user/get-own-permissions");
      const permissions = result["permissions"] || [];
      localStorage.setItem(
        PERMISSIONS_CACHE_KEY,
        JSON.stringify({ permissions, timestamp: Date.now() })
      );
      for (const listener of permissionListeners) listener();
      return permissions;
    } catch (error) {
      console.error("Error fetching permissions:", error);
      return [];
    }
  }
  async function refreshPermissions() {
    localStorage.removeItem(PERMISSIONS_CACHE_KEY);
    return getOwnPermissions();
  }

  // src/core/cache-sync.js
  var CACHE_CHECK_INTERVAL = 5 * 60 * 1e3;
  var stores = [];
  function registerSyncedStore(store) {
    stores.push(store);
  }
  function registeredStores() {
    return [...stores];
  }
  function performTimeBasedCacheCheck() {
    const now = Date.now();
    for (const store of stores) {
      if (store.isStale(now)) {
        LogInfo(`${store.serverField}: cache expired (time-based), fetching...`);
        store.refresh();
      }
    }
  }
  async function refreshAllCaches() {
    localStorage.removeItem("nfhLastApiCheckTime");
    LogInfo("Force-refreshing all caches...");
    await Promise.all([
      ...stores.map((store) => store.refresh()),
      refreshUserRole(),
      refreshPermissions()
    ]);
    LogInfo("Force refresh complete.");
  }
  async function checkCacheUpdates() {
    if (!getApiToken()) {
      LogInfo("API token not available, skipping cache check.");
      performTimeBasedCacheCheck();
      return;
    }
    const now = Date.now();
    const lastApiCheckTimestamp = parseInt(
      localStorage.getItem("nfhLastApiCheckTime") || "0"
    );
    if (now - lastApiCheckTimestamp < CACHE_CHECK_INTERVAL) {
      LogInfo(
        `Skipping API cache check, last check was less than ${CACHE_CHECK_INTERVAL / 6e4} minutes ago. Running time-based checks instead.`
      );
      performTimeBasedCacheCheck();
      return;
    }
    LogInfo("Attempting API cache check (more than 5 minutes since last check).");
    try {
      const serverTimes = await api("/cache/last-updates");
      localStorage.setItem("nfhLastApiCheckTime", now.toString());
      LogInfo("Server timestamps:", serverTimes);
      for (const store of stores) {
        const serverTimestampSec = serverTimes[store.serverField];
        if (serverTimestampSec && serverTimestampSec * 1e3 > store.timestamp) {
          LogInfo(`${store.serverField}: data is outdated, fetching new data.`);
          store.refresh(serverTimestampSec);
        }
      }
      performTimeBasedCacheCheck();
    } catch (error) {
      console.error("Cache check API request failed:", error);
      LogInfo("Cache check API request failed. Using time-based fallback.");
      performTimeBasedCacheCheck();
    }
  }

  // src/core/dom.js
  function addStyle(styleString) {
    const style = document.createElement("style");
    style.textContent = styleString;
    document.head.append(style);
  }
  function waitForElm(selector) {
    return new Promise((resolve) => {
      if (document.querySelector(selector)) {
        return resolve(document.querySelector(selector));
      }
      const observer5 = new MutationObserver(() => {
        const elm = document.querySelector(selector);
        if (elm) {
          resolve(elm);
          observer5.disconnect();
        }
      });
      observer5.observe(document.body, {
        childList: true,
        subtree: true
      });
    });
  }
  function ensureInjected({
    containerSelector,
    isPresent,
    inject,
    attempts = 12,
    intervalMs = 300
  }) {
    waitForElm(containerSelector).then(() => {
      let remaining = attempts;
      const attempt = () => {
        const container = document.querySelector(containerSelector);
        if (container && !isPresent()) {
          inject(container);
        }
        if (--remaining > 0) {
          setTimeout(attempt, intervalMs);
        }
      };
      attempt();
    });
  }
  function escapeHtml(value) {
    if (value === null || value === void 0) return "";
    return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  // src/core/pages.js
  var PageType = {
    Profile: "Profile",
    RecruitCitizens: "Recruit Citizens",
    HallOfFame: "Hall Of Fame",
    Faction: "Faction",
    FactionArmouryDrug: "Faction Armoury Drugs",
    Company: "Company",
    Competition: "Competition",
    Bounty: "Bounty",
    Search: "Search",
    Hospital: "Hospital",
    Chain: "Chain",
    FactionControl: "Faction Control",
    FactionControlPayday: "Faction Control Per Day",
    FactionControlApplications: "Faction Control Applications",
    FactionCrimes: "Faction Crimes",
    Market: "Market",
    Forum: "Forum",
    ForumThread: "ForumThread",
    ForumSearch: "ForumSearch",
    Abroad: "Abroad",
    Enemies: "Enemies",
    Friends: "Friends",
    PointMarket: "Point Market",
    Properties: "Properties",
    War: "War",
    ChainReport: "ChainReport",
    RWReport: "RWReport",
    NukeFamily3rdParty: "NukeFamily3rdParty",
    Messages: "Messages",
    Stocks: "Stocks",
    FactionNewsletter: "Faction Newsletter",
    FactionControlMembers: "Faction Control Members",
    FactionArmoury: "Faction Armoury"
  };
  var mapPageTypeAddress = {
    [PageType.Profile]: "https://www.torn.com/profiles.php",
    [PageType.RecruitCitizens]: "https://www.torn.com/bringafriend.php",
    [PageType.HallOfFame]: "https://www.torn.com/halloffame.php",
    [PageType.Faction]: "https://www.torn.com/factions.php",
    [PageType.Company]: "https://www.torn.com/joblist.php",
    [PageType.Competition]: "https://www.torn.com/competition.php",
    [PageType.Bounty]: "https://www.torn.com/bounties.php",
    [PageType.Search]: "https://www.torn.com/page.php",
    [PageType.Hospital]: "https://www.torn.com/hospitalview.php",
    [PageType.Chain]: "https://www.torn.com/factions.php?step=your#/war/chain",
    [PageType.Market]: "https://www.torn.com/imarket.php",
    [PageType.Forum]: "https://www.torn.com/forums.php",
    [PageType.ForumThread]: "https://www.torn.com/forums.php#/p=threads",
    [PageType.ForumSearch]: "https://www.torn.com/forums.php#/p=search",
    [PageType.Abroad]: "https://www.torn.com/index.php?page=people",
    [PageType.Enemies]: "https://www.torn.com/blacklist.php",
    [PageType.Friends]: "https://www.torn.com/friendlist.php",
    [PageType.PointMarket]: "https://www.torn.com/pmarket.php",
    [PageType.Properties]: "https://www.torn.com/properties.php",
    [PageType.War]: "https://www.torn.com/war.php",
    [PageType.ChainReport]: "https://www.torn.com/war.php?step=chainreport",
    [PageType.RWReport]: "https://www.torn.com/war.php?step=rankreport",
    [PageType.NukeFamily3rdParty]: TOKEN_GENERATION_URL,
    [PageType.Messages]: "https://www.torn.com/messages.php",
    [PageType.Stocks]: "https://www.torn.com/page.php?sid=stocks"
  };
  var mapPageAddressFragment = {
    [PageType.FactionControl]: "/tab=controls",
    [PageType.FactionArmouryDrug]: "tab=armoury&start=0&sub=drugs",
    [PageType.FactionControlPayday]: "tab=controls&option=pay-day",
    [PageType.FactionControlApplications]: "tab=controls&option=application",
    [PageType.FactionCrimes]: "tab=crimes",
    [PageType.FactionNewsletter]: "option=newsletter",
    [PageType.FactionControlMembers]: "option=members",
    [PageType.FactionArmoury]: "tab=armoury"
  };
  function IsPage(pageType) {
    const fragment = mapPageAddressFragment[pageType];
    if (fragment !== void 0) {
      return window.location.href.includes(fragment);
    }
    const prefix = mapPageTypeAddress[pageType];
    if (prefix !== void 0) {
      return window.location.href.startsWith(prefix);
    }
    return false;
  }
  function onNavigate(callback) {
    let lastHref = window.location.href;
    const fireIfChanged = () => {
      if (window.location.href !== lastHref) {
        lastHref = window.location.href;
        callback();
      }
    };
    window.addEventListener("hashchange", fireIfChanged);
    window.addEventListener("popstate", fireIfChanged);
    for (const method of ["pushState", "replaceState"]) {
      const original = history[method].bind(history);
      history[method] = (...args) => {
        const result = original(...args);
        fireIfChanged();
        return result;
      };
    }
    setInterval(fireIfChanged, 500);
  }

  // src/core/update-checker.js
  var CHECK_INTERVAL = 6 * 60 * 60 * 1e3;
  var UPDATE_NOTIFY_GRACE_PERIOD = 3 * 24 * 60 * 60 * 1e3;
  async function checkForUpdates(force = false) {
    const lastCheckTime = localStorage.getItem("nfhLastUpdateCheckTime");
    const currentTime = Date.now();
    if (!force && lastCheckTime && currentTime - lastCheckTime < CHECK_INTERVAL) {
      LogInfo(
        "Skipping update check, not enough time has passed since the last check and force update button not pressed"
      );
      return;
    }
    LogInfo("Checking for updates..." + lastCheckTime + " " + currentTime);
    localStorage.setItem("nfhLastUpdateCheckTime", currentTime);
    let response;
    try {
      response = await request({ method: "GET", url: GITHUB_URL });
    } catch (error) {
      LogInfo("Update check failed:", error);
      return;
    }
    const match = response.responseText.match(/@version\s+([\d.]+)/);
    if (!match) {
      return;
    }
    const githubVersion = match[1];
    const isNewer = isVersionNewer(githubVersion, CURRENT_VERSION);
    if (isNewer) {
      if (force || hasUpdateGracePeriodElapsed(githubVersion)) {
        if (confirm(
          "A new version of the Nuclear Family Helper script is available (v" + githubVersion + "). Do you want to update now?"
        )) {
          window.location.href = GITHUB_URL;
        }
      } else {
        LogInfo(
          "New version " + githubVersion + " seen but still within the " + UPDATE_NOTIFY_GRACE_PERIOD / (24 * 60 * 60 * 1e3) + "-day grace period; not prompting yet."
        );
      }
    } else {
      localStorage.removeItem("nfhPendingUpdate");
      if (force) {
        alert(
          "No updates available. You are running version " + CURRENT_VERSION + ". And the latest published version is " + githubVersion + "."
        );
      }
    }
  }
  function hasUpdateGracePeriodElapsed(githubVersion) {
    const now = Date.now();
    let pending4 = null;
    try {
      pending4 = JSON.parse(localStorage.getItem("nfhPendingUpdate"));
    } catch (e) {
      pending4 = null;
    }
    if (!pending4 || pending4.version !== githubVersion) {
      localStorage.setItem(
        "nfhPendingUpdate",
        JSON.stringify({ version: githubVersion, firstSeen: now })
      );
      return false;
    }
    return now - pending4.firstSeen >= UPDATE_NOTIFY_GRACE_PERIOD;
  }
  function isVersionNewer(v1, v2) {
    const v1Parts = v1.split(".").map(Number);
    const v2Parts = v2.split(".").map(Number);
    const len = Math.max(v1Parts.length, v2Parts.length);
    for (let i = 0; i < len; i++) {
      const v1Part = i < v1Parts.length ? v1Parts[i] : 0;
      const v2Part = i < v2Parts.length ? v2Parts[i] : 0;
      if (v1Part > v2Part) return true;
      if (v1Part < v2Part) return false;
    }
    return false;
  }

  // src/core/torn-page.js
  function getCookie(name) {
    const match = document.cookie.match(
      new RegExp("(?:^|;\\s*)" + name + "=([^;]*)")
    );
    return match ? decodeURIComponent(match[1]) : null;
  }
  function getPlayerId() {
    const canonical = document.querySelector("link[rel='canonical']");
    if (canonical != void 0) {
      const urlParams = new URLSearchParams(canonical.href);
      return urlParams.get("https://www.torn.com/profiles.php?XID");
    } else {
      const urlParams = new URL(window.location).searchParams;
      return urlParams.get("XID");
    }
  }
  function getPlayerName() {
    const nameElement = document.querySelector(
      ".info-table > li:first-child > div.user-info-value > span"
    );
    if (nameElement != void 0) {
      const nameMatch = nameElement.innerText.match(/^(.*?)\s*\[/);
      if (nameMatch && nameMatch[1]) {
        return nameMatch[1];
      }
    }
    return null;
  }
  function getFactionId() {
    const factionUrl = document.querySelector(
      ".basic-information .info-table a[href^='/factions.php?step=profile&ID=']"
    );
    if (factionUrl != void 0) {
      const urlParams = new URLSearchParams(factionUrl.href);
      return urlParams.get("ID");
    }
    return null;
  }
  function getUserscriptUsersPlayerId() {
    try {
      return getCookie("uid");
    } catch (error) {
      console.error(error);
      return false;
    }
  }
  function getUserscriptUsersPlayerName() {
    const id = getUserscriptUsersPlayerId();
    const data = JSON.parse(sessionStorage.getItem("sidebarData" + id));
    if (data && data.user) {
      return data.user.name;
    }
  }
  function isOwnFactionMainTab() {
    return window.location.search.includes("step=your") && !window.location.hash.includes("tab=");
  }

  // src/features/chain-watch/prefs.js
  var STORAGE_KEY = "nfhChainWatch";
  var LEGACY_KEY = "chainWarcher";
  var AlertMode = {
    Always: "always",
    // any active chain
    Watch: "watch",
    // only while the faction has a chain watch set up
    CheckedIn: "checkedin",
    // as Watch, and only once checked in to it
    Off: "off"
  };
  var PACES = { fast: 1e3, normal: 2e3, slow: 4e3 };
  var MAX_ALERT_SECONDS = 299;
  var DEFAULTS = {
    expanded: false,
    alertMode: AlertMode.Always,
    alertSeconds: 150,
    beep: false,
    volume: 0.5,
    color: "#ff0000",
    opacity: 0.2,
    pace: "normal",
    markWall: false,
    dmReminder: true
  };
  function clamp(value, min, max, fallback) {
    const number2 = Number(value);
    if (!Number.isFinite(number2)) return fallback;
    return Math.min(max, Math.max(min, number2));
  }
  function sanitize(raw) {
    const source = raw && typeof raw === "object" ? raw : {};
    return {
      expanded: source.expanded === true,
      alertMode: Object.values(AlertMode).includes(source.alertMode) ? source.alertMode : DEFAULTS.alertMode,
      alertSeconds: Math.round(
        clamp(source.alertSeconds, 1, MAX_ALERT_SECONDS, DEFAULTS.alertSeconds)
      ),
      beep: source.beep === true,
      volume: clamp(source.volume, 0.01, 1, DEFAULTS.volume),
      color: /^#[0-9a-f]{6}$/i.test(source.color) ? source.color : DEFAULTS.color,
      opacity: clamp(source.opacity, 0.05, 1, DEFAULTS.opacity),
      pace: source.pace in PACES ? source.pace : DEFAULTS.pace,
      markWall: source.markWall === true,
      dmReminder: source.dmReminder !== false
    };
  }
  function importLegacy() {
    let legacy;
    try {
      legacy = JSON.parse(localStorage.getItem(LEGACY_KEY) || "null");
    } catch (e) {
      return null;
    }
    if (!legacy || typeof legacy !== "object") return null;
    const period = (Number(legacy.interval) || 1e3) * 2;
    return {
      alertMode: legacy.watchChain === false ? AlertMode.Off : AlertMode.Always,
      alertSeconds: (Number(legacy.minuteAlert) || 0) * 60 + (Number(legacy.secundeAlert) || 0),
      beep: legacy.beepAlert === true,
      volume: legacy.beepVolume,
      color: legacy.color,
      opacity: legacy.opacity,
      pace: period <= 1e3 ? "fast" : period <= 2e3 ? "normal" : "slow",
      markWall: legacy.markWallTargets !== false
    };
  }
  var prefs = null;
  function getPrefs() {
    if (prefs) return prefs;
    let stored = null;
    try {
      stored = JSON.parse(getItem(STORAGE_KEY) || "null");
    } catch (e) {
    }
    prefs = sanitize(stored || importLegacy());
    return prefs;
  }
  function setPrefs(patch) {
    prefs = sanitize({ ...getPrefs(), ...patch });
    setItem(STORAGE_KEY, JSON.stringify(prefs));
    return prefs;
  }
  function formatAlertTime(seconds) {
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  }
  function parseAlertTime(text) {
    const match = String(text).trim().match(/^(\d):([0-5]\d)$/);
    if (!match) return null;
    const seconds = Number(match[1]) * 60 + Number(match[2]);
    return seconds >= 1 && seconds <= MAX_ALERT_SECONDS ? seconds : null;
  }

  // src/features/chain-watch/alert.js
  var FLASH_ID = "nfh-chain-flash";
  var BEEP_MS = 400;
  var BEEP_HZ = 440;
  var MIN_CHAIN_HITS = 25;
  function readChainTimer() {
    const box = document.querySelector(".chain-box");
    if (!box) return null;
    const title = box.querySelector(".chain-box-title");
    const timeLeft = box.querySelector(".chain-box-timeleft");
    const count = box.querySelector(".chain-box-center-stat");
    const match = timeLeft && timeLeft.textContent.trim().match(/^(\d+):(\d{2})$/);
    const hits = count ? count.textContent.replace(/[,\s]/g, "") : "";
    return {
      active: !!title && title.textContent.trim().toLowerCase() === "chain active",
      seconds: match ? Number(match[1]) * 60 + Number(match[2]) : null,
      hits: /^\d+$/.test(hits) ? Number(hits) : null
    };
  }
  function hexToRgba(hex, alpha) {
    const value = parseInt(hex.slice(1), 16);
    return `rgba(${value >> 16}, ${value >> 8 & 255}, ${value & 255}, ${alpha})`;
  }
  function setFlashing(on) {
    let flash = document.getElementById(FLASH_ID);
    if (!on) {
      if (flash) flash.remove();
      return;
    }
    const prefs4 = getPrefs();
    if (!flash) {
      flash = document.createElement("div");
      flash.id = FLASH_ID;
      document.body.appendChild(flash);
    }
    flash.style.backgroundColor = hexToRgba(prefs4.color, prefs4.opacity);
    flash.style.animationDuration = `${PACES[prefs4.pace]}ms`;
  }
  var audioContext = null;
  var lastBeepAt = 0;
  function beep(volume) {
    try {
      if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioContext.state === "suspended") {
        audioContext.resume();
      }
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = BEEP_HZ;
      gain.gain.value = volume;
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + BEEP_MS / 1e3);
    } catch (e) {
    }
  }
  function updateAlert({ timer: timer3, armed, test = false }) {
    const prefs4 = getPrefs();
    const low = armed && !!timer3 && timer3.active && // An unreadable hit count must not silence the alert.
    (timer3.hits === null || timer3.hits >= MIN_CHAIN_HITS) && timer3.seconds !== null && timer3.seconds > 0 && timer3.seconds < prefs4.alertSeconds;
    const alerting = low || test;
    setFlashing(alerting);
    if (alerting && prefs4.beep) {
      const now = Date.now();
      if (now - lastBeepAt >= PACES[prefs4.pace] - 100) {
        lastBeepAt = now;
        beep(prefs4.volume);
      }
    }
    return low;
  }
  function stopAlert() {
    setFlashing(false);
  }

  // src/core/time.js
  function formatDateTime(dateObj) {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");
    const hours = String(dateObj.getHours()).padStart(2, "0");
    const minutes = String(dateObj.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  }
  function timeSince(dateObj) {
    const seconds = Math.floor((Date.now() - dateObj.getTime()) / 1e3);
    if (seconds < 60) {
      return "just now";
    }
    const intervals = [
      { label: "year", secs: 31536e3 },
      { label: "month", secs: 2592e3 },
      { label: "day", secs: 86400 },
      { label: "hour", secs: 3600 },
      { label: "minute", secs: 60 }
    ];
    for (const interval of intervals) {
      const count = Math.floor(seconds / interval.secs);
      if (count >= 1) {
        return count === 1 ? `${count} ${interval.label} ago` : `${count} ${interval.label}s ago`;
      }
    }
    return "just now";
  }
  function parseApiUtcDate(value) {
    if (!value) return null;
    return /* @__PURE__ */ new Date(value.replace(" ", "T") + "Z");
  }

  // src/features/chain-watch/data.js
  var LIST_KEY = "nfhChainWatchList";
  var BOARD_KEY = "nfhChainWatchBoard";
  var LIST_TTL_MS = 10 * 60 * 1e3;
  var LIST_RETRY_MS = 60 * 1e3;
  var BOARD_FRESH_MS = 45 * 1e3;
  var BOARD_MAX_AGE_MS = 15 * 60 * 1e3;
  function readJson(key) {
    try {
      return JSON.parse(localStorage.getItem(key) || "null");
    } catch (e) {
      return null;
    }
  }
  function toMs(value) {
    if (!value) return null;
    const date = value.includes("T") ? new Date(value) : parseApiUtcDate(value);
    return date.getTime();
  }
  function usable(watches, now = Date.now()) {
    return (Array.isArray(watches) ? watches : []).filter((watch5) => {
      const end = toMs(watch5.end_time);
      return end === null || end > now;
    }).sort((a, b) => toMs(a.start_time) - toMs(b.start_time));
  }
  function cachedWatches() {
    const cached = readJson(LIST_KEY);
    return cached ? usable(cached.watches) : [];
  }
  async function getActiveWatches({ force = false } = {}) {
    const cached = readJson(LIST_KEY);
    if (!force && cached && cached.timestamp && Date.now() - cached.timestamp < LIST_TTL_MS) {
      return usable(cached.watches);
    }
    if (!getApiToken()) {
      return [];
    }
    try {
      const watches = (await api("/chain-watch")).data || [];
      localStorage.setItem(
        LIST_KEY,
        JSON.stringify({ watches, timestamp: Date.now() })
      );
      return usable(watches);
    } catch (error) {
      LogInfo("Chain watch list fetch failed:", error);
      const watches = cached ? cached.watches : [];
      localStorage.setItem(
        LIST_KEY,
        JSON.stringify({
          watches,
          timestamp: Date.now() - LIST_TTL_MS + LIST_RETRY_MS
        })
      );
      return usable(watches);
    }
  }
  function clearChainWatchCache() {
    localStorage.removeItem(LIST_KEY);
    localStorage.removeItem(BOARD_KEY);
  }
  function cachedBoard(watchId) {
    const cached = readJson(BOARD_KEY);
    if (!cached || !cached.board || cached.board.id !== watchId || Date.now() - cached.timestamp > BOARD_MAX_AGE_MS) {
      return null;
    }
    return cached;
  }
  function remember(board) {
    localStorage.setItem(
      BOARD_KEY,
      JSON.stringify({ board, timestamp: Date.now() })
    );
    return board;
  }
  async function boardCall(path, options) {
    return remember((await api(path, options)).data);
  }
  function fetchBoard(watchId) {
    return boardCall(`/chain-watch/${watchId}`);
  }
  function claimSlot(watchId, slotIso, wantDmReminder) {
    return boardCall(`/chain-watch/${watchId}/signups`, {
      method: "POST",
      data: { slot_start: slotIso, want_dm_reminder: wantDmReminder }
    });
  }
  function leaveSlot(watchId, slotIso) {
    return boardCall(`/chain-watch/${watchId}/signups?_method=DELETE`, {
      method: "POST",
      data: { slot_start: slotIso }
    });
  }
  function attendanceData(playerId) {
    return playerId ? { source: "userscript", player_id: playerId } : { source: "userscript" };
  }
  function checkIn(watchId, playerId) {
    return boardCall(`/chain-watch/${watchId}/checkin`, {
      method: "POST",
      data: attendanceData(playerId)
    });
  }
  function checkOut(watchId, playerId) {
    return boardCall(`/chain-watch/${watchId}/checkout`, {
      method: "POST",
      data: attendanceData(playerId)
    });
  }
  function respondToPrompt(watchId, checkinId, action) {
    return api(`/chain-watch/${watchId}/checkins/${checkinId}/respond`, {
      method: "POST",
      data: { action }
    });
  }
  async function searchMembers(watchId, query) {
    const result = await api(
      `/chain-watch/${watchId}/members?q=${encodeURIComponent(query)}`
    );
    return result.data || [];
  }
  function sendTestDm(watchId) {
    return api(`/chain-watch/${watchId}/test-notification`, { method: "POST", data: {} });
  }
  function errorMessage(error, fallback) {
    if (error && error.status === 401) {
      return "nuke.family no longer accepts this device's key. Press Connect in the bar at the top of the page.";
    }
    if (error && error.body && typeof error.body.error === "string") {
      return error.body.error;
    }
    if (error && error.status === 403) {
      return "You don't have access to do that on this chain watch.";
    }
    return fallback;
  }

  // src/features/chain-watch/view.js
  var HOUR_MS = 60 * 60 * 1e3;
  var DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  var MONTHS = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec"
  ];
  var ROSTER_SLOTS = 3;
  var SOON_MS = 10 * 60 * 1e3;
  var CHECKIN_STATUS = {
    scheduled: "Scheduled",
    unscheduled: "Unscheduled",
    past_slot: "Past slot, check if active"
  };
  var pad = (number2) => String(number2).padStart(2, "0");
  var slotStart = (slot) => Date.parse(slot.slot_start_iso);
  function hourLabel(ms) {
    return `${pad(new Date(ms).getUTCHours())}:00`;
  }
  function slotLabel(ms) {
    return `${DAYS[new Date(ms).getUTCDay()]} ${hourLabel(ms)}`;
  }
  function dayLabel(ms) {
    const date = new Date(ms);
    return `${DAYS[date.getUTCDay()]} ${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]}`;
  }
  function localTime(ms) {
    return new Date(ms).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  function duration(ms) {
    const minutes = Math.max(0, Math.round(ms / 6e4));
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 48) return minutes % 60 ? `${hours}h ${minutes % 60}m` : `${hours}h`;
    return `${Math.floor(hours / 24)}d ${hours % 24}h`;
  }
  function playerName(entry) {
    return entry.player_name || `Player ${entry.player_id}`;
  }
  function playerLink(entry, className = "") {
    const name = escapeHtml(playerName(entry));
    if (!entry.player_id) return `<span class="${className}">${name}</span>`;
    return `<a class="${className}" href="/profiles.php?XID=${escapeHtml(entry.player_id)}">${name}</a>`;
  }
  function button(action, label, { primary = false, data = {}, title = "" } = {}) {
    const attributes = Object.entries(data).map(([key, value]) => ` data-${key}="${escapeHtml(value)}"`).join("");
    return `<button type="button" class="nfh-cw-btn${primary ? " nfh-cw-btn--primary" : ""}" data-action="${action}"${attributes}${title ? ` title="${escapeHtml(title)}"` : ""}>${escapeHtml(label)}</button>`;
  }
  function summarize(board, now) {
    const slots = board.slots || [];
    const checkins = board.checkins || [];
    const current = slots.find((slot) => slotStart(slot) <= now && now < slotStart(slot) + HOUR_MS) || null;
    const mine = slots.filter((slot) => slot.signups.some((signup) => signup.is_me));
    return {
      slots,
      checkins,
      current,
      mine,
      myCheckin: checkins.find((checkin) => checkin.is_me) || null,
      myCurrent: !!current && mine.includes(current),
      myNext: mine.find((slot) => slotStart(slot) > now) || null,
      started: Date.parse(board.start_time) <= now,
      checkedInIds: new Set(checkins.map((checkin) => Number(checkin.player_id)))
    };
  }
  function barState(board, summary, now) {
    const { myCheckin, myNext, current } = summary;
    const checkInButton = (primary) => button("checkin", "Check in", { primary });
    if (myCheckin) {
      if (myCheckin.status === "past_slot") {
        return {
          tone: "attn",
          text: "Your slot ended. Still watching?",
          actions: button("stay", "Stay on", { primary: true, data: { checkin: myCheckin.id } }) + button("checkout", "Check out")
        };
      }
      const next = myNext ? ` \xB7 next slot ${slotLabel(slotStart(myNext))}` : "";
      return {
        tone: "in",
        text: `Checked in \xB7 ${duration(now - Date.parse(myCheckin.checked_in_at))}${next}`,
        actions: button("checkout", "Check out")
      };
    }
    if (summary.myCurrent) {
      return {
        tone: "attn",
        text: "Your slot is running",
        actions: checkInButton(true)
      };
    }
    if (myNext) {
      const wait2 = slotStart(myNext) - now;
      if (wait2 <= SOON_MS) {
        return {
          tone: "attn",
          text: `Your slot starts in ${duration(wait2)}`,
          actions: checkInButton(true)
        };
      }
      return {
        tone: "",
        text: `Your next slot: ${slotLabel(slotStart(myNext))} TCT \xB7 in ${duration(wait2)}`,
        actions: summary.started ? checkInButton(false) : ""
      };
    }
    if (!summary.started) {
      const start3 = Date.parse(board.start_time);
      return {
        tone: "",
        text: `Starts ${slotLabel(start3)} TCT \xB7 in ${duration(start3 - now)}`,
        actions: ""
      };
    }
    const watching = summary.checkins.length;
    const open = current ? Math.max(0, current.cap - current.paid_count) : 0;
    return {
      tone: "",
      text: `${watching} checked in` + (open > 0 ? ` \xB7 <span class="nfh-cw-need">${current.rate > 0 ? `this hour has ${open} open paid spot${open === 1 ? "" : "s"}` : `this hour needs ${open} more watcher${open === 1 ? "" : "s"}`}</span>` : ""),
      actions: checkInButton(false)
    };
  }
  function alertChip(prefs4, armed) {
    let label = `Alert ${formatAlertTime(prefs4.alertSeconds)}`;
    let title = `Flashes the page when an active chain of at least ${MIN_CHAIN_HITS} hits drops below ${formatAlertTime(prefs4.alertSeconds)}. Click for settings.`;
    if (prefs4.alertMode === AlertMode.Off) {
      label = "Alert off";
      title = "Chain timer alert is off. Click for settings.";
    } else if (!armed) {
      title = prefs4.alertMode === AlertMode.Watch ? "Chain timer alert is waiting: your faction has no chain watch set up on nuke.family. Click for settings." : "Chain timer alert is waiting: you are not checked in to a chain watch. Click for settings.";
    }
    return `<button type="button" class="nfh-cw-chip${armed ? " is-armed" : ""}" data-action="settings" title="${escapeHtml(title)}">${escapeHtml(label)}</button>`;
  }
  function renderBar({ board, watches, prefs: prefs4, armed, chainActive, flash, busy: busy2, now }) {
    const summary = board ? summarize(board, now) : null;
    const state8 = summary ? barState(board, summary, now) : { tone: "", text: '<span class="nfh-cw-muted">No chain watch scheduled</span>', actions: "" };
    if (summary && summary.started && !summary.myCheckin && chainActive && armed && state8.tone !== "attn") {
      state8.text = '<span class="nfh-cw-need" title="Check in so your time watching is recorded on the chain watch sheet">Not checked in</span> \xB7 ' + state8.text;
      state8.actions = button("checkin", "Check in");
    }
    const title = board && board.title ? `<span class="nfh-cw-title">${escapeHtml(board.title)}</span>` : "";
    const status = flash ? `<span class="${flash.error ? "nfh-cw-error" : "nfh-cw-ok"}">${escapeHtml(flash.text)}</span>` : state8.text;
    const expandable = !!board;
    const expanded = expandable && prefs4.expanded;
    const picker = watches.length > 1 ? `<select class="nfh-cw-picker" data-role="watch-picker" title="Chain watch">${watches.map(
      (watch5) => `<option value="${escapeHtml(watch5.id)}"${board && board.id === watch5.id ? " selected" : ""}>${escapeHtml(watch5.title || `Chain watch #${watch5.id}`)}</option>`
    ).join("")}</select>` : title;
    return {
      tone: state8.tone,
      html: `<button type="button" class="nfh-cw-toggle" data-action="toggle"${expandable ? "" : " disabled"} aria-expanded="${expanded}"><span class="nfh-cw-caret">${expandable ? expanded ? "\u25BE" : "\u25B8" : "\xB7"}</span>Chain Watch</button>` + picker + `<span class="nfh-cw-status"${expandable ? ' data-action="toggle"' : ""}>${status}</span><span class="nfh-cw-actions${busy2 ? " is-busy" : ""}">${state8.actions}</span>` + alertChip(prefs4, armed)
    };
  }
  function overCapNote(slot) {
    return ` <span class="nfh-cw-muted">(${slot.rate > 0 ? "unpaid" : "extra"})</span>`;
  }
  function fillText(slot) {
    return `${slot.paid_count}/${slot.cap} ${slot.rate > 0 ? "paid" : "filled"}`;
  }
  function rosterSection(summary, board, now) {
    const { slots } = summary;
    if (slots.length === 0) {
      return '<div class="nfh-cw-muted">No open slots in the current signup window.</div>';
    }
    const firstRunning = slotStart(slots[0]) <= now;
    const rows2 = slots.slice(0, ROSTER_SLOTS).map((slot, index) => {
      const running = slot === summary.current;
      const heading = running ? "Now" : index === (firstRunning ? 1 : 0) ? "Up next" : "Then";
      const names = slot.signups.map((signup) => {
        const present = summary.checkedInIds.has(Number(signup.player_id));
        const staffCheckIn = running && !present && board.can_manage_attendance && signup.player_id && !signup.is_me ? button("staff-in", "check in", {
          data: { player: signup.player_id },
          title: `Check ${playerName(signup)} in`
        }) : "";
        return `<span class="nfh-cw-person${present ? " is-present" : ""}${signup.is_me ? " is-me" : ""}" title="${present ? "Checked in" : "Not checked in"}">` + playerLink(signup) + (signup.paid ? "" : overCapNote(slot)) + staffCheckIn + "</span>";
      });
      return `<div class="nfh-cw-roster-row${running ? " is-now" : ""}"><span class="nfh-cw-roster-when">${heading}</span><span class="nfh-cw-roster-time">${slotLabel(slotStart(slot))}</span><span class="nfh-cw-people">${names.length ? names.join("") : '<span class="nfh-cw-need">nobody signed up</span>'}</span></div>`;
    });
    return rows2.join("");
  }
  function checkinSection(summary, board, ui, now) {
    const rows2 = summary.checkins.map((checkin) => {
      const staffOut = board.can_manage_attendance && !checkin.is_me ? button("staff-out", "check out", {
        data: { player: checkin.player_id },
        title: `Check ${playerName(checkin)} out`
      }) : "";
      return `<span class="nfh-cw-person is-present${checkin.is_me ? " is-me" : ""}">` + playerLink(checkin) + ` <span class="nfh-cw-tag nfh-cw-tag--${escapeHtml(checkin.status)}">${escapeHtml(CHECKIN_STATUS[checkin.status] || checkin.status)}</span> <span class="nfh-cw-muted">${duration(now - Date.parse(checkin.checked_in_at))}</span>` + staffOut + "</span>";
    });
    let staff = "";
    if (board.can_manage_attendance) {
      let results = "";
      if (ui.searchLoading) {
        results = '<div class="nfh-cw-muted">Searching\u2026</div>';
      } else if (ui.searchResults) {
        results = ui.searchResults.length ? ui.searchResults.map(
          (member) => `<span class="nfh-cw-person${member.checked_in ? " is-present" : ""}">` + playerLink(member) + ` <span class="nfh-cw-muted">[${escapeHtml(member.player_id)}]</span>` + button(
            member.checked_in ? "staff-out" : "staff-in",
            member.checked_in ? "check out" : "check in",
            { data: { player: member.player_id } }
          ) + "</span>"
        ).join("") : '<div class="nfh-cw-muted">No member of this faction matches.</div>';
      }
      staff = `<div class="nfh-cw-staff"><input type="text" class="nfh-cw-input nfh-cw-search" data-role="member-search" maxlength="50" placeholder="Staff: check a member in or out (name or ID)" value="${escapeHtml(ui.searchQuery)}"><div class="nfh-cw-people">${results}</div></div>`;
    }
    return `<div class="nfh-cw-people">${rows2.length ? rows2.join("") : '<span class="nfh-cw-muted">Nobody is checked in right now.</span>'}</div>` + staff;
  }
  function slotFill(slot) {
    if (slot.total_count === 0) return "empty";
    return slot.paid_count < slot.cap ? "short" : "full";
  }
  function slotDetail(slot, busy2) {
    const start3 = slotStart(slot);
    const isMine = slot.signups.some((signup) => signup.is_me);
    const waitlist = slot.total_count - slot.paid_count;
    const names = slot.signups.map(
      (signup) => `<span class="nfh-cw-person nfh-cw-person--plain${signup.is_me ? " is-me" : ""}">${playerLink(signup)}${signup.paid ? "" : overCapNote(slot)}</span>`
    ).join("");
    const paid = slot.rate > 0;
    const unpaidWarning = !isMine && slot.paid_count >= slot.cap ? paid ? '<span class="nfh-cw-need">Paid spots are full: you would be unpaid unless staff approve it.</span>' : '<span class="nfh-cw-muted">This hour is covered: extra watchers are welcome.</span>' : "";
    return `<div class="nfh-cw-detail"><div><strong>${slotLabel(start3)}\u2013${hourLabel(start3 + HOUR_MS)} TCT</strong> <span class="nfh-cw-muted">(${escapeHtml(localTime(start3))} your time)</span>` + (paid ? ` \xB7 ${escapeHtml(slot.rate)} xanax/hr${slot.is_premium ? " \u2605" : ""}` : "") + (slot.range_label ? ` \xB7 ${escapeHtml(slot.range_label)}` : "") + ` \xB7 ${escapeHtml(fillText(slot))}` + (waitlist > 0 ? ` (+${waitlist} ${paid ? "unpaid" : "extra"})` : "") + `</div><div class="nfh-cw-people">${names || '<span class="nfh-cw-muted">Nobody signed up yet.</span>'}</div><div class="nfh-cw-detail-actions${busy2 ? " is-busy" : ""}">` + (isMine ? button("leave", "Leave this slot", { data: { slot: slot.slot_start_iso } }) : button("signup", "Sign up", { primary: true, data: { slot: slot.slot_start_iso } })) + unpaidWarning + "</div></div>";
  }
  function slotsSection(summary, ui, busy2) {
    const { slots } = summary;
    if (slots.length === 0) return "";
    const days = [];
    for (const slot of slots) {
      const label = dayLabel(slotStart(slot));
      if (!days.length || days[days.length - 1].label !== label) {
        days.push({ label, slots: [] });
      }
      days[days.length - 1].slots.push(slot);
    }
    const grid = days.map(
      (day) => `<div class="nfh-cw-day"><span class="nfh-cw-day-label">${day.label}</span><div class="nfh-cw-grid">` + day.slots.map((slot) => {
        const isMine = summary.mine.includes(slot);
        const classes = [
          "nfh-cw-slot",
          `nfh-cw-slot--${slotFill(slot)}`,
          isMine ? "is-mine" : "",
          slot === summary.current ? "is-now" : "",
          ui.selectedSlot === slot.slot_start_iso ? "is-selected" : ""
        ];
        const tip = `${slotLabel(slotStart(slot))} TCT \xB7 ${slot.rate > 0 ? `${slot.rate} xanax/hr \xB7 ` : ""}${fillText(slot)}${isMine ? " \xB7 you are signed up" : ""}`;
        return `<button type="button" class="${classes.filter(Boolean).join(" ")}" data-action="slot" data-slot="${escapeHtml(slot.slot_start_iso)}" title="${escapeHtml(tip)}"><span class="nfh-cw-slot-hour">${pad(new Date(slotStart(slot)).getUTCHours())}${slot.is_premium ? "\u2605" : ""}</span><span class="nfh-cw-slot-fill">${escapeHtml(slot.paid_count)}/${escapeHtml(slot.cap)}</span></button>`;
      }).join("") + "</div></div>"
    ).join("");
    const selected = slots.find((slot) => slot.slot_start_iso === ui.selectedSlot);
    const mine = summary.mine.length ? `Your slots: ${summary.mine.map((slot) => slotLabel(slotStart(slot))).join(", ")}` : "Pick an hour to see who is on it and sign up.";
    return `<div class="nfh-cw-muted nfh-cw-mine">${mine}</div>` + grid + (selected ? slotDetail(selected, busy2) : "");
  }
  function section(title, body) {
    return `<div class="nfh-cw-section"><div class="nfh-cw-heading">${title}</div>${body}</div>`;
  }
  function renderPanel({ board, prefs: prefs4, ui, busy: busy2, now }) {
    const summary = summarize(board, now);
    const pays = board.pays !== false;
    const pay = (board.default_rate > 0 ? `${escapeHtml(board.default_rate)} xanax/hr \xB7 ${escapeHtml(board.default_slot_cap)} paid per slot` : `${escapeHtml(board.default_slot_cap)} watchers per slot`) + (pays ? " \xB7 \u2605 pays more" : "");
    return section("On watch", rosterSection(summary, board, now)) + section(`Checked in (${summary.checkins.length})`, checkinSection(summary, board, ui, now)) + section(
      `Slots <span class="nfh-cw-muted">TCT \xB7 ${pay}</span>`,
      slotsSection(summary, ui, busy2)
    ) + `<div class="nfh-cw-footer"><label title="Applies to slots you sign up for from here"><input type="checkbox" data-pref="dmReminder"${prefs4.dmReminder ? " checked" : ""}> Discord DM reminder before my slots</label>` + button("test-dm", "Test DM", { title: "Send yourself a test reminder on Discord" }) + button("refresh", "Refresh") + (/^https?:\/\//.test(board.signup_url || "") ? `<a class="nfh-cw-link" href="${escapeHtml(board.signup_url)}" target="_blank" rel="noopener">Open on nuke.family</a>` : "") + "</div>";
  }
  var ALERT_MODE_HELP = {
    [AlertMode.Always]: "You are alerted whenever your faction has an active chain in Torn and its timer gets low, whether or not a chain watch exists on nuke.family.",
    [AlertMode.Watch]: "You are alerted only when both are true: your faction has an active chain in Torn, and it has a chain watch set up on nuke.family. Other chains never alert.",
    [AlertMode.CheckedIn]: "You are alerted only when all three are true: your faction has an active chain in Torn, it has a chain watch set up on nuke.family, and you are checked in to it.",
    [AlertMode.Off]: "You are never alerted about the chain timer."
  };
  function renderSettings({ prefs: prefs4, legacyScript }) {
    const option = (value, label, current) => `<option value="${value}"${value === current ? " selected" : ""}>${label}</option>`;
    return `<div class="nfh-cw-settings-row"><label>Chain timer alert <select data-pref="alertMode">` + option(AlertMode.Always, "Any active chain", prefs4.alertMode) + option(AlertMode.Watch, "Only chains with a chain watch", prefs4.alertMode) + option(AlertMode.CheckedIn, "Only while I'm checked in", prefs4.alertMode) + option(AlertMode.Off, "Off", prefs4.alertMode) + `</select></label><label>Alert below <input type="text" class="nfh-cw-input nfh-cw-time" data-pref="alertSeconds" value="${formatAlertTime(prefs4.alertSeconds)}" maxlength="4" title="m:ss, up to 4:59"></label><label>Pace <select data-pref="pace">` + option("fast", "Fast", prefs4.pace) + option("normal", "Normal", prefs4.pace) + option("slow", "Slow", prefs4.pace) + `</select></label><label>Colour <input type="color" data-pref="color" value="${escapeHtml(prefs4.color)}"></label><label>Strength <input type="range" data-pref="opacity" min="5" max="100" value="${Math.round(prefs4.opacity * 100)}"></label><label><input type="checkbox" data-pref="beep"${prefs4.beep ? " checked" : ""}> Beep</label><label>Volume <input type="range" data-pref="volume" min="1" max="100" value="${Math.round(prefs4.volume * 100)}"></label>` + button("test-alert", "Test", { title: "Preview the alert for a few seconds" }) + `<label title="On territory war walls: strike through your own members and highlight enemies"><input type="checkbox" data-pref="markWall"${prefs4.markWall ? " checked" : ""}> Mark wall targets</label></div><div class="nfh-cw-muted nfh-cw-help">${ALERT_MODE_HELP[prefs4.alertMode]}` + (prefs4.alertMode === AlertMode.Off ? "" : ` Chains under ${MIN_CHAIN_HITS} hits never alert.`) + "</div>" + (legacyScript ? '<div class="nfh-cw-need">The old "Chain watcher" script is still running. This replaces it, so you can remove it (otherwise both will alert).</div>' : "");
  }

  // src/features/chain-watch/index.js
  var ROOT_ID = "nfh-chain-watch";
  var ANCHOR_SELECTOR = "#faction_war_list_id";
  var HOUR_MS2 = 60 * 60 * 1e3;
  var POLL_EXPANDED_MS = 60 * 1e3;
  var POLL_ENGAGED_MS = 2 * 60 * 1e3;
  var POLL_IDLE_MS = 5 * 60 * 1e3;
  var LIST_RECHECK_MS = 60 * 1e3;
  var TEST_ALERT_MS = 5e3;
  var state = {
    watches: [],
    watchId: null,
    board: null,
    lastFetchAt: 0,
    // when the board was last fetched (or tried)
    lastListAt: 0,
    loading: false,
    busy: false,
    // an action (sign up, check in, ...) is in flight
    flash: null,
    // transient { text, error, until } shown in the bar
    settingsOpen: false,
    testUntil: 0,
    chainActive: false,
    // Torn's chain box currently says "Chain active"
    ui: {
      selectedSlot: null,
      searchQuery: "",
      searchResults: null,
      searchLoading: false
    }
  };
  var root = null;
  var regions = {};
  var renderedHtml = {};
  var ticker = null;
  var tickCount = 0;
  var searchTimer = null;
  function applyWallMarking() {
    document.body.classList.toggle("nfh-mark-wall", getPrefs().markWall);
  }
  function isCheckedIn() {
    return !!state.board && (state.board.checkins || []).some((checkin) => checkin.is_me);
  }
  function isArmed() {
    switch (getPrefs().alertMode) {
      case AlertMode.Always:
        return true;
      case AlertMode.Watch:
        return !!state.board;
      case AlertMode.CheckedIn:
        return isCheckedIn();
      default:
        return false;
    }
  }
  function setBoard(board) {
    if (!board || board.is_finished || board.status !== "active") {
      clearChainWatchCache();
      state.board = null;
      state.watchId = null;
      state.watches = [];
      state.lastListAt = 0;
      return;
    }
    state.board = board;
    const selected = state.ui.selectedSlot;
    if (selected && !board.slots.some((slot) => slot.slot_start_iso === selected)) {
      state.ui.selectedSlot = null;
    }
  }
  function setFlash(text, error = false) {
    state.flash = { text, error, until: Date.now() + (error ? 7e3 : 4e3) };
  }
  function setRegion(name, html) {
    if (renderedHtml[name] === html) return;
    renderedHtml[name] = html;
    const region = regions[name];
    const active = document.activeElement;
    const typing = active && region.contains(active) && active.dataset.role === "member-search" ? [active.selectionStart, active.selectionEnd] : null;
    region.innerHTML = html;
    if (typing) {
      const input = region.querySelector('[data-role="member-search"]');
      if (input) {
        input.focus();
        input.setSelectionRange(typing[0], typing[1]);
      }
    }
  }
  function render() {
    if (!root || !root.isConnected) return;
    const now = Date.now();
    const prefs4 = getPrefs();
    const bar2 = renderBar({
      board: state.board,
      watches: state.watches,
      prefs: prefs4,
      armed: isArmed(),
      chainActive: state.chainActive,
      flash: state.flash,
      busy: state.busy,
      now
    });
    setRegion("bar", bar2.html);
    root.className = "nfh-cw" + (bar2.tone ? ` nfh-cw--${bar2.tone}` : "");
    const showPanel = !!state.board && prefs4.expanded;
    regions.panel.hidden = !showPanel;
    if (showPanel) {
      setRegion(
        "panel",
        renderPanel({ board: state.board, prefs: prefs4, ui: state.ui, busy: state.busy, now })
      );
    }
    regions.settings.hidden = !state.settingsOpen;
  }
  function renderSettingsRegion() {
    regions.settings.innerHTML = renderSettings({
      prefs: getPrefs(),
      legacyScript: !!document.getElementById("JoxDiv")
    });
  }
  async function refreshBoard() {
    if (state.loading || state.watchId === null) return;
    state.loading = true;
    state.lastFetchAt = Date.now();
    try {
      setBoard(await fetchBoard(state.watchId));
    } catch (error) {
      LogInfo("Chain watch board fetch failed:", error);
      if (error && (error.status === 403 || error.status === 404)) {
        setBoard(null);
      }
    } finally {
      state.loading = false;
      render();
    }
  }
  async function load({ force = false } = {}) {
    state.lastListAt = Date.now();
    state.watches = await getActiveWatches({ force });
    if (!state.watches.some((watch5) => watch5.id === state.watchId)) {
      state.watchId = state.watches.length ? state.watches[0].id : null;
      state.board = null;
    }
    if (state.watchId === null) {
      state.board = null;
      render();
      return;
    }
    const cached = cachedBoard(state.watchId);
    if (cached && cached.timestamp > state.lastFetchAt) {
      state.lastFetchAt = cached.timestamp;
      setBoard(cached.board);
    }
    render();
    if (state.watchId !== null && (force || Date.now() - state.lastFetchAt > BOARD_FRESH_MS)) {
      await refreshBoard();
    }
  }
  function pollDue(now) {
    if (document.hidden || root.offsetParent === null || state.loading || state.busy) {
      return false;
    }
    if (state.watchId === null) {
      return now - state.lastListAt > LIST_RECHECK_MS;
    }
    const sinceHour = now % HOUR_MS2;
    if (sinceHour > 2e4 && state.lastFetchAt < now - sinceHour) {
      return true;
    }
    let interval = POLL_IDLE_MS;
    if (getPrefs().expanded) {
      interval = POLL_EXPANDED_MS;
    } else if (isCheckedIn() || state.board && state.board.slots.some((slot) => slot.signups.some((signup) => signup.is_me))) {
      interval = POLL_ENGAGED_MS;
    }
    return now - state.lastFetchAt > interval;
  }
  function tick() {
    if (!root || !root.isConnected) {
      stop();
      return;
    }
    const now = Date.now();
    const timer3 = readChainTimer();
    updateAlert({ timer: timer3, armed: isArmed(), test: now < state.testUntil });
    const chainActive = !!timer3 && timer3.active;
    if (chainActive !== state.chainActive) {
      state.chainActive = chainActive;
      render();
    } else if (state.flash && now > state.flash.until) {
      state.flash = null;
      render();
    } else if (++tickCount % 15 === 0) {
      render();
    }
    if (pollDue(now)) {
      if (state.watchId === null) {
        load();
      } else {
        refreshBoard();
      }
    }
  }
  function stop() {
    clearInterval(ticker);
    ticker = null;
    root = null;
    stopAlert();
  }
  async function act(work, successText, failureText) {
    if (state.busy || state.watchId === null) return;
    state.busy = true;
    render();
    try {
      const board = await work(state.watchId);
      if (board) {
        state.lastFetchAt = Date.now();
        setBoard(board);
      }
      setFlash(successText);
    } catch (error) {
      LogInfo("Chain watch action failed:", error);
      setFlash(errorMessage(error, failureText), true);
    } finally {
      state.busy = false;
      render();
    }
  }
  function markSearchResult(playerId, checkedIn) {
    for (const member of state.ui.searchResults || []) {
      if (Number(member.player_id) === playerId) member.checked_in = checkedIn;
    }
  }
  function onClick(event) {
    const target = event.target.closest("[data-action]");
    if (!target || !root.contains(target)) return;
    const { action } = target.dataset;
    switch (action) {
      case "toggle":
        if (!state.board) return;
        setPrefs({ expanded: !getPrefs().expanded });
        render();
        if (getPrefs().expanded && Date.now() - state.lastFetchAt > BOARD_FRESH_MS) {
          refreshBoard();
        }
        break;
      case "settings":
        state.settingsOpen = !state.settingsOpen;
        if (state.settingsOpen) renderSettingsRegion();
        render();
        break;
      case "test-alert":
        state.testUntil = Date.now() + TEST_ALERT_MS;
        updateAlert({ timer: readChainTimer(), armed: isArmed(), test: true });
        break;
      case "refresh":
        load({ force: true });
        break;
      case "slot":
        state.ui.selectedSlot = state.ui.selectedSlot === target.dataset.slot ? null : target.dataset.slot;
        render();
        break;
      case "checkin":
        act((id) => checkIn(id), "You are checked in.", "Could not check you in.");
        break;
      case "checkout":
        act(
          (id) => checkOut(id),
          "You are checked out. Thanks for watching!",
          "Could not check you out."
        );
        break;
      case "stay": {
        const checkinId = target.dataset.checkin;
        act(
          async (id) => {
            await respondToPrompt(id, checkinId, "stay");
            return fetchBoard(id);
          },
          "Thanks, you stay checked in.",
          "Could not record your answer."
        );
        break;
      }
      case "staff-in":
      case "staff-out": {
        const playerId = Number(target.dataset.player);
        const checkingIn = action === "staff-in";
        act(
          async (id) => {
            const board = await (checkingIn ? checkIn(id, playerId) : checkOut(id, playerId));
            markSearchResult(playerId, checkingIn);
            return board;
          },
          checkingIn ? "Member checked in." : "Member checked out.",
          "Could not update their check-in."
        );
        break;
      }
      case "signup": {
        const { slot } = target.dataset;
        act(
          (id) => claimSlot(id, slot, getPrefs().dmReminder),
          `Signed up for ${slotLabel(Date.parse(slot))} TCT.`,
          "Could not sign you up."
        );
        break;
      }
      case "leave": {
        const { slot } = target.dataset;
        act(
          (id) => leaveSlot(id, slot),
          `You left ${slotLabel(Date.parse(slot))} TCT.`,
          "Could not remove your signup."
        );
        break;
      }
      case "test-dm":
        act(
          async (id) => {
            await sendTestDm(id);
          },
          "Test sent. Check your Discord DMs.",
          "Could not send a test notification."
        );
        break;
    }
  }
  function runSearch(query) {
    searchTimer = setTimeout(async () => {
      const watchId = state.watchId;
      state.ui.searchLoading = true;
      render();
      try {
        const results = await searchMembers(watchId, query);
        if (state.ui.searchQuery.trim() === query) {
          state.ui.searchResults = results;
        }
      } catch (error) {
        state.ui.searchResults = null;
        setFlash(errorMessage(error, "Could not search the faction members."), true);
      } finally {
        state.ui.searchLoading = false;
        render();
      }
    }, 350);
  }
  function onInput(event) {
    const target = event.target;
    if (target.dataset.role === "member-search") {
      state.ui.searchQuery = target.value;
      clearTimeout(searchTimer);
      const query = target.value.trim();
      if (query.length < 2) {
        if (state.ui.searchResults) {
          state.ui.searchResults = null;
          render();
        }
        return;
      }
      runSearch(query);
      return;
    }
    switch (target.dataset.pref) {
      case "opacity":
      case "volume":
        setPrefs({ [target.dataset.pref]: Number(target.value) / 100 });
        break;
      case "color":
        setPrefs({ color: target.value });
        break;
    }
  }
  function onChange(event) {
    const target = event.target;
    if (target.dataset.role === "watch-picker") {
      state.watchId = Number(target.value);
      state.board = null;
      state.lastFetchAt = 0;
      state.ui = { selectedSlot: null, searchQuery: "", searchResults: null, searchLoading: false };
      load();
      return;
    }
    switch (target.dataset.pref) {
      case "alertMode":
        setPrefs({ alertMode: target.value });
        renderSettingsRegion();
        regions.settings.querySelector('[data-pref="alertMode"]').focus();
        break;
      case "pace":
        setPrefs({ pace: target.value });
        break;
      case "alertSeconds": {
        const seconds = parseAlertTime(target.value);
        if (seconds !== null) setPrefs({ alertSeconds: seconds });
        target.value = formatAlertTime(getPrefs().alertSeconds);
        target.classList.toggle("is-invalid", seconds === null);
        break;
      }
      case "beep":
      case "markWall":
      case "dmReminder":
        setPrefs({ [target.dataset.pref]: target.checked });
        applyWallMarking();
        break;
      default:
        return;
    }
    render();
  }
  function mount(anchor) {
    root = document.createElement("div");
    root.id = ROOT_ID;
    root.className = "nfh-cw";
    root.innerHTML = '<div class="nfh-cw-bar"></div><div class="nfh-cw-settings" hidden></div><div class="nfh-cw-panel" hidden></div>';
    regions = {
      bar: root.querySelector(".nfh-cw-bar"),
      settings: root.querySelector(".nfh-cw-settings"),
      panel: root.querySelector(".nfh-cw-panel")
    };
    renderedHtml = {};
    state.settingsOpen = false;
    root.addEventListener("click", onClick);
    root.addEventListener("input", onInput);
    root.addEventListener("change", onChange);
    anchor.insertAdjacentElement("afterend", root);
    if (state.watchId === null) {
      state.watches = cachedWatches();
      state.watchId = state.watches.length ? state.watches[0].id : null;
    }
    if (state.watchId !== null && !state.board) {
      const cached = cachedBoard(state.watchId);
      if (cached) {
        state.lastFetchAt = cached.timestamp;
        setBoard(cached.board);
      }
    }
    render();
    if (!ticker) {
      ticker = setInterval(tick, 1e3);
    }
    load();
    LogInfo("Chain watch bar inserted");
  }
  function init() {
    applyWallMarking();
    if (!isOwnFactionMainTab()) return;
    ensureInjected({
      containerSelector: ANCHOR_SELECTOR,
      isPresent: () => !!document.getElementById(ROOT_ID),
      inject: mount
    });
  }
  var chain_watch_default = {
    name: "chain-watch",
    pages: [PageType.Faction],
    init
  };

  // src/features/connect.js
  var BANNER_ID = "nfh-connect-banner";
  var NOTE_CLASS = "nfh-connect-note";
  var PENDING_KEY = "nfhConnectPending";
  var HIDDEN_KEY = "nfhConnectBannerHidden";
  var HIDE_FOR_MS = 24 * 60 * 60 * 1e3;
  var POLL_MS = 4e3;
  var RELOAD_AFTER_MS = 1500;
  var NOTE_HOSTS = [
    { selector: "#faction-crimes-root", place: "beforebegin" },
    { selector: "#nfh-chain-watch", place: "afterend" },
    { selector: "#nfh-war-bar", place: "afterend" },
    { selector: ".nfh-shitlist-profile", place: "beforeend" }
  ];
  var phase = null;
  var pollTimer = null;
  var STATE_TEXT = {
    [Connection.Missing]: "<strong>Nuke Family Helper is not connected</strong> to nuke.family, so most of it is switched off.",
    [Connection.Rejected]: "<strong>Nuke Family Helper has been disconnected:</strong> nuke.family no longer accepts this device's key, so most of it is switched off.",
    [Connection.Unreachable]: "<strong>Nuke Family Helper cannot reach nuke.family</strong> right now, so what it shows may be missing or out of date."
  };
  var NOTE_TEXT = {
    [Connection.Missing]: "Nuke Family Helper is not connected to nuke.family, so this may be missing or out of date.",
    [Connection.Rejected]: "Nuke Family Helper has been disconnected from nuke.family, so this may be missing or out of date.",
    [Connection.Unreachable]: "Nuke Family Helper cannot reach nuke.family right now: this may be missing or out of date."
  };
  var canConnect = (state8) => state8 === Connection.Missing || state8 === Connection.Rejected;
  function pending() {
    const saved2 = getValue(PENDING_KEY, null);
    if (!saved2 || typeof saved2 !== "object" || !saved2.secret || !saved2.url) return null;
    return saved2.expires > Date.now() ? saved2 : null;
  }
  function isHidden(state8) {
    try {
      const hidden = JSON.parse(localStorage.getItem(HIDDEN_KEY) || "null");
      return Boolean(hidden) && hidden.state === state8 && Date.now() - hidden.at < HIDE_FOR_MS;
    } catch (e) {
      return false;
    }
  }
  function bannerHtml(state8) {
    const button3 = (attribute, label) => `<button type="button" class="torn-btn" ${attribute}>${label}</button>`;
    const dismiss = '<button type="button" class="nfh-connect-dismiss" data-nfh-connect-dismiss aria-label="Hide" title="Hide for a day">&times;</button>';
    if (phase && phase.kind === "connected") {
      const who = phase.name ? ` as <strong>${escapeHtml(phase.name)}</strong>` : "";
      return `<span class="nfh-connect-text">Nuke Family Helper is connected${who}. Reloading the page...</span>`;
    }
    if (phase && phase.kind === "starting") {
      return '<span class="nfh-connect-text">Asking nuke.family for a connection...</span>';
    }
    if (phase && phase.kind === "waiting") {
      return `<span class="nfh-connect-text"><strong>Finish connecting on nuke.family.</strong> Approve there, then come back: this page picks it up by itself.</span><a class="torn-btn nfh-connect-link" href="${escapeHtml(phase.url)}" target="_blank" rel="noopener" data-nfh-connect-open>Open nuke.family</a>` + button3("data-nfh-connect-cancel", "Cancel");
    }
    const failed = phase && phase.kind === "failed" ? ` <span class="nfh-connect-error">${escapeHtml(phase.message)}</span>` : "";
    const actions = canConnect(state8) ? button3("data-nfh-connect", state8 === Connection.Rejected ? "Reconnect" : "Connect") + '<button type="button" class="nfh-connect-manual" data-nfh-connect-manual>Enter a key instead</button>' : "";
    return `<span class="nfh-connect-text">${STATE_TEXT[state8]}${failed}</span>${actions}${dismiss}`;
  }
  function renderBanner() {
    const state8 = connectionState();
    const busy2 = phase !== null && phase.kind !== "failed";
    const show = busy2 || state8 !== Connection.Connected && !isHidden(state8);
    let banner = document.getElementById(BANNER_ID);
    if (!show) {
      if (banner) banner.remove();
      return;
    }
    if (!banner) {
      banner = document.createElement("div");
      banner.id = BANNER_ID;
      banner.className = "nfh-connect-banner";
      banner.setAttribute("role", "status");
      document.body.prepend(banner);
    }
    const html = bannerHtml(state8);
    if (banner.__nfhHtml !== html) {
      banner.innerHTML = html;
      banner.__nfhHtml = html;
    }
    banner.classList.toggle("nfh-connect-banner--ok", Boolean(phase && phase.kind === "connected"));
  }
  function renderNotes() {
    const state8 = connectionState();
    const text = NOTE_TEXT[state8];
    for (const host of NOTE_HOSTS) {
      const element = document.querySelector(host.selector);
      if (!element) continue;
      const sibling = host.place === "beforebegin" ? element.previousElementSibling : host.place === "afterend" ? element.nextElementSibling : null;
      let note = host.place === "beforeend" ? element.querySelector(`:scope > .${NOTE_CLASS}`) : sibling && sibling.classList.contains(NOTE_CLASS) ? sibling : null;
      if (!text) {
        if (note) note.remove();
        continue;
      }
      if (!note) {
        note = document.createElement("div");
        note.className = NOTE_CLASS;
        element.insertAdjacentElement(host.place, note);
      }
      const html = `<span>${text}</span>` + (canConnect(state8) ? ' <button type="button" class="nfh-connect-note-link" data-nfh-connect>Connect</button>' : "");
      if (note.__nfhHtml !== html) {
        note.innerHTML = html;
        note.__nfhHtml = html;
      }
    }
  }
  function render2() {
    renderBanner();
    renderNotes();
  }
  function renderSoon() {
    render2();
    for (const delay of [800, 2500, 6e3]) setTimeout(renderNotes, delay);
  }
  function stopPolling() {
    clearTimeout(pollTimer);
    pollTimer = null;
  }
  function fail(message) {
    stopPolling();
    setValue(PENDING_KEY, null);
    phase = { kind: "failed", message };
    render2();
  }
  function schedulePoll() {
    stopPolling();
    if (!document.hidden) pollTimer = setTimeout(poll, POLL_MS);
  }
  var polling = false;
  async function poll() {
    const waiting = pending();
    if (!waiting) {
      if (phase && phase.kind === "waiting") fail("That attempt ran out of time. Press Connect to try again.");
      return;
    }
    if (polling) return;
    polling = true;
    try {
      const reply = await publicApi("/script/connect/token", { method: "POST", data: { secret: waiting.secret } });
      if (reply && reply.status === "connected" && reply.token) {
        stopPolling();
        setValue(PENDING_KEY, null);
        phase = { kind: "connected", name: reply.player && reply.player.name };
        setApiToken(reply.token);
        render2();
        setTimeout(() => window.location.reload(), RELOAD_AFTER_MS);
        return;
      }
      schedulePoll();
    } catch (error) {
      if (error instanceof ApiError && (error.status === 404 || error.status === 410)) {
        fail(error.body && error.body.error || "That attempt can no longer be used. Press Connect to try again.");
      } else {
        schedulePoll();
      }
    } finally {
      polling = false;
    }
  }
  function wait(connection) {
    phase = { kind: "waiting", url: connection.url };
    render2();
    schedulePoll();
  }
  async function startConnect() {
    if (phase && (phase.kind === "starting" || phase.kind === "connected")) return;
    let tab = null;
    if (!isPda) {
      try {
        tab = window.open("", "_blank");
      } catch (e) {
        tab = null;
      }
    }
    phase = { kind: "starting" };
    render2();
    try {
      const playerId = Number(getUserscriptUsersPlayerId()) || null;
      const reply = await publicApi("/script/connect", {
        method: "POST",
        data: { client: isPda ? "TornPDA" : "browser", player_id: playerId }
      });
      if (!reply || !reply.secret || !reply.url) throw new Error("unexpected reply");
      const connection = { secret: reply.secret, url: reply.url, expires: Date.now() + (reply.expires_in || 900) * 1e3 };
      setValue(PENDING_KEY, connection);
      if (tab) tab.location.href = connection.url;
      wait(connection);
    } catch (error) {
      if (tab) tab.close();
      const busy2 = error instanceof ApiError && error.status === 429;
      fail(
        busy2 ? "Too many attempts from here. Wait a few minutes and try again." : "Could not reach nuke.family to start. Check your connection and try again."
      );
    }
  }
  async function enterKeyByHand() {
    const typed = prompt(
      "Paste your Nuke Family key (about 50 characters, made on nuke.family under your user settings).\n\nThis is NOT your Torn API key."
    );
    const key = (typed || "").trim();
    if (!key) return false;
    if (/^[A-Za-z0-9]{16}$/.test(key)) {
      alert(
        "That looks like a Torn API key. The script needs a Nuke Family key here, which is much longer.\n\nThe easy way: press Connect instead. nuke.family will ask for your Torn key there and connect the script for you."
      );
      return false;
    }
    try {
      await api("/user/get-own-roles", { token: key, feature: "connect" });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        alert("nuke.family did not accept that key, so it was not saved. Check you copied all of it, or press Connect instead.");
        return false;
      }
      alert("nuke.family could not be reached to check that key. It has been saved; if things still do not load, press Connect instead.");
      setApiToken(key);
      return true;
    }
    setApiToken(key);
    alert("Nuke Family key saved. Reload the page to load everything with it.");
    return true;
  }
  function onClick2(event) {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (target.closest("[data-nfh-connect]")) {
      event.preventDefault();
      startConnect();
    } else if (target.closest("[data-nfh-connect-manual]")) {
      enterKeyByHand().then((saved2) => {
        if (saved2) window.location.reload();
      });
    } else if (target.closest("[data-nfh-connect-cancel]")) {
      stopPolling();
      setValue(PENDING_KEY, null);
      phase = null;
      render2();
    } else if (target.closest("[data-nfh-connect-open]")) {
      setTimeout(poll, 1e3);
    } else if (target.closest("[data-nfh-connect-dismiss]")) {
      try {
        localStorage.setItem(HIDDEN_KEY, JSON.stringify({ state: connectionState(), at: Date.now() }));
      } catch (e) {
      }
      phase = null;
      render2();
    }
  }
  var started = false;
  function initConnect() {
    if (started || window.top !== window.self) return;
    started = true;
    document.addEventListener("click", onClick2);
    onConnectionChange(render2);
    onNavigate(renderSoon);
    const resume = () => {
      if (!document.hidden && pending() && connectionState() !== Connection.Connected) poll();
    };
    document.addEventListener("visibilitychange", resume);
    window.addEventListener("focus", resume);
    const waiting = canConnect(connectionState()) ? pending() : null;
    if (waiting) {
      wait(waiting);
      poll();
    }
    renderSoon();
  }

  // src/core/settings.js
  var SettingsManager = {
    getHiddenCategories: () => {
      try {
        return JSON.parse(
          getItem("hiddenShitlistCategories") || "[]"
        );
      } catch (e) {
        console.error("Error parsing hidden categories:", e);
        return [];
      }
    },
    setHiddenCategories: (hiddenIds) => {
      setItem("hiddenShitlistCategories", JSON.stringify(hiddenIds));
    },
    isCategoryVisible: (categoryId, isFaction) => {
      if (isFaction) return true;
      return !SettingsManager.getHiddenCategories().includes(String(categoryId));
    },
    toggleCategory: (categoryId, isVisible) => {
      const hidden = SettingsManager.getHiddenCategories();
      LogInfo("Hidden categories before toggle:", hidden);
      let updated;
      if (isVisible) {
        updated = hidden.filter((id) => id !== categoryId);
      } else {
        if (!hidden.includes(String(categoryId))) {
          updated = [...hidden, String(categoryId)];
        } else {
          updated = hidden;
        }
      }
      SettingsManager.setHiddenCategories(updated);
      return updated;
    },
    // The "Nuke Family Reputation" box on profiles. It holds the "Check
    // Recruiting Score" button, so a member who may use that always gets it.
    // Anyone else chooses; until they do, it shows unless their faction is known
    // not to revive.
    isReputationLocked: () => cachedPermissions()?.includes(RECRUITING_PERMISSION) === true,
    isReputationVisible: () => {
      if (SettingsManager.isReputationLocked()) return true;
      let stored = null;
      try {
        stored = getItem("nfhShowReputation");
      } catch (e) {
      }
      if (stored !== null) return stored === "true";
      return inRevivingFaction() !== false;
    },
    setReputationVisible: (isVisible) => {
      setItem("nfhShowReputation", String(isVisible));
    },
    // The "Active Contract" box on profiles. A reviver needs it, so a member of a
    // reviving faction always gets it; anyone else gets it only if they turned
    // it on. Until the site has said which they are, it shows.
    isActiveContractLocked: () => inRevivingFaction() === true,
    isActiveContractVisible: () => {
      const reviving = inRevivingFaction();
      if (reviving !== false) return true;
      try {
        return getItem("nfhShowActiveContract") === "true";
      } catch (e) {
        return false;
      }
    },
    setActiveContractVisible: (isVisible) => {
      setItem("nfhShowActiveContract", String(isVisible));
    }
  };

  // src/core/synced-store.js
  function createSyncedStore({
    storageKey,
    dataField,
    emptyValue,
    serverField,
    fallbackTtlMs,
    fetcher,
    // Whether anything uses the store right now. While false it is never
    // fetched; its old copy goes stale, so it is fetched once it is wanted again.
    enabled = () => true
  }) {
    let data = emptyValue;
    let timestamp = 0;
    const listeners2 = [];
    const store = {
      storageKey,
      serverField,
      fallbackTtlMs,
      get data() {
        return data;
      },
      get timestamp() {
        return timestamp;
      },
      // Register a callback invoked with the fresh data after every successful
      // refresh. Several features can listen to one store (e.g. the profile
      // page and hospital rows both render the shitlist); registering after
      // construction avoids circular imports between data and UI modules.
      subscribe(listener) {
        listeners2.push(listener);
      },
      // Load previously cached data from localStorage. Corrupt entries are
      // discarded (the next refresh repopulates them) instead of alerting.
      load() {
        try {
          const saved2 = JSON.parse(localStorage.getItem(storageKey) || "null");
          if (saved2 && typeof saved2 === "object") {
            data = saved2[dataField] ?? emptyValue;
            timestamp = saved2.timestamp || 0;
          }
        } catch (error) {
          console.error(`Error loading cached ${storageKey}:`, error);
          localStorage.removeItem(storageKey);
        }
        LogInfo(`Loaded ${storageKey} from cache:`, data);
      },
      isStale(now = Date.now()) {
        return !timestamp || now - timestamp > fallbackTtlMs;
      },
      // Fetch fresh data. When triggered by a server timestamp mismatch the
      // server's timestamp (seconds) is stored so future comparisons line up;
      // otherwise the current time is used (time-based fallback).
      async refresh(serverTimestampSec = null) {
        if (!enabled()) {
          LogInfo(`${storageKey} not in use, not fetched`);
          return;
        }
        try {
          data = await fetcher();
          timestamp = serverTimestampSec ? serverTimestampSec * 1e3 : Date.now();
          localStorage.setItem(
            storageKey,
            JSON.stringify({ [dataField]: data, timestamp })
          );
          LogInfo(`${storageKey} updated and stored with timestamp:`, timestamp);
          for (const listener of listeners2) {
            try {
              listener(data);
            } catch (error) {
              console.error(`Listener for ${storageKey} failed:`, error);
            }
          }
        } catch (error) {
          console.error(`Error refreshing ${storageKey}:`, error);
        }
      }
    };
    return store;
  }

  // src/features/contracts.js
  var contractsStore = createSyncedStore({
    storageKey: "contractCoverage",
    dataField: "coverage",
    emptyValue: [],
    serverField: "contract_cache_last_update",
    fallbackTtlMs: 6 * 60 * 60 * 1e3,
    // 6 hours
    fetcher: async () => (await api("/contracts/active-coverage")).coverage || [],
    // The profile box and the hospital colours are the only uses, and the
    // setting turns both off.
    enabled: () => SettingsManager.isActiveContractVisible()
  });
  contractsStore.subscribe(() => maybeInsertActiveContract());
  onUserRoleRefreshed(() => applyActiveContractSetting());
  var settingListeners = [];
  function onActiveContractSettingChanged(listener) {
    settingListeners.push(listener);
  }
  function applyActiveContractSetting() {
    if (SettingsManager.isActiveContractVisible()) {
      if (contractsStore.isStale()) contractsStore.refresh();
      maybeInsertActiveContract();
    } else {
      document.querySelector(".nfh-active-contract")?.remove();
    }
    for (const listener of settingListeners) listener();
  }
  function findActiveContract(factionId, playerId) {
    const coverage = contractsStore.data;
    if (!Array.isArray(coverage) || coverage.length === 0) {
      return null;
    }
    const now = /* @__PURE__ */ new Date();
    const match = coverage.find((entry) => {
      const contract = entry.contract || {};
      const factionMatches = entry.faction_id == null || factionId && entry.faction_id == factionId;
      const playerMatches = !Array.isArray(entry.player_ids) || entry.player_ids.some((id) => String(id) === String(playerId));
      const startDate = parseApiUtcDate(contract.contract_start_date);
      const endDate = parseApiUtcDate(contract.contract_end_date);
      const dateValid = startDate <= now && (!endDate || endDate > now);
      return factionMatches && playerMatches && dateValid;
    });
    return match ? match.contract : null;
  }
  function maybeInsertActiveContract() {
    if (!IsPage(PageType.Profile) || !SettingsManager.isActiveContractVisible()) {
      return;
    }
    LogInfo("Waiting for faction info to load before checking contracts...");
    waitForElm(
      "div.basic-information.profile-left-wrapper.left > div > div.cont.bottom-round > div > ul"
    ).then(() => {
      LogInfo("Checking for active contract...");
      const activeContract = findActiveContract(getFactionId(), getPlayerId());
      if (activeContract) {
        LogInfo("Inserting active contract section:", activeContract);
        insertActiveContractSection(activeContract);
      }
    });
  }
  function insertActiveContractSection(contract) {
    if (document.querySelector(".nfh-active-contract")) {
      return;
    }
    waitForElm("div.profile-left-wrapper").then((elm) => {
      if (document.querySelector(".nfh-active-contract")) {
        return;
      }
      const activeContractDiv = document.createElement("div");
      activeContractDiv.classList.add(
        "nfh-active-contract",
        "nfh-section",
        "m-top10"
      );
      activeContractDiv.appendChild(document.createElement("div"));
      const activeContractTitle = document.createElement("p");
      activeContractTitle.innerText = "Active Contract";
      activeContractTitle.classList.add(
        "nfh-active-contract-title",
        "nfh-section-title",
        "title-black",
        "top-round"
      );
      const contractInfoContainer = buildContractInfoContainer(contract);
      activeContractDiv.appendChild(activeContractTitle);
      activeContractDiv.appendChild(contractInfoContainer);
      const firstChild = elm.firstChild;
      if (firstChild && firstChild.nextSibling) {
        elm.insertBefore(activeContractDiv, firstChild.nextSibling);
      } else {
        elm.appendChild(activeContractDiv);
      }
    });
  }
  function buildContractInfoContainer(contract) {
    const contractInfoContainer = document.createElement("div");
    contractInfoContainer.classList.add(
      "nfh-active-contract-container",
      "nfh-section-container"
    );
    const contractInfoList = document.createElement("ul");
    contractInfoList.classList.add(
      "nfh-active-contract-list",
      "nfh-section-list"
    );
    const rules = Array.isArray(contract.rules) ? contract.rules : [];
    const items = rules.length > 1 ? rules.map((rule, index) => [`Rule ${index + 1}`, rule]) : [
      [
        "Minimum Revive Chance",
        `${contract.rule_revive_chance_percentage}%`
      ],
      [
        "Player Status",
        contract.rule_player_status.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase())
      ],
      ["Online Required", contract.rule_is_online ? "Yes" : "No"],
      ["Idle Allowed", contract.rule_is_away ? "Yes" : "No"],
      ["Offline Allowed", contract.rule_is_offline ? "Yes" : "No"]
    ];
    items.push(
      ["Premium Contract", contract.is_premium ? "Yes" : "No"],
      [
        "Start Date",
        parseApiUtcDate(contract.contract_start_date).toLocaleString()
      ]
    );
    if (contract.note) {
      items.push(["Note", contract.note]);
    }
    for (const [key, value] of items) {
      const li = document.createElement("li");
      li.innerHTML = `<span class="nfh-list-key">${escapeHtml(key)}:</span><span class="nfh-list-value">${escapeHtml(value)}</span>`;
      contractInfoList.appendChild(li);
    }
    contractInfoContainer.appendChild(contractInfoList);
    return contractInfoContainer;
  }
  var contracts_default = {
    name: "contracts",
    pages: [PageType.Profile],
    init: maybeInsertActiveContract
  };

  // src/features/organized-crimes/data.js
  var ocConfigStore = createSyncedStore({
    storageKey: "nfhOcConfig",
    dataField: "config",
    emptyValue: null,
    serverField: "oc_config_cache_last_update",
    fallbackTtlMs: 6 * 60 * 60 * 1e3,
    // 6 hours
    fetcher: async () => {
      try {
        return (await api("/oc/config")).data || null;
      } catch (error) {
        if (error instanceof ApiError && error.status === 403) return null;
        throw error;
      }
    }
  });

  // src/features/organized-crimes/catalog.js
  function keyFor(name) {
    return String(name).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
  }
  function findRole(config, crimeName2, roleName) {
    if (!config || !Array.isArray(config.crimes)) return null;
    const crimeKey = keyFor(crimeName2);
    const crime = config.crimes.find((entry) => entry.key === crimeKey);
    if (!crime) return null;
    const roleKey = keyFor(roleName);
    return (crime.roles || []).find((role) => role.key === roleKey) || null;
  }

  // src/features/organized-crimes/remote.js
  var CPR_KEY = "nfhOcCprs";
  var BOARD_KEY2 = "nfhOcBoard";
  var UPLOAD_DELAY_MS = 4e3;
  var BOARD_FRESH_MS2 = 60 * 1e3;
  var BOARD_RETRY_MS = 30 * 1e3;
  function readJson2(key) {
    try {
      return JSON.parse(localStorage.getItem(key) || "null");
    } catch (e) {
      return null;
    }
  }
  function cprState() {
    const state8 = readJson2(CPR_KEY);
    return state8 && state8.known && state8.sent ? state8 : { known: {}, sent: {} };
  }
  var pending2 = /* @__PURE__ */ new Map();
  var uploadTimer = null;
  async function upload() {
    uploadTimer = null;
    const batch = [...pending2.entries()];
    pending2 = /* @__PURE__ */ new Map();
    if (batch.length === 0) return;
    try {
      await api("/oc/cpr", { method: "POST", data: { cprs: batch.map(([, entry]) => entry) } });
      const state8 = cprState();
      for (const [key, entry] of batch) state8.sent[key] = entry.cpr;
      localStorage.setItem(CPR_KEY, JSON.stringify(state8));
      LogInfo(`OC Assistant sent ${batch.length} CPRs`);
    } catch (error) {
      console.error("[NFH] Could not send CPRs to nuke.family:", error);
    }
  }
  function learnCprs(crimes) {
    const state8 = cprState();
    let changed = false;
    for (const crime of crimes) {
      for (const slot of crime.slots) {
        if (slot.occupied || slot.cpr === null) continue;
        const key = `${keyFor(crime.name)}|${keyFor(slot.name)}`;
        if (state8.known[key] !== slot.cpr) {
          state8.known[key] = slot.cpr;
          changed = true;
        }
        if (state8.sent[key] !== slot.cpr) {
          pending2.set(key, { crime: crime.name, role: slot.name, cpr: slot.cpr });
        }
      }
    }
    if (changed) localStorage.setItem(CPR_KEY, JSON.stringify(state8));
    if (pending2.size > 0 && !uploadTimer) uploadTimer = setTimeout(upload, UPLOAD_DELAY_MS);
  }
  function knownCpr(board, crimeName2, roleName) {
    const crimeKey = keyFor(crimeName2);
    const roleKey = keyFor(roleName);
    const local = cprState().known[`${crimeKey}|${roleKey}`];
    const remote = board && board.me && board.me.cprs && board.me.cprs[crimeKey];
    const known = [local, remote ? remote[roleKey] : void 0].filter((cpr) => typeof cpr === "number");
    return known.length > 0 ? Math.max(...known) : null;
  }
  var SPAWN_KEY = "nfhOcSpawnAsked";
  function spawnAskedUntil() {
    const saved2 = readJson2(SPAWN_KEY);
    return saved2 && saved2.until > Date.now() ? saved2.until : 0;
  }
  async function requestSpawn() {
    try {
      const response = await api("/oc/spawn-request", { method: "POST", data: {} });
      const minutes = response.cooldown_minutes || 30;
      localStorage.setItem(SPAWN_KEY, JSON.stringify({ until: Date.now() + minutes * 60 * 1e3 }));
      return { ok: true, message: `Staff have been asked for a level ${response.tier} crime.` };
    } catch (error) {
      const reason = error && error.body && error.body.error;
      if (error && error.status === 429) {
        localStorage.setItem(SPAWN_KEY, JSON.stringify({ until: Date.now() + 30 * 60 * 1e3 }));
      }
      return { ok: false, message: reason || "Could not reach nuke.family. Try again in a minute." };
    }
  }
  function cachedBoard2() {
    const cached = readJson2(BOARD_KEY2);
    return cached && cached.board ? cached : null;
  }
  var boardRequest = null;
  var lastBoardAttempt = 0;
  function refreshBoard2(force = false) {
    const cached = cachedBoard2();
    const now = Date.now();
    if (!force && cached && now - cached.fetchedAt < BOARD_FRESH_MS2) return Promise.resolve(false);
    if (boardRequest) return boardRequest;
    if (now - lastBoardAttempt < BOARD_RETRY_MS) return Promise.resolve(false);
    lastBoardAttempt = now;
    boardRequest = api("/oc/board").then((response) => {
      localStorage.setItem(BOARD_KEY2, JSON.stringify({ board: response.data, fetchedAt: Date.now() }));
      return true;
    }).catch((error) => {
      console.error("[NFH] Could not load the OC board from nuke.family:", error);
      return false;
    }).finally(() => {
      boardRequest = null;
    });
    return boardRequest;
  }
  function offPageCrimes(board, pageCrimes) {
    if (!board || !Array.isArray(board.crimes)) return [];
    const onPage = new Set(pageCrimes.map((crime) => String(crime.id)));
    return board.crimes.filter((crime) => crime.status === "Recruiting" && !onPage.has(String(crime.id))).filter((crime) => crime.slots.some((slot) => slot.player_id === null)).map((crime) => ({
      id: String(crime.id),
      name: crime.name,
      level: crime.level,
      offPage: true,
      slots: crime.slots.map((slot) => ({
        name: slot.role,
        occupied: slot.player_id !== null,
        progress: slot.progress || 0,
        cpr: slot.player_id !== null ? slot.cpr : knownCpr(board, crime.name, slot.role)
      }))
    }));
  }

  // src/features/organized-crimes/scoring.js
  var PLANNING_HOURS = 24;
  var SlotStatus = {
    Filled: "filled",
    // someone is in it
    Eligible: "eligible",
    // open, and the viewer meets the minimum
    Below: "below",
    // open, but the viewer's CPR is under the minimum
    Unrated: "unrated"
    // open, but the viewer's CPR for it is not known
  };
  var Rank = { Best: "best", Good: "good" };
  var GOOD_SLOTS = 2;
  function memberFeatures(config) {
    const settings = config && config.settings || {};
    const enabled = settings.assistant_enabled !== false;
    const suggest = enabled && settings.suggest_slots !== false;
    const warn = enabled && settings.warn_poor_slot !== false;
    return {
      enabled,
      suggest,
      warn,
      minimums: enabled && (suggest || warn || settings.show_min_cpr !== false),
      spawn: enabled && Boolean(settings.spawn_requests_enabled)
    };
  }
  function weightsChoice(config, saved2) {
    const factionShows = Boolean(config && config.settings && config.settings.show_role_weights);
    const factionId = config ? config.faction_id : null;
    const own = Boolean(saved2) && typeof saved2.show === "boolean" && factionId !== null && factionId !== void 0 && String(saved2.factionId) === String(factionId);
    return { show: own ? saved2.show : factionShows, own, factionShows };
  }
  var HIGHEST_LEVEL = 10;
  function productiveFromLevel(config) {
    const from = (config && config.settings || {}).productive_from_level;
    if (from === void 0) return 1;
    return from === null ? HIGHEST_LEVEL + 1 : from;
  }
  function countsProductiveDays(crime, fromLevel) {
    return (crime.level ?? HIGHEST_LEVEL) >= fromLevel;
  }
  function hoursUntilPlanning(crime) {
    return crime.slots.filter((slot) => slot.occupied).reduce((hours, slot) => hours + (1 - (slot.progress || 0)) * PLANNING_HOURS, 0);
  }
  var STALL_SLACK_HOURS = 0.1;
  function isStalled(crime) {
    const occupied = crime.slots.filter((slot) => slot.occupied).length;
    return occupied > 0 && occupied < crime.slots.length && hoursUntilPlanning(crime) < STALL_SLACK_HOURS;
  }
  function fallbackMinimum(config, level) {
    const fallbacks = config && config.fallback_min_cpr;
    if (!fallbacks) return null;
    return fallbacks[level] ?? fallbacks.default ?? null;
  }
  function rateSlot(slot, crime, config) {
    const role = findRole(config, crime.name, slot.name);
    const minCpr = role ? role.min_cpr : fallbackMinimum(config, crime.level);
    const weight = role && role.weight !== null && role.weight !== void 0 ? role.weight : null;
    let status;
    if (slot.occupied) status = SlotStatus.Filled;
    else if (minCpr === null || slot.cpr === null) status = SlotStatus.Unrated;
    else status = slot.cpr >= minCpr ? SlotStatus.Eligible : SlotStatus.Below;
    return { slot, minCpr, weight, status, assumed: !role && minCpr !== null };
  }
  function pickSlot(ratedSlots) {
    return ratedSlots.filter((rated) => rated.status === SlotStatus.Eligible).sort((a, b) => (b.weight ?? -1) - (a.weight ?? -1) || b.slot.cpr - a.slot.cpr)[0] || null;
  }
  var HIGHEST_SPAWNABLE_LEVEL = 8;
  function heldLevel(memberLevel) {
    if (memberLevel === null || memberLevel === void 0) return null;
    return Math.min(memberLevel, HIGHEST_SPAWNABLE_LEVEL);
  }
  function belowMemberLevel(crime, memberLevel, levelGap) {
    const held = heldLevel(memberLevel);
    if (held === null) return false;
    if (crime.level === null || crime.level === void 0) return false;
    return held - crime.level >= levelGap;
  }
  function belowOwnLevel(crime, memberLevel, config) {
    const held = heldLevel(memberLevel);
    if (held === null) return false;
    const settings = config && config.settings || {};
    const gap = held >= productiveFromLevel(config) ? 1 : settings.under_level_gap ?? 2;
    return belowMemberLevel(crime, memberLevel, gap);
  }
  function canAskForCrime(memberLevel, config) {
    const settings = config && config.settings || {};
    if (!memberFeatures(config).spawn) return false;
    if (memberLevel === null || memberLevel === void 0) return false;
    return memberLevel >= (settings.spawn_request_min_level ?? 6);
  }
  function rateCrimes(crimes, config, member = null) {
    const settings = config && config.settings || {};
    const threshold = settings.productive_threshold_hours ?? 12;
    const levelGap = settings.under_level_gap ?? 2;
    const fromLevel = productiveFromLevel(config);
    const memberLevel = member ? member.level : null;
    const holdBack = Boolean(member && member.canAsk);
    const rated = crimes.map((crime) => {
      const waitHours = hoursUntilPlanning(crime);
      const pooled = countsProductiveDays(crime, fromLevel);
      return {
        crime,
        waitHours,
        pooled,
        productive: !pooled || waitHours <= threshold,
        stalled: isStalled(crime),
        openSlots: crime.slots.filter((slot) => !slot.occupied).length,
        slots: crime.slots.map((slot) => rateSlot(slot, crime, config))
      };
    });
    const qualifying = rated.map((entry) => ({
      ...entry,
      pick: pickSlot(entry.slots),
      thresholdHours: threshold,
      memberLevel,
      belowLevel: belowOwnLevel(entry.crime, memberLevel, config),
      tooLow: belowMemberLevel(entry.crime, memberLevel, levelGap)
    })).filter((entry) => entry.pick);
    const withheld = holdBack ? qualifying.filter((entry) => entry.tooLow).length : 0;
    const unstalls = (entry) => entry.stalled && !entry.belowLevel;
    const candidates = qualifying.filter((entry) => !holdBack || !entry.tooLow).sort(
      (a, b) => Number(unstalls(b)) - Number(unstalls(a)) || Number(b.productive) - Number(a.productive) || (b.crime.level ?? 0) - (a.crime.level ?? 0) || (unstalls(a) && unstalls(b) ? a.openSlots - b.openSlots : 0) || Number(b.pick.weight !== null) - Number(a.pick.weight !== null) || (a.pooled || b.pooled ? 0 : a.openSlots - b.openSlots) || a.waitHours - b.waitHours || (b.pick.weight ?? -1) - (a.pick.weight ?? -1)
    );
    const ownLevelsSuit = memberLevel > HIGHEST_SPAWNABLE_LEVEL && candidates.some((entry) => entry.productive && (entry.crime.level ?? 0) > HIGHEST_SPAWNABLE_LEVEL);
    const suggestions = [];
    const best = candidates[0];
    if (best) {
      suggestions.push(suggestion(Rank.Best, best));
      const lowestGoodLevel = (best.crime.level ?? 0) - (levelGap - 1);
      for (const candidate of candidates.slice(1)) {
        if (suggestions.length > GOOD_SLOTS) break;
        if (candidate.belowLevel) continue;
        if (ownLevelsSuit && (candidate.crime.level ?? 0) <= HIGHEST_SPAWNABLE_LEVEL) continue;
        if (candidate.productive !== best.productive) continue;
        if ((candidate.crime.level ?? 0) < lowestGoodLevel) continue;
        suggestions.push(suggestion(Rank.Good, candidate));
      }
    }
    const hiddenStalled = rated.filter(
      (entry) => entry.crime.offPage && entry.stalled && !belowOwnLevel(entry.crime, memberLevel, config) && !pickSlot(entry.slots) && entry.slots.some((slot) => slot.status === SlotStatus.Unrated)
    ).length;
    return { crimes: rated, suggestions, withheld, hiddenStalled };
  }
  function suggestion(rank, candidate) {
    return {
      rank,
      crime: candidate.crime,
      rated: candidate.pick,
      waitHours: candidate.waitHours,
      pooled: candidate.pooled,
      productive: candidate.productive,
      stalled: candidate.stalled,
      thresholdHours: candidate.thresholdHours,
      belowLevel: candidate.belowLevel,
      memberLevel: candidate.memberLevel
    };
  }
  function tierFor(level) {
    if (level <= 2) return "1-2";
    if (level <= 4) return "3-4";
    if (level <= 6) return "5-6";
    return "7-8";
  }
  function spawnTierToRequest(suggestions, memberLevel, config) {
    if (!canAskForCrime(memberLevel, config)) return null;
    const best = suggestions[0];
    const decent = best && best.productive && !belowOwnLevel(best.crime, memberLevel, config);
    return decent ? null : tierFor(memberLevel);
  }
  function describeWait(hours) {
    if (hours < 0.5) return "now";
    if (hours < 36) {
      const rounded = Math.max(1, Math.round(hours));
      return `in about ${rounded} hour${rounded === 1 ? "" : "s"}`;
    }
    const days = Math.round(hours / 24);
    return `in about ${days} days`;
  }

  // src/features/debug-info.js
  var DIALOG_ID = "nfh-debug-dialog";
  var iso = (ms) => ms ? new Date(ms).toISOString() : null;
  var NO_ANSWER = {
    network: "No answer: the request failed before any reply (offline, blocked, or the app could not make it)",
    timeout: "No answer: timed out",
    empty: "No answer: the userscript manager returned nothing",
    not_json: "A reply that is not from the nuke.family API (a block or challenge page, usually)"
  };
  function failure(error) {
    if (error instanceof ApiError) {
      const reason = error.body && (error.body.error || error.body.message);
      const result = { status: error.status, error: reason || null };
      if (error.raw) result.reply_starts = error.raw;
      return result;
    }
    if (error instanceof NoAnswerError) {
      const result = { status: error.status, error: NO_ANSWER[error.kind] || error.kind, failure: error.kind };
      if (error.detail) result[error.kind === "not_json" ? "reply_starts" : "detail"] = error.detail;
      return result;
    }
    return { status: null, error: "The script could not read the reply", failure: "script", detail: String(error && error.message) };
  }
  async function probe(path, summarise = () => void 0) {
    try {
      const body = await api(path, { feature: "debug-info" });
      return { status: 200, ...summarise(body) };
    } catch (error) {
      return failure(error);
    }
  }
  async function probeFromPage() {
    try {
      await pageRequest("/cache/last-updates");
      return { reached: true, status: 200 };
    } catch (error) {
      const result = failure(error);
      return { reached: error instanceof ApiError, ...result };
    }
  }
  function ocConfigSummary(config) {
    if (!config) return { present: false };
    return {
      present: true,
      settings: config.settings || null,
      crimes: Array.isArray(config.crimes) ? config.crimes.length : null,
      weights_synced_at: config.weights_synced_at ?? null,
      member_features: memberFeatures(config)
    };
  }
  function boardSummary(board) {
    if (!board) return { present: false };
    return {
      present: true,
      synced_at: board.synced_at ?? null,
      crimes: Array.isArray(board.crimes) ? board.crimes.length : null,
      my_level: board.me ? board.me.level : null,
      my_known_cprs: board.me && board.me.cprs ? Object.keys(board.me.cprs).length : null,
      sees_staff_flags: Boolean(board.members)
    };
  }
  function storedKeys() {
    const keys = {};
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (/^nfh/i.test(key)) keys[key] = (localStorage.getItem(key) || "").length;
    }
    return keys;
  }
  function countOf(data) {
    if (Array.isArray(data)) return data.length;
    if (data && typeof data === "object") return Object.keys(data).length;
    return data === null || data === void 0 ? null : 1;
  }
  async function collectDebugInfo() {
    const token = getApiToken() || "";
    const info2 = typeof GM_info !== "undefined" && GM_info ? GM_info : {};
    const board = cachedBoard2();
    const [storage, fromPage, roles, permissions, lastUpdates, ocConfig, ocBoard] = await Promise.all([
      storageInfo(),
      probeFromPage(),
      probe("/user/get-own-roles", (body) => ({ role: body.role ?? null })),
      probe("/user/get-own-permissions", (body) => ({ permissions: body.permissions || [] })),
      probe("/cache/last-updates", (body) => ({ timestamps: body })),
      probe("/oc/config", (body) => ocConfigSummary(body.data || null)),
      probe("/oc/board", (body) => boardSummary(body.data || null))
    ]);
    return {
      generated_at: (/* @__PURE__ */ new Date()).toISOString(),
      script: {
        version: CURRENT_VERSION,
        debug_build: DEBUG,
        debug_site: DEBUG_SITE,
        api_url: API_URL,
        manager: info2.scriptHandler ? `${info2.scriptHandler} ${info2.version || ""}`.trim() : null,
        torn_pda: isPda
      },
      browser: { user_agent: navigator.userAgent, page: window.location.href },
      torn_player_id: getUserscriptUsersPlayerId() || null,
      key: { stored: token.length > 0, length: token.length, accepted: roles.status === 200 },
      site_now: {
        "/user/get-own-roles": roles,
        "/user/get-own-permissions": permissions,
        "/cache/last-updates": lastUpdates,
        "/oc/config": ocConfig,
        "/oc/board": ocBoard
      },
      site_from_page: fromPage,
      storage,
      stored: {
        role: getUserRole() || null,
        stores: Object.fromEntries(
          registeredStores().map((store) => [
            store.storageKey,
            { fetched_at: iso(store.timestamp), entries: countOf(store.data), stale: store.isStale() }
          ])
        ),
        oc_config: ocConfigSummary(ocConfigStore.data),
        oc_board: board ? { fetched_at: iso(board.fetchedAt), ...boardSummary(board.board) } : { present: false },
        keys: storedKeys()
      }
    };
  }
  async function copyText(text, field) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      field.select();
      try {
        return document.execCommand("copy");
      } catch (e) {
        return false;
      }
    }
  }
  async function sendDebugInfo(report2) {
    const path = "/script/debug-report";
    let error;
    try {
      return { reference: (await api(path, { method: "POST", data: { report: report2 } })).reference };
    } catch (first) {
      error = first;
    }
    if (!(error instanceof ApiError)) {
      try {
        const data = { report: { ...report2, sent_by: "page", send_failure: failure(error) } };
        return { reference: (await pageRequest(path, { method: "POST", data })).reference };
      } catch (second) {
        if (second instanceof ApiError) error = second;
      }
    }
    if (error instanceof ApiError) {
      if (error.status === 429) return { error: "Too many reports sent from here. Try again in a few minutes." };
      const reason = error.body && (error.body.error || error.body.message);
      return { error: reason || `nuke.family refused it (status ${error.status}).` };
    }
    return { error: "Could not reach nuke.family." };
  }
  function showDebugInfo(report2) {
    const existing = document.getElementById(DIALOG_ID);
    if (existing) existing.remove();
    const text = JSON.stringify(report2, null, 2);
    const overlay = document.createElement("div");
    overlay.id = DIALOG_ID;
    overlay.className = "nfh-debug-overlay";
    overlay.innerHTML = '<div class="nfh-debug-dialog" role="dialog" aria-modal="true" aria-label="Nuke Family Helper debug info"><div class="nfh-debug-title">Nuke Family Helper debug info</div><p class="nfh-debug-note">Send this to the developer and pass on the short reference you get back, or copy the whole report. It does not contain your key.</p><textarea class="nfh-debug-text" readonly spellcheck="false"></textarea><div class="nfh-debug-sent" hidden>Sent. Your reference is <input type="text" class="nfh-debug-reference" readonly aria-label="Reference"> <button type="button" class="torn-btn" data-nfh-debug-copy-reference>Copy reference</button></div><div class="nfh-debug-actions"><span class="nfh-debug-status" role="status"></span><button type="button" class="torn-btn" data-nfh-debug-send>Send to developer</button><button type="button" class="torn-btn" data-nfh-debug-copy>Copy report</button><button type="button" class="torn-btn" data-nfh-debug-close>Close</button></div></div>';
    const textarea = overlay.querySelector("textarea");
    textarea.value = text;
    const status = overlay.querySelector(".nfh-debug-status");
    const sent2 = overlay.querySelector(".nfh-debug-sent");
    const reference = overlay.querySelector(".nfh-debug-reference");
    overlay.addEventListener("click", async (event) => {
      if (event.target === overlay || event.target.closest("[data-nfh-debug-close]")) {
        overlay.remove();
        return;
      }
      if (event.target.closest("[data-nfh-debug-copy]")) {
        status.textContent = await copyText(text, textarea) ? "Report copied." : "Could not copy: select the text and copy it yourself.";
        return;
      }
      if (event.target.closest("[data-nfh-debug-copy-reference]")) {
        status.textContent = await copyText(reference.value, reference) ? "Reference copied." : "Could not copy: type it out instead.";
        return;
      }
      const send = event.target.closest("[data-nfh-debug-send]");
      if (send && !send.disabled) {
        send.disabled = true;
        status.textContent = "Sending...";
        const outcome = await sendDebugInfo(report2);
        if (outcome.reference) {
          reference.value = outcome.reference;
          sent2.hidden = false;
          status.textContent = "";
          send.remove();
        } else {
          status.textContent = `${outcome.error} You can still copy the report.`;
          send.disabled = false;
        }
      }
    });
    document.body.appendChild(overlay);
    textarea.focus();
    textarea.select();
    textarea.scrollTop = 0;
  }

  // src/features/faction-buttons.js
  var CONTAINER_SELECTOR = "#faction-controls > hr";
  var CHANGE_KEY_ID = "nfh-change-key-btn";
  var CHECK_UPDATES_ID = "nfh-check-updates-btn";
  var DEBUG_INFO_ID = "nfh-debug-info-btn";
  function buildChangeKeyButton() {
    const btn = document.createElement("button");
    btn.id = CHANGE_KEY_ID;
    btn.innerHTML = "Change Nuke Family Key";
    btn.classList.add("torn-btn");
    btn.addEventListener("click", async function() {
      if (await enterKeyByHand()) {
        refreshUserRole();
        refreshPermissions();
      }
    });
    return btn;
  }
  function buildCheckUpdatesButton() {
    const btn = document.createElement("button");
    btn.id = CHECK_UPDATES_ID;
    btn.innerHTML = "Check NFH Updates";
    btn.classList.add("torn-btn");
    btn.addEventListener("click", async function() {
      btn.disabled = true;
      const originalLabel = btn.innerHTML;
      btn.innerHTML = "Refreshing\u2026";
      try {
        clearChainWatchCache();
        await labelRequests("check-updates", refreshAllCaches);
        LogInfo("All caches force-refreshed from the update button");
      } catch (error) {
        console.error("Error refreshing caches:", error);
      }
      btn.disabled = false;
      btn.innerHTML = originalLabel;
      checkForUpdates(true);
    });
    return btn;
  }
  function buildDebugInfoButton() {
    const btn = document.createElement("button");
    btn.id = DEBUG_INFO_ID;
    btn.innerHTML = "NFH Debug Info";
    btn.classList.add("torn-btn");
    btn.addEventListener("click", async function() {
      btn.disabled = true;
      const originalLabel = btn.innerHTML;
      btn.innerHTML = "Collecting\u2026";
      try {
        showDebugInfo(await collectDebugInfo());
      } catch (error) {
        console.error("Error collecting debug info:", error);
        showDebugInfo({ error: String(error) });
      }
      btn.disabled = false;
      btn.innerHTML = originalLabel;
    });
    return btn;
  }
  function init2() {
    ensureInjected({
      containerSelector: CONTAINER_SELECTOR,
      isPresent: () => !!document.getElementById(CHANGE_KEY_ID),
      inject: (container) => {
        container.appendChild(buildChangeKeyButton());
        container.appendChild(buildCheckUpdatesButton());
        container.appendChild(buildDebugInfoButton());
        LogInfo("Faction control buttons inserted");
      }
    });
  }
  var faction_buttons_default = {
    name: "faction-buttons",
    pages: [PageType.FactionControl],
    init: init2
  };

  // src/features/shitlist/data.js
  var shitlistStore = createSyncedStore({
    storageKey: "shitListEntriesList",
    dataField: "shitListEntries",
    emptyValue: {},
    serverField: "shitlist_cache_last_update",
    fallbackTtlMs: 720 * 60 * 1e3,
    // 12 hours
    fetcher: async () => {
      const responseEntries = (await api("/shit-lists"))["data"];
      const toSave = {};
      responseEntries.forEach((entry) => {
        const obj = {
          entryId: entry.id,
          playerName: entry.playerName,
          playerId: entry.playerId,
          factionId: entry.factionId,
          factionName: entry.factionName,
          isFactionBan: entry.isFactionBan,
          isApproved: entry.isApproved,
          shitListCategoryId: entry.shitListCategoryId,
          reason: entry.reason,
          updatedAt: entry.updated_at,
          shitListCategory: entry.shitListCategory
        };
        if (entry.isFactionBan) toSave["f" + entry.factionId + "#" + entry.id] = obj;
        else toSave["p" + entry.playerId + "#" + entry.id] = obj;
      });
      return toSave;
    }
  });
  var categoriesStore = createSyncedStore({
    storageKey: "shitListCategoriesList",
    dataField: "shitListCategories",
    emptyValue: {},
    serverField: "shitlist_category_cache_last_update",
    fallbackTtlMs: 720 * 60 * 1e3,
    // 12 hours
    fetcher: async () => {
      const responseEntries = (await api("/shit-list-categories"))["data"];
      const toSave = {};
      responseEntries.forEach((entry) => {
        toSave[entry.id] = {
          entryId: entry.id,
          name: entry.name,
          description: entry.description,
          isFactionBan: entry.is_faction,
          isFriendly: entry.is_friendly
        };
      });
      return toSave;
    }
  });

  // src/features/hospital.js
  function getPlayerAndFactionFromHospitalRow(li) {
    let playerId = null;
    let factionId = null;
    try {
      const playerLink2 = li.querySelector('a.user.name[href*="profiles.php"]');
      if (playerLink2 && playerLink2.href) {
        const playerMatch = playerLink2.href.match(/XID=(\d+)/);
        if (playerMatch) {
          playerId = playerMatch[1];
        }
      }
      const factionLink = li.querySelector('a.user.faction[href*="factions.php"]');
      if (factionLink && factionLink.href) {
        const factionMatch = factionLink.href.match(/ID=(\d+)/);
        if (factionMatch) {
          factionId = factionMatch[1];
        }
      }
    } catch (error) {
      LogInfo("Error parsing hospital row: " + error.message);
    }
    return { playerId, factionId };
  }
  function checkShitlistStatus(playerId, factionId) {
    const shitListEntries = shitlistStore.data;
    if (!shitListEntries) {
      return null;
    }
    if (factionId) {
      for (const key in shitListEntries) {
        if (key.startsWith("f" + factionId + "#")) {
          const entry = shitListEntries[key];
          if (SettingsManager.isCategoryVisible(
            entry.shitListCategoryId,
            entry.isFactionBan
          )) {
            if (entry.shitListCategory && entry.shitListCategory.is_friendly) {
              return "friendly";
            } else {
              return "shitlist";
            }
          }
        }
      }
    }
    if (playerId) {
      for (const key in shitListEntries) {
        if (key.startsWith("p" + playerId + "#")) {
          const entry = shitListEntries[key];
          if (SettingsManager.isCategoryVisible(
            entry.shitListCategoryId,
            entry.isFactionBan
          )) {
            return "shitlist";
          }
        }
      }
    }
    return null;
  }
  function applyHospitalRowColor(li, status) {
    li.classList.remove(
      "nfh-hospital-contract",
      "nfh-hospital-friendly",
      "nfh-hospital-shitlist"
    );
    if (status === "contract") {
      li.classList.add("nfh-hospital-contract");
    } else if (status === "friendly") {
      li.classList.add("nfh-hospital-friendly");
    } else if (status === "shitlist") {
      li.classList.add("nfh-hospital-shitlist");
    }
  }
  function reprocessHospitalRows() {
    document.querySelectorAll(".user-info-list-wrap .nfh-hospital-processed").forEach((li) => li.classList.remove("nfh-hospital-processed"));
    processHospitalRows();
  }
  shitlistStore.subscribe(reprocessHospitalRows);
  contractsStore.subscribe(reprocessHospitalRows);
  onActiveContractSettingChanged(reprocessHospitalRows);
  function processHospitalRows() {
    LogInfo("Processing hospital rows...");
    const showContracts = SettingsManager.isActiveContractVisible();
    if (!(showContracts && contractsStore.data.length) && !Object.keys(shitlistStore.data).length) {
      LogInfo("No contracts or shitlist data available");
      return;
    }
    const userInfoList = document.querySelector(".user-info-list-wrap");
    if (!userInfoList) {
      LogInfo("Hospital list not found");
      return;
    }
    const listItems = userInfoList.querySelectorAll(":scope > li");
    LogInfo(`Found ${listItems.length} hospital rows`);
    listItems.forEach((li) => {
      if (li.classList.contains("nfh-hospital-processed")) {
        return;
      }
      const { playerId, factionId } = getPlayerAndFactionFromHospitalRow(li);
      if (!playerId) {
        LogInfo("Could not extract player ID from row");
        return;
      }
      LogInfo(`Processing player ${playerId}, faction ${factionId || "none"}`);
      if (showContracts && findActiveContract(factionId, playerId)) {
        LogInfo(`Player ${playerId} has active contract - applying teal`);
        applyHospitalRowColor(li, "contract");
        li.classList.add("nfh-hospital-processed");
        return;
      }
      const shitlistStatus = checkShitlistStatus(playerId, factionId);
      if (shitlistStatus) {
        LogInfo(`Player ${playerId} has shitlist status: ${shitlistStatus}`);
        applyHospitalRowColor(li, shitlistStatus);
        li.classList.add("nfh-hospital-processed");
        return;
      }
      applyHospitalRowColor(li, null);
      li.classList.add("nfh-hospital-processed");
    });
  }
  var isHospitalObserverSetup = false;
  function init3() {
    if (isHospitalObserverSetup) return;
    isHospitalObserverSetup = true;
    LogInfo("Setting up hospital observer...");
    waitForElm(".user-info-list-wrap").then((userInfoList) => {
      LogInfo("Hospital list found, processing initial rows...");
      processHospitalRows();
      const observer5 = new MutationObserver(() => {
        LogInfo("Hospital list changed, reprocessing rows...");
        processHospitalRows();
      });
      observer5.observe(userInfoList, {
        childList: true,
        subtree: true
      });
      LogInfo("Hospital observer active");
    });
  }
  var hospital_default = {
    name: "hospital",
    pages: [PageType.Hospital],
    init: init3
  };

  // src/features/organized-crimes/flags.js
  var Flag = {
    Unqualified: "unqualified",
    // CPR below the faction's minimum for the role
    Unproductive: "unproductive",
    // planning will not start within the threshold
    UnderLevel: "underlevel"
    // could be doing crimes well above this one
  };
  var FLAG_LABELS = {
    [Flag.Unqualified]: "Unqualified",
    [Flag.Unproductive]: "Not productive",
    [Flag.UnderLevel]: "Under-levelled"
  };
  function hoursUntilTurn(crime, index) {
    return crime.slots.slice(0, index).filter((slot) => slot.occupied).reduce((hours, slot) => hours + (1 - (slot.progress || 0)) * PLANNING_HOURS, 0);
  }
  function crimeHoursLeft(crime) {
    return crime.slots.reduce(
      (hours, slot) => hours + (slot.occupied ? 1 - (slot.progress || 0) : 1) * PLANNING_HOURS,
      0
    );
  }
  var ASSUME_RUN_HOURS = 1;
  function probablyRun(readyAt, nowMs = Date.now()) {
    if (typeof readyAt !== "number") return false;
    const sinceHours = (nowMs - readyAt * 1e3) / 36e5;
    return sinceHours >= 0 && sinceHours < ASSUME_RUN_HOURS;
  }
  function slotFlags(crime, index, rated, memberLevel, limits) {
    const slot = crime.slots[index];
    if (!slot || !slot.occupied) return [];
    const flags = [];
    if (rated.minCpr !== null && slot.cpr !== null && slot.cpr < rated.minCpr) {
      flags.push({
        flag: Flag.Unqualified,
        text: `CPR ${slot.cpr} < ${rated.minCpr}`,
        title: `CPR ${slot.cpr} is below the faction's minimum of ${rated.minCpr} for this role.`
      });
    }
    const wait2 = hoursUntilTurn(crime, index);
    if (countsProductiveDays(crime, limits.productiveFromLevel ?? 1) && wait2 > limits.thresholdHours) {
      flags.push({
        flag: Flag.Unproductive,
        text: `Idle ${Math.round(wait2)}h`,
        title: `Planning for this slot starts ${describeWait(wait2)}, later than the ${limits.thresholdHours} hour threshold.`
      });
    }
    if (belowMemberLevel(crime, memberLevel, limits.levelGap)) {
      flags.push({
        flag: Flag.UnderLevel,
        text: `Level ${memberLevel} member`,
        title: `This member qualifies for level ${memberLevel} crimes; this one is level ${crime.level}.`
      });
    }
    return flags;
  }
  function limitsFor(config, prefs4 = null) {
    const settings = config && config.settings || {};
    return {
      thresholdHours: (prefs4 && prefs4.thresholdHours) ?? settings.productive_threshold_hours ?? 12,
      levelGap: (prefs4 && prefs4.levelGap) ?? settings.under_level_gap ?? 2,
      // The faction's alone: where its pay is pooled is not a matter of taste.
      productiveFromLevel: productiveFromLevel(config)
    };
  }

  // src/features/organized-crimes/prefs.js
  var KEY = "nfhOcStaffPrefs";
  var DEFAULTS2 = {
    show: { [Flag.Unqualified]: true, [Flag.Unproductive]: true, [Flag.UnderLevel]: true },
    thresholdHours: null,
    levelGap: null
  };
  function getStaffPrefs() {
    let saved2 = null;
    try {
      saved2 = JSON.parse(getItem(KEY) || "null");
    } catch (e) {
      saved2 = null;
    }
    return {
      ...DEFAULTS2,
      ...saved2 || {},
      show: { ...DEFAULTS2.show, ...saved2 && saved2.show || {} }
    };
  }
  function setStaffPrefs(changes) {
    const next = { ...getStaffPrefs(), ...changes };
    setItem(KEY, JSON.stringify(next));
    return next;
  }
  var WEIGHTS_KEY = "nfhOcWeights";
  function getWeightsPref() {
    try {
      return JSON.parse(getItem(WEIGHTS_KEY) || "null");
    } catch (e) {
      return null;
    }
  }
  function setWeightsPref(pref) {
    setItem(WEIGHTS_KEY, pref === null ? "null" : JSON.stringify(pref));
  }
  function parseOverride(value, min, max) {
    const number2 = parseInt(value, 10);
    if (Number.isNaN(number2)) return null;
    return Math.min(max, Math.max(min, number2));
  }

  // src/core/page-script.js
  var nonce;
  function pageNonce() {
    if (nonce !== void 0) return nonce;
    nonce = null;
    for (const script of document.querySelectorAll("script")) {
      const value = script.nonce || script.getAttribute("nonce");
      if (value) {
        nonce = value;
        break;
      }
    }
    return nonce;
  }
  function runInPage(source) {
    const tag = document.createElement("script");
    const value = pageNonce();
    if (value) {
      tag.nonce = value;
      tag.setAttribute("nonce", value);
    }
    tag.textContent = source;
    (document.head || document.documentElement).appendChild(tag);
    tag.remove();
  }
  function pageWindow() {
    try {
      if (typeof unsafeWindow !== "undefined" && unsafeWindow) return unsafeWindow;
    } catch (error) {
    }
    return window;
  }

  // src/core/torn-editor.js
  var REQUEST = "nfh:editor-request";
  var RESPONSE = "nfh:editor-response";
  var TIMEOUT_MS = 1500;
  var bridgeInstalled = false;
  var nextId = 1;
  function pageBridge(requestEvent, responseEvent) {
    if (window.__nfhEditorBridge) return;
    window.__nfhEditorBridge = true;
    document.documentElement.setAttribute("data-nfh-editor-bridge", "1");
    document.addEventListener(requestEvent, (event) => {
      let request2;
      try {
        request2 = JSON.parse(event.detail);
      } catch (error) {
        return;
      }
      const element = document.getElementById(request2.elementId);
      const mce = window.tinymce;
      let editor = null;
      try {
        editor = mce ? mce.get(request2.elementId) || (mce.activeEditor && mce.activeEditor.getElement() === element ? mce.activeEditor : null) : null;
      } catch (error) {
        editor = null;
      }
      let answer = { id: request2.id, ok: true, via: editor ? "tinymce" : "element" };
      try {
        if (request2.op === "get") {
          answer.html = editor ? editor.getContent() : element ? element.innerHTML : "";
        } else if (request2.op === "set") {
          if (editor) {
            editor.focus();
            if (editor.undoManager) editor.undoManager.transact(() => editor.setContent(request2.html));
            else editor.setContent(request2.html);
            editor.fire("change");
            editor.fire("input");
            if (editor.nodeChanged) editor.nodeChanged();
          } else if (element) {
            element.innerHTML = request2.html;
            element.dispatchEvent(new Event("input", { bubbles: true }));
          } else {
            answer = { id: request2.id, ok: false, error: "The editor was not found." };
          }
        }
      } catch (error) {
        answer = { id: request2.id, ok: false, error: String(error && error.message || error) };
      }
      document.dispatchEvent(new CustomEvent(responseEvent, { detail: JSON.stringify(answer) }));
    });
  }
  function installBridge() {
    if (bridgeInstalled) return;
    bridgeInstalled = true;
    try {
      runInPage(`(${pageBridge.toString()})(${JSON.stringify(REQUEST)}, ${JSON.stringify(RESPONSE)});`);
    } catch (error) {
    }
  }
  function directEditor(element) {
    try {
      const mce = pageWindow().tinymce;
      if (!mce || !element.id) return null;
      const editor = mce.get(element.id);
      if (editor) return editor;
      const active = mce.activeEditor;
      return active && active.getElement && active.getElement() === element ? active : null;
    } catch (error) {
      return null;
    }
  }
  function setElement(element, html) {
    element.innerHTML = html;
    element.dispatchEvent(new Event("input", { bubbles: true }));
  }
  function ask(elementId, op, html) {
    installBridge();
    if (!document.documentElement.hasAttribute("data-nfh-editor-bridge")) return Promise.reject(new Error("The page script did not run."));
    const id = nextId++;
    return new Promise((resolve, reject) => {
      const timer3 = setTimeout(() => {
        document.removeEventListener(RESPONSE, listener);
        reject(new Error("The editor did not answer."));
      }, TIMEOUT_MS);
      function listener(event) {
        let answer;
        try {
          answer = JSON.parse(event.detail);
        } catch (error) {
          return;
        }
        if (answer.id !== id) return;
        clearTimeout(timer3);
        document.removeEventListener(RESPONSE, listener);
        if (answer.ok) resolve(answer);
        else reject(new Error(answer.error || "The editor refused."));
      }
      document.addEventListener(RESPONSE, listener);
      document.dispatchEvent(new CustomEvent(REQUEST, { detail: JSON.stringify({ id, op, elementId, html }) }));
    });
  }
  function findEditor(root3) {
    return root3 ? root3.querySelector('.mce-content-body[contenteditable="true"], [contenteditable="true"]') : null;
  }
  async function getEditorHtml(element) {
    if (!element) throw new Error("The editor was not found.");
    const editor = directEditor(element);
    if (editor) {
      try {
        return String(editor.getContent());
      } catch (error) {
      }
    }
    if (element.id) {
      try {
        return (await ask(element.id, "get")).html ?? element.innerHTML;
      } catch (error) {
      }
    }
    return element.innerHTML;
  }
  async function setEditorHtml(element, html) {
    if (!element) throw new Error("The editor was not found.");
    const editor = directEditor(element);
    if (editor) {
      try {
        editor.focus();
        if (editor.undoManager) editor.undoManager.add();
        editor.setContent(html);
        if (editor.undoManager) editor.undoManager.add();
        editor.fire("change");
        editor.fire("input");
        if (editor.nodeChanged) editor.nodeChanged();
        return;
      } catch (error) {
      }
    }
    if (element.id) {
      try {
        await ask(element.id, "set", html);
        return;
      } catch (error) {
      }
    }
    setElement(element, html);
  }
  function editorHasContent(element) {
    if (!element) return false;
    return element.textContent.trim() !== "" || element.querySelector("img") !== null;
  }
  function setInputValue(input, value) {
    if (!input) return;
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
    setter.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }

  // src/core/torn-action.js
  var REQUEST2 = "nfh:torn-action";
  var RESPONSE2 = "nfh:torn-action-done";
  var TIMEOUT_MS2 = 15e3;
  var installed = false;
  var nextId2 = 1;
  function pageBridge2(requestEvent, responseEvent) {
    if (window.__nfhTornAction) return;
    window.__nfhTornAction = true;
    document.documentElement.setAttribute("data-nfh-torn-action", "1");
    document.addEventListener(requestEvent, (event) => {
      let request2;
      try {
        request2 = JSON.parse(event.detail);
      } catch (error) {
        return;
      }
      const answer = (payload) => document.dispatchEvent(new CustomEvent(responseEvent, { detail: JSON.stringify({ id: request2.id, ...payload }) }));
      fetch(request2.url, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8", "X-Requested-With": "XMLHttpRequest" },
        body: request2.body
      }).then((response) => response.text().then((text) => answer({ ok: response.ok, status: response.status, text }))).catch((error) => answer({ ok: false, status: 0, text: String(error && error.message || error) }));
    });
  }
  function install() {
    if (installed) return;
    installed = true;
    runInPage(`(${pageBridge2.toString()})(${JSON.stringify(REQUEST2)}, ${JSON.stringify(RESPONSE2)});`);
  }
  function postTornAction(page, fields) {
    const rfcv = getCookie("rfc_v");
    if (!rfcv) return Promise.reject(new Error("Torn's page token was not found. Reload the page and try again."));
    install();
    if (!document.documentElement.hasAttribute("data-nfh-torn-action")) {
      return Promise.reject(new Error("Torn's page blocked the script that sends it. Use the Loan box on the row instead."));
    }
    const id = nextId2++;
    const url = `/${page}?rfcv=${encodeURIComponent(rfcv)}`;
    const body = new URLSearchParams(fields).toString();
    return new Promise((resolve, reject) => {
      const timer3 = setTimeout(() => {
        document.removeEventListener(RESPONSE2, listener);
        reject(new Error("Torn did not answer in time (or the page blocked the request). Check the armoury before trying again."));
      }, TIMEOUT_MS2);
      function listener(event) {
        let answer;
        try {
          answer = JSON.parse(event.detail);
        } catch (error) {
          return;
        }
        if (answer.id !== id) return;
        clearTimeout(timer3);
        document.removeEventListener(RESPONSE2, listener);
        resolve(answer);
      }
      document.addEventListener(RESPONSE2, listener);
      document.dispatchEvent(new CustomEvent(REQUEST2, { detail: JSON.stringify({ id, url, body }) }));
    });
  }

  // src/features/oc-items/armoury.js
  var tabSelector = (tab) => `[id="tab=armoury&sub=${tab}"]`;
  function readArmoury(tabs) {
    const live = {};
    for (const tab of tabs) {
      const container = document.querySelector(tabSelector(tab));
      if (!container) continue;
      const rows2 = [...container.querySelectorAll("li .img-wrap[data-itemid]")].map((wrap) => readRow(wrap.closest("li"), wrap));
      const empty = !rows2.length && /no items in this category/i.test(container.textContent);
      if (rows2.length || empty) live[tab] = rows2;
    }
    return live;
  }
  function readRow(li, wrap) {
    const link = li.querySelector('.loaned a[href*="profiles.php?XID="]');
    const holder = link ? Number(new URL(link.getAttribute("href"), location.origin).searchParams.get("XID")) : null;
    const name = (li.querySelector(".name")?.childNodes[0]?.textContent || li.querySelector(".name")?.textContent || "").replace(/\s+x?\s*$/, "").trim();
    return {
      li,
      itemId: Number(wrap.dataset.itemid),
      armoryId: wrap.dataset.armoryid,
      name,
      type: (li.querySelector(".type")?.textContent || "").trim(),
      loanedTo: holder || null,
      loanedName: link ? link.textContent.trim() : null,
      canLoan: !!li.querySelector('.item-action a.loan.active, .item-action [data-role="loan"].active'),
      hasBonus: !!li.querySelector(".bonuses, .item-bonuses, [class*='bonus-attachment']")
    };
  }
  function openActionBox(tab) {
    const container = document.querySelector(tabSelector(tab));
    if (!container) return null;
    const li = container.querySelector("li.item-loan-act, li.item-give-act");
    if (!li) return null;
    const kind = li.classList.contains("item-loan-act") ? "loan" : "give";
    const box = li.querySelector(`.${kind}-cont.action-cont`);
    const input = box?.querySelector('input[name="user"]');
    if (!box || !input) return null;
    return { li, kind, box, input, itemId: Number(box.dataset.itemid || li.querySelector(".img-wrap")?.dataset.itemid) };
  }

  // src/features/oc-items/prefs.js
  var KEY2 = "nfhOcItemShow";
  var ITEM_SHOW_KEYS = ["missing_panel", "missing_tags", "retrieve_panel", "retrieve_tags"];
  function saved() {
    try {
      const value = JSON.parse(getItem(KEY2) || "null");
      return value && typeof value === "object" && value.choices ? value : null;
    } catch (error) {
      return null;
    }
  }
  function ownItemChoices(factionId) {
    const pref = saved();
    return pref && pref.factionId === factionId ? pref.choices : {};
  }
  function itemShow(staff, factionId) {
    const defaults = staff && staff.show || {};
    const kinds = staff && staff.kinds || {};
    const own = ownItemChoices(factionId);
    const result = {};
    for (const key of ITEM_SHOW_KEYS) {
      const kind = key.split("_")[0];
      if (kinds[kind] === false) {
        result[key] = false;
        continue;
      }
      result[key] = typeof own[key] === "boolean" ? own[key] : defaults[key] !== false;
    }
    return result;
  }
  function setItemChoice(factionId, key, value) {
    const choices = { ...ownItemChoices(factionId), [key]: !!value };
    setItem(KEY2, JSON.stringify({ factionId, choices }));
  }
  function resetItemChoices() {
    setItem(KEY2, "null");
  }

  // src/features/oc-items/logic.js
  var TAB_LABELS = {
    weapons: "Weapons",
    armour: "Armour",
    temporary: "Temporary",
    medical: "Medical",
    drugs: "Drugs",
    boosters: "Boosters",
    consumables: "Consumables",
    utilities: "Utilities"
  };
  var tabLabel = (tab) => TAB_LABELS[tab] || "Utilities";
  var armouryHash = (tab) => `#/tab=armoury&start=0&sub=${tab}`;
  function tabInHash(hash) {
    const match = String(hash || "").match(/tab=armoury.*?sub=(\w+)/);
    return match ? match[1] : null;
  }
  function currentLoans(siteLoans, live) {
    const liveTabs = new Set(Object.keys(live || {}));
    const loans = (siteLoans || []).filter((loan2) => !liveTabs.has(loan2.tab));
    for (const [tab, rows2] of Object.entries(live || {})) {
      for (const row2 of rows2) {
        if (!row2.loanedTo) continue;
        loans.push({ item_id: row2.itemId, item_name: row2.name, tab, player_id: row2.loanedTo, player_name: row2.loanedName || "", live: true });
      }
    }
    return loans;
  }
  function unusedLoans(loans, needs, ocItemIds) {
    const oc = new Set((ocItemIds || []).map(Number));
    const seen = /* @__PURE__ */ new Set();
    const out = [];
    for (const loan2 of loans || []) {
      const itemId = Number(loan2.item_id);
      if (!oc.has(itemId)) continue;
      const needed = needs && needs[loan2.player_id] || null;
      if (needed && needed.map(Number).includes(itemId)) continue;
      const key = `${loan2.player_id}:${itemId}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ ...loan2, reason: needed ? "their crime doesn't need it" : "not in a crime" });
    }
    return out.sort((a, b) => String(a.player_name).localeCompare(String(b.player_name)) || String(a.item_name).localeCompare(String(b.item_name)));
  }
  function stillMissing(missing, loanedNow) {
    return (missing || []).filter((entry) => !loanedNow.has(`${entry.player_id}:${entry.item_id}`));
  }
  function needersByItem(missing) {
    const byItem = /* @__PURE__ */ new Map();
    for (const entry of missing || []) {
      if (!byItem.has(entry.item_id)) byItem.set(entry.item_id, []);
      byItem.get(entry.item_id).push(entry);
    }
    return byItem;
  }
  function availableCopy(rows2, itemId) {
    const free = (rows2 || []).filter((row2) => row2.itemId === Number(itemId) && !row2.loanedTo && row2.canLoan);
    return free.find((row2) => !row2.hasBonus) || free[0] || null;
  }
  function readLoanAnswer(text) {
    const raw = String(text || "");
    try {
      const json = JSON.parse(raw);
      if (json && typeof json === "object") {
        const message2 = stripTags(json.message || json.msg || json.text || "");
        const ok = json.success === true || json.success === "true" || json.success === void 0 && /success/i.test(raw) && !json.error;
        return { ok, message: message2 || (json.error ? stripTags(String(json.error)) : "") };
      }
    } catch (error) {
    }
    const message = stripTags(raw).slice(0, 200);
    return { ok: /success|you loaned|loaned .* to/i.test(raw) && !/error|not allowed|cannot|can't/i.test(raw), message };
  }
  function stripTags(html) {
    return String(html).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  }

  // src/features/oc-items/index.js
  var PANEL_ID = "nfh-oc-items";
  var WANTED_TAB_KEY = "nfhOcItemsTab";
  var FILL_CLASS = "nfh-oci-fill";
  var BADGE_CLASS = "nfh-oci-badge";
  var COLLAPSED_KEY = "nfhOcItemsCollapsed";
  var FRESH_MS = 60 * 1e3;
  var PLACES = {
    crimes: { container: "#faction-crimes-root", insert: (container) => container.parentElement.insertBefore(panelElement(), container) },
    armoury: { container: "#faction-armoury-tabs", insert: (container) => container.parentElement.insertBefore(panelElement(), container) }
  };
  var state2 = {
    data: null,
    fetchedAt: 0,
    loading: null,
    error: null,
    message: null,
    busy: /* @__PURE__ */ new Set(),
    loanedNow: /* @__PURE__ */ new Set()
  };
  var observer = null;
  var observed = null;
  var redrawTimer = null;
  function place() {
    if (!location.search.includes("step=your")) return null;
    if (/tab=crimes/.test(location.hash)) return "crimes";
    if (/tab=armoury/.test(location.hash)) return "armoury";
    return null;
  }
  function collapsed() {
    try {
      return localStorage.getItem(COLLAPSED_KEY) === "1";
    } catch (error) {
      return false;
    }
  }
  function panelElement() {
    const panel = document.createElement("div");
    panel.id = PANEL_ID;
    panel.className = "nfh-cw nfh-oci";
    panel.addEventListener("click", onPanelClick);
    return panel;
  }
  async function load2() {
    if (state2.loading) return state2.loading;
    if (state2.data && Date.now() - state2.fetchedAt < FRESH_MS) return state2.data;
    state2.loading = api("/oc/items").then((answer) => {
      state2.data = answer.data || answer;
      state2.fetchedAt = Date.now();
      state2.error = null;
      settingsListeners.forEach((listener) => listener());
      return state2.data;
    }).catch((error) => {
      state2.error = error instanceof ApiError && error.status === 403 ? null : "nuke.family could not be reached for OC items.";
      LogInfo("[oc-items]", error);
      return null;
    }).finally(() => {
      state2.loading = null;
      redraw();
    });
    return state2.loading;
  }
  function view() {
    const data = state2.data;
    if (!data || !data.enabled) return null;
    const where = place();
    const tab = where === "armoury" ? openArmouryTab() : null;
    const staff = data.staff;
    const live = where === "armoury" ? readArmoury(Object.keys(TAB_LABELS)) : {};
    const missing = staff ? stillMissing(staff.missing, state2.loanedNow) : [];
    const mine = (data.mine || []).filter((entry) => !state2.loanedNow.has(`${entry.player_id}:${entry.item_id}`));
    const unused = staff && where === "armoury" ? unusedLoans(currentLoans(staff.loans, live), staff.needs, staff.oc_item_ids) : [];
    return { where, tab, staff, live, missing, mine, unused, show: shown(staff) };
  }
  function shown(staff) {
    const show = itemShow(staff, state2.data?.faction_id);
    return { missingPanel: show.missing_panel, missingTags: show.missing_tags, retrievePanel: show.retrieve_panel, retrieveTags: show.retrieve_tags };
  }
  var settingsListeners = /* @__PURE__ */ new Set();
  function itemSettings() {
    const data = state2.data;
    if (!data || !data.enabled || !data.staff) return null;
    const own = ownItemChoices(data.faction_id);
    return {
      factionId: data.faction_id,
      show: itemShow(data.staff, data.faction_id),
      defaults: itemShow({ show: data.staff.show, kinds: data.staff.kinds }, null),
      kinds: { missing: data.staff.kinds?.missing !== false, retrieve: data.staff.kinds?.retrieve !== false },
      changed: Object.keys(own).length > 0
    };
  }
  function onItemSettingsChange(listener) {
    settingsListeners.add(listener);
    return () => settingsListeners.delete(listener);
  }
  function itemSettingsChanged() {
    redraw();
  }
  function tabLink(tab, label = `${tabLabel(tab)} \u203A`, className = "nfh-cw-btn") {
    return `<a class="${className}" href="${escapeHtml(armouryHash(tab))}" data-act="go-tab" data-tab="${escapeHtml(tab)}">${escapeHtml(label)}</a>`;
  }
  function openArmouryTab() {
    const active = document.querySelector('#faction-armoury-tabs li.ui-tabs-active[aria-controls^="tab=armoury&sub="]');
    return active ? active.getAttribute("aria-controls").split("sub=")[1] : tabInHash(location.hash);
  }
  var tornTabAnchor = (tab) => document.querySelector(`#faction-armoury-tabs a.ui-tabs-anchor[href="#tab=armoury&sub=${tab}"]`);
  function wantedTab() {
    try {
      return sessionStorage.getItem(WANTED_TAB_KEY);
    } catch (error) {
      return null;
    }
  }
  function setWantedTab(tab) {
    try {
      if (tab) sessionStorage.setItem(WANTED_TAB_KEY, tab);
      else sessionStorage.removeItem(WANTED_TAB_KEY);
    } catch (error) {
    }
  }
  function wantedTabHint(v) {
    const tab = wantedTab();
    document.querySelectorAll(".nfh-oci-tab-hint").forEach((element) => {
      if (element !== tornTabAnchor(tab)) element.classList.remove("nfh-oci-tab-hint");
    });
    if (!tab || v?.where !== "armoury") return "";
    if (v.tab === tab) {
      setWantedTab(null);
      tornTabAnchor(tab)?.classList.remove("nfh-oci-tab-hint");
      return "";
    }
    const anchor = tornTabAnchor(tab);
    if (!anchor) return "";
    anchor.classList.add("nfh-oci-tab-hint");
    return `<div class="nfh-oci-message nfh-oci-message--ok">The ${escapeHtml(tabLabel(tab))} tab is highlighted below. ${tabLink(tab, `Open ${tabLabel(tab)}`)}</div>`;
  }
  function renderMine(mine, where) {
    return mine.map((entry) => {
      const how = entry.reusable ? "It isn't used up, so it can be loaned." : "The crime uses it up.";
      const go = where === "armoury" && entry.tab ? "" : ` ${tabLink(entry.tab, `${tabLabel(entry.tab)} armoury \u203A`, "")}`;
      return `<div class="nfh-oci-mine"><strong>Your slot needs ${escapeHtml(entry.item_name || `item ${entry.item_id}`)}</strong>, which you don't have
        <span class="nfh-cw-muted">(${escapeHtml(entry.position)} in ${escapeHtml(entry.crime)}). ${how}</span>${go}</div>`;
    }).join("");
  }
  function missingAction(entry, v) {
    const tab = entry.tab;
    if (v.where !== "armoury" || v.tab !== tab) {
      return `${tabLink(tab)}`;
    }
    if (!entry.reusable) return `<span class="nfh-cw-muted">Used up by the crime: give one (row marked Need)</span>`;
    const copy = availableCopy(v.live[tab], entry.item_id);
    if (!copy) return `<span class="nfh-cw-muted">None free in the armoury</span>`;
    const key = `${entry.player_id}:${entry.item_id}`;
    const name = entry.player_name || `#${entry.player_id}`;
    return `<button type="button" class="nfh-cw-btn nfh-cw-btn--primary" data-act="loan" data-key="${escapeHtml(key)}"${state2.busy.has(key) ? " disabled" : ""}
    title="Sends Torn one loan request now, as if you used the Loan box">${state2.busy.has(key) ? "Loaning\u2026" : `Loan to ${escapeHtml(name)}`}</button>`;
  }
  function renderMissing(v) {
    const parts = [`<div class="nfh-oci-heading">Missing items${v.missing.length ? ` (${v.missing.length})` : ""}</div>`];
    if (!v.missing.length) parts.push(`<div class="nfh-cw-muted">Everyone in a crime has their item.</div>`);
    for (const entry of v.missing) {
      parts.push(`<div class="nfh-oci-row">
      <span class="nfh-oci-who"><a href="/profiles.php?XID=${entry.player_id}">${escapeHtml(entry.player_name || `#${entry.player_id}`)}</a></span>
      <span class="nfh-oci-what"><strong>${escapeHtml(entry.item_name || `Item ${entry.item_id}`)}</strong>
        <span class="nfh-cw-muted">${escapeHtml(entry.position)} \xB7 ${escapeHtml(entry.crime)}</span></span>
      <span class="nfh-cw-actions">${missingAction(entry, v)}</span></div>`);
    }
    return parts;
  }
  function renderStaff(v) {
    const parts = [];
    if (v.show.missingPanel) parts.push(...renderMissing(v));
    if (v.where === "armoury" && v.show.retrievePanel) {
      parts.push(`<div class="nfh-oci-heading">Loaned, not needed${v.unused.length ? ` (${v.unused.length})` : ""}</div>`);
      if (!v.unused.length) parts.push(`<div class="nfh-cw-muted">No OC items are out with members who don't need them.</div>`);
      for (const loan2 of v.unused) {
        const action = v.tab === loan2.tab ? `<span class="nfh-cw-muted">${v.show.retrieveTags ? "Retrieve it on the marked row" : "Retrieve it on this tab"}</span>` : `${tabLink(loan2.tab)}`;
        parts.push(`<div class="nfh-oci-row">
        <span class="nfh-oci-who"><a href="/profiles.php?XID=${loan2.player_id}">${escapeHtml(loan2.player_name || `#${loan2.player_id}`)}</a></span>
        <span class="nfh-oci-what"><strong>${escapeHtml(loan2.item_name)}</strong> <span class="nfh-cw-muted">${escapeHtml(loan2.reason)}</span></span>
        <span class="nfh-cw-actions">${action}</span></div>`);
      }
      const staff = v.staff;
      const when = staff.loans_at ? new Date(staff.loans_at * 1e3).toISOString().slice(11, 16) : null;
      parts.push(
        `<div class="nfh-cw-muted nfh-oci-foot">${staff.loans_error ? escapeHtml(staff.loans_error) + " Open each armoury tab to check it here." : `Loans from Torn's armoury list${when ? ` at ${when} TCT` : ""} (Torn updates it up to hourly). Tabs you open here are read live.`}</div>`
      );
    }
    return parts.join("");
  }
  function render3(v) {
    const panel = document.getElementById(PANEL_ID);
    if (!panel) return;
    const staffPanel = v?.staff && (v.show.missingPanel || v.where === "armoury" && v.show.retrievePanel);
    const show = v && (v.mine.length || staffPanel);
    panel.hidden = !show && !state2.error;
    if (!show) {
      panel.innerHTML = state2.error ? `<div class="nfh-cw-bar"><span class="nfh-cw-error">${escapeHtml(state2.error)}</span></div>` : "";
      return;
    }
    const counts = [];
    if (v.mine.length) counts.push("your slot needs an item");
    const missingShown = v.staff && v.show.missingPanel;
    const retrieveShown = v.staff && v.where === "armoury" && v.show.retrievePanel;
    if (missingShown) counts.push(`${v.missing.length} missing`);
    if (retrieveShown) counts.push(`${v.unused.length} to retrieve`);
    const attention = v.mine.length || missingShown && v.missing.length || retrieveShown && v.unused.length;
    panel.classList.toggle("nfh-cw--attn", !!attention);
    const isCollapsed = collapsed();
    const message = state2.message ? `<div class="nfh-oci-message nfh-oci-message--${state2.message.tone}" role="status">${escapeHtml(state2.message.text)}</div>` : "";
    const hint = wantedTabHint(v);
    const html = `<div class="nfh-cw-bar">
      <button type="button" class="nfh-cw-toggle" data-act="toggle" aria-expanded="${!isCollapsed}"><span class="nfh-cw-caret">${isCollapsed ? "\u25B8" : "\u25BE"}</span> OC items</button>
      <span class="nfh-cw-status">${escapeHtml(counts.join(" \xB7 "))}</span>
    </div>${isCollapsed ? "" : `<div class="nfh-oci-body">${hint}${message}${renderMine(v.mine, v.where)}${staffPanel ? renderStaff(v) : ""}</div>`}`;
    if (panel.innerHTML !== html) panel.innerHTML = html;
  }
  function decorate(v) {
    if (!v || !v.staff || v.where !== "armoury" || !v.tab) return;
    const rows2 = v.live[v.tab] || [];
    const needers = needersByItem(v.missing.filter((entry) => entry.tab === v.tab));
    const retrieve = new Map(v.unused.filter((loan2) => loan2.tab === v.tab).map((loan2) => [`${loan2.player_id}:${loan2.item_id}`, loan2]));
    for (const row2 of rows2) {
      let badge = null;
      if (!row2.loanedTo && v.show.missingTags && needers.has(row2.itemId)) {
        const who = needers.get(row2.itemId);
        badge = { kind: "need", text: `Need \xD7${who.length}`, title: `Needed by ${who.map((entry) => `${entry.player_name || entry.player_id} (${entry.position}, ${entry.crime})`).join(", ")}` };
      } else if (row2.loanedTo && v.show.retrieveTags && retrieve.has(`${row2.loanedTo}:${row2.itemId}`)) {
        const loan2 = retrieve.get(`${row2.loanedTo}:${row2.itemId}`);
        badge = { kind: "retrieve", text: "Retrieve", title: `${loan2.player_name || loan2.player_id}: ${loan2.reason}` };
      }
      setBadge(row2.li, badge);
    }
    const box = openActionBox(v.tab);
    document.querySelectorAll(`.${FILL_CLASS}`).forEach((fill2) => {
      if (!box || !box.box.contains(fill2)) fill2.remove();
    });
    if (box && needers.has(box.itemId)) {
      const who = needers.get(box.itemId);
      const html = `<span class="nfh-cw-muted">Fill in:</span> ${who.map((entry) => `<button type="button" class="nfh-cw-chip" data-fill="${escapeHtml(`${entry.player_name} [${entry.player_id}]`)}">${escapeHtml(entry.player_name || entry.player_id)}</button>`).join(" ")}`;
      let fill2 = box.box.querySelector(`.${FILL_CLASS}`);
      if (!fill2) {
        fill2 = document.createElement("div");
        fill2.className = `nfh-cw ${FILL_CLASS}`;
        fill2.addEventListener("click", (event) => {
          const chip = event.target.closest("[data-fill]");
          if (!chip) return;
          event.preventDefault();
          setInputValue(box.input, chip.dataset.fill);
          box.input.focus();
        });
        box.box.appendChild(fill2);
      }
      if (fill2.innerHTML !== html) fill2.innerHTML = html;
    }
  }
  function setBadge(li, badge) {
    const name = li.querySelector(".name") || li;
    const existing = name.querySelector(`.${BADGE_CLASS}`);
    li.classList.toggle("nfh-oci-row--need", badge?.kind === "need");
    li.classList.toggle("nfh-oci-row--retrieve", badge?.kind === "retrieve");
    if (!badge) {
      existing?.remove();
      return;
    }
    if (existing && existing.textContent === badge.text && existing.title === badge.title) return;
    const element = existing || document.createElement("span");
    element.className = `${BADGE_CLASS} ${BADGE_CLASS}--${badge.kind}`;
    element.textContent = badge.text;
    element.title = badge.title;
    if (!existing) name.prepend(element);
  }
  function redraw() {
    const v = view();
    render3(v);
    decorate(v);
  }
  function scheduleRedraw() {
    clearTimeout(redrawTimer);
    redrawTimer = setTimeout(redraw, 250);
  }
  var ourNode = (node) => node.nodeType !== 1 || node.id === PANEL_ID || node.classList.contains(BADGE_CLASS) || node.classList.contains(FILL_CLASS) || !!node.closest?.(`#${PANEL_ID}`);
  function isOurs(record) {
    if (record.type === "attributes") {
      const before = new Set(String(record.oldValue || "").split(/\s+/).filter((name) => name && !name.startsWith("nfh-")));
      const after = new Set([...record.target.classList].filter((name) => !name.startsWith("nfh-")));
      return before.size === after.size && [...before].every((name) => after.has(name));
    }
    if (ourNode(record.target)) return true;
    return [...record.addedNodes, ...record.removedNodes].every(ourNode);
  }
  function watch(container) {
    if (observed === container) return;
    observer?.disconnect();
    observed = container;
    observer = new MutationObserver((records) => {
      if (!records.every(isOurs)) scheduleRedraw();
    });
    observer.observe(container, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"], attributeOldValue: true });
  }
  async function loan(key) {
    const v = view();
    const entry = v?.missing.find((candidate) => `${candidate.player_id}:${candidate.item_id}` === key);
    if (!entry || state2.busy.has(key)) return;
    const copy = availableCopy(v.live[entry.tab], entry.item_id);
    if (!copy) return;
    state2.busy.add(key);
    state2.message = null;
    redraw();
    try {
      const answer = await postTornAction("factions.php", {
        ajax: "true",
        step: "armouryActionItem",
        role: "loan",
        item: copy.armoryId,
        itemID: String(entry.item_id),
        type: copy.type,
        user: `${entry.player_name} [${entry.player_id}]`,
        quantity: "1"
      });
      const result = readLoanAnswer(answer.text);
      if (answer.ok && result.ok) {
        state2.loanedNow.add(key);
        state2.message = { tone: "ok", text: result.message || `Loaned ${entry.item_name} to ${entry.player_name}. The armoury list updates when Torn redraws it.` };
      } else {
        state2.message = { tone: "error", text: `Torn did not loan it${result.message ? `: ${result.message}` : ` (status ${answer.status})`}. Use the Loan box on the row instead.` };
      }
    } catch (error) {
      state2.message = { tone: "error", text: error.message };
    } finally {
      state2.busy.delete(key);
      redraw();
    }
  }
  function onPanelClick(event) {
    const target = event.target.closest("[data-act]");
    if (!target || target.disabled) return;
    if (target.dataset.act === "toggle") {
      try {
        localStorage.setItem(COLLAPSED_KEY, collapsed() ? "0" : "1");
      } catch (error) {
      }
      redraw();
    } else if (target.dataset.act === "loan") {
      loan(target.dataset.key);
    } else if (target.dataset.act === "go-tab") {
      const tab = target.dataset.tab;
      const anchor = tornTabAnchor(tab);
      if (anchor) {
        event.preventDefault();
        setWantedTab(null);
        anchor.click();
      } else {
        setWantedTab(tab);
      }
    }
  }
  var oc_items_default = {
    name: "OC items",
    pages: [PageType.FactionCrimes, PageType.FactionArmoury],
    init() {
      const where = place();
      if (!where) {
        document.getElementById(PANEL_ID)?.remove();
        observer?.disconnect();
        observed = null;
        return;
      }
      const settle = (container2) => {
        if (!document.getElementById(PANEL_ID)) PLACES[where].insert(container2);
        watch(where === "armoury" ? document.getElementById("faction-armoury") || container2 : container2.parentElement || container2);
        redraw();
        load2();
      };
      const container = document.querySelector(PLACES[where].container);
      if (container) settle(container);
      let tries = 10;
      const again = () => {
        const now = document.querySelector(PLACES[where].container);
        if (now && (!document.getElementById(PANEL_ID) || document.getElementById(PANEL_ID).nextElementSibling !== now)) {
          document.getElementById(PANEL_ID)?.remove();
          settle(now);
        }
        if (--tries > 0 && place() === where) setTimeout(again, 400);
      };
      setTimeout(again, 400);
    }
  };

  // src/features/oc-fines/logic.js
  var REASON_FOR_FLAG = {
    unqualified: "cpr_too_low",
    unproductive: "unproductive",
    underlevel: "cpr_too_high"
  };
  function defaultCrimeFor(context, reasonKey, presetCrimeId = null) {
    const reason = (context.reasons || []).find((r) => r.key === reasonKey);
    if (!reason || reason.crime === "never") return null;
    const crimes = context.crimes || [];
    if (presetCrimeId !== null && presetCrimeId !== void 0) {
      return String(presetCrimeId);
    }
    if (reason.default_crime_id !== null && reason.default_crime_id !== void 0) {
      const known = crimes.some((c) => String(c.crime_id) === String(reason.default_crime_id));
      if (known) return String(reason.default_crime_id);
    }
    return null;
  }
  function crimeChoices(context, preset = null) {
    const choices = (context.crimes || []).map((c) => ({ id: String(c.crime_id), label: c.label }));
    if (preset && preset.id && !choices.some((c) => c.id === String(preset.id))) {
      choices.unshift({ id: String(preset.id), label: `On this page \xB7 ${preset.label || "crime " + preset.id}` });
    }
    return choices;
  }
  function quoteLine(context, reasonKey) {
    const reason = (context.reasons || []).find((r) => r.key === reasonKey);
    return reason && reason.quote ? reason.quote.summary : "";
  }
  function bannerText(mine) {
    const unpaid = mine && mine.unpaid || [];
    if (unpaid.length === 0) return null;
    const totals = {};
    for (const fine of unpaid) {
      totals[fine.currency] = (totals[fine.currency] || 0) + (fine.amount || 0);
    }
    const parts = Object.entries(totals).map(
      ([currency, amount]) => currency === "cash" ? `$${amount.toLocaleString("en-US")}` : `${amount.toLocaleString("en-US")} points`
    );
    return `You owe ${parts.join(" and ")} in OC fines (${unpaid.length} unpaid).`;
  }
  function fineChipLabel(fine) {
    return [fine.player_name || `[${fine.player_id}]`, fine.penalty, fine.reason].filter(Boolean).join(" \xB7 ");
  }
  var PANEL_MARGIN = 8;
  var PANEL_MIN_BODY = 120;
  function panelPosition(pos, { width, height }, { panelWidth, headHeight }) {
    if (!pos || !Number.isFinite(pos.left) || !Number.isFinite(pos.top)) return null;
    if (pos.left < 0 || pos.top < 0) return null;
    if (pos.left + panelWidth > width) return null;
    if (pos.top + headHeight + PANEL_MIN_BODY > height) return null;
    return { left: Math.round(pos.left), top: Math.round(pos.top) };
  }
  function clampPanel(left, top, { width, height }, { panelWidth, headHeight }) {
    const maxLeft = Math.max(0, width - panelWidth);
    const maxTop = Math.max(0, height - headHeight - PANEL_MIN_BODY);
    return {
      left: Math.round(Math.min(Math.max(left, 0), maxLeft)),
      top: Math.round(Math.min(Math.max(top, 0), maxTop))
    };
  }
  function recipientFor(fine) {
    return fine.player_name ? `${fine.player_name} [${fine.player_id}]` : String(fine.player_id);
  }

  // src/features/oc-fines/form.js
  function describeError(error, fallback) {
    if (error instanceof ApiError) {
      if (error.body && error.body.message) return error.body.message;
      if (error.status === 403) return "You can't give OC fines to this member.";
    }
    return fallback;
  }
  async function openFineForm(container, opts) {
    container.innerHTML = `<div class="nfh-ocf-form nfh-cw-muted">Loading\u2026</div>`;
    let context;
    try {
      const params = new URLSearchParams({ player_id: String(opts.playerId) });
      if (opts.crime && opts.crime.id) params.set("crime_id", String(opts.crime.id));
      context = (await api(`/oc-fines/context?${params}`)).data;
    } catch (error) {
      container.innerHTML = `<div class="nfh-ocf-form nfh-ocf-error">${escapeHtml(describeError(error, "Couldn't reach nuke.family."))}</div>`;
      return;
    }
    const state8 = {
      reason: opts.reason && context.reasons.some((r) => r.key === opts.reason) ? opts.reason : "",
      crime: null,
      note: "",
      busy: false,
      error: null,
      issued: null
    };
    state8.crime = state8.reason ? defaultCrimeFor(context, state8.reason, opts.crime ? opts.crime.id : null) : null;
    const render7 = () => {
      if (state8.issued) {
        const fine = state8.issued;
        container.innerHTML = `<div class="nfh-ocf-form nfh-ocf-done">
        \u2705 ${fine.kind === "warning" ? "Warning" : "Fine"} #${escapeHtml(fine.id)}: ${escapeHtml(fine.reason_label)}, <strong>${escapeHtml(fine.penalty)}</strong>${fine.strike ? ` (strike ${escapeHtml(fine.strike)})` : ""}.
        <div class="nfh-ocf-actions">
          <a class="nfh-cw-btn nfh-cw-btn--primary" href="https://www.torn.com/messages.php#/p=compose&XID=${encodeURIComponent(fine.player_id)}">Write the mail</a>
          <a class="nfh-cw-btn" href="${escapeHtml(fine.url)}" target="_blank" rel="noopener">Open on nuke.family</a>
        </div>
        <div class="nfh-cw-muted">The mail is under &ldquo;Recent fines&rdquo; in the template bar on Torn's compose page.</div>
      </div>`;
        return;
      }
      const reason = context.reasons.find((r) => r.key === state8.reason);
      const choices = crimeChoices(context, opts.crime);
      const crimeField = !reason || reason.crime === "never" ? reason ? `<div class="nfh-cw-muted">This reason is about not being in a crime, so it names none.</div>` : "" : `<label class="nfh-ocf-field"><span>Crime</span><select class="nfh-cw-input" data-ocf="crime">
            <option value="">None</option>
            ${choices.map((c) => `<option value="${escapeHtml(c.id)}"${c.id === state8.crime ? " selected" : ""}>${escapeHtml(c.label)}</option>`).join("")}
          </select></label>`;
      const quote = state8.reason ? quoteLine(context, state8.reason) : "";
      container.innerHTML = `<div class="nfh-ocf-form">
      <div class="nfh-cw-muted">Fining <strong>${escapeHtml(context.player.name || opts.playerId)}</strong> in ${escapeHtml(context.faction.name)}</div>
      <label class="nfh-ocf-field"><span>Reason</span><select class="nfh-cw-input" data-ocf="reason">
        <option value="">Choose a reason\u2026</option>
        ${context.reasons.map((r) => `<option value="${escapeHtml(r.key)}"${r.key === state8.reason ? " selected" : ""} title="${escapeHtml(r.description)}">${escapeHtml(r.label)}</option>`).join("")}
      </select></label>
      ${crimeField}
      <label class="nfh-ocf-field"><span>Note${reason && reason.note_required ? " (required)" : ""}</span>
        <textarea class="nfh-cw-input" data-ocf="note" rows="2" maxlength="1000">${escapeHtml(state8.note)}</textarea></label>
      ${quote ? `<div class="nfh-ocf-quote">${escapeHtml(quote)}</div>` : ""}
      ${state8.error ? `<div class="nfh-ocf-error">${escapeHtml(state8.error)}</div>` : ""}
      <div class="nfh-ocf-actions">
        <button type="button" class="nfh-cw-btn nfh-cw-btn--primary" data-ocf-act="issue"${state8.busy || !state8.reason ? " disabled" : ""}>${state8.busy ? "Issuing\u2026" : "Issue"}</button>
        <button type="button" class="nfh-cw-btn" data-ocf-act="close">Cancel</button>
      </div>
      ${(context.record || []).length ? recordHtml(context.record) : ""}
    </div>`;
    };
    const issue = async (force = false) => {
      state8.busy = true;
      state8.error = null;
      render7();
      try {
        const payload = {
          player_id: Number(opts.playerId),
          faction_id: context.faction.id,
          reason: state8.reason,
          via: "script",
          details: opts.details || {}
        };
        if (state8.crime) payload.crime_id = Number(state8.crime);
        if (state8.note.trim()) payload.note = state8.note.trim();
        if (force) payload.force = true;
        const result = await api("/oc-fines", { method: "POST", data: payload });
        state8.issued = result.data;
        LogInfo(`[oc-fines] issued fine ${result.data.id} to ${opts.playerId}`);
        if (opts.onIssued) opts.onIssued(result.data);
      } catch (error) {
        if (error instanceof ApiError && error.status === 409 && !force) {
          state8.error = `${describeError(error, "Already fined.")} Press Issue again to give another anyway.`;
          state8.forceNext = true;
        } else {
          state8.error = describeError(error, "Couldn't issue the fine. Try again.");
        }
      }
      state8.busy = false;
      render7();
    };
    container.onchange = (event) => {
      const field = event.target.getAttribute("data-ocf");
      if (field === "reason") {
        state8.reason = event.target.value;
        state8.crime = defaultCrimeFor(context, state8.reason, opts.crime ? opts.crime.id : null);
        state8.forceNext = false;
        render7();
      } else if (field === "crime") {
        state8.crime = event.target.value || null;
      }
    };
    container.oninput = (event) => {
      if (event.target.getAttribute("data-ocf") === "note") state8.note = event.target.value;
    };
    container.onclick = (event) => {
      const act2 = event.target.closest("[data-ocf-act]");
      if (!act2) return;
      if (act2.getAttribute("data-ocf-act") === "issue" && !state8.busy) {
        issue(Boolean(state8.forceNext));
      } else if (act2.getAttribute("data-ocf-act") === "close") {
        container.innerHTML = "";
        if (opts.onClose) opts.onClose();
      }
    };
    render7();
  }
  function recordHtml(record) {
    return `<details class="nfh-ocf-record"><summary>Their OC record (${record.length})</summary><ul>${record.map(
      (fine) => `<li>${escapeHtml(new Date(fine.issued_at * 1e3).toISOString().slice(0, 10))} \xB7 ${escapeHtml(fine.reason_label)} \xB7 ${escapeHtml(fine.penalty)} \xB7 ${escapeHtml(fine.status_label)}</li>`
    ).join("")}</ul></details>`;
  }

  // src/features/oc-fines/index.js
  var FINE_PERMISSION = "oc_fine.issue";
  var BOX_CLASS = "nfh-ocf-box";
  var BANNER_ID2 = "nfh-ocf-banner";
  var MINE_CACHE_KEY = "nfhOcFinesMine";
  var MINE_TTL_MS = 30 * 60 * 1e3;
  var BANNER_HIDDEN_KEY = "nfhOcFinesBannerHidden";
  async function canFineProfile() {
    const permissions = await getOwnPermissions();
    if (!permissions.includes(FINE_PERMISSION)) return false;
    const profileFaction = getFactionId();
    if (!profileFaction) return false;
    const own = ocConfigStore.data && ocConfigStore.data.faction_id;
    return !own || String(own) === String(profileFaction);
  }
  async function insertProfileBox() {
    if (!IsPage(PageType.Profile) || !getApiToken()) return;
    const playerId = getPlayerId();
    if (!playerId || String(playerId) === String(getUserscriptUsersPlayerId())) return;
    if (document.querySelector(`.${BOX_CLASS}`)) return;
    if (!await canFineProfile()) return;
    const wrapper = await waitForElm("div.profile-left-wrapper");
    if (document.querySelector(`.${BOX_CLASS}`)) return;
    const box = document.createElement("div");
    box.className = `${BOX_CLASS} nfh-section m-top10`;
    box.innerHTML = `<div>
    <p class="nfh-section-title title-black top-round">OC Fines</p>
    <div class="nfh-section-container">
      <button type="button" class="nfh-ocf-open">Give OC fine</button>
      <div class="nfh-ocf-slot"></div>
    </div>
  </div>`;
    const openButton = box.querySelector(".nfh-ocf-open");
    const slot = box.querySelector(".nfh-ocf-slot");
    openButton.addEventListener("click", () => {
      openButton.hidden = true;
      openFineForm(slot, {
        playerId,
        onClose: () => {
          openButton.hidden = false;
        }
      });
    });
    const reputation = document.querySelector(".nfh-reputation");
    if (reputation) {
      reputation.insertAdjacentElement("afterend", box);
    } else if (wrapper.firstChild && wrapper.firstChild.nextSibling) {
      wrapper.insertBefore(box, wrapper.firstChild.nextSibling);
    } else {
      wrapper.appendChild(box);
    }
  }
  async function loadMine() {
    try {
      const cached = JSON.parse(localStorage.getItem(MINE_CACHE_KEY) || "null");
      if (cached && Date.now() - cached.at < MINE_TTL_MS) return cached.data;
    } catch (e) {
    }
    try {
      const data = await api("/oc-fines/mine");
      localStorage.setItem(MINE_CACHE_KEY, JSON.stringify({ at: Date.now(), data }));
      return data;
    } catch (error) {
      return null;
    }
  }
  async function showBanner() {
    if (!getApiToken() || document.getElementById(BANNER_ID2)) return;
    if (sessionStorage.getItem(BANNER_HIDDEN_KEY)) return;
    if (!IsPage(PageType.Faction) || !window.location.search.includes("step=your")) return;
    const mine = await loadMine();
    const text = bannerText(mine);
    if (!text || document.getElementById(BANNER_ID2)) return;
    const banner = document.createElement("div");
    banner.id = BANNER_ID2;
    banner.className = "nfh-ocf-banner";
    banner.innerHTML = `<span>\u2696\uFE0F ${escapeHtml(text)}</span>
    ${mine.deposit_instructions ? `<span class="nfh-ocf-banner__how">${escapeHtml(mine.deposit_instructions)}</span>` : ""}
    <a href="${escapeHtml(mine.links && mine.links.mine || "https://nuke.family/my-oc-fines")}" target="_blank" rel="noopener">My OC fines</a>
    <button type="button" aria-label="Hide until next session">\u2715</button>`;
    banner.querySelector("button").addEventListener("click", () => {
      sessionStorage.setItem(BANNER_HIDDEN_KEY, "1");
      banner.remove();
    });
    const anchor = document.querySelector(".content-wrapper") || document.querySelector("#mainContainer");
    if (anchor) anchor.insertAdjacentElement("afterbegin", banner);
  }
  function init4() {
    insertProfileBox();
    showBanner();
  }
  var oc_fines_default = {
    name: "oc-fines",
    pages: [PageType.Profile, PageType.Faction],
    init: init4
  };
  var MODAL_ID = "nfh-ocf-modal";
  function openFineModal(opts) {
    document.getElementById(MODAL_ID)?.remove();
    const modal = document.createElement("div");
    modal.id = MODAL_ID;
    modal.className = "nfh-ocf-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-label", "Give OC fine");
    modal.innerHTML = `<div class="nfh-ocf-modal__head" title="Drag to move \xB7 double-click to put back"><strong>Give OC fine</strong><button type="button" aria-label="Close">\u2715</button></div><div class="nfh-ocf-modal__body"></div>`;
    const head = modal.querySelector(".nfh-ocf-modal__head");
    const close = () => {
      window.removeEventListener("resize", onResize);
      modal.remove();
    };
    head.querySelector("button").addEventListener("click", close);
    document.body.appendChild(modal);
    const sizes = () => ({ panelWidth: modal.offsetWidth, headHeight: head.offsetHeight });
    const viewport = () => ({ width: window.innerWidth, height: window.innerHeight });
    const place2 = (pos) => {
      if (pos) {
        modal.classList.add("nfh-ocf-modal--placed");
        modal.style.left = `${pos.left}px`;
        modal.style.top = `${pos.top}px`;
        modal.style.maxHeight = `${window.innerHeight - pos.top - PANEL_MARGIN}px`;
      } else {
        modal.classList.remove("nfh-ocf-modal--placed");
        modal.style.left = modal.style.top = modal.style.maxHeight = "";
      }
    };
    place2(panelPosition(loadPanelPosition(), viewport(), sizes()));
    function onResize() {
      if (!modal.classList.contains("nfh-ocf-modal--placed")) return;
      const pos = { left: parseFloat(modal.style.left), top: parseFloat(modal.style.top) };
      if (!panelPosition(pos, viewport(), sizes())) place2(null);
    }
    window.addEventListener("resize", onResize);
    head.addEventListener("dblclick", (event) => {
      if (event.target.closest("button")) return;
      place2(null);
      savePanelPosition(null);
    });
    head.addEventListener("pointerdown", (event) => {
      if (event.button !== 0 || event.target.closest("button")) return;
      const rect = modal.getBoundingClientRect();
      const offsetX = event.clientX - rect.left;
      const offsetY = event.clientY - rect.top;
      let moved = null;
      head.setPointerCapture(event.pointerId);
      const onMove = (e) => {
        moved = clampPanel(e.clientX - offsetX, e.clientY - offsetY, viewport(), sizes());
        place2(moved);
      };
      const onUp = () => {
        head.removeEventListener("pointermove", onMove);
        head.removeEventListener("pointerup", onUp);
        head.removeEventListener("pointercancel", onUp);
        if (moved) savePanelPosition(moved);
      };
      head.addEventListener("pointermove", onMove);
      head.addEventListener("pointerup", onUp);
      head.addEventListener("pointercancel", onUp);
      event.preventDefault();
    });
    openFineForm(modal.querySelector(".nfh-ocf-modal__body"), { ...opts, onClose: close });
  }
  var PANEL_KEY = "nfhOcFinePanel";
  function loadPanelPosition() {
    try {
      return JSON.parse(getItem(PANEL_KEY) || "null");
    } catch {
      return null;
    }
  }
  function savePanelPosition(pos) {
    setItem(PANEL_KEY, pos ? JSON.stringify(pos) : null);
  }

  // src/features/organized-crimes/page.js
  var CRIMES_ROOT_SELECTOR = "#faction-crimes-root";
  var SubTab = {
    Recruiting: "recruiting",
    Planning: "planning",
    Completed: "completed"
  };
  function activeSubTab(root3) {
    for (const name of root3.querySelectorAll('[class^="tabName___"]')) {
      const button3 = name.closest("button");
      if (button3 && /(^|\s)active___/.test(button3.className)) {
        return name.textContent.trim().toLowerCase();
      }
    }
    return null;
  }
  function planningProgress(slotEl) {
    const clock = slotEl.querySelector('[class^="slotIcon___"] [class^="planning___"]');
    if (!clock) return 0;
    const match = /conic-gradient\([^,]*?([\d.]+)deg/.exec(clock.getAttribute("style") || "");
    if (!match) return 0;
    return Math.min(1, Math.max(0, parseFloat(match[1]) / 360));
  }
  function readSlot(headerEl) {
    const titleEl = headerEl.querySelector('[class^="title___"]');
    if (!titleEl) return null;
    const el = headerEl.parentElement;
    const chanceEl = headerEl.querySelector('[class^="successChance___"]');
    const cpr = chanceEl ? parseFloat(chanceEl.textContent) : NaN;
    const occupied = !!el.querySelector('[class^="badge___"]');
    const joinButton = el.querySelector('button[class*="joinButton___"]');
    const profile = occupied ? el.querySelector('a[href*="profiles.php?XID="]') : null;
    const playerId = profile ? /XID=(\d+)/.exec(profile.getAttribute("href")) : null;
    return {
      el,
      headerEl,
      titleEl,
      name: titleEl.textContent.trim(),
      // On an empty slot this is the viewer's own CPR for the role; on a filled
      // one it is the occupant's.
      cpr: Number.isNaN(cpr) ? null : cpr,
      occupied,
      playerId: playerId ? playerId[1] : null,
      progress: occupied ? planningProgress(el) : 0,
      joinButton
    };
  }
  function crimeName(crimeEl) {
    const titleEl = crimeEl.querySelector('[class^="panelTitle___"]');
    if (!titleEl) return null;
    let name = "";
    for (const node of titleEl.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) name += node.textContent;
    }
    return name.trim() || null;
  }
  function readCrimes(root3) {
    const crimes = [];
    for (const el of root3.querySelectorAll("[data-oc-id]")) {
      const name = crimeName(el);
      if (!name) continue;
      const levelEl = el.querySelector('[class^="levelValue___"]');
      const slots = [];
      for (const headerEl of el.querySelectorAll('button[class^="slotHeader___"]')) {
        const slot = readSlot(headerEl);
        if (slot) slots.push(slot);
      }
      crimes.push({
        id: el.getAttribute("data-oc-id"),
        el,
        name,
        level: levelEl ? parseInt(levelEl.textContent, 10) || null : null,
        slots
      });
    }
    return crimes;
  }
  var JoinState = {
    Open: "open",
    // at least one slot can be joined
    Blocked: "blocked",
    // there are open slots, but Torn has every Join button disabled
    Full: "full"
    // no open slot is loaded
  };
  function joinState(crimes) {
    const buttons2 = crimes.flatMap(
      (crime) => crime.slots.map((slot) => slot.joinButton).filter(Boolean)
    );
    if (buttons2.length === 0) return JoinState.Full;
    return buttons2.some((button3) => !button3.disabled) ? JoinState.Open : JoinState.Blocked;
  }

  // src/features/organized-crimes/view.js
  var BAR_ID = "nfh-oc-bar";
  var CHIP_CLASS = "nfh-oc-min";
  var TAG_CLASS = "nfh-oc-tag";
  var PICK_CLASS = "nfh-oc-pick";
  var FLAGS_CLASS = "nfh-oc-flags";
  var FLAG_SYMBOLS = { [Flag.Unqualified]: "\u2716", [Flag.Unproductive]: "\u23F3", [Flag.UnderLevel]: "\u2B07" };
  var CHIP_STATES = ["ok", "below", "filled", "weight"];
  function chipFor(rated) {
    const { slot, minCpr, weight, status, assumed } = rated;
    if (minCpr === null) return null;
    const weightNote = (weight === null ? " How much this role matters is not known yet." : ` This role carries ${weight.toFixed(1)}% of the crime's outcome.`) + (assumed ? " Your faction has not set a minimum for it, so this is the usual one for the crime's level." : "");
    switch (status) {
      case SlotStatus.Eligible:
        return {
          state: "ok",
          title: `Your CPR of ${slot.cpr} meets your faction's minimum of ${minCpr} for this role.${weightNote}`
        };
      case SlotStatus.Below:
        return {
          state: "below",
          title: `Your CPR of ${slot.cpr} is below your faction's minimum of ${minCpr} for this role.${weightNote}`
        };
      case SlotStatus.Filled:
        return { state: "filled", title: `Your faction's minimum CPR for this role is ${minCpr}.${weightNote}` };
      default:
        return null;
    }
  }
  function weightChipFor(rated) {
    if (rated.weight === null) return null;
    const weight = `${rated.weight.toFixed(1)}%`;
    return { state: "weight", html: `Weight ${weight}`, title: `This role carries ${weight} of the crime's outcome.` };
  }
  function renderMinimum(rated, showMinimum = true, showWeight = false) {
    const { slot, minCpr, weight } = rated;
    const existing = slot.el.querySelector(`:scope > .${CHIP_CLASS}`);
    let chip = null;
    if (showMinimum) {
      chip = chipFor(rated);
      if (chip) {
        chip.html = `Min CPR ${escapeHtml(minCpr)}`;
        if (showWeight && weight !== null) {
          chip.html += ` <span class="${CHIP_CLASS}-weight">&middot; ${weight.toFixed(1)}%</span>`;
        }
      }
    } else if (showWeight) {
      chip = weightChipFor(rated);
    }
    if (!chip) {
      if (existing) existing.remove();
      return;
    }
    const element = existing || document.createElement("div");
    if (element.dataset.nfhHtml !== chip.html) {
      element.dataset.nfhHtml = chip.html;
      element.innerHTML = chip.html;
    }
    if (element.title !== chip.title) element.title = chip.title;
    element.classList.add(CHIP_CLASS);
    for (const state8 of CHIP_STATES) {
      element.classList.toggle(`${CHIP_CLASS}--${state8}`, state8 === chip.state);
    }
    if (!existing) slot.headerEl.insertAdjacentElement("afterend", element);
  }
  function renderFlags(slot, flags, fineOffer2 = null) {
    const existing = slot.el.querySelector(`:scope > .${FLAGS_CLASS}`);
    if (flags.length === 0) {
      if (existing) existing.remove();
      return;
    }
    const html = flags.map(
      (flag) => `<span class="nfh-oc-flag nfh-oc-flag--${flag.flag}" title="${escapeHtml(`${FLAG_LABELS[flag.flag]}: ${flag.title}`)}"><span aria-hidden="true">${FLAG_SYMBOLS[flag.flag]}</span> ${escapeHtml(flag.text)}</span>`
    ).join("") + (fineOffer2 ? `<button type="button" class="nfh-oc-flag nfh-ocf-flag-btn" data-nfh-ocf="${escapeHtml(JSON.stringify(fineOffer2))}" title="Give this member an OC fine">\u2696 Fine</button>` : "");
    const element = existing || document.createElement("div");
    if (element.dataset.nfhHtml !== html) {
      element.dataset.nfhHtml = html;
      element.innerHTML = html;
    }
    if (!existing) {
      element.className = FLAGS_CLASS;
      const anchor = slot.el.querySelector(`:scope > .${CHIP_CLASS}`) || slot.headerEl;
      anchor.insertAdjacentElement("afterend", element);
    }
  }
  var FLAG_KINDS = [Flag.Unqualified, Flag.Unproductive, Flag.UnderLevel];
  function staffHtml(staff, after = "") {
    const shown2 = FLAG_KINDS.filter((kind) => staff.prefs.show[kind]);
    const summary = shown2.length === 0 ? "all hidden" : shown2.map((kind) => `${staff.counts[kind] || 0} ${FLAG_LABELS[kind].toLowerCase()}`).join(", ");
    return `<span class="nfh-oc-staff"><span class="nfh-oc-bar-muted">Staff flags on this page:</span> ${escapeHtml(summary)} ${after}</span>`;
  }
  function staffSettingsHtml(staff) {
    const toggles = FLAG_KINDS.map(
      (kind) => `<label class="nfh-oc-staff-option"><input type="checkbox" data-nfh-oc-flag="${kind}"${staff.prefs.show[kind] ? " checked" : ""}> <span class="nfh-oc-flag nfh-oc-flag--${kind}"><span aria-hidden="true">${FLAG_SYMBOLS[kind]}</span> ${FLAG_LABELS[kind]}</span></label>`
    ).join("");
    const override = (name, label, value, fallback) => `<label class="nfh-oc-staff-option">${label} <input type="number" min="1" class="nfh-oc-staff-number" data-nfh-oc-limit="${name}" value="${escapeHtml(value ?? "")}" placeholder="${escapeHtml(fallback)}"></label>`;
    return '<div class="nfh-oc-settings-group"><span class="nfh-oc-settings-heading">Staff flags</span>' + toggles + override("thresholdHours", "Not productive after (hours)", staff.prefs.thresholdHours, staff.factionLimits.thresholdHours) + override("levelGap", "Under-levelled from (levels below)", staff.prefs.levelGap, staff.factionLimits.levelGap) + `<span class="nfh-oc-bar-muted">Leave a number blank to use your faction's. These choices are yours alone.</span></div>`;
  }
  var ITEM_OPTIONS = [
    ["missing", "Missing items", [["missing_panel", "In the OC Items panel"], ["missing_tags", "Tagged Need on the armoury"]]],
    ["retrieve", "Loaned, not needed", [["retrieve_panel", "In the OC Items panel"], ["retrieve_tags", "Tagged Retrieve on the armoury"]]]
  ];
  function itemSettingsHtml(items) {
    const on = (value) => value ? "on" : "off";
    const groups = ITEM_OPTIONS.filter(([kind]) => items.kinds[kind]).map(
      ([, title, options]) => `<span class="nfh-oc-bar-muted">${title}:</span>` + options.map(
        ([key, label]) => `<label class="nfh-oc-staff-option" title="Your faction's default: ${on(items.defaults[key])}"><input type="checkbox" data-nfh-oc-item="${key}"${items.show[key] ? " checked" : ""}> ${label}</label>`
      ).join("")
    ).join("");
    if (!groups) return "";
    const note = items.changed ? `You changed these; your faction's defaults are shown on hover. <button type="button" class="nfh-oc-link-button" data-nfh-oc-items-reset>Use your faction's choices</button>` : "Your faction's defaults. Changes are yours alone, in this browser.";
    return `<div class="nfh-oc-settings-group"><span class="nfh-oc-settings-heading">OC items</span>${groups}<span class="nfh-oc-bar-muted">${note}</span></div>`;
  }
  function settingsHtml({ open, weights, staff, items = null }) {
    const button3 = `<button type="button" class="nfh-oc-bar-button" data-nfh-oc-settings-toggle aria-expanded="${open ? "true" : "false"}">Settings</button>`;
    if (!open) return { button: button3, panel: "" };
    const faction = `Your faction ${weights.factionShows ? "shows" : "hides"} them by default.`;
    const note = weights.own ? `You changed this. ${faction} <button type="button" class="nfh-oc-link-button" data-nfh-oc-weights-reset>Use your faction's choice</button>` : faction;
    const weightsGroup = `<div class="nfh-oc-settings-group"><label class="nfh-oc-staff-option"><input type="checkbox" data-nfh-oc-weights${weights.show ? " checked" : ""}> Show role weights</label><span class="nfh-oc-bar-muted">${note}</span></div>`;
    return {
      button: button3,
      panel: `<div class="nfh-oc-staff-panel">${weightsGroup}${staff ? staffSettingsHtml(staff) : ""}${items ? itemSettingsHtml(items) : ""}</div>`
    };
  }
  var TAG_TEXT = { [Rank.Best]: "Best for you", [Rank.Good]: "Good for you" };
  var TAG_TEXT_FLAWED = { [Rank.Best]: "Best available", [Rank.Good]: "Also available" };
  function suggestionCaveats(suggestion2) {
    const caveats = [];
    if (!suggestion2.productive) {
      caveats.push({
        flag: Flag.Unproductive,
        text: `${Math.round(suggestion2.waitHours)}h wait`,
        title: `Your planning would start ${describeWait(suggestion2.waitHours)}, later than the ${suggestion2.thresholdHours} hours that count as productive.`
      });
    }
    if (suggestion2.belowLevel) {
      caveats.push({
        flag: Flag.UnderLevel,
        text: "Below your level",
        title: `This crime is below your level (${suggestion2.memberLevel}).`
      });
    }
    return caveats;
  }
  function waitSentence(suggestion2) {
    if (suggestion2.stalled) {
      return "Everyone in it has finished planning, so it is stalled until its open slots are filled. Your planning would start now.";
    }
    return `Your planning would start ${describeWait(suggestion2.waitHours)}.`;
  }
  function tagTitle(suggestion2) {
    const caveats = suggestionCaveats(suggestion2);
    if (caveats.length > 0) return caveats.map((caveat) => caveat.title).join(" ");
    if (suggestion2.stalled) return waitSentence(suggestion2);
    return suggestion2.pooled === false ? "Productive days do not count at this level, so this goes on your CPR and how close the crime is to full." : waitSentence(suggestion2);
  }
  function renderSuggestions(root3, suggestions) {
    const wanted = new Map(
      suggestions.filter((suggestion2) => suggestion2.rated.slot.el).map((suggestion2) => [suggestion2.rated.slot.el, suggestion2])
    );
    for (const marked of root3.querySelectorAll(`.${PICK_CLASS}`)) {
      if (wanted.has(marked)) continue;
      marked.classList.remove(PICK_CLASS, `${PICK_CLASS}--best`, `${PICK_CLASS}--good`);
      const tag = marked.querySelector(`:scope > .${TAG_CLASS}`);
      if (tag) tag.remove();
    }
    for (const [slotEl, suggestion2] of wanted) {
      slotEl.classList.add(PICK_CLASS);
      slotEl.classList.toggle(`${PICK_CLASS}--best`, suggestion2.rank === Rank.Best);
      slotEl.classList.toggle(`${PICK_CLASS}--good`, suggestion2.rank === Rank.Good);
      let tag = slotEl.querySelector(`:scope > .${TAG_CLASS}`);
      if (!tag) {
        tag = document.createElement("div");
        tag.className = TAG_CLASS;
        slotEl.prepend(tag);
      }
      const caveats = suggestionCaveats(suggestion2);
      const html = escapeHtml((caveats.length > 0 ? TAG_TEXT_FLAWED : TAG_TEXT)[suggestion2.rank]) + caveats.map(
        (caveat) => `<span class="nfh-oc-flag nfh-oc-flag--${caveat.flag}"><span aria-hidden="true">${FLAG_SYMBOLS[caveat.flag]}</span> ${escapeHtml(caveat.text)}</span>`
      ).join("");
      if (tag.dataset.nfhHtml !== html) {
        tag.dataset.nfhHtml = html;
        tag.innerHTML = html;
      }
      const title = tagTitle(suggestion2);
      if (tag.title !== title) tag.title = title;
    }
  }
  function spawnHtml(spawn) {
    if (spawn.message) {
      return `<span class="nfh-oc-spawn${spawn.error ? " nfh-oc-bar-warning" : ""}">${escapeHtml(spawn.message)}</span>`;
    }
    if (spawn.asked) {
      return '<span class="nfh-oc-spawn nfh-oc-bar-muted">You have asked staff for a crime. You can ask again later.</span>';
    }
    return `<span class="nfh-oc-spawn">${spawn.quiet ? "" : '<span class="nfh-oc-bar-muted">Nothing decent is open at your level.</span> '}<button type="button" class="nfh-oc-bar-button" data-nfh-oc-spawn${spawn.busy ? " disabled" : ""}>${spawn.busy ? "Asking..." : `Ask staff for a level ${escapeHtml(spawn.tier)} crime`}</button></span>`;
  }
  function stalledHint(count) {
    if (!count) return "";
    const crimes = count === 1 ? "1 stalled crime further down the list has" : `${count} stalled crimes further down the list have`;
    return ` <span class="nfh-oc-bar-muted" data-nfh-oc-stalled-hint>${escapeHtml(crimes)} an open slot your CPR is not known for yet. Scroll down to check it.</span>`;
  }
  function barHtml(state8) {
    const label = '<span class="nfh-oc-bar-label">OC Assistant</span>';
    if (state8.kind === "best") {
      const [best, ...rest] = state8.suggestions;
      const { slot, minCpr } = best.rated;
      const others = rest.filter((suggestion2) => !suggestion2.crime.offPage);
      const flawed = suggestionCaveats(best).length > 0;
      const more = others.length > 0 ? ` <span class="nfh-oc-bar-muted">${others.length} other ${flawed ? "" : "good "}slot${others.length === 1 ? " is" : "s are"} marked below.</span>` : "";
      const unweighted = best.rated.weight === null ? ' <span class="nfh-oc-bar-muted">This crime is too new to have role weights, so this goes on your CPR and its level alone.</span>' : "";
      const offPage = best.crime.offPage ? ' <span class="nfh-oc-bar-muted">It is further down the list and may have been taken in the last few minutes.</span>' : "";
      const late = best.productive ? "" : ` <strong class="nfh-oc-bar-warning">That is later than the ${escapeHtml(best.thresholdHours)} hours that count as productive,</strong> <span class="nfh-oc-bar-muted">but nothing open would start you sooner.</span>`;
      const belowLevel = best.belowLevel ? ` <strong class="nfh-oc-bar-warning">This crime is below your level (${escapeHtml(best.memberLevel)}).</strong>` : "";
      let lead = flawed ? "Best slot available: " : "Best slot for you: ";
      if (state8.warning) {
        lead = `<strong class="nfh-oc-bar-warning">${escapeHtml(state8.warning)}</strong> ${flawed ? "The best slot available: " : "A better slot: "}`;
      }
      return `${label}<span class="nfh-oc-bar-text">${lead}<strong>${escapeHtml(best.crime.name)}</strong> (level ${escapeHtml(best.crime.level ?? "?")}), <strong>${escapeHtml(slot.name)}</strong>. Your CPR is ${escapeHtml(slot.cpr)} and the minimum is ${escapeHtml(minCpr)}. ${best.pooled === false && !best.stalled ? "" : escapeHtml(waitSentence(best))}${late}${belowLevel}${unweighted}${offPage}${more}${stalledHint(state8.hiddenStalled)}</span><button type="button" class="nfh-oc-bar-button" data-nfh-oc-show>${best.crime.offPage ? "Scroll down" : "Show me"}</button>`;
    }
    if (state8.kind === "joined") {
      return `${label}<span class="nfh-oc-bar-text">You are in <strong>${escapeHtml(state8.crime)}</strong> (level ${escapeHtml(state8.level ?? "?")}) as <strong>${escapeHtml(state8.role)}</strong>, so no other slot is suggested.</span>`;
    }
    if (state8.kind === "warning") {
      return `${label}<span class="nfh-oc-bar-text"><strong class="nfh-oc-bar-warning">${escapeHtml(state8.warning)}</strong></span>`;
    }
    const messages = {
      none: "None of the open slots loaded so far meets your faction's minimum CPR for you. Scroll down to load more crimes.",
      blocked: "Torn is not letting you join a crime right now (you are probably already in one), so no slot is suggested.",
      full: "No open slot is loaded yet. Scroll down to load more crimes.",
      low: "The open slots you qualify for are all in crimes below your level, so none is suggested."
    };
    const hint = state8.kind === "blocked" ? "" : stalledHint(state8.hiddenStalled);
    return `${label}<span class="nfh-oc-bar-text">${messages[state8.kind]}${hint}</span>`;
  }
  function renderBar2(root3, html) {
    let bar2 = document.getElementById(BAR_ID);
    if (!bar2) {
      bar2 = document.createElement("div");
      bar2.id = BAR_ID;
      bar2.className = "nfh-oc-bar";
      root3.parentElement.insertBefore(bar2, root3);
    }
    if (bar2.dataset.nfhHtml !== html) {
      bar2.dataset.nfhHtml = html;
      bar2.innerHTML = html;
    }
    return bar2;
  }
  function removeBar() {
    const bar2 = document.getElementById(BAR_ID);
    if (bar2) bar2.remove();
  }
  function clearAll(root3) {
    removeBar();
    renderSuggestions(root3, []);
    for (const ours of root3.querySelectorAll(`.${CHIP_CLASS}, .${FLAGS_CLASS}`)) ours.remove();
  }
  function isOwnElement(node) {
    return node.nodeType === Node.ELEMENT_NODE && (node.classList.contains(CHIP_CLASS) || node.classList.contains(TAG_CLASS) || node.classList.contains(FLAGS_CLASS) || node.id === BAR_ID);
  }

  // src/features/organized-crimes/index.js
  var RENDER_DEBOUNCE_MS = 150;
  var MOVE_WORTHWHILE_HOURS = 24;
  var settingsOpen = false;
  var spawnState = { busy: false, message: null, error: false };
  function findOwnSlot(pageCrimes, board) {
    const me = String(getUserscriptUsersPlayerId() || "");
    if (!me) return null;
    const onPage = new Set(pageCrimes.map((crime) => String(crime.id)));
    const boardCrimes = (board && board.crimes || []).filter((crime) => !onPage.has(String(crime.id))).filter((crime) => !probablyRun(crime.ready_at)).map((crime) => ({
      id: String(crime.id),
      name: crime.name,
      level: crime.level,
      slots: crime.slots.map((slot) => ({
        name: slot.role,
        occupied: slot.player_id !== null,
        playerId: slot.player_id === null ? null : String(slot.player_id),
        progress: slot.progress || 0,
        cpr: slot.cpr
      }))
    }));
    for (const crime of [...pageCrimes, ...boardCrimes]) {
      const index = crime.slots.findIndex((slot) => slot.occupied && slot.playerId === me);
      if (index !== -1) return { crime, index };
    }
    return null;
  }
  function ownSlotWarning(own, board, config, rate) {
    if (!own) return null;
    const { crime, index } = own;
    if (crimeHoursLeft(crime) <= MOVE_WORTHWHILE_HOURS) return null;
    const rated = rate([crime], config).crimes[0].slots[index];
    const level = board && board.me ? board.me.level : null;
    const flags = slotFlags(crime, index, rated, level, limitsFor(config));
    if (flags.length === 0) return null;
    return `You are in ${crime.name} as ${crime.slots[index].name}, but: ${flags.map((flag) => flag.title).join(" ")}`;
  }
  function boardIsBehind(cached) {
    const me = String(getUserscriptUsersPlayerId() || "");
    if (!cached || !me) return false;
    return (cached.board.crimes || []).some(
      (crime) => typeof crime.ready_at === "number" && crime.ready_at * 1e3 <= Date.now() && cached.fetchedAt <= crime.ready_at * 1e3 && crime.slots.some((slot) => String(slot.player_id) === me)
    );
  }
  var readyTimer = null;
  function watchReadyTime(board) {
    if (readyTimer) clearTimeout(readyTimer);
    readyTimer = null;
    const me = String(getUserscriptUsersPlayerId() || "");
    if (!board || !me) return;
    const upcoming = (board.crimes || []).filter((crime) => typeof crime.ready_at === "number" && crime.slots.some((slot) => String(slot.player_id) === me)).map((crime) => crime.ready_at * 1e3 - Date.now()).filter((wait2) => wait2 > 0 && wait2 < 24 * 3600 * 1e3);
    if (upcoming.length === 0) return;
    readyTimer = setTimeout(scheduleRender, Math.min(...upcoming) + 2e3);
  }
  var observer2 = null;
  var observedRoot = null;
  var renderTimer = null;
  var subscribed = false;
  function isOwnFactionCrimesTab() {
    return window.location.search.includes("step=your") && IsPage(PageType.FactionCrimes);
  }
  var permissionsAsked = false;
  function render4() {
    const root3 = document.querySelector(CRIMES_ROOT_SELECTOR);
    if (!root3 || !isOwnFactionCrimesTab()) return;
    const config = ocConfigStore.data;
    if (!config) {
      clearAll(root3);
      return;
    }
    const crimes = readCrimes(root3);
    const tab = activeSubTab(root3);
    const recruiting = tab === SubTab.Recruiting;
    const active = (recruiting || tab === SubTab.Planning) && crimes.length > 0;
    const joining = joinState(crimes);
    if (recruiting) learnCprs(crimes);
    const cachedNow = active ? cachedBoard2() : null;
    if (active) {
      refreshBoard2(boardIsBehind(cachedNow)).then((fresh2) => {
        if (fresh2) scheduleRender();
      });
    }
    const cached = active ? cachedBoard2() : null;
    const board = cached ? cached.board : null;
    watchReadyTime(board);
    const features2 = memberFeatures(config);
    const weights = weightsChoice(config, getWeightsPref());
    if (!weights.own && getWeightsPref() !== null && config.faction_id) {
      setWeightsPref(null);
    }
    const own = recruiting ? findOwnSlot(crimes, board) : null;
    const inCrime = own !== null || joining === JoinState.Blocked;
    const warning = features2.warn && recruiting ? ownSlotWarning(own, board, config, rateCrimes) : null;
    const ranking = features2.enabled && recruiting && crimes.length > 0 && (warning !== null || !inCrime && (joining === JoinState.Open || joining === JoinState.Full));
    const suggesting = ranking && features2.suggest;
    const elsewhere = ranking && board ? offPageCrimes(board, crimes) : [];
    const myLevel = board && board.me ? board.me.level : null;
    const result = rateCrimes([...crimes, ...elsewhere], config, {
      level: myLevel,
      canAsk: canAskForCrime(myLevel, config)
    });
    const members = board && board.members ? board.members : null;
    const prefs4 = members ? getStaffPrefs() : null;
    const limits = limitsFor(config, prefs4);
    const counts = {};
    const permissions = cachedPermissions();
    if (members && permissions === null && !permissionsAsked) {
      permissionsAsked = true;
      getOwnPermissions().then(() => scheduleRender());
    }
    const canFine = Boolean(members) && (permissions || []).includes(FINE_PERMISSION);
    for (const crime of result.crimes) {
      if (crime.crime.offPage) continue;
      crime.slots.forEach((rated, index) => {
        renderMinimum(rated, features2.minimums, weights.show);
        let flags = [];
        if (members && active && rated.slot.occupied) {
          const member = members[rated.slot.playerId];
          flags = slotFlags(crime.crime, index, rated, member ? member.level : null, limits).filter(
            (flag) => prefs4.show[flag.flag]
          );
          for (const flag of flags) counts[flag.flag] = (counts[flag.flag] || 0) + 1;
        }
        renderFlags(rated.slot, flags, canFine && flags.length ? fineOffer(crime.crime, index, rated, flags) : null);
      });
    }
    const suggestions = suggesting ? result.suggestions : [];
    renderSuggestions(root3, suggestions);
    const staff = members && active ? { counts, prefs: prefs4, factionLimits: limitsFor(config) } : null;
    const settings = settingsHtml({ open: settingsOpen, weights, staff, items: itemSettings() });
    const staffPart = staff ? staffHtml(staff, settings.button) : "";
    const label = '<span class="nfh-oc-bar-label">OC Assistant</span>';
    let memberPart = "";
    if (features2.enabled && recruiting && crimes.length > 0) {
      if (features2.suggest) {
        let state8;
        const hiddenStalled = result.hiddenStalled;
        if (suggestions.length > 0) state8 = { kind: "best", suggestions, warning, hiddenStalled };
        else if (warning) state8 = { kind: "warning", warning };
        else if (own) state8 = { kind: "joined", crime: own.crime.name, level: own.crime.level, role: own.crime.slots[own.index].name };
        else if (joining === JoinState.Blocked) state8 = { kind: "blocked" };
        else if (joining === JoinState.Open && result.withheld > 0) state8 = { kind: "low", hiddenStalled };
        else if (joining === JoinState.Full) state8 = { kind: "full", hiddenStalled };
        else state8 = { kind: "none", hiddenStalled };
        memberPart = barHtml(state8);
      } else if (warning) {
        memberPart = barHtml({ kind: "warning", warning });
      }
      const tier = !inCrime && joining === JoinState.Open && board && board.me ? spawnTierToRequest(result.suggestions, board.me.level, config) : null;
      if (tier || spawnState.message) {
        const quiet = features2.suggest && suggestions.length === 0 && result.withheld > 0;
        memberPart = (memberPart || label) + spawnHtml({ tier, asked: spawnAskedUntil() > 0, quiet, ...spawnState });
      }
    }
    if (!memberPart && (staffPart || crimes.length > 0)) memberPart = label;
    if (!memberPart) {
      removeBar();
      return;
    }
    const bar2 = renderBar2(root3, memberPart + (staffPart || settings.button) + settings.panel);
    if (!bar2.dataset.nfhBound) {
      bar2.dataset.nfhBound = "1";
      bar2.addEventListener("change", (event) => {
        const flag = event.target.getAttribute("data-nfh-oc-flag");
        const limit = event.target.getAttribute("data-nfh-oc-limit");
        const item = event.target.getAttribute("data-nfh-oc-item");
        if (item) {
          const items = itemSettings();
          if (!items) return;
          setItemChoice(items.factionId, item, event.target.checked);
          itemSettingsChanged();
        } else if (event.target.hasAttribute("data-nfh-oc-weights")) {
          const current = ocConfigStore.data;
          if (!current || !current.faction_id) return;
          setWeightsPref({ show: event.target.checked, factionId: current.faction_id });
        } else if (flag) {
          setStaffPrefs({ show: { ...getStaffPrefs().show, [flag]: event.target.checked } });
        } else if (limit) {
          setStaffPrefs({ [limit]: parseOverride(event.target.value, 1, limit === "levelGap" ? 9 : 168) });
        } else {
          return;
        }
        scheduleRender();
      });
      bar2.addEventListener("click", (event) => {
        if (event.target.closest("[data-nfh-oc-settings-toggle]")) {
          settingsOpen = !settingsOpen;
          scheduleRender();
          return;
        }
        if (event.target.closest("[data-nfh-oc-items-reset]")) {
          resetItemChoices();
          itemSettingsChanged();
          scheduleRender();
          return;
        }
        if (event.target.closest("[data-nfh-oc-weights-reset]")) {
          setWeightsPref(null);
          scheduleRender();
          return;
        }
        if (event.target.closest("[data-nfh-oc-spawn]")) {
          if (spawnState.busy) return;
          spawnState.busy = true;
          scheduleRender();
          requestSpawn().then((outcome) => {
            spawnState.busy = false;
            spawnState.message = outcome.message;
            spawnState.error = !outcome.ok;
            scheduleRender();
          });
          return;
        }
        if (!event.target.closest("[data-nfh-oc-show]")) return;
        const best = document.querySelector(`${CRIMES_ROOT_SELECTOR} .nfh-oc-pick--best`);
        if (best) {
          best.scrollIntoView({ behavior: "smooth", block: "center" });
          return;
        }
        const list = document.querySelector(CRIMES_ROOT_SELECTOR);
        if (list) list.scrollIntoView({ behavior: "smooth", block: "end" });
      });
    }
  }
  function fineOffer(crime, index, rated, flags) {
    const slot = rated.slot;
    const details = { role: slot.name };
    if (slot.cpr !== null && slot.cpr !== void 0) details.cpr = Math.round(slot.cpr);
    if (rated.minCpr !== null && rated.minCpr !== void 0) details.required_cpr = Math.round(rated.minCpr);
    details.hours_until_role = Math.round(hoursUntilTurn(crime, index) * 10) / 10;
    return {
      playerId: slot.playerId,
      reason: REASON_FOR_FLAG[flags[0].flag] || "",
      crime: { id: crime.id, label: `${crime.name} L${crime.level || "?"} \xB7 ${slot.name}` },
      details
    };
  }
  function scheduleRender() {
    if (renderTimer) clearTimeout(renderTimer);
    renderTimer = setTimeout(() => {
      renderTimer = null;
      try {
        render4();
      } catch (error) {
        console.error("[NFH] OC Assistant failed to render:", error);
      }
    }, RENDER_DEBOUNCE_MS);
  }
  function isOwnMutation(mutation) {
    const nodes = [...mutation.addedNodes, ...mutation.removedNodes];
    return nodes.length > 0 && nodes.every(isOwnElement);
  }
  function watch2(root3) {
    if (observedRoot === root3 && root3.isConnected) return;
    if (observer2) observer2.disconnect();
    observedRoot = root3;
    if (!root3.dataset.nfhOcfBound) {
      root3.dataset.nfhOcfBound = "1";
      root3.addEventListener("click", (event) => {
        const button3 = event.target.closest("[data-nfh-ocf]");
        if (!button3) return;
        event.preventDefault();
        event.stopPropagation();
        try {
          openFineModal(JSON.parse(button3.getAttribute("data-nfh-ocf")));
        } catch (error) {
          console.error("[NFH] Could not open the OC fine form:", error);
        }
      });
    }
    observer2 = new MutationObserver((mutations) => {
      if (!isOwnFactionCrimesTab()) return;
      if (mutations.every(isOwnMutation)) return;
      scheduleRender();
    });
    observer2.observe(root3, { childList: true, subtree: true });
    LogInfo("OC Assistant watching the crimes list");
  }
  function init5() {
    if (!isOwnFactionCrimesTab()) return;
    if (!subscribed) {
      subscribed = true;
      ocConfigStore.subscribe(() => scheduleRender());
      onItemSettingsChange(() => scheduleRender());
    }
    waitForElm(CRIMES_ROOT_SELECTOR).then((root3) => {
      watch2(root3);
      scheduleRender();
    });
  }
  var organized_crimes_default = {
    name: "organized-crimes",
    pages: [PageType.FactionCrimes],
    init: init5
  };

  // src/features/mail-templates/data.js
  var TTL_MS = 5 * 60 * 1e3;
  var LIST_KEY2 = "nfhMailTemplateList";
  var BODY_KEY = "nfhMailTemplateBodies";
  var memory = { list: {}, bodies: {} };
  function readStore(key) {
    try {
      return JSON.parse(localStorage.getItem(key) || "{}") || {};
    } catch (error) {
      return {};
    }
  }
  function writeStore(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
    }
  }
  var fresh = (entry) => entry && Date.now() - entry.at < TTL_MS;
  function forgetCaches() {
    memory.list = {};
    memory.bodies = {};
    try {
      localStorage.removeItem(LIST_KEY2);
      localStorage.removeItem(BODY_KEY);
    } catch (error) {
    }
  }
  async function listTemplates(page, { force = false } = {}) {
    if (!force) {
      const cached = memory.list[page] || readStore(LIST_KEY2)[page];
      if (fresh(cached)) {
        memory.list[page] = cached;
        return cached.data;
      }
    }
    const data = await api(`/mail-templates?page=${encodeURIComponent(page)}`);
    const entry = { at: Date.now(), data };
    memory.list[page] = entry;
    const stored = readStore(LIST_KEY2);
    stored[page] = entry;
    writeStore(LIST_KEY2, stored);
    return data;
  }
  async function personalBody(id) {
    const cached = memory.bodies[id] || readStore(BODY_KEY)[id];
    if (fresh(cached)) return cached.data;
    const data = await api(`/mail-templates/personal/${id}`);
    const entry = { at: Date.now(), data };
    memory.bodies[id] = entry;
    const stored = Object.fromEntries(Object.entries(readStore(BODY_KEY)).filter(([, value]) => fresh(value)));
    stored[id] = entry;
    writeStore(BODY_KEY, stored);
    return data;
  }
  async function savePersonal(fields) {
    const result = await api("/mail-templates/personal", { method: "POST", data: fields });
    forgetCaches();
    return result;
  }
  async function updatePersonal(id, fields) {
    const result = await api(`/mail-templates/personal/${id}`, { method: "POST", data: fields });
    forgetCaches();
    return result;
  }
  async function deletePersonal(id) {
    const result = await api(`/mail-templates/personal/${id}/delete`, { method: "POST" });
    forgetCaches();
    return result;
  }
  var renderFaction = (id) => api(`/mail-templates/faction/${id}`);
  var factionMessage = (uuid) => api(`/mail-templates/messages/${encodeURIComponent(uuid)}`);
  async function pinFaction(id, pinned) {
    const result = await api(`/mail-templates/faction/${id}/pin`, { method: "POST", data: { pinned } });
    forgetCaches();
    return result;
  }
  var fineMail = (id) => api(`/oc-fines/${id}/mail`);
  async function markFineMailed(id) {
    const result = await api(`/oc-fines/${id}/mailed`, { method: "POST", data: { mailed: true, via: "script" } });
    forgetCaches();
    return result;
  }

  // src/features/mail-templates/placeholders.js
  var PLACEHOLDERS = [
    { key: "name", label: "the recipient's name", where: "messages" },
    { key: "id", label: "the recipient's player ID", where: "messages" },
    { key: "me", label: "your name" },
    { key: "myid", label: "your player ID" },
    { key: "date", label: "today's date in Torn time, e.g. 13/11/26" },
    { key: "time", label: "the Torn time now, e.g. 18:05" }
  ];
  var KNOWN = new Set(PLACEHOLDERS.map((placeholder) => placeholder.key));
  var PATTERN = /\{(\w+)\}/g;
  var escapeHtml2 = (value) => String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  function tornDate(now = /* @__PURE__ */ new Date()) {
    const two = (n) => String(n).padStart(2, "0");
    return {
      date: `${two(now.getUTCDate())}/${two(now.getUTCMonth() + 1)}/${two(now.getUTCFullYear() % 100)}`,
      time: `${two(now.getUTCHours())}:${two(now.getUTCMinutes())}`
    };
  }
  function parseRecipient(value) {
    const text = String(value || "").trim();
    const match = text.match(/^(.*?)\s*\[(\d+)\]\s*$/);
    if (match) return { name: match[1].trim() || null, id: match[2] };
    if (/^\d+$/.test(text)) return { name: null, id: text };
    return { name: text || null, id: null };
  }
  function fill(text, values, { html = false } = {}) {
    const missing = /* @__PURE__ */ new Set();
    const out = String(text ?? "").replace(PATTERN, (whole, key) => {
      const lower = key.toLowerCase();
      if (!KNOWN.has(lower)) return whole;
      const value = values[lower];
      if (value === null || value === void 0 || value === "") {
        missing.add(lower);
        return whole;
      }
      return html ? escapeHtml2(value) : String(value);
    });
    return { text: out, missing: [...missing] };
  }

  // src/features/mail-templates/view.js
  var SCOPE_LABELS = { messages: "Messages", newsletter: "Newsletter", both: "Both" };
  var button2 = (act2, label, { primary = false, id = "", kind = "", title = "", disabled = false, extra = "" } = {}) => `<button type="button" class="nfh-cw-btn${primary ? " nfh-cw-btn--primary" : ""}" data-act="${act2}"${id !== "" ? ` data-id="${escapeHtml(id)}"` : ""}${kind ? ` data-kind="${kind}"` : ""}${title ? ` title="${escapeHtml(title)}"` : ""}${disabled ? " disabled" : ""}${extra}>${label}</button>`;
  var star = (pinned) => pinned ? "\u2605" : "\u2606";
  function pinnedChips(list) {
    const chips = [];
    for (const template of list.personal || []) {
      if (template.pinned) chips.push(chipFor2("personal", template.id, template.name, "Your template"));
    }
    for (const template of list.faction || []) {
      if (template.pinned) chips.push(chipFor2("faction", template.id, template.name, `Faction template \xB7 ${template.audience}`));
    }
    return chips.join("");
  }
  var chipFor2 = (kind, id, name, title) => `<button type="button" class="nfh-cw-chip nfh-mt-chip nfh-mt-chip--${kind}" data-act="use" data-kind="${kind}" data-id="${escapeHtml(id)}" title="${escapeHtml(
    `${title}: put it in the editor`
  )}">${kind === "faction" ? '<span class="nfh-mt-badge" aria-label="Faction">F</span>' : ""}${escapeHtml(name)}</button>`;
  function scopeSelect(field, selected) {
    return `<select class="nfh-cw-input" data-field="${field}" aria-label="Where it shows">${Object.entries(SCOPE_LABELS).map(([value, label]) => `<option value="${value}"${value === selected ? " selected" : ""}>${label}</option>`).join("")}</select>`;
  }
  function formHtml(state8) {
    const form = state8.form;
    if (!form) return "";
    if (form.mode === "save") {
      return `<div class="nfh-mt-form">
      <input type="text" class="nfh-cw-input" data-field="name" maxlength="80" placeholder="Template name" value="${escapeHtml(form.name)}">
      <label class="nfh-cw-muted">Show in ${scopeSelect("scope", form.scope)}</label>
      ${button2("save-confirm", state8.busy ? "Saving\u2026" : "Save template", { primary: true, disabled: state8.busy })}${button2("form-cancel", "Cancel")}
      <div class="nfh-cw-muted nfh-mt-note">Saves the message as it is in the editor${state8.hasSubject ? ", and the subject" : ""}. Only you can see your templates.</div>
    </div>`;
    }
    return `<div class="nfh-mt-form">
    <input type="text" class="nfh-cw-input" data-field="name" maxlength="80" value="${escapeHtml(form.name)}" aria-label="Template name">
    <label class="nfh-cw-muted">Show in ${scopeSelect("scope", form.scope)}</label>
    ${button2("rename-confirm", "Save", { primary: true, id: form.id, disabled: state8.busy })}${button2("form-cancel", "Cancel")}
  </div>`;
  }
  function confirmHtml(state8) {
    const confirm2 = state8.confirm;
    if (!confirm2) return "";
    return `<div class="nfh-mt-confirm"><span>${escapeHtml(confirm2.text)}</span>
    ${button2("confirm-yes", escapeHtml(confirm2.yes), { primary: true, disabled: state8.busy })}${button2("confirm-no", "Cancel")}</div>`;
  }
  function helpHtml(state8) {
    if (!state8.help) return "";
    const rows2 = PLACEHOLDERS.filter((placeholder) => !placeholder.where || placeholder.where === state8.page).map((placeholder) => `<li><code>{${placeholder.key}}</code> ${escapeHtml(placeholder.label)}</li>`).join("");
    const recipient = state8.page === "messages" ? " Pick the recipient before you use a template with <code>{name}</code> or <code>{id}</code>." : "";
    return `<div class="nfh-mt-help">
    <div>Write these in a template (in the message or the subject) and they are filled in when you use it:</div>
    <ul>${rows2}</ul>
    <div class="nfh-cw-muted">Anything that can't be filled in yet is left as it is, and you are told.${recipient}</div>
  </div>`;
  }
  var matches = (query, ...texts) => !query || texts.some((text) => String(text || "").toLowerCase().includes(query));
  function allHtml(state8) {
    if (!state8.open || !state8.list) return "";
    const list = state8.list;
    const query = state8.query.trim().toLowerCase();
    const sections = [];
    const personal = (list.personal || []).filter((template) => matches(query, template.name, template.subject));
    sections.push(`<div class="nfh-mt-section"><div class="nfh-mt-heading">Your templates</div>${personal.length ? personal.map(
      (template) => `<div class="nfh-mt-row">
              <span class="nfh-mt-name" title="${escapeHtml(template.subject || "")}">${escapeHtml(template.name)}</span>
              <span class="nfh-cw-muted nfh-mt-scope">${SCOPE_LABELS[template.scope] || ""}</span>
              <span class="nfh-cw-actions">
                ${button2("use", "Use", { primary: true, id: template.id, kind: "personal" })}
                ${button2("pin", star(template.pinned), { id: template.id, kind: "personal", title: template.pinned ? "Unpin" : "Pin to the bar" })}
                ${button2("rename", "Rename", { id: template.id })}
                ${button2("overwrite", "Update", { id: template.id, title: "Replace it with what is in the editor now" })}
                ${button2("delete", "Delete", { id: template.id })}
              </span></div>`
    ).join("") : `<div class="nfh-cw-muted">${query ? "None match." : "None yet: write a message and press Save."}</div>`}</div>`);
    if (list.faction) {
      const faction = list.faction.filter((template) => matches(query, template.name, template.audience));
      sections.push(`<div class="nfh-mt-section"><div class="nfh-mt-heading">Faction templates</div>${faction.length ? faction.map(
        (template) => `<div class="nfh-mt-row">
                <span class="nfh-mt-name">${escapeHtml(template.name)}</span>
                <span class="nfh-cw-muted nfh-mt-scope">${escapeHtml(template.audience)}</span>
                <span class="nfh-cw-actions">
                  ${button2("use", "Use", { primary: true, id: template.id, kind: "faction", title: "Rendered now by nuke.family, with today's figures" })}
                  ${button2("pin", star(template.pinned), { id: template.id, kind: "faction", title: template.pinned ? "Unpin" : "Pin to the bar" })}
                  ${template.edit_url ? `<a class="nfh-cw-btn" href="${escapeHtml(template.edit_url)}" target="_blank" rel="noopener">Edit \u2197</a>` : ""}
                </span></div>`
      ).join("") : `<div class="nfh-cw-muted">${query ? "None match." : "None."}</div>`}</div>`);
    }
    if (list.messages && list.messages.length) {
      const messages = list.messages.filter((message) => matches(query, message.subject, message.author));
      if (messages.length) {
        sections.push(`<div class="nfh-mt-section"><div class="nfh-mt-heading">Recent faction mail</div>${messages.map(
          (message) => `<div class="nfh-mt-row">
            <span class="nfh-mt-name">${escapeHtml(message.subject || "(no subject)")}</span>
            <span class="nfh-cw-muted nfh-mt-scope">${message.status === "draft" ? "Your draft" : `Sent${message.author ? ` by ${escapeHtml(message.author)}` : ""}`}</span>
            <span class="nfh-cw-actions">
              ${button2("use", "Use", { primary: true, id: message.id, kind: "message" })}
              <a class="nfh-cw-btn" href="${escapeHtml(message.url)}" target="_blank" rel="noopener">Open \u2197</a>
            </span></div>`
        ).join("")}</div>`);
      }
    }
    const siteLink = list.links && list.links.faction_mail ? `<a href="${escapeHtml(list.links.faction_mail)}" target="_blank" rel="noopener">Faction mail on nuke.family \u2197</a>` : "";
    return `<div class="nfh-mt-all">
    <input type="search" class="nfh-cw-input nfh-mt-search" data-field="query" placeholder="Search templates" value="${escapeHtml(state8.query)}">
    ${sections.join("")}
    ${siteLink ? `<div class="nfh-mt-foot">${siteLink}</div>` : ""}
  </div>`;
  }
  function finesHtml(state8) {
    const fines = state8.list && state8.list.fines || [];
    if (state8.page !== "messages" || fines.length === 0) return "";
    const to = state8.recipientId ? String(state8.recipientId) : null;
    const sorted = [...fines].sort((a, b) => (String(b.player_id) === to) - (String(a.player_id) === to));
    return `<div class="nfh-mt-fines"><span class="nfh-mt-heading">Recent fines</span>${sorted.slice(0, 8).map(
      (fine) => `<button type="button" class="nfh-cw-chip nfh-mt-chip nfh-mt-chip--fine${String(fine.player_id) === to ? " nfh-mt-chip--match" : ""}" data-act="use" data-kind="fine" data-id="${escapeHtml(
        fine.id
      )}" title="Put this fine's mail in the editor, addressed to them">${escapeHtml(fineChipLabel(fine))}</button>`
    ).join("")}</div>`;
  }
  function renderBar3(state8) {
    const list = state8.list;
    const total = list ? (list.personal || []).length + (list.faction || []).length : 0;
    const pins = list ? pinnedChips(list) : "";
    const status = state8.loading ? `<span class="nfh-cw-muted">Loading\u2026</span>` : state8.error && !list ? `<span class="nfh-cw-error">${escapeHtml(state8.error)}</span>` : pins || `<span class="nfh-cw-muted">${total ? "Pin templates (\u2606 in All) to show them here." : "Save a message to use it again later."}</span>`;
    const message = state8.message ? `<div class="nfh-mt-message nfh-mt-message--${state8.message.tone}" role="status">${escapeHtml(state8.message.text)}${state8.sentFine ? ` ${button2("fine-mailed", "I sent it: mark mailed", { primary: true, id: state8.sentFine.id, disabled: state8.busy })}${button2("fine-dismiss", "Not yet")}` : ""}</div>` : "";
    return `<div class="nfh-cw-bar nfh-mt-bar">
      <span class="nfh-mt-title">Templates</span>
      <span class="nfh-mt-pins">${status}</span>
      <span class="nfh-cw-actions nfh-mt-buttons">
        ${button2("toggle-all", `All${total ? ` (${total})` : ""} ${state8.open ? "\u25B4" : "\u25BE"}`, { disabled: !list })}
        ${button2("save", state8.form?.mode === "save" ? "Save template" : "Save", { disabled: state8.busy || !list, primary: state8.form?.mode === "save" })}
        ${button2("help", "?", { title: "Placeholders you can use", extra: ' aria-label="Placeholders"' })}
      </span>
    </div>
    ${finesHtml(state8)}${message}${confirmHtml(state8)}${formHtml(state8)}${helpHtml(state8)}${allHtml(state8)}`;
  }

  // src/features/mail-templates/index.js
  var BAR_ID2 = "nfh-mail-templates";
  var PAGES = {
    messages: {
      container: "#editor-form",
      anchor: (container) => container.closest(".mailbox-container") || container,
      root: () => document.getElementById("editor-form"),
      subject: (root3) => root3 && root3.querySelector('input[name="subject"]'),
      recipient: (root3) => root3 && root3.querySelector('input[name="sendto"]')
    },
    newsletter: {
      container: "#react-root-faction-newsletter",
      anchor: (container) => container,
      root: () => document.getElementById("react-root-faction-newsletter"),
      subject: (root3) => root3 && root3.querySelector('input[class*="titleField"]'),
      recipient: () => null
    }
  };
  var state3 = freshState(null);
  function freshState(page) {
    return { page, list: null, loading: false, error: null, open: false, query: "", form: null, confirm: null, help: false, message: null, busy: false, hasSubject: false, sentFine: null };
  }
  function currentPage() {
    const { pathname, hash } = window.location;
    if (pathname === "/messages.php" && /p=compose/.test(hash)) return "messages";
    if (pathname === "/factions.php" && /option=newsletter/.test(hash)) return "newsletter";
    return null;
  }
  function bar() {
    return document.getElementById(BAR_ID2);
  }
  function render5() {
    const element = bar();
    if (!element) return;
    const focused = document.activeElement && element.contains(document.activeElement) ? document.activeElement.dataset.field : null;
    const caret = focused && document.activeElement.selectionStart;
    const page = PAGES[state3.page];
    const subject = page && page.subject(page.root());
    state3.hasSubject = !!(subject && subject.value.trim());
    const recipient = page && page.recipient(page.root());
    state3.recipientId = parseRecipient(recipient?.value).id || (/[?&]XID=(\d+)/.exec(window.location.hash) || [])[1] || null;
    element.innerHTML = renderBar3(state3);
    if (focused) {
      const input = element.querySelector(`[data-field="${focused}"]`);
      if (input) {
        input.focus();
        if (typeof caret === "number" && input.setSelectionRange) input.setSelectionRange(caret, caret);
      }
    }
  }
  function say(tone, text) {
    state3.message = { tone, text };
    render5();
  }
  function describeError2(error) {
    if (error instanceof ApiError) {
      if (error.status === 401) return "nuke.family did not accept your key. Reconnect the script.";
      if (error.status === 403) return "You don't have access to that template.";
      if (error.status === 404) return "That template is gone. The list has been refreshed.";
      const reason = error.body && (error.body.error || error.body.message);
      if (reason) return reason;
    }
    return "nuke.family could not be reached. Try again in a moment.";
  }
  async function load3(force = false) {
    if (connectionState() === "missing") {
      state3.error = "Connect the script to nuke.family to use templates.";
      render5();
      return;
    }
    state3.loading = !state3.list;
    render5();
    try {
      state3.list = await listTemplates(state3.page, { force });
      state3.error = null;
    } catch (error) {
      state3.error = describeError2(error);
    } finally {
      state3.loading = false;
      render5();
    }
  }
  function placeholderValues() {
    const page = PAGES[state3.page];
    const recipient = parseRecipient(page.recipient(page.root())?.value);
    const { date, time } = tornDate();
    return {
      name: recipient.name,
      id: recipient.id,
      me: getUserscriptUsersPlayerName() || null,
      myid: getUserscriptUsersPlayerId() || null,
      date,
      time
    };
  }
  async function fetchContent(kind, id) {
    if (kind === "personal") {
      const template = await personalBody(id);
      return { name: template.name, subject: template.subject, html: template.body };
    }
    if (kind === "faction") {
      const template = await renderFaction(id);
      return { name: template.name, subject: template.subject, html: template.html };
    }
    if (kind === "fine") {
      const mail = (await fineMail(id)).data;
      return { name: `the mail for fine #${id}`, subject: mail.subject, html: mail.html, fine: mail.fine };
    }
    const message = await factionMessage(id);
    return { name: message.subject || "the mail", subject: message.subject, html: message.html };
  }
  async function insert(content) {
    const page = PAGES[state3.page];
    const root3 = page.root();
    const editor = findEditor(root3);
    if (!editor) throw new Error("Torn's editor was not found on the page.");
    if (content.fine && page.recipient(root3)) {
      setInputValue(page.recipient(root3), recipientFor(content.fine));
    }
    const values = placeholderValues();
    const body = fill(content.html, values, { html: true });
    await setEditorHtml(editor, body.text);
    const missing = new Set(body.missing);
    if (content.subject) {
      const subject = fill(content.subject, values);
      subject.missing.forEach((key) => missing.add(key));
      setInputValue(page.subject(root3), subject.text);
    }
    if (content.fine) {
      state3.sentFine = content.fine;
      say("ok", `Put the mail for fine #${content.fine.id} in the editor, addressed to ${content.fine.player_name || content.fine.player_id}. Send it, then mark it as mailed.`);
      return;
    }
    if (missing.size) {
      const keys = [...missing].map((key) => `{${key}}`).join(", ");
      const recipientNote = missing.has("name") || missing.has("id") ? " Pick the recipient, then use it again." : "";
      say("warn", `Put "${content.name}" in the editor. ${keys} left as is.${recipientNote}`);
    } else {
      say("ok", `Put "${content.name}" in the editor. Check it, then send it yourself.`);
    }
  }
  async function use(kind, id, { replace = false } = {}) {
    const editor = findEditor(PAGES[state3.page].root());
    if (!replace && editorHasContent(editor)) {
      state3.confirm = { action: "use", kind, id, text: "Replace what is in the editor now?", yes: "Replace" };
      render5();
      return;
    }
    await busy(async () => {
      const content = await fetchContent(kind, id);
      await insert(content);
    });
  }
  async function busy(work) {
    if (state3.busy) return;
    state3.busy = true;
    state3.confirm = null;
    render5();
    try {
      await work();
    } catch (error) {
      LogInfo("[mail-templates]", error);
      say("error", error instanceof ApiError || !error?.message ? describeError2(error) : error.message);
      if (error instanceof ApiError && error.status === 404) load3(true);
    } finally {
      state3.busy = false;
      render5();
    }
  }
  async function editorContents() {
    const page = PAGES[state3.page];
    const root3 = page.root();
    const editor = findEditor(root3);
    if (!editorHasContent(editor)) throw new Error("The editor is empty: write the message first.");
    const html = await getEditorHtml(editor);
    const subject = page.subject(root3)?.value.trim() || null;
    return { body: html, subject };
  }
  function findPersonal(id) {
    return (state3.list?.personal || []).find((template) => String(template.id) === String(id));
  }
  async function onClick3(event) {
    const target = event.target.closest("[data-act]");
    if (!target || target.disabled) return;
    const { act: act2, id, kind } = target.dataset;
    switch (act2) {
      case "toggle-all":
        state3.open = !state3.open;
        if (state3.open) load3();
        render5();
        return;
      case "help":
        state3.help = !state3.help;
        render5();
        return;
      case "save":
        if (state3.form?.mode === "save") return bar()?.querySelector('[data-act="save-confirm"]')?.click();
        state3.form = { mode: "save", name: "", scope: state3.page };
        state3.confirm = null;
        render5();
        bar()?.querySelector('[data-field="name"]')?.focus();
        return;
      case "form-cancel":
      case "confirm-no":
        state3.form = null;
        state3.confirm = null;
        render5();
        return;
      case "save-confirm":
        if (!state3.form.name.trim()) return say("error", "Give the template a name.");
        return busy(async () => {
          const contents = await editorContents();
          await savePersonal({ name: state3.form.name.trim(), scope: state3.form.scope, ...contents });
          const name = state3.form.name.trim();
          state3.form = null;
          await load3(true);
          say("ok", `Saved "${name}". Pin it with \u2606 under All to keep it on the bar.`);
        });
      case "rename": {
        const template = findPersonal(id);
        if (!template) return;
        state3.form = { mode: "rename", id, name: template.name, scope: template.scope };
        render5();
        return;
      }
      case "rename-confirm":
        if (!state3.form.name.trim()) return say("error", "Give the template a name.");
        return busy(async () => {
          await updatePersonal(id, { name: state3.form.name.trim(), scope: state3.form.scope });
          state3.form = null;
          await load3(true);
          say("ok", "Saved.");
        });
      case "overwrite": {
        const template = findPersonal(id);
        if (!template) return;
        state3.confirm = { action: "overwrite", id, text: `Replace "${template.name}" with what is in the editor now?`, yes: "Update" };
        render5();
        return;
      }
      case "delete": {
        const template = findPersonal(id);
        if (!template) return;
        state3.confirm = { action: "delete", id, text: `Delete "${template.name}"? This can't be undone.`, yes: "Delete" };
        render5();
        return;
      }
      case "confirm-yes":
        return confirmed();
      case "pin":
        return busy(async () => {
          if (kind === "faction") {
            const template = (state3.list?.faction || []).find((entry) => String(entry.id) === String(id));
            await pinFaction(id, !template?.pinned);
          } else {
            await updatePersonal(id, { pinned: !findPersonal(id)?.pinned });
          }
          await load3(true);
        });
      case "use":
        return use(kind, id);
      case "fine-mailed":
        return busy(async () => {
          await markFineMailed(id);
          state3.sentFine = null;
          await load3(true);
          say("ok", `Fine #${id} marked as mailed.`);
        });
      case "fine-dismiss":
        state3.sentFine = null;
        state3.message = null;
        render5();
        return;
      default:
    }
  }
  async function confirmed() {
    const confirm2 = state3.confirm;
    if (!confirm2) return;
    if (confirm2.action === "use") return use(confirm2.kind, confirm2.id, { replace: true });
    if (confirm2.action === "overwrite") {
      return busy(async () => {
        const contents = await editorContents();
        await updatePersonal(confirm2.id, contents);
        await load3(true);
        say("ok", "Updated with what is in the editor.");
      });
    }
    if (confirm2.action === "delete") {
      return busy(async () => {
        await deletePersonal(confirm2.id);
        await load3(true);
        say("ok", "Deleted.");
      });
    }
  }
  function onInput2(event) {
    const field = event.target.dataset.field;
    if (!field) return;
    if (field === "query") {
      state3.query = event.target.value;
      render5();
    } else if (state3.form && (field === "name" || field === "scope")) {
      state3.form[field] = event.target.value;
    }
  }
  function onKeydown(event) {
    if (event.key !== "Enter" || !state3.form || event.target.dataset.field !== "name") return;
    event.preventDefault();
    bar()?.querySelector(state3.form.mode === "save" ? '[data-act="save-confirm"]' : '[data-act="rename-confirm"]')?.click();
  }
  function mount2(container) {
    const page = PAGES[state3.page];
    const element = document.createElement("div");
    element.id = BAR_ID2;
    element.className = "nfh-cw nfh-mt";
    element.dataset.page = state3.page;
    element.addEventListener("click", onClick3);
    element.addEventListener("input", onInput2);
    element.addEventListener("change", onInput2);
    element.addEventListener("keydown", onKeydown);
    const anchor = page.anchor(container);
    anchor.parentNode.insertBefore(element, anchor);
    render5();
    if (!state3.list) load3();
  }
  var mail_templates_default = {
    name: "Mail templates",
    pages: [PageType.Messages, PageType.FactionNewsletter],
    init() {
      const page = currentPage();
      if (!page) {
        bar()?.remove();
        return;
      }
      if (state3.page !== page) Object.assign(state3, freshState(page));
      ensureInjected({
        containerSelector: PAGES[page].container,
        isPresent: () => bar()?.dataset.page === page,
        inject: (container) => {
          bar()?.remove();
          mount2(container);
        }
      });
    }
  };

  // src/features/kick-risk/logic.js
  function riskTier(kick) {
    if (kick === null || kick === void 0) return null;
    if (kick >= 35) return "high";
    if (kick >= 25) return "moderate";
    if (kick >= 15) return "elevated";
    return "low";
  }
  var REASON_LIMIT = 200;
  var NEW_MEMBER_DAYS = 100;
  var SHORT = {
    avg_daily_energy_spend_7: "avgE7",
    avg_daily_energy_spend_30: "avgE30",
    average_daily_xanax_taken_30_days: "xanDaily"
  };
  function number(value) {
    if (value === null || value === void 0) return null;
    const n = Number(value);
    if (!Number.isFinite(n)) return null;
    return Math.abs(n) >= 10 || Number.isInteger(n) ? String(Math.round(n)) : String(Math.round(n * 10) / 10);
  }
  function part(stat) {
    const label = SHORT[stat.key] || String(stat.label || stat.key).replace(/\s+/g, "");
    const value = number(stat.value) ?? (stat.shown ? String(stat.shown).replace(/\s+/g, " ").trim() : null);
    return value === null ? null : `${label}(${value})`;
  }
  function kickReason(member) {
    const lead = "Failing to meet faction standards - ";
    const always = (member.stats || []).map(part).filter(Boolean);
    const missed = (member.missed || []).map(part).filter(Boolean);
    const days = member.days_in_faction;
    let tail = days !== null && days !== void 0 && days < NEW_MEMBER_DAYS ? [`days(${Math.round(days)})`] : [];
    const text = () => lead + [...always, ...missed, ...tail].join(", ");
    while (missed.length && text().length > REASON_LIMIT) missed.pop();
    if (text().length > REASON_LIMIT) tail = [];
    return text().slice(0, REASON_LIMIT);
  }
  function changeText(percent) {
    if (percent === null || percent === void 0) return "";
    if (percent === 0) return "\xB1 0%";
    return `${percent < 0 ? "\u2193" : "\u2191"} ${Math.abs(percent)}%`;
  }
  function formatStat(stat) {
    const value = number(stat.value);
    return value === null ? stat.shown || "\u2014" : value;
  }

  // src/features/kick-risk/index.js
  var ROOT = "#option-members-root";
  var CACHE_KEY = "nfhKickRisk";
  var DENIED_KEY = "nfhKickRiskDenied";
  var RETURN_KEY = "nfhKickReturn";
  var CACHE_MS = 10 * 60 * 1e3;
  var DENIED_MS = 12 * 60 * 60 * 1e3;
  var KICK_WAIT_MS = 30 * 1e3;
  var state4 = {
    data: null,
    loading: null,
    open: /* @__PURE__ */ new Set(),
    pendingKick: null,
    offer: null
    // { id, name, reason, welcome, busy, done, error }
  };
  var observer3 = null;
  var observedRoot2 = null;
  var timer = null;
  function readJson3(storage, key) {
    try {
      return JSON.parse(storage.getItem(key) || "null");
    } catch (error) {
      return null;
    }
  }
  function writeJson(storage, key, value) {
    try {
      if (value === null) storage.removeItem(key);
      else storage.setItem(key, JSON.stringify(value));
    } catch (error) {
    }
  }
  async function load4() {
    if (state4.data) return state4.data;
    if (state4.loading) return state4.loading;
    const denied = readJson3(localStorage, DENIED_KEY);
    if (denied && Date.now() - denied < DENIED_MS) return null;
    const cached = readJson3(localStorage, CACHE_KEY);
    if (cached && Date.now() - cached.at < CACHE_MS) {
      state4.data = cached.data;
      return state4.data;
    }
    state4.loading = api("/faction-monitor/members").then((data) => {
      state4.data = data;
      writeJson(localStorage, CACHE_KEY, { at: Date.now(), data });
      return data;
    }).catch((error) => {
      if (error instanceof ApiError && (error.status === 403 || error.status === 404)) writeJson(localStorage, DENIED_KEY, Date.now());
      LogInfo("[kick-risk]", error);
      return null;
    }).finally(() => {
      state4.loading = null;
      schedule();
    });
    return state4.loading;
  }
  var memberById = (id) => (state4.data?.members || []).find((member) => member.player_id === Number(id)) || null;
  function rows(root3) {
    return [...root3.querySelectorAll('[class*="rowWrapper___"]')].map((element) => {
      const link = element.querySelector('[class*="member___"] a[href*="profiles.php?XID="]');
      const id = link ? Number(new URL(link.getAttribute("href"), location.origin).searchParams.get("XID")) : null;
      return { element, id, name: link ? link.textContent.trim() : null };
    });
  }
  function badgeHtml(member) {
    const tier = riskTier(member.kick_risk);
    const percent = Math.round(member.kick_risk);
    const text = tier === "low" ? "" : tier === "elevated" ? `${percent}%` : `Kick ${percent}%`;
    return { tier, text, title: `Kick risk ${percent}% (faction monitor)${member.kick_risk_note ? ` \xB7 ${member.kick_risk_note}` : ""}. Click for details.` };
  }
  function decorateRow(row2) {
    const member = row2.id ? memberById(row2.id) : null;
    const host = row2.element.querySelector('[class*="userInfoBox___"]') || row2.element.querySelector('[class*="member___"]');
    let badge = row2.element.querySelector(".nfh-kr-badge");
    if (!member || member.kick_risk === null || !host) {
      badge?.remove();
    } else {
      const { tier, text, title } = badgeHtml(member);
      if (!badge) {
        badge = document.createElement("button");
        badge.type = "button";
        badge.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          state4.open.has(row2.id) ? state4.open.delete(row2.id) : state4.open.add(row2.id);
          schedule(0);
        });
        host.appendChild(badge);
      }
      badge.dataset.player = row2.id;
      const className = `nfh-kr-badge nfh-kr-badge--${tier}`;
      if (badge.className !== className) badge.className = className;
      if (badge.textContent !== text) badge.textContent = text;
      if (badge.title !== title) badge.title = title;
      badge.setAttribute("aria-label", title);
    }
    let detail = row2.element.querySelector(":scope > .nfh-kr-detail");
    if (member && state4.open.has(row2.id)) {
      const html = detailHtml(member);
      if (!detail) {
        detail = document.createElement("div");
        detail.className = "nfh-cw nfh-kr-detail";
        detail.addEventListener("click", (event) => {
          if (event.target.closest('[data-kr="close"]')) {
            state4.open.delete(row2.id);
            schedule(0);
          }
        });
        row2.element.appendChild(detail);
      }
      if (detail.innerHTML !== html) detail.innerHTML = html;
    } else {
      detail?.remove();
    }
    decorateConfirm(row2, member);
  }
  function statHtml(stat, change) {
    const extra = change !== void 0 && change !== null ? ` <span class="nfh-kr-change nfh-kr-change--${change < 0 ? "down" : "up"}">${escapeHtml(changeText(change))}</span>` : "";
    const target = stat.target !== null && stat.target !== void 0 ? ` <span class="nfh-cw-muted">target ${escapeHtml(formatStat({ value: stat.target }))}</span>` : "";
    return `<span class="nfh-kr-stat${stat.below_target ? " nfh-kr-stat--below" : ""}"><span class="nfh-cw-muted">${escapeHtml(stat.label)}</span> <strong>${escapeHtml(
      formatStat(stat)
    )}</strong>${extra}${stat.below_target ? target : ""}</span>`;
  }
  function detailHtml(member) {
    const stats = member.stats.map((stat) => statHtml(stat, stat.key === "avg_daily_energy_spend_7" ? member.energy_change_pct : void 0)).join("");
    const missed = member.missed.length ? `<div class="nfh-kr-missed"><span class="nfh-cw-muted">Below target:</span> ${member.missed.map((stat) => statHtml(stat)).join("")}</div>` : "";
    const monitor = state4.data?.monitor_url ? `<a href="${escapeHtml(state4.data.monitor_url)}" target="_blank" rel="noopener">Full monitor \u2197</a>` : "";
    return `<div class="nfh-kr-detail-head"><strong>Kick risk ${Math.round(member.kick_risk)}%</strong>
      ${member.kick_risk_note ? `<span class="nfh-cw-muted">${escapeHtml(member.kick_risk_note)}</span>` : ""}
      <span class="nfh-kr-detail-links">${monitor} <button type="button" class="nfh-cw-btn" data-kr="close" aria-label="Close">\u2715</button></span></div>
    <div class="nfh-kr-stats">${stats}</div>${missed}`;
  }
  function decorateConfirm(row2, member) {
    const confirm2 = row2.element.querySelector('[class*="confirm___"]');
    let area = confirm2?.querySelector(".nfh-kr-kick");
    if (!confirm2) return;
    const inOc = !!confirm2.querySelector('[class*="kickError___"]') && /organi[sz]ed crime/i.test(confirm2.textContent);
    const reason = member ? kickReason(member) : null;
    let html;
    if (inOc) {
      html = `<span>In an organized crime: remove them from it, then come back.</span>
      <a class="nfh-cw-btn" href="#/tab=crimes" data-kr="to-crimes">Find their crime \u203A</a>`;
    } else if (reason) {
      html = `<span class="nfh-kr-reason"><span class="nfh-cw-muted">Suggested reason:</span> ${escapeHtml(reason)}</span>
      <button type="button" class="nfh-cw-btn nfh-cw-btn--primary" data-kr="fill">Fill in</button>
      ${state4.data?.monitor_url ? `<a class="nfh-cw-muted" href="${escapeHtml(state4.data.monitor_url)}" target="_blank" rel="noopener" title="Targets are set on the faction monitor">${state4.data.has_targets ? "Targets" : "Set targets"} on the monitor \u2197</a>` : ""}`;
    } else {
      area?.remove();
      return;
    }
    if (!area) {
      area = document.createElement("div");
      area.className = "nfh-cw nfh-kr-kick";
      area.addEventListener("click", (event) => {
        const action = event.target.closest("[data-kr]")?.dataset.kr;
        if (action === "fill") {
          event.preventDefault();
          const input = confirm2.querySelector('input[class*="reasonInput___"]');
          setInputValue(input, area.dataset.reason || "");
          input?.focus();
        } else if (action === "to-crimes") {
          writeJson(sessionStorage, RETURN_KEY, { id: row2.id, name: row2.name });
        }
      });
      confirm2.appendChild(area);
    }
    area.dataset.reason = reason || "";
    if (area.innerHTML !== html) area.innerHTML = html;
  }
  function watchKick(root3) {
    root3.addEventListener(
      "click",
      (event) => {
        const button3 = event.target.closest('[class*="confirm___"] button');
        if (!event.isTrusted || !button3 || button3.disabled || button3.textContent.trim() !== "Yes") return;
        const element = button3.closest('[class*="rowWrapper___"]');
        const row2 = rows(root3).find((candidate) => candidate.element === element);
        if (!row2?.id) return;
        const input = element.querySelector('input[class*="reasonInput___"]');
        const member = memberById(row2.id);
        state4.pendingKick = { id: row2.id, name: row2.name, reason: input?.value.trim() || (member ? kickReason(member) : ""), at: Date.now() };
      },
      true
    );
  }
  function checkKick(root3) {
    const pending4 = state4.pendingKick;
    if (!pending4) return;
    if (Date.now() - pending4.at > KICK_WAIT_MS) {
      state4.pendingKick = null;
      return;
    }
    if (rows(root3).some((row2) => row2.id === pending4.id)) return;
    state4.pendingKick = null;
    state4.offer = { id: pending4.id, name: pending4.name, reason: pending4.reason, welcome: false, busy: false, done: false, error: null };
  }
  function renderOffer(root3) {
    let panel = document.getElementById("nfh-kr-blacklist");
    const offer = state4.offer;
    if (!offer) {
      panel?.remove();
      return;
    }
    if (!panel) {
      panel = document.createElement("div");
      panel.id = "nfh-kr-blacklist";
      panel.className = "nfh-cw nfh-cw--attn nfh-kr-offer";
      panel.addEventListener("click", onOfferClick);
      panel.addEventListener("input", (event) => {
        if (event.target.dataset.kr === "reason") offer.reason = event.target.value;
        if (event.target.dataset.kr === "welcome") offer.welcome = event.target.checked;
      });
      root3.parentElement.insertBefore(panel, root3);
    }
    const name = escapeHtml(offer.name || `#${offer.id}`);
    if (offer.done) {
      panel.innerHTML = `<div class="nfh-cw-bar"><span class="nfh-cw-ok">Added ${name} to the faction blacklist.</span>
      <button type="button" class="nfh-cw-btn" data-kr="dismiss">OK</button></div>`;
      return;
    }
    if (panel.querySelector('[data-kr="reason"]') && !offer.error && !offer.refresh) return;
    offer.refresh = false;
    panel.innerHTML = `<div class="nfh-kr-offer-body">
      <div><strong>${name} was kicked.</strong> Add them to the faction blacklist?</div>
      <textarea class="nfh-cw-input" data-kr="reason" rows="2" maxlength="1000" aria-label="Blacklist reason">${escapeHtml(offer.reason)}</textarea>
      <label><input type="checkbox" data-kr="welcome"${offer.welcome ? " checked" : ""}> Welcome back in Nuke later</label>
      ${offer.error ? `<div class="nfh-cw-error">${escapeHtml(offer.error)}</div>` : ""}
      <div class="nfh-cw-actions"><button type="button" class="nfh-cw-btn nfh-cw-btn--primary" data-kr="blacklist"${offer.busy ? " disabled" : ""}>Add to blacklist</button>
      <button type="button" class="nfh-cw-btn" data-kr="dismiss">No thanks</button></div>
    </div>`;
  }
  async function onOfferClick(event) {
    const action = event.target.closest("[data-kr]")?.dataset.kr;
    const offer = state4.offer;
    if (!offer) return;
    if (action === "dismiss") {
      state4.offer = null;
      schedule(0);
    } else if (action === "blacklist" && !offer.busy) {
      if (!offer.reason.trim()) {
        offer.error = "Give a reason.";
        schedule(0);
        return;
      }
      offer.busy = true;
      offer.error = null;
      offer.refresh = true;
      schedule(0);
      try {
        const data = { player_id: offer.id, reason: offer.reason.trim() };
        if (offer.welcome) data.is_welcome_to_rejoin = true;
        await api("/script/faction-blacklist", { method: "POST", data });
        offer.done = true;
      } catch (error) {
        offer.error = error instanceof ApiError && error.status === 403 ? "You can't add to the blacklist." : "nuke.family could not be reached. Try again, or add it on the site.";
      } finally {
        offer.busy = false;
        offer.refresh = true;
        schedule(0);
      }
    }
  }
  function redrawMembers() {
    const root3 = document.querySelector(ROOT);
    if (!root3) return;
    checkKick(root3);
    if (state4.data) for (const row2 of rows(root3)) decorateRow(row2);
    renderOffer(root3);
  }
  function crimeOf(playerId) {
    const board = cachedBoard2()?.board;
    for (const crime of board?.crimes || []) {
      const slot = (crime.slots || []).find((candidate) => Number(candidate.player_id) === Number(playerId));
      if (slot) return { name: crime.name, status: crime.status, role: slot.role };
    }
    return null;
  }
  var findMessage = "";
  function renderReturn() {
    const target = readJson3(sessionStorage, RETURN_KEY);
    let chip = document.getElementById("nfh-kr-return");
    if (!target) {
      chip?.remove();
      return;
    }
    if (!chip) {
      chip = document.createElement("div");
      chip.id = "nfh-kr-return";
      chip.className = "nfh-cw nfh-kr-return";
      chip.addEventListener("click", (event) => {
        const action = event.target.closest("[data-kr]")?.dataset.kr;
        if (action === "find") {
          const slot2 = findSlot(target.id);
          if (slot2) {
            findMessage = "";
            slot2.scrollIntoView({ block: "center", behavior: "smooth" });
            slot2.classList.add("nfh-kr-slot");
          } else {
            const crime2 = crimeOf(target.id);
            findMessage = crime2 && crime2.status && activeSubTab(document.querySelector(CRIMES_ROOT_SELECTOR) || document) !== crime2.status.toLowerCase() ? `Open the ${crime2.status} tab: their crime is there.` : "Not on the page yet: scroll down so Torn loads more crimes, then press Find again.";
          }
          renderReturn();
        } else if (action === "back" || action === "dismiss") {
          writeJson(sessionStorage, RETURN_KEY, null);
          findMessage = "";
          chip.remove();
        }
      });
      document.body.appendChild(chip);
      refreshBoard2().then(() => renderReturn());
    }
    const crime = crimeOf(target.id);
    const where = crime ? ` They're in <strong>${escapeHtml(crime.name)}</strong> (${escapeHtml(crime.status)}) as ${escapeHtml(crime.role)}.` : "";
    const html = `<span>Kicking <strong>${escapeHtml(target.name || `#${target.id}`)}</strong>: remove them from their crime first.${where}</span>
    <button type="button" class="nfh-cw-btn" data-kr="find">Find them</button>
    <a class="nfh-cw-btn nfh-cw-btn--primary" href="#/tab=controls&option=members" data-kr="back">Back to Members</a>
    <button type="button" class="nfh-cw-btn" data-kr="dismiss" aria-label="Dismiss">\u2715</button>
    ${findMessage ? `<span class="nfh-kr-find-note">${escapeHtml(findMessage)}</span>` : ""}`;
    if (chip.innerHTML !== html) chip.innerHTML = html;
    const slot = findSlot(target.id);
    document.querySelectorAll(".nfh-kr-slot").forEach((element) => element !== slot && element.classList.remove("nfh-kr-slot"));
    slot?.classList.add("nfh-kr-slot");
  }
  function findSlot(id) {
    const link = document.querySelector(`${CRIMES_ROOT_SELECTOR} a[href*="profiles.php?XID=${id}"]`);
    if (!link) return null;
    let element = link.parentElement;
    while (element && element.id !== "faction-crimes-root") {
      if (/(^|\s)wrapper___/.test(element.className) && element.querySelector('[class^="slotHeader___"]')) return element;
      element = element.parentElement;
    }
    return link;
  }
  function schedule(delay = 200) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (/option=members/.test(location.hash)) redrawMembers();
      if (/tab=crimes/.test(location.hash)) renderReturn();
    }, delay);
  }
  function observe(element) {
    if (observedRoot2 === element) return;
    observer3?.disconnect();
    observedRoot2 = element;
    observer3 = new MutationObserver((records) => {
      const ours = records.every(
        (record) => [...record.addedNodes, ...record.removedNodes].every((node) => node.nodeType !== 1 || /(^|\s)nfh-/.test(node.className || "") || node.closest?.('[class*="nfh-kr"]'))
      );
      if (!ours) schedule();
    });
    observer3.observe(element, { childList: true, subtree: true });
  }
  var kick_risk_default = {
    name: "Kick risk",
    pages: [PageType.FactionControlMembers, PageType.FactionCrimes, PageType.Faction],
    init() {
      if (!location.search.includes("step=your")) return;
      const onMembers = /tab=controls/.test(location.hash) && /option=members/.test(location.hash);
      const onCrimes = /tab=crimes/.test(location.hash);
      if (!onCrimes) {
        document.getElementById("nfh-kr-return")?.remove();
        document.querySelectorAll(".nfh-kr-slot").forEach((element) => element.classList.remove("nfh-kr-slot"));
        if (!onMembers) writeJson(sessionStorage, RETURN_KEY, null);
      }
      if (onMembers) writeJson(sessionStorage, RETURN_KEY, null);
      if (onCrimes) {
        if (!readJson3(sessionStorage, RETURN_KEY)) return;
        renderReturn();
        const root3 = document.querySelector("#faction-crimes-root");
        if (root3) observe(root3);
        return;
      }
      if (!onMembers) {
        observer3?.disconnect();
        observedRoot2 = null;
        return;
      }
      let tries = 15;
      const attach = () => {
        const root3 = document.querySelector(ROOT);
        if (root3) {
          if (!root3.dataset.nfhKr) {
            root3.dataset.nfhKr = "1";
            watchKick(root3);
          }
          observe(root3.parentElement || root3);
          load4().then(() => schedule(0));
          schedule(0);
          return;
        }
        if (--tries > 0) setTimeout(attach, 400);
      };
      attach();
    }
  };

  // src/features/stocks/logic.js
  var BUCKET_LABELS = { personal: "Personal", faction: "Faction" };
  var money = (value) => {
    const n = Number(value);
    if (!Number.isFinite(n)) return "";
    if (n >= 1e9) return `$${(n / 1e9).toFixed(n >= 1e10 ? 0 : 1)}b`;
    if (n >= 1e6) return `$${(n / 1e6).toFixed(n >= 1e7 ? 0 : 1)}m`;
    if (n >= 1e3) return `$${Math.round(n / 1e3)}k`;
    return `$${Math.round(n)}`;
  };
  var shares = (n) => Number(n || 0).toLocaleString("en-US");
  function parseNumber(text) {
    const n = Number(String(text || "").replace(/[^0-9.\-]/g, ""));
    return Number.isFinite(n) ? n : null;
  }
  function signalsFor(data, stockId) {
    const out = [];
    for (const portfolio of data?.portfolios || []) {
      const row2 = portfolio.stocks?.[stockId] ?? portfolio.stocks?.[String(stockId)];
      if (row2 && row2.action) out.push({ bucket: portfolio.bucket, ...row2 });
    }
    return out;
  }
  function rowTags(signals) {
    return signals.filter((signal) => ["BUY", "SELL", "HOLD"].includes(signal.action)).map((signal) => ({ bucket: signal.bucket, action: signal.action, loud: signal.action !== "HOLD" }));
  }
  function matchTransactions(rows2, lots) {
    const left = [...lots || []];
    return rows2.map((row2) => {
      const index = left.findIndex((lot) => Number(lot.shares) === row2.shares && Math.abs(Number(lot.price) - row2.price) < 0.015);
      return index === -1 ? null : left.splice(index, 1)[0];
    });
  }
  function lotLabel(lot, multiplePortfolios) {
    if (!lot) return null;
    const owner = multiplePortfolios || lot.bucket === "faction" ? `${BUCKET_LABELS[lot.bucket] || lot.bucket} \xB7 ` : "";
    if (!lot.trading) return { kind: "other", text: `${owner}${lot.category}` };
    if (lot.signal === "SELL") return { kind: "sell", text: `${owner}SELL` };
    if (lot.signal === "HOLD") return { kind: "hold", text: `${owner}Hold \u2192 $${Number(lot.sell_at).toFixed(2)}` };
    return { kind: "other", text: `${owner}${lot.category}` };
  }

  // src/features/stocks/index.js
  var ROOT2 = "#stockmarketroot";
  var BAR_ID3 = "nfh-stock-bar";
  var CACHE_KEY2 = "nfhStockSignals";
  var DENIED_KEY2 = "nfhStockSignalsDenied";
  var CACHE_MS2 = 2 * 60 * 1e3;
  var DENIED_MS2 = 12 * 60 * 60 * 1e3;
  var state5 = { data: null, loading: null };
  var observer4 = null;
  var observedRoot3 = null;
  var timer2 = null;
  function readJson4(key) {
    try {
      return JSON.parse(localStorage.getItem(key) || "null");
    } catch (error) {
      return null;
    }
  }
  function writeJson2(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
    }
  }
  async function load5() {
    if (state5.data) return state5.data;
    if (state5.loading) return state5.loading;
    const denied = readJson4(DENIED_KEY2);
    if (denied && Date.now() - denied < DENIED_MS2) return null;
    const cached = readJson4(CACHE_KEY2);
    if (cached && Date.now() - cached.at < CACHE_MS2) {
      state5.data = cached.data;
      return state5.data;
    }
    state5.loading = api("/stocks/signals").then((data) => {
      state5.data = data;
      writeJson2(CACHE_KEY2, { at: Date.now(), data });
      return data;
    }).catch((error) => {
      if (error instanceof ApiError && error.status === 403) writeJson2(DENIED_KEY2, Date.now());
      LogInfo("[stocks]", error);
      return null;
    }).finally(() => {
      state5.loading = null;
      schedule2(0);
    });
    return state5.loading;
  }
  var both = () => (state5.data?.portfolios || []).length > 1;
  var hasAnything = () => (state5.data?.portfolios || []).length > 0 || (state5.data?.lots || []).length > 0;
  function renderBar4(root3) {
    let bar2 = document.getElementById(BAR_ID3);
    if (!hasAnything()) {
      bar2?.remove();
      return;
    }
    const market = root3.querySelector('[class*="stockMarket___"]');
    if (!market) return;
    if (!bar2) {
      bar2 = document.createElement("div");
      bar2.id = BAR_ID3;
      bar2.className = "nfh-cw nfh-st-bar";
      market.parentElement.insertBefore(bar2, market);
    }
    const lines = (state5.data.portfolios || []).map(
      (portfolio) => `<div><strong>${escapeHtml(BUCKET_LABELS[portfolio.bucket] || portfolio.bucket)}:</strong> ${escapeHtml(portfolio.summary)}</div>`
    );
    if (!lines.length) lines.push(`<div class="nfh-cw-muted">Signals are off: your blocks are labelled, but nothing says buy or sell.</div>`);
    const html = `<div class="nfh-st-lines">${lines.join("")}</div>
    <a class="nfh-cw-btn" href="${escapeHtml(state5.data.tracker_url)}" target="_blank" rel="noopener">Stock tracker \u2197</a>`;
    if (bar2.innerHTML !== html) bar2.innerHTML = html;
  }
  function tagRows(root3) {
    for (const row2 of root3.querySelectorAll('ul[id][class*="stock___"]')) {
      const stockId = Number(row2.id);
      const tags = rowTags(signalsFor(state5.data, stockId));
      const host = row2.querySelector('[class*="nameContainer___"]') || row2.querySelector('[class*="stockName___"]');
      if (!host) continue;
      let element = host.querySelector(".nfh-st-tags");
      if (!tags.length) {
        element?.remove();
        continue;
      }
      const html = tags.map((tag) => `<span class="nfh-st-tag nfh-st-tag--${tag.action.toLowerCase()}">${both() || tag.bucket === "faction" ? `${escapeHtml(BUCKET_LABELS[tag.bucket])} ` : ""}${tag.action === "HOLD" ? "Hold" : tag.action}</span>`).join("");
      if (!element) {
        element = document.createElement("span");
        element.className = "nfh-st-tags";
        host.appendChild(element);
      }
      if (element.innerHTML !== html) element.innerHTML = html;
    }
  }
  function decoratePanel(root3) {
    const panel = root3.querySelector("#panel-ownedTab");
    if (!panel) return;
    const stockRow = panel.previousElementSibling?.matches('ul[id][class*="stock___"]') ? panel.previousElementSibling : panel.closest("[id]")?.previousElementSibling;
    const stockId = Number(stockRow?.id || panel.parentElement?.querySelector('ul[id][class*="stock___"]')?.id);
    if (!stockId) return;
    const signals = signalsFor(state5.data, stockId);
    const lots = (state5.data.lots || []).filter((lot) => lot.stock_id === stockId);
    const lines = [];
    for (const signal of signals) {
      const who = both() || signal.bucket === "faction" ? `${BUCKET_LABELS[signal.bucket]}: ` : "";
      if (signal.action === "BUY") lines.push(`<div class="nfh-st-buy">${escapeHtml(who)}<strong>Buy ~${escapeHtml(shares(signal.buy_shares))} shares</strong> (${escapeHtml(money(signal.buy_amount))}).</div>`);
      else if (signal.action === "SELL") lines.push(`<div class="nfh-st-sell">${escapeHtml(who)}<strong>Sell the blocks marked SELL</strong>${signal.note ? ` <span class="nfh-cw-muted">${escapeHtml(signal.note)}</span>` : ""}</div>`);
      else if (signal.action === "HOLD") lines.push(`<div>${escapeHtml(who)}Hold${signal.note ? ` <span class="nfh-cw-muted">${escapeHtml(signal.note)}</span>` : ""}</div>`);
      else if (signal.note) lines.push(`<div class="nfh-cw-muted">${escapeHtml(who)}${escapeHtml(signal.note)}</div>`);
    }
    const anchor = panel.querySelector('[class*="transactionsContainer___"]') || panel.querySelector('[class*="manageTab___"]');
    let box = panel.querySelector(".nfh-st-advice");
    if (lines.length && anchor) {
      if (!box) {
        box = document.createElement("div");
        box.className = "nfh-cw nfh-st-advice";
        anchor.parentElement.insertBefore(box, anchor);
      }
      const html = lines.join("");
      if (box.innerHTML !== html) box.innerHTML = html;
    } else {
      box?.remove();
    }
    const rows2 = [...panel.querySelectorAll('ul[class*="transaction___"]')];
    const read2 = rows2.map((row2) => ({
      shares: parseNumber(row2.querySelector('[class*="shares___"]')?.textContent),
      price: parseNumber(row2.querySelector('[class*="bought___"]')?.textContent)
    }));
    const matched = matchTransactions(read2, lots);
    rows2.forEach((row2, index) => {
      const label = lotLabel(matched[index], both());
      const next = row2.nextElementSibling;
      let line = next?.classList.contains("nfh-st-lotline") ? next : null;
      row2.classList.toggle("nfh-st-row--sell", label?.kind === "sell");
      if (!label) {
        line?.remove();
        return;
      }
      if (!line) {
        line = document.createElement("div");
        line.className = "nfh-st-lotline";
        line.innerHTML = '<span class="nfh-st-lot"></span>';
        row2.after(line);
      }
      const tag = line.firstElementChild;
      const className = `nfh-st-lot nfh-st-lot--${label.kind}`;
      if (tag.className !== className) tag.className = className;
      if (tag.textContent !== label.text) tag.textContent = label.text;
    });
  }
  function redraw2() {
    const root3 = document.querySelector(ROOT2);
    if (!root3 || !state5.data) return;
    renderBar4(root3);
    tagRows(root3);
    decoratePanel(root3);
  }
  function schedule2(delay = 200) {
    clearTimeout(timer2);
    timer2 = setTimeout(redraw2, delay);
  }
  function watch3(root3) {
    if (observedRoot3 === root3) return;
    observer4?.disconnect();
    observedRoot3 = root3;
    observer4 = new MutationObserver((records) => {
      const ours = records.every(
        (record) => [...record.addedNodes, ...record.removedNodes].every((node) => node.nodeType !== 1 || /(^|\s)nfh-/.test(node.className || "") || node.id === BAR_ID3)
      );
      if (!ours) schedule2();
    });
    observer4.observe(root3, { childList: true, subtree: true });
  }
  var stocks_default = {
    name: "Stock signals",
    pages: [PageType.Stocks],
    init() {
      if (!/[?&]sid=stocks\b/.test(location.search)) return;
      let tries = 20;
      const attach = () => {
        const root3 = document.querySelector(ROOT2);
        if (root3 && root3.querySelector('[class*="stockMarket___"]')) {
          watch3(root3);
          load5().then(() => schedule2(0));
          return;
        }
        if (--tries > 0) setTimeout(attach, 400);
      };
      attach();
    }
  };

  // src/features/ranked-war/logic.js
  var Group = {
    Out: 0,
    // the page says okay while the API still has them in hospital or flying
    Okay: 1,
    Hospital: 2,
    Incoming: 3,
    // flying back to Torn
    Abroad: 4,
    Outgoing: 5,
    Traveling: 6,
    Away: 7
    // federal jail, fallen
  };
  var SortMode = {
    Off: "off",
    Status: "status",
    StatsAsc: "stats-asc",
    StatsDesc: "stats-desc"
  };
  var Then = {
    StatsAsc: "stats-asc",
    StatsDesc: "stats-desc",
    ScoreDesc: "score-desc",
    ScoreAsc: "score-asc",
    Recent: "recent"
    // whoever became okay most recently first
  };
  var SOON_SECONDS = 300;
  var OUT_HIGHLIGHT_MS = 1e4;
  var EXPIRY_TOLERANCE_SECONDS = 2;
  var PLACE_CODES = {
    mexico: "MX",
    "cayman islands": "CI",
    canada: "CA",
    hawaii: "HI",
    "united kingdom": "UK",
    argentina: "AR",
    switzerland: "SW",
    japan: "JP",
    china: "CN",
    uae: "UAE",
    "south africa": "SA",
    torn: "TC"
  };
  function placeCode(place2) {
    const name = String(place2).trim();
    return PLACE_CODES[name.toLowerCase()] || name;
  }
  function parseRoute(description) {
    const text = String(description || "");
    let match = text.match(/^Traveling from (.+) to (.+)$/);
    if (match) return { from: placeCode(match[1]), to: placeCode(match[2]) };
    match = text.match(/^Returning to Torn from (.+)$/);
    if (match) return { from: placeCode(match[1]), to: "TC" };
    match = text.match(/^Traveling to (.+)$/);
    if (match) return { from: "TC", to: placeCode(match[1]) };
    return null;
  }
  function formatCountdown(seconds) {
    const total = Math.max(0, Math.floor(seconds));
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor(total % 3600 / 60);
    const rest = String(total % 60).padStart(2, "0");
    return hours > 0 ? `${hours}:${String(minutes).padStart(2, "0")}:${rest}` : `${minutes}:${rest}`;
  }
  function formatStats(total) {
    const units = [
      [1e12, "t"],
      [1e9, "b"],
      [1e6, "m"],
      [1e3, "k"]
    ];
    for (const [size, suffix] of units) {
      if (total >= size) {
        const value = total / size;
        return `${value >= 100 ? Math.round(value) : Math.round(value * 10) / 10}${suffix}`;
      }
    }
    return String(Math.round(total));
  }
  function parseStatText(text) {
    const match = String(text || "").trim().match(/^([\d.,]+)\s*([kmbtq])?$/i);
    if (!match) return null;
    const scale = { k: 1e3, m: 1e6, b: 1e9, t: 1e12, q: 1e15 }[(match[2] || "").toLowerCase()] || 1;
    const value = Number(match[1].replace(/,/g, "")) * scale;
    return Number.isFinite(value) && value > 0 ? Math.round(value) : null;
  }
  var Source = { Bsp: "bsp", FfScouter: "ffscouter" };
  var SOURCES = [Source.Bsp, Source.FfScouter];
  function pickEstimate(onPage, held, preferred) {
    const order = [preferred, ...SOURCES.filter((source) => source !== preferred)];
    for (const [values, fromPage] of [[onPage, true], [held, false]]) {
      for (const source of order) {
        if (values && values[source] > 0) return { total: values[source], source, fromPage };
      }
    }
    return { total: 0, source: null, fromPage: false };
  }
  function classify(member, pageKind, nowMs, memo = {}) {
    const base = { label: null, until: 0, soon: false, out: false };
    const carried = { outSince: memo.outSince || 0, okaySince: memo.okaySince || 0 };
    const settled = { outSince: 0, okaySince: 0 };
    const okay = (next) => ({
      ...base,
      group: next.outSince ? Group.Out : Group.Okay,
      out: !!next.outSince && nowMs - next.outSince < OUT_HIGHLIGHT_MS,
      memo: next
    });
    if (!member) {
      if (pageKind === "hospital") return { ...base, group: Group.Hospital, memo: settled };
      if (pageKind === "travel") return { ...base, group: Group.Traveling, memo: settled };
      return okay(carried);
    }
    if (member.s === "Hospital" || member.s === "Jail") {
      const remaining = member.u - nowMs / 1e3;
      if (pageKind === "hospital") {
        return {
          ...base,
          group: Group.Hospital,
          label: remaining > 0 ? formatCountdown(remaining) : null,
          until: member.u,
          soon: remaining > 0 && remaining < SOON_SECONDS,
          memo: settled
        };
      }
      if (pageKind === "okay" && remaining > EXPIRY_TOLERANCE_SECONDS) {
        return okay({ outSince: carried.outSince || nowMs, okaySince: carried.okaySince || nowMs });
      }
      return okay({ outSince: 0, okaySince: carried.okaySince || member.u * 1e3 });
    }
    if (member.s === "Traveling" || member.s === "Abroad") {
      if (pageKind === "okay") {
        return okay({ outSince: carried.outSince || nowMs, okaySince: carried.okaySince || nowMs });
      }
      if (pageKind !== "travel") return okay(carried);
      const abroad = String(member.d || "").match(/^In (.+)$/);
      if (abroad) {
        return { ...base, group: Group.Abroad, label: placeCode(abroad[1]), memo: settled };
      }
      const route = parseRoute(member.d);
      if (route && route.to === "TC") {
        return { ...base, group: Group.Incoming, label: `\u25C4 ${route.from}`, memo: settled };
      }
      if (route) {
        return { ...base, group: Group.Outgoing, label: `\u25BA ${route.to}`, memo: settled };
      }
      return { ...base, group: Group.Traveling, memo: settled };
    }
    if (member.s !== "Okay") {
      return { ...base, group: Group.Away, memo: settled };
    }
    if (pageKind === "hospital") return { ...base, group: Group.Hospital, memo: settled };
    if (pageKind === "travel") return { ...base, group: Group.Traveling, memo: settled };
    return okay({ outSince: 0, okaySince: carried.okaySince });
  }
  function compareThen(a, b, then) {
    switch (then) {
      case Then.StatsAsc:
        return (a.stats || Infinity) - (b.stats || Infinity);
      case Then.StatsDesc:
        return (b.stats || 0) - (a.stats || 0);
      case Then.ScoreDesc:
        return (b.score || 0) - (a.score || 0);
      case Then.ScoreAsc:
        return (a.score || 0) - (b.score || 0);
      default:
        return (b.memo.okaySince || 0) - (a.memo.okaySince || 0);
    }
  }
  function compareStatus(a, b, then = Then.ScoreDesc) {
    if (a.group !== b.group) return a.group - b.group;
    let order = 0;
    switch (a.group) {
      case Group.Out:
        order = b.memo.outSince - a.memo.outSince;
        break;
      case Group.Okay:
        break;
      case Group.Hospital:
        order = (a.until || Infinity) - (b.until || Infinity);
        break;
      default:
        order = String(a.label || "").localeCompare(String(b.label || ""));
    }
    return order || compareThen(a, b, then) || 0;
  }
  function comparatorFor(mode, then = Then.ScoreDesc) {
    const byStatus = (a, b) => compareStatus(a, b, then);
    if (mode === SortMode.Status) return byStatus;
    if (mode !== SortMode.StatsAsc && mode !== SortMode.StatsDesc) return null;
    const direction = mode === SortMode.StatsAsc ? 1 : -1;
    return (a, b) => {
      if (a.stats && b.stats) {
        return a.stats === b.stats ? byStatus(a, b) : direction * (a.stats - b.stats);
      }
      if (a.stats || b.stats) return a.stats ? -1 : 1;
      return byStatus(a, b);
    };
  }

  // src/features/ranked-war/prefs.js
  var STORAGE_KEY2 = "nfhRankedWar";
  var DEFAULTS3 = {
    sort: SortMode.Status,
    // How members with the same status are ordered among themselves.
    then: Then.ScoreDesc,
    showStats: true,
    // Whose estimate to use when both BSP's and FF Scouter's are known.
    source: Source.Bsp
  };
  function sanitize2(raw) {
    const source = raw && typeof raw === "object" ? raw : {};
    return {
      sort: Object.values(SortMode).includes(source.sort) ? source.sort : DEFAULTS3.sort,
      then: Object.values(Then).includes(source.then) ? source.then : DEFAULTS3.then,
      showStats: source.showStats !== false,
      source: SOURCES.includes(source.source) ? source.source : DEFAULTS3.source
    };
  }
  var prefs2 = null;
  function getPrefs2() {
    if (prefs2) return prefs2;
    let stored = null;
    try {
      stored = JSON.parse(getItem(STORAGE_KEY2) || "null");
    } catch (e) {
    }
    prefs2 = sanitize2(stored);
    return prefs2;
  }
  function setPrefs2(patch) {
    prefs2 = sanitize2({ ...getPrefs2(), ...patch });
    setItem(STORAGE_KEY2, JSON.stringify(prefs2));
    return prefs2;
  }

  // src/features/ranked-war/index.js
  var BAR_ID4 = "nfh-war-bar";
  var ANCHOR_SELECTOR2 = "#faction_war_list_id";
  var LIST_SELECTOR = "#faction_war_list_id .faction-war ul.members-list";
  var STATUS_ATTR = "data-nfh-war";
  var TONE_ATTR = "data-nfh-war-tone";
  var ROW_ATTR = "data-nfh-war-row";
  var STATS_ATTR = "data-nfh-war-stats";
  var BSP_BOX_SELECTOR = ".iconStats, .iconStatsAttack";
  var FF_BUSY_SELECTOR = "[data-ffscouter-active-filter]";
  var DEFAULT_POLL_MS = 5e3;
  var ERROR_RETRY_MS = 30 * 1e3;
  var STATS_REFRESH_MS = 10 * 60 * 1e3;
  var UPLOAD_DELAY_MS2 = 4e3;
  var UPLOAD_RETRY_MS = 5 * 60 * 1e3;
  var UPLOAD_MAX = 300;
  var STALE_MS = 60 * 1e3;
  var state6 = {
    target: null,
    // whose war is open: "" for your own faction's, else a faction id
    war: void 0,
    // undefined = not asked yet, null = the site knows of no war
    members: {},
    held: { bsp: {}, ffscouter: {} },
    // estimates nuke.family holds, by source
    fresh: { bsp: /* @__PURE__ */ new Set(), ffscouter: /* @__PURE__ */ new Set() },
    // players it needs nothing for
    statsAt: 0,
    anyStats: false,
    // some row has an estimate, from anywhere
    heldShown: false,
    // some row is showing one nuke.family supplied
    sources: /* @__PURE__ */ new Set(),
    // the sources estimates are available from
    uploadAfter: 0,
    fetchedAt: 0,
    // when statuses last arrived (browser clock)
    clockOffset: 0,
    // server clock minus browser clock, ms
    nextPollAt: 0,
    loading: false,
    error: false
  };
  var memos = /* @__PURE__ */ new Map();
  var written = /* @__PURE__ */ new WeakMap();
  var pending3 = { bsp: /* @__PURE__ */ new Map(), ffscouter: /* @__PURE__ */ new Map() };
  var ticker2 = null;
  var uploadTimer2 = null;
  var barHtml2 = "";
  function viewedWar() {
    if (!window.location.hash.startsWith("#/war/rank")) return null;
    const params = new URLSearchParams(window.location.search);
    if (params.get("step") === "your") return "";
    const id = params.get("step") === "profile" && params.get("ID");
    return id && /^\d+$/.test(id) ? id : null;
  }
  function watch4(target) {
    if (state6.target === target) return;
    state6.target = target;
    state6.war = void 0;
    state6.members = {};
    for (const source of SOURCES) {
      state6.held[source] = {};
      state6.fresh[source] = /* @__PURE__ */ new Set();
      pending3[source].clear();
    }
    state6.statsAt = 0;
    state6.uploadAfter = 0;
    state6.fetchedAt = 0;
    state6.nextPollAt = 0;
    state6.error = false;
    memos.clear();
  }
  function setAttr(element, name, value) {
    let cache = written.get(element);
    if (!cache) {
      cache = {};
      written.set(element, cache);
    }
    if (cache[name] === value) return;
    cache[name] = value;
    if (value === null) {
      element.removeAttribute(name);
    } else {
      element.setAttribute(name, value);
    }
  }
  function playerIdOf(row2) {
    const link = row2.querySelector("a[href*='profiles.php?XID=']");
    const match = link && link.getAttribute("href").match(/XID=(\d+)/);
    return match ? match[1] : null;
  }
  function cellOf(row2, name) {
    return row2.querySelector(`.${name}`) || row2.querySelector(`[class*="${name}___"]`);
  }
  function pageKindOf(statusCell) {
    if (!statusCell) return "other";
    const classes = statusCell.classList;
    const text = statusCell.textContent.trim();
    if (classes.contains("hospital") || classes.contains("jail") || /^(Hospital|Jail)$/.test(text)) {
      return "hospital";
    }
    if (classes.contains("traveling") || classes.contains("abroad") || /^(Traveling|Abroad)$/.test(text)) {
      return "travel";
    }
    return text === "Okay" ? "okay" : "other";
  }
  function pageEstimatesOf(row2) {
    const found = {};
    const scouter = Number(row2.dataset.estValue);
    if (scouter > 0) found[Source.FfScouter] = Math.round(scouter);
    const box = row2.querySelector(BSP_BOX_SELECTOR);
    const predicted = box && (Math.round(Number(box.dataset.bspStats)) || parseStatText(box.textContent));
    if (predicted > 0) found[Source.Bsp] = predicted;
    return found;
  }
  function scoreOf(row2) {
    const cell = cellOf(row2, "points");
    return cell && Number(cell.textContent.replace(/,/g, "")) || 0;
  }
  function noteForUpload(id, onPage) {
    if (state6.statsAt === 0 || Date.now() < state6.uploadAfter) return;
    for (const source of SOURCES) {
      if (!onPage[source] || state6.fresh[source].has(id) || pending3[source].has(id)) continue;
      pending3[source].set(id, onPage[source]);
      clearTimeout(uploadTimer2);
      uploadTimer2 = setTimeout(upload2, UPLOAD_DELAY_MS2);
    }
  }
  async function upload2() {
    uploadTimer2 = null;
    const target = state6.target;
    for (const source of SOURCES) {
      const batch = [...pending3[source].entries()].slice(0, UPLOAD_MAX);
      if (batch.length === 0) continue;
      pending3[source].clear();
      try {
        await api("/war/estimates", {
          method: "POST",
          data: {
            source,
            ...target ? { faction_id: Number(target) } : {},
            estimates: batch.map(([id, total]) => ({ id: Number(id), total }))
          }
        });
        if (state6.target !== target) return;
        for (const [id] of batch) state6.fresh[source].add(id);
        LogInfo(`War board sent ${batch.length} ${source} estimates`);
      } catch (error) {
        state6.uploadAfter = Date.now() + UPLOAD_RETRY_MS;
        console.error("[NFH] Could not send stat estimates to nuke.family:", error);
      }
    }
  }
  function clearRow(row2) {
    setAttr(row2, ROW_ATTR, null);
    const statusCell = cellOf(row2, "status");
    if (statusCell) {
      setAttr(statusCell, STATUS_ATTR, null);
      setAttr(statusCell, TONE_ATTR, null);
    }
    const memberCell = cellOf(row2, "member");
    if (memberCell) setAttr(memberCell, STATS_ATTR, null);
  }
  function clearAll2() {
    for (const element of document.querySelectorAll(`[${STATUS_ATTR}], [${ROW_ATTR}], [${STATS_ATTR}]`)) {
      element.removeAttribute(STATUS_ATTR);
      element.removeAttribute(TONE_ATTR);
      element.removeAttribute(ROW_ATTR);
      element.removeAttribute(STATS_ATTR);
    }
    written = /* @__PURE__ */ new WeakMap();
  }
  function hasData() {
    return !!state6.war && Date.now() - state6.fetchedAt < STALE_MS;
  }
  function decorate2(lists) {
    const prefs4 = getPrefs2();
    const live = hasData();
    const now = Date.now() + state6.clockOffset;
    const compare = live ? comparatorFor(prefs4.sort, prefs4.then) : null;
    let anyStats = false;
    let heldShown = false;
    const sources = /* @__PURE__ */ new Set();
    for (const list of lists) {
      const entries = [];
      for (const row2 of list.children) {
        const id = playerIdOf(row2);
        if (!id || !live) {
          clearRow(row2);
          continue;
        }
        const statusCell = cellOf(row2, "status");
        const pageKind = pageKindOf(statusCell);
        const entry = classify(state6.members[id], pageKind, now, memos.get(id));
        memos.set(id, entry.memo);
        const onPage = pageEstimatesOf(row2);
        const held = { bsp: state6.held.bsp[id], ffscouter: state6.held.ffscouter[id] };
        const estimate = pickEstimate(onPage, held, prefs4.source);
        noteForUpload(id, onPage);
        for (const source of SOURCES) {
          if (onPage[source] || held[source]) sources.add(source);
        }
        entry.stats = estimate.total;
        entry.score = scoreOf(row2);
        const badge = estimate.total > 0 && !estimate.fromPage;
        anyStats = anyStats || estimate.total > 0;
        heldShown = heldShown || badge;
        entry.row = row2;
        entries.push(entry);
        if (statusCell) {
          setAttr(statusCell, STATUS_ATTR, entry.label);
          setAttr(statusCell, TONE_ATTR, entry.label !== null && pageKind === "travel" ? "travel" : null);
        }
        setAttr(row2, ROW_ATTR, entry.out ? "out" : entry.soon ? "soon" : null);
        const memberCell = cellOf(row2, "member");
        if (memberCell) {
          setAttr(memberCell, STATS_ATTR, prefs4.showStats && badge ? formatStats(entry.stats) : null);
        }
      }
      if (compare && !list.closest(FF_BUSY_SELECTOR)) reorder(list, entries, compare);
    }
    state6.anyStats = anyStats;
    state6.heldShown = heldShown;
    state6.sources = sources;
  }
  function reorder(list, entries, compare) {
    const sorted = [...entries].sort(compare);
    if (sorted.every((entry, index) => entry === entries[index])) return;
    const fragment = document.createDocumentFragment();
    for (const entry of sorted) fragment.appendChild(entry.row);
    list.insertBefore(fragment, list.firstChild);
  }
  function statusText() {
    if (state6.war === null) {
      return state6.target ? "nuke.family found no ranked war on for this faction." : "nuke.family has no ranked war on for your faction yet.";
    }
    if (state6.error && !hasData()) return "Could not reach nuke.family. Trying again shortly.";
    if (!hasData()) return "Loading statuses\u2026";
    const age = Math.round((Date.now() - state6.fetchedAt) / 1e3);
    return age < 15 ? "Live" : `Updated ${age}s ago`;
  }
  function thenSelect(prefs4) {
    const options = [
      ...state6.anyStats ? [[Then.StatsAsc, "lowest stats"], [Then.StatsDesc, "highest stats"]] : [],
      [Then.ScoreDesc, "highest score"],
      [Then.ScoreAsc, "lowest score"],
      [Then.Recent, "latest out of hospital"]
    ];
    const chosen = options.some(([value]) => value === prefs4.then) ? prefs4.then : "";
    return '<label title="How members with the same status are ordered">then <select data-pref="then">' + (chosen === "" ? `<option value="" selected>Torn's order</option>` : "") + options.map(([value, label]) => `<option value="${value}"${value === chosen ? " selected" : ""}>${label}</option>`).join("") + "</select></label>";
  }
  function renderBar5() {
    const prefs4 = getPrefs2();
    const chip = (mode, label, title) => `<button type="button" class="nfh-cw-chip${prefs4.sort === mode ? " is-armed" : ""}" data-sort="${mode}" title="${title}">${label}</button>`;
    return '<div class="nfh-cw-bar"><strong>War board</strong>' + (state6.war ? '<span class="nfh-cw-muted">Sort</span>' + chip(SortMode.Status, "Hospital", "Who can be hit now, then who leaves hospital next") + (state6.anyStats ? chip(SortMode.StatsAsc, "Stats \u25B2", "Lowest battle stat estimate first") + chip(SortMode.StatsDesc, "Stats \u25BC", "Highest battle stat estimate first") : "") + chip(SortMode.Off, "Torn's order", "Leave the lists as Torn sorts them (or BSP / FF Scouter, if you sort with theirs)") + (prefs4.sort === SortMode.Status ? thenSelect(prefs4) : "") + (state6.sources.size > 1 ? `<label title="Whose estimate to use when both are known">Estimates <select data-pref="source"><option value="${Source.Bsp}"${prefs4.source === Source.Bsp ? " selected" : ""}>BSP</option><option value="${Source.FfScouter}"${prefs4.source === Source.FfScouter ? " selected" : ""}>FF Scouter</option></select></label>` : "") + (state6.heldShown || state6.anyStats && !prefs4.showStats ? `<label title="Show the estimates other members' BSP or FF Scouter passed on to nuke.family, where yours shows none"><input type="checkbox" data-pref="showStats"${prefs4.showStats ? " checked" : ""}> Show stats</label>` : "") : "") + `<span class="nfh-cw-status nfh-cw-muted">${statusText()}</span></div>`;
  }
  function ensureBar() {
    let bar2 = document.getElementById(BAR_ID4);
    if (!bar2) {
      const anchor = document.querySelector(ANCHOR_SELECTOR2);
      if (!anchor) return;
      bar2 = document.createElement("div");
      bar2.id = BAR_ID4;
      bar2.className = "nfh-cw nfh-war-bar";
      bar2.addEventListener("click", onClick4);
      bar2.addEventListener("change", onChange2);
      anchor.insertAdjacentElement("beforebegin", bar2);
      barHtml2 = "";
    }
    const html = renderBar5();
    if (html !== barHtml2) {
      barHtml2 = html;
      bar2.innerHTML = html;
    }
  }
  function onClick4(event) {
    const button3 = event.target.closest("[data-sort]");
    if (!button3) return;
    setPrefs2({ sort: button3.dataset.sort });
    refresh();
  }
  function onChange2(event) {
    const pref = event.target.dataset.pref;
    if (pref === "showStats") {
      setPrefs2({ showStats: event.target.checked });
    } else if (pref === "source") {
      setPrefs2({ source: event.target.value });
    } else if (pref === "then") {
      if (!event.target.value) return;
      setPrefs2({ then: event.target.value });
    } else {
      return;
    }
    refresh();
  }
  function refresh() {
    const lists = document.querySelectorAll(LIST_SELECTOR);
    if (lists.length > 0) {
      decorate2(lists);
      ensureBar();
    }
  }
  async function poll2() {
    const wantStats = Date.now() - state6.statsAt > STATS_REFRESH_MS;
    const target = state6.target;
    const query = [target ? `faction_id=${target}` : "", wantStats ? "stats=1" : ""].filter(Boolean).join("&");
    state6.loading = true;
    try {
      const response = await api("/war/board" + (query ? `?${query}` : ""));
      if (state6.target !== target) return;
      const data = response.data || {};
      state6.error = false;
      if (!data.war) {
        state6.war = null;
        state6.nextPollAt = Date.now() + (data.recheck_seconds || 600) * 1e3;
        return;
      }
      state6.war = data.war;
      state6.members = data.members || {};
      state6.fetchedAt = Date.now();
      state6.clockOffset = data.server_time * 1e3 - Date.now();
      state6.nextPollAt = Date.now() + (data.poll_seconds * 1e3 || DEFAULT_POLL_MS);
      if (data.estimates) {
        for (const source of SOURCES) {
          state6.held[source] = data.estimates[source] || {};
          state6.fresh[source] = new Set(((data.estimates_fresh || {})[source] || []).map(String));
        }
        state6.statsAt = Date.now();
      }
    } catch (error) {
      if (state6.target !== target) return;
      state6.error = true;
      state6.nextPollAt = Date.now() + ERROR_RETRY_MS;
      console.error("[NFH] Could not load the war board from nuke.family:", error);
    } finally {
      state6.loading = false;
      refresh();
    }
  }
  function tick2() {
    const target = viewedWar();
    if (target === null) {
      stop2();
      return;
    }
    watch4(target);
    if (document.hidden) return;
    const lists = document.querySelectorAll(LIST_SELECTOR);
    if (lists.length === 0) return;
    decorate2(lists);
    ensureBar();
    if (!state6.loading && Date.now() >= state6.nextPollAt) {
      poll2();
    }
  }
  function stop2() {
    clearInterval(ticker2);
    ticker2 = null;
    const bar2 = document.getElementById(BAR_ID4);
    if (bar2) bar2.remove();
    clearAll2();
    memos.clear();
    clearTimeout(uploadTimer2);
    uploadTimer2 = null;
    for (const source of SOURCES) pending3[source].clear();
    LogInfo("War board stopped");
  }
  function init6() {
    if (viewedWar() === null) {
      if (ticker2) stop2();
      return;
    }
    if (ticker2) return;
    ticker2 = setInterval(tick2, 1e3);
    tick2();
    LogInfo("War board started");
  }
  var ranked_war_default = {
    name: "ranked-war",
    pages: [PageType.Faction],
    init: init6
  };

  // src/features/recruiting.js
  async function getRecruitingScoreForPlayer(playerId) {
    try {
      return await api("/candidate-score/" + playerId);
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error("Bad response from server.");
      }
      if (error.name === "ApiError") {
        if (error.status === 403) {
          throw new Error("You don't have permission to use recruiting scores.");
        }
        if (error.body && error.body.error) {
          throw new Error(error.body.error);
        }
        throw new Error("Failed to fetch recruiting score.");
      }
      throw new Error("Network error fetching recruiting score.");
    }
  }
  function recruitingScoreColor(score) {
    if (score === null || score === void 0 || isNaN(score)) return "#999";
    if (score >= 67) return "#3a3";
    if (score >= 34) return "#c90";
    return "#d33";
  }
  function renderRecruitingScore(container, data) {
    const subs = [
      ["Activity", data.activity, "activity"],
      ["Kick Safety", data.kick_safety, "kick_safety"],
      ["Retention", data.retention, "retention"],
      ["Combat", data.combat, "combat"]
    ];
    const explanation = data.explanation || {};
    function driverLine(items, marker, color) {
      if (!items || !items.length) return "";
      const parts = items.slice(0, 3).map(function(d) {
        const tip = d.value === null || d.value === void 0 ? d.label : `${d.label} = ${d.value}`;
        return `<span title="${escapeHtml(tip)}">${escapeHtml(d.label)}</span>`;
      });
      return `<div style="color:${color};margin-top:1px;">${marker} ${parts.join(" \xB7 ")}</div>`;
    }
    let html = `<div style="margin-top:8px;font-weight:bold;">Recruiting Score: <span style="color:${recruitingScoreColor(data.composite)};">${escapeHtml(data.composite)}</span>/100</div>`;
    if (data.feature_set === "public") {
      html += `<div style="font-size:11px;opacity:0.7;">Public model (battle stats not available)</div>`;
    }
    html += `<ul class="nfh-section-list" style="margin-top:6px;">`;
    subs.forEach(function(entry) {
      const name = entry[0];
      const val = entry[1];
      const drivers = explanation[entry[2]] || {};
      const lines = driverLine(drivers.up, "\u25B2", "#3a3") + driverLine(drivers.down, "\u25BC", "#d33");
      html += `<li><span class="nfh-list-key">${name}:</span><span class="nfh-list-value"><strong style="color:${recruitingScoreColor(val)};">${escapeHtml(val)}</strong>` + (lines ? `<div style="font-size:11px;line-height:1.5;margin-top:3px;">${lines}</div>` : "") + `</span></li>`;
    });
    html += `</ul>`;
    container.innerHTML = html;
  }
  async function maybeAddRecruitingButton(container, playerId) {
    const permissions = await getOwnPermissions();
    if (!permissions.includes(RECRUITING_PERMISSION)) return;
    if (container.querySelector(".nfh-recruiting-wrap")) return;
    const wrap = document.createElement("div");
    wrap.classList.add("nfh-recruiting-wrap");
    wrap.style.marginTop = "8px";
    const btn = document.createElement("button");
    btn.type = "button";
    btn.classList.add("nfh-recruiting-btn");
    btn.innerText = "Check Recruiting Score";
    btn.style.cssText = "cursor:pointer;width:100%;padding:5px 8px;border-radius:5px;border:1px solid var(--nfh-border, #444);background:var(--nfh-bg, #2b2b2b);color:inherit;";
    const result = document.createElement("div");
    result.classList.add("nfh-recruiting-result");
    btn.addEventListener("click", async function() {
      btn.disabled = true;
      btn.innerText = "Checking\u2026";
      try {
        const data = await getRecruitingScoreForPlayer(playerId);
        wrap.removeChild(btn);
        renderRecruitingScore(result, data);
        LogInfo(`Recruiting score for player ${playerId}: ${data.composite}`);
      } catch (error) {
        btn.disabled = false;
        btn.innerText = "Check Recruiting Score";
        result.innerHTML = `<div style="color:#d33;margin-top:6px;font-size:12px;">${escapeHtml(error.message)}</div>`;
      }
    });
    wrap.appendChild(btn);
    wrap.appendChild(result);
    container.appendChild(wrap);
  }

  // src/features/reputation.js
  var REPUTATION_CACHE_PREFIX = "nfh_reputation_";
  var REPUTATION_CACHE_TTL_MS = 60 * 60 * 1e3;
  function sweepStaleReputationCache() {
    const now = Date.now();
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(REPUTATION_CACHE_PREFIX)) continue;
      try {
        const parsed = JSON.parse(localStorage.getItem(key));
        if (!parsed || !parsed.timestamp || now - parsed.timestamp >= REPUTATION_CACHE_TTL_MS) {
          keysToRemove.push(key);
        }
      } catch (e) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  }
  async function getReputationForPlayer(playerId) {
    sweepStaleReputationCache();
    const cacheKey = REPUTATION_CACHE_PREFIX + playerId;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.timestamp && Date.now() - parsed.timestamp < REPUTATION_CACHE_TTL_MS) {
          LogInfo(`Reputation cache hit for player ${playerId}`);
          return parsed.data;
        }
      } catch (e) {
      }
    }
    LogInfo(`Fetching reputation for player ${playerId}`);
    try {
      const data = await api("/reputation/" + playerId);
      localStorage.setItem(
        cacheKey,
        JSON.stringify({ data, timestamp: Date.now() })
      );
      LogInfo(`Reputation fetched for player ${playerId}:`, data);
      return data;
    } catch (error) {
      console.error("Error fetching reputation:", error);
      return null;
    }
  }
  onUserRoleRefreshed(() => applyReputationSetting());
  onPermissionsRefreshed(() => applyReputationSetting());
  function applyReputationSetting() {
    if (SettingsManager.isReputationVisible()) {
      checkAndInsertReputation();
    } else {
      document.querySelector(".nfh-reputation")?.remove();
    }
  }
  async function checkAndInsertReputation() {
    if (!IsPage(PageType.Profile)) {
      return;
    }
    if (!SettingsManager.isReputationVisible()) {
      await getOwnPermissions();
      if (!SettingsManager.isReputationVisible()) return;
    }
    const playerId = getPlayerId();
    if (!playerId) {
      return;
    }
    if (document.querySelector(".nfh-reputation")) {
      return;
    }
    const data = await getReputationForPlayer(playerId);
    if (!data) {
      return;
    }
    const elm = await waitForElm("div.profile-left-wrapper");
    if (document.querySelector(".nfh-reputation")) {
      return;
    }
    const outerDiv = document.createElement("div");
    outerDiv.classList.add("nfh-reputation", "nfh-section", "m-top10");
    const innerDiv = document.createElement("div");
    const title = document.createElement("p");
    title.innerText = "Nuke Family Reputation";
    title.classList.add("nfh-section-title", "title-black", "top-round");
    const container = document.createElement("div");
    container.classList.add("nfh-section-container");
    const list = document.createElement("ul");
    list.classList.add("nfh-section-list");
    const li = document.createElement("li");
    li.innerHTML = `<span class="nfh-list-key">Paid Revives:</span><span class="nfh-list-value"><strong>${escapeHtml(data.paid_revives_90d)}</strong> confirmed paid revive${data.paid_revives_90d !== 1 ? "s" : ""} (last ${escapeHtml(data.window_days)} days)</span>`;
    list.appendChild(li);
    container.appendChild(list);
    maybeAddRecruitingButton(container, playerId);
    innerDiv.appendChild(title);
    innerDiv.appendChild(container);
    outerDiv.appendChild(innerDiv);
    const firstChild = elm.firstChild;
    if (firstChild && firstChild.nextSibling) {
      elm.insertBefore(outerDiv, firstChild.nextSibling);
    } else {
      elm.appendChild(outerDiv);
    }
    LogInfo(
      `Reputation section injected for player ${playerId}: ${data.paid_revives_90d} paid revives`
    );
  }
  var reputation_default = {
    name: "reputation",
    pages: [PageType.Profile],
    init: checkAndInsertReputation
  };

  // src/features/retals/capture.js
  var EVENT = "nfh:chain-feed";
  var started2 = false;
  function pageTap(eventName) {
    if (window.__nfhChainFeedTap) return;
    window.__nfhChainFeedTap = true;
    const pick = (feed, factionId) => {
      const attacks = feed.recentAttacks;
      const users = {};
      const all = feed.users || {};
      for (const attack2 of attacks) {
        for (const id of [attack2.attackerID, attack2.defenderID, attack2.firstUserID]) {
          if (id && all[id]) users[id] = all[id];
        }
      }
      return { recentAttacks: attacks, users, userFactionID: factionId ?? feed.userFactionID ?? null };
    };
    const send = (source, detail) => {
      try {
        document.dispatchEvent(new CustomEvent(eventName, { detail: JSON.stringify({ source, ...detail }) }));
      } catch (e) {
      }
    };
    const findFeed = (value, depth) => {
      if (!value || typeof value !== "object" || Array.isArray(value) || depth > 4) return null;
      if (Array.isArray(value.recentAttacks)) return value;
      for (const key of Object.keys(value)) {
        const found = findFeed(value[key], depth + 1);
        if (found) return found;
      }
      return null;
    };
    const fromBody = (source, body) => {
      try {
        if (typeof body === "string") body = JSON.parse(body);
        const feed = findFeed(body, 0);
        if (feed) send(source, { feed: pick(feed, body && body.userFactionID), keys: Object.keys(body || {}).slice(0, 20) });
        else send(source, { feed: null, keys: Object.keys(body || {}).slice(0, 20) });
      } catch (e) {
        send(source, { feed: null, error: "not_json" });
      }
    };
    const isChainFeed = (url) => /faction_wars\.php/.test(url) && /step=getwardata/.test(url) && /wardescid=chain/.test(url);
    try {
      const open = XMLHttpRequest.prototype.open;
      const sendRequest = XMLHttpRequest.prototype.send;
      XMLHttpRequest.prototype.open = function(method, url) {
        this.__nfhChainFeed = isChainFeed(String(url));
        return open.apply(this, arguments);
      };
      XMLHttpRequest.prototype.send = function() {
        if (this.__nfhChainFeed) {
          this.addEventListener("load", () => {
            if (this.responseType === "json") fromBody("xhr", this.response);
            else if (this.responseType === "" || this.responseType === "text") fromBody("xhr", this.responseText);
          });
        }
        return sendRequest.apply(this, arguments);
      };
    } catch (e) {
      send("xhr", { feed: null, error: "wrap_failed" });
    }
    try {
      const pageFetch = window.fetch;
      if (pageFetch) {
        window.fetch = function(input) {
          const answer = pageFetch.apply(this, arguments);
          try {
            const url = typeof input === "string" ? input : input && input.url;
            if (url && isChainFeed(String(url))) {
              answer.then((response) => response.clone().text()).then((text) => fromBody("fetch", text)).catch(() => {
              });
            }
          } catch (e) {
          }
          return answer;
        };
      }
    } catch (e) {
      send("fetch", { feed: null, error: "wrap_failed" });
    }
    let lastSeen = "";
    let lastList = null;
    setInterval(() => {
      if (document.hidden) return;
      const list = document.querySelector(".chain-attacks-list.recent-attacks");
      if (!list) return;
      if (list !== lastList) {
        lastList = list;
        lastSeen = "";
      }
      const key = Object.keys(list).find((k) => k.startsWith("__reactFiber$") || k.startsWith("__reactInternalInstance$"));
      if (!key) return;
      let fiber = list[key];
      for (let i = 0; fiber && i < 40; i++, fiber = fiber.return) {
        const props = fiber.memoizedProps;
        if (props && props.warDesc && Array.isArray(props.warDesc.recentAttacks)) {
          const seen = props.warDesc.recentAttacks.map((attack2) => [attack2.publicID, attack2.respect, attack2.result, attack2.retal].join(":")).join(",");
          if (seen !== lastSeen) {
            lastSeen = seen;
            send("react", { feed: pick(props.warDesc, props.userFactionID) });
          }
          return;
        }
      }
    }, 2e3);
    send("ready", { ready: true });
  }
  var ATTACK_FIELDS = ["publicID", "attackerID", "defenderID", "firstUserID", "secondUserID", "respect", "finishTimestamp", "result", "stealthAttack", "retal"];
  var USER_FIELDS = ["userID", "factionID", "playername", "factiontag"];
  function pageSide(value) {
    return value && value.wrappedJSObject ? value.wrappedJSObject : value;
  }
  function copyFields(source, fields) {
    const copy = {};
    for (const field of fields) {
      const value = source[field];
      if (value === null || ["string", "number", "boolean"].includes(typeof value)) copy[field] = value;
    }
    return copy;
  }
  var localReport = null;
  function noteLocal(reason) {
    if (localReport === reason) return;
    localReport = reason;
    LogInfo(`[retals] reading React data from the script: ${reason}`);
  }
  function readHere() {
    const list = document.querySelector(".chain-attacks-list.recent-attacks");
    if (!list) return null;
    const element = pageSide(list);
    let key;
    try {
      key = Object.keys(element).find((k) => k.startsWith("__reactFiber$") || k.startsWith("__reactInternalInstance$"));
    } catch (e) {
      noteLocal(`cannot look at the list (${e.message})`);
      return null;
    }
    if (!key) {
      noteLocal("no React data on the list from here");
      return null;
    }
    let fiber = pageSide(element[key]);
    for (let i = 0; fiber && i < 40; i++, fiber = pageSide(fiber.return)) {
      const props = pageSide(fiber.memoizedProps);
      const warDesc = props && pageSide(props.warDesc);
      const attacks = warDesc && pageSide(warDesc.recentAttacks);
      if (!attacks || typeof attacks.length !== "number") continue;
      const recentAttacks = [];
      const users = {};
      const allUsers = pageSide(warDesc.users) || {};
      for (let n = 0; n < attacks.length; n++) {
        const attack2 = copyFields(pageSide(attacks[n]), ATTACK_FIELDS);
        recentAttacks.push(attack2);
        for (const id of [attack2.attackerID, attack2.defenderID, attack2.firstUserID]) {
          const user = id && pageSide(allUsers[id]);
          if (user) users[id] = copyFields(user, USER_FIELDS);
        }
      }
      noteLocal(`found ${recentAttacks.length} attacks`);
      return { recentAttacks, users, userFactionID: Number(props.userFactionID) || null };
    }
    noteLocal("React data found, but no recent attacks in it");
    return null;
  }
  function startCapture(onFeed2) {
    if (started2) return;
    started2 = true;
    let pageTapRan = false;
    document.addEventListener(EVENT, (event) => {
      let detail;
      try {
        detail = JSON.parse(event.detail);
      } catch (e) {
        return;
      }
      if (detail.ready) {
        pageTapRan = true;
        LogInfo("[retals] page script running");
        return;
      }
      if (!detail.feed) {
        LogInfo("[retals] chain feed answer without attacks", detail);
        return;
      }
      onFeed2(detail.feed, detail.source, detail.keys);
    });
    try {
      runInPage(`(${pageTap.toString()})(${JSON.stringify(EVENT)});`);
    } catch (e) {
      LogInfo("[retals] could not add the page script", e);
    }
    setTimeout(() => {
      if (!pageTapRan) LogInfo("[retals] page script did not run (the page may block added scripts); reading from the script only");
    }, 3e3);
    let lastSeen = "";
    let lastList = null;
    setInterval(() => {
      if (document.hidden) return;
      const list = document.querySelector(".chain-attacks-list.recent-attacks");
      if (list !== lastList) {
        lastList = list;
        lastSeen = "";
      }
      const feed = readHere();
      if (!feed) return;
      const seen = feed.recentAttacks.map((attack2) => [attack2.publicID, attack2.respect, attack2.result, attack2.retal].join(":")).join(",");
      if (seen === lastSeen) return;
      lastSeen = seen;
      onFeed2(feed, "react-here");
    }, 2e3);
  }

  // src/features/retals/logic.js
  var WINDOW_SECONDS = 300;
  function feedFactionId(feed) {
    const stated = Number(feed && feed.userFactionID);
    if (stated > 0) return stated;
    const attacks = feed && feed.recentAttacks || [];
    const users = feed && feed.users || {};
    for (const attack2 of attacks) {
      const ours = users[attack2.firstUserID];
      if (ours && Number(ours.factionID) > 0) return Number(ours.factionID);
    }
    return null;
  }
  function idOrNull(value) {
    const id = Number(value);
    return id > 0 ? id : null;
  }
  function textOrNull(value) {
    return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
  }
  function normalizeAttack(attack2, users = {}) {
    const attackerId = idOrNull(attack2.attackerID);
    const attacker = attackerId && users[attackerId] || {};
    const defender = users[attack2.defenderID] || {};
    return {
      id: String(attack2.publicID),
      attacker_id: attackerId,
      attacker_name: textOrNull(attacker.playername),
      attacker_faction_id: idOrNull(attacker.factionID),
      attacker_faction_tag: textOrNull(attacker.factiontag),
      defender_id: Number(attack2.defenderID),
      defender_name: textOrNull(defender.playername),
      defender_faction_id: idOrNull(defender.factionID),
      finished_at: Math.floor(Number(attack2.finishTimestamp) / 1e3),
      respect: Number(attack2.respect) || 0,
      result: textOrNull(attack2.result),
      stealth: Number(attack2.stealthAttack) !== 0 || attackerId === null,
      // Torn gives a level for each bonus icon (seen: retal 3, fairFight 2), 0 for none.
      retal: Number(attack2.retal) > 0
    };
  }
  function matters(attack2, factionId) {
    const incoming = attack2.defender_faction_id === factionId && attack2.attacker_faction_id !== factionId && !attack2.stealth && attack2.respect < 0;
    const retalDone = attack2.attacker_faction_id === factionId && attack2.retal;
    return incoming || retalDone;
  }
  function attacksToReport(feed, factionId, sent2, nowSeconds) {
    const users = feed && feed.users || {};
    return (feed && feed.recentAttacks || []).filter((attack2) => attack2 && attack2.publicID && !sent2.has(String(attack2.publicID))).map((attack2) => normalizeAttack(attack2, users)).filter((attack2) => attack2.finished_at > nowSeconds - WINDOW_SECONDS).filter((attack2) => matters(attack2, factionId));
  }
  function formatLeft(seconds) {
    const left = Math.max(0, Math.floor(seconds));
    return `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;
  }
  function retalState(retal, nowSeconds) {
    if (retal.done_at) return "done";
    if (!retal.claimed_by || !(retal.claimed_until > nowSeconds)) return "free";
    return retal.claimed_by_me ? "mine" : "taken";
  }
  var DONE_LINGER_SECONDS = 120;
  function visibleRetals(retals, nowSeconds) {
    return (retals || []).filter(
      (retal) => retal.done_at ? retal.done_at + DONE_LINGER_SECONDS > nowSeconds : retal.expires_at > nowSeconds
    );
  }
  function noticeKey(retal) {
    return `${retal.enemy_id}:${retal.first_hit_at}`;
  }
  function retalsToAnnounce(retals, announced, nowSeconds, minSeconds) {
    return visibleRetals(retals, nowSeconds).filter((retal) => {
      const state8 = retalState(retal, nowSeconds);
      return (state8 === "free" || state8 === "mine") && retal.expires_at - nowSeconds >= minSeconds && !announced.has(noticeKey(retal));
    });
  }

  // src/features/retals/data.js
  var SENT_KEY = "nfhRetalsSent";
  var SENT_KEEP_SECONDS = WINDOW_SECONDS * 2;
  var sent = null;
  function load6() {
    if (sent) return sent;
    sent = /* @__PURE__ */ new Map();
    try {
      const stored = JSON.parse(localStorage.getItem(SENT_KEY) || "{}");
      for (const [id, at] of Object.entries(stored)) sent.set(id, Number(at));
    } catch (e) {
    }
    return sent;
  }
  function save() {
    const oldest = Math.floor(Date.now() / 1e3) - SENT_KEEP_SECONDS;
    for (const [id, at] of sent) if (at < oldest) sent.delete(id);
    try {
      localStorage.setItem(SENT_KEY, JSON.stringify(Object.fromEntries(sent)));
    } catch (e) {
    }
  }
  function sentIds() {
    return new Set(load6().keys());
  }
  function markSent(attacks) {
    const list = load6();
    for (const attack2 of attacks) {
      const id = String(attack2.id ?? attack2.publicID);
      const at = attack2.finished_at ?? Math.floor(Number(attack2.finishTimestamp) / 1e3);
      list.set(id, at);
    }
    save();
  }
  function report(factionId, attacks) {
    return api("/retals/report", { method: "POST", data: { faction_id: factionId, attacks } });
  }
  function fetchRetals() {
    return api("/retals");
  }
  function claimRetal(enemyId) {
    return api(`/retals/${enemyId}/claim`, { method: "POST" });
  }
  function unclaimRetal(enemyId) {
    return api(`/retals/${enemyId}/unclaim`, { method: "POST" });
  }

  // src/features/retals/prefs.js
  var STORAGE_KEY3 = "nfhRetals";
  var DEFAULTS4 = {
    show: true,
    // the list, and reporting what this browser sees
    notify: true,
    // a toast for each new retal
    sound: false,
    // one chime with the toast
    volume: 0.5,
    desktop: false,
    // a desktop notification as well (where the browser allows it)
    minSeconds: 30,
    // a retal with less time left than this is not announced
    position: "bottom-left"
    // where the notice sits on the screen (bottom right covers Torn's chat)
  };
  var POSITIONS = {
    "bottom-left": "Bottom left",
    "bottom-center": "Bottom middle",
    "bottom-right": "Bottom right",
    "middle-left": "Middle left",
    "middle-right": "Middle right",
    "top-left": "Top left",
    "top-center": "Top middle",
    "top-right": "Top right"
  };
  var MAX_MIN_SECONDS = 240;
  function clamp2(value, min, max, fallback) {
    const number2 = Number(value);
    if (!Number.isFinite(number2)) return fallback;
    return Math.min(max, Math.max(min, number2));
  }
  function sanitize3(raw) {
    const source = raw && typeof raw === "object" ? raw : {};
    return {
      show: source.show !== false,
      notify: source.notify !== false,
      sound: source.sound === true,
      volume: clamp2(source.volume, 0.05, 1, DEFAULTS4.volume),
      desktop: source.desktop === true,
      minSeconds: Math.round(clamp2(source.minSeconds, 0, MAX_MIN_SECONDS, DEFAULTS4.minSeconds)),
      position: Object.hasOwn(POSITIONS, source.position) ? source.position : DEFAULTS4.position
    };
  }
  var prefs3 = null;
  function getPrefs3() {
    if (prefs3) return prefs3;
    let stored = null;
    try {
      stored = JSON.parse(getItem(STORAGE_KEY3) || "null");
    } catch (e) {
    }
    prefs3 = sanitize3(stored);
    return prefs3;
  }
  function setPrefs3(patch) {
    prefs3 = sanitize3({ ...getPrefs3(), ...patch });
    setItem(STORAGE_KEY3, JSON.stringify(prefs3));
    return prefs3;
  }

  // src/features/retals/notify.js
  var TOAST_ID = "nfh-retal-toast";
  var TOAST_MS = 12 * 1e3;
  var ANNOUNCED_KEY = "nfhRetalsAnnounced";
  var KEEP_SECONDS = 15 * 60;
  var toastTimer = null;
  var audioContext2 = null;
  function loadAnnounced() {
    try {
      return JSON.parse(localStorage.getItem(ANNOUNCED_KEY) || "{}") || {};
    } catch (e) {
      return {};
    }
  }
  function saveAnnounced(list, nowSeconds) {
    for (const [key, at] of Object.entries(list)) if (at < nowSeconds - KEEP_SECONDS) delete list[key];
    try {
      localStorage.setItem(ANNOUNCED_KEY, JSON.stringify(list));
    } catch (e) {
    }
  }
  function desktopSupported() {
    return !isPda && typeof window.Notification === "function";
  }
  function desktopPermission() {
    return desktopSupported() ? window.Notification.permission : "unsupported";
  }
  async function askDesktopPermission() {
    if (!desktopSupported()) return "unsupported";
    if (window.Notification.permission !== "default") return window.Notification.permission;
    try {
      return await window.Notification.requestPermission();
    } catch (e) {
      return "denied";
    }
  }
  function chime(volume) {
    try {
      if (!audioContext2) audioContext2 = new (window.AudioContext || window.webkitAudioContext)();
      if (audioContext2.state === "suspended") audioContext2.resume();
      const start3 = audioContext2.currentTime;
      [660, 880].forEach((hz, index) => {
        const oscillator = audioContext2.createOscillator();
        const gain = audioContext2.createGain();
        oscillator.type = "sine";
        oscillator.frequency.value = hz;
        const at = start3 + index * 0.16;
        gain.gain.setValueAtTime(volume, at);
        gain.gain.exponentialRampToValueAtTime(1e-3, at + 0.15);
        oscillator.connect(gain);
        gain.connect(audioContext2.destination);
        oscillator.start(at);
        oscillator.stop(at + 0.16);
      });
    } catch (e) {
    }
  }
  function describe(retal, nowSeconds) {
    const victim = retal.victims && retal.victims[0] ? ` hit ${retal.victims[0].name || "one of us"}` : "";
    return `${victim} \xB7 ${formatLeft(retal.expires_at - nowSeconds)} left`;
  }
  function hideToast() {
    const toast = document.getElementById(TOAST_ID);
    if (toast) toast.remove();
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = null;
  }
  function showToast(retals, nowSeconds, onAttack) {
    hideToast();
    const toast = document.createElement("div");
    toast.id = TOAST_ID;
    toast.className = `nfh-cw nfh-rt-toast nfh-rt-toast--${getPrefs3().position}`;
    toast.setAttribute("role", "status");
    if (retals.length === 1) {
      const retal = retals[0];
      const tag = retal.enemy_faction_tag ? ` <span class="nfh-rt-tag">${escapeHtml(retal.enemy_faction_tag)}</span>` : "";
      toast.innerHTML = `<div class="nfh-rt-toast-text"><strong>Retal:</strong> ${escapeHtml(retal.enemy_name || `#${retal.enemy_id}`)}${tag}<span class="nfh-rt-muted">${escapeHtml(describe(retal, nowSeconds))}</span></div>
      <span class="nfh-rt-actions"><button type="button" class="nfh-cw-btn nfh-cw-btn--primary" data-toast="attack">Attack</button>
      <button type="button" class="nfh-cw-btn" data-toast="close" aria-label="Dismiss">\u2715</button></span>`;
    } else {
      const names = retals.map((retal) => escapeHtml(retal.enemy_name || `#${retal.enemy_id}`)).join(", ");
      toast.innerHTML = `<div class="nfh-rt-toast-text"><strong>${retals.length} new retals:</strong> ${names}</div>
      <span class="nfh-rt-actions"><button type="button" class="nfh-cw-btn" data-toast="close" aria-label="Dismiss">\u2715</button></span>`;
    }
    toast.addEventListener("click", (event) => {
      const button3 = event.target.closest("[data-toast]");
      if (!button3) return;
      if (button3.dataset.toast === "attack") onAttack(retals[0].enemy_id);
      hideToast();
    });
    document.body.appendChild(toast);
    toastTimer = setTimeout(hideToast, TOAST_MS);
  }
  function showDesktop(retals, nowSeconds) {
    if (desktopPermission() !== "granted") return;
    try {
      const first = retals[0];
      const title = retals.length === 1 ? `Retal: ${first.enemy_name || `#${first.enemy_id}`}` : `${retals.length} new retals`;
      const body = retals.length === 1 ? describe(first, nowSeconds).replace(/^ /, "") : retals.map((retal) => retal.enemy_name || `#${retal.enemy_id}`).join(", ");
      const notice = new window.Notification(title, { body, tag: `nfh-retal-${noticeKey(first)}` });
      notice.onclick = () => {
        window.focus();
        notice.close();
      };
    } catch (e) {
    }
  }
  function announce(retals, nowSeconds, onAttack) {
    const prefs4 = getPrefs3();
    const announced = loadAnnounced();
    const fresh2 = retalsToAnnounce(retals, new Set(Object.keys(announced)), nowSeconds, prefs4.minSeconds);
    if (!fresh2.length) return;
    for (const retal of fresh2) announced[noticeKey(retal)] = nowSeconds;
    saveAnnounced(announced, nowSeconds);
    if (!prefs4.notify) return;
    showToast(fresh2, nowSeconds, onAttack);
    if (prefs4.sound) chime(prefs4.volume);
    if (prefs4.desktop) showDesktop(fresh2, nowSeconds);
  }
  function previewPosition() {
    hideToast();
    const toast = document.createElement("div");
    toast.id = TOAST_ID;
    toast.className = `nfh-cw nfh-rt-toast nfh-rt-toast--${getPrefs3().position}`;
    toast.setAttribute("role", "status");
    toast.innerHTML = `<div class="nfh-rt-toast-text"><strong>Retal notices</strong><span class="nfh-rt-muted">will show here</span></div>
    <span class="nfh-rt-actions"><button type="button" class="nfh-cw-btn" data-toast="close" aria-label="Dismiss">\u2715</button></span>`;
    toast.addEventListener("click", (event) => {
      if (event.target.closest("[data-toast]")) hideToast();
    });
    document.body.appendChild(toast);
    toastTimer = setTimeout(hideToast, 3e3);
  }

  // src/features/retals/stats.js
  var BSP_TAG = ".iconStats, .iconStatsAttack";
  var FFS_GAUGE = "ffscouter-gauge";
  var FFS_MARKER = ".ffscouter-marker-wrapper";
  var copied = /* @__PURE__ */ new Map();
  function tornNameBox(enemyId) {
    const links = document.querySelectorAll(`.chain-attacks-list a[href*="XID=${enemyId}"]`);
    for (const link of links) {
      if (new URL(link.href, location.href).searchParams.get("XID") !== String(enemyId)) continue;
      const box = link.closest('[class*="userInfoBox"]');
      if (box && !box.closest("#nfh-retals")) return box;
    }
    return null;
  }
  function captureTags(retals) {
    for (const retal of retals) {
      const id = retal.enemy_id;
      const box = tornNameBox(id);
      if (!box) continue;
      const had = copied.get(id) || { bsp: null, ffs: null };
      const bsp = box.querySelector(BSP_TAG);
      const ffs = box.classList.contains(FFS_GAUGE) ? {
        percent: box.style.getPropertyValue("--band-percent"),
        side: box.dataset.ffscouterBandSide || "",
        mode: box.dataset.ffscouterAttachMode || "",
        marker: box.querySelector(FFS_MARKER)
      } : null;
      copied.set(id, {
        bsp: bsp ? bsp.cloneNode(true) : had.bsp,
        ffs: ffs ? { ...ffs, marker: ffs.marker ? ffs.marker.cloneNode(true) : null } : had.ffs
      });
    }
  }
  function bspCached(enemyId) {
    try {
      const stored = JSON.parse(localStorage.getItem(`tdup.battleStatsPredictor.cache.prediction.${enemyId}`) || "null");
      const total = Number(stored && stored.TBS);
      return total > 0 ? total : null;
    } catch (e) {
      return null;
    }
  }
  function applyTags(root3) {
    for (const wrapper of root3.querySelectorAll("[data-nfh-tag]")) {
      const id = Number(wrapper.dataset.nfhTag);
      const tags = copied.get(id);
      if (tags && tags.bsp) {
        wrapper.prepend(tags.bsp.cloneNode(true));
      } else {
        const total = bspCached(id);
        if (total) {
          const tag = document.createElement("span");
          tag.className = "nfh-rt-bsp";
          tag.title = "Battle Stats Predictor estimate";
          tag.textContent = formatStats(total);
          wrapper.prepend(tag);
        }
      }
      if (tags && tags.ffs) {
        wrapper.classList.add(FFS_GAUGE);
        if (tags.ffs.percent) wrapper.style.setProperty("--band-percent", tags.ffs.percent);
        if (tags.ffs.side) wrapper.dataset.ffscouterBandSide = tags.ffs.side;
        if (tags.ffs.mode) wrapper.dataset.ffscouterAttachMode = tags.ffs.mode;
        if (tags.ffs.marker) wrapper.append(tags.ffs.marker.cloneNode(true));
      }
    }
  }
  function forgetTags(retals) {
    const keep = new Set(retals.map((retal) => retal.enemy_id));
    for (const id of copied.keys()) if (!keep.has(id)) copied.delete(id);
  }

  // src/features/retals/view.js
  function profileUrl(playerId) {
    return `/profiles.php?XID=${encodeURIComponent(playerId)}`;
  }
  function attackUrl(playerId) {
    return `/page.php?sid=attack&user2ID=${encodeURIComponent(playerId)}`;
  }
  function enemyName(retal) {
    const name = escapeHtml(retal.enemy_name || `#${retal.enemy_id}`);
    const tag = retal.enemy_faction_tag ? ` <span class="nfh-rt-tag">${escapeHtml(retal.enemy_faction_tag)}</span>` : "";
    return `<span class="nfh-rt-who" data-nfh-tag="${escapeHtml(retal.enemy_id)}"><a class="nfh-rt-name" href="${profileUrl(retal.enemy_id)}">${name}</a></span>${tag}`;
  }
  function victims(retal) {
    const list = retal.victims || [];
    if (!list.length) return "";
    const first = escapeHtml(list[0].name || `#${list[0].id}`);
    const more = list.length > 1 ? ` +${list.length - 1}` : "";
    return `<span class="nfh-rt-muted">hit ${first}${more}</span>`;
  }
  function buttons(retal, state8, ui) {
    const busy2 = ui.busy === retal.enemy_id ? " disabled" : "";
    const id = escapeHtml(retal.enemy_id);
    const claim = state8 === "mine" ? `<button type="button" class="nfh-cw-btn" data-action="unclaim" data-enemy="${id}"${busy2}>Unclaim</button>` : state8 === "free" ? `<button type="button" class="nfh-cw-btn" data-action="claim" data-enemy="${id}"${busy2}>Claim</button>` : "";
    const attack2 = `<a class="nfh-cw-btn nfh-cw-btn--primary nfh-rt-attack" href="${attackUrl(retal.enemy_id)}" data-action="attack" data-enemy="${id}">Attack</a>`;
    return `<span class="nfh-rt-actions">${claim}${attack2}</span>`;
  }
  function row(retal, now, ui) {
    const state8 = retalState(retal, now);
    const id = escapeHtml(retal.enemy_id);
    if (state8 === "done") {
      const by = retal.done_by && retal.done_by.name ? ` by ${escapeHtml(retal.done_by.name)}` : "";
      return `<li class="nfh-rt-row is-done" data-enemy="${id}"><span class="nfh-rt-main">${enemyName(retal)} <span class="nfh-rt-muted">retal done${by}</span></span></li>`;
    }
    const left = retal.expires_at - now;
    const hold = state8 === "mine" ? `<span class="nfh-rt-held is-mine">Claimed by you</span>` : state8 === "taken" ? `<span class="nfh-rt-held">Claimed by ${escapeHtml(retal.claimed_by.name || "someone")}</span>` : "";
    const warning = ui.warn && ui.warn.enemyId === retal.enemy_id ? `<div class="nfh-rt-warn" role="alert">${escapeHtml(ui.warn.name || "Someone")} has claimed this retal.
          <a class="nfh-cw-btn" href="${attackUrl(retal.enemy_id)}" data-action="attack-anyway" data-enemy="${id}">Attack anyway</a>
          <button type="button" class="nfh-cw-btn" data-action="dismiss" data-enemy="${id}">Cancel</button></div>` : "";
    return `<li class="nfh-rt-row is-${state8}${left <= 60 ? " is-ending" : ""}" data-enemy="${id}">
    <span class="nfh-rt-main">${enemyName(retal)} ${victims(retal)}</span>
    <span class="nfh-rt-left" title="Time left to retaliate">${formatLeft(left)}</span>
    ${hold}
    ${buttons(retal, state8, ui)}
    ${warning}
  </li>`;
  }
  function renderHead(retals, now, prefs4, ui = {}) {
    const open = prefs4.show ? visibleRetals(retals, now).filter((retal) => !retal.done_at).length : 0;
    const summary = !prefs4.show ? "off" : open ? `${open} open` : "none open";
    return `<div class="nfh-rt-head">
    <span><span class="nfh-rt-title">Retals</span> <span class="nfh-rt-muted">${summary}</span></span>
    <button type="button" class="nfh-cw-chip${ui.settingsOpen ? " is-armed" : ""}" data-action="settings" aria-expanded="${ui.settingsOpen ? "true" : "false"}">Settings</button>
  </div>`;
  }
  function renderList(retals, now, ui = {}) {
    const shown2 = visibleRetals(retals, now);
    const error = ui.error ? `<div class="nfh-rt-error">${escapeHtml(ui.error)}</div>` : "";
    if (!shown2.length) return error;
    return `<ul class="nfh-rt-list">${shown2.map((retal) => row(retal, now, ui)).join("")}</ul>${error}`;
  }
  var MIN_CHOICES = [0, 15, 30, 60, 90, 120, MAX_MIN_SECONDS];
  function check(pref, on, label, title = "", disabled = false) {
    return `<label${title ? ` title="${escapeHtml(title)}"` : ""}><input type="checkbox" data-pref="${pref}"${on ? " checked" : ""}${disabled ? " disabled" : ""}> <span>${label}</span></label>`;
  }
  function renderSettings2(prefs4, desktop) {
    const off = !prefs4.show;
    const quiet = off || !prefs4.notify;
    const minutes = MIN_CHOICES.map(
      (seconds) => `<option value="${seconds}"${seconds === prefs4.minSeconds ? " selected" : ""}>${seconds ? formatLeft(seconds) : "any"}</option>`
    ).join("");
    const desktopRow = desktop === "unsupported" ? "" : `<div class="nfh-cw-settings-row">${check("desktop", prefs4.desktop && desktop === "granted", "Desktop notification", "Also show a notification outside the page", quiet || desktop === "denied")}${desktop === "denied" ? ` <span class="nfh-rt-muted">Blocked by the browser for torn.com</span>` : ""}</div>`;
    return `<div class="nfh-cw-settings nfh-rt-settings">
    <div class="nfh-cw-settings-row">${check("show", prefs4.show, "Show retals", "List who can be hit back here, and pass on what your page sees to nuke.family")}</div>
    <div class="nfh-cw-settings-row">${check("notify", prefs4.notify, "Notify me of new retals", "A short notice on the page, once per retal", off)}
      <label>with at least <select data-pref="minSeconds"${quiet ? " disabled" : ""}>${minutes}</select> left</label></div>
    <div class="nfh-cw-settings-row">${check("sound", prefs4.sound, "Sound", "One short chime with the notice", quiet)}
      <input type="range" min="0.05" max="1" step="0.05" value="${prefs4.volume}" data-pref="volume" aria-label="Volume"${quiet || !prefs4.sound ? " disabled" : ""}>
      <button type="button" class="nfh-cw-btn" data-action="test-sound"${quiet || !prefs4.sound ? " disabled" : ""}>Test</button></div>
    ${desktopRow}
    <div class="nfh-cw-settings-row"><label>Notice position <select data-pref="position"${quiet ? " disabled" : ""}>${Object.entries(POSITIONS).map(([key, label]) => `<option value="${key}"${key === prefs4.position ? " selected" : ""}>${label}</option>`).join("")}</select></label></div>
  </div>`;
  }

  // src/features/retals/index.js
  var ROOT_ID2 = "nfh-retals";
  var ANCHOR_SELECTOR3 = ".chain-attacks-list.recent-attacks";
  var POLL_OPEN_MS = 5 * 1e3;
  var POLL_CLOSED_MS = 10 * 1e3;
  var ERROR_MS = 6e3;
  var state7 = {
    retals: [],
    offset: 0,
    // server clock minus ours, in seconds
    lastAnswerAt: 0,
    polling: false,
    refused: false,
    // not in a Nuke faction, or a site without retals: stop asking
    ui: { busy: null, warn: null, error: null, settingsOpen: false },
    errorUntil: 0
  };
  var sourcesSeen = /* @__PURE__ */ new Set();
  var sending = false;
  var queued = false;
  var latestFeed = null;
  var root2 = null;
  var regions2 = null;
  var rendered = {};
  var ticker3 = null;
  var serverNow = () => Math.floor(Date.now() / 1e3) + state7.offset;
  function take(answer) {
    if (!answer || !Array.isArray(answer.retals)) return;
    state7.retals = answer.retals;
    if (answer.server_now) state7.offset = answer.server_now - Math.floor(Date.now() / 1e3);
    state7.lastAnswerAt = Date.now();
    forgetTags(state7.retals);
    if (getPrefs3().show) announce(state7.retals, serverNow(), attack);
    render6();
  }
  function isRefusal(error) {
    return error instanceof ApiError && (error.status === 403 || error.status === 404 && !(error.body && error.body.retals));
  }
  function showError(text) {
    state7.ui.error = text;
    state7.errorUntil = Date.now() + ERROR_MS;
    render6();
  }
  function unmount() {
    if (root2) root2.remove();
    root2 = null;
    regions2 = null;
    rendered = {};
  }
  function stop3() {
    state7.refused = true;
    if (ticker3) clearInterval(ticker3);
    ticker3 = null;
    unmount();
  }
  function onFeed(feed, source, keys) {
    if (!isOwnFactionMainTab() || state7.refused) return;
    if (!sourcesSeen.has(source)) {
      sourcesSeen.add(source);
      LogInfo(`[retals] first chain feed from ${source}`, { answer_keys: keys, sample: feed.recentAttacks[0] });
    }
    const stealthed = feed.recentAttacks.find((attack2) => Number(attack2.stealthAttack) !== 0);
    if (stealthed && !sourcesSeen.has("stealth")) {
      sourcesSeen.add("stealth");
      LogInfo("[retals] a stealthed attack as Torn gives it", stealthed, feed.users[stealthed.attackerID] || null);
    }
    start();
    if (!getPrefs3().show) return;
    latestFeed = feed;
    flush();
  }
  async function flush() {
    if (sending) {
      queued = true;
      return;
    }
    const feed = latestFeed;
    if (!feed || !getApiToken()) return;
    const factionId = feedFactionId(feed);
    if (!factionId) {
      LogInfo("[retals] could not tell the faction from the feed", feed);
      return;
    }
    const attacks = attacksToReport(feed, factionId, sentIds(), Math.floor(Date.now() / 1e3));
    if (!attacks.length) return;
    LogInfo(`[retals] reporting for faction ${factionId}`, attacks);
    sending = true;
    try {
      take(await report(factionId, attacks));
      markSent(attacks);
    } catch (error) {
      if (isRefusal(error)) stop3();
      LogInfo("[retals] report failed", error.status ?? error.kind, error.body ?? error.message);
    } finally {
      sending = false;
      if (queued) {
        queued = false;
        flush();
      }
    }
  }
  function setRegion2(name, html) {
    if (rendered[name] === html) return false;
    rendered[name] = html;
    regions2[name].innerHTML = html;
    regions2[name].hidden = html === "";
    return true;
  }
  function render6() {
    if (!root2) return;
    if (state7.ui.error && Date.now() > state7.errorUntil) state7.ui.error = null;
    const prefs4 = getPrefs3();
    const now = serverNow();
    setRegion2("head", renderHead(state7.retals, now, prefs4, state7.ui));
    setRegion2("settings", state7.ui.settingsOpen ? renderSettings2(prefs4, desktopPermission()) : "");
    if (setRegion2("list", prefs4.show ? renderList(state7.retals, now, state7.ui) : "")) applyTags(regions2.list);
  }
  function mount3() {
    const anchor = document.querySelector(ANCHOR_SELECTOR3);
    if (!anchor) {
      unmount();
      return false;
    }
    if (!root2 || !root2.isConnected || root2.previousElementSibling !== anchor) {
      unmount();
      root2 = document.createElement("div");
      root2.id = ROOT_ID2;
      root2.className = "nfh-cw nfh-rt";
      regions2 = {};
      for (const name of ["head", "settings", "list"]) {
        regions2[name] = document.createElement("div");
        regions2[name].dataset.region = name;
        root2.appendChild(regions2[name]);
      }
      root2.addEventListener("click", onClick5);
      root2.addEventListener("change", onChange3);
      root2.addEventListener("input", onChange3);
      anchor.insertAdjacentElement("afterend", root2);
    }
    render6();
    return true;
  }
  function start() {
    if (state7.refused || !getApiToken() || !isOwnFactionMainTab()) return;
    mount3();
    if (!ticker3) ticker3 = setInterval(tick3, 1e3);
  }
  function tick3() {
    if (state7.refused || !isOwnFactionMainTab()) {
      clearInterval(ticker3);
      ticker3 = null;
      unmount();
      return;
    }
    const open = mount3();
    if (open) captureTags(state7.retals);
    const every = open ? POLL_OPEN_MS : POLL_CLOSED_MS;
    if (getPrefs3().show && !document.hidden && !state7.polling && Date.now() - state7.lastAnswerAt >= every) poll3();
  }
  async function poll3() {
    state7.polling = true;
    try {
      take(await fetchRetals());
    } catch (error) {
      if (isRefusal(error)) stop3();
      state7.lastAnswerAt = Date.now();
    } finally {
      state7.polling = false;
    }
  }
  function find(enemyId) {
    return state7.retals.find((retal) => retal.enemy_id === enemyId);
  }
  async function changeClaim(enemyId, change) {
    state7.ui.busy = enemyId;
    render6();
    try {
      take(await change(enemyId));
      return { ok: true };
    } catch (error) {
      if (error instanceof ApiError && error.body && error.body.retals) take(error.body);
      if (error instanceof ApiError && error.status === 409) return { ok: false, takenBy: error.body.claimed_by };
      if (error instanceof ApiError && error.status === 404) return { ok: false, gone: true };
      if (isRefusal(error)) stop3();
      return { ok: false, failed: true };
    } finally {
      state7.ui.busy = null;
      render6();
    }
  }
  function openAttack(enemyId, tab = null) {
    const url = attackUrl(enemyId);
    if (isPda) {
      window.location.href = url;
      return;
    }
    if (tab) tab.location.href = url;
    else if (!window.open(url, "_blank")) window.location.href = url;
  }
  function openBlankTab() {
    if (isPda) return null;
    try {
      return window.open("", "_blank");
    } catch (e) {
      return null;
    }
  }
  async function attack(enemyId) {
    const retal = find(enemyId);
    const now = serverNow();
    const current = retal ? retalState(retal, now) : "free";
    if (current === "taken") {
      state7.ui.warn = { enemyId, name: retal.claimed_by.name };
      render6();
      return;
    }
    if (current === "mine" || current === "done") {
      openAttack(enemyId);
      if (current === "mine") changeClaim(enemyId, claimRetal);
      return;
    }
    const tab = openBlankTab();
    const result = await changeClaim(enemyId, claimRetal);
    if (result.takenBy) {
      if (tab) tab.close();
      state7.ui.warn = { enemyId, name: result.takenBy.name };
      render6();
      return;
    }
    if (result.failed) showError("Could not claim it on nuke.family; attacking anyway.");
    openAttack(enemyId, tab);
  }
  function onClick5(event) {
    const target = event.target.closest("[data-action]");
    if (!target || !root2.contains(target)) return;
    const enemyId = Number(target.dataset.enemy);
    const action = target.dataset.action;
    if (target.tagName === "A" && (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey)) return;
    event.preventDefault();
    if (action === "claim") {
      changeClaim(enemyId, claimRetal).then((result) => {
        if (result.takenBy) {
          state7.ui.warn = { enemyId, name: result.takenBy.name };
          render6();
        } else if (result.failed) showError("Could not reach nuke.family to claim it.");
      });
    } else if (action === "unclaim") {
      changeClaim(enemyId, unclaimRetal).then((result) => {
        if (result.failed) showError("Could not reach nuke.family to unclaim it.");
      });
    } else if (action === "attack") {
      attack(enemyId);
    } else if (action === "attack-anyway") {
      state7.ui.warn = null;
      render6();
      openAttack(enemyId);
    } else if (action === "dismiss") {
      state7.ui.warn = null;
      render6();
    } else if (action === "settings") {
      state7.ui.settingsOpen = !state7.ui.settingsOpen;
      render6();
    } else if (action === "test-sound") {
      chime(getPrefs3().volume);
    }
  }
  async function onChange3(event) {
    const input = event.target.closest("[data-pref]");
    if (!input || !root2 || !root2.contains(input)) return;
    const pref = input.dataset.pref;
    if (event.type === "input" && pref !== "volume") return;
    if (input.type === "checkbox") {
      if (pref === "desktop" && input.checked) {
        const answer = await askDesktopPermission();
        setPrefs3({ desktop: answer === "granted" });
      } else {
        setPrefs3({ [pref]: input.checked });
      }
    } else if (pref === "position") {
      setPrefs3({ position: input.value });
      previewPosition();
    } else {
      setPrefs3({ [pref]: Number(input.value) });
    }
    if (pref === "show" && input.checked) state7.lastAnswerAt = 0;
    if (pref !== "volume") render6();
  }
  var retals_default = {
    name: "retals",
    pages: [PageType.Faction],
    init() {
      if (!isOwnFactionMainTab() || state7.refused) return;
      startCapture(onFeed);
      start();
    }
  };

  // src/features/shitlist/form.js
  function showShitlistWarningDialogue(onConfirm) {
    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
    overlay.style.zIndex = "10000";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    const dialogue = document.createElement("div");
    dialogue.style.backgroundColor = "#2a2a2a";
    dialogue.style.border = "2px solid #444";
    dialogue.style.borderRadius = "8px";
    dialogue.style.padding = "25px";
    dialogue.style.maxWidth = "500px";
    dialogue.style.color = "#ddd";
    dialogue.style.fontFamily = "Arial, sans-serif";
    dialogue.style.boxShadow = "0 4px 20px rgba(0, 0, 0, 0.5)";
    const title = document.createElement("h3");
    title.textContent = "\u26A0\uFE0F Shitlist Submission Warning";
    title.style.color = "#ff6b6b";
    title.style.marginTop = "0";
    title.style.marginBottom = "15px";
    title.style.fontSize = "18px";
    const content = document.createElement("div");
    content.innerHTML = `
      <p><strong>Please ensure you provide a detailed explanation:</strong></p>
      <ul style="margin-left: 20px; line-height: 1.6; list-style-type: disc !important; padding-left: 20px;">
        <li style="display: list-item !important; list-style-type: disc !important; margin-bottom: 8px;">All shitlist entries require a clear, detailed reason</li>
        <li style="display: list-item !important; list-style-type: disc !important; margin-bottom: 8px;"><strong>For "buy mugging" reports:</strong> You MUST include a log showing both the buy transaction AND the attack entry, or your report will be rejected</li>
        <li style="display: list-item !important; list-style-type: disc !important; margin-bottom: 8px;">Vague or incomplete reasons will result in rejection</li>
        <li style="display: list-item !important; list-style-type: disc !important; margin-bottom: 8px;">Review your submission carefully before proceeding</li>
      </ul>
    `;
    content.style.marginBottom = "20px";
    content.style.lineHeight = "1.5";
    const buttonContainer = document.createElement("div");
    buttonContainer.style.display = "flex";
    buttonContainer.style.gap = "10px";
    buttonContainer.style.justifyContent = "flex-end";
    const proceedBtn = document.createElement("button");
    proceedBtn.textContent = "I Understand - Proceed";
    proceedBtn.classList.add("torn-btn");
    proceedBtn.style.backgroundColor = "#28a745";
    proceedBtn.style.border = "none";
    proceedBtn.style.borderRadius = "4px";
    proceedBtn.style.color = "white";
    proceedBtn.style.cursor = "pointer";
    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "Cancel";
    cancelBtn.classList.add("torn-btn");
    cancelBtn.style.backgroundColor = "#6c757d";
    cancelBtn.style.border = "none";
    cancelBtn.style.borderRadius = "4px";
    cancelBtn.style.color = "white";
    cancelBtn.style.cursor = "pointer";
    proceedBtn.addEventListener("click", function() {
      document.body.removeChild(overlay);
      onConfirm();
    });
    cancelBtn.addEventListener("click", function() {
      document.body.removeChild(overlay);
    });
    overlay.addEventListener("click", function(e) {
      if (e.target === overlay) {
        document.body.removeChild(overlay);
      }
    });
    buttonContainer.appendChild(cancelBtn);
    buttonContainer.appendChild(proceedBtn);
    dialogue.appendChild(title);
    dialogue.appendChild(content);
    dialogue.appendChild(buttonContainer);
    overlay.appendChild(dialogue);
    document.body.appendChild(overlay);
  }
  function setShitListCategoryDescription(categoryId) {
    const category = categoriesStore.data[categoryId];
    LogInfo(category);
    const description = document.getElementById("shitlist-category-description");
    description.innerText = category ? category.description : "";
  }
  function buildHiddenShitListAddContainer() {
    const shitListAddContainer = document.createElement("div");
    shitListAddContainer.id = "shitlist-add-container";
    shitListAddContainer.classList.add(
      "nfh-shitlist-add-container",
      "cont",
      "bottom-round"
    );
    const shitListAddForm = document.createElement("form");
    shitListAddForm.classList.add("nfh-shitlist-add-form");
    const reason = document.createElement("textarea");
    reason.id = "shitlist-category-reason";
    reason.setAttribute("placeholder", "Reason/Explanation");
    reason.classList.add("nfh-shitlist-add-reason");
    reason.style.marginBottom = "10px";
    reason.style.width = "100%";
    reason.style.height = "65px";
    reason.style.padding = "8px";
    reason.style.resize = "vertical";
    reason.style.borderRadius = "3px";
    reason.style.border = "1px solid #444";
    reason.style.backgroundColor = "#2a2a2a";
    reason.style.color = "#e0e0e0";
    reason.style.boxSizing = "border-box";
    const select = document.createElement("select");
    select.id = "shitlist-category-select";
    select.classList.add("nfh-shitlist-add-select");
    select.style.marginBottom = "10px";
    const option = document.createElement("option");
    option.value = "";
    option.text = "Select a category";
    select.appendChild(option);
    const description = document.createElement("textarea");
    description.setAttribute("readonly", true);
    description.id = "shitlist-category-description";
    description.classList.add("nfh-shitlist-add-description");
    description.style.marginBottom = "10px";
    description.style.width = "100%";
    description.style.height = "50px";
    const error = document.createElement("p");
    error.id = "shitlist-add-error";
    error.classList.add("nfh-shitlist-add-error");
    error.style.color = "red";
    const submit = document.createElement("button");
    submit.setAttribute("type", "button");
    submit.id = "shitlist-add-submit";
    submit.classList.add("nfh-btn", "nfh-shitlist-add-submit");
    submit.innerText = "Submit to Shitlist";
    shitListAddForm.appendChild(reason);
    shitListAddForm.appendChild(select);
    shitListAddForm.appendChild(description);
    shitListAddForm.appendChild(error);
    shitListAddForm.appendChild(submit);
    shitListAddContainer.appendChild(shitListAddForm);
    shitListAddContainer.style.display = "none";
    return shitListAddContainer;
  }
  function activateShitListAddForm() {
    const select = document.getElementById("shitlist-category-select");
    select.innerHTML = "";
    const categories = categoriesStore.data;
    for (const key in categories) {
      const category = categories[key];
      if (category.isFactionBan) {
        continue;
      }
      const option = document.createElement("option");
      option.value = category.entryId;
      option.text = category.name;
      select.appendChild(option);
    }
    setShitListCategoryDescription(select.value);
    select.addEventListener("change", function() {
      setShitListCategoryDescription(this.value);
    });
    const submit = document.getElementById("shitlist-add-submit");
    submit.addEventListener("click", () => submitShitlistEntry(submit));
    document.getElementById("shitlist-add-container").style.display = "block";
  }
  async function submitShitlistEntry(submit) {
    if (submit.disabled) {
      return;
    }
    submit.disabled = true;
    submit.innerText = "Submitting...";
    const resetButton = () => {
      submit.disabled = false;
      submit.innerText = "Submit to Shitlist";
    };
    const selectedCategoryId = document.getElementById(
      "shitlist-category-select"
    ).value;
    const reason = document.getElementById("shitlist-category-reason").value;
    const errorElm = document.getElementById("shitlist-add-error");
    if (!selectedCategoryId || !reason || reason.trim() === "") {
      errorElm.innerText = "Please ensure you select a category and provide a reason/explanation for the shitlisting";
      resetButton();
      return;
    }
    errorElm.innerText = "";
    try {
      await api("/shit-lists", {
        method: "POST",
        data: {
          playerName: getPlayerName(),
          playerId: getPlayerId(),
          reporterPlayerName: getUserscriptUsersPlayerName(),
          reporterPlayerId: getUserscriptUsersPlayerId(),
          shitListCategoryId: selectedCategoryId,
          reason
        }
      });
      LogInfo("Shitlist entry successfully submitted.");
      document.getElementById("shitlist-add-container").style.display = "none";
      document.getElementById("shitlist-add-success").style.display = "block";
      const addButton = document.querySelector(".nfh-add-to-shitlist");
      if (addButton) {
        addButton.style.display = "none";
      }
      shitlistStore.refresh();
    } catch (error) {
      const serverMessage = error && error.body && error.body.message || "";
      LogInfo("Failed to submit shitlist entry: " + serverMessage);
      errorElm.innerText = "There was an error submitting your shitlisting. Please contact Fogest for help if this persists." + serverMessage;
      resetButton();
    }
  }

  // src/features/shitlist/render.js
  function buildShitListEntry(entry) {
    const li = document.createElement("li");
    const extraShitListConditions = entry.isFactionBan ? " [Faction Ban]" : "";
    const approvalStatus = !entry.isApproved && !entry.isFactionBan ? " [Pending Approval]" : "";
    let lastUpdatedHTML = "";
    if (entry.updatedAt) {
      const updatedAtDate = new Date(entry.updatedAt);
      const tooltipDate = formatDateTime(updatedAtDate);
      const relativeDate = timeSince(updatedAtDate);
      lastUpdatedHTML = `
      <div>
        <span class="nfh-list-key">Updated:</span>
        <span class="nfh-list-value relative-date" title="${escapeHtml(tooltipDate)}">${escapeHtml(relativeDate)}</span>
      </div>`;
    }
    li.innerHTML = `
        <div><span class="nfh-list-key">Reason:</span><span class="nfh-list-value">${escapeHtml(entry.reason)}</span></div>
        <div><span class="nfh-list-key">Category:</span><span class="nfh-list-value">${escapeHtml(entry.shitListCategory.name)}${extraShitListConditions}${approvalStatus}</span></div>
        ${lastUpdatedHTML}
    `;
    return li;
  }
  function renderShitList() {
    const shitListProfileList = document.getElementById(
      "nfh-shitlist-profile-list"
    );
    const profileContainer = document.getElementById(
      "nfh-shitlist-entry-profile-container"
    );
    const btnAddToShitList = document.getElementById("nfh-add-to-shitlist");
    if (!shitListProfileList || !profileContainer) {
      return;
    }
    const entryContainer = profileContainer.closest(
      ".nfh-shitlist-entry-container"
    );
    const playerId = getPlayerId();
    const factionId = getFactionId();
    LogInfo(`Rendering shitlist for player ${playerId}, faction ${factionId}`);
    shitListProfileList.innerHTML = "";
    profileContainer.querySelectorAll(".nfh-hidden-count").forEach((el) => el.remove());
    profileContainer.classList.remove(
      "nfh-shitlist-entry-profile-container-faction-ban",
      "nfh-shitlist-entry-profile-container-profile-ban",
      "nfh-shitlist-entry-profile-container-friendly"
    );
    entryContainer?.classList.remove(
      "nfh-shitlist-entry-container-friendly",
      "nfh-shitlist-entry-container-entry-present"
    );
    let totalEntries = 0;
    let visibleEntries = 0;
    const renderGroup = (prefix, onVisible) => {
      const entries = shitlistStore.data;
      for (const key in entries) {
        if (!key.startsWith(prefix)) continue;
        const entry = entries[key];
        totalEntries++;
        if (!SettingsManager.isCategoryVisible(
          entry.shitListCategoryId,
          entry.isFactionBan
        )) {
          continue;
        }
        shitListProfileList.appendChild(buildShitListEntry(entry));
        visibleEntries++;
        onVisible(entry);
      }
    };
    if (factionId) {
      renderGroup("f" + factionId + "#", (entry) => {
        profileContainer.classList.add(
          "nfh-shitlist-entry-profile-container-faction-ban"
        );
        if (entry.shitListCategory && entry.shitListCategory.is_friendly) {
          profileContainer.classList.add(
            "nfh-shitlist-entry-profile-container-friendly"
          );
          entryContainer?.classList.add("nfh-shitlist-entry-container-friendly");
        } else {
          entryContainer?.classList.add(
            "nfh-shitlist-entry-container-entry-present"
          );
        }
      });
    }
    if (playerId) {
      renderGroup("p" + playerId + "#", () => {
        profileContainer.classList.add(
          "nfh-shitlist-entry-profile-container-profile-ban"
        );
        entryContainer?.classList.add(
          "nfh-shitlist-entry-container-entry-present"
        );
      });
    }
    if (totalEntries > visibleEntries) {
      const hiddenCount = totalEntries - visibleEntries;
      const hiddenMsg = document.createElement("div");
      hiddenMsg.classList.add("nfh-hidden-count");
      hiddenMsg.textContent = `${hiddenCount} ${hiddenCount === 1 ? "entry" : "entries"} hidden by category settings`;
      profileContainer.appendChild(hiddenMsg);
    }
    if (btnAddToShitList) {
      if (visibleEntries > 0) {
        btnAddToShitList.style.marginTop = "7px";
        btnAddToShitList.innerText = "Add another Shitlist Reason";
      } else {
        btnAddToShitList.innerText = "Add to Shitlist";
      }
    }
  }

  // src/features/shitlist/settings-panel.js
  function createSettingsPanel() {
    const panel = document.createElement("div");
    panel.classList.add("nfh-settings-panel");
    panel.style.display = "none";
    const title = document.createElement("div");
    title.classList.add("nfh-settings-title");
    title.textContent = "Shitlist Settings";
    const categoryList = document.createElement("div");
    categoryList.classList.add("nfh-category-list");
    const categories = categoriesStore.data;
    for (const categoryId in categories) {
      const category = categories[categoryId];
      const categoryItem = document.createElement("div");
      categoryItem.classList.add("nfh-category-item");
      if (category.isFactionBan) {
        categoryItem.classList.add("faction-locked");
      }
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = SettingsManager.isCategoryVisible(
        categoryId,
        category.isFactionBan
      );
      checkbox.disabled = category.isFactionBan;
      checkbox.dataset.categoryId = categoryId;
      checkbox.addEventListener("change", function() {
        SettingsManager.toggleCategory(categoryId, this.checked);
        renderShitList();
      });
      const label = document.createElement("span");
      label.textContent = category.name;
      categoryItem.appendChild(checkbox);
      categoryItem.appendChild(label);
      categoryList.appendChild(categoryItem);
    }
    const reputationSection = buildReputationSection(panel);
    const contractSection = buildContractSection(panel);
    const closeButton = document.createElement("button");
    closeButton.classList.add("nfh-close-settings");
    closeButton.textContent = "Close";
    closeButton.addEventListener("click", function() {
      panel.style.display = "none";
    });
    panel.appendChild(title);
    panel.appendChild(categoryList);
    panel.appendChild(reputationSection);
    panel.appendChild(contractSection);
    panel.appendChild(closeButton);
    return panel;
  }
  var REPUTATION_LOCKED_REASON = "You can check recruiting scores, so this always shows: the Check Recruiting Score button is in this box.";
  function buildReputationSection(panel) {
    return buildLockableSection(panel, {
      title: "Reputation Settings",
      label: "Show Reputation box on profiles",
      itemClass: "nfh-reputation-setting",
      lockedReason: REPUTATION_LOCKED_REASON,
      isLocked: SettingsManager.isReputationLocked,
      isVisible: SettingsManager.isReputationVisible,
      setVisible: SettingsManager.setReputationVisible,
      apply: applyReputationSetting
    });
  }
  var CONTRACT_LOCKED_REASON = "Your faction revives, so this always shows: it tells you whether a revive on a player is paid.";
  function buildContractSection(panel) {
    return buildLockableSection(panel, {
      title: "Contract Settings",
      label: "Show active contracts on profiles and in hospital",
      itemClass: "nfh-contract-setting",
      lockedReason: CONTRACT_LOCKED_REASON,
      isLocked: SettingsManager.isActiveContractLocked,
      isVisible: SettingsManager.isActiveContractVisible,
      setVisible: SettingsManager.setActiveContractVisible,
      apply: applyActiveContractSetting
    });
  }
  function buildLockableSection(panel, options) {
    const section2 = document.createElement("div");
    section2.classList.add("nfh-category-list");
    section2.style.marginTop = "10px";
    section2.style.borderTop = "1px solid var(--nfh-border)";
    section2.style.paddingTop = "8px";
    const sectionTitle = document.createElement("div");
    sectionTitle.classList.add("nfh-settings-title");
    sectionTitle.style.marginBottom = "6px";
    sectionTitle.textContent = options.title;
    const item = document.createElement("label");
    item.classList.add("nfh-category-item", options.itemClass);
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    const label = document.createElement("span");
    label.textContent = options.label;
    const note = document.createElement("div");
    note.classList.add("nfh-setting-note");
    note.textContent = options.lockedReason;
    const sync = () => {
      const locked = options.isLocked();
      checkbox.checked = options.isVisible();
      checkbox.disabled = locked;
      item.classList.toggle("nfh-setting-locked", locked);
      item.title = locked ? options.lockedReason : "";
      note.style.display = locked ? "" : "none";
    };
    sync();
    panel.addEventListener("nfh-settings-open", sync);
    checkbox.addEventListener("change", function() {
      options.setVisible(this.checked);
      options.apply();
    });
    item.appendChild(checkbox);
    item.appendChild(label);
    section2.appendChild(sectionTitle);
    section2.appendChild(item);
    section2.appendChild(note);
    return section2;
  }

  // src/features/shitlist/profile.js
  shitlistStore.subscribe(() => renderShitList());
  var cogSVG = `
      <svg xmlns="http://www.w3.org/2000/svg"
          width="14" height="14"
          viewBox="0 0 24 24"
          fill="currentColor"
          style="vertical-align: middle; margin-right: 4px;">
        <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm0 6a2 2 0 1 1 0-4 2 2 0 0 1 0 4z"/>
        <path d="M21 12a1 1 0 0 1-.74.97l-1.54.47a7.986 7.986 0 0 1-.85 2.05l.64 1.47a1 1 0 0 1-.18 1.11l-1.41 1.41a1 1 0 0 1-1.11.18l-1.47-.64a7.986 7.986 0 0 1-2.05.85l-.47 1.54A1 1 0 0 1 12 21h-2a1 1 0 0 1-.97-.74l-.47-1.54a7.986 7.986 0 0 1-2.05-.85l-1.47.64a1 1 0 0 1-1.11-.18L2.52 16.92a1 1 0 0 1-.18-1.11l.64-1.47a7.986 7.986 0 0 1-.85-2.05L.59 11.82A1 1 0 0 1 0 11V9a1 1 0 0 1 .74-.97l1.54-.47a7.986 7.986 0 0 1 .85-2.05l-.64-1.47a1 1 0 0 1 .18-1.11L4.08 1.52a1 1 0 0 1 1.11-.18l1.47.64a7.986 7.986 0 0 1 2.05-.85L9.18.59A1 1 0 0 1 10 0h2a1 1 0 0 1 .97.74l.47 1.54c.71.2 1.39.51 2.05.85l1.47-.64a1 1 0 0 1 1.11.18l1.41 1.41a1 1 0 0 1 .18 1.11l-.64 1.47c.34.66.65 1.34.85 2.05l1.54.47A1 1 0 0 1 21 9v3zm-2.32-1.5l-1.42-.44a1 1 0 0 1-.68-.82 5.977 5.977 0 0 0-1.19-2.88 1 1 0 0 1-.07-1.06l.59-1.35-1-1-.35.59a1 1 0 0 1-1.06.07 5.977 5.977 0 0 0-2.88-1.19 1 1 0 0 1-.82-.68L10.5 1.32h-1l-.44 1.42a1 1 0 0 1-.82.68 5.977 5.977 0 0 0-2.88 1.19 1 1 0 0 1-1.06-.07L3.25 4.19l-1 1 .59 1.35a1 1 0 0 1-.07 1.06 5.977 5.977 0 0 0-1.19 2.88 1 1 0 0 1-.68.82L1.32 11.5v1l1.42.44a1 1 0 0 1 .68.82 5.977 5.977 0 0 0 1.19 2.88 1 1 0 0 1 .07 1.06l-.59 1.35 1 1 1.35-.59a1 1 0 0 1 1.06.07 5.977 5.977 0 0 0 2.88 1.19 1 1 0 0 1 .82.68l.44 1.42h1l.44-1.42a1 1 0 0 1 .82-.68 5.977 5.977 0 0 0 2.88-1.19 1 1 0 0 1 1.06.07l1.35.59 1-1-.59-1.35a1 1 0 0 1 .07-1.06 5.977 5.977 0 0 0 1.19-2.88 1 1 0 0 1 .68-.82l1.42-.44v-1z"/>
      </svg>
      `;
  function init7() {
    if (document.querySelector(".nfh-shitlist-profile")) return;
    LogInfo("Profile page detected");
    waitForElm(".profile-status.m-top10").then((injectPoint) => {
      if (document.querySelector(".nfh-shitlist-profile")) return;
      const shitListProfileDiv = document.createElement("div");
      shitListProfileDiv.classList.add(
        "nfh-shitlist-profile",
        "nfh-section",
        "m-top10"
      );
      shitListProfileDiv.appendChild(document.createElement("div"));
      const headerDiv = document.createElement("div");
      headerDiv.classList.add("nfh-shitlist-header");
      const shitListProfileTitle = document.createElement("p");
      shitListProfileTitle.innerText = "Nuke Family Shitlist";
      shitListProfileTitle.classList.add(
        "nfh-shitlist-profile-title",
        "nfh-section-title",
        "title-black",
        "top-round"
      );
      const settingsCog = document.createElement("span");
      settingsCog.innerHTML = cogSVG;
      settingsCog.classList.add("nfh-settings-cog");
      settingsCog.title = "Shitlist Settings";
      const settingsPanel = createSettingsPanel();
      settingsCog.addEventListener("click", function() {
        if (settingsPanel.style.display === "none") {
          settingsPanel.style.display = "block";
          settingsPanel.dispatchEvent(new Event("nfh-settings-open"));
        } else {
          settingsPanel.style.display = "none";
        }
      });
      headerDiv.appendChild(shitListProfileTitle);
      headerDiv.appendChild(settingsCog);
      headerDiv.appendChild(settingsPanel);
      const shitListEntryContainer = buildShitListEntryContainer();
      shitListProfileDiv.appendChild(headerDiv);
      shitListProfileDiv.appendChild(shitListEntryContainer);
      injectPoint.parentNode.append(shitListProfileDiv);
      renderShitList();
      waitForElm(
        ".basic-information .info-table a[href^='/factions.php?step=profile&ID=']"
      ).then(() => renderShitList());
    });
  }
  function buildShitListEntryContainer() {
    const shitListEntryContainer = document.createElement("div");
    shitListEntryContainer.classList.add(
      "nfh-shitlist-entry-container",
      "nfh-section-container",
      "cont",
      "bottom-round"
    );
    const shitListEntryProfileContainer = document.createElement("div");
    shitListEntryProfileContainer.id = "nfh-shitlist-entry-profile-container";
    shitListEntryProfileContainer.classList.add(
      "nfh-shitlist-entry-profile-container",
      "profile-container"
    );
    const shitListProfileList = document.createElement("ul");
    shitListProfileList.id = "nfh-shitlist-profile-list";
    shitListProfileList.classList.add(
      "nfh-shitlist-profile-list",
      "cont",
      "bottom-round"
    );
    const btnAddToShitList = document.createElement("button");
    btnAddToShitList.setAttribute("type", "submit");
    btnAddToShitList.id = "nfh-add-to-shitlist";
    btnAddToShitList.classList.add("torn-btn", "nfh-add-to-shitlist");
    btnAddToShitList.innerText = "Add to Shitlist";
    const shitListAddShitListContainer = buildHiddenShitListAddContainer();
    btnAddToShitList.addEventListener("click", function() {
      showShitlistWarningDialogue(() => {
        activateShitListAddForm();
        btnAddToShitList.style.display = "none";
      });
    });
    const successMessage = document.createElement("p");
    successMessage.id = "shitlist-add-success";
    successMessage.classList.add("nfh-shitlist-add-success");
    successMessage.style.color = "green";
    successMessage.style.display = "none";
    successMessage.innerText = "Shitlist entry successfully added!";
    shitListEntryProfileContainer.appendChild(shitListProfileList);
    shitListEntryProfileContainer.appendChild(btnAddToShitList);
    shitListEntryProfileContainer.appendChild(successMessage);
    shitListEntryProfileContainer.appendChild(shitListAddShitListContainer);
    shitListEntryContainer.appendChild(shitListEntryProfileContainer);
    return shitListEntryContainer;
  }
  var profile_default = {
    name: "shitlist-profile",
    pages: [PageType.Profile],
    init: init7
  };

  // src/features/token-capture.js
  function initTokenCapture() {
    waitForElm("#token").then((elm) => {
      let token = elm.innerText.trim();
      const observer5 = new MutationObserver(() => {
        const newToken = elm.innerText.trim();
        if (!newToken || newToken === token) return;
        token = newToken;
        setApiToken(newToken);
        const returnUrl = takeTokenReturnUrl();
        if (returnUrl) {
          alert(
            'Nuke Family API token saved! Taking you back to Torn.\n\nIf you need to change it later, use the "Change Nuke Family Key" button on the faction "controls" page.'
          );
          window.location.href = returnUrl;
        } else {
          alert("Nuke Family API token saved. You can now close this tab.");
        }
      });
      observer5.observe(elm, {
        childList: true,
        subtree: true,
        characterData: true
      });
    });
  }

  // src/main.js
  var features = [
    profile_default,
    contracts_default,
    reputation_default,
    oc_fines_default,
    hospital_default,
    faction_buttons_default,
    chain_watch_default,
    retals_default,
    ranked_war_default,
    organized_crimes_default,
    mail_templates_default,
    oc_items_default,
    kick_risk_default,
    stocks_default
  ];
  function dispatchFeatures() {
    for (const feature of features) {
      if (feature.pages.some((page) => IsPage(page))) {
        try {
          feature.init();
        } catch (error) {
          console.error(`[NFH] Feature "${feature.name}" failed:`, error);
        }
      }
    }
  }
  function main() {
    if (IsPage(PageType.NukeFamily3rdParty)) {
      if (hasNativeStorage()) initStorage({ migrate: false }).then(initTokenCapture);
      else initTokenCapture();
      return;
    }
    if (hasNativeStorage()) initStorage().then(start2);
    else start2();
  }
  function start2() {
    addStyle(styles_default);
    LogInfo("Nuke Family Helper Script Loaded");
    checkForUpdates();
    for (const store of [shitlistStore, categoriesStore, contractsStore, ocConfigStore]) {
      store.load();
      registerSyncedStore(store);
    }
    initAuth();
    initConnect();
    dispatchFeatures();
    onNavigate(dispatchFeatures);
    checkCacheUpdates();
  }
  main();
})();
