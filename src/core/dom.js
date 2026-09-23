export function addStyle(styleString) {
  const style = document.createElement("style");
  style.textContent = styleString;
  document.head.append(style);
}

export function waitForElm(selector) {
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
      subtree: true,
    });
  });
}

// Keep an injected element present in a container that the page may rebuild.
//
// Torn re-renders whole tab panels asynchronously after a hash navigation, so
// a single inject-once-on-navigation attempt can either run against the
// about-to-be-replaced DOM or land before the panel exists. This waits for the
// container, injects when `isPresent()` is false, and then re-checks on a
// short bounded schedule so a rebuild that wipes our element gets repaired.
// The schedule is deliberately finite: the feature dispatcher re-arms it on
// every navigation, so nothing observes the page indefinitely.
export function ensureInjected({
  containerSelector,
  isPresent,
  inject,
  attempts = 12,
  intervalMs = 300,
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

// Escape a value for safe interpolation into an HTML string. Anything that
// originates from the API or from user input must go through this before
// being placed in innerHTML.
export function escapeHtml(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
