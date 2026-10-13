import { API_URL } from "./config.js";
import { getApiToken, noteAnswer, noteKeyRejected, noteNoAnswer } from "./auth.js";

// How much of an unreadable reply is kept for a debug report.
const SNIPPET_LENGTH = 200;

function snippet(text) {
  return typeof text === "string" ? text.trim().slice(0, SNIPPET_LENGTH) : null;
}

// A request that got no usable answer. `kind` says how:
//   "network"  the userscript manager reported an error (offline, blocked, ...)
//   "timeout"  nothing came back in time
//   "empty"    the manager answered with nothing at all
//   "not_json" a reply arrived that is not the JSON the API sends (a block or
//              challenge page, usually); `status` and `detail` say what it was
export class NoAnswerError extends Error {
  constructor(kind, detail = null, status = null) {
    super(`Request got no usable answer (${kind})`);
    this.name = "NoAnswerError";
    this.kind = kind;
    this.detail = detail;
    this.status = status;
  }
}

// What a userscript manager handed to onerror/ontimeout, as text. Tampermonkey
// passes a response-like object with an `error` string, TornPDA an Error.
function failureDetail(failure) {
  if (!failure) return null;
  if (typeof failure === "string") return snippet(failure);
  return snippet(failure.error || failure.message || failure.statusText || "") || null;
}

// Promise wrapper around GM_xmlhttpRequest. Resolves with the raw response
// object; rejects with a NoAnswerError on network error or timeout.
export function request(details) {
  return new Promise((resolve, reject) => {
    GM_xmlhttpRequest({
      ...details,
      onload: resolve,
      onerror: (failure) => reject(new NoAnswerError("network", failureDetail(failure))),
      ontimeout: (failure) => reject(new NoAnswerError("timeout", failureDetail(failure))),
    });
  });
}

export class ApiError extends Error {
  constructor(message, status, body, raw = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    // Parsed JSON error body when the server returned one, else null.
    this.body = body;
    // The start of a body that was not JSON (a block page, say), else null.
    this.raw = raw;
  }
}

// Authenticated JSON call to the nuke.family API. Returns the parsed response
// body on 2xx; throws ApiError (with .status and .body) on a non-2xx status,
// or NoAnswerError when nothing usable came back.
//
// The userscript manager makes the request, not the page, so it is not bound
// by the page's cross-origin rules. `pageRequest()` below is the other way.
//
// `token` sends another key than the stored one ("" for none, on the routes
// that need none). Only calls made with the stored key count towards whether
// the script is connected (see auth.js).
export async function api(path, { method = "GET", data = undefined, token = undefined } = {}) {
  const stored = token === undefined;
  const key = stored ? getApiToken() : token;
  const headers = { Accept: "application/json" };
  if (key) headers.Authorization = "Bearer " + key;
  if (data !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  let response;
  try {
    response = await request({
      method,
      url: API_URL + path,
      headers,
      data: data !== undefined ? JSON.stringify(data) : undefined,
    });
  } catch (error) {
    if (stored && key) noteNoAnswer();
    throw error;
  }

  if (stored && key && response && typeof response.status === "number") {
    if (response.status === 401) noteKeyRejected();
    else noteAnswer();
  }
  return readReply(response, method, path);
}

// A call to a route that needs no key, tried through the userscript manager
// and, when that gets no answer, from the page itself.
export async function publicApi(path, options = {}) {
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
    // Not JSON; handled below.
  }

  if (response.status >= 200 && response.status < 300) {
    if (!parsed) throw new NoAnswerError("not_json", snippet(response.responseText), response.status);
    return body;
  }
  throw new ApiError(
    `API ${method} ${path} failed with status ${response.status}`,
    response.status,
    body,
    parsed ? null : snippet(response.responseText),
  );
}

// The same call made by the page itself with fetch(), never with the key. It
// only works for routes that need no key, and is for when the userscript
// manager's own requests are not getting through (seen on TornPDA): the debug
// report uses it to tell that apart from nuke.family being unreachable, and
// to still get a report out.
export async function pageRequest(path, { method = "GET", data = undefined } = {}) {
  let reply;
  try {
    reply = await fetch(API_URL + path, {
      method,
      headers: data !== undefined ? { Accept: "application/json", "Content-Type": "application/json" } : undefined,
      body: data !== undefined ? JSON.stringify(data) : undefined,
      credentials: "omit",
    });
  } catch (error) {
    throw new NoAnswerError("network", failureDetail(error));
  }
  return readReply({ status: reply.status, responseText: await reply.text() }, method, path);
}
