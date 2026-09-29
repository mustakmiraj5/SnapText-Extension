(() => {
  if (window.__ocrSelecting) return console.log('[SnapText] already selecting in this tab');
  console.log('[SnapText] overlay shown');
  window.__ocrSelecting = true;

  // Popovers render in the browser's top layer: above every page layer, fullscreen video included.
  const layer = (el) => {
    el.popover = 'manual';
    (document.fullscreenElement || document.documentElement).appendChild(el);
    el.showPopover();
  };
  const overlay = document.createElement('div');
  overlay.style.cssText =
    'position:fixed;inset:0;width:100%;height:100%;max-width:none;max-height:none;margin:0;padding:0;border:0;' +
    'cursor:crosshair;background:rgba(0,0,0,.4)';
  const hint = document.createElement('div');
  hint.textContent = 'Drag over the text to copy it · Esc to cancel';
  hint.style.cssText =
    'position:fixed;top:16px;left:50%;transform:translateX(-50%);background:#0af;color:#fff;' +
    'padding:8px 16px;border-radius:6px;font:bold 15px sans-serif;pointer-events:none';
  const box = document.createElement('div');
  box.style.cssText = 'position:fixed;border:2px dashed #0af;background:rgba(0,170,255,.1);display:none';
  overlay.append(hint, box);
  layer(overlay);

  let start = null;
  const rect = (e) => ({
    x: Math.min(start.x, e.clientX),
    y: Math.min(start.y, e.clientY),
    w: Math.abs(e.clientX - start.x),
    h: Math.abs(e.clientY - start.y),
  });

  const done = () => {
    overlay.remove();
    document.removeEventListener('keydown', onKey, true);
    window.__ocrSelecting = false;
  };
  const onKey = (e) => e.key === 'Escape' && done();
  document.addEventListener('keydown', onKey, true);

  overlay.addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    start = { x: e.clientX, y: e.clientY };
    box.style.display = 'block';
  });
  overlay.addEventListener('mousemove', (e) => {
    if (!start) return;
    const r = rect(e);
    Object.assign(box.style, { left: r.x + 'px', top: r.y + 'px', width: r.w + 'px', height: r.h + 'px' });
  });
  overlay.addEventListener('mouseup', async (e) => {
    e.stopPropagation();
    const r = rect(e);
    done();
    if (r.w < 5 || r.h < 5) return;
    // Wait for the overlay to disappear from the screen before the screenshot is taken.
    await new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(res)));
    const res = await chrome.runtime.sendMessage({ type: 'region', rect: r, viewportWidth: innerWidth });
    toast(res?.error ? 'OCR failed: ' + res.error : res?.text ? 'Copied: ' + res.text.slice(0, 80) : 'No text found');
  });

  function toast(msg) {
    const t = document.createElement('div');
    t.textContent = msg;
    t.style.cssText =
      'position:fixed;inset:auto auto 24px 50%;margin:0;border:0;transform:translateX(-50%);' +
      'background:#222;color:#fff;padding:8px 14px;border-radius:6px;font:14px sans-serif;max-width:80vw';
    layer(t);
    setTimeout(() => t.remove(), 2500);
  }
})();
