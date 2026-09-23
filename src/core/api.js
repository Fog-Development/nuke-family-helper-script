import { API_URL } from "./config.js";
import { getApiToken } from "./auth.js";

// Promise wrapper around GM_xmlhttpRequest. Resolves with the raw response
// object; rejects on network error or timeout.
export function request(details) {
  return new Promise((resolve, reject) => {
    GM_xmlhttpRequest({
      ...details,
      onload: resolve,
      onerror: reject,
      ontimeout: reject,
    });
  });
}

export class ApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    // Parsed JSON error body when the server returned one, else null.
    this.body = body;
  }
}

// Authenticated JSON call to the nuke.family API. Returns the parsed response
// body on 2xx; throws ApiError (with .status and .body) on a non-2xx status,
// or the underlying error on network failure.
export async function api(path, { method = "GET", data = undefined } = {}) {
  const headers = {
    Accept: "application/json",
    Authorization: "Bearer " + getApiToken(),
  };
  if (data !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const response = await request({
    method,
    url: API_URL + path,
    headers,
    data: data !== undefined ? JSON.stringify(data) : undefined,
  });

  if (response.status >= 200 && response.status < 300) {
    return JSON.parse(response.responseText);
  }

  let body = null;
  try {
    body = JSON.parse(response.responseText);
  } catch (e) {
    // Non-JSON error body; leave as null.
  }
  throw new ApiError(
    `API ${method} ${path} failed with status ${response.status}`,
    response.status,
    body,
  );
}
