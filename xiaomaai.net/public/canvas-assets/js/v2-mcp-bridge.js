/* =============================================================================
 * 小马AI · V2 旧画布 MCP 桥接模块
 *
 * 让 Codex / Claude Code 通过本地 MCP 服务（http://127.0.0.1:17371）
 * 直接操作 v2.html 旧画布（8 种业务节点）
 *
 * 协议：MIT，独立实现
 *
 * 核心功能：
 *  - 检测 MCP 服务（/health）
 *  - 状态同步：hook scheduleSaveWorkspace() 自动推送 state → /canvas/state
 *  - 指令轮询：GET /canvas/pending 拿到 Codex 指令
 *  - 指令执行：调 V2.addNode / V2.removeNode / V2.updateNode 等
 *  - UI 状态：右上角显示 Agent 连接状态
 *
 * 用法（在 v2.html 末尾引入）：
 *   <script src="./js/v2-mcp-bridge.js"></script>
 * ============================================================================= */

(function () {
    'use strict';

    if (!window.V2) {
        console.warn('[v2-mcp-bridge] window.V2 未找到，桥接未启用');
        return;
    }

    const AGENT_URL = 'http://127.0.0.1:17371';
    const AGENT_TOKEN = 'test-token-12345';
    const PUSH_DEBOUNCE_MS = 800;  // 节流：800ms 内的多次状态变化合并推送
    const PULL_INTERVAL_MS = 3000; // 轮询：3s 拉取一次 Agent 指令

    const state = {
        connected: false,
        lastPushAt: 0,
        lastPullAt: 0,
        pushTimer: null,
        pullTimer: null,
        pendingOps: [],   // 已拉取待执行的 op 队列
    };

    // ===== 状态序列化 =====
    function snapshotCanvas() {
        try {
            const s = window.V2.state || window.state;
            if (!s) return null;
            // 序列化时排除 image dataUrl（base64 太大）
            const nodes = (s.nodes || []).map(n => ({
                id: n.id,
                type: n.type,
                x: n.x,
                y: n.y,
                title: n.title,
                status: n.status,
                text: n.text ? String(n.text).slice(0, 200) : '',
                prompt: n.prompt ? String(n.prompt).slice(0, 200) : '',
                alias: n.alias || '',
                hasImage: !!n.image,
            }));
            const connections = (s.connections || []).map(c => ({
                id: c.id,
                source: c.source,
                target: c.target,
            }));
            return {
                version: 'v2',
                nodes,
                connections,
                nodeCount: nodes.length,
                edgeCount: connections.length,
            };
        } catch (err) {
            console.error('[v2-mcp-bridge] snapshotCanvas 失败:', err);
            return null;
        }
    }

    // ===== 推送到 MCP =====
    async function pushToAgent() {
        const snap = snapshotCanvas();
        if (!snap) return;
        try {
            const res = await fetch(`${AGENT_URL}/canvas/state`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-canvas-token': AGENT_TOKEN,
                },
                body: JSON.stringify(snap),
            });
            if (res.ok) {
                state.connected = true;
                updateAgentPill();
            } else {
                state.connected = false;
                updateAgentPill();
            }
        } catch (e) {
            state.connected = false;
            updateAgentPill();
        }
    }

    function schedulePush() {
        clearTimeout(state.pushTimer);
        state.pushTimer = setTimeout(() => {
            pushToAgent();
        }, PUSH_DEBOUNCE_MS);
    }

    // ===== 从 MCP 拉取指令 =====
    async function pullFromAgent() {
        try {
            const res = await fetch(`${AGENT_URL}/canvas/pending`, {
                headers: { 'x-canvas-token': AGENT_TOKEN },
            });
            if (!res.ok) {
                state.connected = false;
                updateAgentPill();
                return;
            }
            const data = await res.json();
            state.connected = true;
            updateAgentPill();
            const pending = data.pending || [];
            for (const op of pending) {
                await executeOp(op);
            }
        } catch (e) {
            state.connected = false;
            updateAgentPill();
        }
    }

    // ===== 执行 Agent 指令 =====
    function uid(prefix) {
        return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    }

    function executeOp(op) {
        if (!op || !op.type) return;
        const V2 = window.V2;
        if (!V2) return;
        try {
            switch (op.type) {
                case 'add_node': {
                    if (V2.addNode) {
                        V2.addNode(op.nodeType || 'text', {
                            x: op.position?.x,
                            y: op.position?.y,
                            title: op.title,
                            text: op.text || op.content || op.prompt,
                            prompt: op.prompt || op.text || op.content,
                        });
                        showToast(`✓ Agent 添加 ${op.nodeType || 'text'} 节点: ${op.title || ''}`);
                    }
                    break;
                }
                case 'remove_node': {
                    if (op.id && V2.deleteNode) {
                        V2.deleteNode(op.id);
                        showToast(`🗑 Agent 删除节点 ${String(op.id).slice(-6)}`);
                    }
                    break;
                }
                case 'update_node': {
                    // V2 没暴露 updateNode，直接改 state.nodes
                    if (op.id && V2.state) {
                        const node = V2.state.nodes.find(n => n.id === op.id);
                        if (node) {
                            Object.assign(node, op.data || {});
                            V2.render && V2.render();
                            showToast(`✏️ Agent 更新节点 ${String(op.id).slice(-6)}`);
                        }
                    }
                    break;
                }
                case 'add_edge': {
                    // V2 没暴露 addConnection，直接操作 state.connections
                    if (op.source && op.target && V2.state) {
                        const id = op.id || uid('e');
                        const exists = V2.state.connections.find(c => c.id === id || (c.source === op.source && c.target === op.target));
                        if (!exists) {
                            V2.state.connections.push({ id, source: op.source, target: op.target });
                            V2.render && V2.render();
                            showToast(`🔗 Agent 连接 ${String(op.source).slice(-6)} → ${String(op.target).slice(-6)}`);
                        }
                    }
                    break;
                }
                case 'remove_edge': {
                    if (op.id && V2.state) {
                        V2.state.connections = V2.state.connections.filter(c => c.id !== op.id);
                        V2.render && V2.render();
                    }
                    break;
                }
                case 'select_node': {
                    if (V2.selectNode) {
                        V2.selectNode(op.id);
                    }
                    break;
                }
                case 'clear_canvas': {
                    if (V2.clearCanvas) {
                        if (confirm('Agent 请求清空画布，确认？')) {
                            V2.clearCanvas();
                        }
                    }
                    break;
                }
                default:
                    console.log('[v2-mcp-bridge] unknown op type:', op.type);
            }
        } catch (err) {
            console.error('[v2-mcp-bridge] executeOp 失败:', err);
        }
    }

    // ===== UI 状态指示 =====
    function ensureAgentPill() {
        // 优先在 header-actions 里插一个
        const header = document.querySelector('.v2-header-actions');
        if (!header) return null;
        let pill = document.getElementById('v2AgentPill');
        if (pill) return pill;
        pill = document.createElement('span');
        pill.id = 'v2AgentPill';
        pill.className = 'v2-header-btn';
        pill.style.cssText = 'cursor:default; font-size:12px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08);';
        pill.textContent = '🤖 Agent 检测中...';
        // 插到第一个位置（在"配置"按钮前）
        header.insertBefore(pill, header.firstChild);
        return pill;
    }

    function updateAgentPill() {
        const pill = document.getElementById('v2AgentPill') || ensureAgentPill();
        if (!pill) return;
        if (state.connected) {
            pill.textContent = '🤖 Agent 已连接';
            pill.style.background = 'rgba(34,197,94,0.15)';
            pill.style.borderColor = 'rgba(34,197,94,0.4)';
            pill.style.color = '#86efac';
        } else {
            pill.textContent = '🤖 Agent 未连接';
            pill.style.background = 'rgba(234,179,8,0.10)';
            pill.style.borderColor = 'rgba(234,179,8,0.3)';
            pill.style.color = '#fde68a';
        }
    }

    function showToast(msg, type = 'success') {
        const toast = document.getElementById('toast');
        if (!toast) return;
        toast.textContent = msg;
        toast.className = 'toast ' + (type === 'error' ? 'error' : '');
        toast.style.display = 'block';
        clearTimeout(showToast._t);
        showToast._t = setTimeout(() => { toast.style.display = 'none'; }, 2200);
    }

    // ===== Hook V2 状态变化 =====
    function hookStateChanges() {
        // 方案 1：拦截 scheduleSaveWorkspace（v2 所有状态变更都会调用）
        const V2 = window.V2;
        if (!V2 || !V2.scheduleSaveWorkspace) {
            console.warn('[v2-mcp-bridge] V2.scheduleSaveWorkspace 不存在，5s 后重试');
            setTimeout(hookStateChanges, 5000);
            return;
        }
        const originalSchedule = V2.scheduleSaveWorkspace.bind(V2);
        V2.scheduleSaveWorkspace = function (...args) {
            const r = originalSchedule(...args);
            schedulePush();
            return r;
        };
        console.log('[v2-mcp-bridge] ✅ Hook V2.scheduleSaveWorkspace 成功');

        // 方案 2：兜底 - render() 后也推送
        if (V2.render) {
            const originalRender = V2.render.bind(V2);
            V2.render = function (...args) {
                const r = originalRender(...args);
                schedulePush();
                return r;
            };
        }
    }

    // ===== 初始化 =====
    async function init() {
        ensureAgentPill();
        updateAgentPill();
        hookStateChanges();

        // 初次推送（v2 加载完成后再推）
        setTimeout(() => {
            pushToAgent();
        }, 2000);

        // 定期轮询 Agent 指令
        state.pullTimer = setInterval(pullFromAgent, PULL_INTERVAL_MS);

        // 定期推送状态（兜底，每 10s）
        setInterval(pushToAgent, 10000);

        console.log('[v2-mcp-bridge] 桥接已启动 → ', AGENT_URL);
    }

    // 等待 V2 加载完成
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => setTimeout(init, 1000));
    } else {
        setTimeout(init, 1000);
    }
})();
