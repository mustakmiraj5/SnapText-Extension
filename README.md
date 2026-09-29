# SnapText

<img src="logo.png" alt="SnapText logo" width="96">

Copy text from anywhere on a web page, including text shown in videos, images and canvases. Drag a box over the text and it goes straight to your clipboard.

SnapText reads the text with [Tesseract.js](https://github.com/naptha/tesseract.js), which is included in the extension. All processing happens on your device: it works offline, and nothing is sent anywhere.

## Install

SnapText isn't in the Chrome Web Store yet, so you install it from the source:

1. Download this repository (clone it, or download the ZIP and unzip it).
2. Open `chrome://extensions` in Chrome.
3. Turn on **Developer mode** (top-right corner).
4. Click **Load unpacked** and select the `SnapText` folder.
5. Optional: click the puzzle-piece icon in the toolbar and pin SnapText.

It should also work in other Chromium-based browsers, such as Edge and Brave.

## Use

1. Click the SnapText icon, or press **Alt+Shift+S**.
2. Drag a box over the text you want.
3. The text is copied to your clipboard, and a message at the bottom of the page shows what was copied.

Press **Esc** to cancel a selection. To change the keyboard shortcut, go to `chrome://extensions/shortcuts`.

## Notes

- It only recognizes English text.
- Chrome doesn't allow extensions to run on some pages, such as `chrome://` pages, the New Tab page and the Chrome Web Store. On those pages the icon shows a red `!` badge.
- It reads only what is visible on screen, so scroll the text into view first.
- Recognition works best on clear, high-contrast text. For video subtitles, pause the video before you select.
