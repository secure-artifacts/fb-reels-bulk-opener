// background.js — 接收指令，在后台批量打开标签页
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type !== 'OPEN_TABS') return false;

  const { url, count, speed } = msg;

  if (speed === 'fast') {
    // ── 极速模式：同步 for 循环，一次性全部 fire-and-forget（Pasty 同款） ──
    for (let i = 0; i < count; i++) {
      chrome.tabs.create({ url });
    }
    sendResponse({ ok: true });
    return true;
  }

  // ── 正常模式：每隔 1~1.5 秒打开一个，模拟真人 ──
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
