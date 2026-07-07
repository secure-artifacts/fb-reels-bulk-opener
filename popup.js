'use strict';

// ── 常量 ─────────────────────────────────────────────────────
const CURRENT_VERSION   = '3.1';
const GITHUB_API        = 'https://api.github.com/repos/secure-artifacts/fb-reels-bulk-opener/releases/latest';
const GITHUB_RELEASES   = 'https://github.com/secure-artifacts/fb-reels-bulk-opener/releases/latest';
const REELS_TEMPLATE    = 'https://business.facebook.com/latest/reels_composer/?ref=biz_web_content_manager_calendar_view&asset_id=__ID__&context_ref=CONTENT_CALENDAR';
const CALENDAR_TEMPLATE = 'https://business.facebook.com/latest/content_calendar?asset_id=__ID__';
const FB_HOME_URL       = 'https://www.facebook.com/';
const FEEDBACK_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdwCggknTX000C6G2mR7Poe5q9AN7IrXtcDaqy8fu854R0l4g/viewform?usp=dialog';

// ── 设置默认值 ────────────────────────────────────────────────
const DEFAULT_SETTINGS = {
  defaultCount:      5,
  preOpenCalendar:   true,
};

// ── 运行时状态 ────────────────────────────────────────────────
let settings       = { ...DEFAULT_SETTINGS };
let detectedUrl    = '';
let count          = 5;
let currentAssetId = '';

// ── DOM：主页面 ───────────────────────────────────────────────
const pageMain       = document.getElementById('pageMain');
const pageSettings   = document.getElementById('pageSettings');
const btnGear        = document.getElementById('btnGear');
const btnBack        = document.getElementById('btnBack');

const numDisplay     = document.getElementById('numDisplay');
const btnMinus       = document.getElementById('btnMinus');
const btnPlus        = document.getElementById('btnPlus');
const btnGo          = document.getElementById('btnGo');
const statusMsg      = document.getElementById('statusMsg');
const autoCard       = document.getElementById('autoCard');
const autoAvatar     = document.getElementById('autoAvatar');
const autoName       = document.getElementById('autoName');
const autoUrl        = document.getElementById('autoUrl');
const autoPageId     = document.getElementById('autoPageId');
const autoPageIdTip  = document.getElementById('autoPageIdTip');
const loginBar       = document.getElementById('loginBar');
const loginName      = document.getElementById('loginName');
const loginHint      = document.getElementById('loginHint');
const loginPageId    = document.getElementById('loginPageId');
const loginPageIdTip = document.getElementById('loginPageIdTip');
const srcPill        = document.getElementById('srcPill');
const pillAvatar     = document.getElementById('pillAvatar');
const pillName       = document.getElementById('pillName');
const pillUrl        = document.getElementById('pillUrl');
const pillPageId     = document.getElementById('pillPageId');
const pillPageIdTip  = document.getElementById('pillPageIdTip');
const multiArea      = document.getElementById('multiArea');
const multiCount     = document.getElementById('multiCount');
const bkList         = document.getElementById('bkList');
const selectedUrl    = document.getElementById('selectedUrl');
const ftVersion      = document.getElementById('ftVersion');
const ftDot          = document.getElementById('ftDot');
const updateBar      = document.getElementById('updateBar');
const updateTitle    = document.getElementById('updateTitle');
const updateGoBtn    = document.getElementById('updateGoBtn');

// ── DOM：设置页面 ─────────────────────────────────────────────
const togCalendar     = document.getElementById('togCalendar');
const setFt           = document.getElementById('setFt');
const rowFeedback     = document.getElementById('rowFeedback');

// ── 页面切换 ──────────────────────────────────────────────────
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

btnGear.addEventListener('click', () => showPage('pageSettings'));
btnBack.addEventListener('click', () => showPage('pageMain'));
rowFeedback.addEventListener('click', () => chrome.tabs.create({ url: FEEDBACK_FORM_URL }));

// ── 设置读写 ──────────────────────────────────────────────────
async function loadSettings() {
  try {
    const stored = await chrome.storage.local.get('userSettings');
    if (stored.userSettings) {
      settings = { ...DEFAULT_SETTINGS, ...stored.userSettings };
    }
  } catch {}
}

async function saveSettings() {
  try {
    await chrome.storage.local.set({ userSettings: settings });
    setFt.textContent = 'v' + CURRENT_VERSION + ' · 设置已自动保存';
    setTimeout(() => { setFt.textContent = 'v' + CURRENT_VERSION + ' · 设置已自动保存'; }, 800);
  } catch {}
}

// 把当前 settings 渲染到设置页 UI
function renderSettings() {
  setToggle(togCalendar,     settings.preOpenCalendar);
}

function setToggle(el, on) {
  if (on) el.classList.add('on'); else el.classList.remove('on');
}

function makeTogHandler(el, key) {
  el.addEventListener('click', () => {
    settings[key] = !settings[key];
    setToggle(el, settings[key]);
    saveSettings();
  });
}
makeTogHandler(togCalendar,     'preOpenCalendar');

// ── URL 工具 ──────────────────────────────────────────────────
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

function isCalendarUrl(u) {
  try {
    const url  = new URL(u);
    return url.hostname.toLowerCase() === 'business.facebook.com' &&
           url.pathname.toLowerCase().includes('/content_calendar');
  } catch { return false; }
}

function extractAssetId(u) {
  try { return new URL(u).searchParams.get('asset_id') || ''; }
  catch { return ''; }
}

function buildReelsUrl(pageId) {
  return REELS_TEMPLATE.replace('__ID__', pageId);
}

function buildCalendarUrl(pageId) {
  return CALENDAR_TEMPLATE.replace('__ID__', pageId);
}

function shortUrl(u) {
  return u.replace(/^https?:\/\//, '');
}

function showStatus(msg, type) {
  statusMsg.className = type;
  statusMsg.innerHTML = msg;
}

// ── 合法 Page ID 校验 ─────────────────────────────────────────
function isValidPageId(id) {
  return typeof id === 'string' && /^\d{10,20}$/.test(id.trim());
}

// ── 头像获取 ──────────────────────────────────────────────────
function getAvatar(pageId, name, imgEl, size) {
  imgEl.innerHTML = makeInitialAvatar(name, pageId, size);
  if (!pageId) return;
  chrome.runtime.sendMessage({ type: 'GET_AVATAR', pageId }, (resp) => {
    if (chrome.runtime.lastError) return;
    if (resp && resp.ok && resp.dataUrl) {
      const img = document.createElement('img');
      img.style.cssText = `width:${size}px;height:${size}px;object-fit:cover;border-radius:50%;`;
      img.onload  = () => { imgEl.innerHTML = ''; imgEl.appendChild(img); };
      img.onerror = () => {};
      img.src = resp.dataUrl;
    }
  });
}

function colorFromId(id) {
  const palette = ['#1877F2','#00B2FF','#0e9f6e','#e0700a','#7c3aed','#db2777','#b45309','#047857'];
  let hash = 0;
  for (let i = 0; i < (id || '').length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

function makeInitialAvatar(name, id, size = 36) {
  const letter = (name || '?').replace(/\s+/g, '').charAt(0).toUpperCase();
  const bg     = colorFromId(id || name || '');
  const fs     = Math.round(size * 0.44);
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="${bg}"/>
    <text x="${size/2}" y="${size/2}" dominant-baseline="central" text-anchor="middle"
      font-size="${fs}" font-family="-apple-system,PingFang SC,sans-serif"
      font-weight="700" fill="white">${letter}</text>
  </svg>`;
}

// ── 复制 ID ───────────────────────────────────────────────────
function setupCopyId(el, tipEl, id) {
  if (!el || !id) return;
  el.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(id);
      const textEl = el.querySelector('.page-id-text');
      if (textEl) {
        const orig = textEl.textContent;
        textEl.textContent = '已复制';
        el.classList.add('copied');
        setTimeout(() => { textEl.textContent = orig; el.classList.remove('copied'); }, 1200);
      }
    } catch {}
  });
}

// ── 数量控制 ──────────────────────────────────────────────────
function setCount(n) {
  count = Math.max(1, Math.min(30, n));
  numDisplay.textContent = count;
  document.querySelectorAll('.qbtn').forEach(b => {
    b.classList.toggle('active', parseInt(b.dataset.n) === count);
  });
}

btnMinus.addEventListener('click', () => {
  setCount(count - 1);
  settings.defaultCount = count;
  saveSettings();
});
btnPlus.addEventListener('click', () => {
  setCount(count + 1);
  settings.defaultCount = count;
  saveSettings();
});
document.getElementById('quickBtns').addEventListener('click', e => {
  const btn = e.target.closest('.qbtn');
  if (btn) {
    setCount(parseInt(btn.dataset.n));
    settings.defaultCount = count;
    saveSettings();
  }
});

// ── State 1: 自动检测 ─────────────────────────────────────────
function showAutoDetect(name, pageId) {
  const url = buildReelsUrl(pageId);
  detectedUrl    = url;
  currentAssetId = pageId;

  getAvatar(pageId, name, autoAvatar, 38);
  autoName.textContent = name || '专业主页';
  autoName.title       = name || '';
  autoUrl.textContent  = shortUrl(url);
  autoPageIdTip.textContent = '公共主页编号 ' + pageId;
  autoPageId.title          = '公共主页编号 ' + pageId;
  autoPageId.classList.add('show');
  setupCopyId(autoPageId, autoPageIdTip, pageId);
  autoCard.classList.add('show');
}

// ── State 2: 登录条 ───────────────────────────────────────────
function showLoginBar(name, pageId, isLive) {
  loginName.textContent = name || '未检测到';
  loginName.title       = name || '';
  loginHint.textContent = (!isLive && name) ? '(缓存)' : '';
  if (pageId) {
    loginPageIdTip.textContent = '公共主页编号 ' + pageId;
    loginPageId.title          = '公共主页编号 ' + pageId;
    loginPageId.classList.add('show');
    setupCopyId(loginPageId, loginPageIdTip, pageId);
  }
  loginBar.classList.add('show');
}

// ── State 2: 单书签 ───────────────────────────────────────────
function showSingleSource(bk) {
  detectedUrl    = bk.url;
  const assetId  = extractAssetId(bk.url);
  currentAssetId = assetId;

  getAvatar(assetId, bk.title, pillAvatar, 38);
  const name = bk.title && bk.title.trim() ? bk.title.trim() : 'Reels 书签';
  pillName.textContent = name;
  pillName.title       = name;
  pillUrl.textContent  = shortUrl(bk.url);

  if (assetId && pillPageId && pillPageIdTip) {
    pillPageIdTip.textContent = '公共主页编号 ' + assetId;
    pillPageId.title          = '公共主页编号 ' + assetId;
    pillPageId.classList.add('show');
    setupCopyId(pillPageId, pillPageIdTip, assetId);
  }
  srcPill.classList.add('show');
}

// ── State 2: 多书签 ───────────────────────────────────────────
function showMultiBookmarks(bookmarks) {
  multiArea.classList.add('show');
  multiCount.textContent = `共 ${bookmarks.length} 个`;

  if (bookmarks.length > 3) {
    bkList.style.maxHeight   = '162px';
    bkList.style.overflowY   = 'auto';
    bkList.style.paddingRight = '2px';
  }

  function updateSelectedUrl(url) {
    selectedUrl.textContent = shortUrl(url);
    selectedUrl.classList.add('show');
  }

  bookmarks.forEach((bk, i) => {
    const item = document.createElement('div');
    item.className   = 'bk-item' + (i === 0 ? ' selected' : '');
    item.dataset.url = bk.url;

    const assetId = extractAssetId(bk.url);
    const name    = bk.title && bk.title.trim() ? bk.title.trim() : `Reels 书签 ${i + 1}`;
    const tag     = i === 0
      ? '<span class="bk-default-tag">默认</span>'
      : `<span class="bk-default-tag" style="background:rgba(255,255,255,.15);">#${i + 1}</span>`;

    item.innerHTML = `
      <div class="bk-radio"></div>
      <div class="bk-avatar" data-idx="${i}"></div>
      <div class="bk-name" title="${name}">${name}</div>
      ${tag}
    `;

    item.addEventListener('click', () => {
      document.querySelectorAll('.bk-item').forEach(el => el.classList.remove('selected'));
      item.classList.add('selected');
      detectedUrl    = bk.url;
      currentAssetId = extractAssetId(bk.url);
      updateSelectedUrl(bk.url);
    });

    bkList.appendChild(item);

    const avatarEl = item.querySelector(`.bk-avatar[data-idx="${i}"]`);
    getAvatar(assetId, name, avatarEl, 30);
  });

  detectedUrl    = bookmarks[0].url;
  currentAssetId = extractAssetId(bookmarks[0].url);
  updateSelectedUrl(bookmarks[0].url);
}

// ── 书签扫描 ──────────────────────────────────────────────────
function scanBookmarks(nodes, out = []) {
  for (const n of nodes) {
    if (n.url && isReelsUrl(n.url)) out.push({ url: n.url, title: n.title || '' });
    if (n.children) scanBookmarks(n.children, out);
  }
  return out;
}

// ── fetchFbData：实时优先，缓存兜底，严格验证 Page ID ─────────
async function fetchFbData() {
  let name       = '';
  let pageId     = '';
  let isLive     = false;
  let livePageId = '';
  let liveName   = '';

  // 第一步：实时查询所有 FB 标签页
  try {
    const tabs = await chrome.tabs.query({ url: [
      'https://www.facebook.com/*', 'https://facebook.com/*',
      'https://web.facebook.com/*', 'https://business.facebook.com/*'
    ]});
    for (const tab of tabs) {
      try {
        const response = await new Promise((resolve) => {
          chrome.tabs.sendMessage(tab.id, { action: 'get_fb_data' }, (res) => {
            if (chrome.runtime.lastError) resolve(null);
            else resolve(res);
          });
        });
        if (response) {
          if (response.name   && !liveName)   liveName   = response.name;
          if (response.pageId && !livePageId) livePageId = response.pageId;
          if (liveName && livePageId) break;
        }
      } catch {}
    }
  } catch {}

  if (liveName)  { name = liveName; isLive = true; }

  if (livePageId && isValidPageId(livePageId)) {
    // 实时取到合法 ID → 使用并更新缓存
    pageId = livePageId.trim();
    isLive = true;
    chrome.storage.local.set({ fb_cached_page_id: pageId, fb_cached_name: name || '', fb_cached_time: Date.now() });
  } else if (livePageId) {
    // 实时取到非法 ID → 清除缓存，绝不使用
    chrome.storage.local.remove('fb_cached_page_id');
    pageId = '';
  }

  // 第二步：实时没拿到合法 ID → 才考虑缓存
  if (!pageId) {
    try {
      const cache = await chrome.storage.local.get(['fb_cached_name', 'fb_cached_page_id']);
      if (!name && cache.fb_cached_name) name = cache.fb_cached_name;
      if (cache.fb_cached_page_id && isValidPageId(cache.fb_cached_page_id)) {
        pageId = cache.fb_cached_page_id.trim();
      } else if (cache.fb_cached_page_id) {
        chrome.storage.local.remove('fb_cached_page_id');
      }
    } catch {}
  }

  return { name, pageId, isLive };
}

// ── 检测已打开的标签页 ────────────────────────────────────────
async function getOpenTabs() {
  try { return await chrome.tabs.query({}); } catch { return []; }
}

// ── 主检测流程（方案C：有ID→自动；无ID→书签；无书签→提示）──
async function autoDetect() {
  const fb = await fetchFbData();

  let bookmarks = [];
  try {
    const tree  = await chrome.bookmarks.getTree();
    const found = scanBookmarks(tree);
    const seen  = new Set();
    bookmarks = found.filter(bk => { if (seen.has(bk.url)) return false; seen.add(bk.url); return true; });
  } catch {}

  // ── 优先：有合法 Page ID → 自动检测模式 ──────────────────────
  if (fb.pageId) {
    showAutoDetect(fb.name, fb.pageId);
    return;
  }

  // ── 降级：无 Page ID + 有书签 → 书签模式 ─────────────────────
  if (bookmarks.length > 0) {
    if (fb.name) showLoginBar(fb.name, '', fb.isLive);
    if (bookmarks.length === 1) showSingleSource(bookmarks[0]);
    else showMultiBookmarks(bookmarks);
    return;
  }

  // ── 无 Page ID + 无书签：检查是否开了 FB ─────────────────────
  try {
    const fbTabs = await chrome.tabs.query({ url: [
      'https://www.facebook.com/*', 'https://facebook.com/*',
      'https://web.facebook.com/*', 'https://business.facebook.com/*'
    ]});
    if (fbTabs.length === 0) {
      showStatus('⏳ 正在打开 Facebook，10 秒后自动重新检测…', 'warn');
      btnGo.disabled = true;
      chrome.tabs.create({ url: FB_HOME_URL, active: false });
      setTimeout(() => {
        autoCard.classList.remove('show');
        loginBar.classList.remove('show');
        srcPill.classList.remove('show');
        multiArea.classList.remove('show');
        statusMsg.className = '';
        statusMsg.innerHTML = '';
        btnGo.disabled = false;
        autoDetect();
      }, 10000);
    } else {
      showStatus('⚠️ 未检测到公共主页编号，请打开 Facebook 专业日程本页面完全加载后重试，或将 创建Reels 页面加入书签', 'warn');
      btnGo.disabled = true;
    }
  } catch {
    showStatus('⚠️ 未检测到专业主页，请先打开 Facebook 或将 Reels 页面加入书签', 'warn');
    btnGo.disabled = true;
  }
}

// ── 版本检测 ──────────────────────────────────────────────────
function compareVersion(a, b) {
  const pa = a.split('.').map(Number), pb = b.split('.').map(Number);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const x = pa[i] || 0, y = pb[i] || 0;
    if (x > y) return 1; if (x < y) return -1;
  }
  return 0;
}

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
      ftDot.className = 'new'; ftDot.title = '发现新版本 v' + latest;
      ftVersion.classList.add('clickable'); ftVersion.title = '点击前往 GitHub 更新';
      updateTitle.textContent = '发现新版本 v' + latest;
      updateBar.classList.add('show');
    } else if (cmp > 0) {
      ftDot.className = 'beta'; ftDot.title = '内测版';
      ftVersion.textContent = 'v' + CURRENT_VERSION + ' 内测版';
    } else {
      ftDot.className = 'ok'; ftDot.title = '已是最新版';
    }
  } catch {
    ftDot.className = 'err'; ftDot.title = '更新检测失败';
  }
}

function openReleases() { chrome.tabs.create({ url: GITHUB_RELEASES }); }
ftVersion.addEventListener('click', () => { if (ftVersion.classList.contains('clickable')) openReleases(); });
updateGoBtn.addEventListener('click', openReleases);

// ── 主按钮 ────────────────────────────────────────────────────
btnGo.addEventListener('click', async () => {
  if (!detectedUrl) { showStatus('❌ 没有检测到可用链接', 'err'); return; }

  btnGo.disabled    = true;
  btnGo.textContent = '检测中...';

  try {
    const allTabs  = await getOpenTabs();
    const preTasks = [];

    if (settings.preOpenCalendar) {
      const calOpen = allTabs.some(t => t.url && isCalendarUrl(t.url));
      if (!calOpen && currentAssetId) preTasks.push({ url: buildCalendarUrl(currentAssetId), label: '日程本' });
    }

    btnGo.textContent = '启动中...';

    chrome.runtime.sendMessage({
      type:     'OPEN_TABS_WITH_PRE',
      preTasks,
      reelsUrl: detectedUrl,
      count
    }, () => { window.close(); });

  } catch {
    chrome.runtime.sendMessage({ type: 'OPEN_TABS', url: detectedUrl, count }, () => { window.close(); });
  }
});

// ── 初始化 ────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();

  ftVersion.textContent = 'v' + CURRENT_VERSION;
  setFt.textContent     = 'v' + CURRENT_VERSION + ' · 设置已自动保存';

  // 用记忆的默认值（上次打开数量）初始化主页面
  setCount(settings.defaultCount);

  // 渲染设置页 UI
  renderSettings();

  // 主检测流程
  autoDetect();

  // 更新检测（始终开启）
  checkForUpdate();
});
