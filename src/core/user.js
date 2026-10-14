import { api } from "./api.js";
import { getApiToken } from "./auth.js";
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
      JSON.stringify({
        role: result["role"],
        // Absent from an older site: unknown, not "no".
        reviving: typeof result["in_reviving_faction"] === "boolean" ? result["in_reviving_faction"] : null,
        timestamp: Date.now(),
      }),
    );
    LogInfo("Updated users role from nuke.family in local storage");
    for (const listener of roleListeners) listener();
  } catch (error) {
    console.error("Error fetching user role:", error);
  }
}

const roleListeners = [];

// Called after the role (and reviving faction) is fetched again.
export function onUserRoleRefreshed(listener) {
  roleListeners.push(listener);
}

let staleRefreshStarted = false;

// Whether the member is in a reviving faction: true, false, or null when not
// known yet. Members change faction, so a cached answer older than the
// permissions' 12 hours is fetched again in the background, once per page.
export function inRevivingFaction() {
  let saved = null;
  try {
    saved = JSON.parse(localStorage.getItem(ROLE_CACHE_KEY) || "null");
  } catch (e) {
    // fall through to a refetch
  }
  const known = saved && typeof saved.reviving === "boolean";
  const fresh = known && saved.timestamp && Date.now() - saved.timestamp < PERMISSIONS_CACHE_TTL_MS;
  if (!fresh && !staleRefreshStarted && getApiToken()) {
    staleRefreshStarted = true;
    refreshUserRole();
  }
  return known ? saved.reviving : null;
}

// Lets a member check a player's recruiting score from the profile's
// reputation box.
export const RECRUITING_PERMISSION = "recruiting.predict";

// The cached permission list whatever its age, or null when there is none.
// For settings that must be decided without waiting; getOwnPermissions()
// fetches a fresh copy when this one is stale.
export function cachedPermissions() {
  try {
    const cached = JSON.parse(localStorage.getItem(PERMISSIONS_CACHE_KEY));
    return cached && Array.isArray(cached.permissions) ? cached.permissions : null;
  } catch (e) {
    return null;
  }
}

const permissionListeners = [];

// Called after the permissions are fetched again.
export function onPermissionsRefreshed(listener) {
  permissionListeners.push(listener);
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
    for (const listener of permissionListeners) listener();
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
