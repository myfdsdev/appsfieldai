// HD for YouTube embeds WITHOUT making the box bigger.
//
// YouTube picks the stream from the size of the player's own page (the iframe's
// width and height), and there is no API to force a quality. So the iframe is laid
// out at full 1920×1080 and shrunk with a CSS transform to fit the box. YouTube
// sees a 1080p player and serves the 1080p stream; on screen the box stays the
// same size. Boxes already 1920px or wider are left alone.

const W = 1920;
const H = 1080;

/** Keeps `iframe` rendered at 1920×1080 and scaled to fill `box`. Returns a cleanup function. */
export function keepHd(iframe, box) {
  if (!iframe || !box || typeof ResizeObserver === 'undefined') return () => {};
  const apply = () => {
    const w = box.clientWidth;
    const h = box.clientHeight || (w * 9) / 16;
    if (!w) return;
    const scale = Math.min(w / W, h / H);
    if (scale >= 1) {
      // A big box already gets HD: use it as is.
      ['position', 'top', 'left', 'width', 'height', 'transform', 'transform-origin', 'max-width', 'max-height'].forEach((k) => iframe.style.removeProperty(k));
      return;
    }
    const s = iframe.style;
    s.setProperty('position', 'absolute', 'important');
    s.setProperty('top', `${(h - H * scale) / 2}px`, 'important');
    s.setProperty('left', `${(w - W * scale) / 2}px`, 'important');
    s.setProperty('width', `${W}px`, 'important');
    s.setProperty('height', `${H}px`, 'important');
    s.setProperty('max-width', 'none', 'important');
    s.setProperty('max-height', 'none', 'important');
    s.setProperty('transform', `scale(${scale})`, 'important');
    s.setProperty('transform-origin', '0 0', 'important');
  };
  if (getComputedStyle(box).position === 'static') box.style.position = 'relative';
  box.style.overflow = 'hidden';
  apply();
  const ro = new ResizeObserver(apply);
  ro.observe(box);
  return () => ro.disconnect();
}

/** Waits for an iframe to appear inside `root` (players insert it later), then keeps it HD. */
export function keepHdWhenReady(root, box = root) {
  if (!root) return () => {};
  let stop = () => {};
  const found = root.querySelector('iframe');
  if (found) { stop = keepHd(found, box); return () => stop(); }
  const mo = new MutationObserver(() => {
    const f = root.querySelector('iframe');
    if (f) { mo.disconnect(); stop = keepHd(f, box); }
  });
  mo.observe(root, { childList: true, subtree: true });
  return () => { mo.disconnect(); stop(); };
}
