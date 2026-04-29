'use strict';

// ── 状态 ─────────────────────────────────────────────────────
let detectedUrl = '';
let count = 5;
let speed = 'normal'; // 'normal' | 'fast'

// ── DOM ───────────────────────────────────────────────────────
const numDisplay = document.getElementById('numDisplay');
const btnMinus   = document.getElementById('btnMinus');
const btnPlus    = document.getElementById('btnPlus');
const btnGo      = document.getElementById('btnGo');
const statusMsg  = document.getElementById('statusMsg');
const srcPill    = document.getElementById('srcPill');
const srcUrl     = document.getElementById('srcUrl');
const srcIcon    = document.getElementById('srcIcon');
const srcBadge   = document.getElementById('srcBadge');
const multiArea  = document.getElementById('multiArea');
const multiCount = document.getElementById('multiCount');
const bkList     = document.getElementById('bkList');
const optNormal  = document.getElementById('optNormal');
const optFast    = document.getElementById('optFast');

// ── 工具函数 ─────────────────────────────────────────────────
function isReelsUrl(u) {
  try {
    const l = new URL(u).href.toLowerCase();
    return (l.includes('facebook.com') || l.includes('fb.com')) &&
           (l.includes('reel') || l.includes('create'));
  } catch { return false; }
}

function showStatus(msg, type) {
  statusMsg.className = type;
  statusMsg.innerHTML = msg;
}

// ── 数量控制 ─────────────────────────────────────────────────
function setCount(n) {
  count = Math.max(1, Math.min(20, n));
  numDisplay.textContent = count;
  document.querySelectorAll('.qbtn').forEach(b => {
    b.classList.toggle('active', parseInt(b.dataset.n) === count);
  });
}

btnMinus.addEventListener('click', () => setCount(count - 1));
btnPlus .addEventListener('click', () => setCount(count + 1));

document.getElementById('quickBtns').addEventListener('click', e => {
  const btn = e.target.closest('.qbtn');
  if (btn) setCount(parseInt(btn.dataset.n));
});

// ── 速度切换 ─────────────────────────────────────────────────
function setSpeed(mode) {
  speed = mode;
  optNormal.classList.toggle('active', mode === 'normal');
  optFast.classList.toggle('active', mode === 'fast');
  if (mode === 'fast') {
    btnGo.classList.add('fast-mode');
    btnGo.innerHTML = '⚡ 极速批量打开';
  } else {
    btnGo.classList.remove('fast-mode');
    btnGo.innerHTML = '🚀 立即批量打开';
  }
}

optNormal.addEventListener('click', () => setSpeed('normal'));
optFast.addEventListener('click', () => setSpeed('fast'));

// ── 显示单书签 pill ──────────────────────────────────────────
function showSingleSource(url, type) {
  detectedUrl = url;
  srcUrl.textContent = url.replace(/https?:\/\/(www\.)?/, '').slice(0, 36) + '…';
  if (type === 'bookmark') {
    srcIcon.textContent  = '🔖';
    srcBadge.textContent = '来自书签';
  } else {
    srcIcon.textContent  = '📋';
    srcBadge.textContent = '剪切板';
  }
  srcPill.classList.add('show');
}

// ── 显示多书签选择列表 ────────────────────────────────────────
function showMultiBookmarks(bookmarks) {
  multiArea.classList.add('show');
  multiCount.textContent = `共 ${bookmarks.length} 个`;

  bookmarks.forEach((bk, i) => {
    const item = document.createElement('div');
    item.className = 'bk-item' + (i === 0 ? ' selected' : '');
    item.dataset.url = bk.url;

    const shortUrl = bk.url.replace(/https?:\/\/(www\.)?/, '').slice(0, 34) + '…';
    const displayName = bk.title && bk.title.trim()
      ? bk.title.trim().slice(0, 20)
      : shortUrl;

    item.innerHTML = `
      <div class="bk-radio"></div>
      <div class="bk-text">
        <div class="bk-name">${displayName}</div>
        <div class="bk-url">${shortUrl}</div>
      </div>
      ${i === 0 ? '<span class="bk-default-tag">默认</span>' : ''}
    `;

    item.addEventListener('click', () => {
      document.querySelectorAll('.bk-item').forEach(el => el.classList.remove('selected'));
      item.classList.add('selected');
      detectedUrl = bk.url;
    });

    bkList.appendChild(item);
  });

  // 默认选中第一个
  detectedUrl = bookmarks[0].url;
}

// ── 书签扫描 ─────────────────────────────────────────────────
function scanBookmarks(nodes, out = []) {
  for (const n of nodes) {
    if (n.url && isReelsUrl(n.url)) out.push({ url: n.url, title: n.title || '' });
    if (n.children) scanBookmarks(n.children, out);
  }
  return out;
}

// ── 自动识别 ─────────────────────────────────────────────────
async function autoDetect() {
  // 1. 书签优先
  try {
    const tree  = await chrome.bookmarks.getTree();
    const found = scanBookmarks(tree);

    // 去重（相同 url 只保留一条）
    const seen = new Set();
    const unique = found.filter(bk => {
      if (seen.has(bk.url)) return false;
      seen.add(bk.url);
      return true;
    });

    if (unique.length === 1) {
      // 只有一个，静默显示
      showSingleSource(unique[0].url, 'bookmark');
      return;
    }

    if (unique.length > 1) {
      // 多个，显示选择列表
      showMultiBookmarks(unique);
      return;
    }
  } catch {}

  // 2. 再试剪切板
  try {
    const text = await navigator.clipboard.readText();
    const urls = (text || '').split(/\s+/).filter(isReelsUrl);
    if (urls.length) {
      showSingleSource(urls[0], 'clipboard');
      return;
    }
  } catch {}

  // 3. 都没找到
  showStatus('⚠️ 未找到 Reels 链接，请先收藏页面到书签', 'warn');
  btnGo.disabled = true;
}

// ── 主流程 ───────────────────────────────────────────────────
btnGo.addEventListener('click', () => {
  if (!detectedUrl) {
    showStatus('❌ 没有检测到可用链接', 'err');
    return;
  }

  btnGo.disabled = true;
  btnGo.innerHTML = '⏳ 启动中...';

  chrome.runtime.sendMessage({
    type : 'OPEN_TABS',
    url  : detectedUrl,
    count: count,
    speed: speed
  }, () => {
    window.close();
  });
});

// ── 初始化 ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  setCount(5);
  autoDetect();
});
