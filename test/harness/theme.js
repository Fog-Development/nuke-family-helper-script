// Theme helpers. Torn's theme switch is a `dark-mode` class on <body>; light
// mode is the absence of it. The script's CSS variables key off that class, so
// toggling it is a faithful way to exercise both themes.
export const THEMES = ["light", "dark"];

export async function setTheme(page, theme) {
  await page.evaluate((t) => {
    document.body.classList.toggle("dark-mode", t === "dark");
  }, theme);
}

function luminance([r, g, b]) {
  const f = (c) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

export function contrastRatio(fg, bg) {
  const [a, b] = [luminance(fg), luminance(bg)].sort((x, y) => y - x);
  return (a + 0.05) / (b + 0.05);
}

// Decode a PNG buffer to pixels using the browser itself (no image library
// needed) and return the darkest and lightest sampled pixel as [r,g,b].
async function pixelExtremes(page, png) {
  return page.evaluate(async (b64) => {
    const blob = await (await fetch(`data:image/png;base64,${b64}`)).blob();
    const bmp = await createImageBitmap(blob);
    const canvas = new OffscreenCanvas(bmp.width, bmp.height);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(bmp, 0, 0);
    const { data } = ctx.getImageData(0, 0, bmp.width, bmp.height);
    const lum = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
    let dark = null;
    let light = null;
    for (let i = 0; i < data.length; i += 4) {
      const px = [data[i], data[i + 1], data[i + 2]];
      if (!dark || lum(...px) < lum(...dark)) dark = px;
      if (!light || lum(...px) > lum(...light)) light = px;
    }
    return { dark, light };
  }, png.toString("base64"));
}

// WCAG contrast of an element's text against what is actually painted behind
// it. Torn paints titles/buttons with gradient images, so the background is
// sampled from a screenshot taken with the element's text made transparent.
// Contrast is the worst case across the sampled background (darkest and
// lightest pixel). Returns { ratio, fg, bgDark, bgLight }.
export async function measureContrast(page, selector) {
  const target = page.locator(selector).first();
  const fg = await target.evaluate((el) => {
    const parse = (s) => (s.match(/[\d.]+/g) || []).map(Number);
    return parse(getComputedStyle(el).color).slice(0, 3);
  });
  await target.evaluate((el) => {
    el.dataset.nfhPrevStyle = el.getAttribute("style") ?? "";
    el.style.setProperty("color", "transparent", "important");
    el.style.setProperty("text-shadow", "none", "important");
    el.querySelectorAll("*").forEach((child) => {
      child.style.setProperty("color", "transparent", "important");
    });
  });
  // Sample only the inner area: rounded corners expose the page behind the
  // element, which is not what the text sits on.
  await target.scrollIntoViewIfNeeded();
  const box = await target.boundingBox();
  const inset = Math.min(4, box.width / 4, box.height / 4);
  const png = await page.screenshot({
    clip: {
      x: box.x + inset,
      y: box.y + inset,
      width: box.width - 2 * inset,
      height: box.height - 2 * inset,
    },
  });
  await target.evaluate((el) => {
    el.setAttribute("style", el.dataset.nfhPrevStyle);
    delete el.dataset.nfhPrevStyle;
    el.querySelectorAll("*").forEach((child) => child.style.removeProperty("color"));
  });
  const { dark, light } = await pixelExtremes(page, png);
  const ratio = Math.min(contrastRatio(fg, dark), contrastRatio(fg, light));
  return { ratio, fg, bgDark: dark, bgLight: light };
}
