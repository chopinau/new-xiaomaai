// Landing.

// ===== LANDING PAGE =====
function toggleReverseConfig() {
  const panel = document.getElementById('reverseConfigPanel');
  const arrow = document.getElementById('reverseConfigArrow');
  const isOpen = panel.style.display === 'block';
  panel.style.display = isOpen ? 'none' : 'block';
  arrow.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
}

function initPresets() {
  const select = document.getElementById('presetSelect');
  if (!select) return;
  const presets = loadPresets();
  select.innerHTML = '<option value="">选择预设</option>' +
    presets.map((preset, index) => `<option value="${index}">${escHtml(preset.name)} · ${escHtml(preset.baseUrl || '')}</option>`).join('');
}

function onPresetChange(index) {
  if (index === '') return;
  const presets = loadPresets();
  const preset = presets[Number(index)];
  if (!preset) return;
  applyApiPreset(preset);
  document.getElementById('landingBaseUrl').value = preset.baseUrl || '';
  document.getElementById('landingApiKey').value = preset.apiKey || '';
  const modelSelect = document.getElementById('landingModelSelect');
  const modelWrap = document.getElementById('modelSelectWrap');
  if (modelSelect && preset.model) {
    modelSelect.innerHTML = `<option value="${escHtml(preset.model)}">${escHtml(preset.model)}</option>`;
    modelSelect.value = preset.model;
    if (modelWrap) modelWrap.style.display = '';
  }
  toast('已切换到预设：' + preset.name, 'success');
}

function saveCurrentAsPreset() {
  const name = prompt('给这个配置起个名字：');
  if (!name) return;
  const displayUrl = document.getElementById('landingBaseUrl').value.trim();
  const baseUrl = displayUrl === '小马AI默认地址' ? 'https://api.lk888.ai' : displayUrl;
  const apiKey = document.getElementById('landingApiKey').value.trim();
  const model = document.getElementById('landingModelSelect')?.value || getSelectedImageModel();
  if (!baseUrl || !apiKey) {
    toast('请先填写基址和 Key', 'error');
    return;
  }
  addPreset(name, baseUrl, apiKey, model);
  initPresets();
  toast('预设已保存：' + name, 'success');
}

function deleteSelectedPreset() {
  const select = document.getElementById('presetSelect');
  if (!select || select.value === '') {
    toast('请先选择一个预设', 'error');
    return;
  }
  const index = Number(select.value);
  if (!Number.isInteger(index)) {
    toast('请先选择一个预设', 'error');
    return;
  }
  const presets = loadPresets();
  const preset = presets[index];
  if (!preset) return;
  if (confirm('确认删除预设「' + preset.name + '」？')) {
    deletePreset(preset.name);
    initPresets();
    toast('预设已删除', 'success');
  }
}
