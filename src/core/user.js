import { api } from "./api.js";
import { LogInfo } from "./log.js";

// The logged-in user's nuke.family role and permissions.

const ROLE_CACHE_KEY = "nfhUserRole";
const PERMISSIONS_CACHE_KEY = "nfhUserPermissions";
const PERMISSIONS_CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

// Read the cached role. Lazy (no init step) since nothing needs it at
// startup; the value is refreshed when the user changes their API key or
// forces a refresh from the faction controls page.
export function getUserRole() {
  try {
    const saved = JSON.parse(localStorage.getItem(ROLE_CACHE_KEY) || "null");
    return (saved && saved.role) || "";
  } catch (e) {
    return "";
  }
}

export async function refreshUserRole() {
  try {
    const result = await api("/user/get-own-roles");
    localStorage.setItem(
      ROLE_CACHE_KEY,
      JSON.stringify({ role: result["role"], timestamp: Date.now() }),
    );
    LogInfo("Updated users role from nuke.family in local storage");
  } catch (error) {
    console.error("Error fetching user role:", error);
  }
}

// Fetch the current user's permission list, cached in localStorage for 12h.
// Resolves with the permissions array; on any failure it yields an empty list
// so gated UI simply stays hidden.
export async function getOwnPermissions() {
  try {
    const cached = JSON.parse(localStorage.getItem(PERMISSIONS_CACHE_KEY));
    if (
      cached &&
      Array.isArray(cached.permissions) &&
      cached.timestamp &&
      Date.now() - cached.timestamp < PERMISSIONS_CACHE_TTL_MS
    ) {
      return cached.permissions;
    }
  } catch (e) {
    // fall through to network fetch
  }

  try {
    const result = await api("/user/get-own-permissions");
    const permissions = result["permissions"] || [];
    localStorage.setItem(
      PERMISSIONS_CACHE_KEY,
      JSON.stringify({ permissions, timestamp: Date.now() }),
    );
    return permissions;
  } catch (error) {
    console.error("Error fetching permissions:", error);
    return [];
  }
}

// Drop the cached permissions and refetch them immediately.
export async function refreshPermissions() {
  localStorage.removeItem(PERMISSIONS_CACHE_KEY);
  return getOwnPermissions();
}
