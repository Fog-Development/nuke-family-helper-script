// Running code in Torn's own page, rather than the userscript's sandbox.
//
// Torn sends a Content-Security-Policy that only lets inline scripts run when
// they carry the page's nonce (`script-src 'nonce-…'`), so a plain added
// <script> tag is blocked ("The page's settings blocked an inline script").
// runInPage() copies the nonce from one of Torn's own scripts onto ours. The
// script still only runs code we wrote; this just lets it run where Torn's
// own code does.
//
// pageWindow() is the page's window where the userscript manager hands it to
// us (`unsafeWindow`, granted in the header; TornPDA runs scripts in the page,
// so there it is plain `window`). Reading page objects through it (TinyMCE)
// needs no script tag at all.

let nonce;

export function pageNonce() {
  if (nonce !== undefined) return nonce;
  nonce = null;
  for (const script of document.querySelectorAll("script")) {
    // Browsers hide the attribute's value after loading; the property keeps it.
    const value = script.nonce || script.getAttribute("nonce");
    if (value) {
      nonce = value;
      break;
    }
  }
  return nonce;
}

// Add `source` to the page as a script and run it there at once.
export function runInPage(source) {
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

export function pageWindow() {
  try {
    // eslint-disable-next-line no-undef
    if (typeof unsafeWindow !== "undefined" && unsafeWindow) return unsafeWindow;
  } catch (error) {
    // not offered here
  }
  return window;
}
