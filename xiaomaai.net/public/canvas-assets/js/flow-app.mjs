/* =============================================================================
 * 小马AI · Flow Canvas - Node-based workflow canvas
 * ESM module version - 使用 React 18 + @xyflow/react via esm.sh
 *
 * 功能：
 *  - 节点类型：Prompt / Image / Reverse
 *  - 撤销/重做（Ctrl+Z / Ctrl+Y / Ctrl+Shift+Z）
 *  - 节点搜索（按标题/内容/模型过滤）
 *  - JSON 工作流导入/导出
 *  - MiniMap + Controls（React Flow 内置）
 *  - 节点连线（数据从上游 Prompt 注入下游 Image）
 *  - MCP 集成（向本地 127.0.0.1:17371 推送状态）
 *
 * 协议：
 *  - React Flow (@xyflow/react): MIT ✅
 *  - 本代码: 与 v2 同源 ✅
 *  - 不参考 AGPL-3.0 的 infinite-canvas ✅
 * ============================================================================= */

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import {
    ReactFlow,
    ReactFlowProvider,
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    addEdge,
    Handle,
    Position,
} from '@xyflow/react';

// ===== 节点类型定义 =====

function PromptNode({ data, id }) {
    const update = (key, val) => data.onChange?.(id, { ...data, [key]: val });
    return React.createElement('div', { className: `flow-node ${data.status || ''}` },
        React.createElement(Handle, { type: 'target', position: Position.Left, style: { background: '#7E22CE' } }),
        React.createElement('div', { className: 'node-header' },
            React.createElement('span', null, '📝 Prompt'),
            React.createElement('span', { className: 'status-tag' }, data.status || 'idle')
        ),
        React.createElement('div', { className: 'node-body' },
            React.createElement('input', {
                className: 'node-input',
                placeholder: '节点标题（可空）',
                value: data.title || '',
                onChange: e => update('title', e.target.value)
            }),
            React.createElement('textarea', {
                className: 'node-textarea',
                placeholder: '提示词内容…例如：A futuristic city with neon lights, ultra detailed, 8K',
                value: data.content || '',
                onChange: e => update('content', e.target.value)
            })
        ),
        React.createElement(Handle, { type: 'source', position: Position.Right, style: { background: '#EC4899' } })
    );
}

function ImageNode({ data, id }) {
    const update = (key, val) => data.onChange?.(id, { ...data, [key]: val });
    return React.createElement('div', { className: `flow-node ${data.status || ''}` },
        React.createElement(Handle, { type: 'target', position: Position.Left, style: { background: '#7E22CE' } }),
        React.createElement('div', { className: 'node-header' },
            React.createElement('span', null, '🎨 Image Gen'),
            React.createElement('span', { className: 'status-tag' }, data.status || 'idle')
        ),
        React.createElement('div', { className: 'node-body' },
            React.createElement('input', {
                className: 'node-input',
                placeholder: '节点标题',
                value: data.title || '',
                onChange: e => update('title', e.target.value)
            }),
            React.createElement('div', { className: 'node-row' },
                React.createElement('select', {
                    className: 'node-input',
                    value: data.model || 'gpt-image-2',
                    onChange: e => update('model', e.target.value)
                },
                    React.createElement('option', { value: 'gpt-image-2' }, 'gpt-image-2'),
                    React.createElement('option', { value: 'gpt-image-2-2k' }, 'gpt-image-2-2k'),
                    React.createElement('option', { value: 'gpt-image-2-4k' }, 'gpt-image-2-4k'),
                    React.createElement('option', { value: 'gpt-image-2-flatfee' }, 'gpt-image-2-flatfee'),
                    React.createElement('option', { value: 'dall-e-3' }, 'dall-e-3')
                )
            ),
            React.createElement('div', { className: 'node-row' },
                React.createElement('select', {
                    className: 'node-input',
                    value: data.size || '1024x1024',
                    onChange: e => update('size', e.target.value)
                },
                    React.createElement('option', { value: '1024x1024' }, '1:1 (1024²)'),
                    React.createElement('option', { value: '1536x1024' }, '3:2 (1536×1024)'),
                    React.createElement('option', { value: '1024x1536' }, '2:3 (1024×1536)'),
                    React.createElement('option', { value: '1792x1024' }, '16:9'),
                    React.createElement('option', { value: '2048x2048' }, '2K 方图'),
                    React.createElement('option', { value: '3840x2160' }, '4K 横图')
                ),
                React.createElement('input', {
                    className: 'node-input',
                    type: 'number',
                    min: 1, max: 4,
                    style: { width: 60 },
                    value: data.n || 1,
                    onChange: e => update('n', parseInt(e.target.value) || 1)
                })
            ),
            React.createElement('textarea', {
                className: 'node-textarea',
                placeholder: '提示词（可由上游 Prompt 节点覆盖）',
                value: data.prompt || '',
                onChange: e => update('prompt', e.target.value)
            }),
            data.image && React.createElement('img', { className: 'img-preview', src: data.image, alt: 'result' }),
            data.error && React.createElement('div', { style: { color: '#FCA5A5', fontSize: 11, marginTop: 6 } }, '❌ ' + data.error),
            React.createElement('button', {
                className: 'run-btn',
                onClick: () => data.onRun?.(id),
                disabled: data.status === 'generating'
            }, data.status === 'generating' ? '⏳ 生成中…' : '🚀 生成图片')
        ),
        React.createElement(Handle, { type: 'source', position: Position.Right, style: { background: '#EC4899' } })
    );
}

function ReverseNode({ data, id }) {
    const update = (key, val) => data.onChange?.(id, { ...data, [key]: val });
    return React.createElement('div', { className: `flow-node ${data.status || ''}` },
        React.createElement(Handle, { type: 'target', position: Position.Left, style: { background: '#7E22CE' } }),
        React.createElement('div', { className: 'node-header' },
            React.createElement('span', null, '🔍 Reverse'),
            React.createElement('span', { className: 'status-tag' }, data.status || 'idle')
        ),
        React.createElement('div', { className: 'node-body' },
            React.createElement('input', {
                className: 'node-input',
                placeholder: '反推模型',
                value: data.model || 'gpt-4o',
                onChange: e => update('model', e.target.value)
            }),
            React.createElement('textarea', {
                className: 'node-textarea',
                placeholder: '反推得到的提示词（上游 Image 节点生成后自动填入）',
                value: data.prompt || '',
                onChange: e => update('prompt', e.target.value)
            }),
            data.image && React.createElement('img', { className: 'img-preview', src: data.image, alt: 'src' }),
            React.createElement('button', {
                className: 'run-btn',
                onClick: () => data.onRun?.(id),
                disabled: data.status === 'generating' || !data.image
            }, data.status === 'generating' ? '⏳ 反推中…' : '🔍 反推提示词')
        ),
        React.createElement(Handle, { type: 'source', position: Position.Right, style: { background: '#EC4899' } })
    );
}

const nodeTypes = {
    prompt: PromptNode,
    image: ImageNode,
    reverse: ReverseNode,
};

const deepClone = obj => JSON.parse(JSON.stringify(obj));

// ===== 画布主组件 =====
function FlowCanvas() {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddMenu, setShowAddMenu] = useState(false);
    const [toast, setToast] = useState(null);
    const [apiStatus, setApiStatus] = useState('ok');
    const [agentStatus, setAgentStatus] = useState('disconnected');

    const historyRef = useRef({ past: [], future: [] });
    const [historyVer, setHistoryVer] = useState(0);

    const showToast = useCallback((msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 2000);
    }, []);

    const pushHistory = useCallback(() => {
        historyRef.current.past.push({
            nodes: deepClone(nodes),
            edges: deepClone(edges),
        });
        if (historyRef.current.past.length > 50) historyRef.current.past.shift();
        historyRef.current.future = [];
        setHistoryVer(v => v + 1);
    }, [nodes, edges]);

    const undo = useCallback(() => {
        const h = historyRef.current;
        if (!h.past.length) return;
        const prev = h.past.pop();
        h.future.push({ nodes: deepClone(nodes), edges: deepClone(edges) });
        setNodes(prev.nodes);
        setEdges(prev.edges);
        setHistoryVer(v => v + 1);
        showToast('↶ Undo');
    }, [nodes, edges, setNodes, setEdges, showToast]);

    const redo = useCallback(() => {
        const h = historyRef.current;
        if (!h.future.length) return;
        const next = h.future.pop();
        h.past.push({ nodes: deepClone(nodes), edges: deepClone(edges) });
        setNodes(next.nodes);
        setEdges(next.edges);
        setHistoryVer(v => v + 1);
        showToast('↷ Redo');
    }, [nodes, edges, setNodes, setEdges, showToast]);

    const onNodeDataChange = useCallback((id, newData) => {
        setNodes(nds => nds.map(n => n.id === id ? { ...n, data: newData } : n));
    }, [setNodes]);

    // 节点运行函数
    const runImageNode = useCallback(async (id) => {
        const node = nodes.find(n => n.id === id);
        if (!node) return;
        const data = node.data;
        let prompt = data.prompt || '';
        const incoming = edges.find(e => e.target === id);
        if (incoming) {
            const src = nodes.find(n => n.id === incoming.source);
            if (src?.type === 'prompt' && src.data.content) prompt = src.data.content;
            else if (src?.type === 'reverse' && src.data.prompt) prompt = src.data.prompt;
        }
        if (!prompt) { showToast('❌ 提示词为空', 'error'); return; }

        setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, status: 'generating', error: null } } : n));

        try {
            const result = await requestTextToImage({
                prompt, model: data.model || 'gpt-image-2',
                size: data.size || '1024x1024', n: data.n || 1,
            });
            const imageUrl = result?.data?.[0]?.url;
            const b64 = result?.data?.[0]?.b64_json;
            const imgSrc = imageUrl || (b64 ? `data:image/png;base64,${b64}` : null);
            if (!imgSrc) throw new Error('未返回图片数据');

            setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, status: 'done', image: imgSrc, error: null } } : n));
            const downstream = edges.filter(e => e.source === id);
            downstream.forEach(e => {
                const ds = nodes.find(n => n.id === e.target);
                if (ds?.type === 'reverse') {
                    setNodes(nds => nds.map(n => n.id === ds.id ? { ...n, data: { ...n.data, image: imgSrc } } : n));
                }
            });
            showToast('✓ 生成成功');
        } catch (err) {
            const msg = getErrMsg(err);
            setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, status: 'error', error: msg } } : n));
            showToast('❌ ' + msg, 'error');
        }
    }, [nodes, edges, setNodes, showToast]);

    const runReverseNode = useCallback(async (id) => {
        const node = nodes.find(n => n.id === id);
        if (!node || !node.data.image) return;

        setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, status: 'generating', error: null } } : n));

        try {
            const prompt = await postVisionText({
                imageUrl: node.data.image,
                text: '请详细描述这张图片的内容、构图、光线、风格。',
                model: node.data.model || 'gpt-4o',
            });
            setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, status: 'done', prompt } } : n));
            showToast('✓ 反推完成');
        } catch (err) {
            const msg = getErrMsg(err);
            setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, status: 'error', error: msg } } : n));
            showToast('❌ ' + msg, 'error');
        }
    }, [nodes, setNodes, showToast]);

    const wrappedOnNodesChange = useCallback((changes) => {
        const hasStructural = changes.some(c => c.type === 'add' || c.type === 'remove' || c.type === 'replace' || c.type === 'position' && Math.abs(c.position?.x || 0) > 5);
        if (hasStructural) pushHistory();
        onNodesChange(changes);
    }, [onNodesChange, pushHistory]);

    const wrappedOnEdgesChange = useCallback((changes) => {
        if (changes.some(c => c.type === 'add' || c.type === 'remove')) pushHistory();
        onEdgesChange(changes);
    }, [onEdgesChange, pushHistory]);

    const onConnect = useCallback((params) => {
        pushHistory();
        setEdges(eds => addEdge({ ...params, animated: true, type: 'smoothstep' }, eds));
    }, [setEdges, pushHistory]);

    const addNode = useCallback((type, pos) => {
        const id = `n_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const def = {
            prompt: { title: '新提示词', content: 'A cinematic portrait of a cyberpunk samurai, neon lights, 8K', onChange: onNodeDataChange },
            image: {
                title: '新图片生成', model: 'gpt-image-2', size: '1024x1024', n: 1, prompt: '',
                status: 'idle', image: null, error: null,
                onChange: onNodeDataChange, onRun: runImageNode,
            },
            reverse: {
                title: '反推', model: 'gpt-4o', prompt: '', image: null,
                status: 'idle', error: null,
                onChange: onNodeDataChange, onRun: runReverseNode,
            },
        };
        pushHistory();
        setNodes(nds => [...nds, { id, type, position: pos || { x: 200, y: 200 }, data: def[type] }]);
        setShowAddMenu(false);
        showToast(`✓ 添加 ${type} 节点`);
    }, [onNodeDataChange, runImageNode, runReverseNode, pushHistory, setNodes, showToast]);

    const filteredNodes = useMemo(() => {
        if (!searchTerm) return nodes;
        const term = searchTerm.toLowerCase();
        return nodes.map(n => {
            const data = n.data || {};
            const match = (data.title || '').toLowerCase().includes(term)
                || (data.content || '').toLowerCase().includes(term)
                || (data.prompt || '').toLowerCase().includes(term)
                || (data.model || '').toLowerCase().includes(term);
            return { ...n, data: { ...data, _dim: !match } };
        });
    }, [nodes, searchTerm]);

    const exportJson = useCallback(() => {
        const cleanNodes = nodes.map(n => ({
            id: n.id, type: n.type, position: n.position,
            data: { title: n.data.title, content: n.data.content, prompt: n.data.prompt, model: n.data.model, size: n.data.size, n: n.data.n },
        }));
        const payload = { version: 1, exportedAt: new Date().toISOString(), source: 'xiaoma-ai-flow-canvas', nodes: cleanNodes, edges };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `flow-${Date.now()}.json`; a.click();
        URL.revokeObjectURL(url);
        showToast('✓ 已导出 JSON');
    }, [nodes, edges, showToast]);

    const importJson = useCallback(() => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                try {
                    const payload = JSON.parse(ev.target.result);
                    if (!payload.nodes || !payload.edges) throw new Error('JSON 格式不正确');
                    const restoredNodes = payload.nodes.map(n => {
                        const baseData = {
                            onChange: onNodeDataChange,
                            onRun: n.type === 'image' ? runImageNode : n.type === 'reverse' ? runReverseNode : undefined,
                        };
                        return { ...n, data: { ...baseData, ...n.data } };
                    });
                    pushHistory();
                    setNodes(restoredNodes);
                    setEdges(payload.edges.map(e => ({ ...e, animated: true, type: 'smoothstep' })));
                    showToast(`✓ 导入 ${restoredNodes.length} 节点`);
                } catch (err) {
                    showToast('❌ 导入失败: ' + err.message, 'error');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }, [onNodeDataChange, runImageNode, runReverseNode, pushHistory, setNodes, setEdges, showToast]);

    const clearAll = useCallback(() => {
        if (!confirm('清空画布？此操作可撤销。')) return;
        pushHistory();
        setNodes([]); setEdges([]);
        showToast('🗑 已清空');
    }, [pushHistory, setNodes, setEdges, showToast]);

    useEffect(() => {
        const data = {
            nodes: nodes.map(n => ({ id: n.id, type: n.type, position: n.position, data: { title: n.data.title, content: n.data.content, prompt: n.data.prompt, model: n.data.model, size: n.data.size, n: n.data.n } })),
            edges,
        };
        try { localStorage.setItem('xiaoma_ai_flow_canvas_v1', JSON.stringify(data)); } catch {}
    }, [nodes, edges]);

    useEffect(() => {
        try {
            const saved = localStorage.getItem('xiaoma_ai_flow_canvas_v1');
            if (!saved) return;
            const data = JSON.parse(saved);
            if (!data.nodes?.length) return;
            const restored = data.nodes.map(n => ({
                ...n,
                data: {
                    ...n.data,
                    onChange: onNodeDataChange,
                    onRun: n.type === 'image' ? runImageNode : n.type === 'reverse' ? runReverseNode : undefined,
                },
            }));
            setNodes(restored);
            setEdges((data.edges || []).map(e => ({ ...e, animated: true, type: 'smoothstep' })));
            showToast(`✓ 已恢复 ${restored.length} 节点`);
        } catch {}
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const hasKey = !!(typeof getApiKey === 'function' && getApiKey());
        setApiStatus(hasKey ? 'ok' : 'warn');
    }, []);

    useEffect(() => {
        const onKey = (e) => {
            if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z') { e.preventDefault(); undo(); }
            else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) { e.preventDefault(); redo(); }
            else if (e.key === 'Delete' || e.key === 'Backspace') {
                const selected = nodes.filter(n => n.selected);
                if (selected.length && document.activeElement === document.body) {
                    e.preventDefault();
                    pushHistory();
                    setNodes(nds => nds.filter(n => !n.selected));
                    setEdges(eds => eds.filter(e => !selected.find(s => s.id === e.source || s.id === e.target)));
                }
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [undo, redo, nodes, pushHistory, setNodes, setEdges]);

    useEffect(() => {
        const checkAgent = async () => {
            try {
                const res = await fetch('http://127.0.0.1:17371/health');
                if (res.ok) { const data = await res.json(); setAgentStatus(data.ok ? 'connected' : 'error'); }
                else setAgentStatus('disconnected');
            } catch { setAgentStatus('disconnected'); }
        };
        checkAgent();
        const t = setInterval(checkAgent, 5000);
        return () => clearInterval(t);
    }, []);

    useEffect(() => {
        if (agentStatus !== 'connected') return;
        (async () => {
            try {
                await fetch('http://127.0.0.1:17371/canvas/state?token=test-token-12345', {
                    method: 'POST',
                    headers: { 'content-type': 'application/json' },
                    body: JSON.stringify({
                        nodes: nodes.map(n => ({ id: n.id, type: n.type, position: n.position, title: n.data.title || '', prompt: n.data.prompt || n.data.content || '', status: n.data.status || 'idle' })),
                        edges,
                    }),
                });
            } catch {}
        })();
    }, [nodes, edges, agentStatus]);

    return React.createElement('div', { style: { width: '100%', height: '100%', position: 'relative' } },
        React.createElement('div', { className: 'topbar' },
            React.createElement('div', { className: 'title' }, '小马AI · Flow'),
            React.createElement('span', { className: `api-pill ${apiStatus === 'warn' ? 'warn' : ''}` }, apiStatus === 'ok' ? 'API 已配置' : '未配置 API'),
            React.createElement('span', { className: `api-pill ${agentStatus === 'connected' ? '' : 'warn'}` }, 'Agent: ' + (agentStatus === 'connected' ? '已连接' : '未连接')),
            React.createElement('input', { className: 'search', placeholder: '🔍 搜索节点（标题/提示词/模型）', value: searchTerm, onChange: e => setSearchTerm(e.target.value) }),
            React.createElement('button', { className: 'btn', onClick: () => setShowAddMenu(!showAddMenu) }, '➕ 添加节点'),
            showAddMenu && React.createElement('div', { className: 'add-menu' },
                React.createElement('div', { className: 'item', onClick: () => addNode('prompt', { x: 100, y: 100 }) }, '📝 Prompt 节点'),
                React.createElement('div', { className: 'item', onClick: () => addNode('image', { x: 100, y: 280 }) }, '🎨 Image Gen 节点'),
                React.createElement('div', { className: 'item', onClick: () => addNode('reverse', { x: 100, y: 460 }) }, '🔍 Reverse 节点')
            ),
            React.createElement('button', { className: 'btn', onClick: undo, disabled: !historyRef.current.past.length }, '↶ 撤销'),
            React.createElement('button', { className: 'btn', onClick: redo, disabled: !historyRef.current.future.length }, '↷ 重做'),
            React.createElement('button', { className: 'btn', onClick: importJson }, '📂 导入'),
            React.createElement('button', { className: 'btn', onClick: exportJson }, '💾 导出'),
            React.createElement('button', { className: 'btn', onClick: clearAll }, '🗑 清空'),
            React.createElement('a', { className: 'btn', href: './v2.html' }, '← 旧画布'),
            React.createElement('a', { className: 'btn', href: '../index.html' }, '🏠 首页')
        ),
        React.createElement('div', { style: { position: 'absolute', top: 56, left: 0, right: 0, bottom: 0 } },
            React.createElement(ReactFlow, {
                nodes: filteredNodes.map(n => ({ ...n, style: { ...n.style, opacity: n.data._dim ? 0.25 : 1, transition: 'opacity 0.2s' } })),
                edges,
                onNodesChange: wrappedOnNodesChange,
                onEdgesChange: wrappedOnEdgesChange,
                onConnect,
                nodeTypes,
                fitView: true,
                proOptions: { hideAttribution: true },
                defaultEdgeOptions: { animated: true, type: 'smoothstep' }
            },
                React.createElement(Background, { color: 'rgba(255,255,255,0.05)', gap: 20, size: 1 }),
                React.createElement(MiniMap, {
                    nodeColor: n => n.type === 'prompt' ? '#7E22CE' : n.type === 'image' ? '#EC4899' : n.type === 'reverse' ? '#06B6D4' : '#fff',
                    nodeStrokeWidth: 2,
                    pannable: true, zoomable: true
                }),
                React.createElement(Controls)
            )
        ),
        toast && React.createElement('div', { className: `toast ${toast.type === 'error' ? 'error' : ''}` }, toast.msg),
        React.createElement('div', { style: { position: 'absolute', bottom: 16, left: 16, zIndex: 10, padding: '8px 12px', background: 'rgba(0,0,0,0.6)', borderRadius: 8, fontSize: 11, color: 'rgba(255,255,255,0.5)' } },
            '💡 拖拽节点右侧端点连线 · Ctrl+Z 撤销 · Del 删除 · 滚轮缩放')
    );
}

function App() {
    return React.createElement(ReactFlowProvider, null, React.createElement(FlowCanvas));
}

createRoot(document.getElementById('root')).render(React.createElement(App));
