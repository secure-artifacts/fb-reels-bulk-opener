'use strict';

// ── 常量 ─────────────────────────────────────────────────────
const CURRENT_VERSION = '1.1';
const GITHUB_API      = 'https://api.github.com/repos/secure-artifacts/fb-reels-bulk-opener/releases/latest';
const GITHUB_RELEASES = 'https://github.com/secure-artifacts/fb-reels-bulk-opener/releases/latest';

// ── 状态 ─────────────────────────────────────────────────────
let detectedUrl = '';
let count = 5;
let speed = 'fast';

// ── DOM ───────────────────────────────────────────────────────
const numDisplay  = document.getElementById('numDisplay');
const btnMinus    = document.getElementById('btnMinus');
const btnPlus     = document.getElementById('btnPlus');
const btnGo       = document.getElementById('btnGo');
const statusMsg   = document.getElementById('statusMsg');
const srcPill     = document.getElementById('srcPill');
const pillAvatar  = document.getElementById('pillAvatar');
const pillName    = document.getElementById('pillName');
const pillUrl     = document.getElementById('pillUrl');
const pillId      = document.getElementById('pillId');
const multiArea   = document.getElementById('multiArea');
const multiCount  = document.getElementById('multiCount');
const bkList      = document.getElementById('bkList');
const selectedUrl = document.getElementById('selectedUrl');
const optNormal   = document.getElementById('optNormal');
const optFast     = document.getElementById('optFast');
const ftVersion   = document.getElementById('ftVersion');
const ftDot       = document.getElementById('ftDot');
const updateBar   = document.getElementById('updateBar');
const updateTitle = document.getElementById('updateTitle');
const updateGoBtn = document.getElementById('updateGoBtn');

// ── 工具函数 ─────────────────────────────────────────────────
function isReelsUrl(u) {
  try {
    const url  = new URL(u);
    const host = url.hostname.toLowerCase();
    const path = url.pathname.toLowerCase();
    if ((host === 'business.facebook.com' || host === 'web.facebook.com') &&
        path.includes('/reels_composer')) return true;
    if ((host === 'www.facebook.com' || host === 'facebook.com' ||
         host === 'www.fb.com'       || host === 'fb.com') &&
        path.includes('/reels/create')) return true;
    return false;
  } catch { return false; }
}

function extractAssetId(u) {
  try { return new URL(u).searchParams.get('asset_id') || ''; }
  catch { return ''; }
}

function avatarUrl(assetId) {
  return assetId ? `https://graph.facebook.com/${assetId}/picture?width=60&height=60` : '';
}

function shortUrl(u) {
  return u.replace(/^https?:\/\//, '');
}

function showStatus(msg, type) {
  statusMsg.className = type;
  statusMsg.innerHTML = msg;
}

const copyIconSvg = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';

// ── 点击复制 ID ──────────────────────────────────────────────
function setupCopyId(el, id) {
  if (!el || !id) return;
  el.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(id);
      const orig = el.innerHTML;
      el.textContent = '已复制';
      el.classList.add('copied');
      setTimeout(() => {
        el.innerHTML = orig;
        el.classList.remove('copied');
      }, 1200);
    } catch {}
  });
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
    btnGo.textContent = '极速批量打开';
  } else {
    btnGo.classList.remove('fast-mode');
    btnGo.textContent = '立即批量打开';
  }
}

optNormal.addEventListener('click', () => setSpeed('normal'));
optFast.addEventListener('click',   () => setSpeed('fast'));

// ── 单书签显示 ───────────────────────────────────────────────
function showSingleSource(bk) {
  detectedUrl = bk.url;
  const assetId = extractAssetId(bk.url);
  const av = avatarUrl(assetId);

  pillAvatar.innerHTML = av
    ? `<img src="${av}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" onerror="this.parentElement.innerHTML='👤'" />`
    : '👤';

  const name = bk.title && bk.title.trim() ? bk.title.trim() : 'Reels 书签';
  pillName.textContent = name;
  pillName.title       = name;

  if (assetId) {
    pillId.innerHTML = copyIconSvg + assetId;
    pillId.title = '公共主页编号: ' + assetId;
    setupCopyId(pillId, assetId);
  }

  pillUrl.textContent = shortUrl(bk.url);
  srcPill.classList.add('show');
}

// ── 多书签显示 ───────────────────────────────────────────────
function showMultiBookmarks(bookmarks) {
  multiArea.classList.add('show');
  multiCount.textContent = `共 ${bookmarks.length} 个`;

  if (bookmarks.length > 3) {
    bkList.style.maxHeight = '162px';
    bkList.style.overflowY = 'auto';
    bkList.style.paddingRight = '2px';
  }

  function updateSelectedUrl(url) {
    selectedUrl.textContent = shortUrl(url);
    selectedUrl.classList.add('show');
  }

  bookmarks.forEach((bk, i) => {
    const item = document.createElement('div');
    item.className = 'bk-item' + (i === 0 ? ' selected' : '');
    item.dataset.url = bk.url;

    const assetId = extractAssetId(bk.url);
    const av   = avatarUrl(assetId);
    const name = bk.title && bk.title.trim() ? bk.title.trim() : `Reels 书签 ${i + 1}`;
    const avatarHtml = av
      ? `<img src="${av}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" onerror="this.parentElement.innerHTML='👤'" />`
      : '👤';
    const tag = i === 0
      ? '<span class="bk-default-tag">默认</span>'
      : `<span class="bk-default-tag" style="background:rgba(255,255,255,.15);">#${i + 1}</span>`;

    item.innerHTML = `
      <div class="bk-radio"></div>
      <div class="bk-avatar">${avatarHtml}</div>
      <div class="bk-name" title="${name}">${name}</div>
      ${tag}
    `;

    item.addEventListener('click', () => {
      document.querySelectorAll('.bk-item').forEach(el => el.classList.remove('selected'));
      item.classList.add('selected');
      detectedUrl = bk.url;
      updateSelectedUrl(bk.url);
    });

    bkList.appendChild(item);
  });

  detectedUrl = bookmarks[0].url;
  updateSelectedUrl(bookmarks[0].url);
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
  try {
    const tree  = await chrome.bookmarks.getTree();
    const found = scanBookmarks(tree);
    const seen = new Set();
    const unique = found.filter(bk => {
      if (seen.has(bk.url)) return false;
      seen.add(bk.url); return true;
    });
    if (unique.length === 1) { showSingleSource(unique[0]); return; }
    if (unique.length > 1)   { showMultiBookmarks(unique);  return; }
  } catch {}
  showStatus('⚠️ 未找到 Reels 书签，请先收藏页面到书签', 'warn');
  btnGo.disabled = true;
}

// ── 版本号比较 ───────────────────────────────────────────────
function compareVersion(a, b) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const x = pa[i] || 0, y = pb[i] || 0;
    if (x > y) return 1;
    if (x < y) return -1;
  }
  return 0;
}

// ── 自动检测更新 ─────────────────────────────────────────────
async function checkForUpdate() {
  ftDot.className = '';
  ftDot.title = '正在检测更新…';
  try {
    const res    = await fetch(GITHUB_API);
    const data   = await res.json();
    const latest = (data.tag_name || '').replace(/^v/i, '').trim();
    if (!latest) throw new Error('no tag');
    const cmp = compareVersion(CURRENT_VERSION, latest);
    if (cmp < 0) {
      ftDot.className = 'new';
      ftDot.title = '发现新版本 v' + latest;
      ftVersion.classList.add('clickable');
      ftVersion.title = '点击前往 GitHub 更新';
      updateTitle.textContent = '发现新版本 v' + latest;
      updateBar.classList.add('show');
    } else if (cmp > 0) {
      ftDot.className = 'beta';
      ftDot.title = '内测版';
      ftVersion.textContent = 'v' + CURRENT_VERSION + ' 内测版';
    } else {
      ftDot.className = 'ok';
      ftDot.title = '已是最新版';
    }
  } catch {
    ftDot.className = 'err';
    ftDot.title = '更新检测失败';
  }
}

function openReleases() { chrome.tabs.create({ url: GITHUB_RELEASES }); }
ftVersion.addEventListener('click', () => {
  if (ftVersion.classList.contains('clickable')) openReleases();
});
updateGoBtn.addEventListener('click', openReleases);

// ── 主流程 ───────────────────────────────────────────────────
btnGo.addEventListener('click', () => {
  if (!detectedUrl) { showStatus('❌ 没有检测到可用链接', 'err'); return; }
  btnGo.disabled = true;
  btnGo.textContent = '启动中...';
  chrome.runtime.sendMessage({ type: 'OPEN_TABS', url: detectedUrl, count, speed }, () => {
    window.close();
  });
});

// ── 初始化 ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  ftVersion.textContent = 'v' + CURRENT_VERSION;
  setCount(5);
  setSpeed('fast');
  autoDetect();
  checkForUpdate();
});
