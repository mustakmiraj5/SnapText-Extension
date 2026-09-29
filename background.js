chrome.action.onClicked.addListener((tab) => {
  console.log('[SnapText] icon clicked on', tab.url);
  // Chrome blocks injection on chrome://, New Tab and Web Store pages; flag it instead of failing silently.
  chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] }).then(
    () => {
      console.log('[SnapText] selector injected');
      chrome.action.setBadgeText({ tabId: tab.id, text: '' });
    },
    (e) => {
      console.error('[SnapText] injection failed:', e.message);
      chrome.action.setBadgeText({ tabId: tab.id, text: '!' });
      chrome.action.setTitle({ tabId: tab.id, title: "Can't run on this page: " + e.message });
    }
  );
});

chrome.runtime.onMessage.addListener((msg, sender, reply) => {
  if (msg.type !== 'region') return;
  console.log('[SnapText] region selected', msg.rect);
  (async () => {
    const image = await chrome.tabs.captureVisibleTab(sender.tab.windowId, { format: 'png' });
    if (!(await chrome.offscreen.hasDocument())) {
      await chrome.offscreen.createDocument({
        url: 'offscreen.html',
        reasons: ['WORKERS', 'CLIPBOARD'],
        justification: 'Run OCR and copy the result to the clipboard',
      });
    }
    const res = await chrome.runtime.sendMessage({ ...msg, type: 'ocr', image });
    console.log('[SnapText] result', res);
    return res;
  })().then(reply, (e) => {
    console.error('[SnapText] failed:', e);
    reply({ error: e.message });
  });
  return true;
});
