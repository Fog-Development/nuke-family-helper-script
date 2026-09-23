import { setApiToken, takeTokenReturnUrl } from "../core/auth.js";
import { waitForElm } from "../core/dom.js";

// On the nuke.family token-generation page: watch the #token element and save
// its value to GM storage when the page's own JavaScript fills it in. If the
// user was sent here by the first-run flow, take them back to Torn afterwards.
//
// This is the only thing the script does on nuke.family; main.js calls it
// directly instead of running the Torn-side bootstrap.
export function initTokenCapture() {
  // The #token element already exists on the page; wait until its text
  // changes (the change comes from JavaScript on the page, not user input),
  // then save the token.
  waitForElm("#token").then((elm) => {
    let token = elm.innerText.trim();

    // One check per callback, not per mutation: a single token render can
    // produce several mutation records, which used to mean several alerts.
    const observer = new MutationObserver(() => {
      const newToken = elm.innerText.trim();
      if (!newToken || newToken === token) return;

      token = newToken;
      setApiToken(newToken);

      const returnUrl = takeTokenReturnUrl();
      if (returnUrl) {
        alert(
          "Nuke Family API token saved! Taking you back to Torn.\n\n" +
            'If you need to change it later, use the "Change Nuke Family Key" ' +
            'button on the faction "controls" page.',
        );
        window.location.href = returnUrl;
      } else {
        alert("Nuke Family API token saved. You can now close this tab.");
      }
    });

    observer.observe(elm, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  });
}
