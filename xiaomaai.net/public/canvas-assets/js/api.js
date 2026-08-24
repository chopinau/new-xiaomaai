// Network/API boundary. Generation modules should call these helpers instead of fetch directly.

// ===== API / NETWORK =====
function authHeaders(extra = {}) {
  return { 'Authorization': 'Bearer ' + getApiKey(), ...extra };
}

function summarizeRequest(kind, payload) {
  const size = payload instanceof FormData ? payload.get('size') : payload?.size;
  const model = payload instanceof FormData ? payload.get('model') : payload?.model;
  const n = payload instanceof FormData ? payload.get('n') : payload?.n;
  const responseFormat = payload instanceof FormData ? payload.get('response_format') : payload?.response_format;
  return `${kind} · ${model || 'unknown'} · ${size || 'unknown'} · ${n || 1}张${responseFormat ? ' · ' + responseFormat : ''}`;
}

function getLogNodeMeta(options = {}) {
  return {
    nodeId: options?.nodeId || '',
    nodeType: options?.nodeType || '',
    nodeTitle: options?.nodeTitle || ''
  };
}

function normalizeImageEditFieldName(value = '') {
  return String(value || '').trim() === 'image[]' ? 'image[]' : 'image';
}

function summarizeFormDataForLog(fd) {
  if (!(fd instanceof FormData)) return {};
  const images = [];
  let mask = null;
  for (const [name, value] of fd.entries()) {
    if (!(value instanceof Blob)) continue;
    const item = {
      field: name,
      fileName: value.name || '',
      type: value.type || 'unknown',
      size: value.size || 0
    };
    if (name === 'mask') mask = item;
    if (name === 'image' || name === 'image[]') images.push(item);
  }
  return {
    model: String(fd.get('model') || ''),
    size: String(fd.get('size') || ''),
    quality: String(fd.get('quality') || ''),
    outputFormat: String(fd.get('output_format') || ''),
    responseFormat: String(fd.get('response_format') || ''),
    n: String(fd.get('n') || ''),
    imageCount: images.length,
    imageFields: images.map(item => item.field).join(', '),
    images,
    hasMask: Boolean(mask),
    mask
  };
}

function getRequestBodySummary(body) {
  if (body instanceof FormData) return summarizeFormDataForLog(body);
  if (!body || typeof body !== 'object') return {};
  return {
    model: String(body.model || ''),
    size: String(body.size || ''),
    quality: String(body.quality || ''),
    outputFormat: String(body.output_format || ''),
    responseFormat: String(body.response_format || ''),
    n: String(body.n || '')
  };
}

function getRawErrorMessage(err) {
  if (!err) return '';
  let raw = err.message || String(err);
  try {
    const parsed = JSON.parse(raw);
    raw = parsed.error?.message || parsed.message || raw;
  } catch {}
  return String(raw || '');
}

function isImageSizeError(err) {
  const raw = getRawErrorMessage(err);
  if (err?.status === 413) return false;
  return /size|dimension|resolution|width|height|unsupported.*(size|dimension)|invalid.*(size|dimension)|尺寸|分辨率/i.test(raw);
}

function shouldRetryResponseFormat(err) {
  if (isUserCanceledError(err)) return false;
  if (isImageSizeError(err)) return false;
  const raw = getRawErrorMessage(err);
  return /data\[0\]|接口返回为空|返回为空|url|b64_json|response[_\s-]?format|format|没有 url|没有.*b64/i.test(raw);
}

function isUserCanceledError(err) {
  return err?.code === 'USER_CANCELED';
}

function createUserCanceledError() {
  const err = new Error('已终止本地请求。已发出的远端任务可能仍在中转站处理并计费。');
  err.code = 'USER_CANCELED';
  err.userCanceled = true;
  return err;
}

function canUseNativeApiRequest() {
  return Boolean(globalThis.window?.__TAURI__?.core?.invoke);
}

function sanitizeNativeHeaders(headers = {}) {
  const clean = {};
  Object.entries(headers || {}).forEach(([key, value]) => {
    const lower = String(key || '').toLowerCase();
    if (!key || lower === 'content-type' && value === undefined) return;
    clean[key] = String(value);
  });
  return clean;
}

function parseNativeResponseText(text) {
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = null; }
  return data;
}

async function formDataToNativeFields(fd) {
  const fields = [];
  for (const [name, value] of fd.entries()) {
    if (value instanceof Blob) {
      fields.push({
        name,
        dataUrl: await blobToDataUrl(value),
        fileName: value.name || `${name}.png`
      });
    } else {
      fields.push({ name, value: String(value ?? '') });
    }
  }
  return fields;
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error || new Error('Blob 读取失败'));
    reader.readAsDataURL(blob);
  });
}

async function nativeApiRequest(url, init = {}) {
  const invoke = globalThis.window?.__TAURI__?.core?.invoke;
  if (!invoke) throw new Error('Tauri 原生请求通道不可用');
  const headers = sanitizeNativeHeaders(init.headers || {});
  const body = init.body;
  const payload = {
    url,
    method: init.method || 'GET',
    headers
  };
  if (body instanceof FormData) {
    delete payload.headers['Content-Type'];
    delete payload.headers['content-type'];
    payload.form = await formDataToNativeFields(body);
  } else if (typeof body === 'string' && body) {
    try {
      payload.json = JSON.parse(body);
    } catch {
      payload.json = body;
    }
  }
  return await invoke('api_request', { payload });
}

async function runNativeApiRequestWithAbort(url, init, signal) {
  const pending = nativeApiRequest(url, init);
  if (!signal) return await pending;
  if (signal.aborted) {
    const err = new Error('The operation was aborted.');
    err.name = 'AbortError';
    throw err;
  }
  return await Promise.race([
    pending,
    new Promise((_, reject) => {
      signal.addEventListener('abort', () => {
        const err = new Error('The operation was aborted.');
        err.name = 'AbortError';
        reject(err);
      }, { once: true });
    })
  ]);
}

function parseApiSizeValue(size) {
  const match = String(size || '').match(/^(\d+)x(\d+)$/i);
  if (!match) return null;
  const w = Number(match[1]);
  const h = Number(match[2]);
  if (!Number.isFinite(w) || !Number.isFinite(h)) return null;
  return { w, h, area: w * h, ratio: w / h };
}

function getNextSmallerImageSize(currentSize, triedSizes = []) {
  const current = parseApiSizeValue(currentSize);
  if (!current || String(currentSize) === '1024x1024') return '';
  const tried = new Set((triedSizes || []).map(String));
  const configured = (typeof GPT_IMAGE_SIZES !== 'undefined' ? GPT_IMAGE_SIZES : [])
    .map(item => item.value)
    .filter(value => value && value !== 'auto')
    .map(value => ({ value, ...parseApiSizeValue(value) }))
    .filter(item => item.w && item.area < current.area && !tried.has(item.value));

  if (!configured.length) return tried.has('1024x1024') ? '' : '1024x1024';

  const currentOrientation = current.w === current.h ? 'square' : current.w > current.h ? 'landscape' : 'portrait';
  const oriented = configured.filter(item => {
    const orientation = item.w === item.h ? 'square' : item.w > item.h ? 'landscape' : 'portrait';
    return orientation === currentOrientation || orientation === 'square';
  });
  const candidates = oriented.length ? oriented : configured;
  candidates.sort((a, b) => {
    const ratioA = Math.abs(Math.log(a.ratio / current.ratio));
    const ratioB = Math.abs(Math.log(b.ratio / current.ratio));
    if (ratioA !== ratioB) return ratioA - ratioB;
    return b.area - a.area;
  });
  return candidates[0]?.value || '';
}

async function fetchWithTimeout(url, init, timeoutMs = API_TIMEOUT_MS, options = {}) {
  const controller = new AbortController();
  const externalSignal = options?.signal;
  const started = Date.now();
  let timedOut = false;
  let externalAborted = Boolean(externalSignal?.aborted);
  const abortFromExternal = () => {
    externalAborted = true;
    controller.abort();
  };
  if (externalAborted) controller.abort();
  else externalSignal?.addEventListener?.('abort', abortFromExternal, { once: true });
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  try {
    const native = canUseNativeApiRequest();
    const res = native
      ? await runNativeApiRequestWithAbort(url, init, controller.signal)
      : await fetch(url, { ...init, signal: controller.signal });
    const text = native ? res.text : await res.text();
    const elapsed = ((Date.now() - started) / 1000).toFixed(1);
    const data = parseNativeResponseText(text);
    if (!res.ok) {
      const msg = data?.error?.message || data?.message || text || `HTTP ${res.status}`;
      const err = new Error(msg);
      err.elapsed = elapsed;
      err.status = res.status;
      err.responseText = text;
      err.requestSummary = getRequestBodySummary(init?.body);
      throw err;
    }
    if (!data?.data?.[0]) {
      const err = new Error('接口返回为空：未找到 data[0]');
      err.elapsed = elapsed;
      err.status = res.status;
      throw err;
    }
    return { data, elapsed };
  } catch (err) {
    if (err.name === 'AbortError') {
      if (externalAborted && !timedOut) throw createUserCanceledError();
      const e = new Error(`前端等待超过 ${Math.round(timeoutMs / 1000)} 秒，已自动停止。请求可能仍在中转站排队或被阻塞。`);
      e.elapsed = Math.round(timeoutMs / 1000);
      globalThis.window?.AICanvasLog?.record?.('error', {
        source: 'api',
        title: 'API 请求超时',
        summary: e.message,
        ...getLogNodeMeta(options),
        detail: { url, method: init?.method || 'GET', timeoutMs }
      });
      throw e;
    }
    globalThis.window?.AICanvasLog?.record?.('error', {
      source: 'api',
      title: 'API 请求失败',
      summary: getRawErrorMessage(err) || '请求失败',
      ...getLogNodeMeta(options),
      detail: {
        url,
        method: init?.method || 'GET',
        status: err?.status || '',
        elapsed: err?.elapsed || '',
        bodyKind: init?.body instanceof FormData ? 'FormData' : typeof init?.body,
        request: err?.requestSummary || getRequestBodySummary(init?.body),
        response: String(err?.responseText || err?.message || '').slice(0, 1200)
      }
    });
    throw err;
  } finally {
    clearTimeout(timer);
    externalSignal?.removeEventListener?.('abort', abortFromExternal);
  }
}

// ====== 小马AI 域 (api.lk888.ai / api.lk666.ai) 媒体生成专用通道 ======
// 平台统一走 /v1/media/generate 异步任务，提交后拿到 task_id，再轮询 /v1/skills/task-status
// 这里不依赖 OpenAI DALL-E 风格的 /v1/images/generations（平台已无此端点）

function isXiaomaMediaOnlyBase() {
  try {
    const base = (typeof getApiBase === 'function' ? getApiBase() : '') || '';
    return /api\.lk888\.ai|api\.lk666\.ai|xomodel\.com|xiaomageai\.com/i.test(base);
  } catch {
    return false;
  }
}

function sizeToImageSizeTier(size) {
  const parsed = parseApiSizeValue(size);
  if (!parsed) return '1K';
  if (parsed.area >= 3800 * 2100) return '4K';   // 3840x2160 / 2160x3840
  if (parsed.area >= 2000 * 2000) return '2K';   // 2048x2048 / 2048x1152 / 1152x2048 / 2160x2880 / 2880x2160
  return '1K';
}

function sizeToAspectRatio(size) {
  const m = String(size || '').match(/^(\d+)x(\d+)$/i);
  if (!m) return '1:1';
  const w = Number(m[1]);
  const h = Number(m[2]);
  if (w === h) return '1:1';
  const exact = {
    '1536x1024': '3:2', '1024x1536': '2:3',
    '1792x1024': '16:9', '1024x1792': '9:16',
    '2048x1024': '2:1', '1024x2048': '1:2',
    '2048x1152': '16:9', '1152x2048': '9:16',
    '3840x2160': '16:9', '2160x3840': '9:16',
    '2048x1536': '4:3', '1536x2048': '3:4',
    '2160x2880': '3:4', '2880x2160': '4:3',
    '3840x1600': '12:5', '2048x864': '21:9', '864x2048': '9:21'
  };
  if (exact[`${w}x${h}`]) return exact[`${w}x${h}`];
  const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
  const g = gcd(w, h);
  return `${Math.round(w / g)}:${Math.round(h / g)}`;
}

function buildMediaGenerateBody(payload = {}) {
  const model = String(payload.model || '').trim()
    || (typeof getSelectedImageModel === 'function' ? String(getSelectedImageModel() || '').trim() : '')
    || 'gpt-image-2';
  const prompt = String(payload.prompt || '');
  const size = String(payload.size || '1024x1024');
  const params = {
    aspectRatio: sizeToAspectRatio(size),
    imageSize: sizeToImageSizeTier(size)
  };
  if (payload.quality && payload.quality !== 'auto') params.quality = payload.quality;
  if (payload.output_format && payload.output_format !== 'png') params.output_format = payload.output_format;
  if (payload.background && payload.background !== 'auto') params.background = payload.background;
  // 兼容单图：payload.image / payload.imageFieldName / payload.images
  if (Array.isArray(payload.images) && payload.images.length) {
    params.images = payload.images.filter(Boolean);
  } else if (payload.image) {
    params.images = Array.isArray(payload.image) ? payload.image.filter(Boolean) : [payload.image];
  }
  const body = { model, prompt, params };
  if (payload.n && Number(payload.n) > 1) body.count = Number(payload.n);
  return body;
}

async function submitMediaTask(body, options = {}) {
  const endpoint = buildApiEndpoint(getApiBase(), '/v1/media/generate');
  const timeout = getTimeoutForModel(body.model, body.params?.imageSize);
  console.info('[AI Canvas] submit media task', body.model, body.params?.imageSize, body.params?.aspectRatio, '→', endpoint);
  globalThis.window?.AICanvasLog?.record?.('info', {
    source: 'api',
    title: '提交媒体生成任务',
    summary: `${body.model} · ${body.params?.imageSize || 'auto'} · ${body.params?.aspectRatio || 'auto'}`,
    ...getLogNodeMeta(options),
    detail: {
      url: endpoint,
      promptLength: String(body.prompt || '').length,
      promptPreview: String(body.prompt || '').slice(0, 120),
      body
    }
  });
  // 不能用 fetchWithTimeout：它强制要求响应里有 data[0]（OpenAI DALL-E 时代格式）
  // 平台 /v1/media/generate 返回 data.data.task_id（对象），走原生 fetch + 自管超时
  const controller = new AbortController();
  const externalSignal = options?.signal;
  const onAbort = () => controller.abort();
  if (externalSignal?.aborted) controller.abort();
  else externalSignal?.addEventListener?.('abort', onAbort, { once: true });
  const timer = setTimeout(() => controller.abort(), timeout);
  const started = Date.now();
  let res;
  try {
    res = await fetch(endpoint, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(body),
      signal: controller.signal
    });
  } catch (err) {
    clearTimeout(timer);
    externalSignal?.removeEventListener?.('abort', onAbort);
    if (err?.name === 'AbortError') {
      if (externalSignal?.aborted) throw createUserCanceledError();
      throw new Error(`提交任务超过 ${Math.round(timeout / 1000)} 秒未响应`);
    }
    throw err;
  }
  const elapsed = ((Date.now() - started) / 1000).toFixed(1);
  const text = await res.text().catch(() => '');
  clearTimeout(timer);
  externalSignal?.removeEventListener?.('abort', onAbort);
  if (!res.ok) {
    throw new Error(`提交失败 HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
  let json;
  try { json = JSON.parse(text); } catch { json = null; }
  // 响应是包裹型：{ code, data: { task_id, ... }, msg }
  // 也兼容扁平 / 双层 data
  const taskId = Number(
    json?.data?.task_id
    || json?.data?.任务id
    || json?.data?.任务ID
    || json?.task_id
    || 0
  );
  if (!taskId) {
    throw new Error('提交任务后未返回 task_id：' + text.slice(0, 200));
  }
  return { taskId, data: json, elapsed };
}

async function pollMediaTaskStatus(taskId, options = {}) {
  // 平台两个等价端点都试，优先 /v1/skills/task-status
  const endpoints = [
    buildApiEndpoint(getApiBase(), `/v1/skills/task-status?task_id=${encodeURIComponent(taskId)}`),
    buildApiEndpoint(getApiBase(), `/v1/media/status?task_id=${encodeURIComponent(taskId)}`)
  ];
  const maxAttempts = 180;          // 5s × 180 = 15 分钟
  const intervalMs = 5000;
  for (let i = 0; i < maxAttempts; i++) {
    if (options?.signal?.aborted) throw createUserCanceledError();
    await new Promise(r => setTimeout(r, intervalMs));
    if (options?.signal?.aborted) throw createUserCanceledError();
    // 两个端点都问一遍，取有效那个
    let task = null;
    for (const endpoint of endpoints) {
      let res;
      try {
        res = await fetch(endpoint, { method: 'GET', headers: authHeaders(), signal: options?.signal });
      } catch (err) {
        if (err?.name === 'AbortError' || isUserCanceledError(err)) throw err;
        continue;
      }
      if (!res.ok) continue;
      const data = await res.json().catch(() => null);
      if (!data) continue;
      // 响应是扁平结构（不是 { data: { ... } }），但兼容嵌套
      task = data?.data?.data || data?.data || data;
      if (task && (task.is_final !== undefined || task.result_url || task.error || task.status || task.state)) break;
    }
    if (!task) {
      console.warn('[AI Canvas] task-status 两个端点都拿不到有效响应，下一轮继续');
      continue;
    }
    // 防御：lk888 响应里的 task_id 必须跟请求的一致（防止抽风串数据）
    if (task.task_id !== undefined && task.task_id !== null && String(task.task_id) !== String(taskId)) {
      console.warn(`[AI Canvas] 轮询响应 task_id 不匹配: 期望 ${taskId}，收到 ${task.task_id}，丢弃`);
      continue;
    }
    // 字段名兜底：lk888 不同接口可能用 url / image_url / output_url / image
    const resolvedUrl = task.result_url || task.url || task.image_url || task.output_url || task.image || task.data?.url || null;
    if (resolvedUrl && /^https?:\/\//.test(resolvedUrl)) {
      return { result_url: resolvedUrl, task, data: task };
    }
    const isFinal = task.is_final === true || task.is_final === 'true' || task.is_final === 1;
    if (isFinal) {
      const status = String(task.status || task.state || '');
      const isSuccess = /完成|success|finished|succeeded|completed|done/i.test(status) || (!task.error && resolvedUrl);
      if (isSuccess) {
        return { result_url: resolvedUrl || null, task, data: task };
      }
      throw new Error(`任务失败：${task.error || status || '未知错误'}`);
    }
    // 进行中：避免噪音，仅在第 6/12/24 次及之后每 10 次打印
    if (i === 5 || i === 11 || i === 23 || i % 10 === 0) {
      console.info(`[AI Canvas] 任务 ${taskId} 进行中：${task.progress || ''} ${task.status || task.state || ''}`);
    }
  }
  throw new Error(`轮询任务 ${taskId} 超时（${Math.round(maxAttempts * intervalMs / 1000)} 秒）`);
}

async function runMediaGenerateTask(payload, options = {}) {
  // payload 形如 { model, prompt, size, n, image? }，按需转 platform 格式
  const body = buildMediaGenerateBody(payload);
  const submitStart = Date.now();
  const { taskId, data: submitData, elapsed: submitElapsed } = await submitMediaTask(body, options);
  console.info(`[AI Canvas] 任务已提交 task_id=${taskId} (${submitElapsed}s)，开始轮询…`);
  const { result_url, task } = await pollMediaTaskStatus(taskId, options);
  const totalElapsed = ((Date.now() - submitStart) / 1000).toFixed(1);
  console.info(`[AI Canvas] 任务 ${taskId} 完成 result_url=${result_url} (${totalElapsed}s)`);
  globalThis.window?.AICanvasLog?.record?.('info', {
    source: 'api',
    title: '媒体任务完成',
    summary: `${payload.model || ''} · ${taskId} · ${totalElapsed}s`,
    ...getLogNodeMeta(options),
    detail: { taskId, result_url, totalElapsed, task }
  });
  // 包成与原 pickImageUrls 兼容的格式：{ data: { data: [{ url }] } }
  return {
    data: { data: [{ url: result_url, ...task }] },
    elapsed: totalElapsed,
    rawTask: task,
    taskId  // 暴露给 UI 用来"同步小马AI 后台"
  };
}

async function postImageGenerationJSON(payload, options = {}) {
  // 小马AI 域走 /v1/media/generate + 轮询；其他域保持原 OpenAI 行为
  if (isXiaomaMediaOnlyBase()) {
    return runMediaGenerateTask(payload, options);
  }
  const endpoint = buildApiEndpoint(getApiBase(), '/v1/images/generations');
  console.info('[AI Canvas] request', summarizeRequest('generations', payload), endpoint);
  globalThis.window?.AICanvasLog?.record?.('info', {
    source: 'api',
    title: '发送生图请求',
    summary: summarizeRequest('generations', payload),
    ...getLogNodeMeta(options),
    detail: { url: endpoint, promptLength: String(payload?.prompt || '').length, promptPreview: String(payload?.prompt || '').slice(0, 120) }
  });
  const timeout = getTimeoutForModel(payload?.model, payload?.size);
  return fetchWithTimeout(endpoint, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload)
  }, timeout, options);
}

async function postImageGenerationJSONWithFormatFallback(payload, options = {}) {
  // 小马AI 域：直接走异步任务通道，response_format 重试逻辑无意义
  if (isXiaomaMediaOnlyBase()) {
    return runMediaGenerateTask(payload, options);
  }
  const originalFormat = payload?.response_format || '';
  const formats = Array.from(new Set([originalFormat, 'b64_json', 'url'].filter(format => format !== undefined)));
  let lastErr = null;

  for (let i = 0; i < formats.length; i++) {
    if (options?.signal?.aborted) throw createUserCanceledError();
    const responseFormat = formats[i];
    const nextPayload = { ...payload };
    if (responseFormat) nextPayload.response_format = responseFormat;
    else delete nextPayload.response_format;

    try {
      const result = await postImageGenerationJSON(nextPayload, options);
      result.responseFormat = responseFormat || 'default';
      return result;
    } catch (err) {
      lastErr = err;
      if (isUserCanceledError(err)) throw err;
      if (!shouldRetryResponseFormat(err) || i === formats.length - 1) throw err;
      console.warn('[AI Canvas] generation response format failed, retrying:', getRawErrorMessage(err), 'next=', formats[i + 1] || 'default');
    }
  }

  throw lastErr || new Error('图片生成失败');
}

// ====== catbox 兜底：把 dataURL / Blob / 非公网 URL 转成公网 URL ======
// v2-app.js 的 buildImageEditFormDataV2 会调 typeof ensureCatboxPublicUrl === 'function' 来决定是否走 catbox
// 这里实现它。带 hash 缓存 + 并发去重，避免同一张图重复上传。
//
// 直连 catbox.moe 在浏览器里被 CORS 拦截（猫盒服务端不响应 OPTIONS 预检）。
// 缓存：hash(dataUrl) → url，避免重复上传
const _catboxUrlCache = new Map();
// 并发去重：hash(dataUrl) → Promise<url>，避免同一张图在多个节点并行请求时被上传 N 次
const _catboxInflight = new Map();
// Cloudflare Worker 代理：固定走 https://api.xiaomaai.net/upload
// 优势：Worker 在 Cloudflare 全球边缘节点，可达 catbox.moe；
// 浏览器同域名不同子域（xiaomaai.net → api.xiaomaai.net）走 CORS，Worker 已配 ACAO=* 头
// 适用于：localhost:3100、xiaomaai.net、Vercel Preview、Pages 预览
const CATBOX_LITTERBOX_URL = 'https://api.xiaomaai.net/upload';
// Node 测试脚本回退（在没有 location 的环境里）：直连 catbox
const CATBOX_LITTERBOX_URL_NODE = 'https://litterbox.catbox.moe/resources/internals/api.php';
const CATBOX_MAX_SIDE = 2048;

function _catboxHashDataUrl(dataUrl) {
  const sample = String(dataUrl || '');
  if (!sample) return '0';
  // FNV-1a 64-bit，截取前后 64KB
  let h1 = 0xcbf29ce484222325n;
  const prime = 0x100000001b3n;
  const mask = (1n << 64n) - 1n;
  const len = Math.min(sample.length, 131072);
  for (let i = 0; i < len; i++) {
    h1 = (h1 ^ BigInt(sample.charCodeAt(i))) & mask;
    h1 = (h1 * prime) & mask;
  }
  return h1.toString(36) + ':' + sample.length;
}

async function _catboxCompressBlob(blob) {
  if (!blob || !/^image\//.test(blob.type || '')) return blob;
  try {
    const dataUrl = await blobToDataUrl(blob);
    const img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error('图片解码失败'));
      i.src = dataUrl;
    });
    const w = img.naturalWidth || img.width || 1;
    const h = img.naturalHeight || img.height || 1;
    const maxDim = Math.max(w, h);
    if (maxDim <= CATBOX_MAX_SIDE) return blob;
    const ratio = CATBOX_MAX_SIDE / maxDim;
    const nw = Math.max(1, Math.round(w * ratio));
    const nh = Math.max(1, Math.round(h * ratio));
    const canvas = document.createElement('canvas');
    canvas.width = nw; canvas.height = nh;
    canvas.getContext('2d').drawImage(img, 0, 0, nw, nh);
    const compressedDataUrl = canvas.toDataURL('image/png');
    const r = await fetch(compressedDataUrl);
    return await r.blob();
  } catch (e) {
    console.warn('[AI Canvas] catbox 压缩失败，上传原图：', e?.message || e);
    return blob;
  }
}

async function ensureCatboxPublicUrl(input, options = {}) {
  // 已是公网 URL：直接返回
  if (typeof input === 'string' && /^https?:\/\//i.test(input)) return input;
  if (input == null) throw new Error('ensureCatboxPublicUrl: 输入为空');

  // 统一先拿到 dataURL 用于 hash 缓存 key
  let dataUrl;
  let blob;
  if (typeof input === 'string' && /^data:/i.test(input)) {
    dataUrl = input;
    const r = await fetch(dataUrl);
    blob = await r.blob();
  } else if (input instanceof Blob) {
    blob = input;
    dataUrl = await blobToDataUrl(blob);
  } else if (typeof input === 'string') {
    // 非 dataURL 字符串（如 data:image/png;base64,xxx 但大小写不规范）→ 当 dataURL 处理
    if (/^data:/i.test(input)) {
      dataUrl = input;
    } else {
      // 兜底：当作远程 URL 下载
      const r = await fetch(input);
      if (!r.ok) throw new Error(`下载源图失败 HTTP ${r.status}`);
      blob = await r.blob();
      dataUrl = await blobToDataUrl(blob);
    }
  } else {
    throw new Error('ensureCatboxPublicUrl: 不支持的输入类型');
  }

  const hash = _catboxHashDataUrl(dataUrl);
  if (_catboxUrlCache.has(hash)) return _catboxUrlCache.get(hash);
  if (_catboxInflight.has(hash)) return _catboxInflight.get(hash);

  // 压缩后上传（走本地 /upload 代理）
  const uploadBlob = await _catboxCompressBlob(blob);
  const inflight = (async () => {
    const fd = new FormData();
    fd.append('reqtype', 'fileupload');
    fd.append('time', options.ttl || '24h');
    fd.append('fileToUpload', uploadBlob, 'image.png');
    const res = await fetch(CATBOX_LITTERBOX_URL, { method: 'POST', body: fd });
    if (!res.ok) throw new Error(`catbox 上传失败 HTTP ${res.status}`);
    const body = await res.json().catch(() => null);
    if (body && body.url) {
      // 代理返回 { url, expiresIn } 格式
      const url = body.url;
      if (!/^https:\/\/litter\.catbox\.moe\//i.test(url)) {
        throw new Error('catbox 返回非 URL: ' + url.slice(0, 200));
      }
      _catboxUrlCache.set(hash, url);
      _catboxInflight.delete(hash);
      return url;
    }
    // 兼容直接 catbox（Node 测试脚本）
    const url = (await res.text()).trim();
    if (!/^https:\/\/litter\.catbox\.moe\//i.test(url)) {
      throw new Error('catbox 返回非 URL: ' + url.slice(0, 200));
    }
    _catboxUrlCache.set(hash, url);
    _catboxInflight.delete(hash);
    return url;
  })();
  _catboxInflight.set(hash, inflight);
  try {
    return await inflight;
  } catch (e) {
    _catboxInflight.delete(hash);
    throw e;
  }
}

async function runImageEditFromFormData(fd, options = {}) {
  // 1. 抽出 text 字段
  const prompt = String(fd.get('prompt') || '');
  const model = String(fd.get('model') || '').trim()
    || (typeof getSelectedImageModel === 'function' ? String(getSelectedImageModel() || '').trim() : '')
    || 'gpt-image-2';
  const size = String(fd.get('size') || '1024x1024');
  const n = Number(fd.get('n') || 1);
  const quality = String(fd.get('quality') || '');
  const outputFormat = String(fd.get('output_format') || '');

  // 2. 收集 _remote_url_<i>（buildImageEditFormDataV2 已为有公网 URL 的 ref 填好）
  const remoteByIndex = new Map();
  for (const [key, value] of fd.entries()) {
    const m = /^_remote_url_(\d+)$/.exec(key);
    if (!m) continue;
    if (typeof value === 'string' && /^https?:\/\//i.test(value)) {
      remoteByIndex.set(Number(m[1]), value);
    }
  }

  // 3. 收集 image / image[] Blob（v2-app.js 走 catbox 失败时的兜底）
  const blobs = [];
  for (const [key, value] of fd.entries()) {
    if (value instanceof Blob && (key === 'image' || key === 'image[]')) {
      blobs.push(value);
    }
  }

  // 4. 合并成有序 image URL 列表：先按 _remote_url_<i> 顺序，再补 catbox 上传
  const remoteMaxIndex = remoteByIndex.size ? Math.max(...remoteByIndex.keys()) : -1;
  const totalSlots = Math.max(remoteMaxIndex + 1, blobs.length);
  const imageUrls = [];
  for (let i = 0; i < totalSlots; i++) {
    if (remoteByIndex.has(i)) {
      imageUrls[i] = remoteByIndex.get(i);
      continue;
    }
    const blob = blobs.shift();
    if (!blob) continue;
    try {
      const url = await ensureCatboxPublicUrl(blob, { ttl: '24h' });
      imageUrls[i] = url;
      console.info(`[AI Canvas] image[${i}] 走 catbox 兜底成功：${url}`);
    } catch (e) {
      console.warn(`[AI Canvas] image[${i}] catbox 兜底失败，跳过该图：`, e?.message || e);
    }
  }

  // 5. 用 runMediaGenerateTask 提交
  return runMediaGenerateTask({
    model,
    prompt,
    size,
    n,
    quality: quality || undefined,
    output_format: outputFormat || undefined,
    images: imageUrls.filter(Boolean)
  }, options);
}

async function postImageEdit(fd, options = {}) {
  // 小马AI 域：把 FormData 里的 _remote_url_<i> / image Blob 转成 params.images，走 /v1/media/generate
  if (isXiaomaMediaOnlyBase()) {
    return runImageEditFromFormData(fd, options);
  }
  // 其他域：保留 OpenAI multipart 行为
  const endpoint = buildApiEndpoint(getApiBase(), '/v1/images/edits');
  const requestDetail = summarizeFormDataForLog(fd);
  console.info('[AI Canvas] request', summarizeRequest('edits', fd), endpoint);
  globalThis.window?.AICanvasLog?.record?.('info', {
    source: 'api',
    title: '发送图片编辑请求',
    summary: summarizeRequest('edits', fd),
    ...getLogNodeMeta(options),
    detail: {
      url: endpoint,
      promptLength: String(fd.get('prompt') || '').length,
      promptPreview: String(fd.get('prompt') || '').slice(0, 120),
      ...requestDetail
    }
  });
  const timeout = getTimeoutForModel(fd.get('model'), fd.get('size'));
  return fetchWithTimeout(endpoint, {
    method: 'POST',
    headers: authHeaders(),
    body: fd
  }, timeout, options);
}

function shouldRetryImageFieldName(err) {
  if (isUserCanceledError(err)) return false;
  const raw = getRawErrorMessage(err);
  return /image|required|required field|missing|invalid.*image|unsupported.*image|图片|图像|file|multipart|form/i.test(raw);
}

function pickImageUrl(data) {
  return pickImageUrls(data)[0];
}

function pickImageUrls(data) {
  const items = Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data?.output)
      ? data.output
      : [data?.image || data].filter(Boolean);
  const urls = items.map(item => {
    const b64 = item?.b64_json || item?.base64 || item?.image_base64 || data?.b64_json;
    const url = item?.url || item?.image_url || data?.url || (b64 ? `data:image/png;base64,${b64}` : '');
    if (!url) return '';
    if (url.startsWith('http')) return { __needsFetch: true, url };
    return url;
  }).filter(Boolean);
  if (!urls.length) throw new Error('接口返回中没有 url 或 b64_json');
  return urls;
}
