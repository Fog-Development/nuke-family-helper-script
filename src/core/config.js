// Build-time constants, injected by build.mjs (see the `define` option):
// __VERSION__ comes from package.json; __DEBUG__ (console logging) is on for
// `npm run watch:debug` and `watch:debug-site`; __DEBUG_SITE__ (talk to the
// local nuke.test instead of nuke.family) only for `watch:debug-site`, so a
// debug build can log while connected to the real site.
export const DEBUG = __DEBUG__;
export const DEBUG_SITE = __DEBUG_SITE__;

const DEFAULT_VERSION = __VERSION__;
export const CURRENT_VERSION =
  typeof GM_info !== "undefined" && GM_info.script && GM_info.script.version
    ? GM_info.script.version
    : DEFAULT_VERSION;

export const API_URL = DEBUG_SITE
  ? "http://nuke.test/api"
  : "https://nuke.family/api";

export const TOKEN_GENERATION_URL = DEBUG_SITE
  ? "http://nuke.test/auth/token-generation"
  : "https://nuke.family/auth/token-generation";

export const GITHUB_URL =
  "https://github.com/Fog-Development/nuke-family-helper-script/raw/master/nuke-family-helper.user.js";
