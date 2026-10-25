import { formatStats } from "../ranked-war/logic.js";

// Battle stat estimates beside a retal's enemy, for members who run BSP or FF
// Scouter. Never ours: what those scripts drew on the enemy's row in Torn's
// recent attacks is copied onto our row and kept for the retal's lifetime.
// For an enemy whose row was never on screen, BSP's own cached prediction for
// that one player is shown as a plain tag (BSP colours its tag against the
// member's own stats, which we cannot know).
//
// Nothing else of BSP's or FF Scouter's is read: their settings and keys
// (FF Scouter keeps the member's API key under `ffsv3-*`) are never touched.

const BSP_TAG = ".iconStats, .iconStatsAttack";
const FFS_GAUGE = "ffscouter-gauge";
const FFS_MARKER = ".ffscouter-marker-wrapper";

// enemyId -> { bsp: Element|null, ffs: { percent, side, mode, marker: Element|null }|null }
const copied = new Map();

// Torn's name box for a player in the chain box's attack lists.
function tornNameBox(enemyId) {
  const links = document.querySelectorAll(`.chain-attacks-list a[href*="XID=${enemyId}"]`);
  for (const link of links) {
    if (new URL(link.href, location.href).searchParams.get("XID") !== String(enemyId)) continue;
    const box = link.closest('[class*="userInfoBox"]');
    if (box && !box.closest("#nfh-retals")) return box;
  }
  return null;
}

// Copy what BSP and FF Scouter drew for each enemy, while their row is there.
export function captureTags(retals) {
  for (const retal of retals) {
    const id = retal.enemy_id;
    const box = tornNameBox(id);
    if (!box) continue;
    const had = copied.get(id) || { bsp: null, ffs: null };

    const bsp = box.querySelector(BSP_TAG);
    const ffs = box.classList.contains(FFS_GAUGE)
      ? {
          percent: box.style.getPropertyValue("--band-percent"),
          side: box.dataset.ffscouterBandSide || "",
          mode: box.dataset.ffscouterAttachMode || "",
          marker: box.querySelector(FFS_MARKER),
        }
      : null;

    copied.set(id, {
      bsp: bsp ? bsp.cloneNode(true) : had.bsp,
      ffs: ffs ? { ...ffs, marker: ffs.marker ? ffs.marker.cloneNode(true) : null } : had.ffs,
    });
  }
}

// BSP's cached prediction for one player, if BSP has one.
function bspCached(enemyId) {
  try {
    const stored = JSON.parse(localStorage.getItem(`tdup.battleStatsPredictor.cache.prediction.${enemyId}`) || "null");
    const total = Number(stored && stored.TBS);
    return total > 0 ? total : null;
  } catch (e) {
    return null;
  }
}

// Put the tags on our rows' name wrappers (`[data-nfh-tag]`), after the list
// was drawn.
export function applyTags(root) {
  for (const wrapper of root.querySelectorAll("[data-nfh-tag]")) {
    const id = Number(wrapper.dataset.nfhTag);
    const tags = copied.get(id);

    if (tags && tags.bsp) {
      wrapper.prepend(tags.bsp.cloneNode(true));
    } else {
      const total = bspCached(id);
      if (total) {
        const tag = document.createElement("span");
        tag.className = "nfh-rt-bsp";
        tag.title = "Battle Stats Predictor estimate";
        tag.textContent = formatStats(total);
        wrapper.prepend(tag);
      }
    }

    if (tags && tags.ffs) {
      wrapper.classList.add(FFS_GAUGE);
      if (tags.ffs.percent) wrapper.style.setProperty("--band-percent", tags.ffs.percent);
      if (tags.ffs.side) wrapper.dataset.ffscouterBandSide = tags.ffs.side;
      if (tags.ffs.mode) wrapper.dataset.ffscouterAttachMode = tags.ffs.mode;
      if (tags.ffs.marker) wrapper.append(tags.ffs.marker.cloneNode(true));
    }
  }
}

// Forget enemies no longer on the list.
export function forgetTags(retals) {
  const keep = new Set(retals.map((retal) => retal.enemy_id));
  for (const id of copied.keys()) if (!keep.has(id)) copied.delete(id);
}

// For tests and debugging: what is held for an enemy.
export function tagsFor(enemyId) {
  return copied.get(enemyId) || null;
}
