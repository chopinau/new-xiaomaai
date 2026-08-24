// Core configuration. Keep API/model constants here so future model upgrades are isolated.

// ===== CONFIG =====
const DEFAULT_API_BASE = 'https://api.lk888.ai';
const API_TIMEOUT_MS = 300000;        // 默认 5 分钟
const API_TIMEOUT_2K = 600000;       // 2K 尺寸 10 分钟
const API_TIMEOUT_4K = 900000;       // 4K 尺寸 15 分钟

function getTimeoutForModel(model, size) {
  const s = String(size || '');
  if (s.includes('3840') || s.includes('2160')) return API_TIMEOUT_4K;
  if (s.includes('2048')) return API_TIMEOUT_2K;
  return API_TIMEOUT_MS;
}
const MAX_REFERENCE_IMAGES = 6;
const MAX_REFERENCE_IMAGE_BYTES = 5 * 1024 * 1024;
const IMAGE_UPLOAD_MAX_SIDE = 1536;
const API_KEY_STORAGE = 'apiqik_api_key';
const API_BASE_STORAGE = 'apiqik_api_base';
const SELECTED_IMAGE_MODEL_STORAGE = 'canvas_selected_model';
const AVAILABLE_IMAGE_MODELS_STORAGE = 'canvas_available_image_models';
const AVAILABLE_IMAGE_MODELS_BASE_STORAGE = 'canvas_available_image_models_base';
const MANUAL_IMAGE_MODELS_STORAGE = 'canvas_manual_image_models';
const PRESETS_STORAGE = 'canvas_api_presets';
let API_KEY = storageGet(API_KEY_STORAGE) || '';
let API_BASE = cleanApiBase(storageGet(API_BASE_STORAGE) || 'https://api.xomodel.com');

// 反推引擎配置
const REVERSE_BASE_STORAGE = 'canvas_reverse_base';
const REVERSE_KEY_STORAGE = 'canvas_reverse_key';
const REVERSE_MODEL_STORAGE = 'canvas_reverse_model';
const AVAILABLE_REVERSE_MODELS_STORAGE = 'canvas_available_reverse_models';
const AVAILABLE_REVERSE_MODELS_BASE_STORAGE = 'canvas_available_reverse_models_base';
let REVERSE_BASE = cleanApiBase(storageGet(REVERSE_BASE_STORAGE) || DEFAULT_API_BASE);
let REVERSE_KEY = storageGet(REVERSE_KEY_STORAGE) || '';
let REVERSE_MODEL = storageGet(REVERSE_MODEL_STORAGE) || '';

const GPT_IMAGE_SIZES = [
  { value: 'auto', label: '自动' },
  { value: '1024x1024', label: '1024×1024 · 1:1' },
  { value: '1536x1024', label: '1536×1024 · 3:2 横' },
  { value: '1024x1536', label: '1024×1536 · 2:3 竖' },
  { value: '1792x1024', label: '1792×1024 · 16:9 横' },
  { value: '1024x1792', label: '1024×1792 · 9:16 竖' },
  { value: '2048x1024', label: '2048×1024 · 2:1 超宽' },
  { value: '1024x2048', label: '1024×2048 · 1:2 超高' },
  { value: '2304x960', label: '2304×960 · 电影超宽' },
  { value: '3840x1600', label: '3840×1600 · 4K 电影超宽' },
  { value: '2048x864', label: '2048×864 · 21:9 超宽屏' },
  { value: '864x2048', label: '864×2048 · 9:21 超高屏' },
  { value: '2048x1536', label: '2048×1536 · 4:3 横' },
  { value: '1536x2048', label: '1536×2048 · 3:4 竖' },
  { value: '2160x2880', label: '2160×2880 · 3:4 高分辨率' },
  { value: '2048x2048', label: '2048×2048 · 2K 方图' },
  { value: '2048x1152', label: '2048×1152 · 2K 16:9' },
  { value: '3840x2160', label: '3840×2160 · 4K 横图' },
  { value: '2160x3840', label: '2160×3840 · 4K 竖图' }
];
const MODEL_CONFIG = {
  'gpt-image-2': { label: 'gpt-image-2', sizes: GPT_IMAGE_SIZES, defaultSize: '1024x1024' },
  'gpt-image-2-2k': { label: 'gpt-image-2-2k', sizes: GPT_IMAGE_SIZES, defaultSize: '2048x2048' },
  'gpt-image-2-4k': { label: 'gpt-image-2-4k', sizes: GPT_IMAGE_SIZES, defaultSize: '3840x2160' },
  'gpt-image-2-flatfee': { label: 'gpt-image-2-flatfee', sizes: GPT_IMAGE_SIZES, defaultSize: '1024x1024' },
  'gpt-image-2-flatfee-2k': { label: 'gpt-image-2-flatfee-2k', sizes: GPT_IMAGE_SIZES, defaultSize: '2048x2048' },
  'gpt-image-2-flatfee-4k': { label: 'gpt-image-2-flatfee-4k', sizes: GPT_IMAGE_SIZES, defaultSize: '3840x2160' }
};
const IMAGE_MODEL_PRIORITY_RE = /^gpt-image-2(?:-(?:2k|4k|flatfee(?:-(?:2k|4k))?))?$/i;
const IMAGE_MODEL_DETECT_RE = /(?:^|[-_./])(?:gpt[-_]?image|image2?|seedream|seed|jimeng|flux|nano|imagen|ideogram|recraft|stability|stable[-_]?diffusion|sd(?:xl)?|dall[-_]?e|midjourney|mj|qwen[-_]?image|wan|kolors|hidream|doubao[-_]?image|kling)(?:$|[-_./0-9a-z])/i;

function getModelConfig(model) {
  const id = String(model || '').trim();
  if (!id) return MODEL_CONFIG['gpt-image-2'];
  if (!MODEL_CONFIG[id]) {
    MODEL_CONFIG[id] = { label: id, sizes: GPT_IMAGE_SIZES, defaultSize: '1024x1024' };
  }
  return MODEL_CONFIG[id];
}

function loadAvailableImageModelsForBase(baseUrl = getApiBase()) {
  const savedBaseRaw = String(storageGet(AVAILABLE_IMAGE_MODELS_BASE_STORAGE) || '').trim();
  const manual = loadManualImageModelsForBase(baseUrl);
  if (!savedBaseRaw) return manual;
  const savedBase = cleanApiBase(savedBaseRaw);
  if (savedBase !== cleanApiBase(baseUrl)) return manual;
  try {
    const saved = JSON.parse(storageGet(AVAILABLE_IMAGE_MODELS_STORAGE) || '[]');
    const clean = (Array.isArray(saved) ? saved : [])
      .map(item => String(item || '').trim())
      .filter(Boolean);
    const merged = Array.from(new Set([...clean, ...manual]));
    merged.forEach(model => getModelConfig(model));
    return merged;
  } catch {
    return manual;
  }
}

function loadAvailableImageModels() {
  return loadAvailableImageModelsForBase(getApiBase());
}

function saveAvailableImageModels(models, baseUrl = getApiBase()) {
  const manual = loadManualImageModelsForBase(baseUrl);
  const clean = Array.from(new Set([...(models || []), ...manual]
    .map(item => String(item || '').trim())
    .filter(Boolean)));
  if (!clean.length) return;
  clean.forEach(model => getModelConfig(model));
  storageSet(AVAILABLE_IMAGE_MODELS_STORAGE, JSON.stringify(clean));
  storageSet(AVAILABLE_IMAGE_MODELS_BASE_STORAGE, cleanApiBase(baseUrl));
}

function clearAvailableImageModels() {
  storageRemove(AVAILABLE_IMAGE_MODELS_STORAGE);
  storageRemove(AVAILABLE_IMAGE_MODELS_BASE_STORAGE);
  storageRemove(SELECTED_IMAGE_MODEL_STORAGE);
}

function getManualImageModelsMap() {
  try {
    const raw = JSON.parse(storageGet(MANUAL_IMAGE_MODELS_STORAGE) || '{}');
    return raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  } catch {
    return {};
  }
}

function loadManualImageModelsForBase(baseUrl = getApiBase()) {
  const base = cleanApiBase(baseUrl || DEFAULT_API_BASE);
  const models = getManualImageModelsMap()[base] || [];
  const clean = (Array.isArray(models) ? models : [])
    .map(item => String(item || '').trim())
    .filter(Boolean);
  
  if (base === 'https://api.lk888.ai' || base === 'https://api.lk888.ai/api') {
    clean.push('gpt-image-2');
    clean.push('nano-banana-pro');
  }
  
  clean.forEach(model => getModelConfig(model));
  return Array.from(new Set(clean));
}

function addManualImageModel(model, baseUrl = getApiBase()) {
  const value = String(model || '').trim();
  if (!value) return [];
  const base = cleanApiBase(baseUrl || DEFAULT_API_BASE);
  const map = getManualImageModelsMap();
  const models = Array.from(new Set([...(Array.isArray(map[base]) ? map[base] : []), value]
    .map(item => String(item || '').trim())
    .filter(Boolean)));
  map[base] = models;
  storageSet(MANUAL_IMAGE_MODELS_STORAGE, JSON.stringify(map));
  saveAvailableImageModels(loadAvailableImageModelsForBase(base), base);
  setSelectedImageModel(value);
  return models;
}

function loadAvailableReverseModels() {
  const savedBaseRaw = String(storageGet(AVAILABLE_REVERSE_MODELS_BASE_STORAGE) || '').trim();
  if (!savedBaseRaw) return [];
  const savedBase = cleanApiBase(savedBaseRaw);
  if (savedBase !== cleanApiBase(REVERSE_BASE || DEFAULT_API_BASE)) return [];
  try {
    const saved = JSON.parse(storageGet(AVAILABLE_REVERSE_MODELS_STORAGE) || '[]');
    return Array.from(new Set((Array.isArray(saved) ? saved : [])
      .map(item => String(item || '').trim())
      .filter(Boolean)));
  } catch {
    return [];
  }
}

function saveAvailableReverseModels(models, baseUrl = REVERSE_BASE || DEFAULT_API_BASE) {
  const clean = Array.from(new Set((models || [])
    .map(item => String(item || '').trim())
    .filter(Boolean)));
  if (!clean.length) return;
  storageSet(AVAILABLE_REVERSE_MODELS_STORAGE, JSON.stringify(clean));
  storageSet(AVAILABLE_REVERSE_MODELS_BASE_STORAGE, cleanApiBase(baseUrl));
}

function getImageModelIdsFromResponse(data) {
  return getDetectedImageModelIdsFromResponse(data).sort((a, b) => {
    const aPriority = IMAGE_MODEL_PRIORITY_RE.test(a) ? 0 : 1;
    const bPriority = IMAGE_MODEL_PRIORITY_RE.test(b) ? 0 : 1;
    if (aPriority !== bPriority) return aPriority - bPriority;
    return 0;
  });
}

function getDetectedImageModelIdsFromResponse(data) {
  const all = getAllModelIdsFromResponse(data);
  const imageModels = all.filter(id => IMAGE_MODEL_DETECT_RE.test(id));
  return imageModels.length ? imageModels : all;
}

function getAllModelIdsFromResponse(data) {
  return Array.from(new Set((data?.data || [])
    .map(item => {
      if (typeof item === 'string') return item;
      return item?.id || item?.model || item?.name || item?.value;
    })
    .map(id => String(id || '').trim())
    .filter(Boolean)));
}

function choosePreferredImageModel(models = [], previous = '') {
  const clean = Array.from(new Set((models || [])
    .map(item => String(item || '').trim())
    .filter(Boolean)));
  const saved = String(previous || '').trim();
  if (saved && IMAGE_MODEL_PRIORITY_RE.test(saved) && clean.includes(saved)) return saved;
  const preferred = clean.find(id => IMAGE_MODEL_PRIORITY_RE.test(id));
  if (preferred) return preferred;
  if (saved && clean.includes(saved)) return saved;
  return clean[0] || saved || '';
}

const OUTPUT_FORMATS = [
  { value: 'png', label: 'PNG' },
  { value: 'jpeg', label: 'JPEG' },
  { value: 'webp', label: 'WebP' }
];

const REMIX_RECIPES = {
  standard: { label: '常规生成', desc: '按提示词整体修改/生成' },
  inpaint: { label: '局部重绘', desc: '上传蒙版，只重绘指定区域' }
};

const NODE_W = 460;
const NODE_GAP = 50;
const CHILD_OFFSET_X = NODE_W + NODE_GAP;



function cleanApiBase(url) {
  const raw = String(url || DEFAULT_API_BASE).trim();
  // 去掉尾部斜杠 + 去掉历史上 "https://api.lk888.ai/api" 形式带错的 /api 后缀
  // 例如：
  //   "https://api.lk888.ai/"     → "https://api.lk888.ai"
  //   "https://api.lk888.ai/api"  → "https://api.lk888.ai"
  //   "https://api.lk888.ai/api/" → "https://api.lk888.ai"
  //   "https://api.lk666.ai/api"  → "https://api.lk666.ai"
  return raw.replace(/\/+$/, '').replace(/\/api$/i, '');
}

function buildApiEndpoint(baseUrl, path) {
  const base = cleanApiBase(baseUrl || DEFAULT_API_BASE);
  const suffix = String(path || '').trim();
  if (!suffix) return base;
  const normalizedPath = suffix.startsWith('/') ? suffix : `/${suffix}`;
  if (/\/v1$/i.test(base) && /^\/v1(?:\/|$)/i.test(normalizedPath)) {
    return base + normalizedPath.replace(/^\/v1/i, '');
  }
  return base + normalizedPath;
}

function getApiBase() {
  API_BASE = cleanApiBase(API_BASE || DEFAULT_API_BASE);
  return API_BASE;
}

function getSelectedImageModel() {
  const saved = String(storageGet(SELECTED_IMAGE_MODEL_STORAGE) || '').trim();
  const models = loadAvailableImageModels();
  if (models.length) {
    const selected = saved && models.includes(saved) ? saved : models[0];
    if (selected !== saved) storageSet(SELECTED_IMAGE_MODEL_STORAGE, selected);
    return selected;
  }
  return saved;
}

function setSelectedImageModel(model) {
  const value = String(model || '').trim();
  if (!value) return;
  getModelConfig(value);
  storageSet(SELECTED_IMAGE_MODEL_STORAGE, value);
}

function getSelectedTextModel() {
  const saved = String(storageGet(REVERSE_MODEL_STORAGE) || REVERSE_MODEL || '').trim();
  const models = loadAvailableReverseModels();
  if (models.length) {
    const selected = saved && models.includes(saved) ? saved : models[0];
    if (selected !== saved) storageSet(REVERSE_MODEL_STORAGE, selected);
    REVERSE_MODEL = selected;
    return selected;
  }
  return saved;
}

function setSelectedTextModel(model) {
  const value = String(model || '').trim();
  if (!value) return;
  storageSet(REVERSE_MODEL_STORAGE, value);
  REVERSE_MODEL = value;
}

window.loadAvailableReverseModelsCache = loadAvailableReverseModels;
window.saveAvailableReverseModelsCache = saveAvailableReverseModels;
window.getSelectedTextModelCache = getSelectedTextModel;
window.setSelectedTextModelCache = setSelectedTextModel;

function loadPresets() {
  try {
    const presets = JSON.parse(storageGet(PRESETS_STORAGE) || '[]');
    const result = Array.isArray(presets) ? presets : [];
    return result;
  } catch {
    return [];
  }
}

function savePresets(presets) {
  storageSet(PRESETS_STORAGE, JSON.stringify(presets || []));
}

function addPreset(name, baseUrl, apiKey, model) {
  const presets = loadPresets();
  const cleanName = String(name || '').trim();
  if (!cleanName) return presets;
  const preset = {
    name: cleanName,
    baseUrl: cleanApiBase(baseUrl),
    apiKey,
    model,
    createdAt: Date.now()
  };
  const index = presets.findIndex(item => item.name === cleanName);
  if (index >= 0) presets[index] = preset;
  else presets.push(preset);
  savePresets(presets);
  return presets;
}

function deletePreset(name) {
  const presets = loadPresets().filter(item => item.name !== name);
  savePresets(presets);
  return presets;
}

function applyApiPreset(preset) {
  if (!preset) return;
  const previousBase = getApiBase();
  const previousKey = API_KEY;
  API_BASE = cleanApiBase(preset.baseUrl);
  API_KEY = preset.apiKey || '';
  storageSet(API_BASE_STORAGE, API_BASE);
  storageSet(API_KEY_STORAGE, API_KEY);
  if (cleanApiBase(previousBase) !== API_BASE || previousKey !== API_KEY) clearAvailableImageModels();
  if (preset.model) setSelectedImageModel(preset.model);
}

async function testApiConnection() {
  const baseInput = document.getElementById('landingBaseUrl');
  const keyInput = document.getElementById('landingApiKey');
  const resultEl = document.getElementById('landingTestResult');
  const modelWrap = document.getElementById('modelSelectWrap');
  const modelSelect = document.getElementById('landingModelSelect');
  const testBtn = document.getElementById('landingTestBtn');
  const displayUrl = baseInput?.value?.trim() || '';
  const baseUrl = displayUrl === '小马AI默认地址' ? 'https://api.lk888.ai' : cleanApiBase(displayUrl);
  const apiKey = String(keyInput?.value || '').trim();

  if (!baseUrl || !apiKey) {
    toast('请先填写基址和 Key', 'error');
    return;
  }

  if (testBtn) {
    testBtn.disabled = true;
    testBtn.textContent = '测试中...';
  }
  if (resultEl) {
    resultEl.style.display = 'block';
    resultEl.textContent = '正在测试连接...';
    resultEl.className = 'landing-test-result testing';
  }

  try {
    const endpoint = buildApiEndpoint(baseUrl, '/v1/models');
    window.AICanvasLog?.record?.('info', {
      source: 'models',
      title: '测试生图连接',
      summary: '获取模型列表',
      detail: { url: endpoint }
    });
    const modelsRes = await requestModelList(endpoint, apiKey);
    if (!modelsRes.ok) {
      const err = await modelsRes.json().catch(() => ({}));
      throw new Error(err?.error?.message || err?.message || `HTTP ${modelsRes.status}`);
    }

    const data = await modelsRes.json().catch(() => ({}));
    const rawModels = getAllModelIdsFromResponse(data);
    const detectedModels = getDetectedImageModelIdsFromResponse(data);
    const models = getImageModelIdsFromResponse(data);
    if (!models.length) throw new Error('当前中转站 /v1/models 没有返回可用模型');

    const previousBase = getApiBase();
    const previousKey = API_KEY;
    const previous = String(storageGet(SELECTED_IMAGE_MODEL_STORAGE) || '').trim();
    const changed = cleanApiBase(previousBase) !== baseUrl || previousKey !== apiKey;
    API_BASE = baseUrl;
    API_KEY = apiKey;
    if (changed) clearAvailableImageModels();
    storageSet(API_BASE_STORAGE, API_BASE);
    storageSet(API_KEY_STORAGE, API_KEY);
    saveAvailableImageModels(models, baseUrl);
    const cachedModels = loadAvailableImageModelsForBase(baseUrl);
    const manualModels = loadManualImageModelsForBase(baseUrl);

    const selected = choosePreferredImageModel(cachedModels.length ? cachedModels : models, previous);
    setSelectedImageModel(selected);
    if (modelSelect) {
      const uniqueModels = Array.from(new Set(cachedModels.length ? cachedModels : models));
      modelSelect.innerHTML = uniqueModels
        .map(id => `<option value="${id}" ${id === selected ? 'selected' : ''}>${id}</option>`)
        .join('');
    }
    if (modelWrap) modelWrap.style.display = '';
    if (resultEl) {
      resultEl.textContent = '连接成功 ✓';
      resultEl.className = 'landing-test-result success';
    }
    window.AICanvasLog?.record?.('info', {
      source: 'models',
      title: '生图模型检测成功',
      summary: `检测到 ${detectedModels.length} 个生图候选 · 当前 ${selected}`,
      detail: {
        url: endpoint,
        rawCount: rawModels.length,
        detectedCount: detectedModels.length,
        cachedCount: cachedModels.length,
        manualCount: manualModels.length,
        selected,
        detectedModels: detectedModels.join(', '),
        cachedModels: cachedModels.join(', '),
        hint: rawModels.length > detectedModels.length && detectedModels.length <= 1
          ? '当前 /v1/models 未返回模型广场完整生图模型；如模型广场可用，请在生图节点模型弹层手动输入模型名。'
          : ''
      }
    });
    scrollLandingFieldIntoView(modelWrap);
    toast('连接成功', 'success');
  } catch (err) {
    window.AICanvasLog?.record?.('error', {
      source: 'models',
      title: '测试生图连接失败',
      summary: err?.message || 'Load failed',
      detail: { baseUrl, raw: err?.message || String(err) }
    });
    if (resultEl) {
      resultEl.textContent = '连接失败：' + (err.message || '未知错误');
      resultEl.className = 'landing-test-result error';
    }
    if (modelWrap) modelWrap.style.display = 'none';
  } finally {
    if (testBtn) {
      testBtn.disabled = false;
      testBtn.textContent = '测试连接';
    }
  }
}

async function testReverseConnection() {
  const baseInput = document.getElementById('landingReverseBase');
  const keyInput = document.getElementById('landingReverseKey');
  const resultEl = document.getElementById('reverseTestResult');
  const modelWrap = document.getElementById('reverseModelSelectWrap');
  const modelSelect = document.getElementById('landingReverseModelSelect');
  const testBtn = document.getElementById('reverseTestBtn');
  const baseUrl = cleanApiBase(baseInput?.value || '');
  const apiKey = String(keyInput?.value || '').trim();

  if (!baseUrl || !apiKey) {
    toast('请先填写反推 API 地址和 Key', 'error');
    return;
  }

  if (testBtn) {
    testBtn.disabled = true;
    testBtn.textContent = '检测中...';
  }
  if (resultEl) {
    resultEl.style.display = 'block';
    resultEl.textContent = '正在获取模型列表...';
    resultEl.className = 'landing-test-result testing';
  }

  try {
    const endpoint = buildApiEndpoint(baseUrl, '/v1/models');
    window.AICanvasLog?.record?.('info', {
      source: 'models',
      title: '测试反推连接',
      summary: '获取模型列表',
      detail: { url: endpoint }
    });
    const modelsRes = await requestModelList(endpoint, apiKey);
    if (!modelsRes.ok) {
      const err = await modelsRes.json().catch(() => ({}));
      throw new Error(err?.error?.message || err?.message || `HTTP ${modelsRes.status}`);
    }

    const data = await modelsRes.json().catch(() => ({}));
    let models = (data?.data || [])
      .map(item => item?.id)
      .filter(Boolean)
      .filter(id => /vision|gpt-4|gpt-5|omni|image|qwen|doubao|seed|claude|gemini/i.test(id));

    if (!models.length) {
      models = (data?.data || []).map(item => item?.id).filter(Boolean);
    }
    if (!models.length) throw new Error('模型列表为空');

    const uniqueModels = Array.from(new Set(models));
    const selected = String(storageGet(REVERSE_MODEL_STORAGE) || REVERSE_MODEL || uniqueModels[0] || '').trim() || uniqueModels[0];
    saveAvailableReverseModels(uniqueModels, baseUrl);
    setSelectedTextModel(uniqueModels.includes(selected) ? selected : uniqueModels[0]);
    if (modelSelect) {
      modelSelect.innerHTML = uniqueModels
        .map(id => `<option value="${id}" ${id === (uniqueModels.includes(selected) ? selected : uniqueModels[0]) ? 'selected' : ''}>${id}</option>`)
        .join('');
      if (!uniqueModels.includes(selected)) modelSelect.value = uniqueModels[0];
    }
    if (modelWrap) modelWrap.style.display = '';
    if (resultEl) {
      resultEl.textContent = '检测成功，请选择反推模型 ✓';
      resultEl.className = 'landing-test-result success';
    }
    scrollLandingFieldIntoView(modelWrap);
    toast('反推模型列表获取成功', 'success');
  } catch (err) {
    window.AICanvasLog?.record?.('error', {
      source: 'models',
      title: '测试反推连接失败',
      summary: err?.message || 'Load failed',
      detail: { baseUrl, raw: err?.message || String(err) }
    });
    if (resultEl) {
      resultEl.textContent = '检测失败：' + (err.message || '未知错误');
      resultEl.className = 'landing-test-result error';
    }
    if (modelWrap) modelWrap.style.display = 'none';
  } finally {
    if (testBtn) {
      testBtn.disabled = false;
      testBtn.textContent = '检测反推模型';
    }
  }
}

async function requestModelList(endpoint, apiKey) {
  const headers = { 'Authorization': 'Bearer ' + apiKey };
  if (window.__TAURI__?.core?.invoke) {
    const nativeRes = await window.__TAURI__.core.invoke('api_request', {
      payload: { url: endpoint, method: 'GET', headers }
    });
    return {
      ok: nativeRes.ok,
      status: nativeRes.status,
      json: async () => {
        try { return nativeRes.text ? JSON.parse(nativeRes.text) : {}; } catch { return {}; }
      }
    };
  }
  return await fetch(endpoint, { headers });
}

async function requestJsonEndpoint(endpoint, init = {}) {
  if (window.__TAURI__?.core?.invoke) {
    const body = init.body ? JSON.parse(init.body) : null;
    const nativeRes = await window.__TAURI__.core.invoke('api_request', {
      payload: {
        url: endpoint,
        method: init.method || 'GET',
        headers: init.headers || {},
        json: body
      }
    });
    return {
      ok: nativeRes.ok,
      status: nativeRes.status,
      json: async () => {
        try { return nativeRes.text ? JSON.parse(nativeRes.text) : {}; } catch { return {}; }
      }
    };
  }
  return await fetch(endpoint, init);
}

function scrollLandingFieldIntoView(el) {
  if (!el) return;
  requestAnimationFrame(() => {
    el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    const select = el.querySelector('select');
    if (select) select.focus({ preventScroll: true });
  });
}

function setApiBase() {
  const current = getApiBase();
  const val = prompt('设置模型基址 / 中转站地址，当前：' + current + '\n例如：https://api.xomodel.com\n留空则不修改；输入 default 恢复默认。');
  if (val === null || val.trim() === '') return;
  if (val.trim().toLowerCase() === 'default') {
    API_BASE = DEFAULT_API_BASE;
    storageRemove(API_BASE_STORAGE);
    clearAvailableImageModels();
    toast('模型基址已恢复默认：' + API_BASE, 'success');
    return;
  }
  if (!/^https?:\/\//i.test(val.trim())) {
    toast('模型基址必须以 http:// 或 https:// 开头', 'error');
    return;
  }
  API_BASE = cleanApiBase(val);
  storageSet(API_BASE_STORAGE, API_BASE);
  clearAvailableImageModels();
  toast('模型基址已更新：' + API_BASE, 'success');
}

function maskKey(key) {
  if (!key) return '';
  return key.length > 12 ? key.slice(0, 6) + '...' + key.slice(-4) : '已设置';
}

function getApiKey() {
  if (API_KEY) return API_KEY;
  const key = prompt('请输入当前中转站 API Key（仅保存到当前浏览器 localStorage）');
  if (key && key.trim()) {
    API_KEY = key.trim();
    storageSet(API_KEY_STORAGE, API_KEY);
    toast('API Key 已保存到本机浏览器', 'success');
    return API_KEY;
  }
  throw new Error('未设置 API Key');
}

function setApiKey() {
  const current = API_KEY ? maskKey(API_KEY) : '未设置';
  const key = prompt('设置当前中转站 API Key，当前：' + current + '\n留空则不修改；输入 clear 可清除。');
  if (key === null || key.trim() === '') return;
  if (key.trim().toLowerCase() === 'clear') {
    API_KEY = '';
    storageRemove(API_KEY_STORAGE);
    clearAvailableImageModels();
    toast('API Key 已清除', 'success');
    return;
  }
  API_KEY = key.trim();
  storageSet(API_KEY_STORAGE, API_KEY);
  clearAvailableImageModels();
  toast('API Key 已更新', 'success');
}

function parseImageSize(size) {
  const [rawW, rawH] = String(size || '1024x1024').split('x').map(v => parseInt(v, 10));
  const w = Number.isFinite(rawW) && rawW > 0 ? rawW : 1024;
  const h = Number.isFinite(rawH) && rawH > 0 ? rawH : 1024;
  return { w, h };
}
