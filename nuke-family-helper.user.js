// ==UserScript==
// @name         Nuke Assistant
// @namespace    https://nuke.family/
// @version      2.18.1
// @description  Making things easier for the Nuke Family. This application will only function properly if you are a Nuke Member who has a site API key generated from https://nuke.family/user
// @author       Fogest <nuke@jhvisser.com>
// @match        https://www.torn.com/factions.php*
// @match        https://www.torn.com/profiles.php*
// @match        https://www.torn.com/hospitalview.php*
// @match        https://nuke.family/auth/token-generation*
// @icon         data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAAsVBMVEUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAADAgEIBwIJCAILCQMODAQUEQUYFQcaFgcfGgggGwklIAotJgwyKg46MhA8MxBKPxRQRBZgUhthUhthUxt1ZCB9aiOEcCSIdCaQeyihiSyiiS21mjLBpDXFpzbGqDfHqTfIqjjTszrXtzzZuTzlw0DmxEDnxEDpxkHuy0LxzUNZTIHlAAAAD3RSTlMAAh4tMVtig4WRlqvq8v4ZRfBIAAABcElEQVQ4y4VT2ZKCMBBEReTSVhEX8T5BFMVb8/8ftokhJB5b2w9U9VFkMpnRNImSbpiWZRp6SfuGiu0ih2tXPuyy04CChlN+9at1vKFeVf0aVX5Um5Hai+8np470O6fEVxJVIDgQspKBFSGHAMhPKdfhU5/ce8Lv3Sk9+KjzSh0gIQwbEdg8aQI4z/s3MCEcY+6PczpBg/XDRjPLlV2L+a1dTrMmbNpfFyMisGCBRUFHcEuaDsSFsmeBfUFjQNcMIBXCOehHUT84C54ChmYCNyHM+xdCLv254DfA1Cx4xS/DiH2jsBA8WDSggAdUxWJHSPAjVMVkRaoJWuSLYLBrSnRnYTjrqorOGiWxZjWsFYE2ira6wODBAo+BVGz+WAJbfrmtHM1K/twcU3H9qVAcMTBPtI8icGzng1suRo5hWTSQLLlSVYcawVUGrgE+xhrDTAay4avPF6c5ilP6sLc0HjXfF0eunud9X73/l/fP9f8FWPxZz4MGj9YAAAAASUVORK5CYII=
// @run-at       document-end
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_info
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
          notify(text, title, onclick, ondone);
        } else if (typeof args[0] === "string") {
          const [text, title, , onclick] = args;
          notify(text, title, onclick);
        }
        return { remove: () => {
        } };
        function notify(text, title, onclick, ondone) {
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
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 14px;
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
`;

  // src/core/config.js
  var DEBUG = false;
  var DEFAULT_VERSION = "2.18.1";
  var CURRENT_VERSION = typeof GM_info !== "undefined" && GM_info.script && GM_info.script.version ? GM_info.script.version : DEFAULT_VERSION;
  var API_URL = DEBUG ? "http://nuke.test/api" : "https://nuke.family/api";
  var TOKEN_GENERATION_URL = DEBUG ? "http://nuke.test/auth/token-generation" : "https://nuke.family/auth/token-generation";
  var GITHUB_URL = "https://github.com/Fog-Development/nuke-family-helper-script/raw/master/nuke-family-helper.user.js";

  // src/core/storage.js
  var MANAGER_KEYS = ["apiToken", "apiTokenFirstTime", "nfhTokenReturnUrl"];
  var LOCAL_KEYS = [
    "hiddenShitlistCategories",
    "nfhShowReputation",
    "nfhChainWatch",
    "nfhRankedWar",
    "nfhOcStaffPrefs"
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
      const timer = setTimeout(() => reject(new Error("timed out")), ms);
      Promise.resolve(promise).then(
        (value) => {
          clearTimeout(timer);
          resolve(value);
        },
        (error) => {
          clearTimeout(timer);
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
    const report = {
      ...info,
      keys: native ? Object.keys(mirror) : void 0,
      unsaved: info.present ? unsavedKeys() : void 0
    };
    if (native && typeof native.usage === "function") {
      try {
        report.usage = await withTimeout(native.usage(), LOAD_TIMEOUT_MS);
      } catch (e) {
        report.usage = null;
      }
    }
    return report;
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
  }
  function ensureApiToken() {
    if (apiToken) return;
    if (!getValue("apiTokenFirstTime", false)) {
      setValue("apiTokenFirstTime", true);
      const goNow = confirm(
        "No Nuke.Family API key set yet. You need a https://nuke.family account (create one if needed) and a key.\n\nPress OK to go to nuke.family now. Your key will be saved automatically and you'll be brought back to this page."
      );
      if (goNow) {
        setValue(RETURN_URL_KEY, window.location.href);
        window.location.href = TOKEN_GENERATION_URL;
      }
    } else {
      const maybeApiToken = prompt(
        "Please enter your Nuke API key from Fogest's site (https://nuke.family/user)"
      );
      if (maybeApiToken && maybeApiToken.length < 30) {
        alert(
          "That key is too short. Please ensure you are using your Nuke.Family key (around 50 characters), NOT your Torn API key!"
        );
      } else if (maybeApiToken) {
        setApiToken(maybeApiToken);
      }
    }
  }
  function takeTokenReturnUrl() {
    const url = getValue(RETURN_URL_KEY, "");
    if (!url) return null;
    setValue(RETURN_URL_KEY, "");
    return url.startsWith("https://www.torn.com/") ? url : null;
  }
  function promptForNewApiKey() {
    const newKey = prompt(
      "Enter the new Nuke.Family API key (should be ~50 characters)."
    );
    if (!newKey) {
      return null;
    }
    if (newKey.length < 30) {
      alert(
        "That key is too short. Please ensure you are using your Nuke.Family key, NOT your Torn API key!"
      );
      return null;
    }
    setApiToken(newKey);
    return newKey;
  }

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
  async function api(path, { method = "GET", data = void 0 } = {}) {
    const headers = {
      Accept: "application/json",
      Authorization: "Bearer " + getApiToken()
    };
    if (data !== void 0) {
      headers["Content-Type"] = "application/json";
    }
    const response = await request({
      method,
      url: API_URL + path,
      headers,
      data: data !== void 0 ? JSON.stringify(data) : void 0
    });
    return readReply(response, method, path);
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
      const saved = JSON.parse(localStorage.getItem(ROLE_CACHE_KEY) || "null");
      return saved && saved.role || "";
    } catch (e) {
      return "";
    }
  }
  async function refreshUserRole() {
    try {
      const result = await api("/user/get-own-roles");
      localStorage.setItem(
        ROLE_CACHE_KEY,
        JSON.stringify({ role: result["role"], timestamp: Date.now() })
      );
      LogInfo("Updated users role from nuke.family in local storage");
    } catch (error) {
      console.error("Error fetching user role:", error);
    }
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
      const observer2 = new MutationObserver(() => {
        const elm = document.querySelector(selector);
        if (elm) {
          resolve(elm);
          observer2.disconnect();
        }
      });
      observer2.observe(document.body, {
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
    NukeFamily3rdParty: "NukeFamily3rdParty"
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
    [PageType.NukeFamily3rdParty]: TOKEN_GENERATION_URL
  };
  var mapPageAddressFragment = {
    [PageType.FactionControl]: "/tab=controls",
    [PageType.FactionArmouryDrug]: "tab=armoury&start=0&sub=drugs",
    [PageType.FactionControlPayday]: "tab=controls&option=pay-day",
    [PageType.FactionControlApplications]: "tab=controls&option=application",
    [PageType.FactionCrimes]: "tab=crimes"
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
    let pending3 = null;
    try {
      pending3 = JSON.parse(localStorage.getItem("nfhPendingUpdate"));
    } catch (e) {
      pending3 = null;
    }
    if (!pending3 || pending3.version !== githubVersion) {
      localStorage.setItem(
        "nfhPendingUpdate",
        JSON.stringify({ version: githubVersion, firstSeen: now })
      );
      return false;
    }
    return now - pending3.firstSeen >= UPDATE_NOTIFY_GRACE_PERIOD;
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
    const number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    return Math.min(max, Math.max(min, number));
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
    const prefs3 = getPrefs();
    if (!flash) {
      flash = document.createElement("div");
      flash.id = FLASH_ID;
      document.body.appendChild(flash);
    }
    flash.style.backgroundColor = hexToRgba(prefs3.color, prefs3.opacity);
    flash.style.animationDuration = `${PACES[prefs3.pace]}ms`;
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
  function updateAlert({ timer, armed, test = false }) {
    const prefs3 = getPrefs();
    const low = armed && !!timer && timer.active && // An unreadable hit count must not silence the alert.
    (timer.hits === null || timer.hits >= MIN_CHAIN_HITS) && timer.seconds !== null && timer.seconds > 0 && timer.seconds < prefs3.alertSeconds;
    const alerting = low || test;
    setFlashing(alerting);
    if (alerting && prefs3.beep) {
      const now = Date.now();
      if (now - lastBeepAt >= PACES[prefs3.pace] - 100) {
        lastBeepAt = now;
        beep(prefs3.volume);
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
    return (Array.isArray(watches) ? watches : []).filter((watch3) => {
      const end = toMs(watch3.end_time);
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
      return "Your Nuke Family key was rejected. Set a new one on the faction controls tab.";
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
  var pad = (number) => String(number).padStart(2, "0");
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
      const wait = slotStart(myNext) - now;
      if (wait <= SOON_MS) {
        return {
          tone: "attn",
          text: `Your slot starts in ${duration(wait)}`,
          actions: checkInButton(true)
        };
      }
      return {
        tone: "",
        text: `Your next slot: ${slotLabel(slotStart(myNext))} TCT \xB7 in ${duration(wait)}`,
        actions: summary.started ? checkInButton(false) : ""
      };
    }
    if (!summary.started) {
      const start2 = Date.parse(board.start_time);
      return {
        tone: "",
        text: `Starts ${slotLabel(start2)} TCT \xB7 in ${duration(start2 - now)}`,
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
  function alertChip(prefs3, armed) {
    let label = `Alert ${formatAlertTime(prefs3.alertSeconds)}`;
    let title = `Flashes the page when an active chain of at least ${MIN_CHAIN_HITS} hits drops below ${formatAlertTime(prefs3.alertSeconds)}. Click for settings.`;
    if (prefs3.alertMode === AlertMode.Off) {
      label = "Alert off";
      title = "Chain timer alert is off. Click for settings.";
    } else if (!armed) {
      title = prefs3.alertMode === AlertMode.Watch ? "Chain timer alert is waiting: your faction has no chain watch set up on nuke.family. Click for settings." : "Chain timer alert is waiting: you are not checked in to a chain watch. Click for settings.";
    }
    return `<button type="button" class="nfh-cw-chip${armed ? " is-armed" : ""}" data-action="settings" title="${escapeHtml(title)}">${escapeHtml(label)}</button>`;
  }
  function renderBar({ board, watches, prefs: prefs3, armed, chainActive, flash, busy, now }) {
    const summary = board ? summarize(board, now) : null;
    const state3 = summary ? barState(board, summary, now) : { tone: "", text: '<span class="nfh-cw-muted">No chain watch scheduled</span>', actions: "" };
    if (summary && summary.started && !summary.myCheckin && chainActive && armed && state3.tone !== "attn") {
      state3.text = '<span class="nfh-cw-need" title="Check in so your time watching is recorded on the chain watch sheet">Not checked in</span> \xB7 ' + state3.text;
      state3.actions = button("checkin", "Check in");
    }
    const title = board && board.title ? `<span class="nfh-cw-title">${escapeHtml(board.title)}</span>` : "";
    const status = flash ? `<span class="${flash.error ? "nfh-cw-error" : "nfh-cw-ok"}">${escapeHtml(flash.text)}</span>` : state3.text;
    const expandable = !!board;
    const expanded = expandable && prefs3.expanded;
    const picker = watches.length > 1 ? `<select class="nfh-cw-picker" data-role="watch-picker" title="Chain watch">${watches.map(
      (watch3) => `<option value="${escapeHtml(watch3.id)}"${board && board.id === watch3.id ? " selected" : ""}>${escapeHtml(watch3.title || `Chain watch #${watch3.id}`)}</option>`
    ).join("")}</select>` : title;
    return {
      tone: state3.tone,
      html: `<button type="button" class="nfh-cw-toggle" data-action="toggle"${expandable ? "" : " disabled"} aria-expanded="${expanded}"><span class="nfh-cw-caret">${expandable ? expanded ? "\u25BE" : "\u25B8" : "\xB7"}</span>Chain Watch</button>` + picker + `<span class="nfh-cw-status"${expandable ? ' data-action="toggle"' : ""}>${status}</span><span class="nfh-cw-actions${busy ? " is-busy" : ""}">${state3.actions}</span>` + alertChip(prefs3, armed)
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
    const rows = slots.slice(0, ROSTER_SLOTS).map((slot, index) => {
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
    return rows.join("");
  }
  function checkinSection(summary, board, ui, now) {
    const rows = summary.checkins.map((checkin) => {
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
    return `<div class="nfh-cw-people">${rows.length ? rows.join("") : '<span class="nfh-cw-muted">Nobody is checked in right now.</span>'}</div>` + staff;
  }
  function slotFill(slot) {
    if (slot.total_count === 0) return "empty";
    return slot.paid_count < slot.cap ? "short" : "full";
  }
  function slotDetail(slot, busy) {
    const start2 = slotStart(slot);
    const isMine = slot.signups.some((signup) => signup.is_me);
    const waitlist = slot.total_count - slot.paid_count;
    const names = slot.signups.map(
      (signup) => `<span class="nfh-cw-person nfh-cw-person--plain${signup.is_me ? " is-me" : ""}">${playerLink(signup)}${signup.paid ? "" : overCapNote(slot)}</span>`
    ).join("");
    const paid = slot.rate > 0;
    const unpaidWarning = !isMine && slot.paid_count >= slot.cap ? paid ? '<span class="nfh-cw-need">Paid spots are full: you would be unpaid unless staff approve it.</span>' : '<span class="nfh-cw-muted">This hour is covered: extra watchers are welcome.</span>' : "";
    return `<div class="nfh-cw-detail"><div><strong>${slotLabel(start2)}\u2013${hourLabel(start2 + HOUR_MS)} TCT</strong> <span class="nfh-cw-muted">(${escapeHtml(localTime(start2))} your time)</span>` + (paid ? ` \xB7 ${escapeHtml(slot.rate)} xanax/hr${slot.is_premium ? " \u2605" : ""}` : "") + (slot.range_label ? ` \xB7 ${escapeHtml(slot.range_label)}` : "") + ` \xB7 ${escapeHtml(fillText(slot))}` + (waitlist > 0 ? ` (+${waitlist} ${paid ? "unpaid" : "extra"})` : "") + `</div><div class="nfh-cw-people">${names || '<span class="nfh-cw-muted">Nobody signed up yet.</span>'}</div><div class="nfh-cw-detail-actions${busy ? " is-busy" : ""}">` + (isMine ? button("leave", "Leave this slot", { data: { slot: slot.slot_start_iso } }) : button("signup", "Sign up", { primary: true, data: { slot: slot.slot_start_iso } })) + unpaidWarning + "</div></div>";
  }
  function slotsSection(summary, ui, busy) {
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
    return `<div class="nfh-cw-muted nfh-cw-mine">${mine}</div>` + grid + (selected ? slotDetail(selected, busy) : "");
  }
  function section(title, body) {
    return `<div class="nfh-cw-section"><div class="nfh-cw-heading">${title}</div>${body}</div>`;
  }
  function renderPanel({ board, prefs: prefs3, ui, busy, now }) {
    const summary = summarize(board, now);
    const pays = board.pays !== false;
    const pay = (board.default_rate > 0 ? `${escapeHtml(board.default_rate)} xanax/hr \xB7 ${escapeHtml(board.default_slot_cap)} paid per slot` : `${escapeHtml(board.default_slot_cap)} watchers per slot`) + (pays ? " \xB7 \u2605 pays more" : "");
    return section("On watch", rosterSection(summary, board, now)) + section(`Checked in (${summary.checkins.length})`, checkinSection(summary, board, ui, now)) + section(
      `Slots <span class="nfh-cw-muted">TCT \xB7 ${pay}</span>`,
      slotsSection(summary, ui, busy)
    ) + `<div class="nfh-cw-footer"><label title="Applies to slots you sign up for from here"><input type="checkbox" data-pref="dmReminder"${prefs3.dmReminder ? " checked" : ""}> Discord DM reminder before my slots</label>` + button("test-dm", "Test DM", { title: "Send yourself a test reminder on Discord" }) + button("refresh", "Refresh") + (/^https?:\/\//.test(board.signup_url || "") ? `<a class="nfh-cw-link" href="${escapeHtml(board.signup_url)}" target="_blank" rel="noopener">Open on nuke.family</a>` : "") + "</div>";
  }
  var ALERT_MODE_HELP = {
    [AlertMode.Always]: "You are alerted whenever your faction has an active chain in Torn and its timer gets low, whether or not a chain watch exists on nuke.family.",
    [AlertMode.Watch]: "You are alerted only when both are true: your faction has an active chain in Torn, and it has a chain watch set up on nuke.family. Other chains never alert.",
    [AlertMode.CheckedIn]: "You are alerted only when all three are true: your faction has an active chain in Torn, it has a chain watch set up on nuke.family, and you are checked in to it.",
    [AlertMode.Off]: "You are never alerted about the chain timer."
  };
  function renderSettings({ prefs: prefs3, legacyScript }) {
    const option = (value, label, current) => `<option value="${value}"${value === current ? " selected" : ""}>${label}</option>`;
    return `<div class="nfh-cw-settings-row"><label>Chain timer alert <select data-pref="alertMode">` + option(AlertMode.Always, "Any active chain", prefs3.alertMode) + option(AlertMode.Watch, "Only chains with a chain watch", prefs3.alertMode) + option(AlertMode.CheckedIn, "Only while I'm checked in", prefs3.alertMode) + option(AlertMode.Off, "Off", prefs3.alertMode) + `</select></label><label>Alert below <input type="text" class="nfh-cw-input nfh-cw-time" data-pref="alertSeconds" value="${formatAlertTime(prefs3.alertSeconds)}" maxlength="4" title="m:ss, up to 4:59"></label><label>Pace <select data-pref="pace">` + option("fast", "Fast", prefs3.pace) + option("normal", "Normal", prefs3.pace) + option("slow", "Slow", prefs3.pace) + `</select></label><label>Colour <input type="color" data-pref="color" value="${escapeHtml(prefs3.color)}"></label><label>Strength <input type="range" data-pref="opacity" min="5" max="100" value="${Math.round(prefs3.opacity * 100)}"></label><label><input type="checkbox" data-pref="beep"${prefs3.beep ? " checked" : ""}> Beep</label><label>Volume <input type="range" data-pref="volume" min="1" max="100" value="${Math.round(prefs3.volume * 100)}"></label>` + button("test-alert", "Test", { title: "Preview the alert for a few seconds" }) + `<label title="On territory war walls: strike through your own members and highlight enemies"><input type="checkbox" data-pref="markWall"${prefs3.markWall ? " checked" : ""}> Mark wall targets</label></div><div class="nfh-cw-muted nfh-cw-help">${ALERT_MODE_HELP[prefs3.alertMode]}` + (prefs3.alertMode === AlertMode.Off ? "" : ` Chains under ${MIN_CHAIN_HITS} hits never alert.`) + "</div>" + (legacyScript ? '<div class="nfh-cw-need">The old "Chain watcher" script is still running. This replaces it, so you can remove it (otherwise both will alert).</div>' : "");
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
  function isOwnFactionMainTab() {
    return window.location.search.includes("step=your") && !window.location.hash.includes("tab=");
  }
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
    const prefs3 = getPrefs();
    const bar = renderBar({
      board: state.board,
      watches: state.watches,
      prefs: prefs3,
      armed: isArmed(),
      chainActive: state.chainActive,
      flash: state.flash,
      busy: state.busy,
      now
    });
    setRegion("bar", bar.html);
    root.className = "nfh-cw" + (bar.tone ? ` nfh-cw--${bar.tone}` : "");
    const showPanel = !!state.board && prefs3.expanded;
    regions.panel.hidden = !showPanel;
    if (showPanel) {
      setRegion(
        "panel",
        renderPanel({ board: state.board, prefs: prefs3, ui: state.ui, busy: state.busy, now })
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
    if (!state.watches.some((watch3) => watch3.id === state.watchId)) {
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
    const timer = readChainTimer();
    updateAlert({ timer, armed: isArmed(), test: now < state.testUntil });
    const chainActive = !!timer && timer.active;
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

  // src/core/synced-store.js
  function createSyncedStore({
    storageKey,
    dataField,
    emptyValue,
    serverField,
    fallbackTtlMs,
    fetcher
  }) {
    let data = emptyValue;
    let timestamp = 0;
    const listeners = [];
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
        listeners.push(listener);
      },
      // Load previously cached data from localStorage. Corrupt entries are
      // discarded (the next refresh repopulates them) instead of alerting.
      load() {
        try {
          const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
          if (saved && typeof saved === "object") {
            data = saved[dataField] ?? emptyValue;
            timestamp = saved.timestamp || 0;
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
        try {
          data = await fetcher();
          timestamp = serverTimestampSec ? serverTimestampSec * 1e3 : Date.now();
          localStorage.setItem(
            storageKey,
            JSON.stringify({ [dataField]: data, timestamp })
          );
          LogInfo(`${storageKey} updated and stored with timestamp:`, timestamp);
          for (const listener of listeners) {
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

  // src/features/contracts.js
  var contractsStore = createSyncedStore({
    storageKey: "contractCoverage",
    dataField: "coverage",
    emptyValue: [],
    serverField: "contract_cache_last_update",
    fallbackTtlMs: 6 * 60 * 60 * 1e3,
    // 6 hours
    fetcher: async () => (await api("/contracts/active-coverage")).coverage || []
  });
  contractsStore.subscribe(() => maybeInsertActiveContract());
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
    if (!IsPage(PageType.Profile)) {
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
    const state3 = readJson2(CPR_KEY);
    return state3 && state3.known && state3.sent ? state3 : { known: {}, sent: {} };
  }
  var pending = /* @__PURE__ */ new Map();
  var uploadTimer = null;
  async function upload() {
    uploadTimer = null;
    const batch = [...pending.entries()];
    pending = /* @__PURE__ */ new Map();
    if (batch.length === 0) return;
    try {
      await api("/oc/cpr", { method: "POST", data: { cprs: batch.map(([, entry]) => entry) } });
      const state3 = cprState();
      for (const [key, entry] of batch) state3.sent[key] = entry.cpr;
      localStorage.setItem(CPR_KEY, JSON.stringify(state3));
      LogInfo(`OC Assistant sent ${batch.length} CPRs`);
    } catch (error) {
      console.error("[NFH] Could not send CPRs to nuke.family:", error);
    }
  }
  function learnCprs(crimes) {
    const state3 = cprState();
    let changed = false;
    for (const crime of crimes) {
      for (const slot of crime.slots) {
        if (slot.occupied || slot.cpr === null) continue;
        const key = `${keyFor(crime.name)}|${keyFor(slot.name)}`;
        if (state3.known[key] !== slot.cpr) {
          state3.known[key] = slot.cpr;
          changed = true;
        }
        if (state3.sent[key] !== slot.cpr) {
          pending.set(key, { crime: crime.name, role: slot.name, cpr: slot.cpr });
        }
      }
    }
    if (changed) localStorage.setItem(CPR_KEY, JSON.stringify(state3));
    if (pending.size > 0 && !uploadTimer) uploadTimer = setTimeout(upload, UPLOAD_DELAY_MS);
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
    const saved = readJson2(SPAWN_KEY);
    return saved && saved.until > Date.now() ? saved.until : 0;
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
  function refreshBoard2() {
    const cached = cachedBoard2();
    const now = Date.now();
    if (cached && now - cached.fetchedAt < BOARD_FRESH_MS2) return Promise.resolve(false);
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
  function belowMemberLevel(crime, memberLevel, levelGap) {
    if (memberLevel === null || memberLevel === void 0) return false;
    if (crime.level === null || crime.level === void 0) return false;
    return memberLevel - crime.level >= levelGap;
  }
  function belowOwnLevel(crime, memberLevel, config) {
    if (memberLevel === null || memberLevel === void 0) return false;
    const settings = config && config.settings || {};
    const gap = memberLevel >= productiveFromLevel(config) ? 1 : settings.under_level_gap ?? 2;
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
    const candidates = qualifying.filter((entry) => !holdBack || !entry.tooLow).sort(
      (a, b) => Number(b.productive) - Number(a.productive) || (b.crime.level ?? 0) - (a.crime.level ?? 0) || Number(b.pick.weight !== null) - Number(a.pick.weight !== null) || (a.pooled || b.pooled ? 0 : a.openSlots - b.openSlots) || a.waitHours - b.waitHours || (b.pick.weight ?? -1) - (a.pick.weight ?? -1)
    );
    const suggestions = [];
    const best = candidates[0];
    if (best) {
      suggestions.push(suggestion(Rank.Best, best));
      const lowestGoodLevel = (best.crime.level ?? 0) - (levelGap - 1);
      for (const candidate of candidates.slice(1)) {
        if (suggestions.length > GOOD_SLOTS) break;
        if (candidate.belowLevel) continue;
        if (candidate.productive !== best.productive) continue;
        if ((candidate.crime.level ?? 0) < lowestGoodLevel) continue;
        suggestions.push(suggestion(Rank.Good, candidate));
      }
    }
    return { crimes: rated, suggestions, withheld };
  }
  function suggestion(rank, candidate) {
    return {
      rank,
      crime: candidate.crime,
      rated: candidate.pick,
      waitHours: candidate.waitHours,
      pooled: candidate.pooled,
      productive: candidate.productive,
      thresholdHours: candidate.thresholdHours,
      belowLevel: candidate.belowLevel,
      memberLevel: candidate.memberLevel
    };
  }
  function tierFor(level) {
    if (level <= 2) return "1-2";
    if (level <= 4) return "3-4";
    if (level <= 6) return "5-6";
    if (level <= 8) return "7-8";
    return "9-10";
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
      const body = await api(path);
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
  async function sendDebugInfo(report) {
    const path = "/script/debug-report";
    let error;
    try {
      return { reference: (await api(path, { method: "POST", data: { report } })).reference };
    } catch (first) {
      error = first;
    }
    if (!(error instanceof ApiError)) {
      try {
        const data = { report: { ...report, sent_by: "page", send_failure: failure(error) } };
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
  function showDebugInfo(report) {
    const existing = document.getElementById(DIALOG_ID);
    if (existing) existing.remove();
    const text = JSON.stringify(report, null, 2);
    const overlay = document.createElement("div");
    overlay.id = DIALOG_ID;
    overlay.className = "nfh-debug-overlay";
    overlay.innerHTML = '<div class="nfh-debug-dialog" role="dialog" aria-modal="true" aria-label="Nuke Family Helper debug info"><div class="nfh-debug-title">Nuke Family Helper debug info</div><p class="nfh-debug-note">Send this to the developer and pass on the short reference you get back, or copy the whole report. It does not contain your key.</p><textarea class="nfh-debug-text" readonly spellcheck="false"></textarea><div class="nfh-debug-sent" hidden>Sent. Your reference is <input type="text" class="nfh-debug-reference" readonly aria-label="Reference"> <button type="button" class="torn-btn" data-nfh-debug-copy-reference>Copy reference</button></div><div class="nfh-debug-actions"><span class="nfh-debug-status" role="status"></span><button type="button" class="torn-btn" data-nfh-debug-send>Send to developer</button><button type="button" class="torn-btn" data-nfh-debug-copy>Copy report</button><button type="button" class="torn-btn" data-nfh-debug-close>Close</button></div></div>';
    const textarea = overlay.querySelector("textarea");
    textarea.value = text;
    const status = overlay.querySelector(".nfh-debug-status");
    const sent = overlay.querySelector(".nfh-debug-sent");
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
        const outcome = await sendDebugInfo(report);
        if (outcome.reference) {
          reference.value = outcome.reference;
          sent.hidden = false;
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
    btn.addEventListener("click", function() {
      const newKey = promptForNewApiKey();
      if (newKey) {
        refreshUserRole();
        refreshPermissions();
        alert("Nuke Family key updated. It will be used for all future requests.");
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
        await refreshAllCaches();
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
    isReputationVisible: () => {
      try {
        const stored = getItem("nfhShowReputation");
        return stored === null ? true : stored === "true";
      } catch (e) {
        return true;
      }
    },
    setReputationVisible: (isVisible) => {
      setItem("nfhShowReputation", String(isVisible));
    }
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
  function processHospitalRows() {
    LogInfo("Processing hospital rows...");
    if (!contractsStore.data.length && !Object.keys(shitlistStore.data).length) {
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
      if (findActiveContract(factionId, playerId)) {
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
      const observer2 = new MutationObserver(() => {
        LogInfo("Hospital list changed, reprocessing rows...");
        processHospitalRows();
      });
      observer2.observe(userInfoList, {
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
    const wait = hoursUntilTurn(crime, index);
    if (countsProductiveDays(crime, limits.productiveFromLevel ?? 1) && wait > limits.thresholdHours) {
      flags.push({
        flag: Flag.Unproductive,
        text: `Idle ${Math.round(wait)}h`,
        title: `Planning for this slot starts ${describeWait(wait)}, later than the ${limits.thresholdHours} hour threshold.`
      });
    }
    if (memberLevel !== null && memberLevel !== void 0 && crime.level !== null && memberLevel - crime.level >= limits.levelGap) {
      flags.push({
        flag: Flag.UnderLevel,
        text: `Level ${memberLevel} member`,
        title: `This member qualifies for level ${memberLevel} crimes; this one is level ${crime.level}.`
      });
    }
    return flags;
  }
  function limitsFor(config, prefs3 = null) {
    const settings = config && config.settings || {};
    return {
      thresholdHours: (prefs3 && prefs3.thresholdHours) ?? settings.productive_threshold_hours ?? 12,
      levelGap: (prefs3 && prefs3.levelGap) ?? settings.under_level_gap ?? 2,
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
    let saved = null;
    try {
      saved = JSON.parse(getItem(KEY) || "null");
    } catch (e) {
      saved = null;
    }
    return {
      ...DEFAULTS2,
      ...saved || {},
      show: { ...DEFAULTS2.show, ...saved && saved.show || {} }
    };
  }
  function setStaffPrefs(changes) {
    const next = { ...getStaffPrefs(), ...changes };
    setItem(KEY, JSON.stringify(next));
    return next;
  }
  function parseOverride(value, min, max) {
    const number = parseInt(value, 10);
    if (Number.isNaN(number)) return null;
    return Math.min(max, Math.max(min, number));
  }

  // src/features/organized-crimes/page.js
  var CRIMES_ROOT_SELECTOR = "#faction-crimes-root";
  var SubTab = {
    Recruiting: "recruiting",
    Planning: "planning",
    Completed: "completed"
  };
  function activeSubTab(root2) {
    for (const name of root2.querySelectorAll('[class^="tabName___"]')) {
      const button2 = name.closest("button");
      if (button2 && /(^|\s)active___/.test(button2.className)) {
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
  function readCrimes(root2) {
    const crimes = [];
    for (const el of root2.querySelectorAll("[data-oc-id]")) {
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
    const buttons = crimes.flatMap(
      (crime) => crime.slots.map((slot) => slot.joinButton).filter(Boolean)
    );
    if (buttons.length === 0) return JoinState.Full;
    return buttons.some((button2) => !button2.disabled) ? JoinState.Open : JoinState.Blocked;
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
    return { state: "weight", text: `Weight ${weight}`, title: `This role carries ${weight} of the crime's outcome.` };
  }
  function renderMinimum(rated, showMinimum = true) {
    const { slot, minCpr } = rated;
    const existing = slot.el.querySelector(`:scope > .${CHIP_CLASS}`);
    const chip = showMinimum ? chipFor(rated) : weightChipFor(rated);
    if (!chip) {
      if (existing) existing.remove();
      return;
    }
    const element = existing || document.createElement("div");
    const text = chip.text || `Min CPR ${minCpr}`;
    if (element.textContent !== text) element.textContent = text;
    if (element.title !== chip.title) element.title = chip.title;
    element.classList.add(CHIP_CLASS);
    for (const state3 of CHIP_STATES) {
      element.classList.toggle(`${CHIP_CLASS}--${state3}`, state3 === chip.state);
    }
    if (!existing) slot.headerEl.insertAdjacentElement("afterend", element);
  }
  function renderFlags(slot, flags) {
    const existing = slot.el.querySelector(`:scope > .${FLAGS_CLASS}`);
    if (flags.length === 0) {
      if (existing) existing.remove();
      return;
    }
    const html = flags.map(
      (flag) => `<span class="nfh-oc-flag nfh-oc-flag--${flag.flag}" title="${escapeHtml(`${FLAG_LABELS[flag.flag]}: ${flag.title}`)}"><span aria-hidden="true">${FLAG_SYMBOLS[flag.flag]}</span> ${escapeHtml(flag.text)}</span>`
    ).join("");
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
  function staffHtml(staff) {
    const kinds = [Flag.Unqualified, Flag.Unproductive, Flag.UnderLevel];
    const shown = kinds.filter((kind) => staff.prefs.show[kind]);
    const summary = shown.length === 0 ? "all hidden" : shown.map((kind) => `${staff.counts[kind] || 0} ${FLAG_LABELS[kind].toLowerCase()}`).join(", ");
    let panel = "";
    if (staff.open) {
      const toggles = kinds.map(
        (kind) => `<label class="nfh-oc-staff-option"><input type="checkbox" data-nfh-oc-flag="${kind}"${staff.prefs.show[kind] ? " checked" : ""}> <span class="nfh-oc-flag nfh-oc-flag--${kind}"><span aria-hidden="true">${FLAG_SYMBOLS[kind]}</span> ${FLAG_LABELS[kind]}</span></label>`
      ).join("");
      const override = (name, label, value, fallback) => `<label class="nfh-oc-staff-option">${label} <input type="number" min="1" class="nfh-oc-staff-number" data-nfh-oc-limit="${name}" value="${escapeHtml(value ?? "")}" placeholder="${escapeHtml(fallback)}"></label>`;
      panel = `<div class="nfh-oc-staff-panel">${toggles}` + override("thresholdHours", "Not productive after (hours)", staff.prefs.thresholdHours, staff.factionLimits.thresholdHours) + override("levelGap", "Under-levelled from (levels below)", staff.prefs.levelGap, staff.factionLimits.levelGap) + `<span class="nfh-oc-bar-muted">Leave a number blank to use your faction's. These choices are yours alone.</span></div>`;
    }
    return `<span class="nfh-oc-staff"><span class="nfh-oc-bar-muted">Staff flags on this page:</span> ${escapeHtml(summary)} <button type="button" class="nfh-oc-bar-button" data-nfh-oc-staff-toggle aria-expanded="${staff.open ? "true" : "false"}">Flag settings</button></span>${panel}`;
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
    return `Your planning would start ${describeWait(suggestion2.waitHours)}.`;
  }
  function tagTitle(suggestion2) {
    const caveats = suggestionCaveats(suggestion2);
    if (caveats.length > 0) return caveats.map((caveat) => caveat.title).join(" ");
    return suggestion2.pooled === false ? "Productive days do not count at this level, so this goes on your CPR and how close the crime is to full." : waitSentence(suggestion2);
  }
  function renderSuggestions(root2, suggestions) {
    const wanted = new Map(
      suggestions.filter((suggestion2) => suggestion2.rated.slot.el).map((suggestion2) => [suggestion2.rated.slot.el, suggestion2])
    );
    for (const marked of root2.querySelectorAll(`.${PICK_CLASS}`)) {
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
  function barHtml(state3) {
    const label = '<span class="nfh-oc-bar-label">OC Assistant</span>';
    if (state3.kind === "best") {
      const [best, ...rest] = state3.suggestions;
      const { slot, minCpr } = best.rated;
      const others = rest.filter((suggestion2) => !suggestion2.crime.offPage);
      const flawed = suggestionCaveats(best).length > 0;
      const more = others.length > 0 ? ` <span class="nfh-oc-bar-muted">${others.length} other ${flawed ? "" : "good "}slot${others.length === 1 ? " is" : "s are"} marked below.</span>` : "";
      const unweighted = best.rated.weight === null ? ' <span class="nfh-oc-bar-muted">This crime is too new to have role weights, so this goes on your CPR and its level alone.</span>' : "";
      const offPage = best.crime.offPage ? ' <span class="nfh-oc-bar-muted">It is further down the list and may have been taken in the last few minutes.</span>' : "";
      const late = best.productive ? "" : ` <strong class="nfh-oc-bar-warning">That is later than the ${escapeHtml(best.thresholdHours)} hours that count as productive,</strong> <span class="nfh-oc-bar-muted">but nothing open would start you sooner.</span>`;
      const belowLevel = best.belowLevel ? ` <strong class="nfh-oc-bar-warning">This crime is below your level (${escapeHtml(best.memberLevel)}).</strong>` : "";
      let lead = flawed ? "Best slot available: " : "Best slot for you: ";
      if (state3.warning) {
        lead = `<strong class="nfh-oc-bar-warning">${escapeHtml(state3.warning)}</strong> ${flawed ? "The best slot available: " : "A better slot: "}`;
      }
      return `${label}<span class="nfh-oc-bar-text">${lead}<strong>${escapeHtml(best.crime.name)}</strong> (level ${escapeHtml(best.crime.level ?? "?")}), <strong>${escapeHtml(slot.name)}</strong>. Your CPR is ${escapeHtml(slot.cpr)} and the minimum is ${escapeHtml(minCpr)}. ${best.pooled === false ? "" : escapeHtml(waitSentence(best))}${late}${belowLevel}${unweighted}${offPage}${more}</span><button type="button" class="nfh-oc-bar-button" data-nfh-oc-show>${best.crime.offPage ? "Scroll down" : "Show me"}</button>`;
    }
    if (state3.kind === "joined") {
      return `${label}<span class="nfh-oc-bar-text">You are in <strong>${escapeHtml(state3.crime)}</strong> (level ${escapeHtml(state3.level ?? "?")}) as <strong>${escapeHtml(state3.role)}</strong>, so no other slot is suggested.</span>`;
    }
    if (state3.kind === "warning") {
      return `${label}<span class="nfh-oc-bar-text"><strong class="nfh-oc-bar-warning">${escapeHtml(state3.warning)}</strong></span>`;
    }
    const messages = {
      none: "None of the open slots loaded so far meets your faction's minimum CPR for you. Scroll down to load more crimes.",
      blocked: "Torn is not letting you join a crime right now (you are probably already in one), so no slot is suggested.",
      full: "No open slot is loaded yet. Scroll down to load more crimes.",
      low: "The open slots you qualify for are all in crimes below your level, so none is suggested."
    };
    return `${label}<span class="nfh-oc-bar-text">${messages[state3.kind]}</span>`;
  }
  function renderBar2(root2, html) {
    let bar = document.getElementById(BAR_ID);
    if (!bar) {
      bar = document.createElement("div");
      bar.id = BAR_ID;
      bar.className = "nfh-oc-bar";
      root2.parentElement.insertBefore(bar, root2);
    }
    if (bar.dataset.nfhHtml !== html) {
      bar.dataset.nfhHtml = html;
      bar.innerHTML = html;
    }
    return bar;
  }
  function removeBar() {
    const bar = document.getElementById(BAR_ID);
    if (bar) bar.remove();
  }
  function clearAll(root2) {
    removeBar();
    renderSuggestions(root2, []);
    for (const ours of root2.querySelectorAll(`.${CHIP_CLASS}, .${FLAGS_CLASS}`)) ours.remove();
  }
  function isOwnElement(node) {
    return node.nodeType === Node.ELEMENT_NODE && (node.classList.contains(CHIP_CLASS) || node.classList.contains(TAG_CLASS) || node.classList.contains(FLAGS_CLASS) || node.id === BAR_ID);
  }

  // src/features/organized-crimes/index.js
  var RENDER_DEBOUNCE_MS = 150;
  var MOVE_WORTHWHILE_HOURS = 24;
  var staffPanelOpen = false;
  var spawnState = { busy: false, message: null, error: false };
  function findOwnSlot(pageCrimes, board) {
    const me = String(getUserscriptUsersPlayerId() || "");
    if (!me) return null;
    const onPage = new Set(pageCrimes.map((crime) => String(crime.id)));
    const boardCrimes = (board && board.crimes || []).filter((crime) => !onPage.has(String(crime.id))).map((crime) => ({
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
  var observer = null;
  var observedRoot = null;
  var renderTimer = null;
  var subscribed = false;
  function isOwnFactionCrimesTab() {
    return window.location.search.includes("step=your") && IsPage(PageType.FactionCrimes);
  }
  function render2() {
    const root2 = document.querySelector(CRIMES_ROOT_SELECTOR);
    if (!root2 || !isOwnFactionCrimesTab()) return;
    const config = ocConfigStore.data;
    if (!config) {
      clearAll(root2);
      return;
    }
    const crimes = readCrimes(root2);
    const tab = activeSubTab(root2);
    const recruiting = tab === SubTab.Recruiting;
    const active = (recruiting || tab === SubTab.Planning) && crimes.length > 0;
    const joining = joinState(crimes);
    if (recruiting) learnCprs(crimes);
    if (active) {
      refreshBoard2().then((fresh) => {
        if (fresh) scheduleRender();
      });
    }
    const cached = active ? cachedBoard2() : null;
    const board = cached ? cached.board : null;
    const features2 = memberFeatures(config);
    const own = recruiting ? findOwnSlot(crimes, board) : null;
    const inCrime = own !== null || joining === JoinState.Blocked;
    const warning = features2.warn && recruiting ? ownSlotWarning(own, board, config, rateCrimes) : null;
    const ranking = features2.enabled && recruiting && crimes.length > 0 && (warning !== null || !inCrime && joining === JoinState.Open);
    const suggesting = ranking && features2.suggest;
    const elsewhere = ranking && board ? offPageCrimes(board, crimes) : [];
    const myLevel = board && board.me ? board.me.level : null;
    const result = rateCrimes([...crimes, ...elsewhere], config, {
      level: myLevel,
      canAsk: canAskForCrime(myLevel, config)
    });
    const members = board && board.members ? board.members : null;
    const prefs3 = members ? getStaffPrefs() : null;
    const limits = limitsFor(config, prefs3);
    const counts = {};
    for (const crime of result.crimes) {
      if (crime.crime.offPage) continue;
      crime.slots.forEach((rated, index) => {
        renderMinimum(rated, features2.minimums);
        let flags = [];
        if (members && active && rated.slot.occupied) {
          const member = members[rated.slot.playerId];
          flags = slotFlags(crime.crime, index, rated, member ? member.level : null, limits).filter(
            (flag) => prefs3.show[flag.flag]
          );
          for (const flag of flags) counts[flag.flag] = (counts[flag.flag] || 0) + 1;
        }
        renderFlags(rated.slot, flags);
      });
    }
    const suggestions = suggesting ? result.suggestions : [];
    renderSuggestions(root2, suggestions);
    const staffPart = members && active ? staffHtml({ counts, prefs: prefs3, factionLimits: limitsFor(config), open: staffPanelOpen }) : "";
    const label = '<span class="nfh-oc-bar-label">OC Assistant</span>';
    let memberPart = "";
    if (features2.enabled && recruiting && crimes.length > 0) {
      if (features2.suggest) {
        let state3;
        if (suggestions.length > 0) state3 = { kind: "best", suggestions, warning };
        else if (warning) state3 = { kind: "warning", warning };
        else if (own) state3 = { kind: "joined", crime: own.crime.name, level: own.crime.level, role: own.crime.slots[own.index].name };
        else if (joining === JoinState.Blocked) state3 = { kind: "blocked" };
        else if (joining === JoinState.Open && result.withheld > 0) state3 = { kind: "low" };
        else if (joining === JoinState.Full) state3 = { kind: "full" };
        else state3 = { kind: "none" };
        memberPart = barHtml(state3);
      } else if (warning) {
        memberPart = barHtml({ kind: "warning", warning });
      }
      const tier = !inCrime && joining === JoinState.Open && board && board.me ? spawnTierToRequest(result.suggestions, board.me.level, config) : null;
      if (tier || spawnState.message) {
        const quiet = features2.suggest && suggestions.length === 0 && result.withheld > 0;
        memberPart = (memberPart || label) + spawnHtml({ tier, asked: spawnAskedUntil() > 0, quiet, ...spawnState });
      }
    }
    if (!memberPart && staffPart) memberPart = label;
    if (!memberPart) {
      removeBar();
      return;
    }
    const bar = renderBar2(root2, memberPart + staffPart);
    if (!bar.dataset.nfhBound) {
      bar.dataset.nfhBound = "1";
      bar.addEventListener("change", (event) => {
        const flag = event.target.getAttribute("data-nfh-oc-flag");
        const limit = event.target.getAttribute("data-nfh-oc-limit");
        if (flag) {
          setStaffPrefs({ show: { ...getStaffPrefs().show, [flag]: event.target.checked } });
        } else if (limit) {
          setStaffPrefs({ [limit]: parseOverride(event.target.value, 1, limit === "levelGap" ? 9 : 168) });
        } else {
          return;
        }
        scheduleRender();
      });
      bar.addEventListener("click", (event) => {
        if (event.target.closest("[data-nfh-oc-staff-toggle]")) {
          staffPanelOpen = !staffPanelOpen;
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
  function scheduleRender() {
    if (renderTimer) clearTimeout(renderTimer);
    renderTimer = setTimeout(() => {
      renderTimer = null;
      try {
        render2();
      } catch (error) {
        console.error("[NFH] OC Assistant failed to render:", error);
      }
    }, RENDER_DEBOUNCE_MS);
  }
  function isOwnMutation(mutation) {
    const nodes = [...mutation.addedNodes, ...mutation.removedNodes];
    return nodes.length > 0 && nodes.every(isOwnElement);
  }
  function watch(root2) {
    if (observedRoot === root2 && root2.isConnected) return;
    if (observer) observer.disconnect();
    observedRoot = root2;
    observer = new MutationObserver((mutations) => {
      if (!isOwnFactionCrimesTab()) return;
      if (mutations.every(isOwnMutation)) return;
      scheduleRender();
    });
    observer.observe(root2, { childList: true, subtree: true });
    LogInfo("OC Assistant watching the crimes list");
  }
  function init4() {
    if (!isOwnFactionCrimesTab()) return;
    if (!subscribed) {
      subscribed = true;
      ocConfigStore.subscribe(() => scheduleRender());
    }
    waitForElm(CRIMES_ROOT_SELECTOR).then((root2) => {
      watch(root2);
      scheduleRender();
    });
  }
  var organized_crimes_default = {
    name: "organized-crimes",
    pages: [PageType.FactionCrimes],
    init: init4
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
  function placeCode(place) {
    const name = String(place).trim();
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
  var BAR_ID2 = "nfh-war-bar";
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
  var state2 = {
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
  var pending2 = { bsp: /* @__PURE__ */ new Map(), ffscouter: /* @__PURE__ */ new Map() };
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
  function watch2(target) {
    if (state2.target === target) return;
    state2.target = target;
    state2.war = void 0;
    state2.members = {};
    for (const source of SOURCES) {
      state2.held[source] = {};
      state2.fresh[source] = /* @__PURE__ */ new Set();
      pending2[source].clear();
    }
    state2.statsAt = 0;
    state2.uploadAfter = 0;
    state2.fetchedAt = 0;
    state2.nextPollAt = 0;
    state2.error = false;
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
  function playerIdOf(row) {
    const link = row.querySelector("a[href*='profiles.php?XID=']");
    const match = link && link.getAttribute("href").match(/XID=(\d+)/);
    return match ? match[1] : null;
  }
  function cellOf(row, name) {
    return row.querySelector(`.${name}`) || row.querySelector(`[class*="${name}___"]`);
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
  function pageEstimatesOf(row) {
    const found = {};
    const scouter = Number(row.dataset.estValue);
    if (scouter > 0) found[Source.FfScouter] = Math.round(scouter);
    const box = row.querySelector(BSP_BOX_SELECTOR);
    const predicted = box && (Math.round(Number(box.dataset.bspStats)) || parseStatText(box.textContent));
    if (predicted > 0) found[Source.Bsp] = predicted;
    return found;
  }
  function scoreOf(row) {
    const cell = cellOf(row, "points");
    return cell && Number(cell.textContent.replace(/,/g, "")) || 0;
  }
  function noteForUpload(id, onPage) {
    if (state2.statsAt === 0 || Date.now() < state2.uploadAfter) return;
    for (const source of SOURCES) {
      if (!onPage[source] || state2.fresh[source].has(id) || pending2[source].has(id)) continue;
      pending2[source].set(id, onPage[source]);
      clearTimeout(uploadTimer2);
      uploadTimer2 = setTimeout(upload2, UPLOAD_DELAY_MS2);
    }
  }
  async function upload2() {
    uploadTimer2 = null;
    const target = state2.target;
    for (const source of SOURCES) {
      const batch = [...pending2[source].entries()].slice(0, UPLOAD_MAX);
      if (batch.length === 0) continue;
      pending2[source].clear();
      try {
        await api("/war/estimates", {
          method: "POST",
          data: {
            source,
            ...target ? { faction_id: Number(target) } : {},
            estimates: batch.map(([id, total]) => ({ id: Number(id), total }))
          }
        });
        if (state2.target !== target) return;
        for (const [id] of batch) state2.fresh[source].add(id);
        LogInfo(`War board sent ${batch.length} ${source} estimates`);
      } catch (error) {
        state2.uploadAfter = Date.now() + UPLOAD_RETRY_MS;
        console.error("[NFH] Could not send stat estimates to nuke.family:", error);
      }
    }
  }
  function clearRow(row) {
    setAttr(row, ROW_ATTR, null);
    const statusCell = cellOf(row, "status");
    if (statusCell) {
      setAttr(statusCell, STATUS_ATTR, null);
      setAttr(statusCell, TONE_ATTR, null);
    }
    const memberCell = cellOf(row, "member");
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
    return !!state2.war && Date.now() - state2.fetchedAt < STALE_MS;
  }
  function decorate(lists) {
    const prefs3 = getPrefs2();
    const live = hasData();
    const now = Date.now() + state2.clockOffset;
    const compare = live ? comparatorFor(prefs3.sort, prefs3.then) : null;
    let anyStats = false;
    let heldShown = false;
    const sources = /* @__PURE__ */ new Set();
    for (const list of lists) {
      const entries = [];
      for (const row of list.children) {
        const id = playerIdOf(row);
        if (!id || !live) {
          clearRow(row);
          continue;
        }
        const statusCell = cellOf(row, "status");
        const pageKind = pageKindOf(statusCell);
        const entry = classify(state2.members[id], pageKind, now, memos.get(id));
        memos.set(id, entry.memo);
        const onPage = pageEstimatesOf(row);
        const held = { bsp: state2.held.bsp[id], ffscouter: state2.held.ffscouter[id] };
        const estimate = pickEstimate(onPage, held, prefs3.source);
        noteForUpload(id, onPage);
        for (const source of SOURCES) {
          if (onPage[source] || held[source]) sources.add(source);
        }
        entry.stats = estimate.total;
        entry.score = scoreOf(row);
        const badge = estimate.total > 0 && !estimate.fromPage;
        anyStats = anyStats || estimate.total > 0;
        heldShown = heldShown || badge;
        entry.row = row;
        entries.push(entry);
        if (statusCell) {
          setAttr(statusCell, STATUS_ATTR, entry.label);
          setAttr(statusCell, TONE_ATTR, entry.label !== null && pageKind === "travel" ? "travel" : null);
        }
        setAttr(row, ROW_ATTR, entry.out ? "out" : entry.soon ? "soon" : null);
        const memberCell = cellOf(row, "member");
        if (memberCell) {
          setAttr(memberCell, STATS_ATTR, prefs3.showStats && badge ? formatStats(entry.stats) : null);
        }
      }
      if (compare && !list.closest(FF_BUSY_SELECTOR)) reorder(list, entries, compare);
    }
    state2.anyStats = anyStats;
    state2.heldShown = heldShown;
    state2.sources = sources;
  }
  function reorder(list, entries, compare) {
    const sorted = [...entries].sort(compare);
    if (sorted.every((entry, index) => entry === entries[index])) return;
    const fragment = document.createDocumentFragment();
    for (const entry of sorted) fragment.appendChild(entry.row);
    list.insertBefore(fragment, list.firstChild);
  }
  function statusText() {
    if (state2.war === null) {
      return state2.target ? "nuke.family found no ranked war on for this faction." : "nuke.family has no ranked war on for your faction yet.";
    }
    if (state2.error && !hasData()) return "Could not reach nuke.family. Trying again shortly.";
    if (!hasData()) return "Loading statuses\u2026";
    const age = Math.round((Date.now() - state2.fetchedAt) / 1e3);
    return age < 15 ? "Live" : `Updated ${age}s ago`;
  }
  function thenSelect(prefs3) {
    const options = [
      ...state2.anyStats ? [[Then.StatsAsc, "lowest stats"], [Then.StatsDesc, "highest stats"]] : [],
      [Then.ScoreDesc, "highest score"],
      [Then.ScoreAsc, "lowest score"],
      [Then.Recent, "latest out of hospital"]
    ];
    const chosen = options.some(([value]) => value === prefs3.then) ? prefs3.then : "";
    return '<label title="How members with the same status are ordered">then <select data-pref="then">' + (chosen === "" ? `<option value="" selected>Torn's order</option>` : "") + options.map(([value, label]) => `<option value="${value}"${value === chosen ? " selected" : ""}>${label}</option>`).join("") + "</select></label>";
  }
  function renderBar3() {
    const prefs3 = getPrefs2();
    const chip = (mode, label, title) => `<button type="button" class="nfh-cw-chip${prefs3.sort === mode ? " is-armed" : ""}" data-sort="${mode}" title="${title}">${label}</button>`;
    return '<div class="nfh-cw-bar"><strong>War board</strong>' + (state2.war ? '<span class="nfh-cw-muted">Sort</span>' + chip(SortMode.Status, "Hospital", "Who can be hit now, then who leaves hospital next") + (state2.anyStats ? chip(SortMode.StatsAsc, "Stats \u25B2", "Lowest battle stat estimate first") + chip(SortMode.StatsDesc, "Stats \u25BC", "Highest battle stat estimate first") : "") + chip(SortMode.Off, "Torn's order", "Leave the lists as Torn sorts them (or BSP / FF Scouter, if you sort with theirs)") + (prefs3.sort === SortMode.Status ? thenSelect(prefs3) : "") + (state2.sources.size > 1 ? `<label title="Whose estimate to use when both are known">Estimates <select data-pref="source"><option value="${Source.Bsp}"${prefs3.source === Source.Bsp ? " selected" : ""}>BSP</option><option value="${Source.FfScouter}"${prefs3.source === Source.FfScouter ? " selected" : ""}>FF Scouter</option></select></label>` : "") + (state2.heldShown || state2.anyStats && !prefs3.showStats ? `<label title="Show the estimates other members' BSP or FF Scouter passed on to nuke.family, where yours shows none"><input type="checkbox" data-pref="showStats"${prefs3.showStats ? " checked" : ""}> Show stats</label>` : "") : "") + `<span class="nfh-cw-status nfh-cw-muted">${statusText()}</span></div>`;
  }
  function ensureBar() {
    let bar = document.getElementById(BAR_ID2);
    if (!bar) {
      const anchor = document.querySelector(ANCHOR_SELECTOR2);
      if (!anchor) return;
      bar = document.createElement("div");
      bar.id = BAR_ID2;
      bar.className = "nfh-cw nfh-war-bar";
      bar.addEventListener("click", onClick2);
      bar.addEventListener("change", onChange2);
      anchor.insertAdjacentElement("beforebegin", bar);
      barHtml2 = "";
    }
    const html = renderBar3();
    if (html !== barHtml2) {
      barHtml2 = html;
      bar.innerHTML = html;
    }
  }
  function onClick2(event) {
    const button2 = event.target.closest("[data-sort]");
    if (!button2) return;
    setPrefs2({ sort: button2.dataset.sort });
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
      decorate(lists);
      ensureBar();
    }
  }
  async function poll() {
    const wantStats = Date.now() - state2.statsAt > STATS_REFRESH_MS;
    const target = state2.target;
    const query = [target ? `faction_id=${target}` : "", wantStats ? "stats=1" : ""].filter(Boolean).join("&");
    state2.loading = true;
    try {
      const response = await api("/war/board" + (query ? `?${query}` : ""));
      if (state2.target !== target) return;
      const data = response.data || {};
      state2.error = false;
      if (!data.war) {
        state2.war = null;
        state2.nextPollAt = Date.now() + (data.recheck_seconds || 600) * 1e3;
        return;
      }
      state2.war = data.war;
      state2.members = data.members || {};
      state2.fetchedAt = Date.now();
      state2.clockOffset = data.server_time * 1e3 - Date.now();
      state2.nextPollAt = Date.now() + (data.poll_seconds * 1e3 || DEFAULT_POLL_MS);
      if (data.estimates) {
        for (const source of SOURCES) {
          state2.held[source] = data.estimates[source] || {};
          state2.fresh[source] = new Set(((data.estimates_fresh || {})[source] || []).map(String));
        }
        state2.statsAt = Date.now();
      }
    } catch (error) {
      if (state2.target !== target) return;
      state2.error = true;
      state2.nextPollAt = Date.now() + ERROR_RETRY_MS;
      console.error("[NFH] Could not load the war board from nuke.family:", error);
    } finally {
      state2.loading = false;
      refresh();
    }
  }
  function tick2() {
    const target = viewedWar();
    if (target === null) {
      stop2();
      return;
    }
    watch2(target);
    if (document.hidden) return;
    const lists = document.querySelectorAll(LIST_SELECTOR);
    if (lists.length === 0) return;
    decorate(lists);
    ensureBar();
    if (!state2.loading && Date.now() >= state2.nextPollAt) {
      poll();
    }
  }
  function stop2() {
    clearInterval(ticker2);
    ticker2 = null;
    const bar = document.getElementById(BAR_ID2);
    if (bar) bar.remove();
    clearAll2();
    memos.clear();
    clearTimeout(uploadTimer2);
    uploadTimer2 = null;
    for (const source of SOURCES) pending2[source].clear();
    LogInfo("War board stopped");
  }
  function init5() {
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
    init: init5
  };

  // src/features/recruiting.js
  var RECRUITING_PERMISSION = "recruiting.predict";
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
  async function checkAndInsertReputation() {
    if (!IsPage(PageType.Profile)) {
      return;
    }
    if (!SettingsManager.isReputationVisible()) {
      return;
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
    const reputationSection = document.createElement("div");
    reputationSection.classList.add("nfh-category-list");
    reputationSection.style.marginTop = "10px";
    reputationSection.style.borderTop = "1px solid var(--nfh-border)";
    reputationSection.style.paddingTop = "8px";
    const reputationSectionTitle = document.createElement("div");
    reputationSectionTitle.classList.add("nfh-settings-title");
    reputationSectionTitle.style.marginBottom = "6px";
    reputationSectionTitle.textContent = "Reputation Settings";
    const reputationItem = document.createElement("div");
    reputationItem.classList.add("nfh-category-item");
    const reputationCheckbox = document.createElement("input");
    reputationCheckbox.type = "checkbox";
    reputationCheckbox.checked = SettingsManager.isReputationVisible();
    reputationCheckbox.addEventListener("change", function() {
      SettingsManager.setReputationVisible(this.checked);
      const existing = document.querySelector(".nfh-reputation");
      if (this.checked) {
        if (!existing) {
          checkAndInsertReputation();
        }
      } else {
        if (existing) {
          existing.remove();
        }
      }
    });
    const reputationLabel = document.createElement("span");
    reputationLabel.textContent = "Show Reputation box on profiles";
    reputationItem.appendChild(reputationCheckbox);
    reputationItem.appendChild(reputationLabel);
    reputationSection.appendChild(reputationSectionTitle);
    reputationSection.appendChild(reputationItem);
    const closeButton = document.createElement("button");
    closeButton.classList.add("nfh-close-settings");
    closeButton.textContent = "Close";
    closeButton.addEventListener("click", function() {
      panel.style.display = "none";
    });
    panel.appendChild(title);
    panel.appendChild(categoryList);
    panel.appendChild(reputationSection);
    panel.appendChild(closeButton);
    return panel;
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
  function init6() {
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
    init: init6
  };

  // src/features/token-capture.js
  function initTokenCapture() {
    waitForElm("#token").then((elm) => {
      let token = elm.innerText.trim();
      const observer2 = new MutationObserver(() => {
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
      observer2.observe(elm, {
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
    hospital_default,
    faction_buttons_default,
    chain_watch_default,
    ranked_war_default,
    organized_crimes_default
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
    if (hasNativeStorage()) initStorage().then(start);
    else start();
  }
  function start() {
    addStyle(styles_default);
    LogInfo("Nuke Family Helper Script Loaded");
    checkForUpdates();
    for (const store of [shitlistStore, categoriesStore, contractsStore, ocConfigStore]) {
      store.load();
      registerSyncedStore(store);
    }
    initAuth();
    ensureApiToken();
    dispatchFeatures();
    onNavigate(dispatchFeatures);
    checkCacheUpdates();
  }
  main();
})();
