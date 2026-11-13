// Torn's rich text editor (mail compose, faction newsletter) is TinyMCE in
// inline mode: a `contenteditable` element with class `mce-content-body`,
// wrapped in a React component that also keeps a hidden HTML source textarea.
//
// Writing the element's HTML directly would leave TinyMCE (and React) holding
// the old content, so reading and writing go through TinyMCE's own
// getContent()/setContent() in the page: a userscript's window may be a
// sandbox that can't see the page's `tinymce`. A small script tag runs in the
// page and answers requests made with DOM events (strings only, so they cross
// any sandbox). Where TinyMCE can't be found (a page without it, or the test
// harness, where Torn's scripts don't run) the element itself is used.
//
// Nothing here talks to Torn: it only changes what is in the editor, on the
// member's click.

const REQUEST = "nfh:editor-request";
const RESPONSE = "nfh:editor-response";
const TIMEOUT_MS = 1500;

let bridgeInstalled = false;
let nextId = 1;

// Runs in the page, as the text of a script tag.
function pageBridge(requestEvent, responseEvent) {
  if (window.__nfhEditorBridge) return;
  window.__nfhEditorBridge = true;

  document.addEventListener(requestEvent, (event) => {
    let request;
    try {
      request = JSON.parse(event.detail);
    } catch (error) {
      return;
    }
    const element = document.getElementById(request.elementId);
    const mce = window.tinymce;
    let editor = null;
    try {
      editor = mce ? mce.get(request.elementId) || (mce.activeEditor && mce.activeEditor.getElement() === element ? mce.activeEditor : null) : null;
    } catch (error) {
      editor = null;
    }
    let answer = { id: request.id, ok: true, via: editor ? "tinymce" : "element" };
    try {
      if (request.op === "get") {
        answer.html = editor ? editor.getContent() : element ? element.innerHTML : "";
      } else if (request.op === "set") {
        if (editor) {
          editor.focus();
          if (editor.undoManager) editor.undoManager.transact(() => editor.setContent(request.html));
          else editor.setContent(request.html);
          editor.fire("change");
          editor.fire("input");
          if (editor.nodeChanged) editor.nodeChanged();
        } else if (element) {
          element.innerHTML = request.html;
          element.dispatchEvent(new Event("input", { bubbles: true }));
        } else {
          answer = { id: request.id, ok: false, error: "The editor was not found." };
        }
      }
    } catch (error) {
      answer = { id: request.id, ok: false, error: String((error && error.message) || error) };
    }
    document.dispatchEvent(new CustomEvent(responseEvent, { detail: JSON.stringify(answer) }));
  });
}

function installBridge() {
  if (bridgeInstalled) return;
  bridgeInstalled = true;
  const tag = document.createElement("script");
  tag.textContent = `(${pageBridge.toString()})(${JSON.stringify(REQUEST)}, ${JSON.stringify(RESPONSE)});`;
  (document.head || document.documentElement).appendChild(tag);
  tag.remove();
}

function ask(elementId, op, html) {
  installBridge();
  const id = nextId++;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      document.removeEventListener(RESPONSE, listener);
      reject(new Error("The editor did not answer."));
    }, TIMEOUT_MS);
    function listener(event) {
      let answer;
      try {
        answer = JSON.parse(event.detail);
      } catch (error) {
        return;
      }
      if (answer.id !== id) return;
      clearTimeout(timer);
      document.removeEventListener(RESPONSE, listener);
      if (answer.ok) resolve(answer);
      else reject(new Error(answer.error || "The editor refused."));
    }
    document.addEventListener(RESPONSE, listener);
    document.dispatchEvent(new CustomEvent(REQUEST, { detail: JSON.stringify({ id, op, elementId, html }) }));
  });
}

// The editable element inside `root` (the compose form or newsletter).
export function findEditor(root) {
  return root ? root.querySelector('.mce-content-body[contenteditable="true"], [contenteditable="true"]') : null;
}

export async function getEditorHtml(element) {
  if (!element) throw new Error("The editor was not found.");
  if (!element.id) return element.innerHTML;
  return (await ask(element.id, "get")).html ?? "";
}

export async function setEditorHtml(element, html) {
  if (!element) throw new Error("The editor was not found.");
  if (!element.id) {
    element.innerHTML = html;
    element.dispatchEvent(new Event("input", { bubbles: true }));
    return;
  }
  await ask(element.id, "set", html);
}

// Whether the editor holds anything worth keeping (text or a picture).
export function editorHasContent(element) {
  if (!element) return false;
  return element.textContent.trim() !== "" || element.querySelector("img") !== null;
}

// Set a text input React (or anything else) controls: the native setter, then
// the events a typed change fires, so the page's own state follows.
export function setInputValue(input, value) {
  if (!input) return;
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
  setter.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}
