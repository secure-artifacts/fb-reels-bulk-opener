// background.js — 接收指令，在后台批量打开标签页
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type !== 'OPEN_TABS') return false;

  const { url, count, speed } = msg;

  if (speed === 'fast') {
    for (let i = 0; i < count; i++) {
      chrome.tabs.create({ url });
    }
    sendResponse({ ok: true });
    return true;
  }

  const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  (async () => {
    for (let i = 0; i < count; i++) {
      try { await chrome.tabs.create({ url, active: true }); } catch {}
      if (i < count - 1) await new Promise(r => setTimeout(r, rand(1000, 1500)));
    }
  })();

  sendResponse({ ok: true });
  return true;
});
