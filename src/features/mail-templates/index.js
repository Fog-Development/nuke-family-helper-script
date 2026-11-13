import { ApiError } from "../../core/api.js";
import { connectionState } from "../../core/auth.js";
import { ensureInjected } from "../../core/dom.js";
import { LogInfo } from "../../core/log.js";
import { PageType } from "../../core/pages.js";
import { getUserscriptUsersPlayerId, getUserscriptUsersPlayerName } from "../../core/torn-page.js";
import { editorHasContent, findEditor, getEditorHtml, setEditorHtml, setInputValue } from "../../core/torn-editor.js";
import { deletePersonal, factionMessage, listTemplates, personalBody, pinFaction, renderFaction, savePersonal, updatePersonal } from "./data.js";
import { fill, parseRecipient, tornDate } from "./placeholders.js";
import { renderBar } from "./view.js";

// Mail templates on Torn's compose page and the faction newsletter: a bar
// above the editor with the member's pinned templates, an "All" list, and
// Save. Personal templates are the member's own, kept on nuke.family for them
// alone; Helpers and above also get their faction's mail templates and recent
// faction mail from /faction/mail, rendered by the site the moment they are
// used. Placeholders ({name}, {me}, ...) are filled in from the page.
//
// It only ever changes what is in Torn's editor and subject box, on the
// member's click; sending stays Torn's own button.

const BAR_ID = "nfh-mail-templates";

const PAGES = {
  messages: {
    container: "#editor-form",
    anchor: (container) => container.closest(".mailbox-container") || container,
    root: () => document.getElementById("editor-form"),
    subject: (root) => root && root.querySelector('input[name="subject"]'),
    recipient: (root) => root && root.querySelector('input[name="sendto"]'),
  },
  newsletter: {
    container: "#react-root-faction-newsletter",
    anchor: (container) => container,
    root: () => document.getElementById("react-root-faction-newsletter"),
    subject: (root) => root && root.querySelector('input[class*="titleField"]'),
    recipient: () => null,
  },
};

const state = freshState(null);

function freshState(page) {
  return { page, list: null, loading: false, error: null, open: false, query: "", form: null, confirm: null, help: false, message: null, busy: false, hasSubject: false };
}

function currentPage() {
  const { pathname, hash } = window.location;
  if (pathname === "/messages.php" && /p=compose/.test(hash)) return "messages";
  if (pathname === "/factions.php" && /option=newsletter/.test(hash)) return "newsletter";
  return null;
}

function bar() {
  return document.getElementById(BAR_ID);
}

function render() {
  const element = bar();
  if (!element) return;
  const focused = document.activeElement && element.contains(document.activeElement) ? document.activeElement.dataset.field : null;
  const caret = focused && document.activeElement.selectionStart;
  const page = PAGES[state.page];
  const subject = page && page.subject(page.root());
  state.hasSubject = !!(subject && subject.value.trim());
  element.innerHTML = renderBar(state);
  if (focused) {
    const input = element.querySelector(`[data-field="${focused}"]`);
    if (input) {
      input.focus();
      if (typeof caret === "number" && input.setSelectionRange) input.setSelectionRange(caret, caret);
    }
  }
}

function say(tone, text) {
  state.message = { tone, text };
  render();
}

function describeError(error) {
  if (error instanceof ApiError) {
    if (error.status === 401) return "nuke.family did not accept your key. Reconnect the script.";
    if (error.status === 403) return "You don't have access to that template.";
    if (error.status === 404) return "That template is gone. The list has been refreshed.";
    const reason = error.body && (error.body.error || error.body.message);
    if (reason) return reason;
  }
  return "nuke.family could not be reached. Try again in a moment.";
}

async function load(force = false) {
  if (connectionState() === "missing") {
    state.error = "Connect the script to nuke.family to use templates.";
    render();
    return;
  }
  state.loading = !state.list;
  render();
  try {
    state.list = await listTemplates(state.page, { force });
    state.error = null;
  } catch (error) {
    state.error = describeError(error);
  } finally {
    state.loading = false;
    render();
  }
}

// What placeholders become on this page now.
function placeholderValues() {
  const page = PAGES[state.page];
  const recipient = parseRecipient(page.recipient(page.root())?.value);
  const { date, time } = tornDate();
  return {
    name: recipient.name,
    id: recipient.id,
    me: getUserscriptUsersPlayerName() || null,
    myid: getUserscriptUsersPlayerId() || null,
    date,
    time,
  };
}

async function fetchContent(kind, id) {
  if (kind === "personal") {
    const template = await personalBody(id);
    return { name: template.name, subject: template.subject, html: template.body };
  }
  if (kind === "faction") {
    const template = await renderFaction(id);
    return { name: template.name, subject: template.subject, html: template.html };
  }
  const message = await factionMessage(id);
  return { name: message.subject || "the mail", subject: message.subject, html: message.html };
}

async function insert(content) {
  const page = PAGES[state.page];
  const root = page.root();
  const editor = findEditor(root);
  if (!editor) throw new Error("Torn's editor was not found on the page.");

  const values = placeholderValues();
  const body = fill(content.html, values, { html: true });
  await setEditorHtml(editor, body.text);

  const missing = new Set(body.missing);
  if (content.subject) {
    const subject = fill(content.subject, values);
    subject.missing.forEach((key) => missing.add(key));
    setInputValue(page.subject(root), subject.text);
  }

  if (missing.size) {
    const keys = [...missing].map((key) => `{${key}}`).join(", ");
    const recipientNote = missing.has("name") || missing.has("id") ? " Pick the recipient, then use it again." : "";
    say("warn", `Put "${content.name}" in the editor. ${keys} left as is.${recipientNote}`);
  } else {
    say("ok", `Put "${content.name}" in the editor. Check it, then send it yourself.`);
  }
}

async function use(kind, id, { replace = false } = {}) {
  const editor = findEditor(PAGES[state.page].root());
  if (!replace && editorHasContent(editor)) {
    state.confirm = { action: "use", kind, id, text: "Replace what is in the editor now?", yes: "Replace" };
    render();
    return;
  }
  await busy(async () => {
    const content = await fetchContent(kind, id);
    await insert(content);
  });
}

async function busy(work) {
  if (state.busy) return;
  state.busy = true;
  state.confirm = null;
  render();
  try {
    await work();
  } catch (error) {
    LogInfo("[mail-templates]", error);
    say("error", error instanceof ApiError || !error?.message ? describeError(error) : error.message);
    if (error instanceof ApiError && error.status === 404) load(true);
  } finally {
    state.busy = false;
    render();
  }
}

async function editorContents() {
  const page = PAGES[state.page];
  const root = page.root();
  const editor = findEditor(root);
  if (!editorHasContent(editor)) throw new Error("The editor is empty: write the message first.");
  const html = await getEditorHtml(editor);
  const subject = page.subject(root)?.value.trim() || null;
  return { body: html, subject };
}

function findPersonal(id) {
  return (state.list?.personal || []).find((template) => String(template.id) === String(id));
}

async function onClick(event) {
  const target = event.target.closest("[data-act]");
  if (!target || target.disabled) return;
  const { act, id, kind } = target.dataset;

  switch (act) {
    case "toggle-all":
      state.open = !state.open;
      if (state.open) load();
      render();
      return;
    case "help":
      state.help = !state.help;
      render();
      return;
    case "save":
      state.form = { mode: "save", name: "", scope: state.page };
      state.confirm = null;
      render();
      bar()?.querySelector('[data-field="name"]')?.focus();
      return;
    case "form-cancel":
    case "confirm-no":
      state.form = null;
      state.confirm = null;
      render();
      return;
    case "save-confirm":
      if (!state.form.name.trim()) return say("error", "Give the template a name.");
      return busy(async () => {
        const contents = await editorContents();
        await savePersonal({ name: state.form.name.trim(), scope: state.form.scope, ...contents });
        const name = state.form.name.trim();
        state.form = null;
        await load(true);
        say("ok", `Saved "${name}". Pin it with ☆ under All to keep it on the bar.`);
      });
    case "rename": {
      const template = findPersonal(id);
      if (!template) return;
      state.form = { mode: "rename", id, name: template.name, scope: template.scope };
      render();
      return;
    }
    case "rename-confirm":
      if (!state.form.name.trim()) return say("error", "Give the template a name.");
      return busy(async () => {
        await updatePersonal(id, { name: state.form.name.trim(), scope: state.form.scope });
        state.form = null;
        await load(true);
        say("ok", "Saved.");
      });
    case "overwrite": {
      const template = findPersonal(id);
      if (!template) return;
      state.confirm = { action: "overwrite", id, text: `Replace "${template.name}" with what is in the editor now?`, yes: "Update" };
      render();
      return;
    }
    case "delete": {
      const template = findPersonal(id);
      if (!template) return;
      state.confirm = { action: "delete", id, text: `Delete "${template.name}"? This can't be undone.`, yes: "Delete" };
      render();
      return;
    }
    case "confirm-yes":
      return confirmed();
    case "pin":
      return busy(async () => {
        if (kind === "faction") {
          const template = (state.list?.faction || []).find((entry) => String(entry.id) === String(id));
          await pinFaction(id, !template?.pinned);
        } else {
          await updatePersonal(id, { pinned: !findPersonal(id)?.pinned });
        }
        await load(true);
      });
    case "use":
      return use(kind, id);
    default:
  }
}

async function confirmed() {
  const confirm = state.confirm;
  if (!confirm) return;
  if (confirm.action === "use") return use(confirm.kind, confirm.id, { replace: true });
  if (confirm.action === "overwrite") {
    return busy(async () => {
      const contents = await editorContents();
      await updatePersonal(confirm.id, contents);
      await load(true);
      say("ok", "Updated with what is in the editor.");
    });
  }
  if (confirm.action === "delete") {
    return busy(async () => {
      await deletePersonal(confirm.id);
      await load(true);
      say("ok", "Deleted.");
    });
  }
}

function onInput(event) {
  const field = event.target.dataset.field;
  if (!field) return;
  if (field === "query") {
    state.query = event.target.value;
    render();
  } else if (state.form && (field === "name" || field === "scope")) {
    state.form[field] = event.target.value;
  }
}

function onKeydown(event) {
  if (event.key !== "Enter" || !state.form || event.target.dataset.field !== "name") return;
  event.preventDefault();
  bar()?.querySelector(state.form.mode === "save" ? '[data-act="save-confirm"]' : '[data-act="rename-confirm"]')?.click();
}

function mount(container) {
  const page = PAGES[state.page];
  const element = document.createElement("div");
  element.id = BAR_ID;
  element.className = "nfh-cw nfh-mt";
  element.dataset.page = state.page;
  element.addEventListener("click", onClick);
  element.addEventListener("input", onInput);
  element.addEventListener("change", onInput);
  element.addEventListener("keydown", onKeydown);
  const anchor = page.anchor(container);
  anchor.parentNode.insertBefore(element, anchor);
  render();
  if (!state.list) load();
}

export default {
  name: "Mail templates",
  pages: [PageType.Messages, PageType.FactionNewsletter],
  init() {
    const page = currentPage();
    if (!page) {
      bar()?.remove();
      return;
    }
    if (state.page !== page) Object.assign(state, freshState(page));
    ensureInjected({
      containerSelector: PAGES[page].container,
      isPresent: () => bar()?.dataset.page === page,
      inject: (container) => {
        bar()?.remove();
        mount(container);
      },
    });
  },
};
