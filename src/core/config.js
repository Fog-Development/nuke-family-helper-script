// Build-time constants. __DEBUG__ and __VERSION__ are injected by build.mjs
// (see the `define` option): __VERSION__ comes from package.json, and
// __DEBUG__ is true only for `npm run watch:debug` builds.
export const DEBUG = __DEBUG__;

const DEFAULT_VERSION = __VERSION__;
export const CURRENT_VERSION =
  typeof GM_info !== "undefined" && GM_info.script && GM_info.script.version
    ? GM_info.script.version
    : DEFAULT_VERSION;

export const API_URL = DEBUG
  ? "http://nuke.test/api"
  : "https://nuke.family/api";

export const TOKEN_GENERATION_URL = DEBUG
  ? "http://nuke.test/auth/token-generation"
  : "https://nuke.family/auth/token-generation";

export const GITHUB_URL =
  "https://github.com/Fog-Development/nuke-family-helper-script/raw/master/nuke-family-helper.user.js";
