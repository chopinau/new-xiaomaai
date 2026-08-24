/* =============================================================================
 * 小马AI · Flow Canvas - 原生 JS 节点画布（无外部依赖）
 * 纯 vanilla JS + SVG 实现。复用 v2 的 config.js / api.js / utils.js。
 *
 * 功能：
 *  - 节点类型：Prompt / Image / Reverse
 *  - 拖拽 / 平移 / 缩放 / 连线
 *  - 撤销/重做 (Ctrl+Z / Ctrl+Y)
 *  - JSON 导入/导出
 *  - MiniMap + 视口控制
 *  - MCP Agent 桥接（向本地 127.0.0.1:17371 推送状态）
 *
 * 协议：原创 MIT ✅
 * ============================================================================= */

(function () {
    'use strict';

    // ===== 状态 =====
    const state = {
        nodes: [],        // {id, type, x, y, w, h, data: {title, content, prompt, model, size, n, image, error, status}}
        edges: [],        // {id, source, target}
        view: { x: 0, y: 0, scale: 1 },
        selectedId: null,
        history: { past: [], future: [] },
        searchTerm: '',
        agentStatus: 'disconnected',
        connectionDraft: null,  // {fromId, fromX, fromY, toX, toY}
    };

    const STORAGE_KEY = 'xiaoma_ai_flow_canvas_v2';
    const AGENT_URL = 'http://127.0.0.1:17371';
    const AGENT_TOKEN = 'test-token-12345';

    // ===== DOM 引用 =====
    const stage = document.getElementById('canvas-stage');
    const transform = document.getElementById('canvas-transform');
    const nodesLayer = document.getElementById('nodes-layer');
    const edgesSvg = document.getElementById('edges-svg');
    const minimapCanvas = document.getElementById('minimap-canvas');
    const minimapViewport = document.getElementById('minimap-viewport');
    const apiPill = document.getElementById('api-pill');
    const agentPill = document.getElementById('agent-pill');
    const toastEl = document.getElementById('toast');
    const addMenu = document.getElementById('add-menu');

    // ===== Toast =====
    let toastTimer = null;
    function toast(msg, type = 'success') {
        toastEl.textContent = msg;
        toastEl.className = `toast ${type === 'error' ? 'error' : ''}`;
        toastEl.style.display = 'block';
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toastEl.style.display = 'none', 2200);
    }

    // ===== 深拷贝 =====
    function deepClone(o) { return JSON.parse(JSON.stringify(o)); }

    // ===== 适配 api.js（与 v2-app.js 行为一致：复用现有 API URL+Key）=====
    // 避免依赖 v2-app.js，让 flow.html 只加载 api.js + config.js 即可生图
    async function requestTextToImage({ prompt, model = 'gpt-image-2', size = '1024x1024', n = 1 } = {}) {
        if (typeof postImageGenerationJSONWithFormatFallback === 'function') {
            const result = await postImageGenerationJSONWithFormatFallback({ model, prompt, size, n });
            return result; // 形如 { data: { data: [{ url }] }, elapsed, ... }
        }
        // 兜底：某些 dev 环境下没有 format fallback
        if (typeof postImageGenerationJSON === 'function') {
            return await postImageGenerationJSON({ model, prompt, size, n });
        }
        throw new Error('api.js 未加载，无法调用生图接口');
    }

    async function postVisionText({ imageUrl, text, model = 'gpt-4o' } = {}) {
        if (typeof buildApiEndpoint !== 'function' || typeof getApiBase !== 'function' || typeof getApiKey !== 'function') {
            throw new Error('config.js 未加载');
        }
        const endpoint = buildApiEndpoint(getApiBase(), '/v1/chat/completions');
        const body = {
            model,
            messages: [{
                role: 'user',
                content: [
                    { type: 'text', text: text || '请详细描述这张图片。' },
                    { type: 'image_url', image_url: { url: imageUrl } },
                ],
            }],
        };
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + getApiKey(), 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        if (!res.ok) {
            const t = await res.text().catch(() => '');
            throw new Error('反推失败 HTTP ' + res.status + ': ' + t.slice(0, 200));
        }
        const data = await res.json();
        const content = data?.choices?.[0]?.message?.content || '';
        if (Array.isArray(content)) {
            return content.map(c => c?.text || '').join('\n').trim();
        }
        return String(content).trim();
    }

    // ===== 节点默认数据 =====
    function defaultData(type) {
        if (type === 'prompt') return { title: '提示词', content: 'A cinematic portrait of a cyberpunk samurai, neon lights, 8K', status: 'idle' };
        if (type === 'image') return { title: '图片生成', model: 'gpt-image-2', size: '1024x1024', n: 1, prompt: '', status: 'idle', image: null, error: null };
        if (type === 'reverse') return { title: '反推', model: 'gpt-4o', prompt: '', image: null, status: 'idle', error: null };
        return {};
    }

    // ===== 撤销/重做 =====
    function pushHistory() {
        state.history.past.push({ nodes: deepClone(state.nodes), edges: deepClone(state.edges) });
        if (state.history.past.length > 50) state.history.past.shift();
        state.history.future = [];
        updateUndoRedoButtons();
    }

    function undo() {
        if (!state.history.past.length) return;
        const prev = state.history.past.pop();
        state.history.future.push({ nodes: deepClone(state.nodes), edges: deepClone(state.edges) });
        state.nodes = prev.nodes;
        state.edges = prev.edges;
        render();
        updateUndoRedoButtons();
        toast('↶ Undo');
    }

    function redo() {
        if (!state.history.future.length) return;
        const next = state.history.future.pop();
        state.history.past.push({ nodes: deepClone(state.nodes), edges: deepClone(state.edges) });
        state.nodes = next.nodes;
        state.edges = next.edges;
        render();
        updateUndoRedoButtons();
        toast('↷ Redo');
    }

    function updateUndoRedoButtons() {
        document.getElementById('btn-undo').disabled = state.history.past.length === 0;
        document.getElementById('btn-redo').disabled = state.history.future.length === 0;
    }

    // ===== 添加节点 =====
    function addNode(type, pos) {
        const id = `n_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const node = {
            id, type,
            x: pos ? pos.x : 200,
            y: pos ? pos.y : 200,
            w: 280, h: 200,
            data: defaultData(type),
        };
        pushHistory();
        state.nodes.push(node);
        render();
        toast(`✓ 添加 ${type} 节点`);
    }

    // ===== 删除节点 / 边 =====
    function deleteNode(id) {
        pushHistory();
        state.nodes = state.nodes.filter(n => n.id !== id);
        state.edges = state.edges.filter(e => e.source !== id && e.target !== id);
        if (state.selectedId === id) state.selectedId = null;
        render();
    }

    function deleteSelected() {
        if (!state.selectedId) return;
        deleteNode(state.selectedId);
    }

    // ===== 添加边 =====
    function addEdge(source, target) {
        if (source === target) return false;
        if (state.edges.find(e => e.source === source && e.target === target)) return false;
        pushHistory();
        const id = `e_${source}_${target}`;
        state.edges.push({ id, source, target });
        render();
        return true;
    }

    // ===== 计算节点端口位置 =====
    function getPortPos(nodeId, side) {
        const node = state.nodes.find(n => n.id === nodeId);
        if (!node) return { x: 0, y: 0 };
        return {
            x: side === 'source' ? node.x + node.w : node.x,
            y: node.y + node.h / 2,
        };
    }

    // ===== 更新视图变换 =====
    function updateTransform() {
        transform.style.transform = `translate(${state.view.x}px, ${state.view.y}px) scale(${state.view.scale})`;
        // SVG 也跟着变换
        edgesSvg.style.transform = `translate(${state.view.x}px, ${state.view.y}px) scale(${state.view.scale})`;
        edgesSvg.style.transformOrigin = '0 0';
        // 调整 SVG 视野
        const rect = stage.getBoundingClientRect();
        edgesSvg.setAttribute('viewBox', `0 0 ${rect.width / state.view.scale} ${rect.height / state.view.scale}`);
        renderMinimap();
    }

    // ===== 渲染节点 =====
    function renderNodes() {
        // 清空
        nodesLayer.innerHTML = '';
        const term = state.searchTerm.toLowerCase();

        for (const node of state.nodes) {
            // 搜索匹配检查
            const d = node.data;
            const match = !term || (d.title || '').toLowerCase().includes(term)
                || (d.content || '').toLowerCase().includes(term)
                || (d.prompt || '').toLowerCase().includes(term)
                || (d.model || '').toLowerCase().includes(term);
            const dim = !match;

            const el = document.createElement('div');
            el.className = 'flow-node';
            if (state.selectedId === node.id) el.classList.add('selected');
            if (d.status) el.classList.add(d.status);
            if (dim) el.classList.add('dim');
            el.style.left = node.x + 'px';
            el.style.top = node.y + 'px';
            el.style.width = node.w + 'px';
            el.dataset.id = node.id;

            el.innerHTML = renderNodeInnerHTML(node);
            nodesLayer.appendChild(el);

            // 绑定节点事件
            bindNodeEvents(el, node);
        }
    }

    function renderNodeInnerHTML(node) {
        const d = node.data;
        const head = node.type === 'prompt' ? '📝 Prompt' : node.type === 'image' ? '🎨 Image Gen' : '🔍 Reverse';
        const status = d.status || 'idle';

        let body = '';
        if (node.type === 'prompt') {
            body = `
                <div class="node-body">
                    <input class="node-input" data-field="title" placeholder="节点标题" value="${escapeAttr(d.title || '')}" />
                    <textarea class="node-textarea" data-field="content" placeholder="提示词内容…">${escapeHtml(d.content || '')}</textarea>
                </div>
            `;
        } else if (node.type === 'image') {
            body = `
                <div class="node-body">
                    <input class="node-input" data-field="title" placeholder="节点标题" value="${escapeAttr(d.title || '')}" />
                    <div class="node-row">
                        <select class="node-select" data-field="model">
                            <option value="gpt-image-2" ${d.model === 'gpt-image-2' ? 'selected' : ''}>gpt-image-2</option>
                            <option value="gpt-image-2-2k" ${d.model === 'gpt-image-2-2k' ? 'selected' : ''}>gpt-image-2-2k</option>
                            <option value="gpt-image-2-4k" ${d.model === 'gpt-image-2-4k' ? 'selected' : ''}>gpt-image-2-4k</option>
                            <option value="gpt-image-2-flatfee" ${d.model === 'gpt-image-2-flatfee' ? 'selected' : ''}>flatfee</option>
                            <option value="dall-e-3" ${d.model === 'dall-e-3' ? 'selected' : ''}>dall-e-3</option>
                        </select>
                    </div>
                    <div class="node-row">
                        <select class="node-select" data-field="size">
                            ${['1024x1024','1536x1024','1024x1536','1792x1024','2048x2048','3840x2160'].map(s =>
                                `<option value="${s}" ${d.size === s ? 'selected' : ''}>${s}</option>`).join('')}
                        </select>
                        <input class="node-input" data-field="n" type="number" min="1" max="4" value="${d.n || 1}" style="max-width:60px;" />
                    </div>
                    <textarea class="node-textarea" data-field="prompt" placeholder="提示词（可由上游 Prompt 节点覆盖）">${escapeHtml(d.prompt || '')}</textarea>
                    ${d.image ? `<img class="img-preview" src="${escapeAttr(d.image)}" alt="result" />` : ''}
                    ${d.error ? `<div class="error-text">❌ ${escapeHtml(d.error)}</div>` : ''}
                    <button class="run-btn" data-action="run" ${d.status === 'generating' ? 'disabled' : ''}>
                        ${d.status === 'generating' ? '⏳ 生成中…' : '🚀 生成图片'}
                    </button>
                </div>
            `;
        } else if (node.type === 'reverse') {
            body = `
                <div class="node-body">
                    <input class="node-input" data-field="title" placeholder="节点标题" value="${escapeAttr(d.title || '')}" />
                    <input class="node-input" data-field="model" placeholder="反推模型" value="${escapeAttr(d.model || 'gpt-4o')}" />
                    <textarea class="node-textarea" data-field="prompt" placeholder="反推得到的提示词（上游 Image 节点生成后自动填入）">${escapeHtml(d.prompt || '')}</textarea>
                    ${d.image ? `<img class="img-preview" src="${escapeAttr(d.image)}" alt="src" />` : ''}
                    <button class="run-btn" data-action="run" ${d.status === 'generating' || !d.image ? 'disabled' : ''}>
                        ${d.status === 'generating' ? '⏳ 反推中…' : '🔍 反推提示词'}
                    </button>
                </div>
            `;
        }

        return `
            <div class="port target" data-port="target" data-node="${node.id}"></div>
            <div class="node-header" data-drag-node="${node.id}">
                <span>${head}</span>
                <span class="status-tag">${status}</span>
            </div>
            ${body}
            <div class="port source" data-port="source" data-node="${node.id}"></div>
        `;
    }

    function escapeHtml(s) {
        return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }
    function escapeAttr(s) { return escapeHtml(s); }

    // ===== 渲染边 =====
    function renderEdges() {
        // 移除现有 path（保留 defs）
        const existing = edgesSvg.querySelectorAll('path.edge');
        existing.forEach(p => p.remove());
        const tmpPath = edgesSvg.querySelector('path.temp-edge');
        if (tmpPath) tmpPath.remove();

        for (const edge of state.edges) {
            const src = getPortPos(edge.source, 'source');
            const tgt = getPortPos(edge.target, 'target');
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('class', 'edge');
            path.setAttribute('d', makeBezierPath(src.x, src.y, tgt.x, tgt.y));
            path.setAttribute('stroke', '#7E22CE');
            path.setAttribute('stroke-width', '2');
            path.setAttribute('fill', 'none');
            path.setAttribute('marker-end', 'url(#arrow)');
            path.setAttribute('data-edge', edge.id);
            path.style.pointerEvents = 'stroke';
            // 点击边删除
            path.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm('删除这条连线？')) {
                    pushHistory();
                    state.edges = state.edges.filter(x => x.id !== edge.id);
                    render();
                    toast('🗑 已删除连线');
                }
            });
            edgesSvg.appendChild(path);
        }
    }

    function makeBezierPath(x1, y1, x2, y2) {
        const dx = Math.abs(x2 - x1) * 0.5;
        const cp1x = x1 + dx, cp1y = y1;
        const cp2x = x2 - dx, cp2y = y2;
        return `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;
    }

    // ===== 完整 render =====
    function render() {
        renderNodes();
        renderEdges();
        renderMinimap();
        saveState();
        pushToAgent();
        updateUndoRedoButtons();
    }

    // ===== MiniMap =====
    function renderMinimap() {
        const ctx = minimapCanvas.getContext('2d');
        const W = minimapCanvas.width, H = minimapCanvas.height;
        ctx.clearRect(0, 0, W, H);

        if (!state.nodes.length) return;

        // 计算所有节点的边界
        const bbox = {
            minX: Math.min(...state.nodes.map(n => n.x)),
            minY: Math.min(...state.nodes.map(n => n.y)),
            maxX: Math.max(...state.nodes.map(n => n.x + n.w)),
            maxY: Math.max(...state.nodes.map(n => n.y + n.h)),
        };
        const padding = 50;
        bbox.minX -= padding; bbox.minY -= padding;
        bbox.maxX += padding; bbox.maxY += padding;
        const bw = bbox.maxX - bbox.minX;
        const bh = bbox.maxY - bbox.minY;
        const scale = Math.min(W / bw, H / bh);

        const offsetX = (W - bw * scale) / 2 - bbox.minX * scale;
        const offsetY = (H - bh * scale) / 2 - bbox.minY * scale;

        // 画节点
        for (const n of state.nodes) {
            const color = n.type === 'prompt' ? '#7E22CE' : n.type === 'image' ? '#EC4899' : '#06B6D4';
            ctx.fillStyle = color;
            ctx.fillRect(n.x * scale + offsetX, n.y * scale + offsetY, n.w * scale, n.h * scale);
        }
        // 画边
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.lineWidth = 1;
        for (const e of state.edges) {
            const s = getPortPos(e.source, 'source');
            const t = getPortPos(e.target, 'target');
            ctx.beginPath();
            ctx.moveTo(s.x * scale + offsetX, s.y * scale + offsetY);
            ctx.lineTo(t.x * scale + offsetX, t.y * scale + offsetY);
            ctx.stroke();
        }

        // 视口框
        const stageRect = stage.getBoundingClientRect();
        const viewWorldX = (-state.view.x) / state.view.scale;
        const viewWorldY = (-state.view.y) / state.view.scale;
        const viewWorldW = stageRect.width / state.view.scale;
        const viewWorldH = stageRect.height / state.view.scale;
        minimapViewport.style.left = (viewWorldX * scale + offsetX) + 'px';
        minimapViewport.style.top = (viewWorldY * scale + offsetY) + 'px';
        minimapViewport.style.width = (viewWorldW * scale) + 'px';
        minimapViewport.style.height = (viewWorldH * scale) + 'px';
    }

    // ===== 节点事件绑定 =====
    function bindNodeEvents(el, node) {
        // 选中
        el.addEventListener('mousedown', (e) => {
            if (e.target.closest('.port')) return;
            if (e.target.closest('input,textarea,select,button')) return;
            state.selectedId = node.id;
            renderNodes();
            renderEdges();
        });

        // 拖拽节点
        const header = el.querySelector('[data-drag-node]');
        if (header) {
            header.addEventListener('mousedown', (e) => {
                if (e.target.closest('input,textarea,select,button')) return;
                e.preventDefault();
                state.selectedId = node.id;
                const startX = e.clientX, startY = e.clientY;
                const origX = node.x, origY = node.y;
                let moved = false;
                let histPushed = false;
                // 视觉反馈：拖拽时高亮 + 缩放
                el.classList.add('dragging');
                const onMove = (mv) => {
                    const dx = (mv.clientX - startX) / state.view.scale;
                    const dy = (mv.clientY - startY) / state.view.scale;
                    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
                        if (!histPushed) { pushHistory(); histPushed = true; }
                        node.x = origX + dx;
                        node.y = origY + dy;
                        el.style.left = node.x + 'px';
                        el.style.top = node.y + 'px';
                        renderEdges();
                        renderMinimap();
                        moved = true;
                    }
                };
                const onUp = () => {
                    window.removeEventListener('mousemove', onMove);
                    window.removeEventListener('mouseup', onUp);
                    el.classList.remove('dragging');
                    if (moved) saveState();
                };
                window.addEventListener('mousemove', onMove);
                window.addEventListener('mouseup', onUp);
            });
        }

        // 端口拖拽连线
        el.querySelectorAll('.port').forEach(portEl => {
            portEl.addEventListener('mousedown', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const isSource = portEl.dataset.port === 'source';
                const fromId = portEl.dataset.node;
                const startPos = getPortPos(fromId, isSource ? 'source' : 'target');

                // 临时 SVG path
                const tmpPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                tmpPath.setAttribute('class', 'temp-edge');
                tmpPath.setAttribute('stroke', '#EC4899');
                tmpPath.setAttribute('stroke-width', '2.5');
                tmpPath.setAttribute('stroke-dasharray', '6,4');
                tmpPath.setAttribute('fill', 'none');
                edgesSvg.appendChild(tmpPath);

                state.connectionDraft = { fromId, fromX: startPos.x, fromY: startPos.y, isSource };

                const onMove = (mv) => {
                    const rect = stage.getBoundingClientRect();
                    const wx = (mv.clientX - rect.left - state.view.x) / state.view.scale;
                    const wy = (mv.clientY - rect.top - state.view.y) / state.view.scale;
                    const toX = state.connectionDraft.isSource ? wx : state.connectionDraft.fromX;
                    const fromX = state.connectionDraft.isSource ? state.connectionDraft.fromX : wx;
                    const toY = state.connectionDraft.isSource ? wy : state.connectionDraft.fromY;
                    const fromY = state.connectionDraft.isSource ? state.connectionDraft.fromY : wy;
                    tmpPath.setAttribute('d', makeBezierPath(fromX, fromY, toX, toY));
                    // 高亮可作为目标的端口
                    document.querySelectorAll('.port.connection-target').forEach(p => p.classList.remove('connection-target'));
                    const overEl = document.elementFromPoint(mv.clientX, mv.clientY);
                    if (overEl && overEl.classList.contains('port')) {
                        const targetSide = overEl.dataset.port;
                        if ((isSource && targetSide === 'target') || (!isSource && targetSide === 'source')) {
                            overEl.classList.add('connection-target');
                        }
                    }
                };
                const onUp = (mu) => {
                    window.removeEventListener('mousemove', onMove);
                    window.removeEventListener('mouseup', onUp);
                    tmpPath.remove();
                    document.querySelectorAll('.port.connection-target').forEach(p => p.classList.remove('connection-target'));
                    const target = document.elementFromPoint(mu.clientX, mu.clientY);
                    if (target && target.classList.contains('port')) {
                        const targetNodeId = target.dataset.node;
                        const targetSide = target.dataset.port;
                        if (state.connectionDraft.isSource && targetSide === 'target') {
                            addEdge(state.connectionDraft.fromId, targetNodeId);
                        } else if (!state.connectionDraft.isSource && targetSide === 'source') {
                            addEdge(targetNodeId, state.connectionDraft.fromId);
                        }
                    }
                    state.connectionDraft = null;
                };
                window.addEventListener('mousemove', onMove);
                window.addEventListener('mouseup', onUp);
            });
        });

        // 输入框/文本域变化
        el.querySelectorAll('[data-field]').forEach(input => {
            const isTextarea = input.tagName === 'TEXTAREA';
            const isSelect = input.tagName === 'SELECT';
            input.addEventListener('input', (e) => {
                const field = input.dataset.field;
                let val = e.target.value;
                if (field === 'n') val = parseInt(val) || 1;
                node.data[field] = val;
                if (!isTextarea && !isSelect) saveState();
            });
            input.addEventListener('change', () => saveState());
            input.addEventListener('blur', () => saveState());
        });

        // Run 按钮
        const runBtn = el.querySelector('[data-action="run"]');
        if (runBtn) {
            runBtn.addEventListener('click', () => {
                if (node.type === 'image') runImageNode(node);
                else if (node.type === 'reverse') runReverseNode(node);
            });
        }
    }

    // ===== 节点执行 =====
    async function runImageNode(node) {
        const d = node.data;
        let prompt = d.prompt || '';
        // 来自上游节点
        const incoming = state.edges.find(e => e.target === node.id);
        if (incoming) {
            const src = state.nodes.find(n => n.id === incoming.source);
            if (src?.type === 'prompt' && src.data.content) prompt = src.data.content;
            else if (src?.type === 'reverse' && src.data.prompt) prompt = src.data.prompt;
        }
        if (!prompt) { toast('❌ 提示词为空', 'error'); return; }

        node.data.status = 'generating';
        node.data.error = null;
        renderNodes();

        try {
            const result = await requestTextToImage({
                prompt, model: d.model || 'gpt-image-2',
                size: d.size || '1024x1024', n: d.n || 1,
            });
            // 兼容多种返回：result.data 形如 { data: [{url}], output: [...] } 或直接是 data 数组
            // 平台 /v1/media/generate 走的是 runMediaGenerateTask 包成 { data: { data: [{url}] } }
            const inner = result?.data?.data || result?.data?.output || result?.data;
            const firstItem = Array.isArray(inner) ? inner[0] : inner;
            const imageUrl = firstItem?.url || firstItem?.image_url || firstItem?.output_url;
            const b64 = firstItem?.b64_json || firstItem?.base64;
            const imgSrc = imageUrl || (b64 ? `data:image/png;base64,${b64}` : null);
            if (!imgSrc) throw new Error('未返回图片数据：' + JSON.stringify(result).slice(0, 200));
            node.data.status = 'done';
            node.data.image = imgSrc;
            // 推送到下游 Reverse 节点
            const downstream = state.edges.filter(e => e.source === node.id);
            downstream.forEach(e => {
                const ds = state.nodes.find(n => n.id === e.target);
                if (ds?.type === 'reverse') ds.data.image = imgSrc;
            });
            render();
            toast('✓ 生成成功');
        } catch (err) {
            const msg = typeof getErrMsg === 'function' ? getErrMsg(err) : (err.message || '未知错误');
            node.data.status = 'error';
            node.data.error = msg;
            renderNodes();
            toast('❌ ' + msg, 'error');
        }
    }

    async function runReverseNode(node) {
        if (!node.data.image) return;
        node.data.status = 'generating';
        node.data.error = null;
        renderNodes();
        try {
            const prompt = await postVisionText({
                imageUrl: node.data.image,
                text: '请详细描述这张图片的内容、构图、光线、风格。',
                model: node.data.model || 'gpt-4o',
            });
            node.data.status = 'done';
            node.data.prompt = prompt;
            render();
            toast('✓ 反推完成');
        } catch (err) {
            const msg = typeof getErrMsg === 'function' ? getErrMsg(err) : (err.message || '未知错误');
            node.data.status = 'error';
            node.data.error = msg;
            renderNodes();
            toast('❌ ' + msg, 'error');
        }
    }

    // ===== 平移/缩放 =====
    let isPanning = false, panStart = null, viewStart = null;
    stage.addEventListener('mousedown', (e) => {
        if (e.target !== stage && !e.target.classList.contains('edges-layer')) return;
        isPanning = true;
        panStart = { x: e.clientX, y: e.clientY };
        viewStart = { ...state.view };
        state.selectedId = null;
        renderNodes();
    });
    window.addEventListener('mousemove', (e) => {
        if (!isPanning) return;
        state.view.x = viewStart.x + (e.clientX - panStart.x);
        state.view.y = viewStart.y + (e.clientY - panStart.y);
        updateTransform();
    });
    window.addEventListener('mouseup', () => { isPanning = false; });

    stage.addEventListener('wheel', (e) => {
        e.preventDefault();
        const rect = stage.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const oldScale = state.view.scale;
        const factor = e.deltaY < 0 ? 1.1 : 0.9;
        const newScale = Math.max(0.3, Math.min(2.5, oldScale * factor));
        // 围绕鼠标位置缩放
        const wx = (mx - state.view.x) / oldScale;
        const wy = (my - state.view.y) / oldScale;
        state.view.scale = newScale;
        state.view.x = mx - wx * newScale;
        state.view.y = my - wy * newScale;
        updateTransform();
    }, { passive: false });

    function zoomBy(factor) {
        const rect = stage.getBoundingClientRect();
        const mx = rect.width / 2, my = rect.height / 2;
        const oldScale = state.view.scale;
        const newScale = Math.max(0.3, Math.min(2.5, oldScale * factor));
        const wx = (mx - state.view.x) / oldScale;
        const wy = (my - state.view.y) / oldScale;
        state.view.scale = newScale;
        state.view.x = mx - wx * newScale;
        state.view.y = my - wy * newScale;
        updateTransform();
    }

    function fitView() {
        if (!state.nodes.length) return;
        const bbox = {
            minX: Math.min(...state.nodes.map(n => n.x)),
            minY: Math.min(...state.nodes.map(n => n.y)),
            maxX: Math.max(...state.nodes.map(n => n.x + n.w)),
            maxY: Math.max(...state.nodes.map(n => n.y + n.h)),
        };
        const rect = stage.getBoundingClientRect();
        const padding = 50;
        const w = bbox.maxX - bbox.minX + padding * 2;
        const h = bbox.maxY - bbox.minY + padding * 2;
        const scale = Math.min(rect.width / w, rect.height / h, 1.2);
        state.view.scale = scale;
        state.view.x = -bbox.minX * scale + padding * scale + (rect.width - w * scale) / 2;
        state.view.y = -bbox.minY * scale + padding * scale + (rect.height - h * scale) / 2;
        updateTransform();
    }

    // ===== 工具栏 =====
    // 初始化：确保菜单默认隐藏
    if (addMenu) addMenu.style.display = 'none';
    document.getElementById('btn-add').onclick = (e) => {
        e.stopPropagation();
        addMenu.style.display = addMenu.style.display === 'block' ? 'none' : 'block';
    };
    document.addEventListener('click', (e) => {
        if (!e.target.closest('#add-menu') && !e.target.closest('#btn-add')) {
            addMenu.style.display = 'none';
        }
    });
    addMenu.querySelectorAll('.item').forEach(item => {
        item.onclick = () => {
            addNode(item.dataset.type, { x: 200 - state.view.x / state.view.scale, y: 200 - state.view.y / state.view.scale });
            addMenu.style.display = 'none';
        };
    });

    document.getElementById('btn-undo').onclick = undo;
    document.getElementById('btn-redo').onclick = redo;
    document.getElementById('btn-clear').onclick = () => {
        if (confirm('清空画布？此操作可撤销。')) {
            pushHistory();
            state.nodes = []; state.edges = [];
            render();
            toast('🗑 已清空');
        }
    };

    document.getElementById('btn-zoom-in').onclick = () => zoomBy(1.2);
    document.getElementById('btn-zoom-out').onclick = () => zoomBy(0.85);
    document.getElementById('btn-fit').onclick = fitView;

    document.getElementById('search').oninput = (e) => {
        state.searchTerm = e.target.value;
        renderNodes();
    };

    // 键盘快捷键
    window.addEventListener('keydown', (e) => {
        if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;
        if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z') { e.preventDefault(); undo(); }
        else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) { e.preventDefault(); redo(); }
        else if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); deleteSelected(); }
    });

    // ===== 导入/导出 =====
    document.getElementById('btn-export').onclick = () => {
        const clean = state.nodes.map(n => ({
            id: n.id, type: n.type, x: n.x, y: n.y, w: n.w, h: n.h,
            data: { ...n.data, image: null },  // 不导出大图
        }));
        const payload = { version: 1, exportedAt: new Date().toISOString(), source: 'xiaoma-ai-flow-canvas', nodes: clean, edges: state.edges };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `flow-${Date.now()}.json`; a.click();
        URL.revokeObjectURL(url);
        toast('✓ 已导出 JSON');
    };

    document.getElementById('btn-import').onclick = () => {
        const input = document.createElement('input');
        input.type = 'file'; input.accept = 'application/json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                try {
                    const payload = JSON.parse(ev.target.result);
                    if (!payload.nodes || !payload.edges) throw new Error('JSON 格式不正确');
                    pushHistory();
                    state.nodes = payload.nodes.map(n => ({ ...n, data: { ...defaultData(n.type), ...n.data } }));
                    state.edges = payload.edges;
                    render();
                    toast(`✓ 导入 ${state.nodes.length} 节点`);
                    fitView();
                } catch (err) {
                    toast('❌ 导入失败: ' + err.message, 'error');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    };

    // ===== localStorage 持久化 =====
    function saveState() {
        try {
            const data = {
                nodes: state.nodes.map(n => ({ id: n.id, type: n.type, x: n.x, y: n.y, w: n.w, h: n.h, data: { ...n.data, image: null } })),
                edges: state.edges,
                view: state.view,
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch {}
    }

    function loadState() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (!saved) return false;
            const data = JSON.parse(saved);
            if (!data.nodes?.length) return false;
            state.nodes = data.nodes.map(n => ({ ...n, data: { ...defaultData(n.type), ...n.data } }));
            state.edges = data.edges || [];
            if (data.view) state.view = data.view;
            return true;
        } catch { return false; }
    }

    // ===== MCP Agent 桥接 =====
    async function checkAgent() {
        try {
            const res = await fetch(`${AGENT_URL}/health`);
            if (res.ok) {
                const data = await res.json();
                state.agentStatus = data.ok ? 'connected' : 'error';
            } else state.agentStatus = 'disconnected';
        } catch { state.agentStatus = 'disconnected'; }
        updateAgentPill();
    }

    function updateAgentPill() {
        const ok = state.agentStatus === 'connected';
        agentPill.textContent = 'Agent: ' + (ok ? '已连接' : '未连接');
        agentPill.className = `api-pill ${ok ? '' : 'warn'}`;
    }

    async function pushToAgent() {
        if (state.agentStatus !== 'connected') return;
        try {
            await fetch(`${AGENT_URL}/canvas/state?token=${AGENT_TOKEN}`, {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({
                    nodes: state.nodes.map(n => ({
                        id: n.id, type: n.type, position: { x: n.x, y: n.y },
                        title: n.data.title || '',
                        prompt: n.data.prompt || n.data.content || '',
                        status: n.data.status || 'idle',
                    })),
                    edges: state.edges,
                }),
            });
        } catch {}
    }

    // ===== 初始化 =====
    function init() {
        // API 状态
        try {
            const hasKey = !!(typeof getApiKey === 'function' && getApiKey());
            apiPill.textContent = hasKey ? 'API 已配置' : '未配置 API';
            apiPill.className = `api-pill ${hasKey ? '' : 'warn'}`;
        } catch { apiPill.textContent = 'API 检测失败'; apiPill.className = 'api-pill warn'; }

        // 加载本地状态
        const loaded = loadState();
        if (!loaded) {
            // 默认添加示例节点
            state.nodes.push({ id: 'demo_prompt', type: 'prompt', x: 100, y: 100, w: 280, h: 200, data: { title: '示例：赛博朋克少女', content: 'A cinematic portrait of a cyberpunk girl with neon lights, rain, ultra detailed, 8K', status: 'idle' } });
            state.nodes.push({ id: 'demo_image', type: 'image', x: 480, y: 100, w: 280, h: 280, data: { title: 'GPT Image 2 生成', model: 'gpt-image-2', size: '1024x1024', n: 1, prompt: '', status: 'idle', image: null, error: null } });
            state.edges.push({ id: 'e_demo', source: 'demo_prompt', target: 'demo_image' });
        }

        render();
        setTimeout(fitView, 100);
        checkAgent();
        setInterval(checkAgent, 5000);

        // 窗口缩放
        window.addEventListener('resize', () => updateTransform());
    }

    init();
})();
