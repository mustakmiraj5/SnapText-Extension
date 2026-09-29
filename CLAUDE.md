# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

SnapText is a Chrome extension (Manifest V3). You drag a box over part of a page, the text inside it is read by OCR (Tesseract.js), and the result is copied to the clipboard. This works for text in videos, images and canvases. There is no build step, package manager or test suite. The files in the repo root are loaded into Chrome exactly as they are.

## Running

- Load: open `chrome://extensions`, turn on Developer mode, click "Load unpacked" and choose this directory.
- After editing: click reload on the extension card. `content.js` is injected again each time the icon is clicked, so changes to it need only an extension reload, not a page reload.
- Logs are all prefixed `[SnapText]` and appear in three separate consoles:
  - `background.js`: the "service worker" link on the extension card.
  - `content.js`: the page's DevTools console.
  - `offscreen.js`: `chrome://extensions`, then "Inspect views: offscreen.html" (shown only while the document exists).

## Architecture

A capture runs through three contexts, connected by `chrome.runtime` messages:

1. **`background.js` (service worker)**: when the action is clicked (or Alt+Shift+S is pressed), it injects `content.js` into the tab. If injection fails (on `chrome://` pages, the New Tab page or the Web Store), it sets a `!` badge and a tooltip instead of failing silently.
2. **`content.js`**: draws the selection overlay. It uses `popover="manual"` elements so the overlay sits in the browser's top layer, above fullscreen video. On mouseup it waits two animation frames so the overlay is gone before the screenshot, then sends `{type:'region', rect, viewportWidth}`. `window.__ocrSelecting` stops a second overlay from being opened.
3. **`background.js`** handles `region`: it calls `captureVisibleTab`, creates the offscreen document if one doesn't exist yet, and forwards `{type:'ocr', image, ...}`.
4. **`offscreen.js`** (loaded by `offscreen.html`): crops the screenshot on a canvas and runs Tesseract. It copies the text by filling the textarea in `offscreen.html` and calling `execCommand('copy')`. The result is sent back along the chain, and `content.js` shows it in a toast.

Non-obvious constraints:
- The `rect` is in CSS pixels, but the screenshot is in device pixels. The scale is `img.width / viewportWidth`, and the crop is then upscaled 2x because Tesseract reads small video text better that way.
- In the offscreen document, use `createImageBitmap`, not `new Image()` + `decode()`. `decode()` never resolves in a hidden document.
- The Tesseract worker is created once, on first use, and cached in `worker`.
- Tesseract runs fully offline from `lib/`: `tesseract.min.js`, `worker.min.js`, the WASM cores in `lib/core` and `lib/lang/eng.traineddata.gz`. `workerBlobURL: false`, together with the manifest's CSP (`'wasm-unsafe-eval'`), is what lets it run under MV3. Don't point any of these paths at a CDN. To add a language, put its `.traineddata.gz` file in `lib/lang` and change `createWorker('eng', ...)`.
- Message handlers return `true` so they can reply asynchronously. Each one filters on `msg.type`, because the background and offscreen listeners both receive every runtime message.
