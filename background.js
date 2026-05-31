'use strict';

const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {

  // ── 头像获取 ───────────────────────────────────────────────────
  // graph.facebook.com/PAGE_ID/picture 完全公开，无需登录
  // 只有真实 Page ID（10~20位纯数字）才请求，否则直接返回失败让 popup 用首字母占位
  if (msg.type === 'GET_AVATAR') {
    const pageId = msg.pageId;

    // 防御：如果传来的不是合法 Page ID，直接返回失败，不发请求
    if (!pageId || !/^\d{10,20}$/.test(pageId)) {
      sendResponse({ ok: false, error: 'invalid pageId' });
      return false;
    }

    const url = `https://graph.facebook.com/${pageId}/picture?width=80&height=80&type=normal`;
    (async () => {
      try {
        const resp = await fetch(url, { redirect: 'follow' });
        if (!resp.ok) throw new Error('http ' + resp.status);

        const mime   = (resp.headers.get('content-type') || 'image/jpeg').split(';')[0];
        // 只接受图片类型，防止收到错误页面 HTML
        if (!mime.startsWith('image/')) throw new Error('not an image: ' + mime);

        const buffer = await resp.arrayBuffer();
        if (buffer.byteLength < 100) throw new Error('image too small, likely error response');

        // arrayBuffer → Uint8Array → binary string → btoa → base64
        const bytes  = new Uint8Array(buffer);
        let binary   = '';
        // 分批处理避免栈溢出
        const CHUNK  = 8192;
        for (let i = 0; i < bytes.byteLength; i += CHUNK) {
          binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
        }
        const dataUrl = `data:${mime};base64,${btoa(binary)}`;
        sendResponse({ ok: true, dataUrl });
      } catch (e) {
        sendResponse({ ok: false, error: e.message });
      }
    })();
    return true; // 保持消息通道开放（异步）
  }

  // ── 带前置任务的批量打开（FB主页 + 日程本 + Reels）─────────────
  if (msg.type === 'OPEN_TABS_WITH_PRE') {
    const { preTasks = [], reelsUrl, count, speed } = msg;

    (async () => {
      // 第一步：打开前置页面
      for (let i = 0; i < preTasks.length; i++) {
        try { await chrome.tabs.create({ url: preTasks[i].url, active: false }); } catch {}
        if (i < preTasks.length - 1) {
          await new Promise(r => setTimeout(r, 600));
        }
      }
      if (preTasks.length > 0) {
        await new Promise(r => setTimeout(r, 400));
      }

      // 第二步：批量打开 Reels
      if (speed === 'fast') {
        for (let i = 0; i < count; i++) {
          try { await chrome.tabs.create({ url: reelsUrl, active: true }); } catch {}
        }
      } else {
        for (let i = 0; i < count; i++) {
          try { await chrome.tabs.create({ url: reelsUrl, active: true }); } catch {}
          if (i < count - 1) await new Promise(r => setTimeout(r, rand(1000, 1500)));
        }
      }
    })();

    sendResponse({ ok: true });
    return true;
  }

  // ── 旧格式兼容 ────────────────────────────────────────────────
  if (msg.type === 'OPEN_TABS') {
    const { url, count, speed } = msg;

    if (speed === 'fast') {
      for (let i = 0; i < count; i++) chrome.tabs.create({ url });
      sendResponse({ ok: true });
      return true;
    }

    (async () => {
      for (let i = 0; i < count; i++) {
        try { await chrome.tabs.create({ url, active: true }); } catch {}
        if (i < count - 1) await new Promise(r => setTimeout(r, rand(1000, 1500)));
      }
    })();

    sendResponse({ ok: true });
    return true;
  }

  return false;
});
