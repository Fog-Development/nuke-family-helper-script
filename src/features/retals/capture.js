import { LogInfo } from "../../core/log.js";

// Hears Torn's own chain feed (the recent attacks under the chain box) on the
// member's faction page. The script never asks Torn for anything: it only
// reads what Torn's page already fetched.
//
// The reading happens in the page itself, through a small script tag, because
// a userscript's own window may be a sandbox that cannot see the page's
// requests or React's data on its elements. The page side hands the feed back
// as a JSON string in a DOM event, which crosses that boundary in every
// userscript manager and in TornPDA.
//
// Two ways in, both on at once (the controller ignores attacks it has seen):
// - Torn's `getwardata` poll (every 5-10s while the chain box is open), heard
//   by wrapping the page's XMLHttpRequest and fetch. This misses the first
//   load, which happens before the script runs.
// - The React props behind Torn's recent attacks list, read every 2s while
//   the list is on the page. This catches the first load, and covers the case
//   where wrapping the page's requests does not work.

const EVENT = "nfh:chain-feed";

let started = false;

// Runs in the page, so it must not use anything from outside its own body.
function pageTap(eventName) {
  if (window.__nfhChainFeedTap) return;
  window.__nfhChainFeedTap = true;

  // Only the attacks and the players they name, not the rest of the war data.
  const pick = (feed, factionId) => {
    const attacks = feed.recentAttacks;
    const users = {};
    const all = feed.users || {};
    for (const attack of attacks) {
      for (const id of [attack.attackerID, attack.defenderID, attack.firstUserID]) {
        if (id && all[id]) users[id] = all[id];
      }
    }
    return { recentAttacks: attacks, users, userFactionID: factionId ?? feed.userFactionID ?? null };
  };

  const send = (source, detail) => {
    try {
      document.dispatchEvent(new CustomEvent(eventName, { detail: JSON.stringify({ source, ...detail }) }));
    } catch (e) {
      // Nothing to do: the next poll tries again.
    }
  };

  // Where in Torn's answer the feed sits is not known for sure, so look a few
  // levels down for the object holding `recentAttacks`.
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

  const isChainFeed = (url) =>
    /faction_wars\.php/.test(url) && /step=getwardata/.test(url) && /wardescid=chain/.test(url);

  try {
    const open = XMLHttpRequest.prototype.open;
    const sendRequest = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function (method, url) {
      this.__nfhChainFeed = isChainFeed(String(url));
      return open.apply(this, arguments);
    };
    XMLHttpRequest.prototype.send = function () {
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
      window.fetch = function (input) {
        const answer = pageFetch.apply(this, arguments);
        try {
          const url = typeof input === "string" ? input : input && input.url;
          if (url && isChainFeed(String(url))) {
            answer.then((response) => response.clone().text()).then((text) => fromBody("fetch", text)).catch(() => {});
          }
        } catch (e) {
          // Leave the page's request alone.
        }
        return answer;
      };
    }
  } catch (e) {
    send("fetch", { feed: null, error: "wrap_failed" });
  }

  // A list Torn has just drawn (the chain box opened again) is passed on even
  // when its attacks are the ones already seen, so the retal list comes back.
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
        const seen = props.warDesc.recentAttacks.map((attack) => attack.publicID).join(",");
        if (seen !== lastSeen) {
          lastSeen = seen;
          send("react", { feed: pick(props.warDesc, props.userFactionID) });
        }
        return;
      }
    }
  }, 2000);
}

// Start hearing the chain feed. `onFeed(feed, source)` gets Torn's raw recent
// attacks ({ recentAttacks, users, userFactionID }); safe to call again.
export function startCapture(onFeed) {
  if (started) return;
  started = true;

  document.addEventListener(EVENT, (event) => {
    let detail;
    try {
      detail = JSON.parse(event.detail);
    } catch (e) {
      return;
    }
    if (!detail.feed) {
      LogInfo("[retals] chain feed answer without attacks", detail);
      return;
    }
    onFeed(detail.feed, detail.source, detail.keys);
  });

  const tag = document.createElement("script");
  tag.textContent = `(${pageTap.toString()})(${JSON.stringify(EVENT)});`;
  (document.head || document.documentElement).appendChild(tag);
  tag.remove();
}
