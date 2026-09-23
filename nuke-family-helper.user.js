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
      return !!window.GM_info && !!window.GM_info.scriptHandler && window.GM_info.scriptHandler.toLowerCase().includes("tornpda");
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
              PDA_httpGet(url).then(res).catch(rej);
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
`;

  // src/core/config.js
  var DEBUG = false;
  var DEFAULT_VERSION = "2.18.1";
  var CURRENT_VERSION = typeof GM_info !== "undefined" && GM_info.script && GM_info.script.version ? GM_info.script.version : DEFAULT_VERSION;
  var API_URL = DEBUG ? "http://nuke.test/api" : "https://nuke.family/api";
  var TOKEN_GENERATION_URL = DEBUG ? "http://nuke.test/auth/token-generation" : "https://nuke.family/auth/token-generation";
  var GITHUB_URL = "https://github.com/Fog-Development/nuke-family-helper-script/raw/master/nuke-family-helper.user.js";

  // src/core/auth.js
  var apiToken = "";
  var RETURN_URL_KEY = "nfhTokenReturnUrl";
  function initAuth() {
    apiToken = GM_getValue("apiToken", "");
  }
  function getApiToken() {
    return apiToken;
  }
  function setApiToken(token) {
    apiToken = token;
    GM_setValue("apiToken", token);
  }
  function ensureApiToken() {
    if (apiToken) return;
    if (!GM_getValue("apiTokenFirstTime", false)) {
      GM_setValue("apiTokenFirstTime", true);
      const goNow = confirm(
        "No Nuke.Family API key set yet. You need a https://nuke.family account (create one if needed) and a key.\n\nPress OK to go to nuke.family now. Your key will be saved automatically and you'll be brought back to this page."
      );
      if (goNow) {
        GM_setValue(RETURN_URL_KEY, window.location.href);
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
    const url = GM_getValue(RETURN_URL_KEY, "");
    if (!url) return null;
    GM_setValue(RETURN_URL_KEY, "");
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
  function request(details) {
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        ...details,
        onload: resolve,
        onerror: reject,
        ontimeout: reject
      });
    });
  }
  var ApiError = class extends Error {
    constructor(message, status, body) {
      super(message);
      this.name = "ApiError";
      this.status = status;
      this.body = body;
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
    if (response.status >= 200 && response.status < 300) {
      return JSON.parse(response.responseText);
    }
    let body = null;
    try {
      body = JSON.parse(response.responseText);
    } catch (e) {
    }
    throw new ApiError(
      `API ${method} ${path} failed with status ${response.status}`,
      response.status,
      body
    );
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
      const observer = new MutationObserver(() => {
        const elm = document.querySelector(selector);
        if (elm) {
          resolve(elm);
          observer.disconnect();
        }
      });
      observer.observe(document.body, {
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
    [PageType.FactionControlApplications]: "tab=controls&option=application"
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
    let pending = null;
    try {
      pending = JSON.parse(localStorage.getItem("nfhPendingUpdate"));
    } catch (e) {
      pending = null;
    }
    if (!pending || pending.version !== githubVersion) {
      localStorage.setItem(
        "nfhPendingUpdate",
        JSON.stringify({ version: githubVersion, firstSeen: now })
      );
      return false;
    }
    return now - pending.firstSeen >= UPDATE_NOTIFY_GRACE_PERIOD;
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
    const store = {
      serverField,
      fallbackTtlMs,
      get data() {
        return data;
      },
      get timestamp() {
        return timestamp;
      },
      // Assignable hook, called with the fresh data after every successful
      // refresh. Assigned by feature modules (kept assignable rather than a
      // constructor arg to avoid circular imports between data and UI modules).
      onUpdate: null,
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
          store.onUpdate?.(data);
        } catch (error) {
          console.error(`Error refreshing ${storageKey}:`, error);
        }
      }
    };
    return store;
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
  contractsStore.onUpdate = () => maybeInsertActiveContract();
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

  // src/features/faction-buttons.js
  var CONTAINER_SELECTOR = "#faction-controls > hr";
  var CHANGE_KEY_ID = "nfh-change-key-btn";
  var CHECK_UPDATES_ID = "nfh-check-updates-btn";
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
  function init() {
    ensureInjected({
      containerSelector: CONTAINER_SELECTOR,
      isPresent: () => !!document.getElementById(CHANGE_KEY_ID),
      inject: (container) => {
        container.appendChild(buildChangeKeyButton());
        container.appendChild(buildCheckUpdatesButton());
        LogInfo("Faction control buttons inserted");
      }
    });
  }
  var faction_buttons_default = {
    name: "faction-buttons",
    pages: [PageType.FactionControl],
    init
  };

  // src/core/settings.js
  var SettingsManager = {
    getHiddenCategories: () => {
      try {
        return JSON.parse(
          localStorage.getItem("hiddenShitlistCategories") || "[]"
        );
      } catch (e) {
        console.error("Error parsing hidden categories:", e);
        return [];
      }
    },
    setHiddenCategories: (hiddenIds) => {
      localStorage.setItem("hiddenShitlistCategories", JSON.stringify(hiddenIds));
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
        const stored = localStorage.getItem("nfhShowReputation");
        return stored === null ? true : stored === "true";
      } catch (e) {
        return true;
      }
    },
    setReputationVisible: (isVisible) => {
      localStorage.setItem("nfhShowReputation", String(isVisible));
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
      const playerLink = li.querySelector('a.user.name[href*="profiles.php"]');
      if (playerLink && playerLink.href) {
        const playerMatch = playerLink.href.match(/XID=(\d+)/);
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
    const listItems = userInfoList.querySelectorAll("li");
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
  function init2() {
    if (isHospitalObserverSetup) return;
    isHospitalObserverSetup = true;
    LogInfo("Setting up hospital observer...");
    waitForElm(".user-info-list-wrap").then((userInfoList) => {
      LogInfo("Hospital list found, processing initial rows...");
      processHospitalRows();
      const observer = new MutationObserver(() => {
        LogInfo("Hospital list changed, reprocessing rows...");
        processHospitalRows();
      });
      observer.observe(userInfoList, {
        childList: true,
        subtree: true
      });
      LogInfo("Hospital observer active");
    });
  }
  var hospital_default = {
    name: "hospital",
    pages: [PageType.Hospital],
    init: init2
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
  shitlistStore.onUpdate = () => renderShitList();
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
  function init3() {
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
    init: init3
  };

  // src/features/token-capture.js
  function initTokenCapture() {
    waitForElm("#token").then((elm) => {
      let token = elm.innerText.trim();
      const observer = new MutationObserver(() => {
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
      observer.observe(elm, {
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
    faction_buttons_default
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
      initTokenCapture();
      return;
    }
    addStyle(styles_default);
    LogInfo("Nuke Family Helper Script Loaded");
    checkForUpdates();
    for (const store of [shitlistStore, categoriesStore, contractsStore]) {
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
