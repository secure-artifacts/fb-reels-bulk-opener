'use strict';

// ══════════════════════════════════════════════════════════════════════
// content.js  —  只识别「公共主页信息公示」里的真实公共主页编号
//
// 核心原则：
//   ✅ 只从页面内嵌 script JSON 数据 / al: meta 标签里取真实 Page ID
//   ❌ 永不从 URL（路径/参数 id= / asset_id= 等）取任何数字作为 Page ID
//   ❌ 宁可返回空字符串，也不给错误编号
//
// 真实公共主页编号（Page ID）的特征：
//   • 只存在于页面 <script> 内嵌 JSON 里的特定字段（pageID / assetID 等）
//   • 或 al:android/ios meta 标签的 fb://page/XXXXX 里
//   • 长度通常 10~20 位，纯数字
//   • 与链接 URL 里出现的「链接数字」是两个完全不同的东西
// ══════════════════════════════════════════════════════════════════════

const BLACKLIST = [
  '管理公共主页', '首页', '你的主页', '个人资料', '专业', '账号',
  'Facebook', 'Meta Business Suite', 'Reels', '创建Reels',
  '发布', '设置', '通知', '消息', 'Messenger'
];

function isValid(txt) {
  if (!txt) return false;
  txt = txt.trim();
  if (!txt || txt.length > 60) return false;
  return !BLACKLIST.includes(txt);
}

// ── 主页名称检测（不变）────────────────────────────────────────────
function detectFbName() {
  let fbName = '';

  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle && isValid(ogTitle.content)) {
    fbName = ogTitle.content.trim();
  }

  if (!fbName && document.title) {
    let t = document.title
      .replace(/^\(\d+\+?\)\s*/, '')
      .replace(/\s*[|\-–—]\s*Facebook.*$/i, '')
      .trim();
    if (isValid(t)) fbName = t;
  }

  if (!fbName) {
    const h1s = document.querySelectorAll('h1');
    let best = '';
    for (let h of h1s) {
      const txt = (h.innerText || '').trim();
      if (isValid(txt) && txt.length > best.length) best = txt;
    }
    if (best) fbName = best;
  }

  if (!fbName) {
    const scripts = document.querySelectorAll('script');
    for (let script of scripts) {
      if (script.innerText.includes('"NAME":')) {
        const match = script.innerText.match(/"NAME":"(.*?)"/);
        if (match && match[1]) {
          try {
            const decoded = JSON.parse(`"${match[1]}"`);
            if (isValid(decoded)) { fbName = decoded; break; }
          } catch (e) {}
        }
      }
    }
  }

  return fbName;
}

// ── 真实公共主页编号检测 ───────────────────────────────────────────
// 严格规则：
//   只读 script 内嵌 JSON 里的特定字段 + al: meta 标签
//   不读 URL 任何部分（路径/参数/hash）
//   ID 必须是 10~20 位纯数字
//   宁可返回 '' 也不给错误 ID
function detectPageId() {

  // ── 合法 Page ID 校验器 ─────────────────────────────────────────
  // 必须满足：纯数字 & 长度 10~20 位
  function isValidPageId(val) {
    return typeof val === 'string' && /^\d{10,20}$/.test(val.trim());
  }

  // ── 策略 1：页面内嵌 script JSON 数据 ─────────────────────────
  // 只匹配「真正代表公共主页」的字段，按可信度排序
  // profileID 不在此列——它可能是个人账号 UID，不是 Page ID
  const PAGE_FIELDS = [
    // 带引号的字符串值（最常见）
    /"pageID"\s*:\s*"(\d+)"/,
    /"page_id"\s*:\s*"(\d+)"/,
    /"PAGE_ID"\s*:\s*"(\d+)"/,
    /"assetID"\s*:\s*"(\d+)"/,
    /"asset_id"\s*:\s*"(\d+)"/,
    /"owning_business_profile_id"\s*:\s*"(\d+)"/,
    /"page_profile_id"\s*:\s*"(\d+)"/,
    /"fanPageId"\s*:\s*"(\d+)"/,
    /"fan_page_id"\s*:\s*"(\d+)"/,
    // 无引号数字值
    /"pageID"\s*:\s*(\d{10,20})(?:[,\}])/,
    /"page_id"\s*:\s*(\d{10,20})(?:[,\}])/,
    /"assetID"\s*:\s*(\d{10,20})(?:[,\}])/,
    /"asset_id"\s*:\s*(\d{10,20})(?:[,\}])/,
  ];

  const scripts = document.querySelectorAll('script');
  for (const script of scripts) {
    const text = script.innerText;
    // 跳过空 script 和过大的 script（避免性能问题）
    if (!text || text.length < 10 || text.length > 600000) continue;
    // 必须包含关键词才扫描，加速跳过无关 script
    if (!/pageID|page_id|PAGE_ID|assetID|asset_id|owning_business_profile_id|page_profile_id|fanPageId/i.test(text)) continue;

    for (const pat of PAGE_FIELDS) {
      const m = text.match(pat);
      if (m && m[1] && isValidPageId(m[1])) {
        return m[1].trim();
      }
    }
  }

  // ── 策略 2：al:android / al:ios meta 标签 ─────────────────────
  // 格式：fb://page/117902023528460
  // 注意：只取 "page"，不取 "profile"（profile 是个人账号 UID）
  const AL_METAS = [
    'meta[property="al:android:url"]',
    'meta[property="al:ios:url"]',
  ];
  for (const sel of AL_METAS) {
    const el = document.querySelector(sel);
    if (el && el.content) {
      const m = el.content.match(/fb:\/\/page\/(\d+)/);
      if (m && m[1] && isValidPageId(m[1])) {
        return m[1].trim();
      }
    }
  }

  // ── 以上两个来源均未找到：返回空字符串 ────────────────────────
  // 绝不用 URL 参数/路径/og:url/profileID 等不可靠来源兜底
  return '';
}

// ── 缓存：只缓存确定是真实 Page ID 的值 ───────────────────────────
function saveToCache(name, pageId) {
  const data = { fb_cached_time: Date.now() };
  if (name)   data.fb_cached_name    = name;
  // 再次验证，确保缓存的一定是合法 Page ID
  if (pageId && /^\d{10,20}$/.test(pageId)) {
    data.fb_cached_page_id = pageId;
  } else {
    // 如果检测不到合法 ID，主动清除旧的错误缓存
    chrome.storage.local.remove('fb_cached_page_id');
  }
  if (name || pageId) chrome.storage.local.set(data);
}

// ── 页面加载完成后自动缓存一次 ────────────────────────────────────
setTimeout(() => {
  const name   = detectFbName();
  const pageId = detectPageId();
  saveToCache(name, pageId);
}, 2000);

// ── 响应 popup.js 的实时查询请求 ──────────────────────────────────
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'get_fb_data') {
    const name   = detectFbName();
    const pageId = detectPageId();
    saveToCache(name, pageId);
    // pageId 为空字符串表示"检测不到"，popup 需按此逻辑走书签模式
    sendResponse({ name: name || '', pageId: pageId || '' });
  }
  if (request.action === 'get_fb_name') {
    const name = detectFbName();
    sendResponse({ name: name || '' });
  }
  return true;
});
