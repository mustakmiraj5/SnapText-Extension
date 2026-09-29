const url = chrome.runtime.getURL;
let worker;

chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
  if (msg.type !== 'ocr') return;
  ocr(msg).then(reply, (e) => reply({ error: e.message || String(e) }));
  return true;
});

async function ocr({ image, rect, viewportWidth }) {
  // Not new Image()+decode(): decode() never resolves in a hidden offscreen document.
  const img = await createImageBitmap(await (await fetch(image)).blob());

  // Screenshot is in device pixels; rect is in CSS pixels. Upscale 2x — Tesseract reads small video text better.
  const s = img.width / viewportWidth;
  const up = 2;
  const canvas = document.createElement('canvas');
  canvas.width = rect.w * s * up;
  canvas.height = rect.h * s * up;
  canvas.getContext('2d').drawImage(img, rect.x * s, rect.y * s, rect.w * s, rect.h * s, 0, 0, canvas.width, canvas.height);

  worker ??= Tesseract.createWorker('eng', 1, {
    workerPath: url('lib/worker.min.js'),
    corePath: url('lib/core'),
    langPath: url('lib/lang'),
    workerBlobURL: false,
  });
  const { data } = await (await worker).recognize(canvas);
  const text = data.text.trim();

  if (text) {
    const ta = document.querySelector('textarea');
    ta.value = text;
    ta.select();
    document.execCommand('copy');
  }
  return { text };
}
