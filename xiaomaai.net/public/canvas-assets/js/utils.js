// Utils.

// ===== UTILS =====
const ERROR_TEMPLATES = {
  400: { pattern: /size/i, msg: '图片尺寸不被支持，请尝试更小的尺寸' },
  401: { pattern: null, msg: 'API Key 无效或已过期，请重新配置' },
  403: { pattern: null, msg: '没有权限访问该模型，请检查 API Key 或联系服务商' },
  404: { pattern: /model/i, msg: '模型不存在，请检查模型名称' },
  408: { pattern: null, msg: '请求超时，服务器处理时间过长' },
  413: { pattern: null, msg: '请求体太大，请压缩参考图或减少图片数量' },
  429: { pattern: null, msg: '请求频率过高，请稍后再试' },
  500: { pattern: null, msg: '服务器内部错误，请稍后重试' },
  502: { pattern: null, msg: '网关错误，中转站可能暂时不可用' },
  503: { pattern: null, msg: '服务暂不可用，服务器可能在维护中' }
};

const MESSAGE_PATTERNS = [
  { pattern: /payload.*size.*exceed|request.*too.*large|body.*too.*large/i, msg: '请求体太大，请压缩参考图或减少图片数量' },
  { pattern: /image.*too.*large|image.*size/i, msg: '图片文件太大，请压缩后重试' },
  { pattern: /rate.*limit|too.*many.*request/i, msg: '请求频率过高，请等待 30 秒后重试' },
  { pattern: /timeout|timed?\s*out|abort/i, msg: '请求超时，可能是图片太大或服务器繁忙' },
  { pattern: /quota|billing|insufficient|balance/i, msg: '账户额度不足，请充值或更换 API Key' },
  { pattern: /content.*policy|safety|nsfw|blocked/i, msg: '内容被安全策略拦截，请修改提示词' },
  { pattern: /invalid.*key|authentication|unauthorized/i, msg: 'API Key 无效，请检查配置' },
  { pattern: /no available channel for model|no.*channel.*model|under group/i, msg: '当前 Key/分组没有该模型通道，请换模型或更换 API Key' },
  { pattern: /not.*support|unsupported/i, msg: '当前模型不支持此操作，请更换模型或尺寸' },
  { pattern: /network|fetch.*failed|ECONNREFUSED/i, msg: '网络连接失败，请检查网络或中转站地址' },
  { pattern: /CORS|cross.*origin/i, msg: '跨域请求被阻止，中转站可能不支持浏览器直接调用' }
];

function getErrMsg(err) {
  if (!err) return '未知错误';
  let raw = err.message || String(err);
  const status = err.status;

  try {
    const parsed = JSON.parse(raw);
    raw = parsed.error?.message || parsed.message || raw;
  } catch {}

  if (status && ERROR_TEMPLATES[status]) {
    const template = ERROR_TEMPLATES[status];
    if (!template.pattern || template.pattern.test(raw)) return template.msg;
  }

  for (const { pattern, msg } of MESSAGE_PATTERNS) {
    if (pattern.test(raw)) return msg;
  }

  return raw.length > 120 ? raw.slice(0, 120) + '...' : raw;
}

// ===== NODE STATUS HELPERS =====
// 使用 patchNodeVisuals 做轻量 DOM 更新，不破坏输入框和参数面板。
// 结构性变更（创建节点、切换模式）仍用 mkEl。
function setNodeGenerating(node, debugMsg) {
  node.status = 'generating';
  node.error = null;
  node.debug = debugMsg;
  patchNodeVisuals(node);
}

function setNodeDone(node, debugMsg) {
  node.status = 'done';
  node.error = null;
  node.debug = debugMsg;
  patchNodeVisuals(node);
}

function setNodeError(node, debugMsg, errMsg) {
  node.status = 'error';
  node.error = errMsg || '未知错误';
  node.debug = debugMsg;
  patchNodeVisuals(node);
}

async function downloadImg(id) {
  const node = S.nodes.find(n => n.id == id);
  if (!node || !node.result || node.mode === 'reverse') return;
  const ext = node.settings.format === 'jpeg' ? 'jpg' : node.settings.format;
  try {
    const res = await fetch(node.result);
    const blob = await res.blob();
    const u = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = u;
    a.download = `生成-${nodeNum(node)}-${Date.now()}.${ext}`;
    a.click();
    URL.revokeObjectURL(u);
  } catch { toast('下载失败', 'error'); }
}

function delNode(id) {
  if (S.nodes.length <= 1) { toast('至少保留一个节点', 'error'); return; }
  History.snapshot();
  S.connections = S.connections.filter(c => c.from != id && c.to != id);
  S.nodes = S.nodes.filter(n => n.id != id);
  const el = document.querySelector(`.node[data-id="${id}"]`);
  if (el) el.remove();
  S.nodes.forEach((n, i) => {
    const el2 = document.querySelector(`.node[data-id="${n.id}"] .node-title .num`);
    if (el2) el2.textContent = i + 1;
  });
  updateConn();
  renderGallery();
  if (typeof renderGenerationHistory === 'function') renderGenerationHistory();
  saveNow();
}

function clearAll() {
  History.snapshot();
  document.querySelectorAll('.node').forEach(e => e.remove());
  S.nodes = [];
  S.connections = [];
  updateConn();
  addNode();
  renderGallery();
  if (typeof renderGenerationHistory === 'function') renderGenerationHistory();
  saveNow();
}

function toast(msg, type = '', duration = 3500) {
  if (type === 'error' && globalThis.window?.AICanvasLog?.record) {
    globalThis.window?.AICanvasLog.record('error', {
      source: 'toast',
      title: '界面错误提示',
      summary: msg
    });
  }
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast' + (type ? ' ' + type : '');
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), duration);
}


// ===== IMAGE FILE HELPERS =====
function approxDataUrlBytes(dataUrl) {
  const raw = String(dataUrl || '').split(',')[1] || '';
  return Math.floor(raw.length * 0.75);
}

function dataUrlToBlob(dataUrl) {
  return fetch(dataUrl).then(r => r.blob());
}

function loadImageFromDataUrl(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('图片读取失败'));
    img.src = dataUrl;
  });
}

function canvasToDataUrl(canvas, mime = 'image/jpeg', quality = 0.88) {
  return canvas.toDataURL(mime, quality);
}

async function compressDataUrl(dataUrl, maxBytes = MAX_REFERENCE_IMAGE_BYTES) {
  if (approxDataUrlBytes(dataUrl) <= maxBytes) return dataUrl;
  const img = await loadImageFromDataUrl(dataUrl);
  let maxSide = IMAGE_UPLOAD_MAX_SIDE;
  let quality = 0.86;
  let out = dataUrl;

  for (let i = 0; i < 8; i++) {
    const ratio = Math.min(1, maxSide / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * ratio));
    const h = Math.max(1, Math.round(img.height * ratio));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, w, h);
    out = canvasToDataUrl(canvas, 'image/jpeg', quality);
    if (approxDataUrlBytes(out) <= maxBytes) return out;
    maxSide = Math.max(900, Math.round(maxSide * 0.82));
    quality = Math.max(0.62, quality - 0.07);
  }
  return out;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = ev => resolve(ev.target.result);
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsDataURL(file);
  });
}

async function fileToReferenceImage(file) {
  if (!file || !file.type.startsWith('image/')) throw new Error('只支持图片文件');
  const raw = await readFileAsDataUrl(file);
  return await compressDataUrl(raw, MAX_REFERENCE_IMAGE_BYTES);
}

async function fileToReferenceImageInfo(file) {
  if (!file || !file.type.startsWith('image/')) throw new Error('只支持图片文件');
  const raw = await readFileAsDataUrl(file);
  return await dataUrlToReferenceImageInfo(raw);
}

async function dataUrlToReferenceImageInfo(raw) {
  const img = await loadImageFromDataUrl(raw);
  const dataUrl = await compressDataUrl(raw, MAX_REFERENCE_IMAGE_BYTES);
  const width = img.naturalWidth || img.width || 0;
  const height = img.naturalHeight || img.height || 0;
  return {
    dataUrl,
    width,
    height,
    aspectRatio: width && height ? width / height : 4 / 3
  };
}

function normalizeReferenceImages(node) {
  if (!node) return [];
  if (!Array.isArray(node.referenceImages)) node.referenceImages = [];
  node.referenceImages = node.referenceImages.filter(Boolean).slice(0, MAX_REFERENCE_IMAGES);
  if (node.mode === 'img2img') {
    node.image = node.image || null;
    if (!node.result) node.result = node.image || null;
  }
  return node.referenceImages;
}

async function buildReferenceContactSheet(dataUrls) {
  const refs = (dataUrls || []).filter(Boolean).slice(0, MAX_REFERENCE_IMAGES);
  if (refs.length <= 1) return refs[0] || '';
  const imgs = await Promise.all(refs.map(loadImageFromDataUrl));
  const cell = 768;
  const gap = 24;
  const cols = refs.length === 2 ? 2 : 2;
  const rows = Math.ceil(refs.length / cols);
  const canvas = document.createElement('canvas');
  canvas.width = cols * cell + (cols + 1) * gap;
  canvas.height = rows * cell + (rows + 1) * gap;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  imgs.forEach((img, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const x = gap + col * (cell + gap);
    const y = gap + row * (cell + gap);
    const scale = Math.min(cell / img.width, cell / img.height);
    const w = Math.round(img.width * scale);
    const h = Math.round(img.height * scale);
    const dx = x + Math.round((cell - w) / 2);
    const dy = y + Math.round((cell - h) / 2);
    ctx.fillStyle = '#f4f4f6';
    ctx.fillRect(x, y, cell, cell);
    ctx.drawImage(img, dx, dy, w, h);
    ctx.fillStyle = 'rgba(0,0,0,0.58)';
    ctx.beginPath();
    ctx.arc(x + 34, y + 34, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(idx + 1), x + 34, y + 35);
  });
  return await compressDataUrl(canvas.toDataURL('image/jpeg', 0.9), MAX_REFERENCE_IMAGE_BYTES);
}

// ===== REF URL PICKER =====
// 最小改动：抽 ref 的公网 URL 字段。
// 之前 URL 探测散在 3 处（buildImageEditFormDataV2 / pickSketchSubjectRemoteUrl / collectRefsForNode
// 的 sketch 注入），规则不一致，导致 image 节点公网图被吞、@主图 实际没图。
// 统一规则：① 显式 remoteUrl（来自 generate 节点产物的 COS URL）
//         ② ref.image 本身是 http(s) URL（image 节点、快速导入图）
// 都没有 → 返回空，由调用方决定 catbox 兜底或走 OpenAI blob 通道
function pickRefRemoteUrl(ref) {
  if (!ref) return '';
  const explicit = String(ref.remoteUrl || '').trim();
  if (/^https?:\/\//i.test(explicit)) return explicit;
  if (typeof ref.image === 'string') {
    const fromImage = ref.image.trim();
    if (/^https?:\/\//i.test(fromImage)) return fromImage;
  }
  return '';
}
