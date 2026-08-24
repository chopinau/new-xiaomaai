// 小马AI画布 v2. Independent toolbox-style canvas.
//
// =============================================================================
// FILE INDEX — grep `SECTION: <NAME>` to jump.
// =============================================================================
//   01 CONSTANTS         Config constants, ratio/resolution/prompt tables
//   02 STATE             state object, DOM refs, RAF frame ids, caches
//   03 INIT              init(), bindEvents() — root-level wiring
//   04 UTIL              uid, escHtml, screenToWorld, applyTransform, getNode,
//                        cssEscape, minimap pointer helpers
//   05 SKETCH-STATE      sketch normalization, color/mapping helpers
//   06 NODE-CRUD         addNode, defaultTitle, drop/paste/import images
//   07 GROUP-DATA        createGroup, group descendants, normalize, hit-test
//   08 GEOMETRY          getNodeBox, preview sizes, port positions
//   09 RENDER            render(), renderNodes, minimap, scheduleDragFrame,
//                        sync*Classes, hide/restoreNodePanelsDuringDrag
//   10 NODE-HTML         renderImageNode/Text/Detail/Sketch/Generate, nodeShell
//   11 PANEL-HTML        image/text/detail/sketch/generate panel HTML
//   12 ASSISTANT-HTML    assistant panel HTML + chat helpers
//   13 PROMPT-HIGHLIGHT  prompt highlight, mention boundary, ref strips
//   14 NODE-EVENTS       bindNodeEvents, onNodeMouseDown, startNodeDrag,
//                        group drag start
//   15 CANVAS-EVENTS     onCanvasMouseDown, contextMenu, document mousedown,
//                        addNodeFromContext
//   16 POINTER-MOTION    onMouseMove, onMouseUp
//   17 CONNECTIONS       onPortOutDown/Up, completeConnection, findTarget
//   18 SELECTION-BOX     selectionRect, finishSelection, group hit-test
//   19 GROUP-MGMT        selectGroupNodes, ungroup, drop group, arrange
//   20 CONNECTION-RENDER distanceToBezier, renderConnections, link path
//   21 VIEWPORT          onWheel, gestures, zoomBy, fitView
//   22 SELECTION         isNodeSelected, selectNode, clearSelection, onKeyDown
//   23 PANEL-EVENTS      bindGenerate/Image/Detail/Sketch/TextPanelEvents
//   24 SKETCH-CANVAS     init/draw/clear/import sketch, AI segmentation
//   25 GENERATE-OPTIONS  ratio/resolution/model option tables, normalize
//   26 REFS              collectRefsForNode, alias lookup, image roles
//   27 REGION-EDITOR     openRegionEditor, region selection logic
//   28 DETAIL            normalizeDetail, detail summary/prompt block
//   29 PREVIEW           previewOutput/Image/Sketch, modal, download
//   30 LIBRARY           prompt library load/save/use/delete
//   31 VERSIONS          generate version normalize/switch/append
//   32 PROMPT-BUILD      buildCompiledPrompt, buildPrompt
//   33 CHAT              chat intent classify, system prompt, refs filter
//   34 TEXT-RUN          runTextNode, runGlobalChat, adopt chat
//   35 HTTP-VISION       postVisionText, postChatAdvisor
//   36 GENERATE-RUN      generate run state, audio, cancel
//   37 HTTP-IMAGE        requestTextToImage, requestImageEdit, fallback
//   38 PERSISTENCE       saveWorkspace, loadWorkspace, clearCanvas
// =============================================================================

const V2 = (() => {
  // ==========================================================================
  // SECTION: 01 CONSTANTS
  // ==========================================================================
  const APP_VERSION = '1.5.65';
  const CHANNEL_SUFFIX = typeof appChannel === 'function' && appChannel() !== 'stable' ? `_${appChannel()}` : '';
  const CHANNEL_LABEL = typeof isDevChannel === 'function' && isDevChannel() ? ' DEV' : '';
  const STORE_KEY = `xiaoma_ai_v2_workspace${CHANNEL_SUFFIX}`;
  const LIBRARY_KEY = `xiaoma_ai_v2_prompt_library${CHANNEL_SUFFIX}`;
  const IMG_PREFIX = `xiaoma_ai_v2_img${CHANNEL_SUFFIX}_`;
  const NODE_W = 260;
  const MEDIA_NODE_W = 720;
  const GENERATE_NODE_W = 720;
  const GENERATE_PREVIEW_MAX_W = 640;
  const GENERATE_PREVIEW_MAX_H = 640;
  const MEDIA_PREVIEW_SCALE = 0.66;
  const IMAGE_DISPLAY_MAX_W = Math.round(GENERATE_PREVIEW_MAX_W * MEDIA_PREVIEW_SCALE);
  const IMAGE_DISPLAY_MAX_H = Math.round(GENERATE_PREVIEW_MAX_H * MEDIA_PREVIEW_SCALE);
  const PASTED_IMAGE_DISPLAY_MAX_W = 420;
  const PASTED_IMAGE_DISPLAY_MAX_H = 320;
  const IMAGE_DISPLAY_MIN_SIDE = 160;
  const GENERATE_COMPOSER_W = 760;
  const GENERATE_COMPOSER_GAP = 16;
  const GENERATE_COMPOSER_BASE_H = 246;
  const GENERATE_COMPOSER_FOCUS_EXTRA_H = 116;
  const NODE_PAD_X = 24;
  const PANEL_W = 720;
  const TEXT_PANEL_W = 560;
  const SKETCH_PANEL_W = 760;
  const NODE_PANEL_GAP = 16;
  const GLOBAL_CHAT_ID = 'global-chat';
  const GENERATE_CANCEL_GRACE_MS = 2000;
  const GENERATE_COUNT_OPTIONS = [1, 2, 4];
  const DETAIL_PAGE_DEFAULT_COUNT = 8;
  const DETAIL_PAGE_MIN_COUNT = 6;
  const DETAIL_PAGE_MAX_COUNT = 10;
  const DETAIL_PAGE_COUNT_OPTIONS = [6, 8, 10];
  const DETAIL_PAGE_GROUP_PREFIX = 'detail-page';
  const DETAIL_PAGE_MAX_REFERENCE_IMAGES = 6;
  const CINEMA_SOURCE_VERSION = window.CinemaPrompt?.SOURCE_VERSION || 'Quill_GPT电影感提示词_v5.0';
  const TRY_ON_PROMPT_TAG = '__XIAOMA_AI_TRY_ON_DIRECT_INPUT__';
  const DETAIL_PAGE_CATEGORY_RULES = [
    '通用品类详情页规则：先根据主图、产品资料和用户描述判断商品类别，再选择该类别的详情页模块；不要把所有商品都套成同一种产品海报。',
    '可识别类别包括但不限于：食品饮品、美妆个护、服饰鞋包、数码电器、家居家装、母婴宠物、汽车/配件、图书课程、服务/虚拟商品。',
    '模块库：来源/原料、材质/成分、结构拆解、关键局部、使用步骤、场景演示、前后对比、规格参数、包装清单、适用人群、售后保障、购买理由总结。',
    '虚拟长图母版：不生成真超长图；按 6-10 张常规竖图切片生成，但共享统一背景、光影、字体层级、装饰系统和跨屏视觉节奏。',
    '主体使用规则：贯穿整套详情页的是商品事实、品牌调性和视觉系统，不是每屏都必须出现完整主体；非首屏允许完全不出现完整商品，只展示来源、原料、材质纹理、结构拆解、局部特写、使用步骤、图标、表格或场景元素。',
    '非首屏规则：禁止反复完整居中展示同一个主体；必须按模块选择“无完整主体、关键局部、结构拆解、缩略辅助、组合陈列、场景演示、信息图或参数表”。',
    '跨屏规则：顶部/底部允许 5%-12% 背景、光影、装饰、纹理延续带；核心文案、参数表、价格区、按钮、卖点卡和主体关键识别区域不能被切半；衔接带只做视觉延续，不承载需要阅读的核心信息。',
    '安全区规则：每屏顶部 12% 和底部 12% 是衔接安全区，只能放背景、光影、纹理、装饰线、色块、无阅读价值的氛围元素；标题、卡片、表格、按钮、价格、参数、卖点正文必须完整放在中间 76% 内容区。'
  ];
  const CINEMA_ANTI_AI_SUPPRESSION_RULES = window.CinemaPrompt?.ANTI_AI_SUPPRESSION_RULES || [
    'v4 反 AI / 实拍压制模块：v5 负责判断画面目的、镜头、光线、空间和色彩；v4 只作为压制与自检层使用，不恢复旧版 24 字段输出格式。',
    '真人电影感必须像真实摄影机在现场捕捉到的画面，而不是游戏 CG、概念设计图、宣传海报或全身怪物展示；允许雨雾、遮挡、运动模糊、镜头限制和不完整可见性。',
    '避免 8K、超清、极致细节、sharp focus、ultra detailed、HDR 微对比、油腻高光、过度锐化、全画面均匀高清和没有来源的戏剧化光效。',
    '暗部可以深，但必须由合理环境反射光轻轻托起，保留透明层次和干净色相；避免暗部死黑、脏黑阴影、泥灰色块、彩色噪点、颗粒结块和压缩脏斑。',
    '细节有预算：细节集中在主体、脸、手、关键道具或商品识别面；背景、天空、墙面、草地、烟雾、人群和远景保持大色块、低频、安静，不和主体抢戏。',
    '续改已有提示词时，只修复用户指出的问题和当前结果图暴露的相关缺陷；不要把上一版有效的主体、镜头、场景、光影、色彩和氛围全部推翻。'
  ].join('\n');
  const ASSISTANT_STREAM_READ_TIMEOUT_MS = 90_000;

  function sanitizeCinemaFinalPrompt(text) {
    const value = sanitizeProductNoise(text || '');
    if (!value) return '';
    return window.CinemaPrompt?.sanitizeFinalPrompt
      ? window.CinemaPrompt.sanitizeFinalPrompt(value)
      : value;
  }

  const MIN_ZOOM = 0.35;
  const FIT_VIEW_MIN_ZOOM = 0.015;
  const MAX_ZOOM = 2.4;
  const GESTURE_ZOOM_POWER = 2.4;
  const PINCH_ZOOM_SENSITIVITY = 0.0038;
  const MODIFIER_ZOOM_SENSITIVITY = 0.0014;
  const MINIMAP_W = 192;
  const MINIMAP_H = 132;
  const MINIMAP_PAD = 12;
  const IMAGE_GRID_COL_GAP = 46;
  const IMAGE_GRID_ROW_GAP = 18;
  const TEXT_NODE_H = 203;
  const DRAG_START_PX = 4;
  const REGION_MIN_RATIO = 0.015;
  const SKETCH_CANVAS_SIZE = 512;
  const SKETCH_HISTORY_LIMIT = 20;
  const STYLE_PROXY_MAX_SIDE = 1024;
  const STYLE_PROXY_CELL = 56;
  const STYLE_PROXY_BLUR_PX = 8;
  const STYLE_PROXY_QUALITY = 0.82;
  const SKETCH_VISION_TIMEOUT_MS = 60_000;
  const SKETCH_VISION_MAX_SIDE = 1280;
  const SKETCH_VISION_QUALITY = 0.82;
  const SKETCH_SEGMENTATION_COLORS = [
    { color: '#ff1f1f', label: '红色' },
    { color: '#00d826', label: '绿色' },
    { color: '#1167ff', label: '蓝色' },
    { color: '#ffd400', label: '黄色' },
    { color: '#9b5cff', label: '紫色' },
    { color: '#00d4ff', label: '青色' },
    { color: '#ff8a00', label: '橙色' },
    { color: '#ff5ab3', label: '粉色' }
  ];
  const DEFAULT_SKETCH_MAPPINGS = [
    { color: '#ff1f1f', label: '红色', target: '' },
    { color: '#00d826', label: '绿色', target: '' },
    { color: '#ffd400', label: '黄色', target: '' },
    { color: '#1167ff', label: '蓝色', target: '' }
  ];
  const LEGACY_SKETCH_DEFAULT_TARGETS = new Map([
    ['#ff1f1f', '岩石'],
    ['#00d826', '雪山'],
    ['#ffd400', '积雪草'],
    ['#1167ff', '水']
  ]);
  const ARRANGE_COL_GAP = 120;
  const ARRANGE_ROW_GAP = 42;
  const SIZE_RATIO_OPTIONS = [
    { value: '1:1', label: '1:1 方图', sizes: { '1K': '1024x1024', '2K': '2048x2048' } },
    { value: '16:9', label: '16:9 横', sizes: { '1K': '1792x1024', '2K': '2048x1152', '4K': '3840x2160' } },
    { value: '9:16', label: '9:16 竖', sizes: { '1K': '1024x1792', '4K': '2160x3840' } },
    { value: '3:2', label: '3:2 横', sizes: { '1K': '1536x1024' } },
    { value: '2:3', label: '2:3 竖', sizes: { '1K': '1024x1536' } },
    { value: '4:5', label: '4:5 竖', sizes: { '1K': '1024x1280' } },
    { value: '5:4', label: '5:4 横', sizes: { '1K': '1280x1024' } },
    { value: '2:1', label: '2:1 超宽', sizes: { '2K': '2048x1024' } },
    { value: '1:2', label: '1:2 超高', sizes: { '2K': '1024x2048' } },
    { value: '12:5', label: '12:5 电影超宽', sizes: { '2K': '2304x960', '4K': '3840x1600' } },
    { value: '21:9', label: '21:9 超宽屏', sizes: { '2K': '2048x864' } },
    { value: '9:21', label: '9:21 超高屏', sizes: { '2K': '864x2048' } },
    { value: '4:3', label: '4:3 横', sizes: { '2K': '2048x1536' } },
    { value: '3:4', label: '3:4 竖', sizes: { '2K': '1536x2048', '3K': '2160x2880' } }
  ];
  const RATIO_PICKER_OPTIONS = [
    { value: 'auto', label: '自适应' },
    { value: '1:1', label: '1:1' },
    { value: '9:16', label: '9:16' },
    { value: '16:9', label: '16:9' },
    { value: '3:4', label: '3:4' },
    { value: '4:3', label: '4:3' },
    { value: '3:2', label: '3:2' },
    { value: '2:3', label: '2:3' },
    { value: '4:5', label: '4:5' },
    { value: '5:4', label: '5:4' },
    { value: '12:5', label: '电影超宽' },
    { value: '21:9', label: '21:9' }
  ];
  const RESOLUTION_PICKER_OPTIONS = ['1K', '2K', '3K', '4K'];
  // 默认改为 strong：用户上传的参考图会真传到 catbox → lk888（真图生图）
  // 老节点：未主动选过的会自动从 structure 升级到 strong（用户主动设过的保持原样）
  const DEFAULT_REFERENCE_MODE = 'strong';
  const GENERATE_REFERENCE_MODES = [
    { value: 'structure', label: '结构参考', hint: '参考图只做文字约束，不直接进图像通道' },
    { value: 'strong', label: '视觉优先', hint: '参考图直接进入图像通道，优先保留画面味道' }
  ];
  const DEFAULT_TEXT_PROMPT = PromptEngine.DEFAULT_TEXT_PROMPT;
  const DEFAULT_GENERATE_PROMPT = '主图：\n参考图：\n提示词：';
  const LEGACY_GENERATE_TEMPLATE_PROMPT = '主体：\n参考：\n提示词：';
  const CHAT_PROMPT_HEADING_RE = /^(提示词|prompt|image2\s*prompt)\s*[:：]/i;
  const CHAT_DETAIL_HEADING_RE = /^(产品资料|detail|详情|产品信息|参数|规格参数|产品参数|车辆参数|性能参数|配置参数|配置信息)\s*[:：]/i;
  const CHAT_BLOCK_STOP_RE = /^(提示词|prompt|image2\s*prompt|产品资料|detail|详情|产品信息|参数|规格参数|产品参数|车辆参数|性能参数|配置参数|配置信息|理由|说明|注意|为什么|建议|可选|修改理由|诊断|版式描述|排版建议|布局建议|构图建议|版式建议|layout\s*(?:description|suggestion|advice|guide))\s*[:：]/i;
  const CHAT_LAYOUT_HEADING_RE = /^(版式描述|排版建议|布局建议|构图建议|版式建议|layout\s*(?:description|suggestion|advice|guide))\s*[:：]/i;
  const PRODUCT_FACT_FIELDS = [
    ['name', '产品名称'],
    ['category', '品类'],
    ['brand', '品牌'],
    ['sellingPoints', '核心卖点'],
    ['specs', '规格参数'],
    ['materials', '材质/成分'],
    ['forbidden', '禁止编造/禁用词'],
    ['notes', '补充说明']
  ];
  const LEGACY_GENERATE_PROMPTS = new Set([
    '根据上游文本和 @图1 生成一张高级产品海报。',
    '根据上游文本和接入图片生成一张高级产品海报。',
    '根据提示词生成图片。',
    LEGACY_GENERATE_TEMPLATE_PROMPT
  ]);
  const LEGACY_TEXT_TEMPLATE_PROMPTS = new Set(PromptEngine.LEGACY_TEXT_TEMPLATE_PROMPTS);
  const TEXT_TEMPLATES = PromptEngine.TEXT_TEMPLATES;

  // ==========================================================================
  // SECTION: 02 STATE
  // ==========================================================================
  const state = {
    nodes: [],
    trash: [],    // 回收站：被删除的节点暂存于此，可恢复
    connections: [],
    groups: [],
    selectedId: null,
    selectedIds: [],
    selectedGroupIds: [],
    panX: 80,
    panY: 110,
    zoom: 1,
    drag: null,
    link: null,
    linkTargetId: null,
    panning: null,
    pendingNodeDrag: null,
    pendingGroupDrag: null,
    selecting: null,
    minimapDrag: null,
    groupDrag: null,
    dragConnectionIds: null,
    gesture: null,
    pendingConnection: null,
    suppressNextContextClose: false,
    suppressNextNodeClick: false,
    contextMenu: null,
    mention: null,
    previewNodeId: null,
    previewZoom: 1,
    previewPanX: 0,
    previewPanY: 0,
    previewGesture: null,
    closeGuardResolver: null,
    regionEditor: null,
    pendingRegionTargetId: null,
    ratioPopoverNodeId: null,
    settingPopover: null,
    dragPanelSnapshot: null,
    appLogOpen: false,
    appLogs: [],
    trashOpen: false,
    detailPageOpen: false,
    activeDetailPageGroupId: '',
    detailPageBatchRunning: false,
    // UI 专用：上游变更追踪。Map<downstreamId, Set<upstreamId>>
    // 当 image/generate/sketch 节点的图变了，把所有下游节点加入此表；
    // 下游节点成功运行后清除。**不写入 node 本身**，避免改变节点结构。
    dirtyUpstreams: new Map(),
    assistant: {
      open: true,
      messages: [],
      draft: '',
      adoptedPrompt: '',
      adoptedMessageIndex: -1,
      status: 'idle',
      error: '',
      model: ''
    }
  };

  let saveTimer = null;
  let dragFrame = null;
  let linkFrame = null;
  let viewportFrame = null;
  let minimapFrame = null;
  let assistantScrollFrame = false;
  let minimapModelCache = null;
  let minimapStructureSignature = '';
  let minimapNodesHtmlCache = '';
  let _groupsHtmlCache = '';
  let _groupsSignatureCache = '';
  let _viewportTransformCache = '';
  let _gridSizeCache = '';
  let _gridPositionCache = '';
  let _nodeElementCache = new Map();
  let _groupElementCache = new Map();
  let _nodeByIdCache = new Map();
  let _nodeByIdSource = null;
  let _nodeByIdLength = -1;
  let lastAssistantSendAt = 0;
  let audioContext = null;
  let audioUnlocked = false;
  let tauriFileDropBound = false;
  let tauriCloseGuardBound = false;
  const persistedAssetCache = new Map();
  const sketchEditors = new Map();
  const activeGenerateRuns = new Map();

  const els = {};

  // ==========================================================================
  // SECTION: 03 INIT
  // ==========================================================================
  function init() {
    els.canvas = document.getElementById('v2Canvas');
    els.world = document.getElementById('v2World');
    els.connections = document.getElementById('v2Connections');
    els.grid = document.querySelector('.v2-grid');
    els.contextMenu = document.getElementById('v2ContextMenu');
    els.selectionBox = document.getElementById('v2SelectionBox');
    els.mentionMenu = document.getElementById('v2MentionMenu');
    els.previewModal = document.getElementById('v2PreviewModal');
    els.previewImg = document.getElementById('v2PreviewImg');
    els.previewCaption = document.getElementById('v2PreviewCaption');
    els.previewDownload = document.getElementById('v2PreviewDownload');
    els.previewPrev = document.getElementById('v2PreviewPrev');
    els.previewNext = document.getElementById('v2PreviewNext');
    els.regionModal = document.getElementById('v2RegionModal');
    els.regionStage = document.getElementById('v2RegionStage');
    els.regionImg = document.getElementById('v2RegionImg');
    els.regionSelection = document.getElementById('v2RegionSelection');
    els.regionSubjectLabel = document.getElementById('v2RegionSubjectLabel');
    els.regionSave = document.getElementById('v2RegionSave');
    els.libraryPanel = document.getElementById('v2PromptLibraryPanel');
    els.libraryGrid = document.getElementById('v2PromptLibraryGrid');
    els.libraryCount = document.getElementById('v2PromptLibraryCount');
    els.assetPanel = document.getElementById('v2AssetLibraryPanel');
    els.assetCount = document.getElementById('v2AssetLibraryCount');
    els.assetFolderList = document.getElementById('v2AssetFolderList');
    els.assetGrid = document.getElementById('v2AssetLibraryGrid');
    els.assetSearch = document.getElementById('v2AssetSearch');
    els.logPanel = document.getElementById('v2LogPanel');
    els.logList = document.getElementById('v2LogList');
    els.logSummary = document.getElementById('v2LogSummary');
    els.closeGuardModal = document.getElementById('v2CloseGuardModal');
    els.closeGuardList = document.getElementById('v2CloseGuardList');
    els.closeGuardWait = document.getElementById('v2CloseGuardWait');
    els.closeGuardClose = document.getElementById('v2CloseGuardClose');
    els.detailPagePanel = document.getElementById('v2DetailPagePanel');
    els.detailPageFlow = document.getElementById('v2DetailPageFlow');
    els.detailPageSummary = document.getElementById('v2DetailPageSummary');
    els.minimap = document.getElementById('v2Minimap');
    els.minimapStage = document.getElementById('v2MinimapStage');
    els.minimapContent = document.getElementById('v2MinimapContent');
    els.minimapViewport = document.getElementById('v2MinimapViewport');
    els.assistantPanel = document.getElementById('v2AssistantPanel');
    els.assistantRail = document.getElementById('v2AssistantRail');
    const versionEl = document.getElementById('v2Version');
    if (versionEl) versionEl.textContent = 'v' + APP_VERSION + CHANNEL_LABEL;
    installAppLogBridge();
    bindEvents();
    loadAssetFolders();
    setupCanvasNodeDragForAssets();
    if (els.assetSearch) {
      els.assetSearch.addEventListener('input', () => renderAssetGrid());
    }
    // 虚拟化 HUD（按 ? 键切换）
    setupVirtHud();
    loadWorkspace().then(() => {
      if (!state.nodes.length) {
        addNode('text', { x: 120, y: 120, title: '反推 1' });
        addNode('generate', { x: 520, y: 120, title: '生图 1' });
      } else {
        render();
      }
      fitView(false);
      // fitView 触发 applyTransform → scheduleVirtualization，
      // 但首次 RAF 在低优先级调度，可能被 layout/pass 推迟。
      // 强制 setTimeout 50ms 后再调一次，确保虚拟化生效。
      setTimeout(() => invalidateVirtualization(), 50);
      setTimeout(() => invalidateVirtualization(), 300);
    });
  }

  function bindEvents() {
    els.canvas.addEventListener('mousedown', onCanvasMouseDown);
    els.canvas.addEventListener('selectstart', onAppSelectStart);
    els.canvas.addEventListener('dblclick', onCanvasDoubleClick);
    els.canvas.addEventListener('contextmenu', onCanvasContextMenu);
    els.contextMenu?.querySelectorAll('[data-add-node]').forEach(btn => {
      btn.addEventListener('mousedown', e => e.stopPropagation());
      btn.addEventListener('click', e => {
        e.stopPropagation();
        addNodeFromContext(btn.dataset.addNode);
      });
    });
    document.addEventListener('mousedown', onDocumentMouseDown);
    window.addEventListener('error', event => {
      recordAppLog('error', {
        source: 'runtime',
        title: '全局 JS 异常',
        summary: event.message || '未知脚本错误',
        detail: `${event.filename || ''}:${event.lineno || 0}:${event.colno || 0}\n${event.error?.stack || ''}`
      });
    });
    window.addEventListener('unhandledrejection', event => {
      const reason = event.reason;
      recordAppLog('error', {
        source: 'runtime',
        title: '未处理 Promise 异常',
        summary: getErrMsg(reason),
        detail: reason?.stack || reason?.message || String(reason || '')
      });
    });
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    window.addEventListener('blur', clearPointerInteractionState);
    window.addEventListener('pointercancel', clearPointerInteractionState);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) clearPointerInteractionState();
    });
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('wheel', onWheel, { passive: false, capture: true });
    window.addEventListener('dragenter', onDocumentDragOver, { passive: false, capture: true });
    window.addEventListener('dragover', onDocumentDragOver, { passive: false, capture: true });
    window.addEventListener('drop', onDropImages, { passive: false, capture: true });
    document.addEventListener('paste', onPasteImages, { capture: true });
    bindTauriFileDrop();
    bindTauriCloseGuard();
    window.addEventListener('gesturestart', onGestureStart, { passive: false, capture: true });
    window.addEventListener('gesturechange', onGestureChange, { passive: false, capture: true });
    window.addEventListener('gestureend', onGestureEnd, { passive: false, capture: true });
    els.previewModal?.addEventListener('click', onPreviewModalClick);
    els.previewModal?.addEventListener('wheel', onPreviewWheel, { passive: false, capture: true });
    els.previewImg?.addEventListener('dblclick', e => {
      e.preventDefault();
      e.stopPropagation();
      resetPreviewZoom();
    });
    els.previewModal?.querySelector('[data-v2-preview-close]')?.addEventListener('click', hidePreviewModal);
    els.previewDownload?.addEventListener('click', e => {
      e.stopPropagation();
      if (state.previewNodeId) downloadOutput(state.previewNodeId);
    });
    els.previewPrev?.addEventListener('click', e => {
      e.stopPropagation();
      stepPreviewVersion(-1);
    });
    els.previewNext?.addEventListener('click', e => {
      e.stopPropagation();
      stepPreviewVersion(1);
    });
    els.closeGuardWait?.addEventListener('click', () => resolveCloseGuardDialog(false));
    els.closeGuardClose?.addEventListener('click', () => resolveCloseGuardDialog(true));
    els.closeGuardModal?.addEventListener('click', e => {
      if (e.target === els.closeGuardModal) resolveCloseGuardDialog(false);
    });
    document.addEventListener('keydown', e => {
      if (els.closeGuardModal?.classList.contains('show') && e.key === 'Escape') {
        e.preventDefault();
        resolveCloseGuardDialog(false);
        return;
      }
      if (!els.previewModal?.classList.contains('show')) return;
      if (e.key === 'ArrowLeft') { e.preventDefault(); stepPreviewVersion(-1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); stepPreviewVersion(1); }
      else if (e.key === 'Escape') { e.preventDefault(); hidePreviewModal(); }
    });
    els.regionModal?.addEventListener('click', onRegionModalClick);
    els.regionStage?.addEventListener('mousedown', onRegionStageMouseDown);
    els.regionSave?.addEventListener('click', saveRegionSelection);
    els.minimap?.addEventListener('mousedown', onMinimapMouseDown);
    els.assistantRail?.addEventListener('click', e => {
      e.stopPropagation();
      toggleAssistantPanel();
    });
    window.addEventListener('resize', hideMentionMenu);
    renderPromptLibrary();
  }

  // ==========================================================================
  // SECTION: 04 UTIL
  // ==========================================================================
  function uid(prefix = 'n') {
    return prefix + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
  }

  function escHtml(str) {
    return String(str || '').replace(/[&<>'"]/g, ch => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[ch]));
  }

  function sanitizeLogValue(value) {
    let text = typeof value === 'string' ? value : JSON.stringify(value, (key, val) => {
      if (/api.?key|authorization|token|secret|password/i.test(key)) return '[REDACTED]';
      if (typeof val === 'string' && val.startsWith('data:image/')) return `[REDACTED_IMAGE:${val.length}]`;
      return val;
    }, 2);
    text = String(text || '');
    text = text.replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, 'Bearer [REDACTED]');
    text = text.replace(/(api[_-]?key["'\s:=]+)[^"',\s}]+/gi, '$1[REDACTED]');
    text = text.replace(/data:image\/[^;,]+;base64,[A-Za-z0-9+/=]+/gi, match => `[REDACTED_IMAGE:${match.length}]`);
    return text;
  }

  function corsHintForLog(text) {
    return /cors|cross.?origin|failed to fetch|networkerror|preflight|load failed|fetch/i.test(String(text || ''))
      ? 'CORS/预检排查：中转站需要放行 Origin: tauri://localhost、http://localhost:4174、http://localhost:4175，并允许 OPTIONS、Authorization、Content-Type。'
      : '';
  }

  function normalizeAppLog(level, entry = {}) {
    const summary = sanitizeLogValue(entry.summary || entry.message || entry.title || '');
    const detail = sanitizeLogValue(entry.detail || '');
    const hint = corsHintForLog(`${summary}\n${detail}`);
    return {
      id: uid('log'),
      time: Date.now(),
      level: ['error', 'warn', 'info'].includes(level) ? level : 'info',
      source: sanitizeLogValue(entry.source || 'app').slice(0, 80),
      title: sanitizeLogValue(entry.title || summary || '日志').slice(0, 160),
      summary,
      detail: [detail, hint].filter(Boolean).join('\n\n'),
      env: isTauriRuntime() ? 'tauri' : 'browser',
      nodeId: entry.nodeId || '',
      nodeType: entry.nodeType || '',
      nodeTitle: sanitizeLogValue(entry.nodeTitle || '').slice(0, 120)
    };
  }

  function recordAppLog(level, entry = {}) {
    const log = normalizeAppLog(level, entry);
    state.appLogs = [log, ...(state.appLogs || [])].slice(0, 300);
    renderAppLogPanel();
    return log;
  }

  function installAppLogBridge() {
    window.AICanvasLog = {
      record(level, entry) {
        return recordAppLog(level, entry || {});
      }
    };
  }

  function formatLogTime(time) {
    return new Date(Number(time) || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  function renderAppLogPanel() {
    if (!els.logPanel) return;
    els.logPanel.classList.toggle('show', Boolean(state.appLogOpen));
    const logs = state.appLogs || [];
    const errorCount = logs.filter(item => item.level === 'error').length;
    if (els.logSummary) {
      const latest = logs[0] ? ` · 最近 ${formatLogTime(logs[0].time)}` : '';
      els.logSummary.textContent = `${logs.length} 条记录 · ${errorCount} 个错误${latest}`;
    }
    if (!els.logList) return;
    if (!logs.length) {
      els.logList.innerHTML = '<div class="v2-log-empty">暂无日志</div>';
      return;
    }
    els.logList.innerHTML = logs.map(log => {
      const node = log.nodeId ? getNode(log.nodeId) : null;
      const nodeLabel = log.nodeTitle || node?.title || node?.alias || '';
      return `
      <article class="v2-log-item ${escHtml(log.level)} ${log.nodeId ? 'has-node' : ''}" ${log.nodeId ? `data-log-node-id="${escHtml(log.nodeId)}"` : ''}>
        <div class="v2-log-meta">
          <span>${escHtml(formatLogTime(log.time))} · ${escHtml(log.level.toUpperCase())} · ${escHtml(log.source)}</span>
          <span>${escHtml(log.env)}${log.nodeType ? ' · ' + escHtml(log.nodeType) : ''}</span>
        </div>
        <div class="v2-log-heading">
          <span>${escHtml(log.title)}</span>
          ${log.nodeId ? `<button type="button" class="v2-log-locate" data-log-locate="${escHtml(log.nodeId)}" title="定位并高亮对应节点">定位节点</button>` : ''}
        </div>
        ${log.nodeId ? `<div class="v2-log-node">节点：${escHtml(nodeLabel || log.nodeId)}${node ? '' : '（已删除）'}</div>` : ''}
        ${log.summary ? `<div class="v2-log-summary">${escHtml(log.summary)}</div>` : ''}
        ${log.detail ? `<details class="v2-log-detail"><summary>详情</summary>${escHtml(log.detail)}</details>` : ''}
      </article>
    `;
    }).join('');
    els.logList.querySelectorAll('[data-log-node-id]').forEach(item => {
      item.addEventListener('click', event => {
        if (event.target.closest('details')) return;
        focusNodeFromLog(item.dataset.logNodeId);
      });
    });
    els.logList.querySelectorAll('[data-log-locate]').forEach(btn => {
      btn.addEventListener('click', event => {
        event.stopPropagation();
        focusNodeFromLog(btn.dataset.logLocate);
      });
    });
  }

  function focusNodeFromLog(nodeId) {
    const node = getNode(nodeId);
    if (!node) {
      toast('对应节点不存在或已删除', 'error');
      return;
    }
    focusNodeById(node.id, { toast: true, save: false });
  }

  function toggleAppLogPanel(force) {
    state.appLogOpen = typeof force === 'boolean' ? force : !state.appLogOpen;
    renderAppLogPanel();
  }

  // ============ 回收站面板 ============
  function toggleTrashPanel(force) {
    state.trashOpen = typeof force === 'boolean' ? force : !state.trashOpen;
    renderTrashPanel();
  }

  function renderTrashPanel() {
    const panel = document.getElementById('v2TrashPanel');
    const list = document.getElementById('v2TrashList');
    const summary = document.getElementById('v2TrashSummary');
    if (!panel) return;
    panel.classList.toggle('show', state.trashOpen);
    if (!state.trashOpen) return;
    const trash = state.trash || [];
    summary.textContent = trash.length + ' 个节点';
    if (!trash.length) {
      list.innerHTML = '<div class="v2-trash-empty">回收站为空</div>';
      return;
    }
    const typeLabel = { generate: '生图', image: '本地图', sketch: '分层', text: '反推', detail: '产品资料', cinema: '电影', tryOn: '换装', detailPage: '详情页' };
    list.innerHTML = trash.map(node => {
      const thumb = node.image || node.output || node.sketch?.image || '';
      const label = typeLabel[node.type] || node.type || '未知';
      const name = node.title || node.alias || node.id.slice(-6);
      return `
        <div class="v2-trash-item">
          ${thumb ? `<img class="v2-trash-item-thumb" src="${thumb}" alt="">` : '<div class="v2-trash-item-thumb"></div>'}
          <div class="v2-trash-item-info">
            <div class="v2-trash-item-name">${escHtml(name)}</div>
            <div class="v2-trash-item-type">${label}</div>
          </div>
          <div class="v2-trash-item-actions">
            <button class="v2-trash-restore-btn" data-restore-trash="${node.id}">恢复</button>
          </div>
        </div>
      `;
    }).join('');
    list.querySelectorAll('[data-restore-trash]').forEach(btn => {
      btn.addEventListener('click', () => restoreFromTrash(btn.dataset.restoreTrash));
    });
  }

  function clearAppLogs() {
    state.appLogs = [];
    renderAppLogPanel();
    toast('日志已清空', 'success');
  }

  async function copyAppLogs() {
    const logs = (state.appLogs || []).map(log => [
      `[${new Date(log.time).toISOString()}] ${log.level.toUpperCase()} ${log.source} ${log.title}`,
      log.summary,
      log.detail
    ].filter(Boolean).join('\n')).join('\n\n---\n\n');
    if (!logs) {
      toast('暂无日志可复制', 'error');
      return;
    }
    try {
      await navigator.clipboard.writeText(logs);
      toast('日志已复制', 'success');
    } catch (err) {
      recordAppLog('error', { source: 'log', title: '复制日志失败', summary: getErrMsg(err), detail: err?.stack || '' });
      toast('复制失败：' + getErrMsg(err), 'error');
    }
  }

  function screenToWorld(x, y) {
    const rect = els.canvas.getBoundingClientRect();
    return {
      x: (x - rect.left - state.panX) / state.zoom,
      y: (y - rect.top - state.panY) / state.zoom
    };
  }

  function worldToScreen(x, y) {
    return {
      x: x * state.zoom + state.panX,
      y: y * state.zoom + state.panY
    };
  }

  function applyTransform(options = {}) {
    const minimapMode = options.minimap || 'viewport';
    const transform = `translate(${state.panX}px, ${state.panY}px) scale(${state.zoom})`;
    if (transform !== _viewportTransformCache) {
      els.world.style.transform = transform;
      els.connections.style.transform = transform;
      _viewportTransformCache = transform;
    }
    updateGrid();
    if (minimapMode === 'full') renderMinimap();
    else if (minimapMode === 'viewport') scheduleMinimapFrame();
    // 触发节点虚拟化（视口变化时更新可见性）
    scheduleVirtualization();
  }

  // ==========================================================================
  // SECTION: 04b VIRTUALIZATION
  // 节点视口虚拟化：>200 节点时启用，只渲染视口内 + 缓冲区节点
  // 触发：applyTransform / addNode / removeNode / pan / zoom
  // 排除：拖拽中、选中、搜索命中、MiniMap、连线
  // ==========================================================================
  const VIRT_BUDGET = 100;          // 节点数 > 100 才启用虚拟化（调小：100 节点就开始优化）
  const VIRT_PADDING = 120;         // 视口外扩像素（避免边缘闪烁）
  const VIRT_NODE_HEIGHT_EST = 220; // 节点平均高度估算
  const VIRT_STATE = {
    enabled: false,                 // 是否启用虚拟化
    visible: new Set(),             // 当前可见节点 id
    liteIds: new Set(),             // 当前 lite 节点 id（远视时简化渲染）
    raf: null,                      // 调度中的 requestAnimationFrame
    lastSig: ''                     // 上次计算的签名（视口+节点数）
  };

  function scheduleVirtualization() {
    if (VIRT_STATE.raf) return;
    VIRT_STATE.raf = requestAnimationFrame(() => {
      VIRT_STATE.raf = null;
      try { applyVirtualization(); } catch(e) { /* 静默 */ }
    });
  }

  function getViewportWorldRect() {
    // 屏幕视口 → 世界坐标矩形
    const rect = els.canvas.getBoundingClientRect();
    const tl = screenToWorld(rect.left - VIRT_PADDING, rect.top - VIRT_PADDING);
    const br = screenToWorld(rect.right + VIRT_PADDING, rect.bottom + VIRT_PADDING);
    return { x1: tl.x, y1: tl.y, x2: br.x, y2: br.y };
  }

  function nodeIntersectsViewport(node, vp) {
    // 节点世界坐标 bbox 与视口世界坐标矩形相交判定
    if (node.x > vp.x2 || (node.x + NODE_W) < vp.x1) return false;
    // 高度未知时用 VIRT_NODE_HEIGHT_EST 兜底
    const h = (typeof node.__h === 'number' && node.__h > 0) ? node.__h : VIRT_NODE_HEIGHT_EST;
    if (node.y > vp.y2 || (node.y + h) < vp.y1) return false;
    return true;
  }

  function isNodeAlwaysVisible(id) {
    // 拖拽中 / 选中 / 搜索命中 → 永远可见
    if (state.drag && state.drag.ids && state.drag.ids.includes(id)) return true;
    if (state.groupDrag && state.groupDrag.nodes && state.groupDrag.nodes.some(n => n.id === id)) return true;
    if (isNodeSelected(id)) return true;
    if (state.searchVisibleIds && state.searchVisibleIds.has(id)) return true;
    return false;
  }

  function applyVirtualization() {
    // 节点数 < 100 → 不启用
    if (!state.nodes || state.nodes.length < VIRT_BUDGET) {
      if (VIRT_STATE.enabled) {
        VIRT_STATE.enabled = false;
        els.world.querySelectorAll('.v2-node[data-virt="hidden"]').forEach(el => {
          el.removeAttribute('data-virt');
        });
        // 取消所有 lite 节点
        els.world.querySelectorAll('.v2-node.lite').forEach(el => {
          el.classList.remove('lite');
        });
        VIRT_STATE.visible.clear();
        VIRT_STATE.liteIds.clear();
      }
      return;
    }
    VIRT_STATE.enabled = true;
    let vp;
    try { vp = getViewportWorldRect(); }
    catch(e) { return; }
    const next = new Set();
    const nextLite = new Set();
    const isFarZoom = (typeof state.zoom === 'number') && state.zoom < 0.4;
    try {
      const all = state.nodes;
      for (let i = 0; i < all.length; i++) {
        const node = all[i];
        if (isNodeAlwaysVisible(node.id)) { next.add(node.id); continue; }
        if (nodeIntersectsViewport(node, vp)) {
          next.add(node.id);
          // LOD：远视 + 视口内 + 非选中 → lite
          if (isFarZoom && !isNodeSelected(node.id)) {
            nextLite.add(node.id);
          }
        }
      }
    } catch(e) { return; }
    // 签名（避免无意义重算）— 首次执行（lastSig 为空）必须跑
    const sig = `${vp.x1.toFixed(0)},${vp.y1.toFixed(0)},${vp.x2.toFixed(0)},${vp.y2.toFixed(0)}|${state.nodes.length}|${isFarZoom ? 'far' : 'near'}`;
    if (sig === VIRT_STATE.lastSig && VIRT_STATE.lastSig !== '') return;
    VIRT_STATE.lastSig = sig;
    // 增量 DOM 更新：只动差异节点
    const prev = VIRT_STATE.visible;
    const prevLite = VIRT_STATE.liteIds;
    const isFirstRun = prev.size === 0;
    if (isFirstRun) {
      // 首次：分批 hidden 视口外节点（避免长任务阻塞）
      const toShow = [];
      const toHide = [];
      els.world.querySelectorAll('.v2-node').forEach(el => {
        if (next.has(el.dataset.id)) toShow.push(el);
        else toHide.push(el);
      });
      // 分批写入（每批 200 个，setTimeout 16ms yield）
      let i = 0;
      const BATCH = 200;
      const processHide = () => {
        const end = Math.min(i + BATCH, toHide.length);
        for (; i < end; i++) toHide[i].setAttribute('data-virt', 'hidden');
        if (i < toHide.length) {
          setTimeout(processHide, 0);
        } else {
          // hide 完成后 show
          let j = 0;
          const processShow = () => {
            const end2 = Math.min(j + BATCH, toShow.length);
            for (; j < end2; j++) toShow[j].removeAttribute('data-virt');
            if (j < toShow.length) setTimeout(processShow, 0);
          };
          if (toShow.length) setTimeout(processShow, 0);
        }
      };
      if (toHide.length) processHide();
      else {
        // 全部可见（不太可能，但兜底）
        let j = 0;
        const processShow = () => {
          const end2 = Math.min(j + BATCH, toShow.length);
          for (; j < end2; j++) toShow[j].removeAttribute('data-virt');
          if (j < toShow.length) setTimeout(processShow, 0);
        };
        if (toShow.length) setTimeout(processShow, 0);
      }
      // 首次：标记 lite
      nextLite.forEach(id => {
        const el = els.world.querySelector(`.v2-node[data-id="${cssEscape(id)}"]`);
        if (el) el.classList.add('lite');
      });
    } else {
      // 增量：之前可见现在不可见 → hidden
      const toHide = [];
      prev.forEach(id => {
        if (!next.has(id)) {
          const el = getNodeElement(id);
          if (el) toHide.push(el);
        }
      });
      const toShow = [];
      next.forEach(id => {
        if (!prev.has(id)) {
          const el = getNodeElement(id);
          if (el) toShow.push(el);
        }
      });
      toHide.forEach(e => e.setAttribute('data-virt', 'hidden'));
      // 用 setTimeout 避免阻塞（setTimeout 在后台 tab 仍工作，rAF 会被节流）
      if (toShow.length) setTimeout(() => toShow.forEach(e => e.removeAttribute('data-virt')), 0);
      // 增量更新 lite
      nextLite.forEach(id => {
        if (!prevLite.has(id)) {
          const el = getNodeElement(id);
          if (el) el.classList.add('lite');
        }
      });
      prevLite.forEach(id => {
        if (!nextLite.has(id)) {
          const el = getNodeElement(id);
          if (el) el.classList.remove('lite');
        }
      });
    }
    VIRT_STATE.visible = next;
    VIRT_STATE.liteIds = nextLite;
  }

  function invalidateVirtualization() {
    VIRT_STATE.lastSig = '';
    scheduleVirtualization();
  }

  // ===== 虚拟化 HUD（按 ? 键切换）=====
  let _virtHudEl = null;
  let _virtHudVisible = false;
  let _virtHudRaf = null;
  function setupVirtHud() {
    _virtHudEl = document.createElement('div');
    _virtHudEl.className = 'v2-virt-hud';
    _virtHudEl.style.display = 'none';
    _virtHudEl.textContent = 'VIRT: 0/0';
    document.body.appendChild(_virtHudEl);
    document.addEventListener('keydown', (e) => {
      // ? 键（无需 shift，单纯问号）
      if (e.key === '?' && !e.target?.closest?.('textarea,input,select')) {
        _virtHudVisible = !_virtHudVisible;
        _virtHudEl.style.display = _virtHudVisible ? 'block' : 'none';
        if (_virtHudVisible) startVirtHudLoop();
      }
    });
  }
  function startVirtHudLoop() {
    if (_virtHudRaf) return;
    const tick = () => {
      _virtHudRaf = null;
      if (!_virtHudVisible || !_virtHudEl) return;
      const total = state.nodes?.length || 0;
      const visible = VIRT_STATE.visible?.size || 0;
      const hidden = total - visible;
      const fps = measureVirtFps();
      _virtHudEl.textContent = `VIRT: 可见 ${visible} / 总 ${total}  隐藏 ${hidden}  FPS ${fps}  ${VIRT_STATE.enabled ? 'ON' : 'OFF'}`;
      _virtHudRaf = requestAnimationFrame(tick);
    };
    _virtHudRaf = requestAnimationFrame(tick);
  }
  // FPS 测量
  let _virtFpsLast = performance.now();
  let _virtFpsCount = 0;
  let _virtFpsValue = 60;
  function measureVirtFps() {
    _virtFpsCount++;
    const now = performance.now();
    if (now - _virtFpsLast >= 1000) {
      _virtFpsValue = Math.round(_virtFpsCount * 1000 / (now - _virtFpsLast));
      _virtFpsCount = 0;
      _virtFpsLast = now;
    }
    return _virtFpsValue;
  }

  function updateGrid() {
    if (!els.grid) return;
    const base = 42 * state.zoom;
    const gridSize = Math.max(14, base);
    const x = ((state.panX % gridSize) + gridSize) % gridSize;
    const y = ((state.panY % gridSize) + gridSize) % gridSize;
    const size = `${gridSize}px ${gridSize}px`;
    const position = `${x}px ${y}px`;
    if (size !== _gridSizeCache) {
      els.grid.style.backgroundSize = size;
      _gridSizeCache = size;
    }
    if (position !== _gridPositionCache) {
      els.grid.style.backgroundPosition = position;
      _gridPositionCache = position;
    }
  }

  function getNode(id) {
    if (!id) return null;
    if (_nodeByIdSource !== state.nodes || _nodeByIdLength !== state.nodes.length) {
      rebuildNodeByIdCache();
    }
    return _nodeByIdCache.get(id) || null;
  }

  function rebuildNodeByIdCache() {
    _nodeByIdCache = new Map(state.nodes.map(node => [node.id, node]));
    _nodeByIdSource = state.nodes;
    _nodeByIdLength = state.nodes.length;
  }

  function invalidateNodeByIdCache() {
    _nodeByIdSource = null;
    _nodeByIdLength = -1;
    _nodeByIdCache = new Map();
  }

  function nextAlias() {
    let max = 0;
    state.nodes.forEach(node => {
      if (node.type !== 'image' && node.type !== 'sketch') return;
      const match = String(node.alias || '').match(/^图(\d+)$/);
      if (match) max = Math.max(max, Number(match[1]));
    });
    return '图' + (max + 1);
  }

  // ==========================================================================
  // SECTION: 05 SKETCH-STATE
  // ==========================================================================
  function createDefaultSketchState(opts = {}) {
    const mappings = Array.isArray(opts.mappings) && opts.mappings.length
      ? opts.mappings
      : DEFAULT_SKETCH_MAPPINGS;
    const hasSegmentation = Boolean(Number(opts.segmentedAt) || (Array.isArray(opts.segmentationElements) && opts.segmentationElements.length));
    return {
      image: opts.image || '',
      sourceImage: opts.sourceImage || opts.image || '',
      aspectRatio: normalizeAspectRatio(opts.aspectRatio) || 1,
      sourceAspectRatio: normalizeAspectRatio(opts.sourceAspectRatio) || normalizeAspectRatio(opts.aspectRatio) || 1,
      activeColor: normalizeSketchColor(opts.activeColor) || DEFAULT_SKETCH_MAPPINGS[0].color,
      brushSize: Math.max(2, Math.min(80, Number(opts.brushSize) || 18)),
      mode: ['view', 'brush', 'eraser'].includes(opts.mode) ? opts.mode : 'view',
      segmentationSource: ['source', 'upstream'].includes(opts.segmentationSource) ? opts.segmentationSource : 'auto',
      segmentationStatus: opts.segmentationStatus || '',
      segmentationRunId: String(opts.segmentationRunId || ''),
      segmentationElements: Array.isArray(opts.segmentationElements) ? opts.segmentationElements : [],
      subjectPreserve: opts.subjectPreserve !== false,
      preservedSubjectHint: String(opts.preservedSubjectHint || '').trim(),
      segmentedAt: Number(opts.segmentedAt) || 0,
      mappings: mappings.map((item, index) => ({
        id: item.id || uid('sketch_map'),
        color: normalizeSketchColor(item.color) || DEFAULT_SKETCH_MAPPINGS[index % DEFAULT_SKETCH_MAPPINGS.length].color,
        label: String(item.label || DEFAULT_SKETCH_MAPPINGS[index % DEFAULT_SKETCH_MAPPINGS.length].label || '颜色').trim(),
        target: normalizeSketchMappingTarget(item, hasSegmentation),
        element: normalizeSketchMappingTarget({ ...item, target: item.element || item.target }, hasSegmentation)
      }))
    };
  }

  function normalizeSketchMappingTarget(item = {}, keepLegacyDefault = false) {
    const color = normalizeSketchColor(item.color);
    const target = String(item.target || '').trim();
    if (!target) return '';
    if (!keepLegacyDefault && color && LEGACY_SKETCH_DEFAULT_TARGETS.get(color) === target) return '';
    return target;
  }

  function normalizeSketchState(sketch = {}) {
    return createDefaultSketchState(sketch && typeof sketch === 'object' ? sketch : {});
  }

  function normalizeSketchColor(value) {
    const color = String(value || '').trim();
    return /^#[0-9a-f]{6}$/i.test(color) ? color.toLowerCase() : '';
  }

  function getSketchState(node) {
    if (!node) return createDefaultSketchState();
    node.sketch = normalizeSketchState(node.sketch || {
      image: node.image || '',
      aspectRatio: node.aspectRatio || 1
    });
    return node.sketch;
  }

  function getSketchImage(node) {
    return getSketchState(node).image || node?.image || '';
  }

  function getSketchSourceImage(node) {
    return getSketchState(node).sourceImage || '';
  }

  function makeSketchMapping(element = {}, index = 0) {
    const colorItem = SKETCH_SEGMENTATION_COLORS[index % SKETCH_SEGMENTATION_COLORS.length];
    const name = String(element.name || element.element || element.target || '').trim() || `元素${index + 1}`;
    const layer = String(element.layer || '').trim();
    const label = layer && !name.includes(layer) ? `${layer}${name}` : name;
    return {
      id: uid('sketch_map'),
      color: normalizeSketchColor(element.color) || colorItem.color,
      label,
      target: String(element.target || label).trim(),
      element: label
    };
  }

  function sketchMappingsSummary(node) {
    const sketch = getSketchState(node);
    const summary = sketch.mappings
      .filter(item => item.color)
      .map(item => `${item.label || item.color}=${item.target || '自动识别元素'}`)
      .join('、');
    if (sketch.segmentedAt && summary) return `自动分层 + ${summary}`;
    if (!summary && sketch.sourceImage) return '已保存底图，可 AI 分层';
    return summary;
  }

  function sketchPromptText(node) {
    const sketch = getSketchState(node);
    const mappings = sketch.mappings
      .filter(item => item.color)
      .map(item => `${item.label || item.color}(${item.color}) ${item.target ? `替换为 ${item.target}` : '等待自动分层识别元素'}`)
      .join('；');
    return [
      `分层渲染来源：@${node.alias || node.title || '分层渲染'}`,
      sketch.subjectPreserve !== false ? '主体保留：自动识别到的主要产品/人物/主体必须保留外观、比例、结构、品牌/标识和标签位置。' : '',
      mappings ? `自动分层映射：${mappings}` : '自动分层映射：尚未运行 AI 分层，按导入图作为粗略构图参考。',
      '分层颜色区域只控制环境元素、道具、前后层次和构图位置；最终图不要保留纯色块、黑色手绘线、白底草图感或低保真涂鸦质感，必须把分层色块渲染成真实元素。'
    ].join('\n');
  }

  // ==========================================================================
  // SECTION: 06 NODE-CRUD
  // ==========================================================================
  function addNode(type, opts = {}) {
    // 硬性上限：防止 addNode 死循环 / 调试脚本堆积导致卡死
    const HARD_LIMIT = 2000;
    if (state.nodes.length >= HARD_LIMIT) {
      console.warn(`[addNode] 已达硬性上限 ${HARD_LIMIT}，拒绝添加。请先清空画布。`);
      return null;
    }
    const node = createNodeObject(type, opts);
    state.nodes.push(node);
    assignNewNodeToContainingGroup(node);
    state.selectedId = node.id;
    render();
    invalidateVirtualization();
    scheduleSaveWorkspace();
    return node;
  }

  function createNodeObject(type, opts = {}) {
    return {
      id: uid(type),
      type,
      x: Number.isFinite(opts.x) ? Math.round(opts.x) : 140 + state.nodes.length * 80,
      y: Number.isFinite(opts.y) ? Math.round(opts.y) : 140 + state.nodes.length * 48,
      title: opts.title || defaultTitle(type),
      status: 'idle',
      error: '',
      debug: '',
      image: opts.image || '',
      aspectRatio: opts.aspectRatio || 4 / 3,
      imageWidth: Number.isFinite(opts.imageWidth) ? Math.round(opts.imageWidth) : 0,
      imageHeight: Number.isFinite(opts.imageHeight) ? Math.round(opts.imageHeight) : 0,
      displayWidth: Number.isFinite(opts.displayWidth) ? Math.round(opts.displayWidth) : 0,
      displayHeight: Number.isFinite(opts.displayHeight) ? Math.round(opts.displayHeight) : 0,
      alias: opts.alias || (type === 'image' || type === 'sketch' ? nextAlias() : ''),
      text: opts.text || defaultText(type),
      input: opts.input || defaultInput(type),
      sketch: type === 'sketch' ? normalizeSketchState(opts.sketch || {
        image: opts.image || '',
        sourceImage: opts.sourceImage || opts.image || '',
        aspectRatio: opts.aspectRatio || 1
      }) : null,
      detail: { ...(opts.detail || {}) },
      result: opts.result || '',
      output: opts.output || '',
      versions: Array.isArray(opts.versions) ? opts.versions : [],
      activeVersionId: typeof opts.activeVersionId === 'string' ? opts.activeVersionId : '',
      assistantSource: type === 'generate' ? normalizeGenerateAssistantSourceValue(opts.assistantSource) : null,
      messages: Array.isArray(opts.messages) ? opts.messages : [],
      draft: typeof opts.draft === 'string' ? opts.draft : '',
      adoptedPrompt: typeof opts.adoptedPrompt === 'string' ? opts.adoptedPrompt : '',
      adoptedMessageIndex: Number.isInteger(opts.adoptedMessageIndex) ? opts.adoptedMessageIndex : -1,
      settings: {
        model: type === 'text' ? getSelectedTextModel() : getSelectedImageModel(),
        size: '1024x1024',
        quality: 'high',
        format: 'png',
        background: 'auto',
        n: 1,
        referenceMode: type === 'generate' ? DEFAULT_REFERENCE_MODE : '',
        template: type === 'text' ? 'auto' : '',
        ...(opts.settings || {}),
        ...(type === 'cinema' ? { cinema: normalizeCinemaSettings(opts.settings?.cinema || opts.cinema || {}) } : {}),
        ...(type === 'tryOn' ? { tryOn: normalizeTryOnSettings(opts.settings?.tryOn || opts.tryOn || {}) } : {})
      }
    };
  }

  function defaultTitle(type) {
    if (type === 'image') return '图片';
    if (type === 'text') return '反推';
    if (type === 'detail') return '产品资料';
    if (type === 'sketch') return '分层渲染';
    if (type === 'detailPage') return '详情页';
    if (type === 'tryOn') return '换装';
    if (type === 'cinema') return '电影';
    if (type === 'generate') return '生图';
    return '节点';
  }

  function defaultText(type) {
    if (type === 'text') return '';
    if (type === 'generate') return DEFAULT_GENERATE_PROMPT;
    if (type === 'detail') return '';
    if (type === 'cinema') return '';
    return '';
  }

  function defaultInput(type) {
    if (type === 'text') return '';
    return '';
  }

  function normalizeCinemaSettings(value = {}) {
    const prompt = window.CinemaPrompt;
    const raw = value && typeof value === 'object' ? value : {};
    const normalizeMode = prompt?.normalizeMode || (mode => ['auto', 'live-action', 'anime', 'commerce'].includes(mode) ? mode : 'auto');
    const normalizeRole = prompt?.normalizeRole || (role => ['subject', 'scene', 'style', 'camera'].includes(role) ? role : 'style');
    return {
      mode: normalizeMode(raw.mode || 'auto'),
      imageRoles: Array.isArray(raw.imageRoles)
        ? raw.imageRoles.map(item => ({
          id: String(item?.id || ''),
          role: normalizeRole(item?.role || 'style')
        })).filter(item => item.id)
        : [],
      structuredFields: raw.structuredFields && typeof raw.structuredFields === 'object' ? { ...raw.structuredFields } : {},
      selfCheck: Array.isArray(raw.selfCheck) ? raw.selfCheck.map(String).filter(Boolean) : [],
      revisionSummary: String(raw.revisionSummary || ''),
      sourceVersion: String(raw.sourceVersion || CINEMA_SOURCE_VERSION),
      boundGenerateId: String(raw.boundGenerateId || ''),
      lastAppliedPrompt: String(raw.lastAppliedPrompt || ''),
      lastAppliedAt: Number(raw.lastAppliedAt) || 0,
      raw: String(raw.raw || '')
    };
  }

  function getCinemaSettings(node) {
    const raw = node?.settings?.cinema || (node?.type === 'cinema' ? node?.settings : {}) || {};
    const normalized = normalizeCinemaSettings(raw);
    if (node?.settings) node.settings.cinema = normalized;
    return normalized;
  }

  function setCinemaImageRole(nodeId, imageId, role) {
    const node = getNode(nodeId);
    if (!node || node.type !== 'cinema' || !imageId) return;
    const settings = getCinemaSettings(node);
    const normalizeRole = window.CinemaPrompt?.normalizeRole || (value => value);
    const nextRole = normalizeRole(role || 'style');
    const nextRoles = settings.imageRoles.filter(item => item.id !== imageId);
    nextRoles.push({ id: imageId, role: nextRole });
    node.settings.cinema = { ...settings, imageRoles: nextRoles };
    scheduleSaveWorkspace();
    if (els.world) render();
  }

  function inferCinemaImageRole(ref, index = 0, total = 0) {
    if (index === 0) return 'subject';
    const text = `${ref?.alias || ''} ${ref?.title || ''}`.toLowerCase();
    if (/场景|背景|scene|background|环境/.test(text)) return 'scene';
    if (/镜头|机位|构图|camera|lens/.test(text)) return 'camera';
    if (/主体|主图|人物|产品|subject/.test(text)) return 'subject';
    if (total > 2 && index === 1) return 'scene';
    return 'style';
  }

  function getCinemaImageRoles(node, refs = collectRefsForNode(node)) {
    const settings = getCinemaSettings(node);
    const explicit = new Map(settings.imageRoles.map(item => [item.id, item.role]));
    return (refs.images || []).map((ref, index) => ({
      id: ref.id,
      alias: ref.alias || ref.title || `图${index + 1}`,
      role: explicit.get(ref.id) || inferCinemaImageRole(ref, index, refs.images.length)
    }));
  }

  function getCinemaBoundGenerate(node) {
    if (!node || node.type !== 'cinema') return null;
    const settings = getCinemaSettings(node);
    const bound = getNode(settings.boundGenerateId);
    if (bound?.type === 'generate') return bound;
    const direct = state.connections
      .filter(conn => conn.from === node.id)
      .map(conn => getNode(conn.to))
      .find(target => target?.type === 'generate');
    if (direct) {
      node.settings.cinema = { ...settings, boundGenerateId: direct.id };
      return direct;
    }
    return null;
  }

  function getCinemaBoundGenerateSummary(node) {
    const bound = getCinemaBoundGenerate(node);
    if (!bound) return '未绑定生图';
    const versions = normalizeGenerateVersions(bound);
    const active = getActiveGenerateVersion(bound);
    const label = active?.label ? ` · ${active.label}/${versions.length}` : '';
    return `已绑定 ${bound.title || '电影生图'}${label}`;
  }

  function normalizeTryOnSettings(value = {}) {
    const raw = value && typeof value === 'object' ? value : {};
    return {
      garmentSourceId: String(raw.garmentSourceId || ''),
      modelSourceId: String(raw.modelSourceId || ''),
      backgroundReferenceIds: Array.isArray(raw.backgroundReferenceIds || raw.styleReferenceIds)
        ? uniqueIds((raw.backgroundReferenceIds || raw.styleReferenceIds).map(id => String(id || '').trim()).filter(Boolean)).slice(0, 4)
        : [],
      garmentGenerateId: String(raw.garmentGenerateId || ''),
      tryOnGenerateId: String(raw.tryOnGenerateId || ''),
      poseChangeEnabled: Boolean(raw.poseChangeEnabled),
      poseVariantCount: Math.min(4, Math.max(1, Math.round(Number(raw.poseVariantCount) || 1))),
      poseGenerateIds: Array.isArray(raw.poseGenerateIds)
        ? uniqueIds(raw.poseGenerateIds.map(id => String(id || '').trim()).filter(Boolean)).slice(0, 4)
        : [],
      poseGroupId: String(raw.poseGroupId || ''),
      modelRegion: raw.modelRegion && typeof raw.modelRegion === 'object'
        ? {
          enabled: Boolean(raw.modelRegion.enabled),
          sourceId: String(raw.modelRegion.sourceId || ''),
          sourceAlias: String(raw.modelRegion.sourceAlias || ''),
          rect: normalizeRegionRect(raw.modelRegion.rect)
        }
        : { enabled: false, sourceId: '', sourceAlias: '', rect: null }
    };
  }

  function getTryOnSettings(node) {
    const normalized = normalizeTryOnSettings(node?.settings?.tryOn || {});
    if (node?.settings) node.settings.tryOn = normalized;
    return normalized;
  }

  async function onDropImages(e) {
    if (!isCanvasEvent(e)) return;
    const libraryId = e.dataTransfer?.getData('application/x-v2-library');
    if (libraryId) {
      e.preventDefault();
      e.stopPropagation();
      hideContextMenu();
      await createNodesFromPromptLibraryItem(libraryId, eventToWorldPoint(e));
      return;
    }
    const files = getImageFilesFromTransfer(e.dataTransfer);
    if (files.length && e.target?.closest?.('[data-sketch-drop]')) return;
    e.preventDefault();
    e.stopPropagation();
    if (!files.length && isInternalScrollTarget(e.target)) return;
    if (!files.length) {
      toast('没有读取到图片文件，请确认拖入的是图片文件', 'error');
      return;
    }
    hideContextMenu();
    const base = eventToWorldPoint(e);
    await importImageFiles(files, base, '已拖入图片');
  }

  function onDocumentDragOver(e) {
    if (!isCanvasEvent(e)) return;
    if (getImageFilesFromTransfer(e.dataTransfer).length && e.target?.closest?.('[data-sketch-drop]')) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) e.dataTransfer.dropEffect = e.dataTransfer.types?.includes('application/x-v2-library') ? 'move' : 'copy';
  }

  async function onPasteImages(e) {
    const files = getImageFilesFromTransfer(e.clipboardData);
    if (!files.length) return;
    if (!isCanvasEvent(e)) return;
    e.preventDefault();
    e.stopPropagation();
    hideContextMenu();
    await importImageFiles(files, getPasteWorldPoint(), '已粘贴图片', { source: 'paste' });
  }

  async function importImageFiles(files, base, successText = '已导入图片', opts = {}) {
    const images = [];
    try {
      for (const file of files) {
        images.push(await fileToReferenceImageInfo(file));
      }
    } catch (err) {
      toast(getErrMsg(err), 'error');
      return;
    }
    importImageInfos(images, base, successText, opts);
  }

  function importImageInfos(images, base, successText = '已导入图片', opts = {}) {
    const source = opts.source || 'import';
    const created = [];
    const rowHeights = [];
    const rowOffsets = [];
    images.forEach((image, index) => {
      const display = getImportedImageDisplaySize(image, source);
      image.displayWidth = display.width;
      image.displayHeight = display.height;
      const row = Math.floor(index / 4);
      rowHeights[row] = Math.max(rowHeights[row] || 0, display.height || getNodeBox({ type: 'image', x: 0, y: 0 }).h);
    });
    rowHeights.forEach((height, row) => {
      rowOffsets[row] = row === 0 ? 0 : rowOffsets[row - 1] + rowHeights[row - 1] + IMAGE_GRID_ROW_GAP;
    });
    images.forEach((image, index) => {
      const row = Math.floor(index / 4);
      created.push(addNode('image', {
        image: image.dataUrl,
        aspectRatio: image.aspectRatio,
        imageWidth: image.width,
        imageHeight: image.height,
        displayWidth: image.displayWidth,
        displayHeight: image.displayHeight,
        x: base.x + (index % 4) * (IMAGE_DISPLAY_MAX_W + IMAGE_GRID_COL_GAP),
        y: base.y + (rowOffsets[row] || 0),
        title: '图片 ' + (state.nodes.filter(node => node.type === 'image').length + index + 1)
      }));
    });

    if (created.length > 1) {
      createGroup(created.map(node => node.id), '图片组');
    }
    state.selectedId = created[0]?.id || state.selectedId;
    state.selectedIds = created.map(node => node.id);
    render();
    scheduleSaveWorkspace();
    toast(`${successText} ${created.length} 张`, 'success');
  }

  async function bindTauriFileDrop() {
    if (tauriFileDropBound || !isTauriRuntime()) return;
    const listen = window.__TAURI__?.event?.listen;
    if (typeof listen !== 'function') return;
    tauriFileDropBound = true;
    try {
      await listen('tauri://drag-drop', async event => {
        const paths = Array.isArray(event?.payload?.paths) ? event.payload.paths : [];
        if (!paths.length) return;
        await importTauriImagePaths(paths, tauriDropPositionToWorld(event.payload.position));
      });
    } catch (err) {
      tauriFileDropBound = false;
      console.warn('[小马AI画布] Tauri file drop listener failed', err);
    }
  }

  async function bindTauriCloseGuard() {
    // Temporarily disabled: the JS close guard could leave the Tauri window
    // unable to close if the confirmation UI failed to appear. Close must
    // always fail open until this guard is rebuilt on the native side.
    tauriCloseGuardBound = true;
  }

  function getActiveGenerateRunSummaries() {
    return Array.from(activeGenerateRuns.entries())
      .map(([nodeId, runState]) => {
        const node = getNode(nodeId);
        if (!node || node.type !== 'generate') return null;
        const phaseText = runState?.phase === 'pending'
          ? '准备发送，仍可撤回'
          : '请求已发送，关闭后无法接回结果';
        return {
          nodeId,
          title: node.title || node.alias || '生图节点',
          phase: runState?.phase || '',
          phaseText
        };
      })
      .filter(Boolean);
  }

  async function confirmCloseDuringGenerate(running = []) {
    if (!els.closeGuardModal) {
      return window.confirm('图片还在生成中，关闭后无法接回本次结果，可能已扣费。\n\n确定仍然关闭吗？');
    }
    if (els.closeGuardList) {
      els.closeGuardList.innerHTML = running.map(item => `
        <div class="v2-close-guard-item">
          <span>${escHtml(item.title)}</span>
          <span>${escHtml(item.phaseText)}</span>
        </div>
      `).join('');
    }
    els.closeGuardModal.classList.add('show');
    els.closeGuardModal.setAttribute('aria-hidden', 'false');
    setTimeout(() => els.closeGuardWait?.focus(), 0);
    return await new Promise(resolve => {
      state.closeGuardResolver = resolve;
    });
  }

  function resolveCloseGuardDialog(shouldClose) {
    if (!state.closeGuardResolver) return;
    const resolve = state.closeGuardResolver;
    state.closeGuardResolver = null;
    els.closeGuardModal?.classList.remove('show');
    els.closeGuardModal?.setAttribute('aria-hidden', 'true');
    resolve(Boolean(shouldClose));
  }

  async function importTauriImagePaths(paths, base) {
    const imagePaths = paths.filter(isLikelyImagePath);
    if (!imagePaths.length) {
      toast('没有读取到图片文件，请确认拖入的是图片文件', 'error');
      return;
    }
    try {
      const invoke = window.__TAURI__?.core?.invoke;
      if (typeof invoke !== 'function') throw new Error('Tauri 文件读取接口不可用，请重启 App');
      const dropped = await invoke('read_image_files', { paths: imagePaths });
      const images = [];
      for (const file of dropped || []) {
        if (file?.dataUrl) images.push(await dataUrlToReferenceImageInfo(file.dataUrl));
      }
      if (!images.length) throw new Error('没有读取到图片文件，请确认拖入的是图片文件');
      importImageInfos(images, base || getPasteWorldPoint(), '已拖入图片', { source: 'drop' });
    } catch (err) {
      toast('拖入失败：' + getErrMsg(err), 'error');
    }
  }

  function isLikelyImagePath(path) {
    return /\.(png|jpe?g|webp|gif|bmp|avif)$/i.test(String(path || '').split(/[?#]/)[0]);
  }

  function tauriDropPositionToWorld(position) {
    let x = Number(position?.x);
    let y = Number(position?.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return getPasteWorldPoint();
    const scale = window.devicePixelRatio || 1;
    if (scale > 1 && (x > window.innerWidth || y > window.innerHeight)) {
      x /= scale;
      y /= scale;
    }
    return screenToWorld(x, y);
  }

  function getImageFilesFromTransfer(transfer) {
    if (!transfer) return [];
    const files = [];
    Array.from(transfer.items || []).forEach(item => {
      if (item.kind === 'file' && String(item.type || '').startsWith('image/')) {
        const file = item.getAsFile?.();
        if (file) files.push(file);
      }
    });
    if (!files.length) {
      files.push(...Array.from(transfer.files || []).filter(file => String(file.type || '').startsWith('image/')));
    }
    return files;
  }

  function eventToWorldPoint(e) {
    if (Number.isFinite(e.clientX) && Number.isFinite(e.clientY)) return screenToWorld(e.clientX, e.clientY);
    return getPasteWorldPoint();
  }

  function getPasteWorldPoint() {
    const rect = els.canvas.getBoundingClientRect();
    return screenToWorld(rect.left + rect.width / 2, rect.top + rect.height / 2);
  }

  // ==========================================================================
  // SECTION: 07 GROUP-DATA
  // ==========================================================================
  function createGroup(nodeIds, title, childGroupIds = []) {
    const group = {
      id: uid('g'),
      title: title || '图片组',
      nodeIds: uniqueIds(nodeIds),
      childGroupIds: uniqueIds(childGroupIds)
    };
    state.groups.push(group);
    updateGroupBounds(group);
    return group;
  }

  function updateGroupBounds(group) {
    normalizeGroupShape(group);
    const nodes = group.nodeIds.map(getNode).filter(Boolean);
    const childGroups = group.childGroupIds.map(id => state.groups.find(item => item.id === id)).filter(Boolean);
    if (!nodes.length && !childGroups.length) return;
    const pad = 34;
    const boxes = [
      ...nodes.map(node => getNodeBox(node)),
      ...childGroups.map(child => ({ x: child.x, y: child.y, w: child.w, h: child.h }))
    ].filter(box => Number.isFinite(box.x) && Number.isFinite(box.y) && Number.isFinite(box.w) && Number.isFinite(box.h));
    if (!boxes.length) return;
    group.x = Math.min(...boxes.map(box => box.x)) - pad;
    group.y = Math.min(...boxes.map(box => box.y)) - pad;
    group.w = Math.max(...boxes.map(box => box.x + box.w)) - group.x + pad;
    group.h = Math.max(...boxes.map(box => box.y + box.h)) - group.y + pad;
  }

  function updateAllGroupBounds() {
    // P1 优化：拖拽中只更新被拖节点所属的 group（不递归所有 group）
    if (state.drag || state.groupDrag) {
      const dirtyGroupIds = new Set();
      const visit = group => {
        if (!group || dirtyGroupIds.has(group.id)) return;
        dirtyGroupIds.add(group.id);
        group.childGroupIds.forEach(id => {
          const child = state.groups.find(item => item.id === id);
          if (child) visit(child);
        });
      };
      // 找到被拖节点所属的所有 group（向上回溯）
      const draggedNodeIds = getActiveDragIds();
      draggedNodeIds.forEach(nodeId => {
        state.groups.forEach(group => {
          if (group.nodeIds?.includes(nodeId)) visit(group);
        });
      });
      // 父 group 也要更新
      state.groups.forEach(group => {
        if (group.childGroupIds?.some(id => dirtyGroupIds.has(id))) visit(group);
      });
      dirtyGroupIds.forEach(id => {
        const g = state.groups.find(item => item.id === id);
        if (g) {
          normalizeGroupShape(g);
          updateGroupBounds(g);
        }
      });
      return;
    }
    // 非拖拽：全量更新（保持原行为）
    const visited = new Set();
    const updateOne = group => {
      if (!group || visited.has(group.id)) return;
      normalizeGroupShape(group);
      group.childGroupIds.forEach(id => updateOne(state.groups.find(item => item.id === id)));
      updateGroupBounds(group);
      visited.add(group.id);
    };
    state.groups.forEach(updateOne);
  }

  function cleanupGroups() {
    const nodeIds = new Set(state.nodes.map(node => node.id));
    const groupIds = new Set(state.groups.map(group => group.id));
    state.groups.forEach(group => {
      normalizeGroupShape(group);
      group.nodeIds = uniqueIds(group.nodeIds).filter(id => nodeIds.has(id));
      group.childGroupIds = uniqueIds(group.childGroupIds).filter(id => id !== group.id && groupIds.has(id));
    });
    state.groups = state.groups.filter(group => group.nodeIds.length > 0 || group.childGroupIds.length > 0);
    state.groups.forEach(normalizeGroupShape);
    updateAllGroupBounds();
  }

  function normalizeGroupShape(group) {
    if (!group) return null;
    group.nodeIds = uniqueIds(group.nodeIds);
    group.childGroupIds = uniqueIds(group.childGroupIds || []).filter(id => id !== group.id);
    return group;
  }

  function uniqueIds(ids) {
    return Array.from(new Set((ids || []).filter(Boolean)));
  }

  function getGroupDescendantNodeIds(groupId, seen = new Set()) {
    const group = state.groups.find(item => item.id === groupId);
    if (!group || seen.has(groupId)) return [];
    seen.add(groupId);
    normalizeGroupShape(group);
    return uniqueIds([
      ...group.nodeIds,
      ...group.childGroupIds.flatMap(id => getGroupDescendantNodeIds(id, seen))
    ]).filter(id => getNode(id));
  }

  function getGroupDescendantGroupIds(groupId, seen = new Set()) {
    const group = state.groups.find(item => item.id === groupId);
    if (!group || seen.has(groupId)) return [];
    seen.add(groupId);
    normalizeGroupShape(group);
    return uniqueIds([
      group.id,
      ...group.childGroupIds.flatMap(id => getGroupDescendantGroupIds(id, seen))
    ]);
  }

  function isGroupDescendantOf(groupId, ancestorId, seen = new Set()) {
    if (!groupId || !ancestorId || groupId === ancestorId || seen.has(ancestorId)) return groupId === ancestorId;
    seen.add(ancestorId);
    const ancestor = state.groups.find(item => item.id === ancestorId);
    if (!ancestor) return false;
    normalizeGroupShape(ancestor);
    return ancestor.childGroupIds.some(id => id === groupId || isGroupDescendantOf(groupId, id, seen));
  }

  function getDirectParentGroupIds(groupId) {
    if (!groupId) return [];
    return state.groups
      .filter(group => {
        normalizeGroupShape(group);
        return group.childGroupIds.includes(groupId);
      })
      .map(group => group.id);
  }

  function getDirectGroupForNode(nodeId) {
    if (!nodeId) return null;
    return state.groups.find(group => {
      normalizeGroupShape(group);
      return group.nodeIds.includes(nodeId);
    }) || null;
  }

  function getAncestorGroupIdsForGroup(groupId, seen = new Set()) {
    if (!groupId || seen.has(groupId)) return [];
    seen.add(groupId);
    const parents = getDirectParentGroupIds(groupId);
    return uniqueIds([
      ...parents,
      ...parents.flatMap(id => getAncestorGroupIdsForGroup(id, seen))
    ]);
  }

  function getAffectedGroupIdsForNodes(nodeIds = []) {
    const direct = uniqueIds(nodeIds.flatMap(id => getNodeOwnerGroupIds(id)));
    return uniqueIds([
      ...direct,
      ...direct.flatMap(id => getAncestorGroupIdsForGroup(id))
    ]);
  }

  function updateGroupBoundsForIds(groupIds = []) {
    const ordered = uniqueIds(groupIds)
      .map(id => state.groups.find(group => group.id === id))
      .filter(Boolean)
      .sort((a, b) => getGroupDepth(b.id) - getGroupDepth(a.id));
    ordered.forEach(updateGroupBounds);
  }

  function getGroupBoundsSnapshot(groupIds = []) {
    return new Map(uniqueIds(groupIds).map(id => {
      const group = state.groups.find(item => item.id === id);
      return group ? [id, { x: group.x, y: group.y, w: group.w, h: group.h }] : null;
    }).filter(Boolean));
  }

  function moveGroupsFromSnapshot(groupIds = [], snapshot = new Map(), dx = 0, dy = 0) {
    uniqueIds(groupIds).forEach(id => {
      const group = state.groups.find(item => item.id === id);
      const origin = snapshot.get(id);
      if (!group || !origin) return;
      group.x = Math.round(origin.x + dx);
      group.y = Math.round(origin.y + dy);
      group.w = origin.w;
      group.h = origin.h;
    });
  }

  function getSelectedGroupIds() {
    return uniqueIds(state.selectedGroupIds || []).filter(id => state.groups.some(group => group.id === id));
  }

  function groupSelectedNodes() {
    const ids = getSelectedNodeIds();
    const selectedGroupIds = getSelectedGroupIds();
    const selectedGroupDescendants = new Set(selectedGroupIds.flatMap(id => getGroupDescendantNodeIds(id)));
    const parentNodeIds = ids.filter(id => !selectedGroupDescendants.has(id));
    if (parentNodeIds.length + selectedGroupIds.length < 2) {
      toast('请先框选或多选至少 2 个节点/编组', 'error');
      return;
    }
    const group = createGroup(parentNodeIds, '节点组 ' + (state.groups.length + 1), selectedGroupIds);
    const childSet = new Set(selectedGroupIds);
    const parentSet = new Set(parentNodeIds);
    state.groups.forEach(item => {
      if (item.id === group.id || childSet.has(item.id)) return;
      normalizeGroupShape(item);
      item.nodeIds = item.nodeIds.filter(id => !parentSet.has(id));
      item.childGroupIds = item.childGroupIds.filter(id => !childSet.has(id));
    });
    cleanupGroups();
    state.selectedIds = uniqueIds([...parentNodeIds, ...selectedGroupIds.flatMap(id => getGroupDescendantNodeIds(id))]);
    state.selectedGroupIds = [group.id];
    state.selectedId = state.selectedIds[0] || null;
    render();
    scheduleSaveWorkspace();
    toast(selectedGroupIds.length ? '已创建父编组' : '已编组', 'success');
  }

  // ==========================================================================
  // SECTION: 08 GEOMETRY
  // ==========================================================================
  function getNodeBox(node) {
    const width = getNodeWidth(node);
    const height = node.type === 'image'
      ? getImageNodeHeight(node)
      : node.type === 'text'
        ? getTextNodeHeight(node)
        : node.type === 'cinema'
          ? getCinemaNodeHeight(node)
        : node.type === 'detail'
          ? getDetailNodeHeight(node)
          : node.type === 'detailPage'
            ? getDetailPageNodeHeight(node)
            : node.type === 'tryOn'
              ? getTryOnNodeHeight(node)
              : node.type === 'sketch'
                ? getSketchNodeHeight(node)
                : getGenerateNodeHeight(node);
    return { x: node.x, y: node.y, w: width, h: height };
  }

  function getNodeWidth(node) {
    if (node?.type === 'generate') return getGeneratePreviewSize(node).width;
    if (node?.type === 'image') return getImagePreviewSize(node).width;
    if (node?.type === 'detailPage') return 360;
    if (node?.type === 'tryOn') return 440;
    if (node?.type === 'cinema') return 420;
    return NODE_W;
  }

  function getImagePreviewHeight(node) {
    return getImagePreviewSize(node).height;
  }

  function getImageAspectRatio(node) {
    const width = Number(node?.imageWidth) || 0;
    const height = Number(node?.imageHeight) || 0;
    return normalizeAspectRatio(width / height) || normalizeAspectRatio(node?.aspectRatio) || 4 / 3;
  }

  function scaleImageDisplaySize(ratio, maxW, maxH) {
    const safeRatio = Math.max(0.35, Math.min(3, normalizeAspectRatio(ratio) || 4 / 3));
    let width = maxW;
    let height = Math.round(width / safeRatio);
    if (height > maxH) {
      height = maxH;
      width = Math.round(height * safeRatio);
    }
    if (width < IMAGE_DISPLAY_MIN_SIDE && height < maxH) {
      width = Math.min(maxW, IMAGE_DISPLAY_MIN_SIDE);
      height = Math.round(width / safeRatio);
      if (height > maxH) {
        height = maxH;
        width = Math.round(height * safeRatio);
      }
    }
    return { width, height };
  }

  function getImportedImageDisplaySize(image, source = 'import') {
    const ratio = normalizeAspectRatio(image?.aspectRatio)
      || normalizeAspectRatio((Number(image?.width) || 0) / (Number(image?.height) || 0))
      || 4 / 3;
    const pasted = source === 'paste';
    return scaleImageDisplaySize(
      ratio,
      pasted ? PASTED_IMAGE_DISPLAY_MAX_W : IMAGE_DISPLAY_MAX_W,
      pasted ? PASTED_IMAGE_DISPLAY_MAX_H : IMAGE_DISPLAY_MAX_H
    );
  }

  function getImagePreviewSize(node) {
    if (Number(node?.displayWidth) > 0 && Number(node?.displayHeight) > 0) {
      return {
        width: Math.round(Number(node.displayWidth)),
        height: Math.round(Number(node.displayHeight))
      };
    }
    const ratio = Math.max(0.35, Math.min(3, getImageAspectRatio(node)));
    return scaleImageDisplaySize(ratio, IMAGE_DISPLAY_MAX_W, IMAGE_DISPLAY_MAX_H);
  }

  function getSketchPreviewSize(node) {
    const ratio = Math.max(0.35, Math.min(3, Number(getSketchState(node).aspectRatio) || 1));
    const maxW = NODE_W - 24;
    const maxH = 190;
    let width = maxW;
    let height = Math.round(width / ratio);
    if (height > maxH) {
      height = maxH;
      width = Math.round(height * ratio);
    }
    return { width, height };
  }

  function getImageNodeHeight(node) {
    return getImagePreviewHeight(node);
  }

  function syncImageNodeNaturalAspect(nodeId, img) {
    const node = getNode(nodeId);
    if (!node || node.type !== 'image' || !img?.naturalWidth || !img?.naturalHeight) return;
    const ratio = normalizeAspectRatio(img.naturalWidth / img.naturalHeight);
    if (!ratio) return;
    const current = normalizeAspectRatio(node.aspectRatio) || 4 / 3;
    node.imageWidth = img.naturalWidth;
    node.imageHeight = img.naturalHeight;
    if (!Number(node.displayWidth) || !Number(node.displayHeight)) {
      const display = getImportedImageDisplaySize({
        aspectRatio: ratio,
        width: img.naturalWidth,
        height: img.naturalHeight
      }, 'import');
      node.displayWidth = display.width;
      node.displayHeight = display.height;
    }
    if (Math.abs(current - ratio) < 0.01) {
      scheduleSaveWorkspace();
      return;
    }
    node.aspectRatio = ratio;
    scheduleSaveWorkspace();
    requestAnimationFrame(() => {
      if (getNode(nodeId)?.aspectRatio === ratio) render();
    });
  }

  function getMediaPortY(node) {
    const preview = node?.type === 'image'
      ? getImagePreviewSize(node)
      : node?.type === 'generate'
        ? getGeneratePreviewSize(node)
        : null;
    if (!preview) {
      const box = getNodeBox(node);
      return Math.min(box.h, 260) / 2;
    }
    return preview.height / 2;
  }

  function getTextNodeHeight(node) {
    const refs = collectRefsForNode(node);
    const refStripHeight = refs.images.length ? 36 : 0;
    const detailHeight = refs.details.length ? 32 : 0;
    const errorHeight = node?.error ? 54 : 0;
    return TEXT_NODE_H + refStripHeight + detailHeight + errorHeight;
  }

  function getCinemaNodeHeight(node) {
    const refs = collectRefsForNode(node);
    const hasResult = Boolean(String(node?.result || '').trim());
    const hasDraft = Boolean(String(node?.draft || '').trim());
    const base = 238;
    return base
      + (refs.images.length ? 54 : 0)
      + (hasResult ? 76 : 0)
      + (hasDraft ? 18 : 0)
      + (node?.error ? 42 : 0);
  }

  function getDetailNodeHeight() {
    return 166;
  }

  function getDetailPageNodeHeight(node) {
    const refs = collectRefsForNode(node);
    const groupId = node?.settings?.detailPageGroupId || '';
    const nodes = getDetailPageGenerateNodes(groupId);
    const hasRefs = Boolean(refs.images.length || refs.details.length || refs.textInputs.length);
    const hasPlan = Boolean(node?.settings?.assistantPlan?.text);
    const base = 252;
    return base + (hasRefs ? 28 : 0) + (hasPlan ? 38 : 0) + (nodes.length ? 36 : 0) + (node?.error ? 38 : 0);
  }

  function getTryOnNodeHeight(node) {
    const refs = collectRefsForNode(node);
    const settings = getTryOnSettings(node);
    const hasBackgroundRefs = settings.backgroundReferenceIds.length > 0;
    const hasChildren = Boolean(settings.garmentGenerateId || settings.tryOnGenerateId);
    const poseNodes = (settings.poseGenerateIds || []).map(getNode).filter(item => item?.type === 'generate');
    const visibleSourceRows = Math.min(3, refs.images.length);
    const header = 56;
    const bodyPaddingAndGaps = 88;
    const status = 44;
    const slots = 132;
    const sourceBlock = refs.images.length ? visibleSourceRows * 88 : 54;
    const pose = settings.poseChangeEnabled ? 84 : 46;
    const actions = 40;
    const result = hasChildren ? 86 : 0;
    const poseStatus = poseNodes.length ? 38 : 0;
    return header + bodyPaddingAndGaps + status + slots + sourceBlock + pose + actions + result + poseStatus + (hasBackgroundRefs ? 10 : 0) + (node?.error ? 42 : 0);
  }

  function getSketchNodeHeight(node) {
    return 105 + getSketchPreviewSize(node).height;
  }

  function getGeneratePreviewSize(node) {
    const parsed = parseApiSizeValue(node?.settings?.size || '1024x1024');
    const innerW = GENERATE_PREVIEW_MAX_W;
    const ratio = parsed?.ratio || 1;
    const maxH = GENERATE_PREVIEW_MAX_H;
    let width = innerW;
    let height = Math.round(width / ratio);
    if (height > maxH) {
      height = maxH;
      width = Math.round(height * ratio);
    }
    const minSide = 170;
    if (width < minSide && height < maxH) {
      width = Math.min(innerW, minSide);
      height = Math.round(width / ratio);
    }
    return { width, height, ratioLabel: getSizeRatioLabel(node?.settings?.size) };
  }

  function getGenerateNodeHeight(node) {
    const preview = getGeneratePreviewSize(node);
    if (!isNodeSelected(node?.id)) return preview.height;
    const region = getRegionEditState(node);
    const resultRegion = getResultRegionEditState(node);
    const refs = collectRefsForNode(node);
    const hasSourceRegion = refs.images.some(ref => Boolean(getRegionEditState(getNode(ref.id) || ref).rect));
    const hasFocusPrompt = Boolean(region.enabled || region.rect || region.prompt || hasSourceRegion);
    const hasResultFocusPrompt = Boolean(resultRegion.enabled || resultRegion.rect || resultRegion.prompt);
    const extra = (hasFocusPrompt ? GENERATE_COMPOSER_FOCUS_EXTRA_H : 0)
      + (hasResultFocusPrompt ? GENERATE_COMPOSER_FOCUS_EXTRA_H : 0);
    return preview.height + GENERATE_COMPOSER_GAP + GENERATE_COMPOSER_BASE_H + extra;
  }

  function getSizeRatioLabel(size) {
    const parsed = parseApiSizeValue(size || '1024x1024');
    if (!parsed) return '1:1';
    const gcd = (a, b) => b ? gcd(b, a % b) : a;
    const divisor = gcd(parsed.w, parsed.h);
    return `${parsed.w / divisor}:${parsed.h / divisor}`;
  }

  function getRatioOrientation(ratio) {
    const parts = ratioToParts(ratio);
    if (parts.w === parts.h) return 'square';
    return parts.w > parts.h ? 'landscape' : 'portrait';
  }

  // ==========================================================================
  // SECTION: 09 RENDER
  // ==========================================================================
  function render() {
    applyTransform({ minimap: 'none' });
    renderGroups();
    renderNodes();
    renderConnections();
    renderMinimapIfNeeded();
    renderAssistantPanel();
    renderDetailPagePanel();
    if (els.assetPanel?.classList.contains('show')) {
      scheduleAssetLibraryRefresh();
    }
  }

  let _assetRefreshTimer = null;
  function scheduleAssetLibraryRefresh() {
    if (_assetRefreshTimer) return;
    _assetRefreshTimer = setTimeout(() => {
      _assetRefreshTimer = null;
      if (els.assetPanel?.classList.contains('show')) renderAssetLibrary();
    }, 300);
  }

  function getWorldViewportRect() {
    const rect = els.canvas.getBoundingClientRect();
    return {
      x: -state.panX / state.zoom,
      y: -state.panY / state.zoom,
      w: rect.width / state.zoom,
      h: rect.height / state.zoom
    };
  }

  function getMinimapModel() {
    const nodeBoxes = state.nodes.map(getNodeBox);
    const viewport = getWorldViewportRect();
    const boxes = [...nodeBoxes, viewport];
    const minX = Math.min(...boxes.map(box => box.x));
    const minY = Math.min(...boxes.map(box => box.y));
    const maxX = Math.max(...boxes.map(box => box.x + box.w));
    const maxY = Math.max(...boxes.map(box => box.y + box.h));
    const worldW = Math.max(1, maxX - minX);
    const worldH = Math.max(1, maxY - minY);
    const scale = Math.min((MINIMAP_W - MINIMAP_PAD * 2) / worldW, (MINIMAP_H - MINIMAP_PAD * 2) / worldH);
    const drawW = worldW * scale;
    const drawH = worldH * scale;
    const offsetX = (MINIMAP_W - drawW) / 2;
    const offsetY = (MINIMAP_H - drawH) / 2;
    return { minX, minY, maxX, maxY, worldW, worldH, scale, offsetX, offsetY, viewport, nodeBoxes };
  }

  function minimapProject(model, box) {
    return {
      x: model.offsetX + (box.x - model.minX) * model.scale,
      y: model.offsetY + (box.y - model.minY) * model.scale,
      w: Math.max(3, box.w * model.scale),
      h: Math.max(3, box.h * model.scale)
    };
  }

  function renderMinimap() {
    if (!els.minimap || !els.minimapContent || !els.minimapViewport) return;
    if (!state.nodes.length) {
      els.minimap.classList.add('empty');
      els.minimapContent.innerHTML = '';
      minimapModelCache = null;
      minimapStructureSignature = '';
      minimapNodesHtmlCache = '';
      return;
    }
    els.minimap.classList.remove('empty');
    const model = getMinimapModel();
    minimapModelCache = model;
    minimapNodesHtmlCache = state.nodes.map(node => {
      const box = minimapProject(model, getNodeBox(node));
      return `<div class="v2-minimap-node ${escHtml(node.type)}" style="left:${box.x}px;top:${box.y}px;width:${box.w}px;height:${box.h}px"></div>`;
    }).join('');
    els.minimapContent.innerHTML = minimapNodesHtmlCache;
    minimapStructureSignature = getMinimapStructureSignature();
    syncMinimapViewport(model);
  }

  function renderMinimapIfNeeded() {
    const signature = getMinimapStructureSignature();
    if (signature !== minimapStructureSignature || !minimapModelCache) {
      renderMinimap();
      return;
    }
    syncMinimapViewport();
  }

  function invalidateMinimapCache() {
    minimapStructureSignature = '';
    minimapNodesHtmlCache = '';
    minimapModelCache = null;
  }

  function getMinimapStructureSignature() {
    return state.nodes.map(node => {
      const box = getNodeBox(node);
      return [node.id, node.type, box.x, box.y, box.w, box.h].join(':');
    }).join('|');
  }

  function syncMinimapViewport(model = minimapModelCache) {
    if (!els.minimapViewport || !model) return;
    const viewport = getWorldViewportRect();
    if (
      viewport.x < model.minX ||
      viewport.y < model.minY ||
      viewport.x + viewport.w > model.maxX ||
      viewport.y + viewport.h > model.maxY
    ) {
      renderMinimap();
      return;
    }
    model.viewport = viewport;
    const view = minimapProject(model, model.viewport);
    els.minimapViewport.style.left = view.x + 'px';
    els.minimapViewport.style.top = view.y + 'px';
    els.minimapViewport.style.width = Math.max(12, view.w) + 'px';
    els.minimapViewport.style.height = Math.max(12, view.h) + 'px';
  }

  function scheduleMinimapFrame(full = false) {
    if (full) {
      if (minimapFrame) cancelAnimationFrame(minimapFrame);
      minimapFrame = requestAnimationFrame(() => {
        minimapFrame = null;
        renderMinimap();
      });
      return;
    }
    if (minimapFrame) return;
    minimapFrame = requestAnimationFrame(() => {
      minimapFrame = null;
      syncMinimapViewport();
    });
  }

  function getNodeElement(nodeId) {
    if (!nodeId) return null;
    const cached = _nodeElementCache.get(nodeId);
    if (cached?.isConnected) return cached;
    const el = els.world?.querySelector(`.v2-node[data-id="${cssEscape(nodeId)}"]`) || null;
    if (el) _nodeElementCache.set(nodeId, el);
    else _nodeElementCache.delete(nodeId);
    return el;
  }

  function getGroupElement(groupId) {
    if (!groupId) return null;
    const cached = _groupElementCache.get(groupId);
    if (cached?.isConnected) return cached;
    const el = els.world?.querySelector(`.v2-group[data-group-id="${cssEscape(groupId)}"]`) || null;
    if (el) _groupElementCache.set(groupId, el);
    else _groupElementCache.delete(groupId);
    return el;
  }

  function clearElementCaches() {
    _nodeElementCache = new Map();
    _groupElementCache = new Map();
  }

  function syncDraggedDom(ids) {
    uniqueIds(ids).forEach(id => {
      const node = getNode(id);
      const el = node ? getNodeElement(id) : null;
      if (!node || !el) return;
      const origin = getActiveDragOrigin(id);
      if (origin) {
        el.style.transform = `translate3d(${node.x - origin.x}px, ${node.y - origin.y}px, 0)`;
      } else {
        // 兜底：拖拽已结束但还在调本函数（不应该发生）
        // 用 transform 路径而不是 left/top（避免 reflow）
        el.style.transform = `translate3d(0, 0, 0)`;
        el.style.left = node.x + 'px';
        el.style.top = node.y + 'px';
      }
    });
  }

  function commitNodeDomPositions(ids) {
    // 优化：保持 transform 路径（避免 left/top 触发 reflow）
    // 释放拖拽 origin 后，el 实际的 left/top 已是绝对定位原值
    // 拖拽过程中 transform 叠加在原 left/top 上
    // 结束拖拽时只清 transform 即可
    uniqueIds(ids).forEach(id => {
      const node = getNode(id);
      const el = node ? getNodeElement(id) : null;
      if (!node || !el) return;
      el.style.transform = '';
      // 不改 left/top —— 让 CSS 已有的 left/top 保持不变
    });
  }

  function getActiveDragOrigin(id) {
    const active = state.drag || state.groupDrag;
    return active?.nodes?.find(item => item.id === id) || null;
  }

  function getActiveDragIds() {
    const active = state.drag || state.groupDrag;
    return new Set((active?.nodes || []).map(item => item.id));
  }

  function syncGroupDom(groupIds = null) {
    const groups = Array.isArray(groupIds)
      ? uniqueIds(groupIds).map(id => state.groups.find(group => group.id === id)).filter(Boolean)
      : state.groups;
    groups.forEach(group => {
      const el = getGroupElement(group.id);
      if (!el) return;
      el.style.left = group.x + 'px';
      el.style.top = group.y + 'px';
      el.style.width = group.w + 'px';
      el.style.height = group.h + 'px';
    });
  }

  function syncDragFrame(ids) {
    syncDraggedDom(ids);
    syncGroupDom();
    renderConnections(state.dragConnectionIds);
  }

  function syncViewportFrame() {
    applyTransform({ minimap: 'viewport' });
  }

  function syncSelectionClasses() {
    const activeDragIds = getActiveDragIds();
    els.world.querySelectorAll('.v2-node').forEach(el => {
      el.classList.toggle('selected', isNodeSelected(el.dataset.id));
      el.classList.toggle('dragging', activeDragIds.has(el.dataset.id));
    });
  }

  function syncDraggingClasses(ids = []) {
    const active = new Set(ids);
    els.world.querySelectorAll('.v2-node.dragging').forEach(el => {
      if (!active.has(el.dataset.id)) el.classList.remove('dragging');
    });
    active.forEach(id => {
      getNodeElement(id)?.classList.add('dragging');
    });
  }

  function syncGroupDraggingClass(groupId) {
    els.world.querySelectorAll('.v2-group.dragging').forEach(el => {
      if (el.dataset.groupId !== groupId) el.classList.remove('dragging');
    });
    if (groupId) getGroupElement(groupId)?.classList.add('dragging');
  }

  function setCanvasGrabbing(active) {
    els.canvas?.classList.toggle('dragging', Boolean(active));
  }

  function clearPointerInteractionState() {
    const hadDragLikeState = Boolean(
      state.drag ||
      state.groupDrag ||
      state.pendingNodeDrag ||
      state.pendingGroupDrag ||
      state.panning ||
      state.selecting ||
      state.minimapDrag ||
      state.gesture
    );
    if (hadDragLikeState) flushDragFrame();
    state.drag = null;
    state.groupDrag = null;
    state.pendingNodeDrag = null;
    state.pendingGroupDrag = null;
    state.panning = null;
    state.selecting = null;
    state.minimapDrag = null;
    state.gesture = null;
    state.dragConnectionIds = null;
    state.dragGroupIds = null;
    updateSelectionBox();
    setCanvasGrabbing(false);
    clearDragVisualState();
    if (hadDragLikeState) {
      renderConnections();
      restoreNodePanelsAfterDrag();
    }
  }

  function getConnectionIndexesForNodes(ids) {
    const set = new Set(ids);
    const indexes = [];
    state.connections.forEach((conn, index) => {
      if (set.has(conn.from) || set.has(conn.to)) indexes.push(index);
    });
    return indexes;
  }

  function clearDragVisualState() {
    state.dragConnectionIds = null;
    els.world.querySelectorAll('.v2-node.dragging').forEach(el => el.classList.remove('dragging'));
    els.world.querySelectorAll('.v2-group.dragging').forEach(el => el.classList.remove('dragging'));
  }

  function syncLinkTargetClass() {
    els.world.querySelectorAll('.v2-node.link-target').forEach(el => {
      if (el.dataset.id !== state.linkTargetId) el.classList.remove('link-target');
    });
    if (state.linkTargetId) {
      getNodeElement(state.linkTargetId)?.classList.add('link-target');
    }
  }

  function clearLinkVisualState() {
    if (linkFrame) {
      cancelAnimationFrame(linkFrame);
      linkFrame = null;
    }
    els.world.querySelectorAll('.v2-node.link-target').forEach(el => el.classList.remove('link-target'));
    clearActiveLinkPath();
  }

  function finishLinkInteraction({ keepPendingConnection = false, rerender = false } = {}) {
    state.link = null;
    state.linkTargetId = null;
    if (!keepPendingConnection) state.pendingConnection = null;
    clearLinkVisualState();
    if (rerender) renderConnections();
  }

  function hideNodePanelsDuringDrag() {
    if (!state.dragPanelSnapshot && els.world.querySelector('.v2-node-panel')) {
      state.dragPanelSnapshot = {
        selectedId: state.selectedId,
        selectedIds: [...state.selectedIds]
      };
    }
    els.world.querySelectorAll('.v2-node-panel').forEach(panel => panel.remove());
    _panelHtmlCache = '';
  }

  function restoreNodePanelsAfterDrag() {
    const snapshot = state.dragPanelSnapshot;
    state.dragPanelSnapshot = null;
    if (!snapshot?.selectedId || !getNode(snapshot.selectedId)) return;
    state.selectedId = snapshot.selectedId;
    state.selectedIds = Array.isArray(snapshot.selectedIds)
      ? snapshot.selectedIds.filter(id => getNode(id))
      : [snapshot.selectedId];
    if (!state.selectedIds.includes(snapshot.selectedId)) state.selectedIds.push(snapshot.selectedId);
    refreshSelectedPanel();
    syncSelectionClasses();
  }

  function scheduleDragFrame(ids) {
    const nextIds = uniqueIds(ids);
    if (dragFrame) {
      dragFrame.ids = uniqueIds([...(dragFrame.ids || []), ...nextIds]);
      return;
    }
    dragFrame = { ids: nextIds, raf: requestAnimationFrame(() => {
      const frame = dragFrame;
      dragFrame = null;
      syncDragFrame(frame?.ids || []);
    }) };
  }

  function scheduleLinkFrame() {
    if (linkFrame) return;
    linkFrame = requestAnimationFrame(() => {
      linkFrame = null;
      updateActiveLinkPath();
    });
  }

  function scheduleViewportFrame() {
    if (viewportFrame) return;
    viewportFrame = requestAnimationFrame(() => {
      viewportFrame = null;
      syncViewportFrame();
    });
  }

  function flushDragFrame() {
    if (!dragFrame) return;
    cancelAnimationFrame(dragFrame.raf);
    const ids = dragFrame.ids || [];
    dragFrame = null;
    syncDragFrame(ids);
  }

  function cssEscape(value) {
    if (window.CSS?.escape) return window.CSS.escape(String(value));
    return String(value).replace(/["\\]/g, '\\$&');
  }

  function onMinimapMouseDown(e) {
    e.preventDefault();
    e.stopPropagation();
    focusMinimapPoint(e.clientX, e.clientY);
    state.minimapDrag = true;
  }

  function onAppSelectStart(e) {
    if (e.target.closest('input,textarea,[contenteditable="true"],.allow-text-select')) return;
    e.preventDefault();
  }

  function focusMinimapPoint(clientX, clientY) {
    if (!els.minimapStage || !state.nodes.length) return;
    const model = minimapModelCache || getMinimapModel();
    minimapModelCache = model;
    const rect = els.minimapStage.getBoundingClientRect();
    const x = Math.max(0, Math.min(MINIMAP_W, clientX - rect.left));
    const y = Math.max(0, Math.min(MINIMAP_H, clientY - rect.top));
    const worldX = model.minX + (x - model.offsetX) / model.scale;
    const worldY = model.minY + (y - model.offsetY) / model.scale;
    const canvasRect = els.canvas.getBoundingClientRect();
    state.panX = canvasRect.width / 2 - worldX * state.zoom;
    state.panY = canvasRect.height / 2 - worldY * state.zoom;
    scheduleViewportFrame();
    scheduleSaveWorkspace();
  }

  function renderGroups() {
    const signature = getGroupsRenderSignature();
    if (signature === _groupsSignatureCache && els.world.querySelector('.v2-group')) return;
    const html = state.groups.map(group => `
      <div class="v2-group" data-group-id="${group.id}" style="left:${group.x}px;top:${group.y}px;width:${group.w}px;height:${group.h}px;z-index:${getGroupDepth(group.id) + 1}">
        <div class="v2-group-label" data-group-handle="${group.id}">
          <span>${escHtml(group.title)}</span>
          <button type="button" data-arrange-group="${group.id}">整理组内</button>
          <button type="button" data-ungroup="${group.id}">取消编组</button>
        </div>
      </div>`).join('');
    els.world.querySelectorAll('.v2-group').forEach(el => el.remove());
    if (html) els.world.insertAdjacentHTML('afterbegin', html);
    _groupElementCache = new Map();
    _groupsHtmlCache = html;
    _groupsSignatureCache = signature;
  }

  function getGroupsRenderSignature() {
    return state.groups.map(group => [
      group.id,
      group.title || '',
      group.x,
      group.y,
      group.w,
      group.h,
      getGroupDepth(group.id)
    ].join(':')).join('|');
  }

  // Cache last rendered HTML so renderNodes/refreshSelectedPanel can skip
  // DOM rebuilds when nothing visible changed (e.g. selection-only changes).
  // selected / link-target classes are applied via sync functions below,
  // not embedded in renderNode output, so these caches stay stable across
  // selection changes.
  let _nodesHtmlCache = '';
  let _panelHtmlCache = '';
  let _nodeHtmlCache = new Map();

  function invalidateRenderCache() {
    _nodesHtmlCache = '';
    _panelHtmlCache = '';
    _nodeHtmlCache = new Map();
    _groupsHtmlCache = '';
    _groupsSignatureCache = '';
    invalidateMinimapCache();
    _viewportTransformCache = '';
    _gridSizeCache = '';
    _gridPositionCache = '';
    clearElementCaches();
    invalidateNodeByIdCache();
  }

  function renderNodes() {
    const groupHtml = _groupsHtmlCache || Array.from(els.world.querySelectorAll('.v2-group')).map(el => el.outerHTML).join('');
    const newNodesHtml = state.nodes.map(renderNodeCached).join('');
    const newPanelHtml = renderSelectedPanel();
    const nodesChanged = newNodesHtml !== _nodesHtmlCache;
    const panelChanged = newPanelHtml !== _panelHtmlCache;
    if (!nodesChanged && !panelChanged && els.world.querySelector('.v2-node')) {
      // No structural change — just refresh selection / link-target classes.
      syncSelectionClasses();
      syncLinkTargetClass();
      return;
    }
    _nodesHtmlCache = newNodesHtml;
    _panelHtmlCache = newPanelHtml;
    els.world.innerHTML = groupHtml + newNodesHtml + newPanelHtml;
    clearElementCaches();
    bindNodeEvents();
    bindImagePanelEvents();
    bindTextPanelEvents();
    bindCinemaNodeEvents();
    bindCinemaPanelEvents();
    bindDetailPanelEvents();
    bindSketchPanelEvents();
    bindDetailPageNodeEvents();
    bindTryOnNodeEvents();
    bindGeneratePanelEvents();
    syncSelectionClasses();
    syncLinkTargetClass();
    applyNodeStatusBadges();
  }

  // ============ 节点状态徽章注入（视觉增强） ============
  function applyNodeStatusBadges() {
    if (!_nodeStatuses || !Object.keys(_nodeStatuses).length) return;
    if (!els.world) return;
    Object.keys(_nodeStatuses).forEach(nodeId => {
      const statusObj = _nodeStatuses[nodeId];
      if (!statusObj) return;
      const nodeEl = els.world.querySelector(`[data-id="${nodeId}"]`);
      if (!nodeEl) return;
      const { status, message } = statusObj;
      if (status === 'idle') {
        nodeEl.removeAttribute('data-status');
        nodeEl.querySelectorAll('.v2-node-status-badge').forEach(el => el.remove());
        return;
      }
      nodeEl.setAttribute('data-status', status);
      let badge = nodeEl.querySelector('.v2-node-status-badge');
      if (!badge) {
        badge = document.createElement('div');
        badge.className = 'v2-node-status-badge';
        nodeEl.appendChild(badge);
      }
      badge.className = `v2-node-status-badge ${status}`;
      if (status === 'generating') {
        badge.innerHTML = '<span class="spinner"></span>运行中';
        if (message) badge.title = message;
      } else if (status === 'done' || status === 'completed') {
        badge.textContent = '✓ 完成';
        if (message) badge.title = message;
      } else if (status === 'error') {
        badge.textContent = '✕ 错误';
        if (message) badge.title = message;
      }
    });
  }

  function renderNodeCached(node) {
    const signature = getNodeRenderSignature(node);
    const cached = _nodeHtmlCache.get(node.id);
    if (cached?.signature === signature) return cached.html;
    const html = renderNode(node);
    _nodeHtmlCache.set(node.id, { signature, html });
    return html;
  }

  function invalidateNodeRenderCache(nodeId) {
    if (!nodeId) return;
    _nodeHtmlCache.delete(nodeId);
    _nodesHtmlCache = '';
  }

  function invalidateNodeRenderCaches(ids = []) {
    uniqueIds(ids).forEach(invalidateNodeRenderCache);
  }

  function replaceNodeDom(nodeId) {
    const node = getNode(nodeId);
    const current = node ? getNodeElement(nodeId) : null;
    if (!node || !current) return false;
    current.outerHTML = renderNodeCached(node);
    _nodeElementCache.delete(nodeId);
    _nodesHtmlCache = '';
    bindNodeEvents();
    bindImagePanelEvents();
    bindTextPanelEvents();
    bindCinemaNodeEvents();
    bindCinemaPanelEvents();
    bindDetailPanelEvents();
    bindSketchPanelEvents();
    bindDetailPageNodeEvents();
    bindTryOnNodeEvents();
    bindGeneratePanelEvents();
    syncSelectionClasses();
    syncLinkTargetClass();
    return true;
  }

  function refreshNodesForConnectionChange(ids = []) {
    if (!els.world) return;
    const changedIds = uniqueIds(ids).filter(id => getNode(id));
    if (!changedIds.length) return;
    invalidateNodeRenderCaches(changedIds);
    changedIds.forEach(id => {
      if (!replaceNodeDom(id)) renderNodes();
    });
    renderAssistantPanel();
  }

  function refreshSelectedPanel() {
    const newPanelHtml = renderSelectedPanel();
    if (newPanelHtml === _panelHtmlCache) return;
    _panelHtmlCache = newPanelHtml;
    els.world.querySelectorAll('.v2-node-panel').forEach(panel => panel.remove());
    if (newPanelHtml) els.world.insertAdjacentHTML('beforeend', newPanelHtml);
    bindImagePanelEvents();
    bindTextPanelEvents();
    bindCinemaNodeEvents();
    bindCinemaPanelEvents();
    bindDetailPanelEvents();
    bindSketchPanelEvents();
    bindDetailPageNodeEvents();
    bindTryOnNodeEvents();
    bindGeneratePanelEvents();
  }

  function refreshSelectionOnly(previousIds = []) {
    const changedIds = uniqueIds([...previousIds, ...getSelectedNodeIds()]);
    invalidateNodeRenderCaches(changedIds.filter(id => getNode(id)?.type === 'generate'));
    changedIds.forEach(id => {
      if (getNode(id)?.type === 'generate') replaceNodeDom(id);
    });
    syncSelectionClasses();
    syncLinkTargetClass();
    refreshSelectedPanel();
    renderAssistantPanel();
  }

  function renderNode(node) {
    // selected/link-target classes are applied via syncSelectionClasses/syncLinkTargetClass
    // so that renderNode output stays selection-independent (enables HTML memoization).
    if (node.type === 'image') return renderImageNode(node, '');
    if (node.type === 'text') return renderTextNode(node, '');
    if (node.type === 'cinema') return renderCinemaNode(node, '');
    if (node.type === 'detail') return renderDetailNode(node, '');
    if (node.type === 'sketch') return renderSketchNode(node, '');
    if (node.type === 'detailPage') return renderDetailPageNode(node, '');
    if (node.type === 'tryOn') return renderTryOnNode(node, '');
    return renderGenerateNode(node, '');
  }

  function getNodeRenderSignature(node) {
    if (!node) return '';
    const parts = [
      node.id,
      node.type,
      node.x,
      node.y,
      node.title || '',
      node.alias || '',
      node.status || '',
      node.error || '',
      node.debug || ''
    ];
    if (node.type === 'image') {
      const region = getRegionEditState(node);
      parts.push(node.image || '', node.aspectRatio || '', region.enabled, region.sourceId || '', JSON.stringify(region.rect || null), region.prompt || '', state.regionEditor?.nodeId === node.id ? JSON.stringify(state.regionEditor?.rect || null) : '');
    } else if (node.type === 'generate') {
      const versions = Array.isArray(node.versions) ? node.versions : [];
      const activeVersion = versions.find(version => version?.id === node.activeVersionId) || versions[versions.length - 1] || null;
      parts.push(
        isNodeSelected(node.id) ? 'selected' : 'idle',
        node.text || '',
        node.output || '',
        node.activeVersionId || '',
        versions.length,
        activeVersion?.id || '',
        activeVersion?.image || '',
        activeVersion?.prompt || '',
        JSON.stringify(node.settings || {}),
        JSON.stringify(node.promptAudit || []),
        JSON.stringify(node.regionEdit || null),
        JSON.stringify(node.settings?.regionEdit || null),
        JSON.stringify(node.settings?.resultRegionEdit || null),
        getGenerateRunState(node.id)?.phase || '',
        state.ratioPopoverNodeId === node.id ? 'ratio-open' : '',
        state.settingPopover?.nodeId === node.id ? `setting-open:${state.settingPopover?.setting || ''}` : '',
        state.regionEditor?.nodeId === node.id ? JSON.stringify(state.regionEditor || null) : ''
      );
    } else if (node.type === 'text') {
      parts.push(node.text || '', node.result || '', node.input || '', JSON.stringify(node.settings || {}), JSON.stringify(node.promptSkeleton || null));
    } else if (node.type === 'cinema') {
      parts.push(node.text || '', node.result || '', node.draft || '', JSON.stringify(node.messages || []), JSON.stringify(node.settings?.cinema || {}));
    } else if (node.type === 'detail') {
      parts.push(JSON.stringify(node.detail || null));
    } else if (node.type === 'sketch') {
      parts.push(node.image || '', node.aspectRatio || '', JSON.stringify(node.sketch || null));
    } else if (node.type === 'detailPage') {
      parts.push(JSON.stringify(node.settings || {}));
      parts.push(getDetailPageOwnerRenderDependencySignature(node));
    } else if (node.type === 'tryOn') {
      parts.push(JSON.stringify(node.settings || {}));
      parts.push(getTryOnOwnerRenderDependencySignature(node));
    }
    parts.push(getIncomingConnectionSignature(node.id));
    // UI dirty 标记：当下游节点有上游变更时重渲染
    parts.push(isNodeDirty(node) ? `dirty:${[...(state.dirtyUpstreams.get(node.id) || [])].join('|')}` : 'clean');
    return parts.join('\u001f');
  }

  function getIncomingConnectionSignature(nodeId) {
    if (!nodeId) return '';
    return state.connections
      .filter(conn => conn.to === nodeId)
      .map(conn => conn.from)
      .join(',');
  }

  function getGeneratePreviewDependencySignature(node) {
    if (!node || node.type !== 'generate') return '';
    const versions = Array.isArray(node.versions) ? node.versions : [];
    const activeVersion = versions.find(version => version?.id === node.activeVersionId) || versions[versions.length - 1] || null;
    return [
      node.id,
      node.status || '',
      node.error || '',
      node.debug || '',
      node.output || '',
      node.activeVersionId || '',
      versions.length,
      activeVersion?.id || '',
      activeVersion?.image || ''
    ].join(':');
  }

  function getDetailPageOwnerRenderDependencySignature(node) {
    const groupId = node?.settings?.detailPageGroupId || '';
    return getDetailPageGenerateNodes(groupId).map(getGeneratePreviewDependencySignature).join('|');
  }

  function getTryOnOwnerRenderDependencySignature(node) {
    const settings = getTryOnSettings(node);
    return [
      settings.garmentGenerateId || '',
      settings.tryOnGenerateId || '',
      ...(settings.poseGenerateIds || [])
    ].map(id => getGeneratePreviewDependencySignature(getNode(id))).join('|');
  }

  // ========================================================================
  // SECTION: 9.5 UPSTREAM-TRACKING (UI only — 不修改节点结构)
  // ========================================================================
  // 用途：当上游图源 (image / generate / sketch) 的图变了，标记所有下游节点为"dirty"
  // 下游节点成功运行后清除 dirty。
  // 纯 UI 信号，不影响节点结构与生成链路。
  // ========================================================================

  // 拿到 node 的所有直接上游节点
  function getDirectUpstream(node) {
    if (!node) return [];
    return state.connections
      .filter(conn => conn.to === node.id)
      .map(conn => getNode(conn.from))
      .filter(Boolean);
  }

  // 上游"图源"（image / generate / sketch）
  function getUpstreamImageSources(node) {
    return getDirectUpstream(node).filter(n => n.type === 'image' || n.type === 'generate' || n.type === 'sketch');
  }

  // 上游"产品资料"（detail）
  function getUpstreamDetailSources(node) {
    return getDirectUpstream(node).filter(n => n.type === 'detail');
  }

  // 上游"反推文字"（text）
  function getUpstreamTextSources(node) {
    return getDirectUpstream(node).filter(n => n.type === 'text');
  }

  // 上游图源当前的"图身份"指纹（用于判定变了没）
  function getUpstreamImageIdentity(sourceNode) {
    if (!sourceNode) return 'none';
    if (sourceNode.type === 'image') {
      return sourceNode.image ? 'img:' + String(sourceNode.image).slice(0, 80) : 'empty';
    }
    if (sourceNode.type === 'generate') {
      const v = (sourceNode.versions || []).find(ver => ver.id === sourceNode.activeVersionId)
        || (sourceNode.versions || [])[(sourceNode.versions || []).length - 1]
        || null;
      if (v && v.image) return 'ver:' + v.id + ':' + String(v.image).slice(0, 80);
      if (sourceNode.output) return 'out:' + String(sourceNode.output).slice(0, 80);
      return 'empty';
    }
    if (sourceNode.type === 'sketch') {
      return sourceNode.image ? 'sk:' + String(sourceNode.image).slice(0, 80) : 'empty';
    }
    return 'na';
  }

  // 标记一个图源的所有下游为 dirty
  function markUpstreamDirty(sourceId) {
    if (!sourceId) return;
    const dirty = state.dirtyUpstreams;
    state.nodes.forEach(n => {
      if (n.id === sourceId) return;
      const isDownstream = state.connections.some(conn => conn.to === n.id && conn.from === sourceId);
      if (isDownstream) {
        if (!dirty.has(n.id)) dirty.set(n.id, new Set());
        dirty.get(n.id).add(sourceId);
      }
    });
  }

  // 节点成功运行后清除其 dirty
  function clearUpstreamDirty(nodeId) {
    state.dirtyUpstreams.delete(nodeId);
  }

  // 节点是否 dirty（有上游图源已变更）
  function isNodeDirty(node) {
    const set = state.dirtyUpstreams.get(node.id);
    return Boolean(set && set.size > 0);
  }

  // 拿到这个节点 dirty 的具体上游列表（用于在 UI 上提示哪几张图变了）
  function getUpstreamDirtySources(node) {
    const ids = state.dirtyUpstreams.get(node.id);
    if (!ids) return [];
    return [...ids].map(id => getNode(id)).filter(Boolean);
  }

  // 重跑一个 dirty 节点（UI 入口，按节点类型分派到现有的 run 函数）
  async function rerunDirtyNode(nodeId) {
    const node = getNode(nodeId);
    if (!node) return;
    clearUpstreamDirty(nodeId);  // 先清掉自身的 dirty（run 完成后会重置）
    try {
      if (node.type === 'generate') return await runGenerateNode(nodeId);
      if (node.type === 'text') return await runTextNode(nodeId);
      if (node.type === 'cinema') return await runCinemaNode(nodeId, { runBound: true });
      if (node.type === 'sketch') return await runSketchSegmentation(nodeId);
      if (node.type === 'tryOn') return await runTryOnAll(nodeId);
      if (node.type === 'detailPage') {
        createDetailPageStoryboard(nodeId);
        return;
      }
    } catch (err) {
      console.error('rerunDirtyNode failed:', err);
    }
  }

  // UI 同步：从 lk888 后台查任务结果（不重新提交，只查状态）。
  // 30 秒内每 5 秒轮询一次；拿到 result_url 就写入节点。
  async function syncGenerateTaskFromBackend(nodeId) {
    const node = getNode(nodeId);
    if (!node || node.type !== 'generate') return;
    const taskId = node.lastTaskId;
    if (!taskId) {
      toast('没有可同步的任务 ID', 'error');
      return;
    }
    if (typeof pollMediaTaskStatus !== 'function') {
      toast('轮询模块未加载', 'error');
      return;
    }

    const maxAttempts = 6;       // 6 × 5s = 30 秒
    const intervalMs = 5000;
    const startedAt = Date.now();
    let lastStatus = '';
    let syncBtn = null;
    // 锁定按钮：避免重复点击
    syncBtn = document.querySelector(`[data-sync-generate="${nodeId}"]`);
    if (syncBtn) {
      syncBtn.disabled = true;
      syncBtn.textContent = '🔄 同步中…';
    }
    try {
      for (let i = 0; i < maxAttempts; i++) {
        if (i > 0) await new Promise(r => setTimeout(r, intervalMs));
        let res;
        try {
          // 单次查询：调内部 fetch（不走 pollMediaTaskStatus 的 180 次循环）
          res = await queryOneTaskStatus(taskId);
        } catch (e) {
          lastStatus = e?.message || '查询失败';
          continue;
        }
        if (!res) {
          lastStatus = '无效响应';
          continue;
        }
        // 1) 拿到 result_url 直接完成
        if (res.result_url) {
          applySyncedGenerateResult(node, res.result_url, res.task);
          toast(`已同步小马AI 后台结果 task_id=${taskId}`, 'success');
          return;
        }
        // 2) 状态文本识别（兜底）
        const status = String(res.task?.status || res.task?.state || '');
        if (/完成|completed|finished|done|succeeded/i.test(status)) {
          // 状态说完成但没 URL → 继续查
          lastStatus = `状态"${status}"但未返回 result_url`;
          continue;
        }
        if (/失败|failed|error/i.test(status) || res.task?.error) {
          throw new Error(res.task?.error || `任务失败：${status}`);
        }
        lastStatus = `${status || '处理中'}${res.task?.progress != null ? ' ' + res.task.progress + '%' : ''}`;
      }
      // 30 秒没拿到
      const elapsed = Math.round((Date.now() - startedAt) / 1000);
      const linkUrl = `https://api.lk888.ai/admin`;  // 兜底
      toast(
        `同步超时（${elapsed}秒）\ntask_id=${taskId} 仍显示"${lastStatus || '处理中'}"\n去小马AI 后台查：${linkUrl}`,
        'warning',
        8000
      );
    } catch (err) {
      toast('同步失败：' + (err?.message || err), 'error');
    } finally {
      if (syncBtn) {
        syncBtn.disabled = false;
        syncBtn.textContent = '🔄 同步小马AI';
      }
      render();
      scheduleSaveWorkspace();
    }
  }

  // 单次查询 lk888 任务状态（不发请求重复用 api.js 的逻辑，复用 fetch + 字段兜底）
  async function queryOneTaskStatus(taskId) {
    const base = typeof getApiBase === 'function' ? getApiBase() : '';
    const buildEndpoint = (typeof buildApiEndpoint === 'function')
      ? (b, p) => buildApiEndpoint(b, p)
      : (b, p) => `${b.replace(/\/+$/, '')}${p.startsWith('/') ? p : '/' + p}`;
    const authHeaders = (typeof authHeaders === 'function')
      ? authHeaders
      : () => ({ 'Content-Type': 'application/json' });
    const endpoints = [
      buildEndpoint(base, `/v1/skills/task-status?task_id=${encodeURIComponent(taskId)}`),
      buildEndpoint(base, `/v1/media/status?task_id=${encodeURIComponent(taskId)}`)
    ];
    for (const endpoint of endpoints) {
      let res;
      try {
        res = await fetch(endpoint, { method: 'GET', headers: authHeaders() });
      } catch (e) {
        continue;
      }
      if (!res.ok) continue;
      const data = await res.json().catch(() => null);
      if (!data) continue;
      const task = data?.data?.data || data?.data || data;
      // 防御：响应里 task_id 必须跟请求一致
      if (task.task_id !== undefined && task.task_id !== null && String(task.task_id) !== String(taskId)) {
        console.warn(`[AI Canvas] 同步查询 task_id 不匹配: 期望 ${taskId}，收到 ${task.task_id}`);
        return null;
      }
      const url = task.result_url || task.url || task.image_url || task.output_url || task.image || task.data?.url || null;
      return { result_url: url && /^https?:\/\//.test(url) ? url : null, task };
    }
    return null;
  }

  // 把同步拿到的 result_url 写入 generate 节点（与正常完成路径一致）
  function applySyncedGenerateResult(node, resultUrl, task) {
    if (!node || !resultUrl) return;
    // 复用现有 appendGenerateVersion，构造与正常完成一致的版本对象
    const newVersion = appendGenerateVersion(node, resultUrl, {
      prompt: node.text || '',
      warnings: node.promptAudit || []
    }, null, '');
    node.status = 'done';
    node.debug = `已从小马AI 后台同步结果（task_id=${node.lastTaskId}${task?.status ? ' · ' + task.status : ''}）`;
    markUpstreamDirty(node.id);
    clearUpstreamDirty(node.id);
    toast(`生图已同步 ${newVersion?.label || ''}`, 'success');
  }

  // sketch 节点同步：从 lk888 后台手动提取分层渲染结果
  async function syncSketchTaskFromBackend(nodeId) {
    const node = getNode(nodeId);
    if (!node || node.type !== 'sketch') return;
    const taskId = node.lastTaskId;
    if (!taskId) { toast('没有可同步的任务 ID', 'error'); return; }

    const maxAttempts = 6;
    const intervalMs = 5000;
    let syncBtn = document.querySelector(`[data-sync-sketch="${nodeId}"]`);
    if (syncBtn) { syncBtn.disabled = true; syncBtn.textContent = '🔄 同步中…'; }

    try {
      for (let i = 0; i < maxAttempts; i++) {
        if (i > 0) await new Promise(r => setTimeout(r, intervalMs));
        let res;
        try { res = await queryOneTaskStatus(taskId); } catch (e) { continue; }
        if (!res) continue;
        if (res.result_url) {
          const sketch = getSketchState(node);
          sketch.image = res.result_url;
          node.image = res.result_url;
          node.status = 'done';
          node.debug = `已从小马AI 后台同步结果（task_id=${taskId}）`;
          markUpstreamDirty(node.id);
          clearUpstreamDirty(node.id);
          toast('分层渲染已同步', 'success');
          return;
        }
        const status = String(res.task?.status || res.task?.state || '');
        if (/失败|failed|error/i.test(status) || res.task?.error) {
          throw new Error(res.task?.error || `任务失败：${status}`);
        }
      }
      toast(`同步超时，task_id=${taskId} 仍在处理中`, 'warning', 8000);
    } catch (err) {
      toast('同步失败：' + (err?.message || err), 'error');
    } finally {
      if (syncBtn) { syncBtn.disabled = false; syncBtn.textContent = '🔄 同步小马AI'; }
      render();
      scheduleSaveWorkspace();
    }
  }

  // 渲染头部"上游统计"小条
  function renderUpstreamBar(node) {
    if (!node) return '';
    if (node.type === 'detail' || node.type === 'image') return '';  // detail/image 自己是源
    const imageUps = getUpstreamImageSources(node);
    const detailUps = getUpstreamDetailSources(node);
    const textUps = getUpstreamTextSources(node);
    if (imageUps.length === 0 && detailUps.length === 0 && textUps.length === 0) return '';
    const dirty = isNodeDirty(node);
    const dirtyUps = dirty ? getUpstreamDirtySources(node) : [];
    const dirtyAliases = dirtyUps.map(n => '@' + (n.alias || n.title || '图')).join(' ');
    const icon = dirty ? '⚠️' : '📥';
    const cls = dirty ? 'v2-node-upstream-bar dirty' : 'v2-node-upstream-bar';
    const parts = [];
    if (imageUps.length) parts.push(`${imageUps.length} 张图`);
    if (detailUps.length) parts.push(`${detailUps.length} 条产品资料`);
    if (textUps.length) parts.push(`${textUps.length} 条反推`);
    const summary = parts.join(' · ');
    const tip = dirty
      ? `上游已变更：${dirtyAliases || '图源'} 变了。点此节点上的"重跑"按钮刷新结果。`
      : `已接收 ${summary}`;
    return `
      <div class="${cls}" data-upstream-bar="${node.id}" title="${escHtml(tip)}">
        <span class="v2-node-upstream-icon">${icon}</span>
        <span class="v2-node-upstream-text">${dirty ? `上游已变更：${escHtml(dirtyAliases || '图源')}` : `收到 ${escHtml(summary)}`}</span>
        ${dirty ? `<button type="button" class="v2-node-upstream-rerun" data-rerun-dirty="${node.id}" title="用当前上游重新跑">↻ 重跑</button>` : ''}
      </div>`;
  }

  function nodeShell(node, selected, body) {
    const width = getNodeWidth(node);
    const height = getNodeBox(node).h;
    const kindLabel = nodeTypeLabel(node.type);
    const portY = Math.round(getMediaPortY(node));
    return `
      <section class="v2-node ${selected}" data-id="${node.id}" data-type="${node.type}" style="left:${node.x}px;top:${node.y}px;width:${width}px;height:${height}px;--port-y:${portY}px">
        <div class="v2-port in" data-port="in" data-id="${node.id}">+</div>
        <div class="v2-port out" data-port="out" data-id="${node.id}">+</div>
        <div class="v2-node-header" data-drag-handle="1">
          <div>
            <div class="v2-node-title">${escHtml(node.title)}</div>
            <div class="v2-node-kind">${escHtml(kindLabel)}${node.alias ? ' · @' + escHtml(node.alias) : ''}</div>
          </div>
          <button type="button" class="v2-node-delete" data-delete="${node.id}">×</button>
        </div>
        ${renderUpstreamBar(node)}
        ${body}
      </section>`;
  }

  function nodeTypeLabel(type) {
    if (type === 'image') return '图片';
    if (type === 'text') return '反推';
    if (type === 'cinema') return '电影提示词';
    if (type === 'detail') return '产品资料';
    if (type === 'sketch') return '分层渲染';
    if (type === 'detailPage') return '详情页流水线';
    if (type === 'tryOn') return '模特换装';
    if (type === 'generate') return '生图';
    return '节点';
  }

  // ==========================================================================
  // SECTION: 10 NODE-HTML
  // ==========================================================================
  function renderImageNode(node, selected) {
    const previewSize = getImagePreviewSize(node);
    const focusActive = state.regionEditor?.nodeId === node.id;
    const body = `
      <div class="v2-media-stage" style="width:${previewSize.width}px;height:${previewSize.height}px">
        <button type="button" class="v2-image-preview v2-media-preview ${node.image ? 'has-image' : ''}" data-preview-image="${node.id}" title="双击放大预览">
          ${node.image ? `<img src="${node.image}" alt="${escHtml(node.alias)}">` : renderImagePlaceholderIcon()}
        </button>
        ${focusActive ? renderFocusSelectionOverlay(node) : ''}
      </div>`;
    return nodeShell(node, selected, body);
  }

  function renderImagePlaceholderIcon() {
    return '<span class="v2-media-placeholder" aria-hidden="true"><span></span><i></i></span>';
  }

  function renderTextNode(node, selected) {
    const refs = collectRefsForNode(node);
    const display = String(node.result || node.text || '').trim();
    const idleText = node.status === 'generating' ? '正在反推设计骨架...' : DEFAULT_TEXT_PROMPT;
    const body = `
      <div class="v2-text-body">
        <div class="v2-text-display ${display ? '' : 'empty'}">${display ? escHtml(display) : escHtml(idleText)}</div>
      </div>
      ${renderDetailStrip(refs.details)}
      ${renderRefStrip(refs.images)}
      ${node.error ? `<div class="v2-result">${escHtml(node.error)}</div>` : ''}`;
    return nodeShell(node, selected, body);
  }

  function renderCinemaNode(node, selected) {
    const refs = collectRefsForNode(node);
    const settings = getCinemaSettings(node);
    const finalPrompt = String(node.result || '').trim();
    const draft = String(node.draft || '').trim();
    const roleLines = getCinemaImageRoles(node, refs)
      .map(item => `@${item.alias} · ${window.CinemaPrompt?.roleLabel?.(item.role) || item.role}`)
      .join(' / ');
    const status = node.status === 'generating'
      ? '正在按电影节点规则斟酌镜头、焦段、光线和自检...'
      : finalPrompt
        ? '已生成最终电影提示词，可连接到生图节点使用'
        : refs.images.length
          ? '已接入图片，可直接分析图片或补一句画面想法'
          : '可直接写一句画面想法生成第一版';
    const body = `
      <div class="v2-text-body v2-cinema-body">
        <div class="v2-text-display ${finalPrompt ? '' : 'empty'}">${escHtml(finalPrompt || status)}</div>
        ${draft ? `<div class="v2-cinema-draft">想法：${escHtml(draft)}</div>` : ''}
        ${settings.revisionSummary ? `<div class="v2-cinema-revision">${escHtml(settings.revisionSummary)}</div>` : ''}
      </div>
      ${roleLines ? `<div class="v2-ref-strip cinema">${escHtml(roleLines)}</div>` : renderRefStrip(refs.images)}
      ${renderDetailStrip(refs.details)}
      ${node.error ? `<div class="v2-result">${escHtml(node.error)}</div>` : ''}`;
    return nodeShell(node, selected, body);
  }

  function renderDetailNode(node, selected) {
    const detail = normalizeDetail(node.detail);
    const summary = detailSummary(detail);
    const hasContent = Boolean(detail.text || PRODUCT_FACT_FIELDS.some(([key]) => detail[key]));
    const body = `
      <div class="v2-detail-body">
        <div class="v2-detail-summary ${summary ? '' : 'empty'}">${summary ? escHtml(summary) : '填写产品资料，连到智能体或生图后使用'}</div>
        ${hasContent ? '' : '<div class="v2-detail-mini-grid"><span>未填写</span></div>'}
      </div>`;
    return nodeShell(node, selected, body);
  }

  function renderSketchNode(node, selected) {
    const sketch = getSketchState(node);
    const previewSize = getSketchPreviewSize(node);
    const hasImage = Boolean(sketch.image);
    // 同步按钮：没有图 + 有 taskId + (正在生成或出错或卡住)
    const showSyncButton = !hasImage && node.lastTaskId && (
      node.status === 'generating' ||
      node.status === 'error' ||
      /超时|0\s*处理中|0%|失败|0%进行中/i.test(node.debug || '')
    );
    const syncButtonHtml = showSyncButton
      ? `<button type="button" class="v2-generate-sync-chip" data-sync-sketch="${node.id}" title="去小马AI 后台查 task_id=${node.lastTaskId}">🔄 同步小马AI</button>`
      : '';
    const summary = node.status === 'generating'
      ? (sketch.segmentationStatus || 'AI 分层运行中')
      : (node.error || sketchMappingsSummary(node));
    const body = `
      <div class="v2-sketch-body">
        <button type="button" class="v2-sketch-preview ${sketch.image ? 'has-image' : ''}" data-preview-sketch="${node.id}" style="width:${previewSize.width}px;height:${previewSize.height}px" title="点击放大预览">
          ${sketch.image ? `<img src="${sketch.image}" alt="@${escHtml(node.alias)}">` : '<span>导入或连接图片</span>'}
        </button>
        ${syncButtonHtml}
        <div class="v2-sketch-meta">
          <span class="v2-alias">@${escHtml(node.alias)}</span>
          <small>${escHtml(summary || '自动分层后接入生图')}</small>
        </div>
      </div>`;
    return nodeShell(node, selected, body);
  }

  function renderDetailPageNode(node, selected) {
    const refs = collectRefsForNode(node);
    const groupId = node.settings?.detailPageGroupId || '';
    const nodes = getDetailPageGenerateNodes(groupId);
    const ready = nodes.filter(item => getActiveGenerateVersion(item)?.image || item.output).length;
    const screenCount = normalizeDetailPageScreenCount(node.settings?.screenCount || DETAIL_PAGE_DEFAULT_COUNT);
    const sourceSummary = getDetailPageSourceSummary(refs);
    const hasRefs = sourceSummary.hasUsableInput;
    const status = node.status === 'generating'
      ? (node.debug || '正在处理详情页...')
      : nodes.length
        ? `已创建 ${nodes.length} 屏，${ready}/${nodes.length} 已生成`
        : (hasRefs ? '素材已连接，点击后自动生成整套详情页' : '连接主图、参考图、产品资料后开始');
    const body = `
      <div class="v2-detail-workflow-body">
        <div class="v2-detail-workflow-status ${nodes.length ? 'ready' : ''}">${escHtml(status)}</div>
        ${node.settings?.assistantPlan?.text ? '<div class="v2-detail-workflow-plan">已写入智能体方案</div>' : ''}
        <div class="v2-detail-workflow-sources">
          <span class="${sourceSummary.subject ? 'ready' : ''}">主图 ${sourceSummary.subject ? '@' + escHtml(sourceSummary.subject.alias || sourceSummary.subject.title || '图') : '未连'}</span>
          <span class="${sourceSummary.references.length ? 'ready' : ''}">参考图 ${sourceSummary.references.length}张</span>
          <span class="${sourceSummary.details.length ? 'ready' : ''}">产品资料 ${sourceSummary.details.length}条</span>
          <span class="${sourceSummary.textInputs.length ? 'ready' : ''}">反推 ${sourceSummary.textInputs.length}条</span>
        </div>
        <div class="v2-detail-workflow-counts">
          ${DETAIL_PAGE_COUNT_OPTIONS.map(count => `
            <button type="button" class="${count === screenCount ? 'active' : ''}" data-detail-node-count="${node.id}" data-count="${count}">${count}屏</button>
          `).join('')}
        </div>
        <div class="v2-detail-workflow-actions">
          <button type="button" data-run-detail-storyboard="${node.id}" ${hasRefs && node.status !== 'generating' ? '' : 'disabled'}>${nodes.length ? '重做详情页' : '生成详情页'}</button>
          <button type="button" data-run-detail-batch="${node.id}" ${nodes.length && ready < nodes.length && !state.detailPageBatchRunning ? '' : 'disabled'}>批量生成</button>
          <button type="button" data-open-detail-preview="${groupId}" ${nodes.length ? '' : 'disabled'}>看衔接</button>
        </div>
        ${node.error ? `<div class="v2-detail-workflow-error">${escHtml(node.error)}</div>` : ''}
      </div>`;
    return nodeShell(node, selected, body);
  }

  function renderTryOnNode(node, selected) {
    const refs = collectRefsForNode(node);
    const settings = getTryOnSettings(node);
    const garmentRef = refs.images.find(ref => ref.id === settings.garmentSourceId) || null;
    const modelRef = refs.images.find(ref => ref.id === settings.modelSourceId) || null;
    const backgroundRefs = refs.images.filter(ref => settings.backgroundReferenceIds.includes(ref.id));
    const garmentNode = getNode(settings.garmentGenerateId);
    const tryOnNode = getNode(settings.tryOnGenerateId);
    const poseNodes = settings.poseGenerateIds.map(getNode).filter(node => node?.type === 'generate');
    const garmentImage = getActiveGenerateVersion(garmentNode)?.image || garmentNode?.output || '';
    const tryOnImage = getActiveGenerateVersion(tryOnNode)?.image || tryOnNode?.output || '';
    const poseReady = poseNodes.filter(node => getActiveGenerateVersion(node)?.image || node.output).length;
    const ready = Boolean(garmentRef && modelRef);
    const running = node.status === 'generating';
    const status = running
      ? (node.debug || '正在处理换装...')
      : tryOnImage
        ? '换装成片已生成'
        : garmentImage
          ? '白底穿搭图已生成；再次开始会重新提取并换装'
          : ready
            ? '已指定服装和模特，点击开始生成会自动先提取白底穿搭图，再生成换装成片'
            : '请先连接图片，并指定服装来源图和模特图';
    const imageRows = refs.images.length
      ? refs.images.slice(0, 8).map(ref => renderTryOnSourceRow(node, ref, settings)).join('')
      : '<div class="v2-tryon-empty">把服装来源图和模特图连接到换装节点</div>';
    const modelRegion = settings.modelRegion?.enabled && settings.modelRegion?.rect;
    const body = `
      <div class="v2-tryon-body">
        <div class="v2-tryon-status ${tryOnImage ? 'ready' : ''}">${escHtml(status)}</div>
        <div class="v2-tryon-slots">
          ${renderTryOnSlot('服装来源', garmentRef, '用于提取白底穿搭图')}
          ${renderTryOnSlot('模特图', modelRef, modelRegion ? '已框选服装鞋履区域' : '保留脸、动作、背景')}
          ${renderTryOnSlot('背景场景', backgroundRefs.length ? backgroundRefs[0] : null, backgroundRefs.length ? `${backgroundRefs.length} 张背景/光线参考` : '默认用模特图背景')}
          ${renderTryOnSlot('白底穿搭', garmentImage ? { image: garmentImage, alias: garmentNode?.title || '白底穿搭' } : null, '中间结果会保留')}
        </div>
        <div class="v2-tryon-source-list">${imageRows}</div>
        <div class="v2-tryon-pose">
          <label class="v2-tryon-pose-toggle">
            <input type="checkbox" data-tryon-pose-toggle="${node.id}" ${settings.poseChangeEnabled ? 'checked' : ''} ${running ? 'disabled' : ''}>
            <span>模特动作</span>
            <small>${settings.poseChangeEnabled ? `额外生成 ${settings.poseVariantCount} 张动作版本` : '默认关闭，不额外扣费'}</small>
          </label>
          ${settings.poseChangeEnabled ? `
            <div class="v2-tryon-pose-count">
              ${[1, 2, 3, 4].map(count => `<button type="button" class="${settings.poseVariantCount === count ? 'active' : ''}" data-tryon-pose-count="${node.id}" data-count="${count}" ${running ? 'disabled' : ''}>+${count}</button>`).join('')}
            </div>
          ` : ''}
        </div>
        <div class="v2-tryon-actions">
          <button type="button" data-open-tryon-region="${node.id}" ${modelRef && !running ? '' : 'disabled'}>${modelRegion ? '重框服装鞋履' : '框选服装鞋履'}</button>
          <button type="button" data-run-tryon-all="${node.id}" ${ready && !running ? '' : 'disabled'}>一键换装</button>
        </div>
        ${tryOnImage ? `<button type="button" class="v2-tryon-result" data-preview-output="${escHtml(tryOnNode?.id || '')}"><img src="${tryOnImage}" alt="换装成片"><span>预览换装结果</span></button>` : ''}
        ${poseNodes.length ? `<div class="v2-tryon-pose-status">动作版本：${poseReady}/${poseNodes.length} 张已生成</div>` : ''}
        ${node.error ? `<div class="v2-detail-workflow-error">${escHtml(node.error)}</div>` : ''}
      </div>`;
    return nodeShell(node, selected, body);
  }

  function renderTryOnSlot(label, ref, hint) {
    return `
      <div class="v2-tryon-slot ${ref?.image ? 'ready' : ''}">
        ${ref?.image ? `<img src="${ref.image}" alt="${escHtml(label)}">` : '<span></span>'}
        <strong>${escHtml(label)}</strong>
        <small>${escHtml(ref?.alias ? '@' + ref.alias : hint)}</small>
      </div>`;
  }

  function renderTryOnSourceRow(node, ref, settings) {
    const isGarment = ref.id === settings.garmentSourceId;
    const isModel = ref.id === settings.modelSourceId;
    const isBackground = settings.backgroundReferenceIds.includes(ref.id);
    return `
      <div class="v2-tryon-source ${isGarment || isModel || isBackground ? 'selected' : ''}">
        <button type="button" class="v2-tryon-thumb" data-preview-image="${ref.id}" title="@${escHtml(ref.alias || ref.title || '图')}"><img src="${ref.image}" alt="@${escHtml(ref.alias || '')}"></button>
        <div class="v2-tryon-source-meta">
          <strong>@${escHtml(ref.alias || ref.title || '图')}</strong>
          <span>${isGarment ? '服装来源' : isModel ? '模特图' : isBackground ? '背景场景' : '未指定'}</span>
        </div>
        <div class="v2-tryon-source-actions">
          <button type="button" class="${isGarment ? 'active' : ''}" data-tryon-role="${node.id}" data-image-id="${ref.id}" data-role="garment">设为服装</button>
          <button type="button" class="${isModel ? 'active' : ''}" data-tryon-role="${node.id}" data-image-id="${ref.id}" data-role="model">设为模特</button>
          <button type="button" class="${isBackground ? 'active' : ''}" data-tryon-role="${node.id}" data-image-id="${ref.id}" data-role="background">设为背景</button>
        </div>
      </div>`;
  }

  function renderGenerateNode(node, selected) {
    const isSelected = isNodeSelected(node.id);
    normalizeGenerateSizeSettings(node);
    normalizeGenerateReferenceMode(node);
    normalizeGenerateModelSettings(node);
    const versions = normalizeGenerateVersions(node);
    const activeVersion = getActiveGenerateVersion(node);
    const output = activeVersion?.image || node.output || '';
    const runState = getGenerateRunState(node.id);
    const previewSize = getGeneratePreviewSize(node);
    const multi = versions.length > 1;
    const activeIndex = Math.max(0, versions.findIndex(version => version.id === node.activeVersionId));
    const refs = isSelected ? collectRefsForNode(node) : null;
    const compiled = isSelected ? buildCompiledPrompt(node, refs) : null;
    const imageRoles = isSelected ? new Map(compiled.imageRoles.map(info => [info.id, info])) : new Map();
    const requestImageIds = isSelected ? new Set(compiled.requestImages.map(item => item.id)) : new Set();
    const subjectRef = isSelected ? getCompiledSubjectRef(refs.images, compiled, node) : null;
    const structureOnlyImages = isSelected ? refs.images.filter(ref => !requestImageIds.has(ref.id)) : [];
    const visibleImageInputs = isSelected ? [...compiled.requestImages, ...structureOnlyImages] : [];
    const validRegion = isSelected ? getValidRegionEdit(node, subjectRef) : null;
    const resultRegion = getValidResultRegionEdit(node, activeVersion);
    const resultFocusActive = state.regionEditor?.nodeId === node.id && state.regionEditor?.source === 'generated-version';
    const preview = output
      ? `<img src="${output}" alt="生成结果">`
      : (runState ? getGenerateRunPreviewText(runState) : renderImagePlaceholderIcon());
    const hasPreviewImage = Boolean(output);
    // UI 同步：决定是否显示"同步小马AI 后台"按钮
    const showSyncButton = !hasPreviewImage && node.lastTaskId && (
      (node.status === 'generating' && runState) ||
      node.status === 'error' ||
      /超时|0\s*处理中|0%|失败|0%进行中/i.test(node.debug || '')
    );
    const syncButtonHtml = showSyncButton
      ? `<button type="button" class="v2-generate-sync-chip" data-sync-generate="${node.id}" title="去小马AI 后台查 task_id=${node.lastTaskId}">🔄 同步小马AI</button>`
      : '';
    const body = `
      <div class="v2-generate-stage v2-media-stage" style="width:${previewSize.width}px;height:${previewSize.height}px">
        <div class="v2-generate-stack ${multi ? 'stacked' : ''}" style="width:${previewSize.width}px;height:${previewSize.height}px">
          ${multi ? '<span class="v2-generate-card-back back-2"></span><span class="v2-generate-card-back back-1"></span>' : ''}
          ${multi ? `<button type="button" class="v2-ver-arrow left" data-step-version="${node.id}" data-dir="-1" title="上一张">&#8249;</button>` : ''}
          <button type="button" class="v2-generate-preview v2-media-preview ${hasPreviewImage ? 'has-output' : ''}" data-preview-output="${node.id}" title="${escHtml(previewSize.ratioLabel)} · 双击放大预览">${preview}</button>
          ${resultRegion ? renderSavedFocusOverlay(resultRegion) : ''}
          ${resultFocusActive ? renderFocusSelectionOverlay(node) : ''}
          ${runState ? `<button type="button" class="v2-generate-cancel-chip ${canCancelGenerateRun(runState) ? '' : 'busy'}" ${canCancelGenerateRun(runState) ? `data-cancel-generate="${node.id}"` : 'disabled'} title="${escHtml(getGenerateCancelHint(runState))}">${escHtml(getGenerateCancelLabel(runState))}</button>` : ''}
          ${syncButtonHtml}
          ${multi ? `<button type="button" class="v2-ver-arrow right" data-step-version="${node.id}" data-dir="1" title="下一张">&#8250;</button>` : ''}
          ${multi ? `<span class="v2-generate-version-badge">${escHtml(getGenerateVersionLabel(activeVersion, activeIndex))} / ${versions.length}</span>` : ''}
        </div>
      </div>
      ${isSelected ? renderGenerateInlineComposer(node, refs, {
        compiled,
        imageRoles,
        requestImageIds,
        visibleImageInputs,
        subjectRef,
        runState,
        validRegion
      }) : ''}
      ${node.error ? `<div class="v2-result">${escHtml(node.error)}</div>` : ''}`;
    return nodeShell(node, selected, body);
  }

  function renderGeneratePanels() {
    return state.nodes
      .filter(node => node.type === 'generate' && node.id === state.selectedId)
      .map(renderGeneratePanel)
      .join('');
  }

  function renderSavedFocusOverlay(region) {
    if (!region?.rect) return '';
    return `<span class="v2-focus-saved-box" style="left:${region.rect.x * 100}%;top:${region.rect.y * 100}%;width:${region.rect.w * 100}%;height:${region.rect.h * 100}%"></span>`;
  }

  function renderFocusSelectionOverlay(node) {
    const editor = state.regionEditor?.nodeId === node.id ? state.regionEditor : null;
    const rect = editor?.rect || null;
    return `
          <div class="v2-focus-layer ${editor?.drag ? 'dragging' : ''}" data-focus-stage="${node.id}">
            ${rect ? `<span class="v2-focus-selection" style="left:${rect.x * 100}%;top:${rect.y * 100}%;width:${rect.w * 100}%;height:${rect.h * 100}%"></span>` : '<span class="v2-focus-crosshair"></span>'}
            <div class="v2-focus-tip">请在图片上框选聚焦区域</div>
            ${rect ? `
              <div class="v2-focus-confirm">
                <button type="button" class="v2-focus-cancel" data-focus-cancel="${node.id}">取消</button>
                <button type="button" class="v2-focus-save" data-focus-confirm="${node.id}">确认</button>
              </div>` : ''}
          </div>`;
  }

  function renderGenerateInlineComposer(node, refs, meta) {
    const promptText = getGeneratePromptText(node);
    const runState = meta.runState;
    const canCancelRun = canCancelGenerateRun(runState);
    const actionLabel = runState ? getGenerateCancelLabel(runState) : '生成';
    const actionClass = runState ? (canCancelRun ? 'danger' : 'busy') : '';
    const actionAttr = runState
      ? (canCancelRun ? `data-cancel-generate="${node.id}"` : 'disabled')
      : `data-run-generate="${node.id}"`;
    const actionHint = runState ? getGenerateCancelHint(runState) : '生成图片';
    const previewWidth = getGeneratePreviewSize(node).width;
    const previewHeight = getGeneratePreviewSize(node).height;
    const composerLeft = Math.round((previewWidth - GENERATE_COMPOSER_W) / 2);
    const activeVersion = getActiveGenerateVersion(node);
    const resultRegion = getValidResultRegionEdit(node, activeVersion);
    const resultRegionState = getResultRegionEditState(node);
    return `
      <div class="v2-generate-composer" data-panel-for="${node.id}" style="left:${composerLeft}px;top:${previewHeight + GENERATE_COMPOSER_GAP}px;width:${GENERATE_COMPOSER_W}px">
        <div class="v2-composer-tabs">
          ${renderComposerTab('聚焦', '▣', Boolean(meta.validRegion), `data-open-region="${node.id}" ${meta.subjectRef ? '' : 'disabled'} title="在上游主图节点框选聚焦区域"`)}
          ${renderComposerTab('结果框选', '◱', Boolean(resultRegion), `data-open-result-region="${node.id}" ${activeVersion?.image ? '' : 'disabled'} title="在当前生成结果上框选局部续改区域"`)}
        </div>
        <div class="v2-composer-main">
          <div class="v2-highlight-wrap v2-composer-prompt">
            <pre class="v2-prompt-highlight" data-panel-highlight="${node.id}">${renderPromptHighlight(promptText, refs.images)}</pre>
            <textarea class="v2-panel-textarea" data-panel-text="${node.id}" placeholder="写整图提示词，支持 @ 引用已连接图片；智能体写入也会进入这里。">${escHtml(promptText)}</textarea>
          </div>
        ${renderFocusPromptSlot(node, refs, meta)}
        ${renderResultRegionPromptSlot(node, resultRegionState, resultRegion)}
        <div class="v2-composer-toolbar">
          <div class="v2-composer-left">
            ${renderImageInputStrip(meta.visibleImageInputs, meta.imageRoles, meta.requestImageIds)}
            ${renderUpstreamMetaChips(refs.textInputs, refs.details)}
            ${renderSettingPickerPill(node, 'model', '✣', shortModelLabel(node.settings.model), getModelPickerOptions(node.settings.model), '模型')}
            ${renderRatioPill(node)}
            ${renderSettingPickerPill(node, 'quality', '◐', qualityLabel(node.settings.quality), getQualityPickerOptions(node.settings.quality), '画质')}
            ${renderSettingPickerPill(node, 'n', '↯', `${Number(node.settings.n) || 1}张`, getCountPickerOptions(node.settings.n), '数量')}
          </div>
          <button class="v2-composer-send ${actionClass}" type="button" ${actionAttr} title="${escHtml(actionHint)}">↑</button>
        </div>
      </div>
    </div>`;
  }

  function renderComposerTab(label, icon, active, attrs = '') {
    return `<button type="button" class="v2-composer-tab ${active ? 'active' : ''}" ${attrs}><span>${escHtml(icon)}</span>${escHtml(label)}</button>`;
  }

  function renderFocusPromptSlot(node, refs, meta) {
    const region = getRegionEditState(node);
    if (!meta.validRegion && !region.prompt) return '';
    const title = meta.validRegion
      ? `聚焦区域 · @${meta.validRegion.sourceAlias || '主图'}`
      : '聚焦区域已失效';
    return `
          <div class="v2-focus-prompt-slot ${meta.validRegion ? 'active' : 'stale'}">
            <div class="v2-focus-prompt-head">
              <span class="v2-focus-thumb" aria-hidden="true"></span>
              <span>${escHtml(title)}</span>
              <button type="button" data-clear-region="${node.id}">清除</button>
            </div>
            <div class="v2-highlight-wrap v2-region-highlight-wrap">
              <pre class="v2-prompt-highlight" data-region-highlight="${node.id}">${renderPromptHighlight(region.prompt || '', refs.images)}</pre>
              <textarea class="v2-region-prompt" data-region-prompt="${node.id}" placeholder="只写框内怎么改，可 @引用已连接特写图补细节。">${escHtml(region.prompt || '')}</textarea>
            </div>
          </div>`;
  }

  function renderResultRegionPromptSlot(node, region, validRegion) {
    if (!validRegion && !region.prompt) return '';
    const title = validRegion
      ? `结果框选 · ${getGenerateVersionLabel(getActiveGenerateVersion(node), 0)}`
      : '结果框选已失效';
    return `
          <div class="v2-focus-prompt-slot result ${validRegion ? 'active' : 'stale'}">
            <div class="v2-focus-prompt-head">
              <span class="v2-focus-thumb" aria-hidden="true"></span>
              <span>${escHtml(title)}</span>
              <button type="button" data-clear-result-region="${node.id}">清除</button>
            </div>
            <div class="v2-highlight-wrap v2-region-highlight-wrap">
              <pre class="v2-prompt-highlight" data-result-region-highlight="${node.id}">${escHtml(region.prompt || '')}</pre>
              <textarea class="v2-region-prompt" data-result-region-prompt="${node.id}" placeholder="只写当前生成结果框内怎么改；框外尽量保持。">${escHtml(region.prompt || '')}</textarea>
            </div>
          </div>`;
  }

  function renderImageInputStrip(images = [], imageRoles = new Map(), requestImageIds = new Set()) {
    if (!images.length) return '';
    return `<div class="v2-composer-refs">${images.slice(0, 4).map(ref => {
      const roleInfo = imageRoles.get(ref.id) || { label: '输入图', role: 'unknown' };
      const isImageInput = requestImageIds.has(ref.id);
      return `<button type="button" class="v2-composer-ref ${isImageInput ? 'active' : ''}" data-input-image-id="${ref.id}" data-preview-image="${ref.id}" title="@${escHtml(ref.alias)} · ${escHtml(roleInfo.label)}"><img src="${ref.image}" alt="@${escHtml(ref.alias)}"></button>`;
    }).join('')}</div>`;
  }

  function renderUpstreamMetaChips(textInputs = [], details = []) {
    const chips = [];
    textInputs.forEach(ref => {
      const isAssistant = ref.kind === 'assistant';
      const cls = isAssistant ? 'assistant' : 'text';
      const label = isAssistant ? '智能体' : (ref.title || '反推');
      const status = ref.ready ? '已接入' : '等待生成';
      const readyCls = ref.ready ? 'ready' : 'pending';
      chips.push(`<span class="v2-composer-meta-chip ${cls} ${readyCls}" title="${escHtml(label)} · ${escHtml(status)}"><strong>${escHtml(label)}</strong><small>${escHtml(status)}</small></span>`);
    });
    details.forEach(ref => {
      const label = ref.title || '产品资料';
      const status = ref.summary ? '已接入' : '已连接';
      chips.push(`<span class="v2-composer-meta-chip detail ready" title="${escHtml(label)} · ${escHtml(status)}"><strong>${escHtml(label)}</strong><small>${escHtml(status)}</small></span>`);
    });
    if (!chips.length) return '';
    return `<div class="v2-composer-meta-chips">${chips.join('')}</div>`;
  }

  function renderSettingPickerPill(node, setting, icon, text, options, title) {
    const popoverOpen = state.settingPopover?.nodeId === node.id && state.settingPopover?.setting === setting;
    return `
      <span class="v2-setting-anchor ${popoverOpen ? 'open' : ''}">
        <button class="v2-composer-pill setting ${popoverOpen ? 'active' : ''}" type="button" data-toggle-setting-popover="${node.id}" data-setting-name="${escHtml(setting)}" title="${escHtml(title)}">
          <span>${escHtml(icon)}</span>
          <strong>${escHtml(text)}</strong>
          <span>⌄</span>
        </button>
        ${popoverOpen ? renderSettingPopover(node, setting, title, options) : ''}
      </span>`;
  }

  function renderSettingPopover(node, setting, title, options = []) {
    const layout = options.length > 4 ? 'wide' : 'compact';
    const safeSetting = escHtml(setting);
    const manualModelAction = setting === 'model'
      ? `<button type="button" class="manual" data-add-manual-image-model="${node.id}">
          <span class="v2-setting-option-icon">＋</span>
          <strong>手动输入模型名</strong>
          <small>用于模型广场有、/v1/models 未返回的模型</small>
        </button>`
      : '';
    return `
        <div class="v2-setting-popover ${layout}" data-setting-popover="${node.id}" data-setting-popover-name="${safeSetting}">
          <div class="v2-ratio-popover-title">${escHtml(title)}</div>
          <div class="v2-setting-option-grid ${layout}">
            ${options.map(option => `
              <button type="button" class="${option.active ? 'active' : ''}" data-set-setting="${node.id}" data-setting-name="${safeSetting}" data-setting-value="${escHtml(option.value)}" ${option.disabled ? 'disabled' : ''}>
                ${option.icon ? `<span class="v2-setting-option-icon">${escHtml(option.icon)}</span>` : ''}
                <strong>${escHtml(option.label)}</strong>
                ${option.hint ? `<small>${escHtml(option.hint)}</small>` : ''}
              </button>`).join('')}
            ${manualModelAction}
          </div>
        </div>`;
  }

  function renderSettingSelectPill(setting, icon, text, options, title) {
    return `
      <label class="v2-composer-pill select" title="${escHtml(title)}">
        <span>${escHtml(icon)}</span>
        <strong>${escHtml(text)}</strong>
        <select data-setting="${escHtml(setting)}">${options}</select>
      </label>`;
  }

  function renderRatioPill(node) {
    return `
      <span class="v2-ratio-anchor">
        <button class="v2-composer-pill ratio ${state.ratioPopoverNodeId === node.id ? 'active' : ''}" type="button" data-toggle-ratio-popover="${node.id}" title="比例和分辨率">
          ${renderRatioIcon(node.settings.ratio)}
          <strong>${escHtml(node.settings.ratio || '1:1')} · ${escHtml(node.settings.resolution || '1K')}</strong>
          <span>⌄</span>
        </button>
        ${state.ratioPopoverNodeId === node.id ? renderRatioPopover(node) : ''}
      </span>`;
  }

  function renderRatioIcon(ratio) {
    const item = getRatioOption(ratio);
    const parsed = ratioToParts(item.value);
    const wide = parsed.w >= parsed.h;
    return `<i class="v2-ratio-icon ${wide ? 'wide' : 'tall'}" aria-hidden="true"></i>`;
  }

  function renderRatioPopover(node) {
    const ratio = node.settings.ratio || '1:1';
    const resolution = node.settings.resolution || '1K';
    return `
        <div class="v2-ratio-popover" data-ratio-popover="${node.id}">
          <div class="v2-ratio-popover-title">分辨率</div>
          <div class="v2-resolution-tabs">
            ${RESOLUTION_PICKER_OPTIONS.map(item => {
              const available = getResolutionCandidates(item).length > 0;
              const currentAvailable = Boolean(getRatioOption(ratio).sizes[item]);
              return `<button type="button" class="${item === resolution ? 'active' : ''} ${currentAvailable ? '' : 'will-switch'}" data-set-resolution="${node.id}" data-resolution="${escHtml(item)}" ${available ? '' : 'disabled'}>${escHtml(item)}</button>`;
            }).join('')}
          </div>
          <div class="v2-ratio-popover-title">比例</div>
          <div class="v2-ratio-grid">
            ${RATIO_PICKER_OPTIONS.map(item => {
              const value = item.value === 'auto' ? ratio : item.value;
              const option = getRatioOption(value);
              const available = item.value === 'auto' || Boolean(option.sizes[resolution]);
              const active = item.value !== 'auto' && value === ratio;
              return `
                <button type="button" class="${active ? 'active' : ''}" data-set-ratio="${node.id}" data-ratio="${escHtml(item.value)}" ${available ? '' : 'disabled'}>
                  ${renderRatioIcon(value)}
                  <span>${escHtml(item.label)}</span>
                </button>`;
            }).join('')}
          </div>
        </div>`;
  }

  function ratioToParts(value) {
    const match = String(value || '').match(/^(\d+):(\d+)$/);
    if (!match) return { w: 1, h: 1 };
    return { w: Number(match[1]) || 1, h: Number(match[2]) || 1 };
  }

  function shortModelLabel(model) {
    const value = String(model || '').trim();
    if (!value) return '模型';
    return value.length > 16 ? value.slice(0, 13) + '...' : value;
  }

  function qualityLabel(value) {
    if (value === 'auto') return '自动';
    if (value === 'medium') return '标准';
    if (value === 'low') return '快速';
    return '高清';
  }

  function qualityOptions(current) {
    return [
      ['auto', '自动'],
      ['high', '高清'],
      ['medium', '标准'],
      ['low', '快速']
    ].map(([value, label]) => `<option value="${value}" ${current === value ? 'selected' : ''}>${label}</option>`).join('');
  }

  function countOptions(current) {
    const value = Number(current) || 1;
    return [1, 2, 4].map(item => `<option value="${item}" ${value === item ? 'selected' : ''}>${item}张</option>`).join('');
  }

  function getModelPickerOptions(current) {
    const models = loadAvailableImageModels();
    const selected = String(current || '').trim();
    if (!models.length) {
      if (selected) return [{ value: selected, label: selected, hint: '未检测', active: true }];
      return [{ value: '', label: '请先检测模型', hint: '在参数面板检测', active: true, disabled: true }];
    }
    const active = models.includes(selected) ? selected : models[0];
    return models.map(model => ({
      value: model,
      label: model,
      active: model === active
    }));
  }

  function getQualityPickerOptions(current) {
    const selected = ['auto', 'high', 'medium', 'low'].includes(current) ? current : 'high';
    return [
      { value: 'auto', label: '自动' },
      { value: 'high', label: '高清' },
      { value: 'medium', label: '标准' },
      { value: 'low', label: '快速' }
    ].map(option => ({ ...option, active: option.value === selected }));
  }

  function getCountPickerOptions(current) {
    const selected = getGenerateRequestCount({ settings: { n: current } });
    return GENERATE_COUNT_OPTIONS.map(value => ({
      value: String(value),
      label: `${value}张`,
      active: value === selected
    }));
  }

  function applyGenerateSetting(node, setting, value) {
    if (!node || !setting) return;
    if (setting === 'model' && !value) return;
    node.settings = { ...(node.settings || {}) };
    node.settings[setting] = setting === 'n' ? normalizeGenerateCount(value) : value;
    if (setting === 'model' && value) setSelectedImageModel(value);
    state.settingPopover = null;
    scheduleSaveWorkspace();
    render();
  }

  function addManualImageModelForGenerate(nodeId) {
    const node = getNode(nodeId);
    if (!node || node.type !== 'generate') return;
    const current = String(node.settings?.model || getSelectedImageModel?.() || '').trim();
    const value = prompt('手动输入生图模型名（例如：gpt-image-2-flatfee-2k）', current);
    const model = String(value || '').trim();
    if (!model) return;
    if (!/^[A-Za-z0-9._:/+-]+$/.test(model)) {
      toast('模型名包含不支持的字符，请检查后重试', 'error');
      return;
    }
    if (typeof addManualImageModel === 'function') addManualImageModel(model, getApiBase());
    node.settings = { ...(node.settings || {}), model };
    if (typeof setSelectedImageModel === 'function') setSelectedImageModel(model);
    state.settingPopover = null;
    scheduleSaveWorkspace();
    recordAppLog('info', {
      source: 'models',
      title: '已手动添加生图模型',
      summary: model,
      detail: { baseUrl: getApiBase(), model }
    });
    render();
    toast('已添加模型：' + model, 'success');
  }

  function normalizeGenerateCount(value) {
    const requested = Number(value) || 1;
    if (GENERATE_COUNT_OPTIONS.includes(requested)) return requested;
    return GENERATE_COUNT_OPTIONS.reduce((best, item) => (
      Math.abs(item - requested) < Math.abs(best - requested) ? item : best
    ), 1);
  }

  function getGenerateRequestCount(node) {
    return normalizeGenerateCount(node?.settings?.n);
  }

  // ==========================================================================
  // SECTION: 11 PANEL-HTML
  // ==========================================================================
  function renderImagePanels() {
    return '';
  }

  function renderTextPanels() {
    return state.nodes
      .filter(node => node.type === 'text' && node.id === state.selectedId)
      .map(renderTextPanel)
      .join('');
  }

  function renderCinemaPanels() {
    return state.nodes
      .filter(node => node.type === 'cinema' && node.id === state.selectedId)
      .map(renderCinemaPanel)
      .join('');
  }

  function renderSelectedPanel() {
    return renderImagePanels() + renderTextPanels() + renderCinemaPanels() + renderDetailPanels() + renderSketchPanels();
  }

  function renderImagePanel(node) {
    if (!node.image) return '';
    const box = getNodeBox(node);
    const panelX = Math.round(node.x + box.w / 2 - TEXT_PANEL_W / 2);
    const panelY = node.y + box.h + NODE_PANEL_GAP;
    const region = getRegionEditState(node);
    const status = region.rect
      ? `聚焦 ${Math.round(region.rect.w * 100)}% x ${Math.round(region.rect.h * 100)}%`
      : '未设置聚焦';
    return `
      <section class="v2-node-panel v2-image-node-panel" data-image-panel-for="${node.id}" style="left:${panelX}px;top:${panelY}px">
        <div class="v2-panel-glow"></div>
        <div class="v2-panel">
          <div class="v2-panel-head compact">
            <div>
              <div class="v2-panel-title">${escHtml(node.title)} · 聚焦区域</div>
              <div class="v2-panel-sub">直接在这张图片上框选，连接到生图后自动作为局部重绘 mask</div>
            </div>
            <button class="v2-header-btn" type="button" data-open-image-region="${node.id}">${region.rect ? '重选' : '框选'}</button>
          </div>
          <div class="v2-panel-section">
            <div class="v2-region-card ${region.rect ? 'active' : ''}">
              <div class="v2-region-card-head">
                <div>
                  <strong>@${escHtml(node.alias || node.title || '图片')}</strong>
                  <span>${escHtml(status)}</span>
                </div>
                <div class="v2-region-card-actions">
                  <button class="v2-mini-action" type="button" data-open-image-region="${node.id}">${region.rect ? '重选区域' : '框选区域'}</button>
                  <button class="v2-mini-action" type="button" data-clear-region="${node.id}" ${region.rect || region.prompt ? '' : 'disabled'}>清除聚焦</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>`;
  }

  function renderTextPanel(node) {
    const refs = collectRefsForNode(node);
    const box = getNodeBox(node);
    const panelX = Math.round(node.x + box.w / 2 - TEXT_PANEL_W / 2);
    const panelY = node.y + box.h + NODE_PANEL_GAP;
    const template = getTextTemplateKey(node);
    return `
      <section class="v2-node-panel v2-text-node-panel" data-text-panel-for="${node.id}" style="left:${panelX}px;top:${panelY}px">
        <div class="v2-panel-glow"></div>
        <div class="v2-panel">
          <div class="v2-panel-head compact">
            <div>
              <div class="v2-panel-title">${escHtml(node.title)} · 快速反推</div>
              <div class="v2-panel-sub">从参考素材提取可迁移版式/风格骨架，不确认最终主图</div>
            </div>
            <button class="v2-header-btn" type="button" data-run-text="${node.id}" ${node.status === 'generating' ? 'disabled' : ''}>${node.status === 'generating' ? '生成中...' : '生成'}</button>
          </div>
          <div class="v2-panel-section">
            <label class="v2-label">反推模式</label>
            <select class="v2-template-select v2-template-select-panel" data-text-template="${node.id}">${textTemplateOptions(template)}</select>
          </div>
          <div class="v2-panel-section">
            <label class="v2-label">反推骨架（可修改）</label>
            <textarea class="v2-text-result-editor ${String(node.result || node.text || '').trim() ? '' : 'empty'}" data-text-result="${node.id}" placeholder="连接参考图后点击生成；生图节点可读取这段骨架，但最终主图/参考图仍在生图输入框确认。">${escHtml(node.result || node.text || '')}</textarea>
          </div>
          <div class="v2-text-panel-foot">
            <select data-text-model="${node.id}">${textModelOptions(resolveTextModel(node))}</select>
            <button class="v2-action" type="button" data-run-text="${node.id}" ${node.status === 'generating' ? 'disabled' : ''}>${node.status === 'generating' ? '生成中...' : '生成反推'}</button>
          </div>
        </div>
      </section>`;
  }

  function renderCinemaPanel(node) {
    const refs = collectRefsForNode(node);
    const box = getNodeBox(node);
    const panelX = Math.round(node.x + box.w / 2 - TEXT_PANEL_W / 2);
    const panelY = node.y + box.h + NODE_PANEL_GAP;
    const settings = getCinemaSettings(node);
    const finalPrompt = String(node.result || '').trim();
    const boundSummary = getCinemaBoundGenerateSummary(node);
    const boundNode = getCinemaBoundGenerate(node);
    const boundRunning = Boolean(boundNode && (boundNode.status === 'generating' || getGenerateRunState(boundNode.id)));
    const roleInfos = getCinemaImageRoles(node, refs);
    const structured = settings.structuredFields || {};
    const fieldsPreview = Object.entries(structured)
      .filter(([, value]) => String(value || '').trim())
      .map(([key, value]) => `【${key}】${value}`)
      .join('\n');
    return `
      <section class="v2-node-panel v2-cinema-node-panel" data-cinema-panel-for="${node.id}" style="left:${panelX}px;top:${panelY}px">
        <div class="v2-panel-glow"></div>
        <div class="v2-panel">
          <div class="v2-panel-head compact">
            <div>
              <div class="v2-panel-title">${escHtml(node.title)} · 电影提示词</div>
              <div class="v2-panel-sub">内置 ${escHtml(settings.sourceVersion || CINEMA_SOURCE_VERSION)}，按想法和图片选择焦段、光线、色彩并自检</div>
              <div class="v2-panel-sub">绑定生图：${escHtml(boundSummary)}</div>
            </div>
            <button class="v2-header-btn" type="button" data-run-cinema="${node.id}" ${node.status === 'generating' ? 'disabled' : ''}>${node.status === 'generating' ? '生成中...' : (finalPrompt ? '继续优化' : '生成')}</button>
          </div>
          <div class="v2-panel-section">
            <label class="v2-label">模式</label>
            <select class="v2-template-select v2-template-select-panel" data-cinema-mode="${node.id}">${cinemaModeOptions(settings.mode)}</select>
          </div>
          <div class="v2-panel-section">
            <label class="v2-label">画面想法 / 修改要求</label>
            <textarea class="v2-text-result-editor v2-cinema-draft-editor ${String(node.draft || '').trim() ? '' : 'empty'}" data-cinema-draft="${node.id}" placeholder="可以先写一句想法：雨夜街头，一个女人回头看镜头。生成后可继续写：太暗了、主体更突出、镜头拉近一点。">${escHtml(node.draft || '')}</textarea>
          </div>
          ${roleInfos.length ? `
          <div class="v2-panel-section">
            <label class="v2-label">图片角色</label>
            <div class="v2-cinema-role-list">
              ${roleInfos.map(info => `
                <div class="v2-cinema-role-row">
                  <span>@${escHtml(info.alias)}</span>
                  <select data-cinema-role="${node.id}" data-image-id="${escHtml(info.id)}">${cinemaRoleOptions(info.role)}</select>
                </div>`).join('')}
            </div>
          </div>` : ''}
          <div class="v2-panel-section">
            <label class="v2-label">最终提示词</label>
            <textarea class="v2-text-result-editor ${finalPrompt ? '' : 'empty'}" data-cinema-result="${node.id}" placeholder="生成后这里会保留可直接进入生图节点的最终提示词。">${escHtml(finalPrompt)}</textarea>
          </div>
          <details class="v2-cinema-details" ${fieldsPreview || settings.selfCheck.length ? '' : 'open'}>
            <summary>内部决策与自检</summary>
            <pre>${escHtml(fieldsPreview || '等待生成后显示内部决策')}</pre>
            <pre>${escHtml(settings.selfCheck.length ? settings.selfCheck.join('\n') : '等待生成后显示自检结果')}</pre>
          </details>
          <div class="v2-text-panel-foot">
            <select data-cinema-model="${node.id}">${textModelOptions(resolveTextModel(node))}</select>
            <button class="v2-mini-action" type="button" data-clear-cinema="${node.id}" ${node.messages?.length || node.result || node.draft ? '' : 'disabled'}>清空对话</button>
            <button class="v2-mini-action" type="button" data-locate-cinema-generate="${node.id}" ${boundNode ? '' : 'disabled'}>定位生图</button>
            <button class="v2-mini-action" type="button" data-retry-cinema-generate="${node.id}" ${boundNode && finalPrompt && !boundRunning ? '' : 'disabled'}>${boundRunning ? '生图中...' : '重试生图'}</button>
            <button class="v2-mini-action" type="button" data-run-cinema="${node.id}" ${node.status === 'generating' ? 'disabled' : ''}>${node.status === 'generating' ? '生成中...' : (finalPrompt ? '更新提示词' : '生成提示词')}</button>
            <button class="v2-action" type="button" data-run-cinema-generate="${node.id}" ${node.status === 'generating' ? 'disabled' : ''}>${node.status === 'generating' ? '生成中...' : '更新并生成'}</button>
          </div>
        </div>
      </section>`;
  }

  function renderChatMessage(message, index, context = {}) {
    const role = message.role === 'assistant' ? 'assistant' : 'user';
    const adopted = role === 'assistant' && context.adoptedMessageIndex === index;
    const prefix = context.actionPrefix || 'chat';
    const hasPrompt = role === 'assistant' && Boolean(extractAdoptablePrompt(message.content || ''));
    const hasDetail = role === 'assistant' && Boolean(extractDetailText(message.content || ''));
    const hasContent = role === 'assistant' && Boolean(String(message.content || '').trim());
    const hasFeedbackPrompt = hasPrompt && Boolean(message.feedbackSource?.nodeId);
    const selected = getSelectedPrimaryNode();
    const canAdoptText = hasContent && selected?.type === 'text';
    const canAdoptDetailPage = hasContent && selected?.type === 'detailPage';
    const actions = [
      hasPrompt ? `<button class="v2-mini-action" type="button" data-${prefix}-adopt-generate="${index}">${adopted ? '已采用' : '写入生图'}</button>` : '',
      hasFeedbackPrompt ? `<button class="v2-mini-action primary" type="button" data-${prefix}-adopt-generate-run="${index}">写入并生成</button>` : '',
      canAdoptDetailPage ? `<button class="v2-mini-action primary" type="button" data-${prefix}-adopt-detail-page="${index}">写入详情页</button>` : '',
      canAdoptText ? `<button class="v2-mini-action" type="button" data-${prefix}-adopt-text="${index}">写入反推</button>` : '',
      hasDetail ? `<button class="v2-mini-action" type="button" data-${prefix}-adopt-detail="${index}">写入产品资料</button>` : ''
    ].filter(Boolean).join('');
    return `
      <article class="v2-chat-message ${role} ${adopted ? 'adopted' : ''}" data-chat-message-index="${index}" data-chat-message-role="${role}">
        <div class="v2-chat-message-head">
          <span>${role === 'assistant' ? 'AI' : '我'}</span>
          <small>${formatChatTime(message.createdAt)}</small>
        </div>
        <pre data-chat-message-content="${index}">${escHtml(message.content || '')}</pre>
        ${actions ? `<div class="v2-chat-message-actions">${actions}</div>` : ''}
      </article>`;
  }

  function getAssistantState() {
    const normalized = normalizeAssistantState(state.assistant);
    if (!state.assistant || typeof state.assistant !== 'object') {
      state.assistant = normalized;
    } else {
      Object.assign(state.assistant, normalized);
    }
    return state.assistant;
  }

  function normalizeAssistantState(value = {}) {
    return {
      open: value.open !== false,
      messages: normalizeChatMessages(value.messages),
      draft: String(value.draft || ''),
      adoptedPrompt: sanitizeProductNoise(value.adoptedPrompt || ''),
      adoptedMessageIndex: Number.isInteger(value.adoptedMessageIndex) ? value.adoptedMessageIndex : -1,
      status: value.status === 'generating' ? 'generating' : 'idle',
      error: String(value.error || ''),
      model: String(value.model || '')
    };
  }

  function migrateChatNodesToAssistant() {
    const chatNodes = state.nodes.filter(node => node.type === 'chat');
    if (!chatNodes.length) return false;
    const assistant = getAssistantState();
    chatNodes.forEach(chatNode => {
      const messages = normalizeChatMessages(chatNode.messages);
      if (messages.length) {
        assistant.messages = normalizeChatMessages([...assistant.messages, ...messages]);
      }
      const adoptedPrompt = String(chatNode.adoptedPrompt || chatNode.result || chatNode.text || '').trim();
      if (adoptedPrompt) {
        assistant.adoptedPrompt = sanitizeProductNoise(adoptedPrompt);
        assistant.adoptedMessageIndex = -1;
      }
      if (chatNode.draft && !assistant.draft) assistant.draft = String(chatNode.draft || '');
      if (chatNode.settings?.model && !assistant.model) assistant.model = chatNode.settings.model;

      const downstream = state.connections
        .filter(conn => conn.from === chatNode.id)
        .map(conn => getNode(conn.to))
        .filter(Boolean);
      downstream.forEach(target => {
        if (target.type === 'generate' && adoptedPrompt) {
          target.text = mergeGeneratePromptWithAssistant(target, adoptedPrompt);
          target.assistantSource = {
            id: GLOBAL_CHAT_ID,
            messageIndex: -1,
            prompt: sanitizeProductNoise(adoptedPrompt),
            adoptedAt: Date.now()
          };
        }
        if (target.type === 'detail' && messages.length) {
          const existing = String(target.detail?.text || '').trim();
          const chatText = messages
            .map(m => (m.role === 'assistant' ? '[助手] ' : '[用户] ') + (m.content || ''))
            .filter(Boolean)
            .join('\n');
          if (chatText.trim()) {
            target.detail = { ...(target.detail || {}), text: [existing, chatText.trim()].filter(Boolean).join(existing ? '\n\n' : '') };
          }
        }
      });
    });
    const chatIds = new Set(chatNodes.map(node => node.id));
    state.nodes = state.nodes.filter(node => !chatIds.has(node.id));
    state.connections = state.connections.filter(conn => !chatIds.has(conn.from) && !chatIds.has(conn.to));
    state.groups.forEach(group => {
      group.nodeIds = group.nodeIds.filter(id => !chatIds.has(id));
    });
    if (chatIds.has(state.selectedId)) state.selectedId = null;
    state.selectedIds = state.selectedIds.filter(id => !chatIds.has(id));
    cleanupGroups();
    return true;
  }

  // ==========================================================================
  // SECTION: 12 ASSISTANT-HTML
  // ==========================================================================
  function renderAssistantDraftTextarea(value = '') {
    return `<textarea class="v2-chat-draft" data-assistant-draft placeholder="输入消息，或描述想搭建的工作流...">${escHtml(value || '')}</textarea>`;
  }

  // P1 优化：智能体消息 keyed 缓存（避免 innerHTML 重建）
  // key: createdAt（消息稳定标识），value: <article> DOM 节点
  const _messageDomByKey = new Map();

  function clearMessageDomCache() {
    _messageDomByKey.clear();
  }

  function patchMessageList(messages, adoptedMessageIndex, actionPrefix) {
    const log = els.assistantPanel?.querySelector('.v2-assistant-log');
    if (!log) return false;
    // 找 bottom marker（消息插入点在它之前）
    const bottom = log.querySelector('[data-chat-bottom]');
    const welcome = log.querySelector('.v2-assistant-welcome');

    // 1) 处理 welcome（无消息时显示）
    if (!messages.length) {
      if (welcome) return false;  // 已存在，不变
      // 清空所有 message DOM + 显示 welcome
      _messageDomByKey.forEach(node => node.remove());
      _messageDomByKey.clear();
      const w = document.createElement('div');
      w.className = 'v2-assistant-welcome';
      w.innerHTML = renderAssistantWelcome();
      log.insertBefore(w, bottom);
      return false;  // 不触发外层 rebuild
    }
    if (welcome) {
      welcome.remove();
    }

    // 2) 删除已不存在的消息
    const currentKeys = new Set(messages.map(m => m.createdAt));
    _messageDomByKey.forEach((node, key) => {
      if (!currentKeys.has(key)) {
        node.remove();
        _messageDomByKey.delete(key);
      }
    });

    // 3) append / update 消息（按 index 位置插入）
    let prevNode = null;  // 上一个插入的节点
    messages.forEach((message, index) => {
      const key = message.createdAt;
      let node = _messageDomByKey.get(key);
      if (!node) {
        // 新消息：创建 DOM
        const wrap = document.createElement('div');
        wrap.innerHTML = renderChatMessage(message, index, { adoptedMessageIndex, actionPrefix });
        node = wrap.firstElementChild;
        if (!node) return;
        _messageDomByKey.set(key, node);
      } else {
        // 已存在：只更新文本（避免重建整个 article）
        const pre = node.querySelector('pre[data-chat-message-content]');
        if (pre && pre.textContent !== (message.content || '')) {
          pre.textContent = message.content || '';
        }
        // 更新 adopted class
        const adopted = message.role === 'assistant' && adoptedMessageIndex === index;
        node.classList.toggle('adopted', adopted);
      }
      // 确保 DOM 顺序正确：插在 prevNode 之后 / bottom 之前
      const expectedNext = prevNode ? prevNode.nextElementSibling : log.firstElementChild;
      if (expectedNext !== node) {
        log.insertBefore(node, expectedNext);
      }
      prevNode = node;
    });

    return true;  // 表示做了 patch
  }

  function renderAssistantPanel() {
    if (!els.assistantPanel) return;
    const logScroll = getAssistantLogScrollSnapshot();
    const assistant = getAssistantState();
    els.assistantPanel.classList.toggle('collapsed', !assistant.open);
    els.assistantRail?.classList.toggle('show', !assistant.open);
    document.querySelector('.v2-shell')?.classList.toggle('assistant-collapsed', !assistant.open);
    if (!assistant.open) {
      els.assistantPanel.innerHTML = '';
      clearMessageDomCache();
      return;
    }

    const messages = normalizeChatMessagesForRender(assistant.messages);
    const contextText = assistant.draft || getLatestUserMessageContent(messages);
    const allRefs = collectGlobalChatRefs();
    const refs = filterChatRefsForDraft(allRefs, contextText);
    const selected = getSelectedPrimaryNode();
    const feedbackContext = buildGenerateFeedbackContext(String(assistant.draft || '').trim());
    const selectedContextLine = selected ? `
        <div class="v2-assistant-context-line">
          <span>目标上下文</span>
          <strong>${escHtml(`${selected.title || selected.type} · ${selected.type}`)}</strong>
        </div>` : '';
    const feedbackLine = feedbackContext ? `
        <div class="v2-assistant-context-line feedback">
          <span>续改目标</span>
          <strong>${escHtml(`${feedbackContext.versionLabel || '当前版本'} · ${feedbackContext.upstream?.cinemaInputs?.length ? '电影续改' : (feedbackContext.mode === 'region' ? '局部续改' : '整图续改')}`)}</strong>
        </div>` : '';
    const adopted = assistant.adoptedPrompt || '';
    const referencedImageIds = getReferencedImageIds(contextText, allRefs.images, { includeAllWhenEmpty: false });

    // P1 优化：消息数 ≥ 1 且 log 已存在 → 走 patch 路径（避免 input 丢焦点 + 大幅提升性能）
    const logEl = els.assistantPanel.querySelector('.v2-assistant-log');
    if (logEl && _messageDomByKey.size > 0 && messages.length > 0) {
      // log 已存在，patch 消息列表
      patchMessageList(messages, assistant.adoptedMessageIndex, 'assistant');
      // head / context / footer 用 Diff 单独更新
      updateAssistantContextBar({
        assistant, messages, selected, feedbackContext,
        selectedContextLine, feedbackLine, refs, referencedImageIds
      });
      updateAssistantFooter({ assistant, messages, adopted });
      restoreAssistantLogScroll(logScroll);
      return;
    }

    els.assistantPanel.innerHTML = `
      <div class="v2-assistant-head">
        <div class="v2-assistant-brand">
          <div class="v2-assistant-logo">AI</div>
          <div>
            <div class="v2-assistant-title">智能体</div>
            <div class="v2-assistant-sub">读取画布上下文，写回产品资料 / 生图</div>
          </div>
        </div>
        <button type="button" class="v2-assistant-close" data-assistant-close title="收起">×</button>
      </div>
      <div class="v2-assistant-context">
        ${selectedContextLine}
        ${feedbackLine}
        ${renderAssistantContextThumbs(refs, referencedImageIds)}
      </div>
      <div class="v2-assistant-log">
        ${messages.length ? messages.map((message, index) => renderChatMessage(message, index, {
          adoptedMessageIndex: assistant.adoptedMessageIndex,
          actionPrefix: 'assistant'
        })).join('') : renderAssistantWelcome()}
        <div class="v2-chat-bottom" data-chat-bottom="${GLOBAL_CHAT_ID}"></div>
      </div>
      <div class="v2-assistant-footer">
        <div class="v2-assistant-actions">
          <button type="button" class="v2-action secondary" data-assistant-clear ${messages.length || adopted ? '' : 'disabled'}>新对话</button>
        </div>
        <div class="v2-assistant-model-row">
          <span>模型</span>
          <select data-assistant-model>${textModelOptions(resolveAssistantTextModel())}</select>
        </div>
        <div class="v2-assistant-error ${assistant.error ? '' : 'is-empty'}" aria-live="polite">${escHtml(assistant.error || '')}</div>
        <div class="v2-assistant-compose">
          ${renderAssistantDraftTextarea(assistant.draft || '')}
          <button type="button" class="v2-action ${assistant.status === 'generating' ? 'sending' : ''}" data-assistant-send ${assistant.status === 'generating' ? 'disabled' : ''}>${assistant.status === 'generating' ? '输出中...' : '发送'}</button>
        </div>
      </div>`;
    // 全量重建：填充消息 DOM 缓存
    clearMessageDomCache();
    els.assistantPanel.querySelectorAll('.v2-chat-message').forEach(node => {
      const index = node.getAttribute('data-chat-message-index');
      // 用 index 反查 createdAt（用于 keyed）
      if (messages[index]) {
        _messageDomByKey.set(messages[index].createdAt, node);
      }
    });
    bindAssistantPanelEvents();
    restoreAssistantLogScroll(logScroll);
  }

  // P1 优化：增量更新 context 栏（不重建 panel）
  function updateAssistantContextBar(payload) {
    const ctxEl = els.assistantPanel.querySelector('.v2-assistant-context');
    if (!ctxEl) return;
    // 简化：context 变化频繁，整体替换更安全
    ctxEl.innerHTML = `
      ${payload.selectedContextLine}
      ${payload.feedbackLine}
      ${renderAssistantContextThumbs(payload.refs, payload.referencedImageIds)}
    `;
  }

  // P1 优化：增量更新 footer（不重建 panel）
  function updateAssistantFooter(payload) {
    const footerEl = els.assistantPanel.querySelector('.v2-assistant-footer');
    if (!footerEl) return;
    const assistant = payload.assistant;
    const messages = payload.messages;
    const adopted = payload.adopted;
    // 只更新变化部分：error 提示、send 按钮状态、model select
    const errEl = footerEl.querySelector('.v2-assistant-error');
    if (errEl) {
      errEl.classList.toggle('is-empty', !assistant.error);
      errEl.textContent = assistant.error || '';
    }
    const sendBtn = footerEl.querySelector('[data-assistant-send]');
    if (sendBtn) {
      sendBtn.classList.toggle('sending', assistant.status === 'generating');
      sendBtn.disabled = assistant.status === 'generating';
      sendBtn.textContent = assistant.status === 'generating' ? '输出中...' : '发送';
    }
    const clearBtn = footerEl.querySelector('[data-assistant-clear]');
    if (clearBtn) {
      clearBtn.disabled = !(messages.length || adopted);
    }
    // textarea 草稿：避免替换（会丢光标和输入法）
    const draft = footerEl.querySelector('[data-assistant-draft]');
    if (draft && draft.value !== (assistant.draft || '')) {
      // 只在差异巨大时替换
      const cur = draft.value;
      const next = assistant.draft || '';
      if (Math.abs(cur.length - next.length) > 50 || (!cur && next)) {
        draft.value = next;
      }
    }
  }

  function getAssistantLogScrollSnapshot() {
    const log = els.assistantPanel?.querySelector('.v2-assistant-log');
    if (!log) return null;
    const max = Math.max(0, log.scrollHeight - log.clientHeight);
    return {
      top: log.scrollTop,
      fromBottom: Math.max(0, max - log.scrollTop)
    };
  }

  function restoreAssistantLogScroll(snapshot) {
    if (!snapshot) return;
    const log = els.assistantPanel?.querySelector('.v2-assistant-log');
    if (!log) return;
    const max = Math.max(0, log.scrollHeight - log.clientHeight);
    log.scrollTop = snapshot.fromBottom <= 4 ? max : Math.min(max, snapshot.top);
  }

  function renderAssistantWelcome() {
    return `
      <div class="v2-assistant-welcome">
        <strong>你好，我是智能体，可以帮你：</strong>
        <ul>
          <li>对话聊天，询问画布和图片问题</li>
          <li>把回复写入当前选中的生图提示词</li>
          <li>把产品资料写入当前选中的产品资料节点</li>
        </ul>
        <span>发送消息开始体验。</span>
      </div>`;
  }

  function bindAssistantPanelEvents() {
    if (!els.assistantPanel || els.assistantPanel.classList.contains('collapsed')) return;
    els.assistantPanel.querySelector('[data-assistant-close]')?.addEventListener('click', e => {
      e.stopPropagation();
      toggleAssistantPanel(false);
    });
    els.assistantPanel.addEventListener('pointerdown', onAssistantPanelPointerDown);
    els.assistantPanel.addEventListener('mousedown', onAssistantPanelPointerDown);
    els.assistantPanel.addEventListener('pointerup', onAssistantPanelPointerUp);
    const draft = els.assistantPanel.querySelector('[data-assistant-draft]');
    draft?.addEventListener('mousedown', e => e.stopPropagation());
    draft?.addEventListener('click', e => e.stopPropagation());
    draft?.addEventListener('keydown', e => {
      if (handleMentionKeydown(e)) return;
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        syncAssistantDraftFromPanel();
        runGlobalChat();
        return;
      }
      e.stopPropagation();
    });
    draft?.addEventListener('input', e => {
      const assistant = getAssistantState();
      assistant.draft = e.target.value;
      scheduleSaveWorkspace();
      syncAssistantHighlight(draft);
      updateMentionMenu(draft, { id: GLOBAL_CHAT_ID }, 'assistantDraft');
    });
    draft?.addEventListener('scroll', () => syncAssistantHighlight(draft));
    draft?.addEventListener('blur', () => setTimeout(hideMentionMenu, 120));

    const sendBtn = els.assistantPanel.querySelector('[data-assistant-send]');
    sendBtn?.addEventListener('pointerdown', handleAssistantSendAction);
    sendBtn?.addEventListener('mousedown', handleAssistantSendAction);
    sendBtn?.addEventListener('pointerup', handleAssistantSendAction);
    sendBtn?.addEventListener('click', handleAssistantSendAction);
    els.assistantPanel.querySelector('[data-assistant-clear]')?.addEventListener('click', e => {
      e.stopPropagation();
      clearGlobalChat();
    });
    els.assistantPanel.querySelectorAll('[data-assistant-adopt-generate]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        adoptGlobalChatToGenerate(Number(btn.dataset.assistantAdoptGenerate));
      });
    });
    els.assistantPanel.querySelectorAll('[data-assistant-adopt-generate-run]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        adoptGlobalChatToGenerate(Number(btn.dataset.assistantAdoptGenerateRun), { run: true });
      });
    });
    els.assistantPanel.querySelectorAll('[data-assistant-adopt-detail]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        adoptGlobalChatToDetail(Number(btn.dataset.assistantAdoptDetail));
      });
    });
    els.assistantPanel.querySelectorAll('[data-assistant-adopt-text]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        adoptGlobalChatToText(Number(btn.dataset.assistantAdoptText));
      });
    });
    els.assistantPanel.querySelectorAll('[data-assistant-adopt-detail-page]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        adoptGlobalChatToDetailPage(Number(btn.dataset.assistantAdoptDetailPage));
      });
    });
    els.assistantPanel.querySelectorAll('[data-preview-output]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        previewOutput(btn.dataset.previewOutput);
      });
    });
    els.assistantPanel.querySelector('[data-assistant-model]')?.addEventListener('change', e => {
      const assistant = getAssistantState();
      assistant.model = e.target.value;
      if (e.target.value) window.setSelectedTextModelCache?.(e.target.value);
      scheduleSaveWorkspace();
      renderAssistantPanel();
    });
  }

  function onAssistantPanelPointerDown(e) {
    if (e.target?.closest?.('[data-assistant-send]')) return;
    if (!isEventInsideAssistantSendButton(e)) return;
    handleAssistantSendAction(e);
  }

  function onAssistantPanelPointerUp(e) {
    const sendBtn = e.target?.closest?.('[data-assistant-send]');
    if (!sendBtn) return;
    handleAssistantSendAction(e);
  }

  function isEventInsideAssistantSendButton(e) {
    const btn = els.assistantPanel?.querySelector('[data-assistant-send]');
    if (!btn || btn.disabled) return false;
    if (typeof e.clientX !== 'number' || typeof e.clientY !== 'number') return false;
    const rect = btn.getBoundingClientRect();
    return e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
  }

  function syncAssistantDraftFromPanel() {
    const draft = els.assistantPanel?.querySelector('[data-assistant-draft]');
    const model = els.assistantPanel?.querySelector('[data-assistant-model]');
    const assistant = getAssistantState();
    if (draft) {
      assistant.draft = draft.value;
      syncAssistantHighlight(draft);
    }
    if (model?.value) {
      assistant.model = model.value;
      window.setSelectedTextModelCache?.(model.value);
    }
  }

  function handleAssistantSendAction(e) {
    const sendBtn = e.currentTarget?.closest?.('[data-assistant-send]')
      || e.target?.closest?.('[data-assistant-send]')
      || (isEventInsideAssistantSendButton(e) ? els.assistantPanel?.querySelector('[data-assistant-send]') : null);
    if (!sendBtn || sendBtn.disabled) return;
    e.preventDefault();
    e.stopPropagation();
    const now = Date.now();
    if (now - lastAssistantSendAt < 350) return;
    lastAssistantSendAt = now;
    ensureAudioUnlocked();
    playAssistantSendSound();
    syncAssistantDraftFromPanel();
    hideMentionMenu();
    runGlobalChat();
  }

  function setAssistantError(message) {
    const assistant = getAssistantState();
    assistant.error = String(message || '');
    const errorEl = els.assistantPanel?.querySelector('.v2-assistant-error');
    if (errorEl) {
      errorEl.textContent = assistant.error;
      errorEl.classList.toggle('is-empty', !assistant.error);
    }
  }

  function syncAssistantHighlight(textarea) {
    syncAssistantContextThumbs(textarea.value);
  }

  function toggleAssistantPanel(force) {
    const assistant = getAssistantState();
    assistant.open = typeof force === 'boolean' ? force : !assistant.open;
    scheduleSaveWorkspace();
    renderAssistantPanel();
  }

  function getSelectedPrimaryNode() {
    return getNode(state.selectedId) || getSelectedNodeIds().map(getNode).find(Boolean) || null;
  }

  function getSelectedGenerateNode() {
    const primary = getSelectedPrimaryNode();
    if (primary?.type === 'generate') return primary;
    return getSelectedNodeIds().map(getNode).find(node => node?.type === 'generate') || null;
  }

  function getExplicitSelectedGenerateNode() {
    const selectedGenerates = getSelectedNodeIds().map(getNode).filter(node => node?.type === 'generate');
    if (selectedGenerates.length !== 1) return null;
    return selectedGenerates[0];
  }

  function getSelectedDetailNode() {
    const primary = getSelectedPrimaryNode();
    if (primary?.type === 'detail') return primary;
    return getSelectedNodeIds().map(getNode).find(node => node?.type === 'detail') || null;
  }

  function getSelectedTextNode() {
    const primary = getSelectedPrimaryNode();
    if (primary?.type === 'text') return primary;
    return getSelectedNodeIds().map(getNode).find(node => node?.type === 'text') || null;
  }

  function getSelectedDetailPageNode() {
    const primary = getSelectedPrimaryNode();
    if (primary?.type === 'detailPage') return primary;
    return getSelectedNodeIds().map(getNode).find(node => node?.type === 'detailPage') || null;
  }

  function collectGlobalChatRefs() {
    const images = [];
    const details = [];
    const textInputs = [];
    const seenImages = new Set();
    state.nodes.forEach(node => {
      const image = toReferenceImageSource(node);
      if (image?.image && !seenImages.has(image.id)) {
        seenImages.add(image.id);
        images.push(image);
      }
      if (node.type === 'detail') {
        const detail = normalizeDetail(node.detail);
        const text = detailToPromptBlock(detail);
        if (text) details.push({
          id: node.id,
          title: node.title || '产品资料',
          detail,
          summary: detailSummary(detail),
          text
        });
      }
      if (node.type === 'text') {
        const textValue = String(node.result || node.text || '').trim();
        if (textValue) textInputs.push({
          id: node.id,
          title: node.title || '反推',
          ready: true,
          rawText: textValue,
          imagePrompt: PromptEngine.summarizeTextForImage(textValue, { includeSubjectAnchors: false, styleOnly: true })
        });
      }
    });
    return { images, details, textInputs };
  }

  function collectDetailPageRefs() {
    const selectedIds = new Set(getSelectedNodeIds());
    const hasSelection = selectedIds.size > 0;
    const selectedNodes = state.nodes.filter(node => selectedIds.has(node.id));
    const targetNodes = hasSelection ? selectedNodes : state.nodes;
    const refs = { images: [], details: [], textInputs: [] };
    const seenImages = new Set();
    const seenDetails = new Set();
    const seenTexts = new Set();

    targetNodes.forEach(node => {
      const localRefs = collectRefsForNode(node);
      [...localRefs.images, toReferenceImageSource(node)].filter(Boolean).forEach(ref => {
        if (!ref?.image || seenImages.has(ref.id)) return;
        seenImages.add(ref.id);
        refs.images.push(ref);
      });
      if (node.type === 'detail') {
        const detail = normalizeDetail(node.detail);
        const text = detailToPromptBlock(detail);
        if (text && !seenDetails.has(node.id)) {
          seenDetails.add(node.id);
          refs.details.push({ id: node.id, title: node.title || '产品资料', detail, summary: detailSummary(detail), text });
        }
      }
      localRefs.details.forEach(detail => {
        if (seenDetails.has(detail.id)) return;
        seenDetails.add(detail.id);
        refs.details.push(detail);
      });
      if (node.type === 'text') {
        const textValue = String(node.result || node.text || '').trim();
        if (textValue && !seenTexts.has(node.id)) {
          seenTexts.add(node.id);
          refs.textInputs.push({
            id: node.id,
            title: node.title || '反推',
            ready: true,
            rawText: textValue,
            imagePrompt: PromptEngine.summarizeTextForImage(textValue, { includeSubjectAnchors: false, styleOnly: true })
          });
        }
      }
      localRefs.textInputs.forEach(text => {
        if (seenTexts.has(text.id)) return;
        seenTexts.add(text.id);
        refs.textInputs.push(text);
      });
    });

    return refs;
  }

  function normalizeDetailPageScreenCount(value) {
    const requested = Number(value);
    if (DETAIL_PAGE_COUNT_OPTIONS.includes(requested)) return requested;
    return DETAIL_PAGE_COUNT_OPTIONS.reduce((best, item) => (
      Math.abs(item - requested) < Math.abs(best - requested) ? item : best
    ), DETAIL_PAGE_DEFAULT_COUNT);
  }

  function getDetailPageSourceSummary(refs = collectDetailPageRefs()) {
    const selectedCount = getSelectedNodeIds().length;
    const subject = refs.images.find(ref => ref?.roleHint === 'subject')
      || refs.images.find(ref => !isSketchReference(ref))
      || refs.images[0]
      || null;
    const references = refs.images
      .filter(ref => ref?.id && ref.id !== subject?.id && !isSketchReference(ref))
      .slice(0, 4);
    const sketches = refs.images.filter(isSketchReference).slice(0, 2);
    return {
      selectedCount,
      scopeLabel: selectedCount ? `已选 ${selectedCount} 个节点` : '未选择节点，使用全画布素材',
      subject,
      references,
      sketches,
      details: refs.details.slice(0, 3),
      textInputs: refs.textInputs.slice(0, 3),
      hasUsableInput: Boolean(refs.images.length || refs.details.length || refs.textInputs.length)
    };
  }

  function getDetailPageImageRoleRefs(refs = {}) {
    const images = Array.isArray(refs.images) ? refs.images.filter(ref => ref?.image) : [];
    const subject = images.find(ref => ref?.roleHint === 'subject')
      || images.find(ref => !isSketchReference(ref) && !/参考|样式|风格|版式|背景/i.test(`${ref.alias || ''} ${ref.title || ''}`))
      || images.find(ref => !isSketchReference(ref))
      || images[0]
      || null;
    const references = images
      .filter(ref => ref?.id && ref.id !== subject?.id && !isSketchReference(ref))
      .slice(0, Math.max(0, DETAIL_PAGE_MAX_REFERENCE_IMAGES - 1));
    const sketches = images.filter(isSketchReference).slice(0, 2);
    return { subject, references, sketches };
  }

  function shouldUseDirectTryOnInputs(rawPrompt = '', node = null) {
    return String(rawPrompt || '').includes(TRY_ON_PROMPT_TAG) || Boolean(node?.settings?.tryOnStep);
  }

  function formatDetailPageRefsLine(label, refs = []) {
    const aliases = refs
      .map(ref => ref?.alias || ref?.title || '')
      .map(value => String(value || '').trim())
      .filter(Boolean)
      .map(value => '@' + value);
    return `${label}：${aliases.join(' ')}`;
  }

  function getReferencedImageSourceIds(refs, referencedIds) {
    const sourceIds = new Set(referencedIds);
    (refs.images || []).forEach(ref => {
      if (!referencedIds.has(ref.id)) return;
      if (ref.sourceId) sourceIds.add(ref.sourceId);
      if (ref.id) sourceIds.add(ref.id);
    });
    return sourceIds;
  }

  function getNodeAncestorIds(nodeId, seen = new Set()) {
    if (!nodeId || seen.has(nodeId)) return seen;
    seen.add(nodeId);
    state.connections
      .filter(conn => conn.to === nodeId)
      .forEach(conn => getNodeAncestorIds(conn.from, seen));
    return seen;
  }

  function isChatContextLinkedToImages(item, referencedSourceIds) {
    if (!item?.id || !referencedSourceIds?.size) return false;
    if (referencedSourceIds.has(item.id)) return true;
    const ancestors = getNodeAncestorIds(item.id);
    for (const id of referencedSourceIds) {
      if (ancestors.has(id)) return true;
    }
    return false;
  }

  function renderAssistantContextThumbs(refs, referencedIds = new Set()) {
    const images = (refs.images || []).slice(0, 10);
      const textItems = [
      ...(refs.details || []).slice(0, 2).map(ref => ({ id: ref.id, label: ref.title || '产品资料', meta: '产品资料' })),
      ...(refs.textInputs || []).slice(0, 2).map(ref => ({ id: ref.id, label: ref.title || '反推', meta: ref.kind === 'assistant' ? '智能体' : '反推' }))
    ];
    if (!images.length && !textItems.length) {
      return '<div class="v2-chat-input-summary empty" aria-label="当前上下文">暂无上下文</div>';
    }
    return `
      <div class="v2-chat-input-summary" aria-label="当前上下文">
        ${images.map(ref => {
          const active = referencedIds.has(ref.id);
          return `
            <div class="v2-chat-context-thumb ${active ? 'referenced' : ''}" data-assistant-context-image-id="${escHtml(ref.id)}" title="@${escHtml(ref.alias || ref.title || '')}">
              <img src="${ref.image}" alt="@${escHtml(ref.alias || ref.title || '')}">
              <span>@${escHtml(ref.alias || ref.title || '图像')}</span>
            </div>`;
        }).join('')}
        ${textItems.map(item => `
          <div class="v2-chat-context-note" title="${escHtml(item.label)}">
            <strong>${escHtml(item.meta)}</strong>
            <span>${escHtml(item.label)}</span>
          </div>`).join('')}
      </div>`;
  }

  function syncAssistantContextThumbs(text) {
    if (!els.assistantPanel) return;
    const allRefs = collectGlobalChatRefs();
    const referencedIds = getReferencedImageIds(text, allRefs.images, { includeAllWhenEmpty: false });
    els.assistantPanel.querySelectorAll('[data-assistant-context-image-id]').forEach(el => {
      el.classList.toggle('referenced', referencedIds.has(el.dataset.assistantContextImageId));
    });
  }

  function scrollChatLogToBottom(nodeId) {
    if (nodeId === GLOBAL_CHAT_ID && assistantScrollFrame) return;
    if (nodeId === GLOBAL_CHAT_ID) assistantScrollFrame = true;
    requestAnimationFrame(() => {
      if (nodeId === GLOBAL_CHAT_ID) assistantScrollFrame = false;
      const root = nodeId === GLOBAL_CHAT_ID ? els.assistantPanel : els.world;
      const bottom = root?.querySelector(`[data-chat-bottom="${cssEscape(nodeId)}"]`);
      bottom?.scrollIntoView({ block: 'end' });
    });
  }

  function updateAssistantMessageDom(index, content) {
    const pre = els.assistantPanel?.querySelector(`[data-chat-message-content="${cssEscape(String(index))}"]`);
    if (!pre) return false;
    pre.textContent = String(content || '');
    return true;
  }

  function getLatestAssistantMessageIndex(messages = []) {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i]?.role === 'assistant') return i;
    }
    return -1;
  }

  function renderGeneratePanel(node) {
    const refs = collectRefsForNode(node);
    normalizeGenerateSizeSettings(node);
    normalizeGenerateReferenceMode(node);
    normalizeGenerateModelSettings(node);
    const box = getNodeBox(node);
    const panelX = Math.round(node.x + box.w / 2 - PANEL_W / 2);
    const panelY = node.y + box.h + NODE_PANEL_GAP;
    const promptText = getGeneratePromptText(node);
    const compiled = buildCompiledPrompt(node, refs);
    const imageRoles = new Map(compiled.imageRoles.map(info => [info.id, info]));
    const requestImageIds = new Set(compiled.requestImages.map(item => item.id));
    const subjectRef = getCompiledSubjectRef(refs.images, compiled, node);
    const structureOnlyImages = refs.images.filter(ref => !requestImageIds.has(ref.id));
    const visibleImageInputs = [...compiled.requestImages, ...structureOnlyImages];
    const runState = getGenerateRunState(node.id);
    const canCancelRun = canCancelGenerateRun(runState);
    const actionLabel = runState ? getGenerateCancelLabel(runState) : '生成';
    const primaryActionLabel = runState ? getGenerateCancelLabel(runState) : '生成图片';
    const actionClass = runState ? (canCancelRun ? 'danger' : 'busy') : '';
    const actionAttr = runState
      ? (canCancelRun ? `data-cancel-generate="${node.id}"` : 'disabled')
      : `data-run-generate="${node.id}"`;
    const actionHint = runState ? getGenerateCancelHint(runState) : '生成图片';
    return `
      <section class="v2-node-panel" data-panel-for="${node.id}" style="left:${panelX}px;top:${panelY}px">
        <div class="v2-panel-glow"></div>
        <div class="v2-panel">
          <div class="v2-panel-head">
            <div>
              <div class="v2-panel-title">${escHtml(node.title)} · 生图窗口</div>
              <div class="v2-panel-sub">绑定当前节点 · 图片 ${refs.images.length} 张 · 分层渲染 ${refs.sketches.length} 张 · 反推/智能体 ${refs.textInputs.length} 条</div>
            </div>
            <button class="v2-header-btn ${actionClass}" type="button" ${actionAttr} title="${escHtml(actionHint)}">${escHtml(actionLabel)}</button>
          </div>
          <div class="v2-panel-section">
            <label class="v2-label">最终会传入模型的输入</label>
            <div class="v2-chip-row">
              ${visibleImageInputs.length ? visibleImageInputs.map(ref => {
                const roleInfo = imageRoles.get(ref.id) || { label: '输入图', role: 'unknown' };
                const isImageInput = requestImageIds.has(ref.id);
                const channelText = isImageInput
                  ? getGenerateInputChannelLabel(roleInfo.role)
                  : '已连接';
                return `<button type="button" class="v2-input-thumb ${roleInfo.role === 'sketch' ? 'sketch' : ''} ${isImageInput ? 'referenced' : 'connected-only'} ${isImageInput ? '' : 'structure-only'}" data-input-image-id="${ref.id}" data-input-role="${escHtml(roleInfo.role || '')}" data-input-role-label="${escHtml(roleInfo.label)}" data-preview-image="${ref.id}" title="@${escHtml(ref.alias)} · ${escHtml(roleInfo.label)} · ${escHtml(channelText)}"><img src="${ref.image}" alt="@${escHtml(ref.alias)}"><span>@${escHtml(ref.alias)}</span><small>${escHtml(channelText)}</small></button>`;
              }).join('') : '<span class="v2-chip">暂无图片输入</span>'}
              ${refs.textInputs.length ? refs.textInputs.map(ref => `<span class="v2-chip text">${escHtml(ref.title)} · ${ref.ready ? getUpstreamTextReadyLabel(ref) : getUpstreamTextPendingLabel(ref)}</span>`).join('') : ''}
              ${refs.details.length ? refs.details.map(ref => `<span class="v2-chip detail">${escHtml(ref.title)} · 产品资料已接入</span>`).join('') : ''}
            </div>
          </div>
          ${renderGenerateVersionStrip(node)}
          ${renderRegionEditPanel(node, subjectRef)}
          <div class="v2-panel-section">
            <label class="v2-label">生图输入</label>
            <div class="v2-highlight-wrap">
              <pre class="v2-prompt-highlight" data-panel-highlight="${node.id}">${renderPromptHighlight(promptText, refs.images)}</pre>
              <textarea class="v2-panel-textarea" data-panel-text="${node.id}" placeholder="主图：@产品图&#10;参考图：@样式图&#10;提示词：写最终生图描述，或让智能体写入这里">${escHtml(promptText)}</textarea>
            </div>
          </div>
          <div class="v2-panel-section">
            <label class="v2-label">参数</label>
            <div class="v2-param-grid">
              <div class="v2-param-field">
                <span>模型</span>
                <div class="v2-model-row">
                  <select data-setting="model">${modelOptions(node.settings.model)}</select>
                  <button class="v2-mini-action" type="button" data-detect-image-models="${node.id}">检测模型</button>
                </div>
              </div>
              <div class="v2-param-field">
                <span>比例</span>
                <select data-setting="ratio">${ratioOptions(node.settings.ratio)}</select>
              </div>
              <div class="v2-param-field">
                <span>分辨率</span>
                <select data-setting="resolution">${resolutionOptions(node.settings.ratio, node.settings.resolution)}</select>
              </div>
              <div class="v2-param-field">
                <span>画质</span>
              <select data-setting="quality">
                <option value="auto" ${node.settings.quality === 'auto' ? 'selected' : ''}>自动</option>
                <option value="high" ${node.settings.quality === 'high' ? 'selected' : ''}>高清</option>
                <option value="medium" ${node.settings.quality === 'medium' ? 'selected' : ''}>标准</option>
                <option value="low" ${node.settings.quality === 'low' ? 'selected' : ''}>快速</option>
              </select>
              </div>
              <div class="v2-param-field">
                <span>数量</span>
              <select data-setting="n">
                <option value="1" ${Number(node.settings.n) === 1 ? 'selected' : ''}>x1</option>
                <option value="2" ${Number(node.settings.n) === 2 ? 'selected' : ''}>x2</option>
                <option value="4" ${Number(node.settings.n) === 4 ? 'selected' : ''}>x4</option>
              </select>
              </div>
            </div>
          </div>
          <div class="v2-panel-actions">
            <button class="v2-action ${actionClass}" type="button" ${actionAttr} title="${escHtml(actionHint)}">${escHtml(primaryActionLabel)}</button>
            <button class="v2-action secondary" type="button" data-save-library="${node.id}" ${node.output ? '' : 'disabled'}>加入图库</button>
          </div>
        </div>
      </section>`;
  }

  function renderRegionEditPanel(node, subjectRef) {
    const region = getRegionEditState(node);
    const valid = getValidRegionEdit(node, subjectRef);
    const sourceRegion = getRegionEditState(getNode(subjectRef?.id) || subjectRef);
    const hasSavedRegion = Boolean(region.enabled && region.rect);
    const stale = Boolean(hasSavedRegion && (!subjectRef || (region.sourceId && region.sourceId !== subjectRef.id)));
    const sourceLabel = subjectRef
      ? subjectRef.title || subjectRef.alias || '主体图'
      : region.sourceAlias
        ? `@${region.sourceAlias}`
        : '未找到主体图';
    const status = stale
      ? '区域失效：主体图已断开或更换，请重新框选'
      : !subjectRef
      ? '未识别主图，先连接或在“主图：”里标注主图'
      : valid
        ? `聚焦 ${Math.round(valid.rect.w * 100)}% × ${Math.round(valid.rect.h * 100)}%`
        : '未设置聚焦';
    const regionPrompt = region.prompt || '';
    return `
          <div class="v2-panel-section">
            <label class="v2-label">聚焦</label>
            <div class="v2-region-card ${valid ? 'active' : ''} ${stale ? 'stale' : ''}">
              <div class="v2-region-card-head">
                <div>
                  <strong>${escHtml(sourceLabel)}</strong>
                  <span>${escHtml(status)}</span>
                </div>
                <div class="v2-region-card-actions">
                  <button class="v2-mini-action" type="button" data-open-region="${node.id}" ${subjectRef ? '' : 'disabled'}>去主图框选</button>
                  <button class="v2-mini-action" type="button" data-clear-region="${node.id}" ${region.enabled || region.rect || region.prompt || sourceRegion.rect || sourceRegion.prompt ? '' : 'disabled'}>清除聚焦</button>
                </div>
              </div>
              <div class="v2-highlight-wrap v2-region-highlight-wrap">
                <pre class="v2-prompt-highlight" data-region-highlight="${node.id}">${renderPromptHighlight(regionPrompt, collectRefsForNode(node).images)}</pre>
                <textarea class="v2-region-prompt" data-region-prompt="${node.id}" placeholder="只描述聚焦区域怎么改，例如：把关键局部换成金属质感，保留其他区域不变。">${escHtml(regionPrompt)}</textarea>
              </div>
            </div>
          </div>`;
  }

  function getGenerateInputChannelLabel(role) {
    if (role === 'reference') return '风格代理输入';
    if (role === 'subject') return '主图输入';
    if (role === 'support') return '辅助输入';
    if (role === 'sketch') return '分层渲染输入';
    return '图像输入';
  }

  function isCinemaTextInput(ref) {
    return ref?.kind === 'cinema' || ref?.taskType === 'cinema-prompt';
  }

  function cinemaNodeToTextInput(source) {
    if (!source || source.type !== 'cinema') return null;
    const settings = getCinemaSettings(source);
    const cinemaPrompt = cleanPromptBody(source.result || source.text || '');
    const upstream = collectRefsForNode(source);
    const imageRoles = getCinemaImageRoles(source, upstream);
    return {
      id: source.id,
      title: source.title || '电影',
      ready: Boolean(cinemaPrompt),
      rawText: settings.raw || cinemaPrompt,
      imagePrompt: cinemaPrompt,
      taskType: 'cinema-prompt',
      kind: 'cinema',
      inputRoles: imageRoles,
      structuredFields: { ...(settings.structuredFields || {}) },
      selfCheck: Array.isArray(settings.selfCheck) ? settings.selfCheck.map(String).filter(Boolean) : [],
      revisionSummary: String(settings.revisionSummary || ''),
      sourceVersion: String(settings.sourceVersion || CINEMA_SOURCE_VERSION)
    };
  }

  function getUpstreamTextReadyLabel(ref) {
    if (ref?.kind === 'assistant') return '智能体已写入';
    if (isCinemaTextInput(ref)) return '电影提示词已接入';
    return '反推骨架已接入';
  }

  function getUpstreamTextPendingLabel(ref) {
    if (isCinemaTextInput(ref)) return '等待电影节点生成';
    return '等待反推生成';
  }

  function getUpstreamTextDescription(ref) {
    if (ref?.kind === 'assistant') return '智能体写入 · 生图节点实际使用';
    if (isCinemaTextInput(ref)) return '电影节点 · 只读取最终提示词，不自动继承电影节点图片';
    return '反推骨架 · 生图节点参考使用';
  }

  function renderUpstreamTextInputs(textInputs = []) {
    if (!textInputs.length) return '';
    return `
          <div class="v2-panel-section">
            <label class="v2-label">上游文字输入</label>
            <div class="v2-upstream-text-list">
              ${textInputs.map(ref => {
                const imagePrompt = String(ref.imagePrompt || '').trim();
                const rawText = String(ref.rawText || '').trim();
                const isAssistant = ref.kind === 'assistant';
                const isCinema = isCinemaTextInput(ref);
                return `
                  <article class="v2-upstream-text-item ${isAssistant ? 'assistant' : ''} ${isCinema ? 'cinema' : ''}">
                    <div class="v2-upstream-text-head">
                      <span>${escHtml(ref.title || (isAssistant ? '智能体' : (isCinema ? '电影' : '反推')))}</span>
                      <small>${ref.ready ? getUpstreamTextReadyLabel(ref) : getUpstreamTextPendingLabel(ref)}</small>
                    </div>
                    <div class="v2-upstream-text-label">${getUpstreamTextDescription(ref)}</div>
                    <pre class="v2-upstream-text-preview ${imagePrompt ? '' : 'empty'}">${escHtml(imagePrompt || getUpstreamTextPendingLabel(ref))}</pre>
                    ${rawText ? `
                      <details class="v2-upstream-text-raw">
                        <summary>原始返回</summary>
                        <pre>${escHtml(rawText)}</pre>
                      </details>` : ''}
                  </article>`;
              }).join('')}
            </div>
          </div>`;
  }

  function renderDetailPanels() {
    return state.nodes
      .filter(node => node.type === 'detail' && node.id === state.selectedId)
      .map(renderDetailPanel)
      .join('');
  }

  function renderSketchPanels() {
    return state.nodes
      .filter(node => node.type === 'sketch' && node.id === state.selectedId)
      .map(renderSketchPanel)
      .join('');
  }

  function renderDetailPanel(node) {
    const box = getNodeBox(node);
    const panelX = Math.round(node.x + box.w / 2 - TEXT_PANEL_W / 2);
    const panelY = node.y + box.h + NODE_PANEL_GAP;
    const detail = normalizeDetail(node.detail);
    const text = detail.text || '';
    return `
      <section class="v2-node-panel v2-detail-node-panel" data-detail-panel-for="${node.id}" style="left:${panelX}px;top:${panelY}px">
        <div class="v2-panel-glow"></div>
        <div class="v2-panel">
          <div class="v2-panel-head compact">
            <div>
              <div class="v2-panel-title">${escHtml(node.title)} · 产品资料</div>
              <div class="v2-panel-sub">填写产品信息，智能体写入后也可手动编辑</div>
            </div>
          </div>
          <div class="v2-detail-form">
            <label class="v2-detail-field wide">
              <span>产品资料</span>
              <textarea data-detail-text="${node.id}" rows="8" placeholder="产品名称、品类、品牌、卖点、规格、材质、禁用词等，随意写">${escHtml(text)}</textarea>
            </label>
          </div>
        </div>
      </section>`;
  }

  function renderSketchPanel(node) {
    const box = getNodeBox(node);
    const panelX = Math.round(node.x + box.w / 2 - SKETCH_PANEL_W / 2);
    const panelY = node.y + box.h + NODE_PANEL_GAP;
    const sketch = getSketchState(node);
    const activeColor = normalizeSketchColor(sketch.activeColor) || DEFAULT_SKETCH_MAPPINGS[0].color;
    return `
      <section class="v2-node-panel v2-sketch-node-panel" data-sketch-panel-for="${node.id}" style="left:${panelX}px;top:${panelY}px">
        <div class="v2-panel-glow"></div>
        <div class="v2-panel">
          <div class="v2-panel-head compact">
            <div>
              <div class="v2-panel-title">${escHtml(node.title)} · 分层渲染</div>
              <div class="v2-panel-sub">上传图片后自动识别主体和画面元素，分层结果会作为生图的场景引导</div>
            </div>
            <button class="v2-header-btn" type="button" data-sketch-save="${node.id}">保存分层</button>
          </div>
          <div class="v2-sketch-panel-grid">
            <div class="v2-sketch-editor">
              <div class="v2-sketch-canvas-shell" data-sketch-drop="${node.id}">
                <canvas class="v2-sketch-canvas" width="${SKETCH_CANVAS_SIZE}" height="${SKETCH_CANVAS_SIZE}" data-sketch-canvas="${node.id}"></canvas>
              </div>
              <div class="v2-sketch-tools">
                <input type="file" accept="image/*" data-sketch-upload="${node.id}" hidden>
                <button type="button" class="v2-mini-action" data-sketch-import="${node.id}">导入图片</button>
                <button type="button" class="v2-mini-action ${sketch.mode === 'view' ? 'active' : ''}" data-sketch-tool="${node.id}" data-tool="view">查看</button>
                <button type="button" class="v2-mini-action ${sketch.mode === 'brush' ? 'active' : ''}" data-sketch-tool="${node.id}" data-tool="brush">修正</button>
                <button type="button" class="v2-mini-action ${sketch.mode === 'eraser' ? 'active' : ''}" data-sketch-tool="${node.id}" data-tool="eraser">擦除</button>
                <button type="button" class="v2-mini-action" data-sketch-undo="${node.id}">撤销</button>
                <button type="button" class="v2-mini-action" data-sketch-clear="${node.id}">清空</button>
                <label class="v2-sketch-size">粗细 <input type="range" min="2" max="80" value="${Number(sketch.brushSize) || 18}" data-sketch-size="${node.id}"></label>
              </div>
              <div class="v2-sketch-swatches">
                ${sketch.mappings.map(item => `
                  <button type="button" class="${normalizeSketchColor(item.color) === activeColor ? 'active' : ''}" data-sketch-color="${node.id}" data-color="${escHtml(item.color)}" title="${escHtml(item.label || item.color)}" style="--swatch:${escHtml(item.color)}"></button>
                `).join('')}
              </div>
            </div>
            <div class="v2-sketch-mapping-panel">
              <div class="v2-panel-section">
                <label class="v2-label">AI 分层</label>
                <div class="v2-sketch-ai-card">
                  <div class="v2-sketch-ai-row">
                    <select data-sketch-seg-source="${node.id}">
                      <option value="auto" ${sketch.segmentationSource === 'auto' ? 'selected' : ''}>自动 · 优先底图</option>
                      <option value="source" ${sketch.segmentationSource === 'source' ? 'selected' : ''}>分层渲染底图</option>
                      <option value="upstream" ${sketch.segmentationSource === 'upstream' ? 'selected' : ''}>上游图片</option>
                    </select>
                    <button type="button" class="v2-mini-action" data-run-sketch-seg="${node.id}" ${node.status === 'generating' ? 'disabled' : ''}>${node.status === 'generating' ? '分层中...' : 'AI 分层'}</button>
                  </div>
                  <div class="v2-sketch-ai-actions">
                    <button type="button" class="v2-mini-action" data-detect-sketch-models="${node.id}" ${node.status === 'generating' ? 'disabled' : ''}>检测模型</button>
                    <button type="button" class="v2-mini-action" data-sketch-set-source="${node.id}" ${getSketchImage(node) ? '' : 'disabled'}>用当前图设为底图</button>
                    <button type="button" class="v2-mini-action" data-sketch-restore-source="${node.id}" ${getSketchSourceImage(node) ? '' : 'disabled'}>恢复底图预览</button>
                  </div>
                  <div class="v2-sketch-ai-status ${sketchStatusClass(sketch.segmentationStatus, node.status)}">${escHtml(sketch.segmentationStatus || (sketch.sourceImage ? '已保存底图，可自动分层' : '导入图片或连接上游图片后可自动分层'))}</div>
                </div>
              </div>
              <div class="v2-panel-section">
                <label class="v2-label">自动分层映射</label>
                <div class="v2-sketch-map-list">
                  ${sketch.mappings.map((item, index) => `
                    <div class="v2-sketch-map-row" data-sketch-map-row="${index}">
                      <input type="color" value="${escHtml(item.color)}" data-sketch-map-color="${node.id}" data-index="${index}">
                      <input type="text" value="${escHtml(item.label)}" data-sketch-map-label="${node.id}" data-index="${index}" aria-label="颜色名称">
                      <input type="text" value="${escHtml(item.target)}" data-sketch-map-target="${node.id}" data-index="${index}" placeholder="自动识别结果">
                      <button type="button" class="v2-mini-action" data-sketch-map-delete="${node.id}" data-index="${index}" ${sketch.mappings.length <= 1 ? 'disabled' : ''}>删除</button>
                    </div>
                  `).join('')}
                </div>
                <button type="button" class="v2-mini-action v2-sketch-add-map" data-sketch-map-add="${node.id}">新增颜色</button>
              </div>
              <div class="v2-panel-section">
                <label class="v2-label">当前摘要</label>
                <pre class="v2-sketch-summary-box">${escHtml(sketchMappingsSummary(node) || '还没有自动分层结果')}</pre>
              </div>
            </div>
          </div>
        </div>
      </section>`;
  }

  function sketchStatusClass(status, nodeStatus) {
    const text = String(status || '');
    if (nodeStatus === 'generating' || /正在|准备|检测中/.test(text)) return 'running';
    if (/失败|请先|没有|缺少|错误/.test(text)) return 'error';
    if (/完成|检测到|已保存|已导入|已恢复|已设为/.test(text)) return 'success';
    return '';
  }

  // ==========================================================================
  // SECTION: 13 PROMPT-HIGHLIGHT
  // ==========================================================================
  function getGeneratePromptText(node) {
    const text = String(node?.text || '').trim();
    return LEGACY_GENERATE_PROMPTS.has(text) ? DEFAULT_GENERATE_PROMPT : (node?.text || DEFAULT_GENERATE_PROMPT);
  }

  function stripInternalPromptTags(text) {
    return String(text || '').replaceAll(TRY_ON_PROMPT_TAG, '').replace(/\n{3,}/g, '\n\n').trim();
  }

  function stripWorkflowPromptLabels(text) {
    return stripInternalPromptTags(text)
      .split('\n')
      .map(line => {
        const match = line.match(/^\s*(主图|主体|辅助图|参考|参考图|背景场景|提示词)\s*[:：]\s*(.*)$/i);
        if (!match) return line;
        const body = match[2].trim();
        if (!body || /^@[\u4e00-\u9fa5\w-]+(?:\s*@[\u4e00-\u9fa5\w-]+)*$/.test(body)) return '';
        return body;
      })
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  function cleanPromptBody(text) {
    const value = sanitizeProductNoise(text || '');
    if (!value) return '';
    return normalizeMentionBoundaries(value
      .split('\n')
      .map(line => {
        const match = line.match(/^\s*(主体|主图|参考|参考图|提示词)\s*[:：]\s*(.*)$/i);
        if (!match) return line;
        const body = match[2].trim();
        if (!body || /^@[\u4e00-\u9fa5\w-]+(?:\s*[、,，]\s*@[\u4e00-\u9fa5\w-]+)*$/.test(body)) return '';
        return body;
      })
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim());
  }

  function normalizeMentionBoundaries(text) {
    const aliases = getReferenceImageSources()
      .flatMap(ref => [ref.alias, ...(Array.isArray(ref.aliases) ? ref.aliases : [])])
      .map(value => String(value || '').trim())
      .filter(Boolean)
      .sort((a, b) => b.length - a.length);
    if (!aliases.length) return String(text || '');
    const aliasPattern = aliases.map(PromptEngine.escapeRegExp).join('|');
    const re = new RegExp(`@(${aliasPattern})(?=[\\u4e00-\\u9fa5A-Za-z0-9])`, 'g');
    return String(text || '').replace(re, '@$1 ');
  }

  function renderRefStrip(images) {
    if (!images.length) return '<div class="v2-ref-strip"></div>';
    return `<div class="v2-ref-strip">${images.slice(0, 8).map(ref => `
      <div class="v2-ref-thumb" title="@${escHtml(ref.alias)}"><img src="${ref.image}" alt="@${escHtml(ref.alias)}"></div>`).join('')}</div>`;
  }

  function renderDetailStrip(details) {
    if (!details.length) return '';
    return `<div class="v2-detail-strip">${details.map(ref => `<span>${escHtml(ref.title)} · ${escHtml(ref.summary || '产品资料')}</span>`).join('')}</div>`;
  }

  function getTextInputRoleInfos(node, images = []) {
    return images.map((ref, index) => ({
      id: ref.id,
      alias: ref.alias || ref.title || ('图' + (index + 1)),
      role: 'reference',
      label: isSketchReference(ref) ? '分层渲染参考' : '反推参考',
      channel: 'structure'
    }));
  }

  function getTextTaskType(roleInfos = []) {
    const references = (roleInfos || []).filter(info => info.role === 'reference' || info.role === 'support' || info.role === 'connected');
    return references.length >= 2 ? 'detail-page-framework' : 'template-only';
  }

  function getReferencedConnectedImageIds(text, connectedImages = []) {
    return getReferencedImageIds(text, connectedImages, { includeAllWhenEmpty: false });
  }

  function getReferencedImageIds(text, images = [], opts = {}) {
    const ids = new Set();
    const connected = new Set((images || []).map(ref => ref.id));
    extractAliases(text).forEach(alias => {
      findImagesByAlias(alias)
        .filter(node => connected.has(node.id))
        .forEach(node => ids.add(node.id));
    });
    if (!ids.size && opts.includeAllWhenEmpty) {
      (images || []).forEach(ref => ids.add(ref.id));
    }
    return ids;
  }

  function getReferencedImageIdsInOrder(text, images = []) {
    const ids = [];
    const seen = new Set();
    const connected = new Set((images || []).map(ref => ref.id));
    extractAliases(text).forEach(alias => {
      findImagesByAlias(alias)
        .filter(node => connected.has(node.id))
        .forEach(node => {
          if (seen.has(node.id)) return;
          seen.add(node.id);
          ids.push(node.id);
        });
    });
    return ids;
  }

  function renderPromptHighlight(text, connectedImages = []) {
    const connected = new Set(connectedImages.map(ref => ref.id));
    const value = stripInternalPromptTags(text || '');
    if (!value) return '';
    let cursor = 0;
    let html = '';
    value.replace(/@([\u4e00-\u9fa5\w-]+)/g, (match, alias, offset) => {
      html += escHtml(value.slice(cursor, offset));
      const active = findImagesByAlias(alias).some(node => connected.has(node.id));
      html += `<mark class="${active ? 'valid' : 'missing'}">${escHtml(match)}</mark>`;
      cursor = offset + match.length;
      return match;
    });
    html += escHtml(value.slice(cursor));
    return html;
  }

  function syncPromptHighlight(textarea, node) {
    const highlight = textarea?.closest('.v2-highlight-wrap')?.querySelector('[data-panel-highlight], [data-region-highlight]');
    if (!highlight || !node) return;
    const refs = collectRefsForNode(node);
    highlight.innerHTML = renderPromptHighlight(textarea.value, refs.images);
    highlight.scrollTop = textarea.scrollTop;
    highlight.scrollLeft = textarea.scrollLeft;

    const panel = textarea.closest('[data-panel-for]');
    const nodeForPanel = panel ? getNode(panel.dataset.panelFor) : null;
    const compiled = nodeForPanel?.type === 'generate'
      ? buildCompiledPrompt(nodeForPanel, refs)
      : null;
    const referencedIds = compiled
      ? new Set(compiled.requestImages.map(ref => ref.id))
      : getReferencedConnectedImageIds(textarea.value, refs.images);
    panel?.querySelectorAll('[data-input-image-id]').forEach(chip => {
      const active = referencedIds.has(chip.dataset.inputImageId);
      chip.classList.toggle('referenced', active);
      chip.classList.toggle('connected-only', !active);
      const label = chip.querySelector('small');
      if (label) {
        label.textContent = chip.classList.contains('v2-input-thumb')
          ? (active ? getGenerateInputChannelLabel(chip.dataset.inputRole || '') : '已连接')
          : (active ? '已引用' : (chip.classList.contains('structure-only') ? '仅结构' : '已连接'));
      }
    });
  }

  function textTemplateOptions(current) {
    const selected = current || 'auto';
    return Object.entries(TEXT_TEMPLATES)
      .map(([value, item]) => `<option value="${escHtml(value)}" ${value === selected ? 'selected' : ''}>${escHtml(item.label)}</option>`)
      .join('');
  }

  function cinemaModeOptions(current) {
    const selected = window.CinemaPrompt?.normalizeMode?.(current || 'auto') || 'auto';
    const entries = Object.entries(window.CinemaPrompt?.MODE_LABELS || {
      auto: '自动判断',
      'live-action': '真人电影感',
      anime: '动漫电影感',
      commerce: '电商电影感'
    });
    return entries
      .map(([value, label]) => `<option value="${escHtml(value)}" ${value === selected ? 'selected' : ''}>${escHtml(label)}</option>`)
      .join('');
  }

  function cinemaRoleOptions(current) {
    const selected = window.CinemaPrompt?.normalizeRole?.(current || 'style') || 'style';
    const entries = Object.entries(window.CinemaPrompt?.ROLE_LABELS || {
      subject: '主体',
      scene: '场景',
      style: '风格',
      camera: '镜头参考'
    });
    return entries
      .map(([value, label]) => `<option value="${escHtml(value)}" ${value === selected ? 'selected' : ''}>${escHtml(label)}</option>`)
      .join('');
  }

  function getTextTemplateKey(node) {
    const key = String(node?.settings?.template || '').trim();
    return TEXT_TEMPLATES[key] ? key : 'auto';
  }

  function isTextTemplatePrompt(value) {
    return PromptEngine.isTextTemplatePrompt(value) || LEGACY_TEXT_TEMPLATE_PROMPTS.has(String(value || '').trim());
  }

  // ==========================================================================
  // SECTION: 14 NODE-EVENTS
  // ==========================================================================
  function bindNodeEvents() {
    if (els.world.dataset.delegated === '1') return;
    els.world.dataset.delegated = '1';
    els.world.addEventListener('mousedown', onWorldMouseDown);
    els.world.addEventListener('click', onWorldClick);
    els.world.addEventListener('dblclick', onWorldDblClick);
    els.world.addEventListener('pointerdown', onWorldPointerDown);
    els.world.addEventListener('mouseup', onWorldMouseUp);
    els.world.addEventListener('load', onWorldLoadCapture, true);
  }

  // Buttons inside .v2-node that should never start a node drag — their
  // pointerdown/mousedown stop propagation so onNodeMouseDown skips them.
  const NODE_BUTTON_DATA_ATTRS = [
    'data-delete',
    'data-arrange-group',
    'data-ungroup',
    'data-step-version',
    'data-open-image-region',
    'data-preview-sketch',
    'data-detail-node-count',
    'data-run-detail-storyboard',
    'data-run-detail-batch',
    'data-open-detail-preview',
    'data-tryon-role',
    'data-run-tryon-all',
    'data-open-tryon-region',
    'data-cancel-generate',
    'data-open-result-region',
    'data-clear-result-region'
  ];
  const NODE_BUTTON_SELECTOR = NODE_BUTTON_DATA_ATTRS.map(a => `[${a}]`).join(',');

  function onWorldPointerDown(e) {
    if (e.target.closest('.v2-node-panel,.v2-generate-composer,.v2-focus-layer')) return;
    if (e.target.closest(NODE_BUTTON_SELECTOR)) e.stopPropagation();
  }

  function onWorldMouseDown(e) {
    if (e.target.closest('.v2-node-panel,.v2-generate-composer,.v2-focus-layer')) return;
    const target = e.target;
    const port = target.closest('.v2-port');
    if (port) {
      if (port.classList.contains('out')) {
        e.preventDefault();
        e.stopPropagation();
        const fromId = port.dataset.id;
        const start = portCenter(fromId, 'out');
        finishLinkInteraction();
        state.link = { fromId, from: start, to: start };
        state.linkTargetId = null;
        createActiveLinkPath();
        updateActiveLinkPath();
      }
      return;
    }
    if (target.closest(NODE_BUTTON_SELECTOR)) {
      e.stopPropagation();
      return;
    }
    const groupHandle = target.closest('[data-group-handle]');
    if (groupHandle) {
      onGroupHandleMouseDown(e, groupHandle);
      return;
    }
    const node = target.closest('.v2-node');
    if (node) {
      onNodeMouseDown(e, node);
      return;
    }
    const groupEl = target.closest('[data-group-id]');
    if (groupEl && target === groupEl) {
      onGroupMouseDown(e, groupEl);
    }
  }

  function onWorldMouseUp(e) {
    if (e.target.closest('.v2-node-panel,.v2-generate-composer,.v2-focus-layer')) return;
    const port = e.target.closest('.v2-port.in');
    if (!port) return;
    e.preventDefault();
    e.stopPropagation();
    if (!state.link) return;
    completeConnection(port.dataset.id);
    finishLinkInteraction({ rerender: true });
  }

  function onWorldClick(e) {
    if (e.target.closest('.v2-node-panel,.v2-generate-composer,.v2-focus-layer')) return;
    const target = e.target;
    const cancelBtn = target.closest('[data-cancel-generate]');
    if (cancelBtn) {
      e.stopPropagation();
      cancelGenerateRun(cancelBtn.dataset.cancelGenerate);
      return;
    }
    const sketchBtn = target.closest('[data-preview-sketch]');
    if (sketchBtn) {
      e.stopPropagation();
      previewSketch(sketchBtn.dataset.previewSketch);
      return;
    }
    const regionBtn = target.closest('.v2-node [data-open-image-region]');
    if (regionBtn) {
      e.stopPropagation();
      e.preventDefault();
      openRegionEditor(regionBtn.dataset.openImageRegion, { inline: true });
      return;
    }
    const stepBtn = target.closest('[data-step-version]');
    if (stepBtn) {
      e.stopPropagation();
      e.preventDefault();
      stepGenerateVersion(stepBtn.dataset.stepVersion, Number(stepBtn.dataset.dir) || 1);
      return;
    }
    const deleteBtn = target.closest('[data-delete]');
    if (deleteBtn) {
      e.stopPropagation();
      e.preventDefault();
      deleteNode(deleteBtn.dataset.delete);
      return;
    }
    const rerunDirtyBtn = target.closest('[data-rerun-dirty]');
    if (rerunDirtyBtn) {
      e.stopPropagation();
      e.preventDefault();
      rerunDirtyNode(rerunDirtyBtn.dataset.rerunDirty);
      return;
    }
    const syncGenerateBtn = target.closest('[data-sync-generate]');
    if (syncGenerateBtn) {
      e.stopPropagation();
      e.preventDefault();
      syncGenerateTaskFromBackend(syncGenerateBtn.dataset.syncGenerate);
      return;
    }
    const syncSketchBtn = target.closest('[data-sync-sketch]');
    if (syncSketchBtn) {
      e.stopPropagation();
      e.preventDefault();
      syncSketchTaskFromBackend(syncSketchBtn.dataset.syncSketch);
      return;
    }
    const arrangeBtn = target.closest('[data-arrange-group]');
    if (arrangeBtn) {
      e.stopPropagation();
      e.preventDefault();
      arrangeGroup(arrangeBtn.dataset.arrangeGroup);
      return;
    }
    const ungroupBtn = target.closest('[data-ungroup]');
    if (ungroupBtn) {
      e.stopPropagation();
      e.preventDefault();
      ungroup(ungroupBtn.dataset.ungroup);
      return;
    }
    const groupHandle = target.closest('[data-group-handle]');
    if (groupHandle) {
      if (target.closest('button')) return;
      e.stopPropagation();
      selectGroupNodes(groupHandle.dataset.groupHandle);
      return;
    }
    const node = target.closest('.v2-node');
    if (!node) return;
    if (target.closest('.v2-node-panel,.v2-generate-composer')) return;
    e.stopPropagation();
    if (state.suppressNextNodeClick) {
      state.suppressNextNodeClick = false;
      return;
    }
    if (consumePendingRegionTarget(node.dataset.id)) return;
    selectNode(node.dataset.id, e.shiftKey || e.metaKey || e.ctrlKey);
  }

  function onWorldDblClick(e) {
    if (e.target.closest('.v2-node-panel,.v2-generate-composer,.v2-focus-layer')) return;
    const target = e.target;
    const previewOutBtn = target.closest('[data-preview-output]');
    if (previewOutBtn) {
      e.stopPropagation();
      e.preventDefault();
      previewOutput(previewOutBtn.dataset.previewOutput);
      return;
    }
    const previewImgBtn = target.closest('[data-preview-image]');
    if (previewImgBtn) {
      e.stopPropagation();
      e.preventDefault();
      previewImage(previewImgBtn.dataset.previewImage);
    }
  }

  function onWorldLoadCapture(e) {
    const img = e.target;
    if (!(img instanceof HTMLImageElement)) return;
    if (!img.matches('.v2-image-preview img')) return;
    const wrap = img.closest('[data-preview-image]');
    if (!wrap?.dataset.previewImage) return;
    syncImageNodeNaturalAspect(wrap.dataset.previewImage, img);
  }

  function onNodeMouseDown(e, nodeEl) {
    if (e.button !== 0 || e.target.closest('textarea,input,select,.v2-port,.v2-highlight-wrap,.v2-ratio-popover,.v2-setting-popover,.v2-focus-layer')) return;
    const el = nodeEl || e.currentTarget;
    if (isGenerateComposerWhitespaceClick(e, el)) {
      e.preventDefault();
      e.stopPropagation();
      state.suppressNextNodeClick = true;
      clearSelection(false);
      return;
    }
    const mediaPreview = e.target.closest('[data-preview-image],[data-preview-output]');
    const interactiveButton = e.target.closest('button');
    if (interactiveButton && !mediaPreview) return;
    e.preventDefault();
    const node = getNode(el.dataset.id);
    if (!node) return;
    if (state.pendingRegionTargetId && node.type === 'image') {
      e.stopPropagation();
      state.suppressNextNodeClick = true;
      consumePendingRegionTarget(node.id);
      return;
    }
    e.stopPropagation();
    const append = e.shiftKey || e.metaKey || e.ctrlKey;
    state.pendingNodeDrag = {
      id: node.id,
      append,
      wasSelected: isNodeSelected(node.id),
      previousSelectedId: state.selectedId,
      previousSelectedIds: [...state.selectedIds],
      previousSelectedGroupIds: [...(state.selectedGroupIds || [])],
      startX: e.clientX,
      startY: e.clientY
    };
  }

  function isGenerateComposerWhitespaceClick(e, nodeEl) {
    const el = nodeEl || e.currentTarget;
    if (!el?.matches?.('.v2-node[data-type="generate"].selected')) return false;
    if (e.target.closest('.v2-node-header,.v2-media-stage,.v2-generate-composer,.v2-port')) return false;
    const node = getNode(el.dataset.id);
    if (!node?.id) return false;
    const preview = getGeneratePreviewSize(node);
    const point = screenToWorld(e.clientX, e.clientY);
    return point.y > node.y + preview.height + GENERATE_COMPOSER_GAP / 2;
  }

  function startNodeDrag(pending) {
    const node = getNode(pending.id);
    if (!node) return;
    const wasSelected = pending.wasSelected;
    if (!wasSelected) {
      state.selectedId = null;
      state.selectedIds = [node.id];
      state.selectedGroupIds = [];
      syncSelectionClasses();
    }
    const dragIds = wasSelected ? getSelectedNodeIds() : [node.id];
    hideNodePanelsDuringDrag();
    state.dragConnectionIds = getConnectionIndexesForNodes(dragIds);
    state.dragGroupIds = getAffectedGroupIdsForNodes(dragIds);
    const dragGroupBounds = getGroupBoundsSnapshot(state.dragGroupIds);
    state.drag = {
      id: node.id,
      ids: dragIds,
      startX: pending.startX,
      startY: pending.startY,
      nodeX: node.x,
      nodeY: node.y,
      wasSelected,
      previousSelectedId: pending.previousSelectedId,
      previousSelectedIds: pending.previousSelectedIds,
      previousSelectedGroupIds: pending.previousSelectedGroupIds,
      groupBounds: dragGroupBounds,
      nodes: dragIds.map(id => {
        const item = getNode(id);
        return item ? { id, x: item.x, y: item.y } : null;
      }).filter(Boolean)
    };
    setCanvasGrabbing(true);
    syncDraggingClasses(dragIds);
  }

  function onGroupHandleMouseDown(e, handleEl) {
    if (e.button !== 0 || e.target.closest('button')) return;
    e.preventDefault();
    e.stopPropagation();
    hideContextMenu();
    hideMentionMenu();
    const el = handleEl || e.currentTarget;
    startGroupDrag(el.dataset.groupHandle, e);
  }

  function onGroupMouseDown(e, groupEl) {
    if (e.button !== 0 || e.target.closest('button')) return;
    const el = groupEl || e.currentTarget;
    if (e.target !== el) return;
    e.preventDefault();
    e.stopPropagation();
    hideContextMenu();
    hideMentionMenu();
    state.pendingGroupDrag = {
      groupId: el.dataset.groupId,
      startX: e.clientX,
      startY: e.clientY
    };
    setCanvasGrabbing(true);
  }

  function startGroupDrag(groupId, e, pending = null) {
    const group = state.groups.find(item => item.id === groupId);
    if (!group) return;
    const ids = getGroupDescendantNodeIds(groupId);
    if (!ids.length) return;
    hideNodePanelsDuringDrag();
    state.dragConnectionIds = getConnectionIndexesForNodes(ids);
    state.dragGroupIds = uniqueIds([
      ...getGroupDescendantGroupIds(groupId),
      ...getAncestorGroupIdsForGroup(groupId)
    ]);
    const dragGroupBounds = getGroupBoundsSnapshot(state.dragGroupIds);
    state.groupDrag = {
      groupId: group.id,
      groupIds: getGroupDescendantGroupIds(groupId),
      previousSelectedId: state.selectedId,
      previousSelectedIds: [...state.selectedIds],
      previousSelectedGroupIds: [...(state.selectedGroupIds || [])],
      startX: pending?.startX ?? e.clientX,
      startY: pending?.startY ?? e.clientY,
      groupBounds: dragGroupBounds,
      nodes: ids.map(id => {
        const node = getNode(id);
        return { id, x: node.x, y: node.y };
      })
    };
    setCanvasGrabbing(true);
    syncGroupDraggingClass(group.id);
    syncDraggingClasses(ids);
  }

  function moveActiveGroupDrag(clientX, clientY) {
    if (!state.groupDrag) return;
    const dx = (clientX - state.groupDrag.startX) / state.zoom;
    const dy = (clientY - state.groupDrag.startY) / state.zoom;
    (state.groupDrag.nodes || []).forEach(item => {
      const node = getNode(item.id);
      if (!node) return;
      node.x = Math.round(item.x + dx);
      node.y = Math.round(item.y + dy);
    });
    updateAllGroupBounds();
    scheduleDragFrame(state.groupDrag.nodes.map(item => item.id));
  }

  // ==========================================================================
  // SECTION: 15 CANVAS-EVENTS
  // ==========================================================================
  function onCanvasMouseDown(e) {
    if (e.button !== 0 || e.target.closest('.v2-node,.v2-node-panel,.v2-header,.v2-toolbar,.v2-context-menu')) return;
    e.preventDefault();
    if (state.pendingRegionTargetId) {
      state.pendingRegionTargetId = null;
      render();
      return;
    }
    if (state.ratioPopoverNodeId || state.settingPopover) {
      state.ratioPopoverNodeId = null;
      state.settingPopover = null;
      render();
      return;
    }
    hideContextMenu();
    if (e.shiftKey) {
      const start = screenToWorld(e.clientX, e.clientY);
      state.selecting = { start, current: start };
      state.selectedId = null;
      state.selectedIds = [];
      state.selectedGroupIds = [];
      syncSelectionClasses();
      updateSelectionBox();
      return;
    }
    const hitGroup = findTopGroupAtPoint(screenToWorld(e.clientX, e.clientY));
    if (hitGroup) {
      state.pendingGroupDrag = {
        groupId: hitGroup.id,
        startX: e.clientX,
        startY: e.clientY
      };
      setCanvasGrabbing(true);
      return;
    }
    clearSelection(false);
    state.panning = {
      x: e.clientX,
      y: e.clientY,
      panX: state.panX,
      panY: state.panY
    };
    setCanvasGrabbing(true);
  }

  function onCanvasContextMenu(e) {
    e.preventDefault();
    if (e.target.closest('.v2-node,.v2-node-panel,.v2-header,.v2-toolbar,.v2-context-menu')) {
      hideContextMenu();
      return;
    }
    const point = screenToWorld(e.clientX, e.clientY);
    state.contextMenu = {
      screenX: e.clientX,
      screenY: e.clientY,
      worldX: point.x,
      worldY: point.y
    };
    showContextMenu(e.clientX, e.clientY);
  }

  function onCanvasDoubleClick(e) {
    if (e.target.closest('.v2-node,.v2-node-panel,.v2-header,.v2-toolbar,.v2-context-menu,textarea,input,select,button')) return;
    const hit = findConnectionNearPoint(e.clientX, e.clientY);
    if (!hit) return;
    e.preventDefault();
    const affectedId = hit.conn?.to || '';
    state.connections.splice(hit.index, 1);
    renderConnections();
    refreshNodesForConnectionChange([affectedId]);
    scheduleSaveWorkspace();
    toast('已取消连线', 'success');
  }

  function showContextMenu(clientX, clientY) {
    if (!els.contextMenu) return;
    const pad = 10;
    const width = 176;
    const height = Math.min(260, els.contextMenu.offsetHeight || 228);
    const left = Math.max(pad, Math.min(clientX, window.innerWidth - width - pad));
    const top = Math.max(pad, Math.min(clientY, window.innerHeight - height - pad));
    els.contextMenu.style.left = left + 'px';
    els.contextMenu.style.top = top + 'px';
    els.contextMenu.classList.add('show');
  }

  function hideContextMenu() {
    state.contextMenu = null;
    state.pendingConnection = null;
    if (state.link || state.linkTargetId) finishLinkInteraction();
    else clearLinkVisualState();
    els.contextMenu?.classList.remove('show');
  }

  function onDocumentMouseDown(e) {
    if (e.target.closest('.v2-context-menu')) return;
    if (e.target.closest('.v2-mention-menu')) return;
    if (e.target.closest('.v2-log-panel')) return;
    if (!e.target.closest('.v2-node,.v2-node-panel') && state.pendingRegionTargetId) {
      state.pendingRegionTargetId = null;
      render();
      return;
    }
    let shouldRender = false;
    if (!e.target.closest('.v2-ratio-popover,.v2-composer-pill.ratio')) {
      if (state.ratioPopoverNodeId) {
        state.ratioPopoverNodeId = null;
        shouldRender = true;
      }
    }
    if (!e.target.closest('.v2-setting-popover,.v2-composer-pill.setting')) {
      if (state.settingPopover) {
        state.settingPopover = null;
        shouldRender = true;
      }
    }
    if (shouldRender) render();
    if (state.suppressNextContextClose) {
      state.suppressNextContextClose = false;
      return;
    }
    hideContextMenu();
    hideMentionMenu();
  }

  function addNodeFromContext(type) {
    if (!type) return;
    const point = state.contextMenu || screenToWorld(window.innerWidth / 2, window.innerHeight / 2);
    const pending = state.pendingConnection;
    hideContextMenu();
    const node = addNode(type, { x: point.worldX, y: point.worldY });
    if (pending?.fromId && pending.fromId !== node.id) {
      connectNodes(pending.fromId, node.id);
      toast('已创建并连接节点', 'success');
    }
  }

  // ==========================================================================
  // SECTION: 16 POINTER-MOTION
  // ==========================================================================
  function onMouseMove(e) {
    if (state.minimapDrag) {
      focusMinimapPoint(e.clientX, e.clientY);
      return;
    }
    if (state.groupDrag) {
      moveActiveGroupDrag(e.clientX, e.clientY);
      return;
    }
    if (state.pendingGroupDrag) {
      const moved = Math.hypot(e.clientX - state.pendingGroupDrag.startX, e.clientY - state.pendingGroupDrag.startY);
      if (moved < DRAG_START_PX) return;
      startGroupDrag(state.pendingGroupDrag.groupId, e, state.pendingGroupDrag);
      state.pendingGroupDrag = null;
      moveActiveGroupDrag(e.clientX, e.clientY);
      return;
    }
    if (state.pendingNodeDrag) {
      const moved = Math.hypot(e.clientX - state.pendingNodeDrag.startX, e.clientY - state.pendingNodeDrag.startY);
      if (moved < DRAG_START_PX) return;
      startNodeDrag(state.pendingNodeDrag);
      state.pendingNodeDrag = null;
    }
    if (state.drag) {
      const dx = (e.clientX - state.drag.startX) / state.zoom;
      const dy = (e.clientY - state.drag.startY) / state.zoom;
      (state.drag.nodes || []).forEach(item => {
        const node = getNode(item.id);
        if (!node) return;
        node.x = Math.round(item.x + dx);
        node.y = Math.round(item.y + dy);
      });
      updateAllGroupBounds();
      scheduleDragFrame(state.drag.nodes.map(item => item.id));
      return;
    }
    if (state.selecting) {
      state.selecting.current = screenToWorld(e.clientX, e.clientY);
      updateSelectionBox();
      return;
    }
    if (state.panning) {
      state.panX = state.panning.panX + e.clientX - state.panning.x;
      state.panY = state.panning.panY + e.clientY - state.panning.y;
      scheduleViewportFrame();
      return;
    }
    if (state.link) {
      state.link.to = screenToWorld(e.clientX, e.clientY);
      const nextTargetId = findConnectionTarget(e.clientX, e.clientY);
      if (nextTargetId !== state.linkTargetId) {
        state.linkTargetId = nextTargetId;
        syncLinkTargetClass();
      }
      scheduleLinkFrame();
    }
  }

  function onMouseUp(e) {
    const pendingNodeClick = state.pendingNodeDrag;
    const pendingGroupClick = state.pendingGroupDrag;
    const hadDrag = Boolean(state.drag);
    const dragState = state.drag;
    const groupDragState = state.groupDrag;
    const draggedNodeIds = uniqueIds([
      ...(state.drag?.nodes || []).map(item => item.id),
      ...(state.groupDrag?.nodes || []).map(item => item.id)
    ]);
    const affectedDragGroupIds = uniqueIds(state.dragGroupIds || []);
    const hadPanning = Boolean(state.panning);
    const hadLink = Boolean(state.link);
    const hadLinkTarget = Boolean(state.linkTargetId);
    const hadSelecting = Boolean(state.selecting);
    const hadMinimapDrag = Boolean(state.minimapDrag);
    const hadGroupDrag = Boolean(state.groupDrag);
    if (hadDrag || hadGroupDrag) flushDragFrame();
    const joinedGroup = hadDrag ? handleDraggedNodesDropped() : false;
    if (hadDrag || hadGroupDrag) commitNodeDomPositions(draggedNodeIds);

    if (hadDrag || hadPanning || hadMinimapDrag || hadGroupDrag || joinedGroup) scheduleSaveWorkspace();
    if (hadSelecting) {
      finishSelection();
    }
    if (hadLink) {
      e.preventDefault();
      e.stopPropagation();
      const toId = findConnectionTarget(e.clientX, e.clientY);
      if (toId) {
        completeConnection(toId);
        finishLinkInteraction({ rerender: true });
      } else {
        showConnectionCreateMenu(e.clientX, e.clientY);
      }
    }
    state.drag = null;
    state.pendingNodeDrag = null;
    state.pendingGroupDrag = null;
    state.panning = null;
    state.selecting = null;
    state.minimapDrag = null;
    state.groupDrag = null;
    state.dragConnectionIds = null;
    state.dragGroupIds = null;
    updateSelectionBox();
    setCanvasGrabbing(false);
    if (groupDragState) {
      state.selectedId = groupDragState.previousSelectedId || null;
      state.selectedIds = Array.isArray(groupDragState.previousSelectedIds) ? groupDragState.previousSelectedIds : [];
      state.selectedGroupIds = Array.isArray(groupDragState.previousSelectedGroupIds) ? groupDragState.previousSelectedGroupIds : [];
    }
    if (dragState && !dragState.wasSelected) {
      state.selectedId = dragState.previousSelectedId || null;
      state.selectedIds = Array.isArray(dragState.previousSelectedIds) ? dragState.previousSelectedIds : [];
      state.selectedGroupIds = Array.isArray(dragState.previousSelectedGroupIds) ? dragState.previousSelectedGroupIds : [];
      syncSelectionClasses();
    }
    clearDragVisualState();
    if (!state.pendingConnection && !state.link) clearLinkVisualState();
    if (pendingNodeClick && !hadDrag && !hadGroupDrag && !hadPanning && !hadSelecting && !hadLink) {
      const { id, append } = pendingNodeClick;
      if (append || !isNodeSelected(id)) selectNode(id, append);
      state.suppressNextNodeClick = true;
      return;
    }
    if (pendingGroupClick && !hadDrag && !hadGroupDrag && !hadPanning && !hadSelecting && !hadLink) {
      clearSelection(false);
      return;
    }
    if (hadDrag || hadGroupDrag || joinedGroup) {
      state.suppressNextNodeClick = true;
      updateGroupBoundsForIds(affectedDragGroupIds.length ? affectedDragGroupIds : getAffectedGroupIdsForNodes(draggedNodeIds));
      syncGroupDom();
      renderConnections();
      scheduleMinimapFrame(true);
      restoreNodePanelsAfterDrag();
    }
    if (hadPanning || hadMinimapDrag) {
      scheduleViewportFrame();
      scheduleMinimapFrame();
    }
    if (hadSelecting) {
      syncSelectionClasses();
      scheduleSaveWorkspace();
    }
  }

  // ==========================================================================
  // SECTION: 17 CONNECTIONS
  // ==========================================================================
  function onPortOutDown(e) {
    e.preventDefault();
    e.stopPropagation();
    const fromId = e.currentTarget.dataset.id;
    const start = portCenter(fromId, 'out');
    finishLinkInteraction();
    state.link = { fromId, from: start, to: start };
    state.linkTargetId = null;
    createActiveLinkPath();
    updateActiveLinkPath();
  }

  function onPortInUp(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!state.link) return;
    const toId = e.currentTarget.dataset.id;
    completeConnection(toId);
    finishLinkInteraction({ rerender: true });
  }

  function showConnectionCreateMenu(clientX, clientY) {
    if (!state.link?.fromId) return;
    const fromId = state.link.fromId;
    const point = screenToWorld(clientX, clientY);
    state.pendingConnection = { fromId };
    state.contextMenu = {
      screenX: clientX,
      screenY: clientY,
      worldX: point.x,
      worldY: point.y
    };
    state.suppressNextContextClose = true;
    showContextMenu(clientX, clientY);
    finishLinkInteraction({ keepPendingConnection: true });
  }

  function findConnectionTarget(clientX, clientY) {
    const el = document.elementFromPoint(clientX, clientY);
    const port = el?.closest?.('.v2-port.in');
    if (port?.dataset.id) return port.dataset.id;
    const nodeEl = el?.closest?.('.v2-node');
    if (nodeEl?.dataset.id) return nodeEl.dataset.id;

    let best = null;
    let bestDistance = 52;
    state.nodes.forEach(node => {
      if (!state.link || node.id === state.link.fromId) return;
      const port = portCenter(node.id, 'in');
      if (!port) return;
      const center = worldToScreen(port.x, port.y);
      const distance = Math.hypot(center.x - clientX, center.y - clientY);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = node.id;
      }
    });
    return best;
  }

  function completeConnection(toId) {
    if (!state.link || !toId || state.link.fromId === toId) return false;
    return connectNodes(state.link.fromId, toId);
  }

  function connectNodes(fromId, toId) {
    if (!fromId || !toId || fromId === toId) return false;
    const exists = state.connections.some(conn => conn.from === fromId && conn.to === toId);
    if (exists) return false;
    state.connections.push({ from: fromId, to: toId });
    applyConnectionData(fromId, toId);
    refreshNodesForConnectionChange([toId]);
    // UI: 新连接会让"已有输出的下游节点"变 dirty（输入源变了）
    markUpstreamDirty(fromId);
    const index = state.connections.length - 1;
    const from = portCenter(fromId, 'out');
    const to = portCenter(toId, 'in');
    if (from && to) upsertConnectionPath(index, curvePath(from, to));
    else renderConnections();
    scheduleSaveWorkspace();
    return true;
  }

  function connectNodesSilently(fromId, toId) {
    if (!fromId || !toId || fromId === toId) return false;
    if (state.connections.some(conn => conn.from === fromId && conn.to === toId)) return false;
    state.connections.push({ from: fromId, to: toId });
    applyConnectionData(fromId, toId);
    return true;
  }

  function findConnectionNearPoint(clientX, clientY) {
    let best = null;
    let bestDistance = 24;
    state.connections.forEach((conn, index) => {
      const from = portCenter(conn.from, 'out');
      const to = portCenter(conn.to, 'in');
      if (!from || !to) return;
      const distance = distanceToBezierScreen(clientX, clientY, from, to);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = { conn, index, distance };
      }
    });
    return best;
  }

  // ==========================================================================
  // SECTION: 18 SELECTION-BOX
  // ==========================================================================
  function selectionRect() {
    if (!state.selecting) return null;
    const a = state.selecting.start;
    const b = state.selecting.current;
    const x = Math.min(a.x, b.x);
    const y = Math.min(a.y, b.y);
    return {
      x,
      y,
      w: Math.abs(a.x - b.x),
      h: Math.abs(a.y - b.y)
    };
  }

  function updateSelectionBox() {
    if (!els.selectionBox) return;
    const rect = selectionRect();
    if (!rect) {
      els.selectionBox.classList.remove('show');
      return;
    }
    const screen = worldToScreen(rect.x, rect.y);
    els.selectionBox.style.left = screen.x + 'px';
    els.selectionBox.style.top = screen.y + 'px';
    els.selectionBox.style.width = rect.w * state.zoom + 'px';
    els.selectionBox.style.height = rect.h * state.zoom + 'px';
    els.selectionBox.classList.add('show');
  }

  function finishSelection() {
    const rect = selectionRect();
    if (!rect) return;
    updateAllGroupBounds();
    const groupIds = state.groups
      .filter(group => rectsIntersect(rect, group))
      .map(group => group.id);
    const groupedNodeIds = new Set(groupIds.flatMap(id => getGroupDescendantNodeIds(id)));
    const ids = state.nodes
      .filter(node => rectsIntersect(rect, getNodeBox(node)))
      .map(node => node.id);
    state.selectedIds = uniqueIds([...ids, ...groupedNodeIds]);
    state.selectedGroupIds = groupIds;
    state.selectedId = ids[0] || null;
    scheduleSaveWorkspace();
  }

  function rectsIntersect(a, b) {
    return a.x <= b.x + b.w && a.x + a.w >= b.x && a.y <= b.y + b.h && a.y + a.h >= b.y;
  }

  function screenRectToRegionRect(screenRect) {
    const stageRect = state.regionEditor?.inline
      ? getInlineFocusImageDisplayRect(state.regionEditor.sourceId || state.regionEditor.nodeId)
      : getRegionImageDisplayRect();
    if (!stageRect) return null;
    const left = Math.max(stageRect.left, Math.min(screenRect.x, screenRect.x + screenRect.w));
    const top = Math.max(stageRect.top, Math.min(screenRect.y, screenRect.y + screenRect.h));
    const right = Math.min(stageRect.right, Math.max(screenRect.x, screenRect.x + screenRect.w));
    const bottom = Math.min(stageRect.bottom, Math.max(screenRect.y, screenRect.y + screenRect.h));
    const w = right - left;
    const h = bottom - top;
    if (w <= 0 || h <= 0) return null;
    return normalizeRegionRect({
      x: (left - stageRect.left) / stageRect.width,
      y: (top - stageRect.top) / stageRect.height,
      w: w / stageRect.width,
      h: h / stageRect.height
    });
  }

  function getRegionImageDisplayRect() {
    const img = els.regionImg;
    if (!img?.naturalWidth || !img?.naturalHeight) return null;
    const rect = img.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    return {
      left: rect.left,
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      width: rect.width,
      height: rect.height
    };
  }

  function updateRegionSelectionBox(rect = state.regionEditor?.rect || null) {
    const box = els.regionSelection;
    const imgRect = getRegionImageDisplayRect();
    if (!box || !imgRect || !rect) {
      box?.classList.remove('show');
      return;
    }
    box.style.left = (imgRect.left - els.regionStage.getBoundingClientRect().left + rect.x * imgRect.width) + 'px';
    box.style.top = (imgRect.top - els.regionStage.getBoundingClientRect().top + rect.y * imgRect.height) + 'px';
    box.style.width = (rect.w * imgRect.width) + 'px';
    box.style.height = (rect.h * imgRect.height) + 'px';
    box.classList.add('show');
  }

  function pointInRect(point, rect) {
    return point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h;
  }

  function findTopGroupAtPoint(point) {
    let best = null;
    let bestDepth = -1;
    let bestIndex = -1;
    state.groups.forEach((group, index) => {
      normalizeGroupShape(group);
      if (!pointInRect(point, group)) return;
      const depth = getGroupDepth(group.id);
      if (depth > bestDepth || (depth === bestDepth && index > bestIndex)) {
        best = group;
        bestDepth = depth;
        bestIndex = index;
      }
    });
    return best;
  }

  function getNodeOwnerGroupIds(nodeId) {
    if (!nodeId) return [];
    return state.groups
      .filter(group => {
        normalizeGroupShape(group);
        return group.nodeIds.includes(nodeId);
      })
      .map(group => group.id);
  }

  function getGroupDepth(groupId, seen = new Set()) {
    if (!groupId || seen.has(groupId)) return 0;
    seen.add(groupId);
    const parents = getDirectParentGroupIds(groupId);
    if (!parents.length) return 0;
    return 1 + Math.max(...parents.map(id => getGroupDepth(id, seen)));
  }

  // ==========================================================================
  // SECTION: 19 GROUP-MGMT
  // ==========================================================================
  function selectGroupNodes(groupId) {
    const group = state.groups.find(item => item.id === groupId);
    if (!group) return;
    const ids = getGroupDescendantNodeIds(groupId);
    state.selectedIds = ids;
    state.selectedGroupIds = [groupId];
    state.selectedId = null;
    render();
    scheduleSaveWorkspace();
  }

  function ungroup(groupId) {
    const group = state.groups.find(item => item.id === groupId);
    if (!group) return;
    normalizeGroupShape(group);
    const parentIds = getDirectParentGroupIds(groupId);
    const directNodeIds = group.nodeIds.filter(id => getNode(id));
    const directChildGroupIds = group.childGroupIds.filter(id => state.groups.some(item => item.id === id));
    const selectedIds = uniqueIds([
      ...directNodeIds,
      ...directChildGroupIds.flatMap(id => getGroupDescendantNodeIds(id))
    ]).filter(id => getNode(id));
    state.groups = state.groups.filter(item => item.id !== groupId);
    state.groups.forEach(item => {
      normalizeGroupShape(item);
      if (!parentIds.includes(item.id)) {
        item.childGroupIds = item.childGroupIds.filter(id => id !== groupId);
        return;
      }
      item.childGroupIds = uniqueIds([
        ...item.childGroupIds.filter(id => id !== groupId),
        ...directChildGroupIds
      ]);
      item.nodeIds = uniqueIds([...item.nodeIds, ...directNodeIds]);
    });
    state.selectedIds = selectedIds;
    state.selectedGroupIds = directChildGroupIds;
    state.selectedId = selectedIds[0] || null;
    cleanupGroups();
    render();
    scheduleSaveWorkspace();
    toast('已取消编组', 'success');
  }

  function handleDraggedNodesDropped() {
    const dragIds = uniqueIds(state.drag?.ids || state.drag?.nodes?.map(item => item.id) || []);
    const ids = dragIds.filter(id => getNode(id));
    if (!ids.length || !state.groups.length) return false;
    const ownerIds = uniqueIds(ids.flatMap(getNodeOwnerGroupIds));
    if (ownerIds.length) return false;

    const target = findDropGroupForNodes(ids);
    if (!target) return false;

    const changed = assignNodesToGroup(ids, target.id);
    if (changed) toast('已加入编组', 'success');
    return changed;
  }

  function findDropGroupForNodes(ids) {
    const ownerIds = new Set(ids.flatMap(getNodeOwnerGroupIds));
    const groups = [...state.groups]
      .reverse()
      .filter(group => !ownerIds.has(group.id) && !ids.some(id => group.nodeIds.includes(id)));
    for (const id of ids) {
      const node = getNode(id);
      if (!node) continue;
      const box = getNodeBox(node);
      const center = { x: box.x + box.w / 2, y: box.y + box.h / 2 };
      const target = groups.find(group => pointInRect(center, group));
      if (target) return target;
    }
    return null;
  }

  function assignNodesToGroup(ids, groupId) {
    const target = state.groups.find(group => group.id === groupId);
    if (!target) return false;
    const moveIds = uniqueIds(ids).filter(id => getNode(id));
    if (!moveIds.length) return false;

    let changed = false;
    state.groups.forEach(group => {
      const before = group.nodeIds.length;
      group.nodeIds = group.nodeIds.filter(id => group.id === groupId || !moveIds.includes(id));
      if (group.nodeIds.length !== before) changed = true;
    });

    const beforeTarget = target.nodeIds.length;
    target.nodeIds = uniqueIds([...target.nodeIds, ...moveIds]);
    if (target.nodeIds.length !== beforeTarget) changed = true;
    cleanupGroups();
    return changed;
  }

  function assignGroupsToGroup(childGroupIds, groupId) {
    const target = state.groups.find(group => group.id === groupId);
    if (!target) return false;
    normalizeGroupShape(target);
    const moveGroupIds = uniqueIds(childGroupIds)
      .filter(id => id !== groupId && state.groups.some(group => group.id === id))
      .filter(id => !isGroupDescendantOf(groupId, id));
    if (!moveGroupIds.length) return false;
    const moveSet = new Set(moveGroupIds);
    let changed = false;
    state.groups.forEach(group => {
      normalizeGroupShape(group);
      if (group.id === groupId || moveSet.has(group.id)) return;
      const before = group.childGroupIds.length;
      group.childGroupIds = group.childGroupIds.filter(id => !moveSet.has(id));
      if (group.childGroupIds.length !== before) changed = true;
    });
    const before = target.childGroupIds.length;
    target.childGroupIds = uniqueIds([...target.childGroupIds, ...moveGroupIds]);
    if (target.childGroupIds.length !== before) changed = true;
    cleanupGroups();
    return changed;
  }

  function assignNewNodeToContainingGroup(node) {
    if (!node || !state.groups.length) return false;
    const target = findContainingGroupForNode(node);
    if (!target) return false;
    const changed = assignNodesToGroup([node.id], target.id);
    if (changed) updateGroupBounds(target);
    return changed;
  }

  function findContainingGroupForNode(node) {
    const box = getNodeBox(node);
    const center = { x: box.x + box.w / 2, y: box.y + box.h / 2 };
    return [...state.groups].reverse().find(group => pointInRect(center, group)) || null;
  }

  function arrangeCanvas() {
    arrangeNodes(state.nodes.map(node => node.id));
    fitView(false);
    scheduleSaveWorkspace();
    toast('画布已整理', 'success');
  }

  function arrangeGroup(groupId) {
    const group = state.groups.find(item => item.id === groupId);
    if (!group) return;
    arrangeNodes(group.nodeIds, group.x + 34, group.y + 34);
    updateGroupBounds(group);
    render();
    scheduleSaveWorkspace();
    toast('组内节点已整理', 'success');
  }

  function arrangeNodes(nodeIds, startX, startY) {
    const nodes = nodeIds.map(getNode).filter(Boolean);
    if (!nodes.length) return;
    const ids = new Set(nodes.map(node => node.id));
    const incoming = new Map(nodes.map(node => [node.id, 0]));
    const outgoing = new Map(nodes.map(node => [node.id, []]));
    state.connections.forEach(conn => {
      if (!ids.has(conn.from) || !ids.has(conn.to)) return;
      outgoing.get(conn.from).push(conn.to);
      incoming.set(conn.to, (incoming.get(conn.to) || 0) + 1);
    });

    const level = new Map();
    const queue = nodes.filter(node => (incoming.get(node.id) || 0) === 0).map(node => node.id);
    nodes.forEach(node => level.set(node.id, 0));
    while (queue.length) {
      const id = queue.shift();
      const nextLevel = (level.get(id) || 0) + 1;
      (outgoing.get(id) || []).forEach(toId => {
        if (nextLevel > (level.get(toId) || 0)) level.set(toId, nextLevel);
        incoming.set(toId, (incoming.get(toId) || 1) - 1);
        if (incoming.get(toId) === 0) queue.push(toId);
      });
    }

    const minX = Number.isFinite(startX) ? startX : Math.min(...nodes.map(node => node.x));
    const minY = Number.isFinite(startY) ? startY : Math.min(...nodes.map(node => node.y));
    const columns = new Map();
    nodes.forEach(node => {
      const col = level.get(node.id) || 0;
      if (!columns.has(col)) columns.set(col, []);
      columns.get(col).push(node);
    });
    Array.from(columns.keys()).sort((a, b) => a - b).forEach(col => {
      let y = minY;
      columns.get(col)
        .sort((a, b) => a.y - b.y || a.x - b.x)
        .forEach(node => {
          node.x = Math.round(minX + col * (GENERATE_NODE_W + ARRANGE_COL_GAP));
          node.y = Math.round(y);
          y += getNodeBox(node).h + ARRANGE_ROW_GAP;
        });
    });
    updateAllGroupBounds();
    render();
  }

  // ==========================================================================
  // SECTION: 20 CONNECTION-RENDER
  // ==========================================================================
  function distanceToBezierScreen(clientX, clientY, fromWorld, toWorld) {
    const a = worldToScreen(fromWorld.x, fromWorld.y);
    const b = worldToScreen(toWorld.x, toWorld.y);
    const mid = (a.x + b.x) / 2;
    const p0 = a;
    const p1 = { x: mid, y: a.y };
    const p2 = { x: mid, y: b.y };
    const p3 = b;
    let min = Infinity;
    let prev = p0;
    for (let i = 1; i <= 32; i += 1) {
      const t = i / 32;
      const point = cubicPoint(p0, p1, p2, p3, t);
      min = Math.min(min, distanceToSegment(clientX, clientY, prev.x, prev.y, point.x, point.y));
      prev = point;
    }
    return min;
  }

  function cubicPoint(p0, p1, p2, p3, t) {
    const u = 1 - t;
    const tt = t * t;
    const uu = u * u;
    const uuu = uu * u;
    const ttt = tt * t;
    return {
      x: uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x,
      y: uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y
    };
  }

  function distanceToSegment(px, py, ax, ay, bx, by) {
    const dx = bx - ax;
    const dy = by - ay;
    const lenSq = dx * dx + dy * dy;
    if (!lenSq) return Math.hypot(px - ax, py - ay);
    const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
    return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
  }

  function applyConnectionData(fromId, toId) {
    const from = getNode(fromId);
    const to = getNode(toId);
    if (!from || !to) return;
    if (to.type === 'generate' && from.type === 'text' && !to.text.includes('@' + (from.alias || ''))) {
      to.text = to.text || '';
    }
    if (to.type === 'text') to.promptSkeleton = null;
  }

  // P0 优化：连线 path 字符串缓存，仅当 path 字符串变化时才 setAttribute
  const _connPathCache = new Map();

  function renderConnections(onlyIndexes = null) {
    const partial = Array.isArray(onlyIndexes);
    if (partial) {
      const indexSet = new Set(onlyIndexes);
      state.connections.forEach((conn, index) => {
        if (!indexSet.has(index)) return;
        const from = portCenter(conn.from, 'out');
        const to = portCenter(conn.to, 'in');
        if (!from || !to) return;
        const newD = curvePath(from, to);
        if (_connPathCache.get(index) !== newD) {
          _connPathCache.set(index, newD);
          upsertConnectionPath(index, newD);
        }
      });
      return;
    }
    // 全量渲染：清缓存（布局已变，所有 path 都需重算）
    _connPathCache.clear();
    const paths = [];
    state.connections.forEach((conn, index) => {
      const from = portCenter(conn.from, 'out');
      const to = portCenter(conn.to, 'in');
      if (!from || !to) return;
      const d = curvePath(from, to);
      _connPathCache.set(index, d);
      paths.push(`<path class="v2-connection" data-conn-index="${index}" d="${d}"></path>`);
    });
    els.connections.innerHTML = paths.join('');
    if (state.link) {
      createActiveLinkPath();
      updateActiveLinkPath();
    } else {
      clearActiveLinkPath();
    }
  }

  function upsertConnectionPath(index, d) {
    let path = els.connections.querySelector(`.v2-connection[data-conn-index="${index}"]`);
    if (!path) {
      path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('class', 'v2-connection');
      path.dataset.connIndex = String(index);
      els.connections.appendChild(path);
    }
    path.setAttribute('d', d);
  }

  function createActiveLinkPath() {
    if (!els.connections || els.connections.querySelector('.v2-connection.active')) return;
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('class', 'v2-connection active');
    els.connections.appendChild(path);
  }

  function updateActiveLinkPath() {
    if (!state.link) {
      clearActiveLinkPath();
      return;
    }
    createActiveLinkPath();
    els.connections.querySelector('.v2-connection.active')?.setAttribute('d', curvePath(state.link.from, state.link.to));
  }

  function clearActiveLinkPath() {
    els.connections?.querySelectorAll('.v2-connection.active').forEach(path => path.remove());
  }

  function portCenter(nodeId, port) {
    const node = getNode(nodeId);
    if (!node) return null;
    const box = getNodeBox(node);
    return {
      x: node.x + (port === 'out' ? box.w : 0),
      y: node.y + getMediaPortY(node)
    };
  }

  function curvePath(a, b) {
    const mid = (a.x + b.x) / 2;
    return `M ${a.x} ${a.y} C ${mid} ${a.y}, ${mid} ${b.y}, ${b.x} ${b.y}`;
  }

  // ==========================================================================
  // SECTION: 21 VIEWPORT
  // ==========================================================================
  function onWheel(e) {
    if (isPreviewModalOpen()) {
      onPreviewWheel(e);
      return;
    }
    if (!isCanvasEvent(e)) return;
    if (isInternalScrollTarget(e.target)) {
      return;
    }
    if (state.gesture) {
      e.preventDefault();
      return;
    }
    e.preventDefault();
    hideContextMenu();
    const rect = els.canvas.getBoundingClientRect();
    const pointerX = e.clientX - rect.left;
    const pointerY = e.clientY - rect.top;
    const shouldZoom = e.ctrlKey || e.metaKey;
    if (shouldZoom) {
      const sensitivity = e.ctrlKey ? PINCH_ZOOM_SENSITIVITY : MODIFIER_ZOOM_SENSITIVITY;
      const delta = Math.max(-80, Math.min(80, e.deltaY));
      zoomAt(pointerX, pointerY, Math.exp(-delta * sensitivity));
      return;
    }
    const panScale = e.deltaMode === WheelEvent.DOM_DELTA_LINE ? 16 : 1;
    state.panX -= e.deltaX * panScale;
    state.panY -= e.deltaY * panScale;
    scheduleViewportFrame();
    scheduleSaveWorkspace();
  }

  function onGestureStart(e) {
    if (isPreviewModalOpen()) {
      onPreviewGestureStart(e);
      return;
    }
    if (!isCanvasEvent(e)) return;
    if (isInternalScrollTarget(e.target)) {
      return;
    }
    e.preventDefault();
    hideContextMenu();
    const point = eventCanvasPoint(e);
    state.gesture = {
      startZoom: state.zoom,
      lastScale: Math.pow(Math.max(0.2, Math.min(5, Number(e.scale) || 1)), GESTURE_ZOOM_POWER),
      x: point.x,
      y: point.y
    };
  }

  function onGestureChange(e) {
    if (isPreviewModalOpen()) {
      onPreviewGestureChange(e);
      return;
    }
    if (!state.gesture) return;
    e.preventDefault();
    const scale = Math.max(0.2, Math.min(5, Number(e.scale) || 1));
    const acceleratedScale = Math.pow(scale, GESTURE_ZOOM_POWER);
    const factor = acceleratedScale / (state.gesture.lastScale || 1);
    state.gesture.lastScale = acceleratedScale;
    zoomAt(state.gesture.x, state.gesture.y, factor, false);
  }

  function onGestureEnd(e) {
    if (isPreviewModalOpen()) {
      onPreviewGestureEnd(e);
      return;
    }
    if (!state.gesture) return;
    e.preventDefault();
    state.gesture = null;
    scheduleSaveWorkspace();
  }

  function eventCanvasPoint(e) {
    const rect = els.canvas.getBoundingClientRect();
    return {
      x: (Number.isFinite(e.clientX) ? e.clientX : rect.left + rect.width / 2) - rect.left,
      y: (Number.isFinite(e.clientY) ? e.clientY : rect.top + rect.height / 2) - rect.top
    };
  }

  function isCanvasEvent(e) {
    if (!els.canvas) return false;
    const target = e.target;
    if (target?.closest?.('#v2Canvas')) return true;
    if (Number.isFinite(e.clientX) && Number.isFinite(e.clientY)) {
      const rect = els.canvas.getBoundingClientRect();
      return e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
    }
    return target === window || target === document || target === document.body || target === document.documentElement;
  }

  function isInternalScrollTarget(target) {
    return Boolean(target?.closest?.('textarea, select, input, .v2-result, .v2-library-grid, .v2-sketch-canvas-shell, .v2-mention-menu, .v2-assistant-panel, .v2-assistant-log, .v2-chat-log, .v2-detail-page-panel, .v2-detail-page-flow'));
  }

  function zoomBy(delta) {
    const rect = els.canvas.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    zoomAt(centerX, centerY, delta > 0 ? 1.08 : 1 / 1.08);
  }

  function zoomAt(screenX, screenY, factor, save = true) {
    const worldX = (screenX - state.panX) / state.zoom;
    const worldY = (screenY - state.panY) / state.zoom;
    const nextZoom = clampZoom(state.zoom * factor);
    state.zoom = nextZoom;
    state.panX = screenX - worldX * state.zoom;
    state.panY = screenY - worldY * state.zoom;
    scheduleViewportFrame();
    if (save) scheduleSaveWorkspace();
  }

  function clampZoom(value) {
    return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, value));
  }

  function scheduleSaveWorkspace(delay = 600) {
    // Default debounce raised from 180ms → 600ms so high-frequency events
    // (wheel, gesture, drag-while-moving) coalesce instead of triggering
    // localStorage writes mid-interaction. Callers that need an immediate
    // save can pass delay=0.
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveWorkspace, delay);
  }

  function fitView(save = true) {
    if (!state.nodes.length) return;
    const boxes = state.nodes.map(getNodeBox);
    const minX = Math.min(...boxes.map(box => box.x));
    const minY = Math.min(...boxes.map(box => box.y));
    const maxX = Math.max(...boxes.map(box => box.x + box.w));
    const maxY = Math.max(...boxes.map(box => box.y + box.h));
    const rect = els.canvas.getBoundingClientRect();
    const availableW = Math.max(320, rect.width - 180);
    const availableH = Math.max(240, rect.height - 160);
    const worldW = maxX - minX;
    const worldH = maxY - minY;
    const nextZoom = Math.min(1.15, availableW / (worldW + 160), availableH / (worldH + 160));
    state.zoom = Math.max(FIT_VIEW_MIN_ZOOM, Math.min(MAX_ZOOM, nextZoom));
    state.panX = (rect.width - worldW * state.zoom) / 2 - minX * state.zoom;
    state.panY = (rect.height - worldH * state.zoom) / 2 - minY * state.zoom;
    render();
    if (save) scheduleSaveWorkspace();
  }

  function fitAllNodesView(save = true) {
    if (!state.nodes.length) return;
    const boxes = state.nodes.map(getNodeBox);
    const minX = Math.min(...boxes.map(box => box.x));
    const minY = Math.min(...boxes.map(box => box.y));
    const maxX = Math.max(...boxes.map(box => box.x + box.w));
    const maxY = Math.max(...boxes.map(box => box.y + box.h));
    const rect = els.canvas.getBoundingClientRect();
    const margin = 72;
    const worldW = Math.max(1, maxX - minX);
    const worldH = Math.max(1, maxY - minY);
    const availableW = Math.max(160, rect.width - margin * 2);
    const availableH = Math.max(140, rect.height - margin * 2);
    const nextZoom = Math.min(MAX_ZOOM, availableW / worldW, availableH / worldH);
    state.zoom = Math.max(FIT_VIEW_MIN_ZOOM, nextZoom);
    state.panX = (rect.width - worldW * state.zoom) / 2 - minX * state.zoom;
    state.panY = (rect.height - worldH * state.zoom) / 2 - minY * state.zoom;
    render();
    if (save) scheduleSaveWorkspace();
  }

  // ==========================================================================
  // SECTION: 22 SELECTION
  // ==========================================================================
  function isNodeSelected(id) {
    return state.selectedIds.includes(id) || state.selectedId === id;
  }

  function getSelectedNodeIds() {
    const ids = state.selectedIds.length ? state.selectedIds : (state.selectedId ? [state.selectedId] : []);
    return ids.filter(id => getNode(id));
  }

  function selectNode(id, append = false) {
    if (!id) return;
    const previousIds = getSelectedNodeIds();
    const before = getSelectedNodeIds().join('|') + '::' + (state.selectedId || '') + '::' + getSelectedGroupIds().join('|');
    if (append) {
      const set = new Set(getSelectedNodeIds());
      if (set.has(id)) set.delete(id);
      else set.add(id);
      state.selectedIds = Array.from(set);
      state.selectedId = state.selectedIds[state.selectedIds.length - 1] || null;
    } else {
      state.selectedId = id;
      state.selectedIds = [id];
      state.selectedGroupIds = [];
    }
    const after = getSelectedNodeIds().join('|') + '::' + (state.selectedId || '') + '::' + getSelectedGroupIds().join('|');
    if (before === after) return;
    refreshSelectionOnly(previousIds);
    scheduleSaveWorkspace();
  }

  function focusNodeById(nodeId, options = {}) {
    const node = getNode(nodeId);
    if (!node) return false;
    selectNode(node.id);
    const box = getNodeBox(node);
    state.panX = Math.round(window.innerWidth / 2 - (node.x + box.w / 2) * state.zoom);
    state.panY = Math.round(window.innerHeight / 2 - (node.y + box.h / 2) * state.zoom);
    render();
    if (options.save !== false) scheduleSaveWorkspace();
    if (options.toast) toast(`已定位到 ${node.title || node.alias || '节点'}`, 'success');
    return true;
  }

  function clearSelection(renderNow = true) {
    if (!state.selectedId && !state.selectedIds.length && !getSelectedGroupIds().length) return;
    const previouslySelectedIds = getSelectedNodeIds();
    state.selectedId = null;
    state.selectedIds = [];
    state.selectedGroupIds = [];
    if (renderNow) render();
    else {
      syncSelectionClasses();
      els.world?.querySelectorAll('.v2-node-panel').forEach(panel => panel.remove());
      els.world?.querySelectorAll('.v2-generate-composer').forEach(panel => panel.remove());
      _panelHtmlCache = '';
      invalidateNodeRenderCaches(previouslySelectedIds.filter(id => getNode(id)?.type === 'generate'));
      previouslySelectedIds.forEach(id => {
        const node = getNode(id);
        const el = node ? els.world?.querySelector(`.v2-node[data-id="${cssEscape(id)}"]`) : null;
        if (node?.type === 'generate' && el) el.style.height = getNodeBox(node).h + 'px';
      });
    }
  }

  function deleteNode(id) {
    const node = getNode(id);
    if (node) {
      // 移入回收站，保留完整节点数据
      state.trash.push({ ...node, _trashedAt: Date.now() });
    }
    state.nodes = state.nodes.filter(node => node.id !== id);
    state.connections = state.connections.filter(conn => conn.from !== id && conn.to !== id);
    state.groups.forEach(group => { group.nodeIds = group.nodeIds.filter(nodeId => nodeId !== id); });
    state.groups = state.groups.filter(group => group.nodeIds.length > 0 || (group.childGroupIds || []).length > 0);
    if (state.selectedId === id) state.selectedId = null;
    state.selectedIds = state.selectedIds.filter(nodeId => nodeId !== id);
    cleanupGroups();
    render();
    scheduleSaveWorkspace();
  }

  function deleteSelectedNodes() {
    const ids = getSelectedNodeIds();
    if (!ids.length) return;
    const remove = new Set(ids);
    // 移入回收站
    for (const id of ids) {
      const node = getNode(id);
      if (node) state.trash.push({ ...node, _trashedAt: Date.now() });
    }
    state.nodes = state.nodes.filter(node => !remove.has(node.id));
    state.connections = state.connections.filter(conn => !remove.has(conn.from) && !remove.has(conn.to));
    state.groups.forEach(group => { group.nodeIds = group.nodeIds.filter(nodeId => !remove.has(nodeId)); });
    state.groups = state.groups.filter(group => group.nodeIds.length > 0 || (group.childGroupIds || []).length > 0);
    state.selectedId = null;
    state.selectedIds = [];
    state.selectedGroupIds = [];
    cleanupGroups();
    render();
    scheduleSaveWorkspace();
  }

  function onKeyDown(e) {
    if (e.key === 'Escape') {
      hideContextMenu();
      return;
    }
    if (e.target?.closest?.('textarea,input,select,button')) return;
    if (e.shiftKey && String(e.key || '').toLowerCase() === 'z') {
      e.preventDefault();
      fitAllNodesView();
      return;
    }
    if ((e.key === 'Delete' || e.key === 'Backspace') && getSelectedNodeIds().length) {
      e.preventDefault();
      deleteSelectedNodes();
    }
  }

  // ==========================================================================
  // SECTION: 23 PANEL-EVENTS
  // ==========================================================================
  function bindGeneratePanelEvents() {
    els.world.querySelectorAll('[data-panel-for]').forEach(panel => {
      const node = getNode(panel.dataset.panelFor);
      if (!node) return;
      panel.querySelectorAll('textarea, input, select, button, .v2-highlight-wrap').forEach(el => {
        el.addEventListener('pointerdown', e => e.stopPropagation());
        el.addEventListener('mousedown', e => e.stopPropagation());
      });
      const panelText = panel.querySelector('[data-panel-text]');
      panelText?.addEventListener('mousedown', e => e.stopPropagation());
      panelText?.addEventListener('click', e => e.stopPropagation());
      panelText?.addEventListener('keydown', e => {
        if (handleMentionKeydown(e)) return;
        e.stopPropagation();
      });
      panelText?.addEventListener('input', e => {
        node.text = e.target.value;
        if (node.assistantSource && !generatePromptIncludesAssistantSource(node, node.assistantSource.prompt)) {
          delete node.assistantSource;
        }
        scheduleSaveWorkspace();
        syncPromptHighlight(panelText, node);
        updateMentionMenu(panelText, node, 'text');
        renderConnections();
      });
      panelText?.addEventListener('scroll', () => syncPromptHighlight(panelText, node));
      panelText?.addEventListener('blur', () => setTimeout(hideMentionMenu, 120));
      const regionPrompt = panel.querySelector('[data-region-prompt]');
      regionPrompt?.addEventListener('mousedown', e => e.stopPropagation());
      regionPrompt?.addEventListener('click', e => e.stopPropagation());
      regionPrompt?.addEventListener('keydown', e => {
        if (handleMentionKeydown(e)) return;
        e.stopPropagation();
      });
      regionPrompt?.addEventListener('input', e => {
        node.settings = { ...(node.settings || {}) };
        const region = getRegionEditState(node);
        node.settings.regionEdit = { ...region, prompt: e.target.value };
        scheduleSaveWorkspace();
        syncPromptHighlight(regionPrompt, node);
        updateMentionMenu(regionPrompt, node, 'regionPrompt');
      });
      regionPrompt?.addEventListener('scroll', () => syncPromptHighlight(regionPrompt, node));
      regionPrompt?.addEventListener('blur', () => setTimeout(hideMentionMenu, 120));
      const resultRegionPrompt = panel.querySelector('[data-result-region-prompt]');
      resultRegionPrompt?.addEventListener('mousedown', e => e.stopPropagation());
      resultRegionPrompt?.addEventListener('click', e => e.stopPropagation());
      resultRegionPrompt?.addEventListener('keydown', e => e.stopPropagation());
      resultRegionPrompt?.addEventListener('input', e => {
        node.settings = { ...(node.settings || {}) };
        const region = getResultRegionEditState(node);
        node.settings.resultRegionEdit = { ...region, prompt: e.target.value };
        scheduleSaveWorkspace();
        const highlight = panel.querySelector(`[data-result-region-highlight="${cssEscape(node.id)}"]`);
        if (highlight) highlight.textContent = e.target.value;
      });
      resultRegionPrompt?.addEventListener('scroll', () => {
        const highlight = panel.querySelector(`[data-result-region-highlight="${cssEscape(node.id)}"]`);
        if (highlight) highlight.scrollTop = resultRegionPrompt.scrollTop;
      });
      panel.querySelectorAll('[data-open-region]').forEach(btn => {
        btn.addEventListener('click', e => {
          e.stopPropagation();
          activatePendingRegionTarget(node.id);
        });
      });
      panel.querySelectorAll('[data-open-result-region]').forEach(btn => {
        btn.addEventListener('click', e => {
          e.stopPropagation();
          openResultRegionEditor(node.id, { inline: true });
        });
      });
      panel.querySelectorAll('[data-clear-region]').forEach(btn => {
        btn.addEventListener('click', e => {
          e.stopPropagation();
          clearRegionEdit(node.id);
        });
      });
      panel.querySelectorAll('[data-clear-result-region]').forEach(btn => {
        btn.addEventListener('click', e => {
          e.stopPropagation();
          clearResultRegionEdit(node.id);
        });
      });
      panel.querySelectorAll('[data-generate-version]').forEach(btn => {
        btn.addEventListener('click', e => {
          e.stopPropagation();
          switchGenerateVersion(btn.dataset.generateVersion, btn.dataset.versionId);
        });
      });
      panel.querySelectorAll('[data-step-version]').forEach(btn => {
        btn.addEventListener('click', e => {
          e.stopPropagation();
          stepGenerateVersion(btn.dataset.stepVersion, Number(btn.dataset.dir) || 1);
        });
      });
      panel.querySelectorAll('[data-detect-image-models]').forEach(btn => {
        btn.addEventListener('click', async e => {
          e.stopPropagation();
          const label = btn.textContent;
          btn.disabled = true;
          btn.textContent = '检测中...';
          try {
            await detectImageModelsForGenerate(node.id);
          } catch (err) {
            toast('模型检测失败：' + getErrMsg(err), 'error');
          } finally {
            btn.disabled = false;
            btn.textContent = label;
          }
        });
      });
      panel.querySelectorAll('[data-setting]').forEach(control => {
        control.addEventListener('change', e => {
          const setting = e.target.dataset.setting;
          node.settings[setting] = setting === 'n' ? Number(e.target.value) : e.target.value;
          if (setting === 'model') setSelectedImageModel(e.target.value);
          if (setting === 'referenceMode') node.settings.referenceModeTouched = true;
          if (setting === 'ratio') {
            const ratio = getRatioOption(node.settings.ratio).value;
            node.settings.ratio = ratio;
            node.settings.resolution = Object.keys(getRatioOption(ratio).sizes)[0];
            node.settings.size = sizeFromRatioResolution(node.settings.ratio, node.settings.resolution);
          }
          if (setting === 'resolution') {
            applyGenerateResolution(node, node.settings.resolution);
          }
          scheduleSaveWorkspace();
          if (setting === 'ratio' || setting === 'resolution') {
            render();
          } else if (setting === 'referenceMode') {
            refreshSelectedPanel();
          } else {
            render();
          }
        });
      });
      panel.querySelectorAll('[data-toggle-ratio-popover]').forEach(btn => {
        btn.addEventListener('click', e => {
          e.stopPropagation();
          state.ratioPopoverNodeId = state.ratioPopoverNodeId === node.id ? null : node.id;
          state.settingPopover = null;
          render();
        });
      });
      panel.querySelectorAll('[data-toggle-setting-popover]').forEach(btn => {
        btn.addEventListener('click', e => {
          e.stopPropagation();
          const setting = btn.dataset.settingName;
          const current = state.settingPopover;
          const same = current?.nodeId === node.id && current?.setting === setting;
          state.settingPopover = same ? null : { nodeId: node.id, setting };
          state.ratioPopoverNodeId = null;
          render();
        });
      });
      panel.querySelectorAll('[data-set-ratio]').forEach(btn => {
        btn.addEventListener('mousedown', e => e.stopPropagation());
        btn.addEventListener('click', e => {
          e.stopPropagation();
          const next = btn.dataset.ratio === 'auto' ? node.settings.ratio : btn.dataset.ratio;
          const option = getRatioOption(next);
          node.settings.ratio = option.value;
          if (!option.sizes[node.settings.resolution]) {
            node.settings.resolution = Object.keys(option.sizes)[0];
          }
          node.settings.size = sizeFromRatioResolution(node.settings.ratio, node.settings.resolution);
          scheduleSaveWorkspace();
          render();
        });
      });
      panel.querySelectorAll('[data-set-setting]').forEach(btn => {
        btn.addEventListener('mousedown', e => e.stopPropagation());
        btn.addEventListener('click', e => {
          e.stopPropagation();
          applyGenerateSetting(node, btn.dataset.settingName, btn.dataset.settingValue);
        });
      });
      panel.querySelectorAll('[data-add-manual-image-model]').forEach(btn => {
        btn.addEventListener('mousedown', e => e.stopPropagation());
        btn.addEventListener('click', e => {
          e.stopPropagation();
          addManualImageModelForGenerate(btn.dataset.addManualImageModel);
        });
      });
      panel.querySelectorAll('[data-set-resolution]').forEach(btn => {
        btn.addEventListener('mousedown', e => e.stopPropagation());
        btn.addEventListener('click', e => {
          e.stopPropagation();
          if (!getResolutionCandidates(btn.dataset.resolution).length) return;
          applyGenerateResolution(node, btn.dataset.resolution);
          scheduleSaveWorkspace();
          render();
        });
      });
      panel.querySelectorAll('[data-run-generate]').forEach(btn => {
        btn.addEventListener('click', () => {
          ensureAudioUnlocked();
          runGenerateNode(node.id);
        });
      });
      panel.querySelectorAll('[data-cancel-generate]').forEach(btn => {
        btn.addEventListener('click', () => cancelGenerateRun(node.id));
      });
      panel.querySelectorAll('[data-save-library]').forEach(btn => {
        btn.addEventListener('click', () => saveNodeToPromptLibrary(node.id));
      });
    });
    els.world.querySelectorAll('[data-focus-stage]').forEach(stage => {
      stage.addEventListener('mousedown', onInlineFocusMouseDown);
    });
    els.world.querySelectorAll('[data-focus-confirm]').forEach(btn => {
      btn.addEventListener('pointerdown', e => e.stopPropagation());
      btn.addEventListener('mousedown', e => e.stopPropagation());
      btn.addEventListener('click', e => {
        e.stopPropagation();
        saveRegionSelection();
      });
    });
    els.world.querySelectorAll('[data-focus-cancel]').forEach(btn => {
      btn.addEventListener('pointerdown', e => e.stopPropagation());
      btn.addEventListener('mousedown', e => e.stopPropagation());
      btn.addEventListener('click', e => {
        e.stopPropagation();
        closeRegionEditor();
        render();
      });
    });
  }

  function bindImagePanelEvents() {
    els.world.querySelectorAll('[data-image-panel-for]').forEach(panel => {
      const node = getNode(panel.dataset.imagePanelFor);
      if (!node) return;
      panel.querySelectorAll('textarea, input, select, button, .v2-highlight-wrap').forEach(el => {
        el.addEventListener('pointerdown', e => e.stopPropagation());
        el.addEventListener('mousedown', e => e.stopPropagation());
      });
      const regionPrompt = panel.querySelector('[data-region-prompt]');
      regionPrompt?.addEventListener('mousedown', e => e.stopPropagation());
      regionPrompt?.addEventListener('click', e => e.stopPropagation());
      regionPrompt?.addEventListener('keydown', e => {
        if (handleMentionKeydown(e)) return;
        e.stopPropagation();
      });
      regionPrompt?.addEventListener('input', e => {
        node.settings = { ...(node.settings || {}) };
        const region = getRegionEditState(node);
        node.settings.regionEdit = { ...region, prompt: e.target.value };
        scheduleSaveWorkspace();
        syncPromptHighlight(regionPrompt, node);
        updateMentionMenu(regionPrompt, node, 'regionPrompt');
      });
      regionPrompt?.addEventListener('scroll', () => syncPromptHighlight(regionPrompt, node));
      regionPrompt?.addEventListener('blur', () => setTimeout(hideMentionMenu, 120));
      panel.querySelectorAll('[data-open-image-region]').forEach(btn => {
        btn.addEventListener('click', e => {
          e.stopPropagation();
          openRegionEditor(btn.dataset.openImageRegion, { inline: true });
        });
      });
      panel.querySelectorAll('[data-clear-region]').forEach(btn => {
        btn.addEventListener('click', e => {
          e.stopPropagation();
          clearRegionEdit(node.id);
        });
      });
    });
  }

  function bindDetailPanelEvents() {
    els.world.querySelectorAll('.v2-detail-node-panel').forEach(panel => {
      const node = getNode(panel.dataset.detailPanelFor);
      if (!node) return;
      // 新格式：单文本框
      panel.querySelectorAll('[data-detail-text]').forEach(input => {
        input.addEventListener('mousedown', e => e.stopPropagation());
        input.addEventListener('click', e => e.stopPropagation());
        input.addEventListener('keydown', e => e.stopPropagation());
        input.addEventListener('input', e => {
          node.detail = { ...node.detail, text: e.target.value };
          scheduleSaveWorkspace();
          renderConnections();
        });
      });
      // 旧格式兼容：8 字段
      panel.querySelectorAll('[data-detail-field]').forEach(input => {
        input.addEventListener('mousedown', e => e.stopPropagation());
        input.addEventListener('click', e => e.stopPropagation());
        input.addEventListener('keydown', e => e.stopPropagation());
        input.addEventListener('input', e => {
          node.detail = normalizeDetail(node.detail);
          node.detail[e.target.dataset.detailField] = e.target.value;
          scheduleSaveWorkspace();
          renderConnections();
        });
      });
    });
  }

  function bindDetailPageNodeEvents() {
    els.world.querySelectorAll('[data-detail-node-count], [data-run-detail-storyboard], [data-run-detail-batch], [data-open-detail-preview]').forEach(btn => {
      btn.addEventListener('mousedown', e => e.stopPropagation());
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const countNodeId = btn.dataset.detailNodeCount;
        if (countNodeId) {
          setDetailPageNodeScreenCount(countNodeId, btn.dataset.count);
          return;
        }
        if (btn.dataset.runDetailStoryboard) {
          createDetailPageStoryboard(btn.dataset.runDetailStoryboard);
          return;
        }
        if (btn.dataset.runDetailBatch) {
          runDetailPageBatchForNode(btn.dataset.runDetailBatch);
          return;
        }
        if (btn.dataset.openDetailPreview) {
          state.activeDetailPageGroupId = btn.dataset.openDetailPreview || '';
          toggleDetailPagePanel(true);
        }
      });
    });
  }

  function bindTryOnNodeEvents() {
    els.world.querySelectorAll('[data-tryon-role], [data-run-tryon-all], [data-open-tryon-region], [data-tryon-pose-toggle], [data-tryon-pose-count]').forEach(btn => {
      btn.addEventListener('mousedown', e => e.stopPropagation());
      btn.addEventListener('click', e => {
        e.stopPropagation();
        if (btn.dataset.tryonRole) {
          setTryOnImageRole(btn.dataset.tryonRole, btn.dataset.imageId, btn.dataset.role);
          return;
        }
        if (btn.dataset.runTryonAll) {
          runTryOnAll(btn.dataset.runTryonAll);
          return;
        }
        if (btn.dataset.tryonPoseToggle) {
          setTryOnPoseEnabled(btn.dataset.tryonPoseToggle, btn.checked);
          return;
        }
        if (btn.dataset.tryonPoseCount) {
          setTryOnPoseCount(btn.dataset.tryonPoseCount, btn.dataset.count);
          return;
        }
        if (btn.dataset.openTryonRegion) {
          openTryOnModelRegionEditor(btn.dataset.openTryonRegion);
        }
      });
    });
  }

  function bindSketchPanelEvents() {
    els.world.querySelectorAll('.v2-sketch-node-panel').forEach(panel => {
      const node = getNode(panel.dataset.sketchPanelFor);
      if (!node) return;
      getSketchState(node);
      initSketchCanvas(node.id);

      panel.querySelectorAll('input,button,canvas').forEach(el => {
        el.addEventListener('mousedown', e => e.stopPropagation());
        el.addEventListener('click', e => e.stopPropagation());
        el.addEventListener('keydown', e => e.stopPropagation());
      });

      const upload = panel.querySelector(`[data-sketch-upload="${cssEscape(node.id)}"]`);
      panel.querySelector(`[data-sketch-import="${cssEscape(node.id)}"]`)?.addEventListener('click', () => upload?.click());
      upload?.addEventListener('change', async e => {
        const file = e.target.files?.[0];
        if (!file) return;
        await importSketchImage(node.id, file);
      });

      panel.querySelectorAll('[data-sketch-tool]').forEach(btn => {
        btn.addEventListener('click', () => {
          const sketch = getSketchState(node);
          sketch.mode = ['view', 'brush', 'eraser'].includes(btn.dataset.tool) ? btn.dataset.tool : 'view';
          scheduleSaveWorkspace();
          refreshSelectedPanel();
        });
      });
      panel.querySelectorAll('[data-sketch-color]').forEach(btn => {
        btn.addEventListener('click', () => {
          const sketch = getSketchState(node);
          sketch.activeColor = normalizeSketchColor(btn.dataset.color) || sketch.activeColor;
          scheduleSaveWorkspace();
          refreshSelectedPanel();
        });
      });
      panel.querySelectorAll('[data-sketch-size]').forEach(input => {
        input.addEventListener('input', e => {
          getSketchState(node).brushSize = Math.max(2, Math.min(80, Number(e.target.value) || 18));
          scheduleSaveWorkspace();
        });
      });
      panel.querySelectorAll('[data-sketch-seg-source]').forEach(select => {
        select.addEventListener('change', e => {
          getSketchState(node).segmentationSource = e.target.value;
          scheduleSaveWorkspace();
        });
      });
      panel.querySelectorAll('[data-run-sketch-seg]').forEach(btn => {
        btn.addEventListener('click', e => {
          e.stopPropagation();
          runSketchSegmentation(node.id);
        });
      });
      panel.querySelectorAll('[data-detect-sketch-models]').forEach(btn => {
        btn.addEventListener('click', async e => {
          e.stopPropagation();
          const label = btn.textContent;
          btn.disabled = true;
          btn.textContent = '检测中...';
          try {
            await detectImageModelsForSketch(node.id);
          } catch (err) {
            const sketch = getSketchState(node);
            node.error = getErrMsg(err);
            sketch.segmentationStatus = '模型检测失败：' + node.error;
            scheduleSaveWorkspace();
            render();
            toast(sketch.segmentationStatus, 'error');
          } finally {
            btn.disabled = false;
            btn.textContent = label;
          }
        });
      });
      panel.querySelectorAll('[data-sketch-set-source]').forEach(btn => {
        btn.addEventListener('click', () => setCurrentSketchAsSource(node.id));
      });
      panel.querySelectorAll('[data-sketch-restore-source]').forEach(btn => {
        btn.addEventListener('click', () => restoreSketchSourcePreview(node.id));
      });
      panel.querySelectorAll('[data-sketch-save]').forEach(btn => {
        btn.addEventListener('click', () => {
          saveSketchCanvas(node.id);
          render();
          toast('Sketch 已保存', 'success');
        });
      });
      panel.querySelectorAll('[data-sketch-undo]').forEach(btn => {
        btn.addEventListener('click', () => undoSketchCanvas(node.id));
      });
      panel.querySelectorAll('[data-sketch-clear]').forEach(btn => {
        btn.addEventListener('click', () => clearSketchCanvas(node.id));
      });

      panel.querySelectorAll('[data-sketch-map-color], [data-sketch-map-label], [data-sketch-map-target]').forEach(input => {
        input.addEventListener('input', e => {
          const sketch = getSketchState(node);
          const index = Number(e.target.dataset.index);
          if (!sketch.mappings[index]) return;
          if (e.target.matches('[data-sketch-map-color]')) {
            sketch.mappings[index].color = normalizeSketchColor(e.target.value) || sketch.mappings[index].color;
            sketch.activeColor = sketch.mappings[index].color;
          }
          if (e.target.matches('[data-sketch-map-label]')) sketch.mappings[index].label = e.target.value;
          if (e.target.matches('[data-sketch-map-target]')) sketch.mappings[index].target = e.target.value;
          scheduleSaveWorkspace();
        });
        input.addEventListener('change', () => refreshSelectedPanel());
      });
      panel.querySelectorAll('[data-sketch-map-delete]').forEach(btn => {
        btn.addEventListener('click', () => {
          const sketch = getSketchState(node);
          const index = Number(btn.dataset.index);
          if (sketch.mappings.length <= 1 || !sketch.mappings[index]) return;
          sketch.mappings.splice(index, 1);
          if (!sketch.mappings.some(item => normalizeSketchColor(item.color) === normalizeSketchColor(sketch.activeColor))) {
            sketch.activeColor = sketch.mappings[0]?.color || DEFAULT_SKETCH_MAPPINGS[0].color;
          }
          scheduleSaveWorkspace();
          refreshSelectedPanel();
        });
      });
      panel.querySelectorAll('[data-sketch-map-add]').forEach(btn => {
        btn.addEventListener('click', () => {
          const sketch = getSketchState(node);
          sketch.mappings.push({
            id: uid('sketch_map'),
            color: '#ffffff',
            label: '白色',
            target: ''
          });
          sketch.activeColor = '#ffffff';
          scheduleSaveWorkspace();
          refreshSelectedPanel();
        });
      });

      panel.querySelectorAll('[data-sketch-drop]').forEach(drop => {
        drop.addEventListener('dragover', e => {
          e.preventDefault();
          e.stopPropagation();
          if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
        });
        drop.addEventListener('drop', async e => {
          e.preventDefault();
          e.stopPropagation();
          const file = getImageFilesFromTransfer(e.dataTransfer)[0];
          if (file) await importSketchImage(node.id, file);
        });
      });
    });
  }

  // ==========================================================================
  // SECTION: 24 SKETCH-CANVAS
  // ==========================================================================
  function initSketchCanvas(nodeId) {
    const node = getNode(nodeId);
    const canvas = els.world.querySelector(`[data-sketch-canvas="${cssEscape(nodeId)}"]`);
    if (!node || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const editor = {
      canvas,
      ctx,
      nodeId,
      drawing: false,
      history: sketchEditors.get(nodeId)?.history || [],
      last: null
    };
    sketchEditors.set(nodeId, editor);
    drawSketchCanvasFromNode(node, canvas);

    canvas.addEventListener('pointerdown', e => {
      if (getSketchState(node).mode === 'view') return;
      e.preventDefault();
      e.stopPropagation();
      pushSketchHistory(nodeId);
      editor.drawing = true;
      editor.last = getCanvasPointer(canvas, e);
      canvas.setPointerCapture?.(e.pointerId);
      drawSketchStroke(nodeId, editor.last, editor.last);
    });
    canvas.addEventListener('pointermove', e => {
      if (getSketchState(node).mode === 'view') return;
      if (!editor.drawing) return;
      e.preventDefault();
      e.stopPropagation();
      const next = getCanvasPointer(canvas, e);
      drawSketchStroke(nodeId, editor.last, next);
      editor.last = next;
    });
    canvas.addEventListener('pointerup', e => {
      if (!editor.drawing) return;
      e.preventDefault();
      e.stopPropagation();
      editor.drawing = false;
      editor.last = null;
      saveSketchCanvas(nodeId);
    });
    canvas.addEventListener('pointercancel', () => {
      editor.drawing = false;
      editor.last = null;
      saveSketchCanvas(nodeId);
    });
  }

  function drawSketchCanvasFromNode(node, canvas) {
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const sketch = getSketchState(node);
    if (!sketch.image) return;
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
    };
    img.src = sketch.image;
  }

  function getCanvasPointer(canvas, e) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height)
    };
  }

  function drawSketchStroke(nodeId, from, to) {
    const node = getNode(nodeId);
    const editor = sketchEditors.get(nodeId);
    if (!node || !editor) return;
    const sketch = getSketchState(node);
    const ctx = editor.ctx;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(2, Math.min(80, Number(sketch.brushSize) || 18));
    ctx.strokeStyle = sketch.mode === 'eraser' ? '#ffffff' : (normalizeSketchColor(sketch.activeColor) || DEFAULT_SKETCH_MAPPINGS[0].color);
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    ctx.restore();
  }

  function pushSketchHistory(nodeId) {
    const editor = sketchEditors.get(nodeId);
    if (!editor) return;
    editor.history.push(editor.canvas.toDataURL('image/png'));
    if (editor.history.length > SKETCH_HISTORY_LIMIT) editor.history.shift();
  }

  function saveSketchCanvas(nodeId) {
    const node = getNode(nodeId);
    const editor = sketchEditors.get(nodeId);
    if (!node || !editor) return;
    const sketch = getSketchState(node);
    sketch.image = editor.canvas.toDataURL('image/png');
    sketch.aspectRatio = 1;
    node.image = sketch.image;
    node.aspectRatio = 1;
    scheduleSaveWorkspace();
  }

  function undoSketchCanvas(nodeId) {
    const node = getNode(nodeId);
    const editor = sketchEditors.get(nodeId);
    if (!node || !editor || !editor.history.length) return;
    const previous = editor.history.pop();
    const img = new Image();
    img.onload = () => {
      editor.ctx.fillStyle = '#fff';
      editor.ctx.fillRect(0, 0, editor.canvas.width, editor.canvas.height);
      editor.ctx.drawImage(img, 0, 0, editor.canvas.width, editor.canvas.height);
      saveSketchCanvas(nodeId);
      refreshSelectedPanel();
    };
    img.src = previous;
  }

  function clearSketchCanvas(nodeId) {
    const editor = sketchEditors.get(nodeId);
    if (!editor) return;
    pushSketchHistory(nodeId);
    editor.ctx.fillStyle = '#fff';
    editor.ctx.fillRect(0, 0, editor.canvas.width, editor.canvas.height);
    saveSketchCanvas(nodeId);
    refreshSelectedPanel();
  }

  async function importSketchImage(nodeId, file) {
    const node = getNode(nodeId);
    if (!node || node.type !== 'sketch') return;
    const info = await fileToReferenceImageInfo(file);
    const sketch = getSketchState(node);
    sketch.image = info.dataUrl;
    sketch.sourceImage = info.dataUrl;
    sketch.aspectRatio = info.aspectRatio || 1;
    sketch.sourceAspectRatio = info.aspectRatio || 1;
    sketch.segmentedAt = 0;
    sketch.segmentationStatus = '已导入底图，可 AI 分层';
    node.image = info.dataUrl;
    node.aspectRatio = sketch.aspectRatio;
    scheduleSaveWorkspace();
    render();
    toast('Sketch 图片已导入', 'success');
  }

  function setCurrentSketchAsSource(nodeId) {
    const node = getNode(nodeId);
    if (!node || node.type !== 'sketch') return;
    const sketch = getSketchState(node);
    if (!sketch.image) {
      toast('当前没有可设为底图的图片', 'error');
      return;
    }
    sketch.sourceImage = sketch.image;
    sketch.sourceAspectRatio = sketch.aspectRatio || node.aspectRatio || 1;
    sketch.segmentationStatus = '已用当前图设为底图';
    scheduleSaveWorkspace();
    refreshSelectedPanel();
    toast('已设为 Sketch 底图', 'success');
  }

  function restoreSketchSourcePreview(nodeId) {
    const node = getNode(nodeId);
    if (!node || node.type !== 'sketch') return;
    const sketch = getSketchState(node);
    if (!sketch.sourceImage) {
      toast('还没有 Sketch 底图', 'error');
      return;
    }
    sketch.image = sketch.sourceImage;
    sketch.aspectRatio = sketch.sourceAspectRatio || 1;
    sketch.segmentedAt = 0;
    sketch.segmentationStatus = '已恢复底图预览';
    node.image = sketch.image;
    node.aspectRatio = sketch.aspectRatio;
    scheduleSaveWorkspace();
    render();
    toast('已恢复底图预览', 'success');
  }

  function resolveSketchSegmentationSource(node) {
    const sketch = getSketchState(node);
    const mode = sketch.segmentationSource || 'auto';
    const upstream = getUpstreamVisualRefs(node);
    // 小马AI 域需要公网 URL，挑出上游的 remoteUrl 一并透传，
    // 由 requestSketchAutomaticSegmentationImage 走 _remote_url_<i> 通道。
    const pickUpstream = (ref) => ref?.image
      ? {
          image: ref.image,
          remoteUrl: String(ref.remoteUrl || '').trim(),
          label: `上游 @${ref.alias || ref.title || '图像'}`,
          aspectRatio: ref.aspectRatio || 1,
          kind: 'upstream'
        }
      : null;
    if (mode === 'source') {
      return sketch.sourceImage
        ? { image: sketch.sourceImage, remoteUrl: String(sketch.sourceRemoteUrl || '').trim(), label: '分层渲染底图', aspectRatio: sketch.sourceAspectRatio || 1, kind: 'source' }
        : null;
    }
    if (mode === 'upstream') {
      return pickUpstream(upstream[0]);
    }
    if (sketch.sourceImage) {
      return { image: sketch.sourceImage, remoteUrl: String(sketch.sourceRemoteUrl || '').trim(), label: '分层渲染底图', aspectRatio: sketch.sourceAspectRatio || 1, kind: 'source' };
    }
    return pickUpstream(upstream[0]);
  }

  async function runSketchSegmentation(nodeId) {
    const node = getNode(nodeId);
    if (!node || node.type !== 'sketch') return;
    let sketch = getSketchState(node);
    if (node.status === 'generating') return;
    const source = resolveSketchSegmentationSource(node);
    if (!source?.image) {
      setSketchSegmentationFailure(node, sketch, '请先导入分层渲染底图或连接上游图片');
      return;
    }
    const previous = {
      image: sketch.image,
      mappings: sketch.mappings.map(item => ({ ...item })),
      segmentationElements: sketch.segmentationElements.map(item => ({ ...item })),
      subjectPreserve: sketch.subjectPreserve,
      preservedSubjectHint: sketch.preservedSubjectHint,
      segmentedAt: sketch.segmentedAt,
      status: sketch.segmentationStatus
    };
    const runId = uid('sketch_run');
    sketch.segmentationRunId = runId;
    node.status = 'generating';
    node.error = '';
    setSketchSegmentationStage(node, '正在自动识别主体和画面元素，视觉模型可能需要几十秒...');
    sketch = getSketchState(node);
    sketch.segmentationRunId = runId;
    console.info('[Sketch] start automatic semantic segmentation', { nodeId, runId, sourceLabel: source.label, sourceKind: source.kind, hasImage: Boolean(source.image) });
    const watchdog = setTimeout(() => {
      if (getNode(nodeId) !== node || node.status !== 'generating') return;
      setSketchSegmentationFailure(node, getSketchState(node), 'AI 分层超时（180秒）：自动语义分层没有完成');
    }, 180_000);

    try {
      const cfg = getTextModelConfig(node);
      if (!cfg.apiKey || !cfg.modelId) throw new Error('请先在配置页设置反推/视觉文本模型');
      const analysis = await analyzeSketchElements(cfg, source);
      const mappings = normalizeSegmentationMappings(analysis.elements);
      setSketchSegmentationStage(node, '正在生成语义分层预览...');
      console.info('[Sketch] automatic semantic analysis ready', { runId, mappingCount: mappings.length, elapsed: analysis.elapsed });
      const result = await requestSketchAutomaticSegmentationImage({
        sourceImage: source.image,
        sourceRemoteUrl: source.remoteUrl || '',
        analysis,
        mappings,
        aspectRatio: source.aspectRatio || sketch.sourceAspectRatio || sketch.aspectRatio || 1
      });
      console.info('[Sketch] segmentation image sent', { runId, hasRemoteUrl: Boolean(source.remoteUrl), sourceKind: source.kind });
      console.info('[Sketch] automatic semantic segmentation ready', { runId, bytes: result.url.length, responseFormat: result.responseFormat });
      // 保存 lk888 task_id，供"同步小马AI"按钮使用
      if (result.taskId) {
        node.lastTaskId = result.taskId;
        node.lastTaskSubmittedAt = Date.now();
      }
      if (getNode(nodeId) !== node || node.status !== 'generating') { clearTimeout(watchdog); return; }
      const currentSketch = getSketchState(node);
      currentSketch.image = result.url;
      currentSketch.aspectRatio = result.aspectRatio || source.aspectRatio || 1;
      currentSketch.mappings = mappings;
      currentSketch.activeColor = mappings[0]?.color || DEFAULT_SKETCH_MAPPINGS[0].color;
      currentSketch.segmentationElements = analysis.elements || [];
      currentSketch.subjectPreserve = true;
      currentSketch.preservedSubjectHint = analysis.subject?.name || analysis.subject?.target || '自动识别主体';
      currentSketch.segmentedAt = Date.now();
      currentSketch.segmentationStatus = `自动分层完成 · ${mappings.length} 个元素 · ${result.elapsed} 秒`;
      if (!currentSketch.sourceImage && source.kind === 'upstream') {
        currentSketch.sourceImage = source.image;
        currentSketch.sourceAspectRatio = source.aspectRatio || 1;
      }
      node.image = currentSketch.image;
      node.aspectRatio = currentSketch.aspectRatio;
      node.status = 'done';
      node.debug = '分层渲染 AI 分层完成';
      markUpstreamDirty(node.id);  // UI: sketch 出图后，下游节点应标记 dirty
      clearUpstreamDirty(node.id);  // UI: 自身不再 dirty
      currentSketch.segmentationRunId = '';
      clearTimeout(watchdog);
      scheduleSaveWorkspace();
      render();
      toast('分层渲染完成', 'success');
    } catch (err) {
      clearTimeout(watchdog);
      console.error('[Sketch] segmentation failed', { runId, error: getErrMsg(err) });
      const currentSketch = getSketchState(node);
      currentSketch.image = previous.image;
      currentSketch.mappings = previous.mappings;
      currentSketch.segmentationElements = previous.segmentationElements;
      currentSketch.subjectPreserve = previous.subjectPreserve;
      currentSketch.preservedSubjectHint = previous.preservedSubjectHint;
      currentSketch.segmentedAt = previous.segmentedAt;
      currentSketch.segmentationStatus = 'AI 分层失败：' + getErrMsg(err);
      currentSketch.segmentationRunId = '';
      node.image = previous.image;
      node.status = 'error';
      node.error = getErrMsg(err);
      scheduleSaveWorkspace();
      render();
      toast('分层渲染失败：' + node.error, 'error');
    }
  }

  function setSketchSegmentationStage(node, message) {
    const sketch = getSketchState(node);
    sketch.segmentationStatus = message;
    node.error = '';
    scheduleSaveWorkspace();
    render();
  }

  function setSketchSegmentationFailure(node, sketch, message) {
    node.status = 'error';
    node.error = message;
    sketch.segmentationStatus = 'AI 分层失败：' + message;
    sketch.segmentationRunId = '';
    scheduleSaveWorkspace();
    render();
    toast(sketch.segmentationStatus, 'error');
  }

  async function analyzeSketchElements(cfg, source) {
    const prompt = buildSketchSegmentationAnalysisPrompt();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), SKETCH_VISION_TIMEOUT_MS);
    try {
      const analysisImage = await createSketchVisionDataUrl(source.image);
      const result = await postVisionText(cfg, prompt, [{ id: 'sketch_source', alias: '来源图', image: analysisImage }], controller.signal);
      clearTimeout(timer);
      const parsed = parseSketchSegmentationResult(result.text);
      return {
        ...parsed,
        elapsed: result.elapsed,
        sourceSummary: parsed.sourceSummary || source.label
      };
    } catch (err) {
      clearTimeout(timer);
      if (err.name === 'AbortError') throw new Error(`视觉文本模型分析超时（${Math.round(SKETCH_VISION_TIMEOUT_MS / 1000)}秒），请检查反推模型或中转站`);
      throw err;
    }
  }

  async function createSketchVisionDataUrl(imageSrc) {
    const dataUrl = await imageSourceToDataUrl(imageSrc);
    const img = await loadImageFromDataUrl(dataUrl);
    const sourceW = img.naturalWidth || img.width || 1;
    const sourceH = img.naturalHeight || img.height || 1;
    const scale = Math.min(1, SKETCH_VISION_MAX_SIDE / Math.max(sourceW, sourceH));
    if (scale >= 0.999 && dataUrl.length <= MAX_REFERENCE_IMAGE_BYTES) return dataUrl;
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(sourceW * scale));
    canvas.height = Math.max(1, Math.round(sourceH * scale));
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return await compressDataUrl(canvas.toDataURL('image/jpeg', SKETCH_VISION_QUALITY), MAX_REFERENCE_IMAGE_BYTES);
  }

  function buildSketchSegmentationAnalysisPrompt() {
    const palette = SKETCH_SEGMENTATION_COLORS
      .map((item, index) => `${index + 1}. ${item.label} ${item.color}`)
      .join('\n');
    return [
      '你是商业视觉语义分层助手。请自动识别输入图片中的主体和主要可见元素，用于生成分层渲染遮罩图。',
      '必须先找主体：人物、产品、服装、车辆、建筑主物体等最终需要保留身份和外观的核心对象。',
      '再识别可分离元素：前景遮挡物、中景道具、背景环境、天空、山、水、地面、草地、岩石、建筑、树、文字等。',
      '输出必须是严格 JSON，不要 markdown，不要解释。',
      '最多输出 8 个元素。subject 必填；elements 只放需要独立成层或会影响构图/场景替换的区域。',
      `固定色板如下，按重要性依次分配，不要使用色板外颜色：\n${palette}`,
      '{"sourceSummary":"","subject":{"name":"","layer":"主体","target":"","preserve":true,"reason":""},"elements":[{"name":"","layer":"前景|中景|背景|环境|道具","target":"","color":"#ff1f1f","preserve":false,"reason":""}]}',
      'name 写真实可见元素名，例如“人物”“雪山”“湖水”“树枝”“草地”；target 默认与 name 一致。主体不要放进 elements，主体写在 subject。sourceSummary 用一句话概括画面。'
    ].join('\n\n');
  }

  function parseSketchSegmentationResult(text) {
    const parsed = parseJsonLooseLocal(text);
    const rawSubject = parsed?.subject && typeof parsed.subject === 'object' ? parsed.subject : {};
    const subject = {
      name: String(rawSubject.name || rawSubject.element || rawSubject.target || '').trim() || '主体',
      layer: '主体',
      target: String(rawSubject.target || rawSubject.name || rawSubject.element || '主体').trim(),
      preserve: true,
      reason: String(rawSubject.reason || '').trim()
    };
    const rawElements = Array.isArray(parsed?.elements) ? parsed.elements : [];
    const elements = rawElements
      .map((item, index) => ({
        name: String(item?.name || item?.element || '').trim(),
        layer: String(item?.layer || '').trim(),
        target: String(item?.target || item?.name || item?.element || '').trim(),
        color: normalizeSketchColor(item?.color) || SKETCH_SEGMENTATION_COLORS[index % SKETCH_SEGMENTATION_COLORS.length].color,
        preserve: item?.preserve === true,
        reason: String(item?.reason || '').trim()
      }))
      .filter(item => item.name || item.target)
      .slice(0, SKETCH_SEGMENTATION_COLORS.length);
    if (!elements.length) {
      throw new Error('视觉模型没有返回可用元素分层');
    }
    return {
      sourceSummary: String(parsed?.sourceSummary || parsed?.summary || '').trim(),
      subject,
      elements
    };
  }

  function parseJsonLooseLocal(text) {
    const raw = String(text || '').trim();
    const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const candidate = fenced ? fenced[1].trim() : raw;
    try {
      return JSON.parse(candidate);
    } catch {}
    const objectMatch = candidate.match(/\{[\s\S]*\}/);
    if (!objectMatch) return null;
    try {
      return JSON.parse(objectMatch[0]);
    } catch {
      return null;
    }
  }

  function normalizeSegmentationMappings(elements = []) {
    return elements.slice(0, SKETCH_SEGMENTATION_COLORS.length).map(makeSketchMapping);
  }

  async function requestSketchAutomaticSegmentationImage({ sourceImage, sourceRemoteUrl = '', analysis, mappings = [], aspectRatio = 1 }) {
    const started = Date.now();
    try {
      const model = getSelectedImageModel();
      if (!model) throw new Error('请先检测并选择当前中转站支持的生图模型');
      const prompt = buildSketchSegmentationImagePrompt(analysis, mappings);
      const size = sizeFromAspectRatio(aspectRatio);
      // 走画布原生的"@主图 / @参考图"通道（requestImageEdit → buildImageEditFormDataV2
      // → formDataToXiaomaMediaPayload），不再自己拼 FormData。
      // 原生通道会按 roleHint/imageRoles 自动决定 _remote_url_<i>、自动 catbox 兜底、
      // 并按图片顺序自动写"第 1 张是主体；第 2 张是参考图"的指代。

      // 1) 主体 = 原图（@主图）。
      //    remoteUrl 探测顺序由 utils.js 统一（① ref.remoteUrl ② ref.image 本身是 http(s) URL），
      //    dataURL 走 buildImageEditFormDataV2 内部 catbox 兜底。
      const subjectRemoteUrl = pickRefRemoteUrl({ image: sourceImage, remoteUrl: sourceRemoteUrl });
      const subjectRef = {
        id: 'sketch_source',
        alias: '原图',
        title: '分层渲染原图',
        image: sourceImage,
        remoteUrl: subjectRemoteUrl,
        roleHint: 'subject'
      };

      // 2) 参考 = 色块风格示例（@参考图），仅小马AI 域需要。
      const refs = [subjectRef];
      const _sketchBase = (typeof getApiBase === 'function') ? getApiBase() : '';
      const _sketchIsXiaoma = /api\.(lk888|lk666)\.ai/i.test(_sketchBase || '');
      if (_sketchIsXiaoma && typeof ensureColorBlockExamplePublicUrl === 'function') {
        try {
          const exampleUrl = await ensureColorBlockExamplePublicUrl();
          if (/^https?:\/\//i.test(exampleUrl || '')) {
            refs.push({
              id: 'sketch_example',
              alias: '色块示例',
              title: '色块风格示例',
              image: exampleUrl,
              remoteUrl: exampleUrl
            });
            console.info('[小马AI画布] sketch color block example attached', { exampleUrl });
          }
        } catch (e) {
          console.warn('[小马AI画布] color block example upload failed, fallback to single image', e?.message || e);
        }
      }

      // 3) 构造一个虚拟 generate 节点，让 buildImageEditFormDataV2 能拿到 settings。
      //    referenceMode='direct'：避免示例图被压成 style-proxy（保留清晰色块）。
      const fakeNode = {
        id: 'sketch_auto_seg_' + Date.now(),
        type: 'generate',
        settings: {
          model,
          size,
          n: 1,
          referenceMode: 'direct'
        }
      };

      console.info('[小马AI画布] sketch image-to-image request', {
        model,
        size,
        refs: refs.map(r => ({ id: r.id, alias: r.alias, hasRemoteUrl: Boolean(r.remoteUrl), imageKind: r.image?.slice(0, 24) }))
      });

      // 4) 走和生图节点完全相同的 requestImageEdit 通道。
      const result = await requestImageEdit(fakeNode, prompt, refs, {
        n: 1,
        subjectRef
      });
      const url = result.urls?.[0] || result.url;
      if (!url) throw new Error('生图节点没有返回图片');
      return {
        url,
        elapsed: result.elapsed,
        aspectRatio: normalizeAspectRatio(aspectRatio) || 1,
        responseFormat: 'image-edit',
        taskId: result.taskId || null  // 透传 lk888 task_id，供 sketch 节点同步按钮使用
      };
    } catch (err) {
      console.warn('[Sketch] image-edit segmentation fallback to local preview:', getErrMsg(err));
      const fallback = requestSketchSegmentationImage({
        mappings,
        analysis,
        aspectRatio
      });
      fallback.elapsed = ((Date.now() - started) / 1000).toFixed(1);
      fallback.responseFormat = 'local-fallback';
      return fallback;
    }
  }

  function buildSketchSegmentationImagePrompt(analysis, mappings) {
    const mappingLines = mappings
      .map(item => `${item.color} = ${item.element || item.target || item.label}`)
      .join('\n');
    const subject = analysis.subject?.target || analysis.subject?.name || '主体';
    const elementLines = (analysis.elements || [])
      .map(item => `${item.layer || '画面'}：${item.name || item.target}`)
      .join('；');
    return [
      '把输入图片转成一张语义分层遮罩图，用于 AI 生成的结构引导。',
      '只输出扁平纯色块区域，不要照片细节，不要真实纹理，不要光影，不要渐变，不要文字标注，不要黑色描边，不要手绘乱线。',
      '保持原图主体、元素位置、前后层次和大致轮廓比例。',
      `主体保留：${subject} 使用原图轮廓保留为白色或浅灰占位，不要被彩色元素层覆盖。`,
      '背景使用白色或很浅的中性底色；每个主要非主体元素用指定纯色填充。',
      `画面元素：${elementLines}`,
      `颜色映射：\n${mappingLines}`,
      '输出应像干净的信息图/分区遮罩：边界尽量清晰，色块覆盖对应非主体元素区域，保留前景与背景关系。'
    ].join('\n\n');
  }

  function requestSketchSegmentationImage({ mappings = [], analysis = null, aspectRatio = 1 }) {
    const started = Date.now();
    const url = buildLocalSegmentationImage(mappings, aspectRatio, analysis);
    return {
      url,
      elapsed: ((Date.now() - started) / 1000).toFixed(1),
      responseFormat: 'local'
    };
  }

  function buildLocalSegmentationImage(mappings = [], aspectRatio = 1, analysis = null) {
    const ratio = normalizeAspectRatio(aspectRatio) || 1;
    const maxSide = 1024;
    const width = ratio >= 1 ? maxSide : Math.max(320, Math.round(maxSide * ratio));
    const height = ratio >= 1 ? Math.max(320, Math.round(maxSide / ratio)) : maxSide;
    const palette = normalizeSegmentationPalette(mappings);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#f7f7f3';
    ctx.fillRect(0, 0, width, height);
    drawLocalSegmentBlocks(ctx, width, height, palette, analysis);
    return canvas.toDataURL('image/png');
  }

  function normalizeSegmentationPalette(mappings = []) {
    const colors = (mappings || [])
      .map(item => normalizeSketchColor(item?.color))
      .filter(Boolean);
    const fallback = DEFAULT_SKETCH_MAPPINGS.map(item => normalizeSketchColor(item.color)).filter(Boolean);
    return uniqueIds(colors.length ? colors : fallback).slice(0, SKETCH_SEGMENTATION_COLORS.length);
  }

  function drawLocalSegmentBlocks(ctx, width, height, palette, analysis = null) {
    const colors = palette.length ? palette : ['#ff1f1f'];
    const bands = [
      { x: 0, y: 0, w: width, h: Math.round(height * 0.28), c: colors[1] || colors[0] },
      { x: 0, y: Math.round(height * 0.28), w: width, h: Math.round(height * 0.24), c: colors[3] || colors[0] },
      { x: 0, y: Math.round(height * 0.52), w: width, h: Math.round(height * 0.48), c: colors[2] || colors[0] }
    ];
    bands.forEach(item => {
      ctx.fillStyle = item.c;
      ctx.fillRect(item.x, item.y, item.w, item.h);
    });
    ctx.fillStyle = colors[0];
    ctx.beginPath();
    ctx.ellipse(width * 0.52, height * 0.48, width * 0.16, height * 0.27, 0, 0, Math.PI * 2);
    ctx.fill();
    if (analysis?.subject) {
      ctx.fillStyle = '#f7f7f3';
      ctx.beginPath();
      ctx.ellipse(width * 0.5, height * 0.56, width * 0.13, height * 0.28, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    if (colors[4]) {
      ctx.fillStyle = colors[4];
      ctx.beginPath();
      ctx.moveTo(width * 0.08, height * 0.2);
      ctx.bezierCurveTo(width * 0.24, height * 0.12, width * 0.43, height * 0.22, width * 0.68, height * 0.1);
      ctx.lineTo(width * 0.7, height * 0.15);
      ctx.bezierCurveTo(width * 0.45, height * 0.28, width * 0.24, height * 0.19, width * 0.08, height * 0.27);
      ctx.closePath();
      ctx.fill();
    }
  }

  function withTimeout(promise, ms, message) {
    let timer = null;
    const timeout = new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(message || '请求超时')), ms);
    });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
  }

  function sizeFromAspectRatio(ratio) {
    const value = normalizeAspectRatio(ratio) || 1;
    const option = getClosestRatioOptionValue(value);
    const sizes = getRatioOption(option).sizes;
    return sizes['1K'] || Object.values(sizes)[0] || '1024x1024';
  }

  function bindTextPanelEvents() {
    els.world.querySelectorAll('.v2-text-node-panel').forEach(panel => {
      const node = getNode(panel.dataset.textPanelFor);
      if (!node) return;
      panel.querySelectorAll('[data-text-template]').forEach(select => {
        select.addEventListener('mousedown', e => e.stopPropagation());
        select.addEventListener('click', e => e.stopPropagation());
        select.addEventListener('change', e => {
          node.settings = { ...(node.settings || {}), template: e.target.value };
          scheduleSaveWorkspace();
          render();
        });
      });

      const resultEditor = panel.querySelector('[data-text-result]');
      resultEditor?.addEventListener('mousedown', e => e.stopPropagation());
      resultEditor?.addEventListener('click', e => e.stopPropagation());
      resultEditor?.addEventListener('keydown', e => e.stopPropagation());
      resultEditor?.addEventListener('input', e => {
        node.result = cleanPromptBody(e.target.value);
        node.text = node.result;
        node.input = '';
        node.promptSkeleton = null;
        scheduleSaveWorkspace();
        renderConnections();
      });

      panel.querySelectorAll('[data-text-model]').forEach(select => {
        select.addEventListener('mousedown', e => e.stopPropagation());
        select.addEventListener('click', e => e.stopPropagation());
        select.addEventListener('change', e => {
          node.settings.model = e.target.value;
          if (e.target.value) window.setSelectedTextModelCache?.(e.target.value);
          scheduleSaveWorkspace();
          refreshSelectedPanel();
        });
      });

      panel.querySelectorAll('[data-run-text]').forEach(btn => {
        btn.addEventListener('click', e => {
          e.stopPropagation();
          runTextNode(node.id);
        });
      });
    });
  }

  function bindCinemaNodeEvents() {
    els.world.querySelectorAll('[data-run-cinema]').forEach(btn => {
      btn.addEventListener('mousedown', e => e.stopPropagation());
      btn.addEventListener('click', e => {
        e.stopPropagation();
        runCinemaNode(btn.dataset.runCinema);
      });
    });
  }

  function bindCinemaPanelEvents() {
    els.world.querySelectorAll('.v2-cinema-node-panel').forEach(panel => {
      const node = getNode(panel.dataset.cinemaPanelFor);
      if (!node) return;
      panel.querySelectorAll('textarea, input, select, button').forEach(el => {
        el.addEventListener('pointerdown', e => e.stopPropagation());
        el.addEventListener('mousedown', e => e.stopPropagation());
        el.addEventListener('click', e => e.stopPropagation());
      });
      panel.querySelectorAll('[data-cinema-mode]').forEach(select => {
        select.addEventListener('change', e => {
          node.settings = { ...(node.settings || {}), cinema: { ...getCinemaSettings(node), mode: e.target.value } };
          scheduleSaveWorkspace();
          refreshSelectedPanel();
        });
      });
      panel.querySelectorAll('[data-cinema-role]').forEach(select => {
        select.addEventListener('change', e => {
          setCinemaImageRole(select.dataset.cinemaRole, select.dataset.imageId, e.target.value);
        });
      });
      const draft = panel.querySelector('[data-cinema-draft]');
      draft?.addEventListener('keydown', e => e.stopPropagation());
      draft?.addEventListener('input', e => {
        node.draft = e.target.value;
        scheduleSaveWorkspace();
        renderConnections();
      });
      const result = panel.querySelector('[data-cinema-result]');
      result?.addEventListener('keydown', e => e.stopPropagation());
      result?.addEventListener('input', e => {
        node.result = cleanPromptBody(e.target.value);
        node.text = node.result;
        scheduleSaveWorkspace();
        renderConnections();
      });
      panel.querySelectorAll('[data-cinema-model]').forEach(select => {
        select.addEventListener('change', e => {
          node.settings.model = e.target.value;
          if (e.target.value) window.setSelectedTextModelCache?.(e.target.value);
          scheduleSaveWorkspace();
          refreshSelectedPanel();
        });
      });
      panel.querySelectorAll('[data-clear-cinema]').forEach(btn => {
        btn.addEventListener('click', e => {
          e.stopPropagation();
          clearCinemaNode(btn.dataset.clearCinema);
        });
      });
      panel.querySelectorAll('[data-locate-cinema-generate]').forEach(btn => {
        btn.addEventListener('click', e => {
          e.stopPropagation();
          const bound = getCinemaBoundGenerate(getNode(btn.dataset.locateCinemaGenerate));
          if (bound) focusNodeById(bound.id, { toast: true });
        });
      });
      panel.querySelectorAll('[data-retry-cinema-generate]').forEach(btn => {
        btn.addEventListener('click', e => {
          e.stopPropagation();
          retryCinemaBoundGenerate(btn.dataset.retryCinemaGenerate);
        });
      });
      panel.querySelectorAll('[data-run-cinema-generate]').forEach(btn => {
        btn.addEventListener('click', e => {
          e.stopPropagation();
          runCinemaNode(btn.dataset.runCinemaGenerate, { runGenerate: true });
        });
      });
    });
  }

  // ==========================================================================
  // SECTION: 25 GENERATE-OPTIONS
  // ==========================================================================
  function modelOptions(current) {
    const models = loadAvailableImageModels();
    const selected = String(current || '').trim();
    if (!models.length) {
      if (selected) return `<option value="${escHtml(selected)}">${escHtml(selected)} · 未检测</option>`;
      return '<option value="">请先检测模型</option>';
    }
    const active = models.includes(selected) ? selected : models[0];
    return models.map(model => `<option value="${escHtml(model)}" ${model === active ? 'selected' : ''}>${escHtml(model)}</option>`).join('');
  }

  function textModelOptions(current) {
    const saved = String(current || (window.getSelectedTextModelCache?.() || storageGet(REVERSE_MODEL_STORAGE) || '')).trim();
    const models = window.loadAvailableReverseModelsCache?.() || [];
    if (!models.length) {
      if (saved) return `<option value="${escHtml(saved)}" selected>${escHtml(saved)} · 未检测</option>`;
      return '<option value="">请先检测文本模型</option>';
    }
    const active = models.includes(saved) ? saved : models[0];
    return models.map(model => `<option value="${escHtml(model)}" ${model === active ? 'selected' : ''}>${escHtml(model)}</option>`).join('');
  }

  function ratioOptions(current) {
    const selected = current || inferRatioFromSize('1024x1024');
    return SIZE_RATIO_OPTIONS
      .map(item => `<option value="${escHtml(item.value)}" ${item.value === selected ? 'selected' : ''}>${escHtml(item.label)}</option>`)
      .join('');
  }

  function resolutionOptions(ratio, current) {
    const item = getRatioOption(ratio);
    const selected = current && item.sizes[current] ? current : Object.keys(item.sizes)[0];
    return RESOLUTION_PICKER_OPTIONS
      .filter(value => getResolutionCandidates(value).length)
      .map(value => {
        const preferredRatio = getPreferredRatioForResolution(ratio, value);
        const size = sizeFromRatioResolution(preferredRatio, value);
        const switchLabel = preferredRatio === item.value ? '' : ` · 切到 ${preferredRatio}`;
        return `<option value="${escHtml(value)}" ${value === selected ? 'selected' : ''}>${escHtml(value + switchLabel + ' · ' + size)}</option>`;
      })
      .join('');
  }

  function getRatioOption(ratio) {
    return SIZE_RATIO_OPTIONS.find(item => item.value === ratio) || SIZE_RATIO_OPTIONS[0];
  }

  function inferRatioFromSize(size) {
    const label = getSizeRatioLabel(size || '1024x1024');
    return SIZE_RATIO_OPTIONS.some(item => item.value === label) ? label : '1:1';
  }

  function inferResolutionFromSize(ratio, size) {
    const item = getRatioOption(ratio);
    const found = Object.entries(item.sizes).find(([, value]) => value === size);
    return found?.[0] || Object.keys(item.sizes)[0];
  }

  function sizeFromRatioResolution(ratio, resolution) {
    const item = getRatioOption(ratio);
    return item.sizes[resolution] || item.sizes[Object.keys(item.sizes)[0]] || '1024x1024';
  }

  function getResolutionCandidates(resolution) {
    return SIZE_RATIO_OPTIONS.filter(item => Boolean(item.sizes?.[resolution]));
  }

  function getPreferredRatioForResolution(currentRatio, resolution) {
    const current = getRatioOption(currentRatio);
    if (current.sizes?.[resolution]) return current.value;
    const candidates = getResolutionCandidates(resolution);
    if (!candidates.length) return current.value;
    const orientation = getRatioOrientation(current.value);
    const sameOrientation = candidates.find(item => getRatioOrientation(item.value) === orientation);
    if (sameOrientation) return sameOrientation.value;
    const squareCandidate = candidates.find(item => getRatioOrientation(item.value) === 'square');
    return (squareCandidate || candidates[0]).value;
  }

  function applyGenerateResolution(node, resolution) {
    node.settings = { ...(node.settings || {}) };
    const ratio = getPreferredRatioForResolution(node.settings.ratio, resolution);
    node.settings.ratio = ratio;
    node.settings.resolution = getRatioOption(ratio).sizes[resolution]
      ? resolution
      : Object.keys(getRatioOption(ratio).sizes)[0];
    node.settings.size = sizeFromRatioResolution(node.settings.ratio, node.settings.resolution);
  }

  function applyGenerateSizeValue(node, size) {
    node.settings = { ...(node.settings || {}) };
    const ratio = inferRatioFromSize(size);
    node.settings.ratio = getRatioOption(ratio).value;
    node.settings.resolution = inferResolutionFromSize(node.settings.ratio, size);
    node.settings.size = sizeFromRatioResolution(node.settings.ratio, node.settings.resolution);
  }

  function normalizeGenerateSizeSettings(node) {
    node.settings = { ...(node.settings || {}) };
    const ratio = node.settings.ratio || inferRatioFromSize(node.settings.size);
    const resolution = node.settings.resolution || inferResolutionFromSize(ratio, node.settings.size);
    node.settings.ratio = getRatioOption(ratio).value;
    node.settings.resolution = getRatioOption(ratio).sizes[resolution] ? resolution : Object.keys(getRatioOption(ratio).sizes)[0];
    node.settings.size = sizeFromRatioResolution(node.settings.ratio, node.settings.resolution);
  }

  function normalizeGenerateReferenceMode(node) {
    node.settings = { ...(node.settings || {}) };
    if (!GENERATE_REFERENCE_MODES.some(item => item.value === node.settings.referenceMode)) {
      // 字段不存在 / 无效 → 用默认
      node.settings.referenceMode = DEFAULT_REFERENCE_MODE;
    } else if (!node.settings.referenceModeTouched) {
      // 老节点 referenceMode 存在但用户没主动设过（继承自旧默认 structure）
      // 跟随新默认升级到 strong
      node.settings.referenceMode = DEFAULT_REFERENCE_MODE;
    }
    // else: 用户主动设过 → 保持用户的选择
  }

  function normalizeGenerateModelSettings(node) {
    node.settings = { ...(node.settings || {}) };
    const models = loadAvailableImageModels();
    const current = String(node.settings.model || '').trim();
    if (models.length && !models.includes(current)) {
      node.settings.model = models[0];
      setSelectedImageModel(models[0]);
    }
  }

  function getCurrentImageModelForGenerate(current = '') {
    const models = typeof loadAvailableImageModels === 'function' ? loadAvailableImageModels() : [];
    const selected = typeof getSelectedImageModel === 'function' ? String(getSelectedImageModel() || '').trim() : '';
    const saved = String(current || '').trim();
    if (selected && models.includes(selected)) return selected;
    if (saved && models.includes(saved)) return saved;
    return models[0] || saved || selected || '';
  }

  function applyCurrentImageModelToGenerateNode(node) {
    if (!node || node.type !== 'generate') return '';
    node.settings = { ...(node.settings || {}) };
    const model = getCurrentImageModelForGenerate(node.settings.model);
    if (model && node.settings.model !== model) {
      node.settings.model = model;
      if (typeof setSelectedImageModel === 'function') setSelectedImageModel(model);
    }
    return model;
  }

  async function detectImageModelsForGenerate(nodeId) {
    const node = getNode(nodeId);
    if (!node || node.type !== 'generate') return;
    const models = await detectImageModels();
    node.settings = { ...(node.settings || {}) };
    if (!models.includes(node.settings.model)) node.settings.model = models[0];
    setSelectedImageModel(node.settings.model);
    scheduleSaveWorkspace();
    refreshSelectedPanel();
    toast(`检测到 ${models.length} 个模型`, 'success');
  }

  async function detectImageModelsForSketch(nodeId) {
    const node = getNode(nodeId);
    if (!node || node.type !== 'sketch') return;
    const sketch = getSketchState(node);
    sketch.segmentationStatus = '正在检测当前中转站生图模型...';
    node.error = '';
    render();
    const models = await detectImageModels();
    const selected = getSelectedImageModel() || models[0];
    sketch.segmentationStatus = `检测到 ${models.length} 个模型 · 当前 ${selected}`;
    node.status = 'idle';
    scheduleSaveWorkspace();
    refreshSelectedPanel();
    toast(`检测到 ${models.length} 个模型`, 'success');
  }

  async function detectImageModels() {
    const baseUrl = getApiBase();
    const apiKey = getApiKey();
    const endpoint = buildApiEndpoint(baseUrl, '/v1/models');
    try {
      const res = await requestModelList(endpoint, apiKey);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message || err?.message || `HTTP ${res.status}`);
      }
      const data = await res.json().catch(() => ({}));
      const rawModels = typeof getAllModelIdsFromResponse === 'function' ? getAllModelIdsFromResponse(data) : [];
      const detectedModels = typeof getDetectedImageModelIdsFromResponse === 'function' ? getDetectedImageModelIdsFromResponse(data) : [];
      const models = getImageModelIdsFromResponse(data);
      if (!models.length) throw new Error('当前中转站没有返回可用模型');
      saveAvailableImageModels(models, baseUrl);
      const cachedModels = loadAvailableImageModels();
      const manualModels = typeof loadManualImageModelsForBase === 'function' ? loadManualImageModelsForBase(baseUrl) : [];
      const previous = String(getSelectedImageModel() || '').trim();
      const selected = choosePreferredImageModel(cachedModels.length ? cachedModels : models, previous);
      setSelectedImageModel(selected);
      const relayMissingHint = rawModels.length > detectedModels.length && detectedModels.length <= 1
        ? '当前 /v1/models 未返回模型广场完整生图模型；如模型广场可用，请在模型弹层手动输入模型名。'
        : '';
      recordAppLog('info', {
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
          hint: relayMissingHint
        }
      });
      return cachedModels.length ? cachedModels : models;
    } catch (err) {
      recordAppLog('error', {
        source: 'models',
        title: '检测生图模型失败',
        summary: getErrMsg(err),
        detail: { url: endpoint, raw: err?.message || String(err) }
      });
      throw err;
    }
  }

  function getSelectedTextModel() {
    const cacheSelected = window.getSelectedTextModelCache?.();
    if (cacheSelected) return cacheSelected;
    const saved = String(storageGet(REVERSE_MODEL_STORAGE) || (typeof REVERSE_MODEL !== 'undefined' ? REVERSE_MODEL : '') || '').trim();
    const models = window.loadAvailableReverseModelsCache?.() || [];
    if (models.length) {
      const selected = saved && models.includes(saved) ? saved : models[0];
      if (window.setSelectedTextModelCache) window.setSelectedTextModelCache(selected);
      return selected;
    }
    return saved;
  }

  function resolveTextModel(node) {
    const model = String(node?.settings?.model || '').trim();
    if (model && !/^gpt-image-/i.test(model)) return model;
    const saved = getSelectedTextModel();
    if (saved) return saved;
    if (!model || /^gpt-image-/i.test(model)) return '';
    return model;
  }

  function sizeOptions(current) {
    return GPT_IMAGE_SIZES.map(item => `<option value="${item.value}" ${item.value === current ? 'selected' : ''}>${item.label}</option>`).join('');
  }

  function normalizeAspectRatio(value) {
    const ratio = Number(value);
    return Number.isFinite(ratio) && ratio > 0.1 && ratio < 10 ? ratio : null;
  }

  function getClosestRatioOptionValue(ratio) {
    const target = normalizeAspectRatio(ratio) || 3 / 4;
    let best = SIZE_RATIO_OPTIONS[0];
    let bestDistance = Infinity;
    SIZE_RATIO_OPTIONS.forEach(option => {
      const parsed = parseRatioLabel(option.value);
      if (!parsed) return;
      const distance = Math.abs(parsed - target);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = option;
      }
    });
    return best.value;
  }

  function parseRatioLabel(label) {
    const match = String(label || '').match(/^(\d+(?:\.\d+)?):(\d+(?:\.\d+)?)$/);
    if (!match) return null;
    const w = Number(match[1]);
    const h = Number(match[2]);
    return h ? w / h : null;
  }

  function formatRatioLabel(ratio) {
    const value = normalizeAspectRatio(ratio) || 3 / 4;
    const option = SIZE_RATIO_OPTIONS.find(item => Math.abs((parseRatioLabel(item.value) || 0) - value) < 0.015);
    return option?.label || `${value.toFixed(2)} 比例`;
  }

  function referenceModeOptions(current) {
    const value = GENERATE_REFERENCE_MODES.some(item => item.value === current) ? current : DEFAULT_REFERENCE_MODE;
    return GENERATE_REFERENCE_MODES
      .map(item => `<option value="${escHtml(item.value)}" ${item.value === value ? 'selected' : ''}>${escHtml(item.label + ' · ' + item.hint)}</option>`)
      .join('');
  }

  // ==========================================================================
  // SECTION: 26 REFS
  // ==========================================================================
  function emptyRefs() {
    return { images: [], texts: [], textInputs: [], details: [], sketches: [] };
  }

  function collectRefsForNode(node, seen = new Set()) {
    if (!node || seen.has(node.id)) return emptyRefs();
    const nextSeen = new Set(seen);
    nextSeen.add(node.id);
    const imageMap = new Map();
    const texts = [];
    const textInputs = [];
    const details = [];
    const sketches = [];
    const connectedSourceIds = new Set();

    state.connections
      .filter(conn => conn.to === node.id)
      .map(conn => getNode(conn.from))
      .filter(Boolean)
      .forEach(source => {
        connectedSourceIds.add(source.id);
        const imageSource = toReferenceImageSource(source);
        if (imageSource && canNodeAccessSource(node.id, source.id)) {
          imageMap.set(source.id, imageSource);
          // 最小改动：sketch 节点额外把它处理过的原图（sourceImage）作为参考图传给下游。
          // 链式连接"原图 → 分层渲染 → 生图"中，生图节点原本只看到 1 张蒙版图；
          // 这里补一张原图（角色 subject），让后端"params.images" 数组包含两张图，
          // 配合 api.js 里"第 1 张是主体"的 prompt 指代正确工作。
          if (source.type === 'sketch') {
            const sketchState = getSketchState(source);
            const sourceImage = sketchState?.sourceImage || '';
            if (sourceImage && sourceImage !== imageSource.image) {
              const sourceRef = {
                ...imageSource,
                id: source.id + '__sketch_source',
                image: sourceImage,
                alias: (imageSource.alias || '分层渲染') + '_原图',
                title: (imageSource.title || '分层渲染') + ' (原图)',
                roleHint: 'subject',
                kind: 'sketch-source'
              };
              // 最小改动：用 pickRefRemoteUrl 给注入的原图也设 remoteUrl，
              // 公网 URL 图直接走 _remote_url_<i> 通道，不再依赖 catbox 兜底。
              const sourceUrl = pickRefRemoteUrl(sourceRef);
              if (sourceUrl) sourceRef.remoteUrl = sourceUrl;
              imageMap.set(source.id + '__sketch_source', sourceRef);
            }
          }
        }
        if (source.type === 'sketch' && imageSource && canNodeAccessSource(node.id, source.id)) {
          sketches.push({
            id: source.id,
            title: source.title || '分层渲染',
            alias: imageSource.alias || source.alias || source.title || '分层渲染',
            image: imageSource.image,
            mappings: getSketchState(source).mappings,
            text: sketchPromptText(source)
          });
        }
        if (source.type === 'text') {
          const textValue = String(source.result || source.text || '').trim();
          const rawText = String(source.promptSkeleton?.raw || textValue).trim();
          const taskType = String(source.promptSkeleton?.taskType || '').trim();
          const finalPrompt = cleanPromptBody(source.promptSkeleton?.finalPrompt || textValue);
          const imagePrompt = taskType === 'compose-subject-reference'
            ? finalPrompt
            : ((rawText || textValue)
              ? PromptEngine.summarizeTextForImage(rawText || textValue, { includeSubjectAnchors: false, styleOnly: true })
              : '');
          const upstream = collectRefsForNode(source, nextSeen);
          const upstreamRoleInfos = getTextInputRoleInfos(source, upstream.images);
          if (node.type === 'generate') {
            upstream.details.forEach(detail => {
              if (!details.some(item => item.id === detail.id)) details.push(detail);
            });
            upstream.sketches.forEach(sketch => {
              if (!sketches.some(item => item.id === sketch.id)) sketches.push(sketch);
            });
          }
          textInputs.push({
            id: source.id,
            title: source.title || '反推',
            ready: Boolean(textValue || rawText),
            rawText,
            imagePrompt,
            taskType,
            inputRoles: upstreamRoleInfos
          });
          if (taskType === 'compose-subject-reference' && finalPrompt) {
            texts.push(JSON.stringify({
              taskType: 'template-only',
              inputRoles: upstreamRoleInfos.map(item => ({ alias: item.alias, role: 'reference' })),
              subjectRefs: [],
              referenceRefs: upstreamRoleInfos.map(item => item.alias),
              finalPrompt,
              referenceBlacklist: Array.isArray(source.promptSkeleton?.referenceBlacklist) ? source.promptSkeleton.referenceBlacklist : []
            }));
          } else if (imagePrompt && rawText) {
            texts.push(rawText);
          }
        }
        if (source.type === 'cinema') {
          const cinemaInput = cinemaNodeToTextInput(source);
          const settings = getCinemaSettings(source);
          const cinemaPrompt = cleanPromptBody(source.result || source.text || '');
          if (cinemaInput) textInputs.push(cinemaInput);
          if (cinemaPrompt) {
            texts.push(JSON.stringify({
              taskType: 'cinema-prompt',
              finalPrompt: cinemaPrompt,
              styleSkeleton: {
                visualType: '电影节点',
                cameraLanguage: settings.structuredFields?.['镜头'] || '',
                lighting: settings.structuredFields?.['光线'] || '',
                colorSystem: settings.structuredFields?.['色彩'] || '',
                material: settings.structuredFields?.['细节控制'] || '',
                visualRhythm: settings.revisionSummary || '按电影节点最终提示词执行'
              },
              referenceBlacklist: []
            }));
          }
        }
        if (source.type === 'detail') {
          const detail = normalizeDetail(source.detail);
          details.push({
            id: source.id,
            title: source.title || '产品资料',
            detail,
            summary: detailSummary(detail),
            text: detailToPromptBlock(detail)
          });
        }
      });

    if (node.type === 'generate') {
      const assistantSource = getGenerateAssistantSource(node);
      if (assistantSource?.prompt) {
        textInputs.push({
          id: assistantSource.id || GLOBAL_CHAT_ID,
          title: '智能体',
          ready: true,
          rawText: assistantSource.prompt,
          imagePrompt: assistantSource.prompt,
          kind: 'assistant'
        });
      }
    }

    const explicitMentionText = node.type === 'text'
      ? textTemplatePrompt(node, { images: [], details: [] })
      : getGeneratePromptText(node);
    extractAliases(explicitMentionText).forEach(alias => {
      findImagesByAlias(alias)
        .filter(imgNode => connectedSourceIds.has(imgNode.id) && canNodeAccessSource(node.id, imgNode.id))
        .forEach(imgNode => imageMap.set(imgNode.id, imgNode));
    });

    return {
      images: Array.from(imageMap.values()).filter(item => item.image),
      texts,
      textInputs,
      details,
      sketches
    };
  }

  function summarizeForCard(text, max = 96) {
    const clean = String(text || '').replace(/\s+/g, ' ').trim();
    if (clean.length <= max) return clean;
    return clean.slice(0, max - 1) + '…';
  }

  function extractAliases(text) {
    const aliases = [];
    String(text || '').replace(/@([\u4e00-\u9fa5\w-]+)/g, (_, alias) => {
      aliases.push(alias);
      return _;
    });
    String(text || '').replace(/@详情页\s*(\d+)(?:\s*[·.。:：-]\s*([^\n，,。；;]+))?/g, (_, order, title = '') => {
      aliases.push(`详情页${order}`);
      if (title.trim()) aliases.push(`详情页 ${order} · ${title.trim()}`);
      return _;
    });
    String(text || '').replace(/@第\s*(\d+)\s*屏(?:\s*[·.。:：-]\s*([^\n，,。；;]+))?/g, (_, order, title = '') => {
      aliases.push(`第${order}屏`);
      if (title.trim()) aliases.push(`第 ${order} 屏 · ${title.trim()}`);
      return _;
    });
    return aliases;
  }

  function findImagesByAlias(alias) {
    const clean = String(alias || '').trim();
    if (!clean) return [];
    const sources = getReferenceImageSources();
    const aliasMatches = ref => {
      const values = [ref.alias, ref.title, ...(Array.isArray(ref.aliases) ? ref.aliases : [])]
        .map(value => String(value || '').trim())
        .filter(Boolean);
      return values.includes(clean);
    };
    const looseDetailMatch = clean.match(/^详情页\s*(\d+)(?:\s*[·.。:：-]\s*(.*))?$/);
    if (looseDetailMatch) {
      const order = Number(looseDetailMatch[1]);
      const matched = sources.filter(ref => ref.type === 'generate' && Number(ref.settings?.detailPage?.order) === order);
      if (matched.length) return matched;
    }
    const screenMatch = clean.match(/^第\s*(\d+)\s*屏(?:\s*[·.。:：-]\s*(.*))?$/);
    if (screenMatch) {
      const order = Number(screenMatch[1]);
      const matched = sources.filter(ref => ref.type === 'generate' && Number(ref.settings?.detailPage?.order) === order);
      if (matched.length) return matched;
    }
    const direct = sources.filter(node => {
      return aliasMatches(node);
    });
    if (direct.length) return direct;
    const figurePrefix = clean.match(/^(图\d+)(?:的.+)?$/);
    if (figurePrefix) {
      const prefixed = sources.filter(node => {
        const refAlias = String(node.alias || '').trim();
        const refTitle = String(node.title || '').trim();
        return refAlias === figurePrefix[1] || refTitle === figurePrefix[1];
      });
      if (prefixed.length) return prefixed;
    }
    const group = state.groups.find(item => item.title === clean || ('@' + item.title) === clean);
    if (group) return getGroupDescendantNodeIds(group.id).map(getNode).map(toReferenceImageSource).filter(Boolean);
    return [];
  }

  function getReferenceImageSources() {
    return state.nodes.map(toReferenceImageSource).filter(Boolean);
  }

  function toReferenceImageSource(node) {
    if (!node) return null;
    if (node.type === 'image' && node.image) {
      // 最小改动：image 节点原本不设 remoteUrl，导致公网图被小马AI 域吞掉。
      // 用 pickRefRemoteUrl 同时探测 image 字段本身，URL 类型直接转 remoteUrl。
      const ref = { ...node, image: node.image, alias: node.alias || node.title || '图像', title: node.title || node.alias || '图片' };
      const url = pickRefRemoteUrl(ref);
      if (url) ref.remoteUrl = url;
      return ref;
    }
    if (node.type === 'sketch' && getSketchImage(node)) {
      const sketch = getSketchState(node);
      const alias = node.alias || node.title || '分层渲染';
      return {
        ...node,
        image: sketch.image,
        alias,
        title: node.title || alias,
        roleHint: 'sketch',
        kind: 'sketch',
        sketchMappings: sketch.mappings,
        sketchText: sketchPromptText(node)
      };
    }
    if (node.type === 'generate' && node.output) {
      const activeVersion = getActiveGenerateVersion(node);
      const detailMeta = node.settings?.detailPage || {};
      const order = Number(detailMeta.order) || 0;
      const baseAlias = order ? `详情页${order}` : (node.alias || node.title || '生成图');
      const aliases = [
        baseAlias,
        order ? `第${order}屏` : '',
        detailMeta.title || '',
        node.alias || ''
      ].filter(Boolean);
      return {
        ...node,
        image: activeVersion?.image || node.output,
        // 最小改动：把版本里的公网 URL 透传给下游，
        // 让 buildImageEditFormDataV2 / formDataToXiaomaMediaPayload 优先用 URL
        remoteUrl: String(activeVersion?.remoteUrl || '').trim(),
        alias: baseAlias,
        aliases: Array.from(new Set(aliases)),
        title: node.title || baseAlias,
        versionId: activeVersion?.id || '',
        versionLabel: activeVersion?.label || ''
      };
    }
    if (node.type === 'generate' && getActiveGenerateVersion(node)?.image) {
      const activeVersion = getActiveGenerateVersion(node);
      return {
        ...node,
        image: activeVersion.image,
        alias: node.alias || node.title || '生成图',
        title: node.title || node.alias || '生成图',
        versionId: activeVersion.id || '',
        versionLabel: activeVersion.label || ''
      };
    }
    return null;
  }

  function getCompiledSubjectRef(images = [], compiled = null, node = null) {
    const nonSketchImages = images.filter(ref => !isSketchReference(ref));
    const region = getRegionEditState(node);
    if (region.sourceId) {
      const regionRef = nonSketchImages.find(ref => ref.id === region.sourceId);
      if (regionRef) return regionRef;
    }
    if (compiled?.referenceMode === 'direct') return nonSketchImages[0] || null;
    const roles = new Map((compiled?.imageRoles || []).map(item => [item.id, item]));
    return nonSketchImages.find(ref => roles.get(ref.id)?.role === 'subject') || nonSketchImages[nonSketchImages.length > 1 ? 1 : 0] || nonSketchImages[0] || null;
  }

  function isSketchReference(ref) {
    return ref?.roleHint === 'sketch' || ref?.kind === 'sketch' || ref?.type === 'sketch';
  }

  function getRegionEditState(node) {
    const raw = node?.settings?.regionEdit && typeof node.settings.regionEdit === 'object' ? node.settings.regionEdit : {};
    return {
      enabled: Boolean(raw.enabled),
      sourceId: String(raw.sourceId || ''),
      sourceAlias: String(raw.sourceAlias || ''),
      prompt: String(raw.prompt || ''),
      rect: normalizeRegionRect(raw.rect)
    };
  }

  function getResultRegionEditState(node) {
    const raw = node?.settings?.resultRegionEdit && typeof node.settings.resultRegionEdit === 'object'
      ? node.settings.resultRegionEdit
      : {};
    return {
      enabled: Boolean(raw.enabled),
      sourceVersionId: String(raw.sourceVersionId || ''),
      prompt: String(raw.prompt || ''),
      rect: normalizeRegionRect(raw.rect)
    };
  }

  function getValidResultRegionEdit(node, activeVersion = getActiveGenerateVersion(node)) {
    const region = getResultRegionEditState(node);
    if (!node || node.type !== 'generate' || !activeVersion?.image) return null;
    if (!region.enabled || !region.rect) return null;
    if (region.sourceVersionId && region.sourceVersionId !== activeVersion.id) return null;
    return { ...region, source: 'generated-version', sourceVersionId: activeVersion.id };
  }

  function normalizeRegionRect(rect) {
    if (!rect || typeof rect !== 'object') return null;
    const x = clamp01(Number(rect.x));
    const y = clamp01(Number(rect.y));
    const w = Math.max(0, Math.min(1 - x, Number(rect.w) || 0));
    const h = Math.max(0, Math.min(1 - y, Number(rect.h) || 0));
    if (w < REGION_MIN_RATIO || h < REGION_MIN_RATIO) return null;
    return { x, y, w, h };
  }

  function clamp01(value) {
    return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
  }

  function getValidRegionEdit(node, subjectRef) {
    const region = getRegionEditState(node);
    const sourceRegion = getRegionEditState(getNode(subjectRef?.id) || subjectRef);
    const activeRegion = sourceRegion.rect
      ? { ...region, enabled: true, rect: sourceRegion.rect, sourceId: subjectRef.id, sourceAlias: subjectRef.alias || subjectRef.title || sourceRegion.sourceAlias || '主图' }
      : region;
    if (!activeRegion.enabled || !activeRegion.rect || !subjectRef?.id) return null;
    if (activeRegion.sourceId && activeRegion.sourceId !== subjectRef.id) return null;
    return { ...activeRegion, sourceId: subjectRef.id, sourceAlias: subjectRef.alias || subjectRef.title || '主图' };
  }

  function getGroupForNode(nodeId) {
    if (!nodeId) return null;
    return state.groups.find(group => group.nodeIds.includes(nodeId)) || null;
  }

  function canNodeAccessSource(targetId, sourceId) {
    return Boolean(targetId && sourceId);
  }

  function getConnectedImageIdsForRegionTarget(generateNode) {
    if (!generateNode || generateNode.type !== 'generate') return new Set();
    const refs = collectRefsForNode(generateNode);
    return new Set(refs.images
      .filter(ref => !isSketchReference(ref) && getNode(ref.id)?.type === 'image')
      .map(ref => ref.id));
  }

  function activatePendingRegionTarget(nodeId) {
    const node = getNode(nodeId);
    if (!node || node.type !== 'generate') return;
    if (!getConnectedImageIdsForRegionTarget(node).size) {
      toast('请先连接要聚焦的图片节点', 'error');
      return;
    }
    state.pendingRegionTargetId = node.id;
    state.selectedId = node.id;
    state.selectedIds = [node.id];
    state.selectedGroupIds = [];
    render();
    toast('请选择已连接的图片节点', 'success');
  }

  function consumePendingRegionTarget(imageNodeId) {
    const target = getNode(state.pendingRegionTargetId);
    if (!target || target.type !== 'generate') {
      state.pendingRegionTargetId = null;
      return false;
    }
    if (!getConnectedImageIdsForRegionTarget(target).has(imageNodeId)) {
      toast('只能选择已连接到当前生图节点的图片', 'error');
      return false;
    }
    const imageNode = getNode(imageNodeId);
    if (!imageNode?.image) return false;
    state.pendingRegionTargetId = null;
    openRegionEditor(imageNodeId, { inline: true, keepSelectedId: target.id });
    return true;
  }

  function updateMentionMenu(textarea, node, field = 'text') {
    if (!textarea || !node) return;
    const trigger = getMentionTrigger(textarea);
    if (!trigger) {
      hideMentionMenu();
      return;
    }
    const options = getMentionOptions(trigger.query, node);
    if (!options.length) {
      hideMentionMenu();
      return;
    }
    state.mention = {
      textarea,
      nodeId: node.id,
      start: trigger.start,
      end: trigger.end,
      query: trigger.query,
      options,
      active: 0,
      field
    };
    renderMentionMenu();
  }

  function getMentionTrigger(textarea) {
    const cursor = textarea.selectionStart;
    const text = textarea.value.slice(0, cursor);
    const atIndex = text.lastIndexOf('@');
    if (atIndex < 0) return null;
    const query = text.slice(atIndex + 1);
    if (!/^[\u4e00-\u9fa5\w\s·.。:：-]*$/.test(query)) return null;
    return { start: atIndex, end: cursor, query };
  }

  function getMentionOptions(query, targetNode) {
    const clean = String(query || '').toLowerCase();
    return getConnectedMentionOptions(targetNode)
      .filter(node => {
        if (!clean) return true;
        const aliases = [node.alias, ...(Array.isArray(node.aliases) ? node.aliases : [])]
          .map(value => String(value || '').toLowerCase());
        return aliases.some(alias => alias.includes(clean)) || String(node.title || '').toLowerCase().includes(clean);
      });
  }

  function getConnectedMentionOptions(targetNode) {
    if (targetNode?.id === GLOBAL_CHAT_ID) return getReferenceImageSources();
    if (!targetNode?.id) return [];
    const seen = new Set();
    return state.connections
      .filter(conn => conn.to === targetNode.id)
      .map(conn => getNode(conn.from))
      .filter(source => source && canNodeAccessSource(targetNode.id, source.id))
      .map(toReferenceImageSource)
      .filter(Boolean)
      .filter(source => {
        if (seen.has(source.id)) return false;
        seen.add(source.id);
        return true;
      });
  }

  function getUpstreamVisualRefs(node) {
    if (!node?.id) return [];
    const seen = new Set();
    return state.connections
      .filter(conn => conn.to === node.id)
      .map(conn => getNode(conn.from))
      .filter(source => source && canNodeAccessSource(node.id, source.id))
      .map(toReferenceImageSource)
      .filter(Boolean)
      .filter(ref => {
        if (seen.has(ref.id)) return false;
        seen.add(ref.id);
        return Boolean(ref.image);
      });
  }

  function renderMentionMenu() {
    if (!els.mentionMenu || !state.mention) return;
    const { textarea, options, active } = state.mention;
    const rect = textarea.getBoundingClientRect();
    els.mentionMenu.innerHTML = options.map((node, index) => `
      <button type="button" class="${index === active ? 'active' : ''}" data-mention-index="${index}">
        <img src="${node.image}" alt="@${escHtml(node.alias)}">
        <span>@${escHtml(node.alias)}</span>
        <small>${escHtml(node.title || '图片')}</small>
      </button>`).join('');
    els.mentionMenu.style.left = Math.min(rect.left + 12, window.innerWidth - 236) + 'px';
    els.mentionMenu.style.top = Math.min(rect.top + 36, window.innerHeight - Math.min(260, options.length * 42 + 16)) + 'px';
    els.mentionMenu.classList.add('show');
    if (!els.mentionMenu.dataset.scrollBound) {
      els.mentionMenu.addEventListener('wheel', e => e.stopPropagation(), { passive: true });
      els.mentionMenu.addEventListener('touchmove', e => e.stopPropagation(), { passive: true });
      els.mentionMenu.dataset.scrollBound = '1';
    }
    els.mentionMenu.querySelectorAll('[data-mention-index]').forEach(btn => {
      btn.addEventListener('mousedown', e => e.preventDefault());
      btn.addEventListener('click', e => {
        e.stopPropagation();
        insertMention(Number(btn.dataset.mentionIndex));
      });
    });
    els.mentionMenu.querySelector('[data-mention-index].active')?.scrollIntoView({ block: 'nearest' });
  }

  function hideMentionMenu() {
    state.mention = null;
    els.mentionMenu?.classList.remove('show');
  }

  function handleMentionKeydown(e) {
    if (!state.mention || state.mention.textarea !== e.currentTarget) return false;
    const max = state.mention.options.length - 1;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      e.stopPropagation();
      state.mention.active = Math.min(max, state.mention.active + 1);
      renderMentionMenu();
      return true;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      e.stopPropagation();
      state.mention.active = Math.max(0, state.mention.active - 1);
      renderMentionMenu();
      return true;
    }
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      e.stopPropagation();
      insertMention(state.mention.active);
      return true;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      hideMentionMenu();
      return true;
    }
    return false;
  }

  function insertMention(index) {
    const mention = state.mention;
    if (!mention) return;
    const node = mention.options[index];
    const textarea = mention.textarea;
    if (!node || !textarea) return;
    const insertText = '@' + node.alias + ' ';
    textarea.value = textarea.value.slice(0, mention.start) + insertText + textarea.value.slice(mention.end);
    textarea.selectionStart = textarea.selectionEnd = mention.start + insertText.length;
    const targetNode = getNode(mention.nodeId);
    if (targetNode) {
      targetNode[mention.field || 'text'] = textarea.value;
      if (targetNode.type === 'text' && mention.field === 'input') {
        targetNode.text = textarea.value;
        targetNode.result = '';
      }
      if (targetNode.type === 'generate' && mention.field === 'regionPrompt') {
        targetNode.settings = { ...(targetNode.settings || {}) };
        const region = getRegionEditState(targetNode);
        targetNode.settings.regionEdit = { ...region, prompt: textarea.value };
      }
      if (targetNode.type === 'image' && mention.field === 'regionPrompt') {
        targetNode.settings = { ...(targetNode.settings || {}) };
        const region = getRegionEditState(targetNode);
        targetNode.settings.regionEdit = { ...region, prompt: textarea.value };
      }
      scheduleSaveWorkspace();
      render();
    } else if (mention.nodeId === GLOBAL_CHAT_ID && mention.field === 'assistantDraft') {
      state.assistant.draft = textarea.value;
      scheduleSaveWorkspace();
      syncAssistantHighlight(textarea);
      requestAnimationFrame(() => {
        textarea.focus?.({ preventScroll: true });
        textarea.selectionStart = textarea.selectionEnd = mention.start + insertText.length;
      });
    }
    hideMentionMenu();
  }

  // ==========================================================================
  // SECTION: 27 REGION-EDITOR
  // ==========================================================================
  function openRegionEditor(nodeId, options = {}) {
    const target = getNode(nodeId);
    if (!target) return;
    let ownerNode = target;
    let subjectRef = null;
    if (target.type === 'image') {
      subjectRef = toReferenceImageSource(target);
    } else if (target.type === 'generate') {
      const refs = collectRefsForNode(target);
      const compiled = buildCompiledPrompt(target, refs);
      subjectRef = getCompiledSubjectRef(refs.images, compiled, target);
    }
    if (!subjectRef?.image) {
      toast('请先连接主图，再设置聚焦区域', 'error');
      return;
    }
    const region = getRegionEditState(ownerNode);
    state.regionEditor = {
      nodeId: ownerNode.id,
      inline: Boolean(options.inline),
      sourceId: subjectRef.id,
      sourceAlias: subjectRef.alias || subjectRef.title || '主图',
      rect: !region.sourceId || region.sourceId === subjectRef.id ? region.rect : null,
      drag: null
    };
    if (options.inline) {
      const selectedId = options.keepSelectedId && getNode(options.keepSelectedId)
        ? options.keepSelectedId
        : ownerNode.id;
      state.selectedId = selectedId;
      state.selectedIds = [selectedId];
      state.selectedGroupIds = [];
      render();
      return;
    }
    if (els.regionSubjectLabel) els.regionSubjectLabel.textContent = `主图：@${state.regionEditor.sourceAlias}`;
    if (els.regionImg) {
      els.regionImg.src = subjectRef.image;
      els.regionImg.onload = () => updateRegionSelectionBox();
    }
    els.regionModal?.classList.add('show');
    requestAnimationFrame(() => updateRegionSelectionBox());
  }

  function openResultRegionEditor(nodeId, options = {}) {
    const node = getNode(nodeId);
    const activeVersion = node?.type === 'generate' ? getActiveGenerateVersion(node) : null;
    if (!node || node.type !== 'generate' || !activeVersion?.image) {
      toast('请先生成图片，再框选结果区域', 'error');
      return;
    }
    const region = getResultRegionEditState(node);
    state.regionEditor = {
      nodeId: node.id,
      inline: Boolean(options.inline),
      source: 'generated-version',
      sourceId: node.id,
      sourceVersionId: activeVersion.id,
      sourceAlias: `${node.title || '生成结果'} · ${activeVersion.label || '当前版本'}`,
      rect: !region.sourceVersionId || region.sourceVersionId === activeVersion.id ? region.rect : null,
      drag: null
    };
    state.selectedId = node.id;
    state.selectedIds = [node.id];
    state.selectedGroupIds = [];
    render();
  }

  function closeRegionEditor() {
    state.regionEditor = null;
    state.pendingRegionTargetId = null;
    els.regionModal?.classList.remove('show');
    if (els.regionImg) els.regionImg.src = '';
    els.regionSelection?.classList.remove('show');
    document.removeEventListener('mousemove', onRegionStageMouseMove);
    document.removeEventListener('mouseup', onRegionStageMouseUp);
    document.removeEventListener('mousemove', onInlineFocusMouseMove);
    document.removeEventListener('mouseup', onInlineFocusMouseUp);
  }

  function onRegionModalClick(e) {
    if (e.target === els.regionModal || e.target?.hasAttribute?.('data-region-cancel')) {
      closeRegionEditor();
    }
  }

  function onRegionStageMouseDown(e) {
    if (!state.regionEditor || e.button !== 0) return;
    const imgRect = getRegionImageDisplayRect();
    if (!imgRect) return;
    e.preventDefault();
    e.stopPropagation();
    state.regionEditor.drag = { startX: e.clientX, startY: e.clientY, currentX: e.clientX, currentY: e.clientY };
    document.addEventListener('mousemove', onRegionStageMouseMove);
    document.addEventListener('mouseup', onRegionStageMouseUp);
    updateRegionSelectionFromDrag();
  }

  function onInlineFocusMouseDown(e) {
    if (!state.regionEditor || e.button !== 0) return;
    const stage = e.currentTarget;
    if (!stage?.dataset?.focusStage || stage.dataset.focusStage !== state.regionEditor.nodeId) return;
    const imgRect = getInlineFocusImageDisplayRect(state.regionEditor.sourceId || state.regionEditor.nodeId);
    if (!imgRect) return;
    e.preventDefault();
    e.stopPropagation();
    state.regionEditor.drag = { startX: e.clientX, startY: e.clientY, currentX: e.clientX, currentY: e.clientY, inline: true };
    document.addEventListener('mousemove', onInlineFocusMouseMove);
    document.addEventListener('mouseup', onInlineFocusMouseUp);
    updateRegionSelectionFromDrag();
  }

  function onInlineFocusMouseMove(e) {
    if (!state.regionEditor?.drag?.inline) return;
    e.preventDefault();
    state.regionEditor.drag.currentX = e.clientX;
    state.regionEditor.drag.currentY = e.clientY;
    updateRegionSelectionFromDrag();
    render();
  }

  function onInlineFocusMouseUp(e) {
    if (!state.regionEditor?.drag?.inline) return;
    e.preventDefault();
    updateRegionSelectionFromDrag();
    state.regionEditor.drag = null;
    document.removeEventListener('mousemove', onInlineFocusMouseMove);
    document.removeEventListener('mouseup', onInlineFocusMouseUp);
    render();
  }

  function onRegionStageMouseMove(e) {
    if (!state.regionEditor?.drag) return;
    e.preventDefault();
    state.regionEditor.drag.currentX = e.clientX;
    state.regionEditor.drag.currentY = e.clientY;
    updateRegionSelectionFromDrag();
  }

  function onRegionStageMouseUp(e) {
    if (!state.regionEditor?.drag) return;
    e.preventDefault();
    updateRegionSelectionFromDrag();
    state.regionEditor.drag = null;
    document.removeEventListener('mousemove', onRegionStageMouseMove);
    document.removeEventListener('mouseup', onRegionStageMouseUp);
  }

  function updateRegionSelectionFromDrag() {
    const drag = state.regionEditor?.drag;
    if (!drag) return;
    const rect = screenRectToRegionRect({
      x: drag.startX,
      y: drag.startY,
      w: drag.currentX - drag.startX,
      h: drag.currentY - drag.startY
    });
    state.regionEditor.rect = rect;
    updateRegionSelectionBox(rect);
  }

  function getInlineFocusImageDisplayRect(nodeId) {
    const targetId = state.regionEditor?.source === 'generated-version' ? state.regionEditor.nodeId : nodeId;
    const preview = els.world?.querySelector(`.v2-node[data-id="${cssEscape(targetId)}"] .v2-media-preview`);
    if (!preview) return null;
    const rect = preview.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    return {
      left: rect.left,
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      width: rect.width,
      height: rect.height
    };
  }

  function saveRegionSelection() {
    const editor = state.regionEditor;
    const node = getNode(editor?.nodeId);
    if (!editor || !node) return;
    const rect = normalizeRegionRect(editor.rect);
    if (!rect) {
      toast('聚焦区域太小，请重新框选', 'error');
      return;
    }
    if (editor.source === 'generated-version') {
      const previous = getResultRegionEditState(node);
      node.settings = { ...(node.settings || {}) };
      node.settings.resultRegionEdit = {
        enabled: true,
        sourceVersionId: editor.sourceVersionId || getActiveGenerateVersion(node)?.id || '',
        rect,
        prompt: previous.prompt || ''
      };
      closeRegionEditor();
      scheduleSaveWorkspace();
      render();
      toast('已保存结果框选区域', 'success');
      return;
    }
    if (editor.source === 'try-on-model') {
      const settings = getTryOnSettings(node);
      settings.modelRegion = {
        enabled: true,
        sourceId: editor.sourceId || '',
        sourceAlias: editor.sourceAlias || '模特图',
        rect
      };
      node.settings.tryOn = settings;
      closeRegionEditor();
      scheduleSaveWorkspace();
      render();
      toast('已保存模特服装鞋履区域', 'success');
      return;
    }
    const previous = getRegionEditState(node);
    node.settings = { ...(node.settings || {}) };
    node.settings.regionEdit = {
      enabled: true,
      sourceId: editor.sourceId,
      sourceAlias: editor.sourceAlias,
      rect,
      prompt: previous.prompt || ''
    };
    syncRegionSelectionConsumers(editor.sourceId, node.id);
    closeRegionEditor();
    scheduleSaveWorkspace();
    render();
    toast('已保存聚焦区域', 'success');
  }

  function clearRegionEdit(nodeId) {
    const node = getNode(nodeId);
    if (!node) return;
    const region = getRegionEditState(node);
    node.settings = { ...(node.settings || {}) };
    node.settings.regionEdit = { enabled: false, prompt: '' };
    if (node.type === 'image') syncRegionSelectionConsumers(node.id, node.id);
    else if (node.type === 'generate') {
      const refs = collectRefsForNode(node);
      const compiled = buildCompiledPrompt(node, refs);
      const subjectRef = getCompiledSubjectRef(refs.images, compiled, node);
      const sourceId = region.sourceId || subjectRef?.id || '';
      if (sourceId) {
        const sourceNode = getNode(sourceId);
        if (sourceNode?.type === 'image') {
          sourceNode.settings = { ...(sourceNode.settings || {}) };
          sourceNode.settings.regionEdit = { enabled: false, prompt: '' };
        }
        syncRegionSelectionConsumers(sourceId, node.id);
      }
    } else if (region.sourceId) syncRegionSelectionConsumers(region.sourceId, node.id);
    scheduleSaveWorkspace();
    render();
  }

  function clearResultRegionEdit(nodeId) {
    const node = getNode(nodeId);
    if (!node || node.type !== 'generate') return;
    node.settings = { ...(node.settings || {}) };
    node.settings.resultRegionEdit = { enabled: false, prompt: '' };
    if (state.regionEditor?.nodeId === node.id && state.regionEditor?.source === 'generated-version') closeRegionEditor();
    scheduleSaveWorkspace();
    render();
  }

  function syncRegionSelectionConsumers(sourceId, ownerId = '') {
    if (!sourceId) return;
    state.nodes.forEach(item => {
      if (item.id === ownerId || item.type !== 'generate') return;
      const region = getRegionEditState(item);
      if (!region.rect && !region.enabled) return;
      if (region.sourceId && region.sourceId !== sourceId) return;
      item.settings = { ...(item.settings || {}) };
      item.settings.regionEdit = { ...region, enabled: false, sourceId: '', sourceAlias: '', rect: null };
    });
  }

  // ==========================================================================
  // SECTION: 28 DETAIL
  // ==========================================================================
  function normalizeDetail(detail = {}) {
    const out = {};
    // 新格式：优先读 detail.text（单文本框）
    out.text = String(detail?.text || '').trim();
    // 旧格式兼容：8 字段
    PRODUCT_FACT_FIELDS.forEach(([key]) => {
      out[key] = stringifyDetailValue(detail?.[key]).trim();
    });
    return out;
  }

  function stringifyDetailValue(value) {
    if (value == null) return '';
    if (typeof value === 'string') return value;
    if (Array.isArray(value)) {
      return value
        .map(item => stringifyDetailValue(item))
        .filter(Boolean)
        .join('\n');
    }
    if (typeof value === 'object') {
      return Object.entries(value)
        .map(([key, item]) => {
          const text = stringifyDetailValue(item);
          return text ? `${key}：${text}` : '';
        })
        .filter(Boolean)
        .join('\n');
    }
    return String(value);
  }

  function detailPlaceholder(key) {
    const map = {
      name: '例如：舒缓修护芦荟胶',
      category: '例如：护肤品 / 吸尘机 / 饮品',
      brand: '品牌名，没有可留空',
      sellingPoints: '只写确认存在的卖点，不确定就留空',
      specs: '容量、功率、型号、尺寸等，没给就不要编',
      materials: '材质、成分、工艺等',
      forbidden: '不能出现的词、不能编造的参数',
      notes: '目标人群、使用场景、视觉要求等'
    };
    return map[key] || '';
  }

  function detailSummary(detail = {}) {
    const d = normalizeDetail(detail);
    if (d.text) return d.text.slice(0, 80);
    return [d.name, d.category, d.brand].filter(Boolean).join(' · ') || String(d.sellingPoints || d.notes || '').slice(0, 80);
  }

  function detailToPromptBlock(detail = {}) {
    const d = normalizeDetail(detail);
    // 新格式：单文本框
    if (d.text) {
      return [
        '【产品资料节点】',
        d.text,
        '优先级：产品资料节点提供当前主体的产品事实，优先于智能体/反推里”不要品牌名、不要型号、不要产品名”等泛化禁令；这些禁令只用于排除参考图旧品牌/旧型号/旧文案。',
        '使用边界：产品资料节点只用于补充产品信息；不能改变主图可见的外形、颜色、比例、结构、轮廓、包装和关键识别细节。若产品资料文本与主图可见外观冲突，必须以主图为准。'
      ].filter(Boolean).join('\n');
    }
    // 旧格式兼容：8 字段
    const lines = PRODUCT_FACT_FIELDS
      .map(([key, label]) => d[key] ? `${label}：${d[key]}` : '')
      .filter(Boolean);
    if (!lines.length) return '';
    return [
      '【产品资料节点】',
      ...lines,
      '优先级：产品资料节点提供当前主体的产品事实，优先于智能体/反推里”不要品牌名、不要型号、不要产品名”等泛化禁令；这些禁令只用于排除参考图旧品牌/旧型号/旧文案。',
      '使用边界：产品资料节点只用于补充产品名称、品牌、品类、卖点、规格参数、文案、信息模块和禁用词；不能改变主图可见的外形、颜色、比例、结构、轮廓、车身/瓶身/包装和关键识别细节。若产品资料文本与主图可见外观冲突，必须以主图为准。参考图没有参数/卖点/详情栏布局时，不要硬塞参数模块；没有填写的参数禁止编造。',
      d.name ? `必须使用当前产品名称：${d.name}` : '',
      d.brand ? `必须使用当前品牌：${d.brand}` : ''
    ].filter(Boolean).join('\n');
  }

  function buildDetailPriorityBlock(details = []) {
    const items = details
      .map(ref => normalizeDetail(ref.detail))
      .filter(detail => detail.text || PRODUCT_FACT_FIELDS.some(([key]) => detail[key]));
    if (!items.length) return '';
    return [
      '【产品资料优先级修正】',
      '以下是当前主体的真实产品事实，必须参与最终生图；不要因为智能体/反推提示词里的”不要任何品牌名/型号/产品名”而删除这些事实。',
      '”不要旧品牌、旧型号、旧文案”只表示不要继承参考图或样式图里的旧信息，不表示删除产品资料节点提供的新主体品牌与型号。',
      ...items.map(detail => {
        if (detail.text) return detail.text;
        return [
          detail.name ? `当前产品名称：${detail.name}` : '',
          detail.brand ? `当前品牌：${detail.brand}` : '',
          detail.category ? `当前品类：${detail.category}` : '',
          detail.sellingPoints ? `当前卖点/文案方向：${detail.sellingPoints}` : '',
          detail.specs ? `当前规格参数：${detail.specs}` : ''
        ].filter(Boolean).join('\n');
      }).filter(Boolean)
    ].join('\n');
  }

  function sanitizeProductNoise(text) {
    return PromptEngine.sanitizeProductNoise(text);
  }

  // ==========================================================================
  // SECTION: 29 PREVIEW
  // ==========================================================================
  function previewOutput(id) {
    const node = getNode(id);
    if (!node?.output) return;
    showPreview(node.output, node.title || '生成结果', id);
    syncPreviewArrows(id);
  }

  function previewImage(id) {
    const node = getNode(id);
    if (!node?.image) return;
    showPreview(node.image, node.title || node.alias || '图片预览', id);
  }

  function previewSketch(id) {
    const node = getNode(id);
    const image = node ? getSketchImage(node) : '';
    if (!image) return;
    showPreview(image, node.title || node.alias || '分层渲染预览', id);
  }

  function showPreview(src, caption, id) {
    if (!els.previewModal || !els.previewImg) return;
    state.previewNodeId = id;
    els.previewImg.src = src;
    resetPreviewZoom();
    if (els.previewCaption) els.previewCaption.textContent = caption || '图片预览';
    els.previewModal.classList.add('show');
  }

  function hidePreviewModal() {
    els.previewModal?.classList.remove('show');
    state.previewNodeId = null;
    resetPreviewZoom();
    if (els.previewImg) els.previewImg.src = '';
  }

  function isPreviewModalOpen() {
    return Boolean(els.previewModal?.classList.contains('show'));
  }

  function resetPreviewZoom() {
    state.previewZoom = 1;
    state.previewPanX = 0;
    state.previewPanY = 0;
    state.previewGesture = null;
    applyPreviewTransform();
  }

  function applyPreviewTransform() {
    if (!els.previewImg) return;
    const zoom = Math.max(1, Math.min(6, Number(state.previewZoom) || 1));
    state.previewZoom = zoom;
    if (zoom <= 1.001) {
      state.previewPanX = 0;
      state.previewPanY = 0;
    }
    els.previewImg.style.transform = `translate(${Math.round(state.previewPanX)}px, ${Math.round(state.previewPanY)}px) scale(${zoom})`;
    els.previewImg.style.cursor = zoom > 1.001 ? 'grab' : 'zoom-in';
  }

  function onPreviewWheel(e) {
    if (!isPreviewModalOpen()) return;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation?.();
    const deltaModeScale = e.deltaMode === WheelEvent.DOM_DELTA_LINE ? 16 : 1;
    const dx = e.deltaX * deltaModeScale;
    const dy = e.deltaY * deltaModeScale;
    if (e.shiftKey || Math.abs(dx) > Math.abs(dy)) {
      state.previewPanX -= dx || dy;
      applyPreviewTransform();
      return;
    }
    const delta = Math.max(-120, Math.min(120, dy));
    const nextZoom = Math.max(1, Math.min(6, state.previewZoom * Math.exp(-delta * 0.0028)));
    const oldZoom = state.previewZoom || 1;
    if (Math.abs(nextZoom - oldZoom) < 0.001) return;
    const rect = els.previewImg?.getBoundingClientRect();
    if (rect && oldZoom > 0) {
      const offsetX = e.clientX - (rect.left + rect.width / 2);
      const offsetY = e.clientY - (rect.top + rect.height / 2);
      const zoomRatio = nextZoom / oldZoom;
      state.previewPanX = state.previewPanX - offsetX * (zoomRatio - 1);
      state.previewPanY = state.previewPanY - offsetY * (zoomRatio - 1);
    }
    state.previewZoom = nextZoom;
    applyPreviewTransform();
  }

  function previewClientOffset(e) {
    const rect = els.previewImg?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    const clientX = Number.isFinite(e.clientX) ? e.clientX : rect.left + rect.width / 2;
    const clientY = Number.isFinite(e.clientY) ? e.clientY : rect.top + rect.height / 2;
    return {
      x: clientX - (rect.left + rect.width / 2),
      y: clientY - (rect.top + rect.height / 2)
    };
  }

  function onPreviewGestureStart(e) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation?.();
    state.previewGesture = {
      startZoom: state.previewZoom || 1,
      lastScale: Math.max(0.2, Math.min(5, Number(e.scale) || 1)),
      offset: previewClientOffset(e)
    };
  }

  function onPreviewGestureChange(e) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation?.();
    if (!state.previewGesture) onPreviewGestureStart(e);
    const gesture = state.previewGesture || { startZoom: state.previewZoom || 1, lastScale: 1, offset: previewClientOffset(e) };
    const scale = Math.max(0.2, Math.min(5, Number(e.scale) || 1));
    const nextZoom = Math.max(1, Math.min(6, gesture.startZoom * scale));
    const oldZoom = state.previewZoom || 1;
    if (Math.abs(nextZoom - oldZoom) >= 0.001) {
      const zoomRatio = nextZoom / oldZoom;
      state.previewPanX = state.previewPanX - gesture.offset.x * (zoomRatio - 1);
      state.previewPanY = state.previewPanY - gesture.offset.y * (zoomRatio - 1);
      state.previewZoom = nextZoom;
      applyPreviewTransform();
    }
    gesture.lastScale = scale;
  }

  function onPreviewGestureEnd(e) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation?.();
    state.previewGesture = null;
  }

  function syncPreviewArrows(nodeId) {
    const node = nodeId ? getNode(nodeId) : null;
    const versions = node?.type === 'generate' ? normalizeGenerateVersions(node) : [];
    const multi = versions.length > 1;
    if (els.previewPrev) els.previewPrev.style.display = multi ? '' : 'none';
    if (els.previewNext) els.previewNext.style.display = multi ? '' : 'none';
  }

  function stepPreviewVersion(direction) {
    const nodeId = state.previewNodeId;
    if (!nodeId) return;
    const node = getNode(nodeId);
    if (!node || node.type !== 'generate') return;
    const next = stepGenerateVersion(nodeId, direction);
    if (next?.image && els.previewImg) {
      els.previewImg.src = next.image;
      if (els.previewCaption) els.previewCaption.textContent = node.title + ' · ' + (next.label || '');
    }
  }

  function onPreviewModalClick(e) {
    if (e.target === els.previewModal || e.target?.hasAttribute?.('data-v2-preview-close')) {
      hidePreviewModal();
    }
  }

  async function downloadOutput(id) {
    const node = getNode(id);
    const src = node?.output || node?.image;
    if (!src) return;
    try {
      const dataUrl = await imageSourceToDataUrl(src);
      const ext = resolveImageExtension(dataUrl, node);
      const fileName = safeDownloadFileName(node?.title || 'v2-output', ext);
      if (isTauriRuntime()) {
        const result = await saveImageWithTauri(dataUrl, fileName, ext);
        if (!result) throw new Error('Tauri 保存接口不可用，请重启 App');
        if (result.saved === false) return;
        toast('已保存图片', 'success');
        return;
      }
      downloadImageInBrowser(dataUrl, fileName);
    } catch (err) {
      toast('保存失败：' + getErrMsg(err), 'error');
    }
  }

  async function saveImageWithTauri(dataUrl, fileName, extension) {
    const invoke = window.__TAURI__?.core?.invoke;
    if (typeof invoke !== 'function') return null;
    return await invoke('save_image_file', {
      data: dataUrl,
      fileName,
      extension
    });
  }

  function isTauriRuntime() {
    return Boolean(window.__TAURI_INTERNALS__ || window.__TAURI__ || window.isTauri);
  }

  async function imageSourceToDataUrl(src) {
    if (String(src || '').startsWith('data:image/')) return src;
    const response = await fetch(src);
    if (!response.ok) throw new Error('图片下载失败：HTTP ' + response.status);
    const blob = await response.blob();
    return await blobToDataUrl(blob);
  }

  function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('图片读取失败'));
      reader.readAsDataURL(blob);
    });
  }

  function resolveImageExtension(src, node) {
    const mimeExt = String(src || '').match(/^data:image\/([^;,]+)/)?.[1];
    const ext = mimeExt || node?.settings?.format || 'png';
    if (ext === 'jpeg') return 'jpg';
    if (/^(png|jpg|webp)$/i.test(ext)) return ext.toLowerCase();
    return 'png';
  }

  function safeDownloadFileName(title, ext) {
    const base = String(title || 'v2-output')
      .replace(/[\\/:*?"<>|]/g, '-')
      .replace(/\s+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'v2-output';
    return `${base}-${Date.now()}.${ext}`;
  }

  function downloadImageInBrowser(dataUrl, fileName) {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  // ==========================================================================
  // SECTION: 30 LIBRARY
  // ==========================================================================
  async function loadPromptLibrary() {
    try {
      const raw = await dbGet(LIBRARY_KEY);
      const items = JSON.parse(raw || '[]');
      return Array.isArray(items) ? items : [];
    } catch {
      return [];
    }
  }

  async function savePromptLibrary(items) {
    await dbSet(LIBRARY_KEY, JSON.stringify((items || []).slice(0, 200)));
  }

  async function saveNodeToPromptLibrary(id) {
    const node = getNode(id);
    const activeVersion = node?.type === 'generate' ? getActiveGenerateVersion(node) : null;
    const outputImage = activeVersion?.image || node?.output || '';
    if (!node || node.type !== 'generate' || !outputImage) {
      toast('请先生成图片，再加入图库', 'error');
      return;
    }
    const refs = collectRefsForNode(node);
    const finalPrompt = buildPrompt(node, refs);
    const roleInfos = getImageRoleInfos(node, refs);
    const storedImageRoles = Array.isArray(activeVersion?.imageRoles) && activeVersion.imageRoles.length
      ? activeVersion.imageRoles
      : null;
    const versionSuffix = activeVersion?.label ? ` · ${activeVersion.label}` : '';
    const item = {
      id: uid('lib'),
      title: (node.title || '好图') + versionSuffix + ' · ' + new Date().toLocaleString(),
      image: outputImage,
      aspectRatio: getGenerateOutputAspectRatio(node),
      prompt: sanitizeProductNoise(activeVersion?.rawPrompt || getGeneratePromptText(node)),
      finalPrompt: sanitizeProductNoise(activeVersion?.prompt || finalPrompt),
      settings: { ...(activeVersion?.settings || node.settings || {}) },
      detailSnapshot: refs.details.map(ref => ({ title: ref.title, detail: ref.detail })),
      imageRoles: storedImageRoles || refs.images.map((ref, index) => ({
        alias: ref.alias || ref.title || ('图' + (index + 1)),
        role: roleInfos.get(ref.id)?.role || inferImageRole(refs.images, index),
        channel: roleInfos.get(ref.id)?.channel || (getImagesForGenerateRequest(node, refs).some(item => item.id === ref.id) ? 'image' : 'structure')
      })),
      sketchSnapshot: refs.sketches.map(ref => ({
        title: ref.title,
        alias: ref.alias,
        image: ref.image,
        sourceImage: getNode(ref.id)?.sketch?.sourceImage || ref.image,
        sourceAspectRatio: getNode(ref.id)?.sketch?.sourceAspectRatio || 1,
        segmentedAt: getNode(ref.id)?.sketch?.segmentedAt || 0,
        segmentationElements: getNode(ref.id)?.sketch?.segmentationElements || [],
        mappings: ref.mappings,
        text: ref.text
      })),
      createdAt: Date.now()
    };
    const items = await loadPromptLibrary();
    items.unshift(item);
    await savePromptLibrary(items);
    renderPromptLibrary();
    toast('已加入提示词图库', 'success');
  }

  // ==========================================================================
  // SECTION: 31 VERSIONS
  // ==========================================================================
  function getGenerateOutputAspectRatio(node) {
    const parsed = parseApiSizeValue(node?.settings?.size || '');
    return parsed?.ratio || Number(node?.aspectRatio) || 3 / 4;
  }

  function cloneGenerateSettings(settings = {}) {
    return JSON.parse(JSON.stringify(settings || {}));
  }

  function normalizeGenerateVersion(version, index, node) {
    if (!version || typeof version !== 'object') return null;
    const image = String(version.image || '').trim();
    if (!image) return null;
    return {
      id: String(version.id || `${node.id}_v${index + 1}`),
      label: String(version.label || `v${index + 1}`),
      image,
      prompt: String(version.prompt || ''),
      rawPrompt: String(version.rawPrompt || ''),
      settings: cloneGenerateSettings(version.settings || {}),
      createdAt: Number(version.createdAt) || Date.now(),
      sourceAssistantId: String(version.sourceAssistantId || version.sourceChatId || ''),
      adoptedPrompt: sanitizeProductNoise(version.adoptedPrompt || ''),
      imageRoles: Array.isArray(version.imageRoles)
        ? version.imageRoles.map(item => ({ ...item }))
        : [],
      batchSubjectAlias: String(version.batchSubjectAlias || '')
    };
  }

  function normalizeGenerateVersions(node) {
    if (!node || node.type !== 'generate') return [];
    const existing = Array.isArray(node.versions) ? node.versions : [];
    let versions = existing.map((version, index) => normalizeGenerateVersion(version, index, node)).filter(Boolean);
    if (!versions.length && node.output) {
      versions = [{
        id: node.activeVersionId || `${node.id}_v1`,
        label: 'v1',
        image: node.output,
        prompt: '',
        rawPrompt: '',
        settings: cloneGenerateSettings(node.settings || {}),
        createdAt: Date.now(),
        sourceAssistantId: '',
        adoptedPrompt: '',
        imageRoles: [],
        batchSubjectAlias: ''
      }];
    }
    versions = versions.map((version, index) => ({
      ...version,
      label: /^v\d+$/i.test(version.label) ? version.label : `v${index + 1}`
    }));
    node.versions = versions;
    const active = versions.find(version => version.id === node.activeVersionId) || versions[versions.length - 1] || null;
    node.activeVersionId = active?.id || '';
    if (active?.image) node.output = active.image;
    return versions;
  }

  function getActiveGenerateVersion(node) {
    const versions = normalizeGenerateVersions(node);
    return versions.find(version => version.id === node.activeVersionId) || versions[versions.length - 1] || null;
  }

  function getGenerateVersionLabel(version, index) {
    return version?.label || `v${index + 1}`;
  }

  function formatVersionTime(timestamp) {
    if (!timestamp) return '';
    try {
      return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  }

  function appendGenerateVersion(node, image, compiled, refs, originalUrl = '') {
    const versions = normalizeGenerateVersions(node);
    const assistantSource = getGenerateAssistantSource(node);
    const nextIndex = versions.length + 1;
    const version = {
      id: uid('ver'),
      label: `v${nextIndex}`,
      image,
      // 最小改动：保留后端返回的公网 URL 供下游"图生图"使用
      // （base64 在小马AI 域会被拒绝，必须用 URL）
      remoteUrl: String(originalUrl || '').trim(),
      prompt: String(compiled?.prompt || ''),
      rawPrompt: getGeneratePromptText(node),
      settings: cloneGenerateSettings(node.settings || {}),
      createdAt: Date.now(),
      sourceAssistantId: assistantSource?.id || '',
      adoptedPrompt: assistantSource?.prompt || '',
      imageRoles: Array.isArray(compiled?.imageRoles)
        ? compiled.imageRoles.map(item => ({
          alias: item.alias || item.title || item.id,
          role: item.role || 'unknown',
          channel: item.channel || ((compiled.requestImages || []).some(ref => ref.id === item.id) ? 'image' : 'structure'),
          label: item.label || ''
        }))
        : [],
      batchSubjectAlias: String(compiled?.batchSubjectAlias || '')
    };
    node.versions = [...versions, version];
    node.activeVersionId = version.id;
    node.output = image;
    return version;
  }

  function normalizeGenerateAssistantSourceValue(value = {}) {
    if (!value || typeof value !== 'object') return null;
    const prompt = sanitizeProductNoise(value.prompt || value.adoptedPrompt || '');
    if (!prompt) return null;
    return {
      id: String(value.id || value.sourceAssistantId || value.sourceChatId || GLOBAL_CHAT_ID),
      messageIndex: Number.isInteger(value.messageIndex) ? value.messageIndex : -1,
      prompt,
      adoptedAt: Number(value.adoptedAt) || Date.now(),
      feedbackText: String(value.feedbackText || ''),
      sourceGenerateNodeId: String(value.sourceGenerateNodeId || ''),
      sourceVersionId: String(value.sourceVersionId || ''),
      mode: value.mode === 'region' ? 'region' : 'full',
      useCurrentVersionAsEditInput: Boolean(value.useCurrentVersionAsEditInput)
    };
  }

  function compactComparableText(text) {
    return sanitizeProductNoise(text).replace(/\s+/g, '');
  }

  function generatePromptIncludesAssistantSource(node, prompt) {
    const source = compactComparableText(prompt);
    if (!source) return false;
    const promptText = compactComparableText(getGeneratePromptText(node));
    return promptText.includes(source);
  }

  function getGenerateAssistantSource(node) {
    if (!node || node.type !== 'generate') return null;
    const stored = normalizeGenerateAssistantSourceValue(node.assistantSource);
    if (stored && generatePromptIncludesAssistantSource(node, stored.prompt)) return stored;
    const assistant = getAssistantState();
    const prompt = sanitizeProductNoise(assistant.adoptedPrompt || '');
    if (prompt && generatePromptIncludesAssistantSource(node, prompt)) {
      return {
        id: GLOBAL_CHAT_ID,
        messageIndex: assistant.adoptedMessageIndex,
        prompt,
        adoptedAt: Date.now()
      };
    }
    return null;
  }

  function normalizeGenerateAssistantSource(node) {
    const source = getGenerateAssistantSource(node);
    if (source) node.assistantSource = source;
    else delete node.assistantSource;
    return source;
  }

  function normalizeGenerateRevisionEditInput(value = {}) {
    if (!value || typeof value !== 'object') return null;
    const sourceVersionId = String(value.sourceVersionId || '');
    if (!value.enabled || !sourceVersionId) return null;
    return {
      enabled: true,
      source: String(value.source || 'assistant'),
      sourceNodeId: String(value.sourceNodeId || ''),
      sourceVersionId,
      sourceVersionLabel: String(value.sourceVersionLabel || ''),
      prompt: sanitizeCinemaFinalPrompt(value.prompt || ''),
      createdAt: Number(value.createdAt) || Date.now()
    };
  }

  function setGenerateRevisionEditInput(node, value = null) {
    if (!node || node.type !== 'generate') return null;
    node.settings = { ...(node.settings || {}) };
    const normalized = normalizeGenerateRevisionEditInput(value);
    if (normalized) {
      node.settings.revisionEditInput = normalized;
      return normalized;
    }
    delete node.settings.revisionEditInput;
    return null;
  }

  function clearGenerateRevisionEditInput(node, source = '') {
    if (!node || node.type !== 'generate') return;
    const pending = normalizeGenerateRevisionEditInput(node.settings?.revisionEditInput);
    if (!pending || (source && pending.source !== source)) return;
    node.settings = { ...(node.settings || {}) };
    delete node.settings.revisionEditInput;
    if (source === 'cinema' && node.assistantSource) {
      node.assistantSource = {
        ...node.assistantSource,
        useCurrentVersionAsEditInput: false
      };
    }
  }

  function switchGenerateVersion(nodeId, versionId) {
    const node = getNode(nodeId);
    if (!node || node.type !== 'generate') return;
    const versions = normalizeGenerateVersions(node);
    const version = versions.find(item => item.id === versionId);
    if (!version) return;
    node.activeVersionId = version.id;
    node.output = version.image;
    const resultRegion = getResultRegionEditState(node);
    if (resultRegion.sourceVersionId && resultRegion.sourceVersionId !== version.id) {
      node.settings = { ...(node.settings || {}) };
      node.settings.resultRegionEdit = { ...resultRegion, enabled: false, rect: null };
    }
    render();
    scheduleSaveWorkspace();
  }

  function stepGenerateVersion(nodeId, direction) {
    const node = getNode(nodeId);
    if (!node || node.type !== 'generate') return;
    const versions = normalizeGenerateVersions(node);
    if (versions.length < 2) return;
    const currentIndex = versions.findIndex(v => v.id === node.activeVersionId);
    const nextIndex = (currentIndex + direction + versions.length) % versions.length;
    const next = versions[nextIndex];
    if (!next) return;
    node.activeVersionId = next.id;
    node.output = next.image;
    const resultRegion = getResultRegionEditState(node);
    if (resultRegion.sourceVersionId && resultRegion.sourceVersionId !== next.id) {
      node.settings = { ...(node.settings || {}) };
      node.settings.resultRegionEdit = { ...resultRegion, enabled: false, rect: null };
    }
    render();
    scheduleSaveWorkspace();
    return next;
  }

  function renderGenerateVersionStrip(node) {
    const versions = normalizeGenerateVersions(node);
    if (!versions.length) return '';
    const multi = versions.length > 1;
    return `
          <div class="v2-panel-section">
            <label class="v2-label">版本历史</label>
            <div class="v2-version-strip">
              ${multi ? `<button type="button" class="v2-ver-arrow left" data-step-version="${node.id}" data-dir="-1" title="上一张">&#8249;</button>` : ''}
              ${versions.map((version, index) => {
                const active = version.id === node.activeVersionId;
                const label = getGenerateVersionLabel(version, index);
                return `<button class="v2-version-card ${active ? 'active' : ''}" type="button" data-generate-version="${node.id}" data-version-id="${escHtml(version.id)}" title="${escHtml(label)}">
                  <img src="${version.image}" alt="${escHtml(label)}">
                  <span>${escHtml(label)}</span>
                  <small>${escHtml(formatVersionTime(version.createdAt))}</small>
                </button>`;
              }).join('')}
              ${multi ? `<button type="button" class="v2-ver-arrow right" data-step-version="${node.id}" data-dir="1" title="下一张">&#8250;</button>` : ''}
            </div>
          </div>`;
  }

  async function renderPromptLibrary() {
    if (!els.libraryGrid || !els.libraryCount) return;
    const items = await loadPromptLibrary();
    els.libraryCount.textContent = items.length + ' 张好图';
    if (!items.length) {
      els.libraryGrid.innerHTML = '<div class="v2-library-empty">生成好图后点“加入图库”保存</div>';
      return;
    }
    els.libraryGrid.innerHTML = items.map(item => {
      const ratio = normalizeAspectRatio(item.aspectRatio) || inferRatioFromSize(item.settings?.size || '') || 3 / 4;
      return `
      <article class="v2-library-card" draggable="true" data-library-drag="${item.id}">
        <button type="button" class="v2-library-thumb" data-library-use="${item.id}" style="aspect-ratio:${ratio}">
          ${item.image ? `<img src="${item.image}" alt="${escHtml(item.title)}">` : '<span>无预览</span>'}
        </button>
        <div class="v2-library-body">
          <div class="v2-library-card-title">${escHtml(item.title || '好图')}</div>
          <div class="v2-library-card-meta">${escHtml(formatRatioLabel(ratio))} · 拖到画布生成静帧节点</div>
          <div class="v2-library-card-actions">
            <button type="button" data-library-use="${item.id}">生成类似</button>
            <button type="button" data-library-delete="${item.id}">删除</button>
          </div>
        </div>
      </article>`;
    }).join('');
    els.libraryGrid.querySelectorAll('[data-library-drag]').forEach(card => {
      card.addEventListener('dragstart', e => {
        e.dataTransfer?.setData('application/x-v2-library', card.dataset.libraryDrag);
        e.dataTransfer?.setData('text/plain', card.dataset.libraryDrag);
        if (e.dataTransfer) e.dataTransfer.effectAllowed = 'copyMove';
      });
    });
    els.libraryGrid.querySelectorAll('[data-library-use]').forEach(btn => {
      btn.addEventListener('click', () => usePromptLibraryItem(btn.dataset.libraryUse));
    });
    els.libraryGrid.querySelectorAll('[data-library-delete]').forEach(btn => {
      btn.addEventListener('click', () => deletePromptLibraryItem(btn.dataset.libraryDelete));
    });
  }

  async function usePromptLibraryItem(id) {
    const items = await loadPromptLibrary();
    const item = items.find(entry => entry.id === id);
    if (!item) return;
    const point = screenToWorld(window.innerWidth / 2, window.innerHeight / 2);
    await createNodesFromPromptLibraryItem(id, point);
  }

  async function createNodesFromPromptLibraryItem(id, point) {
    const items = await loadPromptLibrary();
    const item = items.find(entry => entry.id === id);
    if (!item) return;
    const base = point || screenToWorld(window.innerWidth / 2, window.innerHeight / 2);
    const ratio = normalizeAspectRatio(item.aspectRatio) || inferRatioFromSize(item.settings?.size || '') || 3 / 4;
    const ratioValue = getClosestRatioOptionValue(ratio);
    const settings = {
      ...(item.settings || {}),
      ratio: ratioValue,
      resolution: undefined,
      referenceMode: DEFAULT_REFERENCE_MODE
    };
    settings.resolution = settings.resolution || Object.keys(getRatioOption(settings.ratio).sizes)[0];
    settings.size = sizeFromRatioResolution(settings.ratio, settings.resolution);
    const imageNode = item.image ? addNode('image', {
      image: item.image,
      aspectRatio: ratio,
      x: base.x,
      y: base.y,
      title: '静帧参考'
    }) : null;
    const generateNode = addNode('generate', {
      x: base.x + NODE_W + 120,
      y: base.y,
      title: '生图 · 图库复用',
      text: buildLibraryReusePrompt(item, imageNode),
      settings
    });
    if (imageNode) connectNodes(imageNode.id, generateNode.id);
    const sketchNodes = Array.isArray(item.sketchSnapshot)
      ? item.sketchSnapshot
        .filter(entry => entry?.image)
        .slice(0, 4)
        .map((entry, index) => addNode('sketch', {
          image: entry.image,
          aspectRatio: 1,
          x: base.x,
          y: base.y + (index + 1) * 330,
          title: entry.title || '分层渲染 · 图库复用',
          sketch: {
            image: entry.image,
            sourceImage: entry.sourceImage || entry.image,
            aspectRatio: 1,
            sourceAspectRatio: entry.sourceAspectRatio || 1,
            segmentedAt: entry.segmentedAt || 0,
            segmentationElements: entry.segmentationElements || [],
            mappings: entry.mappings || DEFAULT_SKETCH_MAPPINGS
          }
        }))
      : [];
    sketchNodes.forEach(sketchNode => connectNodes(sketchNode.id, generateNode.id));
    const createdIds = [imageNode?.id, ...sketchNodes.map(item => item.id), generateNode.id].filter(Boolean);
    state.selectedIds = createdIds;
    state.selectedId = generateNode.id;
    render();
    scheduleSaveWorkspace();
    toast('已从图库创建静帧节点', 'success');
  }

  function buildLibraryReusePrompt(item, imageNode) {
      const basePrompt = sanitizeProductNoise(item.prompt || DEFAULT_GENERATE_PROMPT);
      const stillRef = imageNode?.alias ? `参考：@${imageNode.alias}` : '参考：';
    const sketchText = Array.isArray(item.sketchSnapshot) && item.sketchSnapshot.length
      ? '\n图库分层渲染引导：\n' + item.sketchSnapshot.map(entry => entry.text || '').filter(Boolean).join('\n\n')
      : '';
    return [
      '主体：',
      stillRef,
      '提示词：生成一张同图库静帧视觉结构的图片，不要添加文字；保持图库静帧的比例和构图节奏，主体以后接入新主图后替换。',
      basePrompt ? '图库风格：' + basePrompt : '',
      sketchText
    ].filter(Boolean).join('\n');
  }

  async function deletePromptLibraryItem(id) {
    await savePromptLibrary((await loadPromptLibrary()).filter(item => item.id !== id));
    renderPromptLibrary();
    toast('图库记录已删除', 'success');
  }

  function togglePromptLibrary(force) {
    const show = typeof force === 'boolean' ? force : !els.libraryPanel?.classList.contains('show');
    els.libraryPanel?.classList.toggle('show', show);
    if (show) renderPromptLibrary();
  }

  // ==========================================================================
  // SECTION: 31.5 ASSET LIBRARY
  // ==========================================================================
  // 资产库：当前画布内的素材按文件夹整理。复用现有 dataUrl 引用，
  // 不复制图片数据；删除分组不会删除原节点。

  const ASSET_FOLDERS_KEY = `${STORE_KEY}_asset_folders`;
  const ASSET_TAGS_KEY = `${STORE_KEY}_asset_tags`;

  // 资产库会话态（不持久化到 state）
  const assetLib = {
    activeFolder: '__all__',  // '__all__' | '__uncat__' | folderId
    folders: [],
    tagsByNode: {}             // { nodeId: [tag1, tag2] }
  };

  async function loadAssetFolders() {
    try {
      const raw = localStorage.getItem(ASSET_FOLDERS_KEY);
      assetLib.folders = raw ? JSON.parse(raw) : [];
    } catch {
      assetLib.folders = [];
    }
    try {
      const raw = localStorage.getItem(ASSET_TAGS_KEY);
      assetLib.tagsByNode = raw ? JSON.parse(raw) : {};
    } catch {
      assetLib.tagsByNode = {};
    }
  }

  async function saveAssetFolders() {
    localStorage.setItem(ASSET_FOLDERS_KEY, JSON.stringify(assetLib.folders));
  }

  async function saveAssetTags() {
    localStorage.setItem(ASSET_TAGS_KEY, JSON.stringify(assetLib.tagsByNode));
  }

  function uid4() {
    return 'f_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  function getNodeFolder(node) {
    return node.folder || '';
  }

  function setNodeFolder(nodeId, folderId) {
    const node = getNode(nodeId);
    if (!node) return;
    node.folder = folderId || '';
    saveWorkspace();
    renderAssetLibrary();
  }

  function getNodeTags(nodeId) {
    return assetLib.tagsByNode[nodeId] || [];
  }

  // 当前画布中所有可作为素材的节点（图、生图、分层）
  function getAssetNodes() {
    return state.nodes.filter(n =>
      (n.type === 'image' && n.image) ||
      (n.type === 'generate' && (n.output || getActiveGenerateVersion(n)?.image)) ||
      (n.type === 'sketch' && getSketchImage(n))
    );
  }

  function getAssetNodeImage(node) {
    if (node.type === 'image') return node.image;
    if (node.type === 'generate') {
      return node.output || getActiveGenerateVersion(node)?.image || '';
    }
    if (node.type === 'sketch') return getSketchImage(node) || '';
    return '';
  }

  function getAssetNodeTypeLabel(node) {
    if (node.type === 'image') return '本地图';
    if (node.type === 'generate') return '生图';
    if (node.type === 'sketch') return '分层';
    return node.type;
  }

  function getAssetNodeTitle(node) {
    return node.title || node.alias || node.id.slice(-6);
  }

  // 计算每个文件夹/分组的素材数量
  function countAssetsByFolder() {
    const counts = { __all__: 0, __uncat__: 0 };
    for (const f of assetLib.folders) counts[f.id] = 0;
    for (const n of getAssetNodes()) {
      counts.__all__++;
      const f = getNodeFolder(n);
      if (!f) counts.__uncat__++;
      else if (counts[f] !== undefined) counts[f]++;
    }
    return counts;
  }

  function renderAssetFolders() {
    if (!els.assetFolderList) return;
    const counts = countAssetsByFolder();
    const folders = assetLib.folders;

    const folderItem = (f) => `
      <div class="v2-asset-folder ${assetLib.activeFolder === f.id ? 'active' : ''}" data-folder="${f.id}">
        <span class="icon">${escapeHtml(f.icon || '📁')}</span>
        <span class="name">${escapeHtml(f.name)}</span>
        <span class="count">${counts[f.id] || 0}</span>
        <button class="del" data-del-folder="${f.id}" title="删除分组（不会删除素材）">×</button>
      </div>
    `;

    els.assetFolderList.innerHTML = `
      <div class="v2-asset-folder ${assetLib.activeFolder === '__all__' ? 'active' : ''}" data-folder="__all__">
        <span class="icon">🗂</span>
        <span class="name">全部素材</span>
        <span class="count">${counts.__all__ || 0}</span>
      </div>
      <div class="v2-asset-folder ${assetLib.activeFolder === '__uncat__' ? 'active' : ''}" data-folder="__uncat__">
        <span class="icon">📦</span>
        <span class="name">未分组</span>
        <span class="count">${counts.__uncat__ || 0}</span>
      </div>
      <div style="height:8px;border-top:1px solid rgba(255,255,255,0.06);margin:6px 0;"></div>
      ${folders.map(folderItem).join('')}
    `;

    // 绑定点击
    els.assetFolderList.querySelectorAll('.v2-asset-folder').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target.closest('.del')) return;
        assetLib.activeFolder = el.dataset.folder;
        renderAssetFolders();
        renderAssetGrid();
      });
    });

    // 绑定删除按钮
    els.assetFolderList.querySelectorAll('[data-del-folder]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const fid = btn.dataset.delFolder;
        const folder = assetLib.folders.find(f => f.id === fid);
        if (!folder) return;
        if (!confirm(`删除分组"${folder.name}"？\n\n分组里的素材会变为"未分组"状态，不会删除原图片。`)) return;
        // 把该分组里的素材改为未分组
        for (const n of getAssetNodes()) {
          if (getNodeFolder(n) === fid) n.folder = '';
        }
        assetLib.folders = assetLib.folders.filter(f => f.id !== fid);
        if (assetLib.activeFolder === fid) assetLib.activeFolder = '__all__';
        saveAssetFolders();
        saveWorkspace();
        renderAssetLibrary();
        toast('分组已删除，素材已移到"未分组"', 'success');
      });
    });

    // 绑定文件夹的拖拽接收
    els.assetFolderList.querySelectorAll('.v2-asset-folder').forEach(el => {
      el.addEventListener('dragover', (e) => {
        if (e.dataTransfer.types.includes('application/x-v2-node-id')) {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          el.classList.add('drag-over');
        }
      });
      el.addEventListener('dragleave', () => el.classList.remove('drag-over'));
      el.addEventListener('drop', (e) => {
        e.preventDefault();
        el.classList.remove('drag-over');
        const nodeId = e.dataTransfer.getData('application/x-v2-node-id');
        if (!nodeId) return;
        const fid = el.dataset.folder;
        if (fid === '__all__') {
          setNodeFolder(nodeId, '');
        } else if (fid === '__uncat__') {
          setNodeFolder(nodeId, '');
        } else {
          setNodeFolder(nodeId, fid);
        }
      });
    });
  }

  function renderAssetGrid() {
    if (!els.assetGrid) return;
    const all = getAssetNodes();
    const keyword = (els.assetSearch?.value || '').trim().toLowerCase();

    let list = all;
    if (assetLib.activeFolder === '__uncat__') {
      list = list.filter(n => !getNodeFolder(n));
    } else if (assetLib.activeFolder !== '__all__') {
      list = list.filter(n => getNodeFolder(n) === assetLib.activeFolder);
    }

    if (keyword) {
      list = list.filter(n => {
        const title = getAssetNodeTitle(n).toLowerCase();
        const tags = (assetLib.tagsByNode[n.id] || []).join(' ').toLowerCase();
        return title.includes(keyword) || tags.includes(keyword);
      });
    }

    if (!list.length) {
      els.assetGrid.innerHTML = `<div class="v2-asset-empty">${all.length === 0 ? '画布中还没有可整理的素材' : '该分组下没有素材'}</div>`;
      return;
    }

    els.assetGrid.innerHTML = list.map(n => {
      const img = getAssetNodeImage(n);
      const title = getAssetNodeTitle(n);
      const typeLabel = getAssetNodeTypeLabel(n);
      const folder = assetLib.folders.find(f => f.id === getNodeFolder(n));
      const folderBadge = folder ? `<span class="badge">${escapeHtml(folder.icon || '📁')} ${escapeHtml(folder.name)}</span>` : '';
      return `
        <div class="v2-asset-card" data-node="${n.id}" draggable="true" title="${escapeHtml(title)}">
          <img src="${img}" alt="${escapeHtml(title)}" loading="lazy" />
          ${folderBadge}
          <button class="remove" data-remove="${n.id}" title="从资产库移除（不会删除节点）">×</button>
          <div class="meta">
            <span class="type">${typeLabel}</span>
            <span class="title">${escapeHtml(title.slice(0, 10))}</span>
          </div>
        </div>
      `;
    }).join('');

    // 拖拽节点到画布生成引用
    els.assetGrid.querySelectorAll('.v2-asset-card').forEach(card => {
      card.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('application/x-v2-asset-node', card.dataset.node);
      });
      card.addEventListener('click', (e) => {
        if (e.target.closest('.remove')) return;
        // 选中画布上对应节点并居中
        const nodeId = card.dataset.node;
        const node = getNode(nodeId);
        if (node) {
          state.selectedId = nodeId;
          state.selectedIds = [nodeId];
          renderSelection();
          if (typeof focusNodeById === 'function') focusNodeById(nodeId, { center: true });
        }
      });
    });

    // 移除（清除 folder）
    els.assetGrid.querySelectorAll('[data-remove]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const nodeId = btn.dataset.remove;
        setNodeFolder(nodeId, '');
        toast('已从当前分组移除（节点未删除）', 'success');
      });
    });
  }

  function renderAssetLibrary() {
    if (!els.assetPanel) return;
    renderAssetFolders();
    renderAssetGrid();
    const total = getAssetNodes().length;
    if (els.assetCount) els.assetCount.textContent = total + ' 个素材';
  }

  function toggleAssetLibrary(force) {
    const show = typeof force === 'boolean' ? force : !els.assetPanel?.classList.contains('show');
    els.assetPanel?.classList.toggle('show', show);
    if (show) renderAssetLibrary();
  }

  function openAssetFolderCreate() {
    const name = prompt('输入分组名称：', '新分组');
    if (!name || !name.trim()) return;
    const icon = prompt('输入分组图标（一个 emoji，可留空）：', '📁') || '📁';
    assetLib.folders.push({ id: uid4(), name: name.trim(), icon: icon.trim() || '📁' });
    saveAssetFolders();
    renderAssetLibrary();
    toast(`已创建分组"${name.trim()}"`, 'success');
  }

  // 让画布上的节点可被拖到资产库分组：拦截画布节点的 dragstart
  function setupCanvasNodeDragForAssets() {
    if (!els.world) return;
    els.world.addEventListener('dragstart', (e) => {
      const nodeEl = e.target.closest('.v2-node');
      if (!nodeEl) return;
      const nodeId = nodeEl.dataset.id;
      if (!nodeId) return;
      e.dataTransfer.setData('application/x-v2-node-id', nodeId);
    }, true);
  }

  function escapeHtml(str) {
    if (str == null) return '';
    return String(str).replace(/[&<>"']/g, ch => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[ch]));
  }

  // ==========================================================================
  // SECTION: 32 PROMPT-BUILD
  // ==========================================================================
  function buildCompiledPrompt(node, refs) {
    normalizeGenerateReferenceMode(node);
    const rawPrompt = getGeneratePromptText(node);
    if (shouldUseDirectTryOnInputs(rawPrompt, node)) {
      const images = (refs.images || []).filter(ref => ref?.image);
      const compiled = {
        prompt: sanitizeProductNoise(stripWorkflowPromptLabels(rawPrompt)),
        imageRoles: images.map((ref, index) => {
          const isGarment = node?.settings?.tryOnStep === 'compose' && index === 1;
          return {
            id: ref.id,
            alias: ref.alias || ref.title || ('图' + (index + 1)),
            role: index === 0 ? 'subject' : 'support',
            label: index === 0 ? '主图' : (isGarment ? '穿搭辅助图' : '辅助图'),
            channel: 'image',
            roleOrder: index
          };
        }),
        requestImages: images,
        referenceMode: 'direct',
        roleHints: new Map(),
        warnings: []
      };
      const regionPrompt = buildRegionPromptBlock(node, refs, compiled);
      if (regionPrompt) compiled.prompt = [compiled.prompt, regionPrompt].filter(Boolean).join('\n\n');
      return compiled;
    }
    const compiled = PromptEngine.compileGeneratePrompt({
      rawPrompt,
      images: refs.images,
      details: refs.details,
      textSkeletons: refs.texts,
      sketches: refs.sketches,
      settings: {
        ...(node.settings || {}),
        taskType: refs.textInputs.some(item => item.taskType === 'compose-subject-reference')
          ? 'compose-subject-reference'
          : ''
      }
    });
    const regionPrompt = buildRegionPromptBlock(node, refs, compiled);
    if (regionPrompt) compiled.prompt = [compiled.prompt, regionPrompt].filter(Boolean).join('\n\n');
    const detailPriority = buildDetailPriorityBlock(refs.details);
    if (detailPriority) compiled.prompt = [compiled.prompt, detailPriority].filter(Boolean).join('\n\n');
    return compiled;
  }

  function buildPrompt(node, refs) {
    return buildCompiledPrompt(node, refs).prompt;
  }

  function getImageRoleInfos(node, refs) {
    return new Map(buildCompiledPrompt(node, refs).imageRoles.map(info => [info.id, info]));
  }

  function getImagesForGenerateRequest(node, refs) {
    return buildCompiledPrompt(node, refs).requestImages;
  }

  function mergeRefsById(...groups) {
    const map = new Map();
    groups.flat().forEach(ref => {
      if (ref?.id && !map.has(ref.id)) map.set(ref.id, ref);
    });
    return [...map.values()];
  }

  function getFocusPromptImageRefs(node, refs = collectRefsForNode(node)) {
    const region = getRegionEditState(node);
    if (!region.prompt) return [];
    const connected = refs.images || [];
    const connectedById = new Map(connected.map(ref => [ref.id, ref]));
    const ids = getReferencedConnectedImageIds(region.prompt, connected);
    return [...ids].map(id => connectedById.get(id)).filter(Boolean);
  }

  function parseImageRoleHints(text, images) {
    return PromptEngine.parseImageRoleHints(text, images);
  }

  function inferImageRole(images, index) {
    return PromptEngine.inferImageRole(images, index);
  }

  function resolveImageRole(images, index, roleHints) {
    return PromptEngine.resolveImageRole(images, index, roleHints);
  }

  function normalizeGeneratePrompt(text) {
    return PromptEngine.normalizeGeneratePrompt(text);
  }

  function buildRegionPromptBlock(node, refs, compiled) {
    const subjectRef = getCompiledSubjectRef(refs.images, compiled, node);
    const region = getValidRegionEdit(node, subjectRef);
    if (!region) return '';
    const focusRefs = getFocusPromptImageRefs(node, refs);
    const focusRefText = focusRefs.length
      ? `聚焦参考图：${focusRefs.map(ref => '@' + (ref.alias || ref.title || '图片')).join('、')}，仅用于补充框内细节，不改变框外主体。`
      : '';
    return [
      '【聚焦区域】',
      `已提供 mask：白色区域是 @${region.sourceAlias || subjectRef.alias || '主图'} 上的聚焦区域，黑色区域必须尽量保持不变。`,
      '只修改 mask 白色区域，框外尽量保持不变。',
      region.prompt ? `聚焦提示词：${sanitizeProductNoise(region.prompt)}` : '聚焦提示词：只按主提示词修改 mask 白色区域，框外保持不变。',
      focusRefText,
      '不要把参考图的旧主体、旧品牌、旧文案或旧参数带入框外区域。'
    ].filter(Boolean).join('\n');
  }

  function isBatchPerInputRequested(prompt, count, requestImages = [], compiled = null) {
    if (count < 2 || requestImages.length < 2) return false;
    const text = String(prompt || '');
    if (/(每张|各自|分别|逐张|一张一张|全部|这[两二四]张|[两二四2-4]张图|[两二四2-4]个图|改[两二四2-4]张|优化[两二四2-4]张)/i.test(text)) return true;
    const roles = new Map((compiled?.imageRoles || []).map(item => [item.id, item.role]));
    const editable = requestImages.filter(ref => {
      const role = roles.get(ref.id) || '';
      return !isSketchReference(ref) && role !== 'reference';
    });
    return editable.length >= count && !/(合成|拼接|组合|同一画面|一张海报|海报|版式|参考图|样式)/i.test(text);
  }

  function getBatchInputRefs(node, refs, compiled, count) {
    const requestIds = new Set((compiled?.requestImages || []).map(ref => ref.id));
    const roles = new Map((compiled?.imageRoles || []).map(item => [item.id, item.role]));
    return (refs.images || [])
      .filter(ref => requestIds.has(ref.id))
      .filter(ref => !isSketchReference(ref))
      .filter(ref => roles.get(ref.id) !== 'reference')
      .slice(0, count);
  }

  function buildBatchSubjectPrompt(prompt, subjectRef, index, total) {
    const alias = subjectRef?.alias || subjectRef?.title || `图${index + 1}`;
    return [
      prompt,
      [
        '【批量单图处理】',
        `本次只处理 @${alias} 这一张输入图，这是第 ${index + 1}/${total} 张。`,
        '输出它自己的独立优化版；不要把其他待改主体图合成到同一画面，不要让其他待改主体图进入最终画面。',
        '如果另有参考图或分层渲染输入，只作为版式、风格、局部约束或结构引导。'
      ].join('\n')
    ].filter(Boolean).join('\n\n');
  }

  // ==========================================================================
  // SECTION: 33 CHAT
  // ==========================================================================
  function normalizeChatMessages(messages = []) {
    if (!Array.isArray(messages)) return [];
    return messages
      .map(item => ({
        role: item?.role === 'assistant' ? 'assistant' : 'user',
        content: String(item?.content || '').trim(),
        createdAt: Number(item?.createdAt) || Date.now(),
        feedbackSource: item?.feedbackSource && typeof item.feedbackSource === 'object'
          ? {
            nodeId: String(item.feedbackSource.nodeId || ''),
            versionId: String(item.feedbackSource.versionId || ''),
            versionLabel: String(item.feedbackSource.versionLabel || ''),
            mode: item.feedbackSource.mode === 'region' ? 'region' : 'full',
            cinemaMode: Boolean(item.feedbackSource.cinemaMode),
            feedbackText: String(item.feedbackSource.feedbackText || ''),
            prompt: item.feedbackSource.cinemaMode
              ? sanitizeCinemaFinalPrompt(item.feedbackSource.prompt || '')
              : sanitizeProductNoise(item.feedbackSource.prompt || '')
          }
          : null
      }))
      .filter(item => item.content);
  }

  function normalizeChatMessagesForRender(messages = []) {
    return normalizeChatMessages(messages).filter(item => item.content || item.role === 'assistant');
  }

  function hydrateAssistantMessageAt(index, patch = {}) {
    const assistant = getAssistantState();
    const raw = Array.isArray(assistant.messages) ? assistant.messages : [];
    const current = raw[index] || { role: 'assistant', content: '', createdAt: Date.now() };
    raw[index] = {
      ...current,
      ...patch,
      role: patch.role || current.role || 'assistant',
      content: String(patch.content ?? current.content ?? ''),
      createdAt: Number(patch.createdAt || current.createdAt) || Date.now()
    };
    assistant.messages = raw;
    return raw[index];
  }

  function getLatestUserMessageContent(messages = []) {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (messages[i]?.role !== 'assistant') return messages[i].content || '';
    }
    return '';
  }

  function isContinuationEditRequest(text) {
    const value = String(text || '').trim();
    if (!value) return false;
    return /(?:再|另|重新|继续).{0,8}(?:来|出|给|做|写|生成).{0,8}(?:一版|一稿|一条|一个|一张)|基于.{0,10}(?:这版|上一版|刚才|前面|原来|当前)|(?:按|照).{0,8}(?:这版|上一版|刚才|前面|原来|当前).{0,8}(?:改|调|优化|修改)|(?:这版|上一版|刚才|前面|原来|当前).{0,12}(?:改|调|优化|修改|不行|不好)|继续(?:改|优化|调整|往下|出|给|做|写|生成)|保持.{0,8}(?:上一版|这版|原提示词|原来的提示词)|在.{0,8}(?:提示词|prompt).{0,10}(?:上|基础).{0,8}(?:改|调|优化|修改)/i.test(value);
  }

  function shouldCarryChatHistoryForDraft(draft, refs) {
    if (!refs?.scoped) return true;
    return isContinuationEditRequest(draft);
  }

  function formatChatTime(value) {
    const time = Number(value) || Date.now();
    return new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function extractAdoptablePrompt(text) {
    const value = sanitizeProductNoise(text);
    const fenced = value.match(/```(?:[a-zA-Z]+)?\s*([\s\S]*?)```/);
    const candidate = (fenced ? fenced[1] : value).trim();
    const lines = candidate.split('\n').map(line => line.trim()).filter(Boolean);
    const start = lines.findIndex(line => CHAT_PROMPT_HEADING_RE.test(line));
    if (start >= 0) {
      const first = lines[start].replace(CHAT_PROMPT_HEADING_RE, '').trim();
      const collected = first ? [first] : [];
      for (let i = start + 1; i < lines.length; i += 1) {
        if (CHAT_BLOCK_STOP_RE.test(lines[i]) && !CHAT_PROMPT_HEADING_RE.test(lines[i])) break;
        collected.push(lines[i]);
      }
      const prompt = collected.join('\n').trim();
      if (prompt) return prompt;
    }
    return '';
  }

  function extractLayoutGuidanceText(text) {
    const value = sanitizeProductNoise(text);
    const fenced = value.match(/```(?:[a-zA-Z]+)?\s*([\s\S]*?)```/);
    const candidate = (fenced ? fenced[1] : value).trim();
    const lines = candidate.split('\n').map(line => line.trim()).filter(Boolean);
    const blocks = [];
    for (let i = 0; i < lines.length; i += 1) {
      if (!CHAT_LAYOUT_HEADING_RE.test(lines[i])) continue;
      const first = lines[i].replace(CHAT_LAYOUT_HEADING_RE, '').trim();
      const collected = first ? [first] : [];
      for (let j = i + 1; j < lines.length; j += 1) {
        if (CHAT_BLOCK_STOP_RE.test(lines[j]) && !CHAT_LAYOUT_HEADING_RE.test(lines[j])) break;
        collected.push(lines[j]);
        i = j;
      }
      const block = cleanPromptBody(collected.join('\n'));
      if (block) blocks.push(block);
    }
    return Array.from(new Set(blocks)).join('\n\n');
  }

  function extractAssistantPlanText(text) {
    const value = sanitizeProductNoise(text || '').trim();
    if (!value) return '';
    const fenced = value.match(/```(?:json|text|markdown|md)?\s*([\s\S]*?)```/i);
    return cleanPromptBody(fenced ? fenced[1] : value) || value;
  }

  function mergeAssistantLayoutGuidance(prompt, layoutGuidance) {
    const body = cleanPromptBody(prompt);
    const guidance = cleanPromptBody(layoutGuidance);
    if (!body || !guidance) return body;
    if (body.includes(guidance)) return body;
    return [
      body,
      [
        '参考图版式补充：',
        guidance,
        '以上版式补充与反推骨架同优先级执行，只约束外框纵横比、圆角边框、内边距、上/中/下版块高度、模块网格、窗口宽高与倾斜角、分隔线、对齐方式、空间比例、图文关系和阅读路径；不得继承参考图旧主体、旧品牌、旧型号、旧价格、旧文案或旧 logo。'
      ].join('\n')
    ].join('\n\n');
  }

  function summarizeRefsForAssistant(refs = {}) {
    const images = Array.isArray(refs.images) ? refs.images : [];
    const roleRefs = getDetailPageImageRoleRefs({ images });
    const textInputs = Array.isArray(refs.textInputs) ? refs.textInputs : [];
    const directCinemaInputs = Array.isArray(refs.cinemaInputs) ? refs.cinemaInputs : [];
    const cinemaInputs = mergeTextInputsById([...directCinemaInputs, ...textInputs.filter(item => isCinemaTextInput(item))]);
    return {
      subjectImages: roleRefs.subject ? [roleRefs.subject] : images.filter(ref => !isSketchReference(ref)).slice(0, 1),
      referenceImages: roleRefs.references || [],
      details: Array.isArray(refs.details) ? refs.details : [],
      textInputs,
      cinemaInputs
    };
  }

  function mergeTextInputsById(items = []) {
    const map = new Map();
    items.forEach(item => {
      if (!item) return;
      const id = String(item.id || `${item.kind || item.taskType || 'text'}:${map.size}`);
      if (!map.has(id)) map.set(id, item);
    });
    return Array.from(map.values());
  }

  function collectCinemaAncestors(node, seen = new Set()) {
    if (!node || seen.has(node.id)) return [];
    const nextSeen = new Set(seen);
    nextSeen.add(node.id);
    const found = [];
    state.connections
      .filter(conn => conn.to === node.id)
      .map(conn => getNode(conn.from))
      .filter(Boolean)
      .forEach(source => {
        if (source.type === 'cinema') {
          const input = cinemaNodeToTextInput(source);
          if (input) found.push(input);
        }
        collectCinemaAncestors(source, nextSeen).forEach(input => found.push(input));
      });
    return mergeTextInputsById(found);
  }

  function buildGenerateFeedbackContext(feedbackText = '') {
    const node = getExplicitSelectedGenerateNode();
    const activeVersion = node ? getActiveGenerateVersion(node) : null;
    if (!node || !activeVersion?.image) return null;
    const resultRegion = getValidResultRegionEdit(node, activeVersion);
    const refs = collectRefsForNode(node);
    refs.cinemaInputs = collectCinemaAncestors(node);
    return {
      nodeId: node.id,
      versionId: activeVersion.id,
      versionLabel: activeVersion.label || '',
      image: activeVersion.image,
      rawPrompt: activeVersion.rawPrompt || getGeneratePromptText(node),
      finalPrompt: activeVersion.prompt || buildPrompt(node, refs),
      currentPrompt: getGeneratePromptText(node),
      settings: cloneGenerateSettings(activeVersion.settings || node.settings || {}),
      upstream: summarizeRefsForAssistant(refs),
      feedbackText: String(feedbackText || '').trim(),
      mode: resultRegion ? 'region' : 'full',
      region: resultRegion ? { source: 'generated-version', rect: resultRegion.rect } : null
    };
  }

  function textSuggestsLocalEdit(text) {
    return /只改这里|改这里|这个区域|框内|局部|局部改|选区|mask|遮罩|这里/i.test(String(text || ''));
  }

  function textSuggestsFullEdit(text) {
    return /整体|全图|整图|全局|整套|整体更|全图更/i.test(String(text || ''));
  }

  function formatFeedbackContextPrompt(context) {
    if (!context) return '';
    const subjectAliases = context.upstream.subjectImages.map(ref => '@' + (ref.alias || ref.title || '主图')).join('、') || '无';
    const referenceAliases = context.upstream.referenceImages.map(ref => '@' + (ref.alias || ref.title || '参考图')).join('、') || '无';
    const details = context.upstream.details.map(item => item.text).filter(Boolean).join('\n\n') || '无';
    const cinemaInputs = Array.isArray(context.upstream.cinemaInputs) ? context.upstream.cinemaInputs : [];
    const cinemaBlocks = cinemaInputs.map(item => {
      const fields = item.structuredFields && typeof item.structuredFields === 'object'
        ? Object.entries(item.structuredFields).filter(([, value]) => String(value || '').trim()).map(([key, value]) => `${key}：${value}`).join('\n')
        : '';
      return [
        `电影节点：${item.title || '电影'}`,
        `规则来源：${item.sourceVersion || CINEMA_SOURCE_VERSION}`,
        `最终电影提示词：\n${item.imagePrompt || item.rawText || '无'}`,
        fields ? `电影节点内部决策摘要：\n${fields}` : '',
        item.revisionSummary ? `电影节点修改摘要：${item.revisionSummary}` : '',
        Array.isArray(item.selfCheck) && item.selfCheck.length ? `电影节点自检：\n${item.selfCheck.join('\n')}` : ''
      ].filter(Boolean).join('\n');
    }).filter(Boolean).join('\n\n');
    const skeletons = context.upstream.textInputs
      .filter(item => !isCinemaTextInput(item))
      .map(item => item.imagePrompt || item.rawText)
      .filter(Boolean)
      .join('\n\n') || '无';
      const cinemaModeRule = cinemaBlocks
      ? [
        '【电影节点 v5 续改模式】',
        '当前 Generate 的上游包含电影节点。你必须把后续修改当作 Quill_GPT 电影感提示词 v5.0 的续改，而不是普通生图提示词改写。',
        '同时启用 v4 反 AI / 实拍压制模块：v5 做导演判断，v4 只负责压住 AI 味、游戏 CG 感、概念图味、过锐、HDR、死黑、脏灰、假质感和过度细节。',
        '续改时必须继承电影节点的最终提示词、镜头判断、光线判断、色彩体系、空间层级、细节控制、避免项和自检方向。',
        '续改时必须检查“正在发生的事件/动作/展示目的”是否成立，以及真实相机感是否成立；新版提示词第一段要保留或补足主体、事件目的和镜头视角。',
        '最终可写回 Generate 的提示词只能使用正向摄影语言，不得把 CG、HDR、游戏感、概念图、塑料感、死黑、过度锐化等内部负面词写进最终提示词。',
        '只根据当前生成结果的问题和用户反馈做相关修复；不要退化成普通商业海报、普通广告图或泛泛的“高级感”提示词。',
        '如果用户反馈是太暗、主体不突出、脸假、太灰、太锐、暗部死黑、画面脏、镜头不对、商品不清楚等，按 v5 修复逻辑只改对应维度。',
        CINEMA_ANTI_AI_SUPPRESSION_RULES,
        cinemaBlocks
      ].join('\n\n')
      : '';
    const localWarning = context.mode === 'full' && textSuggestsLocalEdit(context.feedbackText)
      ? '用户像是在要求局部修改，但当前没有结果框选。你必须先建议用户在当前生成结果上点击“结果框选”并框出区域；不要直接输出局部编辑提示词。'
      : '';
    const fullWarning = context.mode === 'region' && textSuggestsFullEdit(context.feedbackText)
      ? '当前已有结果框选，但用户像是在要求整体/全图修改。你必须提醒当前会按框选局部处理；如果要整图续改，应先清除结果框选。'
      : '';
    return [
      '【生成结果续改模式】',
      `当前目标：Generate 节点 ${context.nodeId} 的当前选中版本 ${context.versionLabel || context.versionId}。`,
      `续改模式：${context.mode === 'region' ? '局部续改' : '整图续改'}。`,
      '你必须同时使用三项输入：1）随本轮消息一起提供的“当前选中生成版本”图片；2）用户本轮修改意见；3）上一版提示词 rawPrompt/finalPrompt。三者缺一不可。',
      '上一版提示词是修改基准：先对照它判断哪些描述已经生成对了、哪些描述导致了当前图片问题，再输出优化后的下一版提示词；不要脱离上一版提示词另起炉灶。',
      '优化目标是“针对这张生成结果图”的下一版提示词：保留图中已经正确的主体、构图、镜头、光影和氛围，只修正用户指出的问题以及你从当前结果图中看到的相关缺陷。',
      '如果当前生成结果图不可见或无法判断，应明确要求用户重新选择/提供生成结果图，不要假装已经看过图片。',
      '不要重写成完全无关的新方向。',
      '输出必须包含“提示词：”段落，正文可直接写回当前 Generate 节点。',
      '不要自动生成图片；只给新版提示词。',
      context.mode === 'region'
        ? '局部续改规则：当前版本图会作为 /v1/images/edits 输入，并附带 mask；提示词必须明确“只修改 mask 白色区域，框外尽量保持不变”。'
        : '整图续改规则：按整张图优化提示词，保持原主体、主参考版式和商业目标，不要漂移成新主题。',
      cinemaModeRule,
      localWarning,
      fullWarning,
      `用户本轮反馈：${context.feedbackText || '无'}`,
      `上游主图：${subjectAliases}`,
      `上游参考图：${referenceAliases}`,
      `当前 Generate 文本提示词：\n${context.currentPrompt || '无'}`,
      `当前版本原始提示词 rawPrompt：\n${context.rawPrompt || '无'}`,
      `当前版本实际生成提示词 finalPrompt：\n${context.finalPrompt || '无'}`,
      `当前生成参数：${JSON.stringify(context.settings || {})}`,
      `上游产品资料：\n${details}`,
      `上游反推/智能体骨架：\n${skeletons}`,
      cinemaBlocks
        ? '来源优先级：主图和产品资料决定主体事实；电影节点决定镜头、光影、色彩、电影氛围、画面卫生和自检逻辑；参考图和反推骨架决定版式风格；当前生成图用于判断哪里生成错了；用户反馈决定本轮修改目标。'
        : '来源优先级：主图和产品资料决定主体事实；参考图和反推骨架决定版式风格；当前生成图用于判断哪里生成错了；用户反馈决定本轮修改目标。',
      '如果输出局部续改提示词，必须包含“只修改 mask 白色区域，框外尽量保持不变”。'
    ].filter(Boolean).join('\n\n');
  }

  function classifyChatIntent(text) {
    const value = String(text || '').toLowerCase();
    const wantsNoPrompt = /不要.*提示词|不用.*提示词|不需要.*提示词|别.*提示词|只要.*(?:参数|资料|信息|规格|配置)|只(?:查|问|给|需要).*(?:参数|资料|信息|规格|配置)/i.test(value);
    const wantsNoDetail = /不要.*(?:参数|资料|产品资料|规格|配置)|不用.*(?:参数|资料|产品资料|规格|配置)|只要.*提示词|只(?:写|给|需要).*提示词/i.test(value);
    const asksFacts = /参数|规格|配置|资料|产品信息|卖点|价格|售价|续航|功率|扭矩|尺寸|电池|电机|马力|最高时速|top\s*speed|0\s*[-–]\s*100|百公里|制动|刹车|rpm|查一下|搜索|联网|官网|最新|准确/i.test(value);
    const asksPrompt = /提示词|prompt|生图|生成|做成|海报|套版|风格|感觉|参考图|主图|构图|画面|镜头|光影|版式|排版/i.test(value);
    const asksDetailPage = /淘宝详情页|详情页|详情图|详情长图|长图|多屏|分屏|整套详情|整套.*提示词|详情页.*提示词|详情图.*提示词|连续分图/i.test(value);
    if (asksDetailPage && !wantsNoPrompt) return 'detail-page';
    if (wantsNoPrompt || (asksFacts && !asksPrompt)) return 'facts';
    if (wantsNoDetail || (asksPrompt && !asksFacts)) return 'prompt';
    if (asksFacts && asksPrompt) return 'both';
    return 'chat';
  }

  function chatIntentLabel(intent) {
    if (intent === 'facts') return '参数/资料问答';
    if (intent === 'prompt') return '提示词生成';
    if (intent === 'detail-page') return '详情页方案';
    if (intent === 'both') return '资料 + 提示词';
    return '普通画布助手';
  }

  function chatIntentInstruction(intent) {
    if (intent === 'facts') {
      return [
        '本轮只回答用户要的参数、规格、资料或事实，不要输出“提示词：”段落，不要给生图描述。',
        '输出以“参数：”或“产品资料：”开头，内容可直接写入产品资料节点；不确定的字段可以基于可见信息合理推测并说明，不能编造具体数字、型号、价格或不可见参数。'
      ].join('\n');
    }
    if (intent === 'prompt') {
      return [
        '本轮只生成可用于 image2 的“提示词：”正文，除非用户明确要求资料，否则不要附加“产品资料：”段落。',
        '提示词必须基于当前主图、产品资料与反推骨架的事实；参考图只迁移视觉关系，不继承旧品牌、旧型号、旧参数、旧文案。',
        '如果用户要求模仿某张参考图的版式/排版/版型/构图，必须在“提示词：”后额外输出“版式描述：”段落；版式描述要写外框纵横比、圆角边框、内边距、上/中/下版块高度、窗口/卡片数量、宽高比例、倾斜方向、中心轴、主体区域和底部字标完整位置，不能只写风格相似。'
      ].join('\n');
    }
    if (intent === 'detail-page') {
      return [
        '本轮按“详情页方案”回答，不要只输出单张海报提示词。',
        '回复必须包含这些段落标题：商品类别判断：、全局视觉系统：、虚拟长图母版：、分屏方案：、跨屏衔接规则：。',
        '分屏方案必须给出 6-10 屏；每屏包含“第 N 屏 / 目的 / 产品出现方式 / 画面模块 / 提示词”。其中产品出现方式必须明确写：完整主体、局部特写、缩略辅助、组合陈列、场景出现，或本屏不出现完整主体。',
        '必须完整写完用户要求的屏数；如果用户说 8 张/8 屏，就必须输出第 1 屏到第 8 屏，不能停在第 7 屏。',
        '为避免截断，每屏控制在 120-180 字内；不要写长解释、不要重复全局规则、不要输出 markdown 表格。',
        '每屏提示词要能写入详情页节点作为整套方案；不要默认输出单个 Generate 的“提示词：”作为唯一结果。',
        DETAIL_PAGE_CATEGORY_RULES.join('\n')
      ].join('\n');
    }
    if (intent === 'both') {
      return [
        '本轮同时需要资料和提示词时，先输出“产品资料：”，再输出“提示词：”。',
        '资料段只写可确认事实；提示词段只写视觉生成描述和明确禁用项。',
        '如果用户要求模仿参考图版式/排版/版型/构图，再追加“版式描述：”段落，必须用几何比例描述参考图版型。'
      ].join('\n');
    }
    return [
      '先按用户本轮问题选择输出格式，不要固定两段。',
      '只有用户要生图/提示词时才输出“提示词：”；只有用户要参数/资料时才输出“参数：”或“产品资料：”。'
    ].join('\n');
  }

  function getChatMaxTokens(intent, feedbackContext = null) {
    if (feedbackContext) return 2200;
    if (intent === 'detail-page') return 4200;
    return 1800;
  }

  function buildChatSystemPrompt(refs, latestUserText = '', options = {}) {
    const intent = options.intent || classifyChatIntent(latestUserText);
    const carryingHistory = typeof options.carryingHistory === 'boolean' ? options.carryingHistory : !refs.scoped;
    const aliases = refs.images.map(ref => '@' + (ref.alias || ref.title || '图像')).join('、') || '无';
    const detailBlocks = refs.details.map(item => item.text).filter(Boolean).join('\n\n');
    const textBlocks = refs.textInputs?.map(item => item.imagePrompt || item.rawText).filter(Boolean).join('\n\n') || '';
    const scopeRule = refs.scoped
      ? (carryingHistory
        ? '本轮用户已明确 @ 图片且在续改上一版：历史对话只作为上一版提示词/用户修改意见参考；主体身份、品牌、车型、产品事实仍以本轮 @ 到的图片和当前画布资料为准。不要把历史里的旧主体名称自动套到新图片上。'
        : '本轮用户已明确 @ 图片：只允许使用本轮 @ 到的图片本身；忽略其他画布节点、旧生成结果、旧产品资料、旧反推结果和历史对话里的主体名称。不要按 @ 顺序固定主图/参考图，必须根据用户语义和图片内容判断角色；如果无法判断，就用“当前车/当前主体”等中性说法，不要套用旧品牌、旧车型或旧产品名。')
      : '用户未明确 @ 图片时，才可以参考当前画布可用上下文；如果上下文主体互相冲突，必须先说明无法确定，不要把某个旧主体当默认主体。';
    return [
      '你是 小马AI画布 的右侧智能体。你不再是画布节点，不参与连线；你负责读取当前画布上下文，并给出可写回产品资料或生图的内容。',
      `本轮识别意图：${chatIntentLabel(intent)}。`,
      scopeRule,
      chatIntentInstruction(intent),
      '产品资料和提示词可以融合输出，但要保留来源优先级：产品资料/参数负责当前主体事实、规格、卖点和禁用信息；提示词负责 image2 生图描述、构图、版式、光影、材质、文字层级、镜头和画面味道。',
      '版式模仿规则：当用户说“做成 @参考图 的感觉/样式/排版/版型/构图”时，先判断主图和参考图角色，再把参考图当版式模板。必须输出“版式描述：”段落，写清参考图可迁移的几何结构：画布纵横比、外框圆角和边距、上中下区域高度、窗口/卡片数量与排列顺序、每个窗口的宽高比例和倾斜角、主体放置区域、底部文字区位置和完整留白。不要只说“高端、极简、奢华、展厅级”。',
      '版式失败规避：参考图是竖向窄窗就写竖向窄窗，不能写成横向宽窗；参考图底部有大字标就明确要求完整显示，不能被主体或裁切遮挡；参考图有三块梯形窗就写三块梯形窗的相对宽度、间距和向下延伸比例。',
      intent === 'detail-page'
        ? '详情页入口规则：用户在 Agent 里要淘宝详情页/详情图/长图/多屏/分屏/整套详情页提示词时，默认输出整套详情页方案，可写入详情页节点或反推节点；不要退回单张海报提示词。'
        : '',
      '事实问答规则：如果用户明确问参数/规格/资料，优先使用连接的官网参数图、产品资料、反推骨架和画布可见文字；不要因为没有产品资料节点就把事实问答改成生图提示词。信息不足时可以基于可见内容合理推测，但要说明是推测，不要编造具体数字、型号、价格或不可见参数。',
      '如果用户说“@图2 做成 @图1 的样式”，把 @图2 当主图，把 @图1 当视觉参考；主体身份和可见外观以主图为准。',
      detailBlocks
        ? '已连接产品资料节点时，产品资料里的产品名称、品牌、品类、卖点、参数和文案是当前主体事实；“不要旧品牌/旧产品名”只用于排除参考图里的旧信息，不能删除产品资料节点品牌。'
        : '不要继承参考图里的旧品牌、旧产品名、旧参数、旧文案、价格、功效和不可见事实。',
      '避免写“不能出现任何品牌名/型号/产品名”这类会误杀当前产品资料节点的泛化禁令；应该写“不要继承参考图旧品牌、旧型号、旧文案”。',
      '不要输出 markdown 表格。不要要求用户再补充才给结果，除非完全没有可用信息。',
      `当前可用图片：${aliases}`,
      detailBlocks ? `画布产品资料：\n${detailBlocks}` : '没有产品资料节点时，生图提示词只能使用主图可见事实，不编造参数、功效、型号、价格。',
      textBlocks ? `画布反推/智能体结果：\n${textBlocks}` : ''
    ].join('\n');
  }

  function textTemplatePrompt(node, refs) {
    const roleInfos = getTextInputRoleInfos(node, refs.images);
    const taskType = getTextTaskType(roleInfos);
    return PromptEngine.buildReversePrompt({
      templateKey: getTextTemplateKey(node),
      detailBlocks: refs.details.map(item => item.text).filter(Boolean),
      imageAliases: refs.images.map(ref => ref.alias || ref.title || '图像'),
      imageRoles: roleInfos,
      taskType
    });
  }

  function buildCinemaPrompt(node, refs = collectRefsForNode(node)) {
    if (!window.CinemaPrompt) throw new Error('电影节点规则模块未加载');
    const settings = getCinemaSettings(node);
    const imageRoles = getCinemaImageRoles(node, refs);
    const bound = getCinemaBoundGenerate(node);
    const activeVersion = bound ? getActiveGenerateVersion(bound) : null;
    const textInputs = Array.isArray(refs.textInputs) ? [...refs.textInputs] : [];
    if (bound) {
      textInputs.push({
        id: `${bound.id}:cinema-bound-generate`,
        kind: 'cinema-bound-generate',
        taskType: 'generate-feedback',
        rawText: [
          `绑定生图节点：${bound.title || '电影生图'}`,
          `绑定生图当前文本：${getGeneratePromptText(bound) || '无'}`,
          activeVersion?.rawPrompt ? `当前版本 rawPrompt：${activeVersion.rawPrompt}` : '',
          activeVersion?.prompt ? `当前版本 finalPrompt：${activeVersion.prompt}` : '',
          activeVersion?.label ? `当前版本标签：${activeVersion.label}` : ''
        ].filter(Boolean).join('\n'),
        imagePrompt: [
          '电影节点续改必须观察绑定 Generate 当前选中版本图、用户本轮修改意见、上一版电影提示词和当前版本 rawPrompt/finalPrompt。',
          activeVersion?.image ? '当前绑定 Generate 已有版本图，本轮应基于实际生成结果修正提示词，不要另起炉灶。' : '当前绑定 Generate 尚无版本图，本轮按文字和上游图片生成首版或文本续改。'
        ].join('\n')
      });
    }
    return window.CinemaPrompt.buildUserPrompt({
      draft: node.draft || '',
      refs: { ...refs, textInputs },
      mode: settings.mode,
      imageRoles,
      previous: node.result ? {
        finalPrompt: node.result,
        structuredFields: settings.structuredFields,
        selfCheck: settings.selfCheck
      } : null
    });
  }

  function ensureCinemaBoundGenerate(node) {
    if (!node || node.type !== 'cinema') return null;
    const existing = getCinemaBoundGenerate(node);
    if (existing) return existing;
    const box = getNodeBox(node);
    const generate = createNodeObject('generate', {
      x: node.x + box.w + 90,
      y: node.y,
      title: '电影生图',
      text: cleanPromptBody(node.result || node.text || '') || DEFAULT_GENERATE_PROMPT,
      settings: {
        model: getSelectedImageModel(),
        referenceMode: DEFAULT_REFERENCE_MODE,
        size: '2304x960',
        ratio: '12:5',
        resolution: '2K',
        quality: 'high',
        n: 1
      }
    });
    state.nodes.push(generate);
    connectNodesSilently(node.id, generate.id);
    node.settings = {
      ...(node.settings || {}),
      cinema: { ...getCinemaSettings(node), boundGenerateId: generate.id }
    };
    return generate;
  }

  function applyCinemaPromptToBoundGenerate(node, bound, options = {}) {
    if (!node || !bound) return false;
    const prompt = sanitizeCinemaFinalPrompt(cleanPromptBody(node.result || node.text || ''));
    if (!prompt) return false;
    const active = getActiveGenerateVersion(bound);
    bound.text = mergeGeneratePromptWithAssistant(bound, prompt);
    bound.assistantSource = {
      id: node.id,
      messageIndex: -1,
      prompt,
      adoptedAt: Date.now(),
      feedbackText: String(node.draft || ''),
      sourceGenerateNodeId: bound.id,
      sourceVersionId: active?.id || '',
      mode: 'full',
      useCurrentVersionAsEditInput: Boolean(options.run && active?.image)
    };
    if (options.run && active?.image) {
      setGenerateRevisionEditInput(bound, {
        enabled: true,
        source: 'cinema',
        sourceNodeId: node.id,
        sourceVersionId: active.id,
        sourceVersionLabel: active.label || '',
        prompt,
        createdAt: Date.now()
      });
    } else if (!options.run) {
      clearGenerateRevisionEditInput(bound, 'cinema');
    }
    node.settings = {
      ...(node.settings || {}),
      cinema: {
        ...getCinemaSettings(node),
        boundGenerateId: bound.id,
        lastAppliedPrompt: prompt,
        lastAppliedAt: Date.now()
      }
    };
    return true;
  }

  async function retryCinemaBoundGenerate(id) {
    const node = getNode(id);
    if (!node || node.type !== 'cinema') return;
    const bound = getCinemaBoundGenerate(node);
    if (!bound) {
      toast('还没有绑定生图节点', 'error');
      return;
    }
    if (getGenerateRunState(bound.id)) {
      toast('绑定生图正在生成中', 'error');
      return;
    }
    const prompt = sanitizeCinemaFinalPrompt(cleanPromptBody(node.result || node.text || ''));
    if (!prompt) {
      toast('电影节点还没有可重试的提示词', 'error');
      return;
    }
    if (!generatePromptIncludesAssistantSource(bound, prompt)) {
      bound.text = mergeGeneratePromptWithAssistant(bound, prompt);
    }
    const active = getActiveGenerateVersion(bound);
    bound.assistantSource = normalizeGenerateAssistantSourceValue({
      ...(bound.assistantSource || {}),
      id: bound.assistantSource?.id || node.id,
      messageIndex: Number.isInteger(bound.assistantSource?.messageIndex) ? bound.assistantSource.messageIndex : -1,
      prompt,
      adoptedAt: bound.assistantSource?.adoptedAt || Date.now(),
      feedbackText: bound.assistantSource?.feedbackText || '',
      sourceGenerateNodeId: bound.assistantSource?.sourceGenerateNodeId || bound.id,
      sourceVersionId: bound.assistantSource?.sourceVersionId || active?.id || '',
      mode: bound.assistantSource?.mode || 'full',
      useCurrentVersionAsEditInput: Boolean(active?.image)
    });
    if (active?.image) {
      setGenerateRevisionEditInput(bound, {
        enabled: true,
        source: 'cinema',
        sourceNodeId: node.id,
        sourceVersionId: active.id,
        sourceVersionLabel: active.label || '',
        prompt,
        createdAt: Date.now()
      });
    }
    node.debug = '已使用当前电影提示词重试绑定生图';
    scheduleSaveWorkspace();
    render();
    toast('正在重试绑定生图，不重新优化提示词', 'success');
    await runGenerateNode(bound.id);
  }

  async function runCinemaNode(id, options = {}) {
    const node = getNode(id);
    if (!node || node.type !== 'cinema') return;
    const shouldRunGenerate = Boolean(options.runGenerate);
    const boundGenerate = shouldRunGenerate ? ensureCinemaBoundGenerate(node) : getCinemaBoundGenerate(node);
    const boundActive = boundGenerate ? getActiveGenerateVersion(boundGenerate) : null;
    const refs = collectRefsForNode(node);
    const visionImages = boundActive?.image
      ? mergeRefsById([{
        id: `${boundGenerate.id}:${boundActive.id}:cinema-current-version`,
        type: 'generate-version',
        alias: boundActive.label ? `当前${boundActive.label}` : '当前生成图',
        title: '绑定生图当前版本',
        image: boundActive.image
      }], refs.images)
      : refs.images;
    const cfg = getTextModelConfig(node);
    if (!cfg.apiKey || !cfg.modelId) {
      node.error = '请先在配置页设置反推/视觉文本模型';
      node.status = 'error';
      render();
      toast(node.error, 'error');
      return;
    }
    if (!window.CinemaPrompt) {
      node.error = '电影节点规则模块未加载';
      node.status = 'error';
      render();
      toast(node.error, 'error');
      return;
    }

    node.status = 'generating';
    node.error = '';
    if (shouldRunGenerate && boundGenerate) {
      node.debug = boundActive?.image ? '正在根据绑定生图当前版本续改提示词' : '正在生成提示词并准备绑定生图';
    }
    render();

    try {
      const settings = getCinemaSettings(node);
      const system = window.CinemaPrompt.buildSystemPrompt({ mode: settings.mode });
      const user = buildCinemaPrompt(node, refs);
      const result = await postVisionText(cfg, [system, user].join('\n\n'), visionImages);
      const parsed = window.CinemaPrompt.parseResult(result.text);
      const finalPrompt = sanitizeCinemaFinalPrompt(cleanPromptBody(parsed.finalPrompt));
      if (!finalPrompt) throw new Error('模型没有返回最终提示词');
      node.result = finalPrompt;
      node.text = finalPrompt;
      node.messages = [
        ...(Array.isArray(node.messages) ? node.messages : []),
        { role: 'user', content: node.draft || (refs.images.length ? '分析图片生成电影提示词' : '生成电影提示词'), createdAt: Date.now() },
        { role: 'assistant', content: finalPrompt, createdAt: Date.now() }
      ].slice(-12);
      node.settings = {
        ...(node.settings || {}),
        cinema: {
          ...settings,
          mode: parsed.mode || settings.mode,
          imageRoles: parsed.imageRoles.length
            ? mergeCinemaImageRoles(settings.imageRoles, parsed.imageRoles, refs.images)
            : getCinemaImageRoles(node, refs).map(item => ({ id: item.id, role: item.role })),
          structuredFields: parsed.structuredFields,
          selfCheck: parsed.selfCheck,
          revisionSummary: parsed.revisionSummary || (node.draft ? '已根据本轮要求更新电影提示词' : '已生成首版电影提示词'),
          sourceVersion: CINEMA_SOURCE_VERSION,
          raw: parsed.raw
        }
      };
      node.draft = '';
      node.status = 'done';
      node.debug = '电影提示词完成，用时 ' + result.elapsed + ' 秒';
      markUpstreamDirty(node.id);  // UI: cinema 节点出结果后，下游 generate 应标 dirty
      clearUpstreamDirty(node.id);  // UI: cinema 自身不再 dirty
      if (shouldRunGenerate) {
        const target = ensureCinemaBoundGenerate(node);
        if (applyCinemaPromptToBoundGenerate(node, target, { run: true })) {
          toast('电影提示词已写入绑定生图，准备生成', 'success');
          await runGenerateNode(target.id);
        } else {
          toast('电影提示词已生成，但没有可写入内容', 'error');
        }
      } else if (boundGenerate) {
        applyCinemaPromptToBoundGenerate(node, boundGenerate, { run: false });
        toast('电影提示词已更新并写入绑定生图', 'success');
      } else {
        toast('电影提示词已生成', 'success');
      }
    } catch (err) {
      node.status = 'error';
      node.error = getErrMsg(err);
      toast('电影节点失败：' + node.error, 'error');
      recordAppLog('error', {
        source: 'cinema',
        title: '电影节点生成失败',
        summary: node.error,
        detail: err?.stack || err?.message || String(err || ''),
        nodeId: node.id,
        nodeType: node.type
      });
    }
    render();
    scheduleSaveWorkspace();
  }

  function mergeCinemaImageRoles(existing = [], parsed = [], images = []) {
    const imageByAlias = new Map((images || []).map(ref => [String(ref.alias || ref.title || '').trim(), ref]));
    const imageIds = new Set((images || []).map(ref => ref.id));
    const merged = new Map((existing || []).filter(item => imageIds.has(item.id)).map(item => [item.id, { id: item.id, role: item.role }]));
    parsed.forEach(item => {
      const id = imageIds.has(item.id) ? item.id : imageByAlias.get(String(item.alias || '').trim())?.id;
      if (!id) return;
      merged.set(id, { id, role: window.CinemaPrompt?.normalizeRole?.(item.role) || item.role || 'style' });
    });
    return Array.from(merged.values());
  }

  function clearCinemaNode(id) {
    const node = getNode(id);
    if (!node || node.type !== 'cinema') return;
    node.messages = [];
    node.draft = '';
    node.result = '';
    node.text = '';
    node.error = '';
    node.status = 'idle';
    const settings = getCinemaSettings(node);
    node.settings = { ...(node.settings || {}), cinema: normalizeCinemaSettings({ mode: settings.mode, boundGenerateId: settings.boundGenerateId }) };
    scheduleSaveWorkspace();
    render();
  }

  // ==========================================================================
  // SECTION: 34 TEXT-RUN
  // ==========================================================================
  async function runTextNode(id) {
    const node = getNode(id);
    if (!node || node.type !== 'text') return;
    const refs = collectRefsForNode(node);
    const prompt = textTemplatePrompt(node, refs);
    if (!prompt) {
      toast('请先选择反推模板或连接参考图', 'error');
      return;
    }
    const cfg = getTextModelConfig(node);
    if (!cfg.apiKey || !cfg.modelId) {
      node.error = '请先在配置页设置反推/视觉文本模型';
      node.status = 'error';
      render();
      toast(node.error, 'error');
      return;
    }

    node.status = 'generating';
    node.error = '';
    render();

    try {
      const result = await postVisionText(cfg, prompt, refs.images);
      const parsed = PromptEngine.parseReverseResult(result.text);
      if (!parsed.parsed) {
        node.status = 'error';
        node.error = '反推失败：模型没有返回结构化 JSON，请重试';
        node.debug = '文本生成失败，用时 ' + result.elapsed + ' 秒，模型未返回可解析 JSON';
        toast(node.error, 'error');
        render();
        scheduleSaveWorkspace();
        return;
      }
      const roleInfos = getTextInputRoleInfos(node, refs.images);
      const inferredTaskType = getTextTaskType(roleInfos);
      node.promptSkeleton = {
        taskType: parsed.taskType || inferredTaskType,
        inputRoles: roleInfos.map(item => ({
          id: item.id,
          alias: item.alias,
          role: inferredTaskType === 'detail-page-framework' ? 'reference' : item.role
        })),
        subjectRefs: inferredTaskType === 'detail-page-framework'
          ? []
          : (parsed.subjectRefs || roleInfos.filter(item => item.role === 'subject').map(item => item.alias)),
        referenceRefs: parsed.referenceRefs || (inferredTaskType === 'detail-page-framework'
          ? roleInfos.map(item => item.alias)
          : roleInfos.filter(item => item.role === 'reference').map(item => item.alias)),
        subjectAnchors: parsed.subjectAnchors,
        styleSkeleton: parsed.styleSkeleton,
        referenceBlacklist: parsed.referenceBlacklist,
        finalPrompt: cleanPromptBody(parsed.finalPrompt),
        skeleton: parsed.styleSkeleton,
        blacklist: parsed.referenceBlacklist,
        raw: parsed.raw,
        parsed: parsed.parsed
      };
      node.result = cleanPromptBody(parsed.finalPrompt);
      node.text = node.result;
      node.input = '';
      node.status = 'done';
      node.debug = '反推完成，用时 ' + result.elapsed + ' 秒，已生成版式/风格骨架';
      markUpstreamDirty(node.id);  // UI: text 节点出结果后，下游应标 dirty
      clearUpstreamDirty(node.id);  // UI: text 自身不再 dirty
      toast('反推骨架已生成', 'success');
    } catch (err) {
      node.status = 'error';
      node.error = getErrMsg(err);
      toast('反推失败：' + node.error, 'error');
    }
    render();
    scheduleSaveWorkspace();
  }

  async function runGlobalChat() {
    const assistant = getAssistantState();
    const draft = String(assistant.draft || '').trim();
    if (!draft) {
      toast('请先输入问题', 'error');
      return;
    }
    const cfg = getTextModelConfig({ settings: { model: resolveAssistantTextModel() } });
    if (!cfg.apiKey || !cfg.modelId) {
      const message = !cfg.apiKey
        ? '请先在配置页设置反推/智能体文本模型的 API Key'
        : '请先在配置页检测并选择反推/智能体文本模型';
      setAssistantError(message);
      assistant.status = 'idle';
      renderAssistantPanel();
      toast(assistant.error, 'error');
      return;
    }
    const feedbackContext = buildGenerateFeedbackContext(draft);
    const refs = feedbackContext
      ? collectChatRefsForGenerateFeedback(feedbackContext)
      : filterChatRefsForDraft(collectGlobalChatRefs(), draft);
    assistant.messages = normalizeChatMessagesForRender(assistant.messages);
    assistant.messages.push({ role: 'user', content: draft, createdAt: Date.now() });
    const assistantIndex = assistant.messages.length;
    assistant.messages.push({
      role: 'assistant',
      content: '',
      createdAt: Date.now(),
      feedbackSource: feedbackContext ? {
        nodeId: feedbackContext.nodeId,
        versionId: feedbackContext.versionId,
        versionLabel: feedbackContext.versionLabel,
        mode: feedbackContext.mode,
        cinemaMode: Boolean(feedbackContext.upstream?.cinemaInputs?.length),
        feedbackText: draft,
        prompt: ''
      } : null
    });
    assistant.draft = '';
    assistant.status = 'generating';
    setAssistantError('');
    renderAssistantPanel();
    scrollChatLogToBottom(GLOBAL_CHAT_ID);

    try {
      const result = await postChatAdvisor(cfg, assistant, refs, {
        feedbackContext,
        onDelta(delta) {
          appendAssistantDraftDelta(assistantIndex, delta);
        }
      });
      const existing = assistant.messages[assistantIndex];
      const message = hydrateAssistantMessageAt(assistantIndex, {
        role: 'assistant',
        content: result.text || existing?.content || '',
        feedbackSource: existing?.feedbackSource || null
      });
      if (message) {
        if (message.feedbackSource) {
          const mergedPrompt = mergeAssistantLayoutGuidance(
            extractAdoptablePrompt(message.content),
            extractLayoutGuidanceText(message.content)
          );
          message.feedbackSource.prompt = message.feedbackSource.cinemaMode
            ? sanitizeCinemaFinalPrompt(mergedPrompt)
            : mergedPrompt;
        }
      }
      assistant.status = 'idle';
      toast('助手已回复', 'success');
    } catch (err) {
      assistant.status = 'idle';
      setAssistantError(getErrMsg(err));
      toast('助手失败：' + assistant.error, 'error');
    }
    renderAssistantPanel();
    scrollChatLogToBottom(GLOBAL_CHAT_ID);
    scheduleSaveWorkspace();
  }

  function appendAssistantDraftDelta(index, delta) {
    if (!delta) return;
    const current = getAssistantState().messages?.[index];
    if (current && current.role !== 'assistant') return;
    const next = String(current?.content || '') + delta;
    hydrateAssistantMessageAt(index, {
      role: 'assistant',
      content: next,
      feedbackSource: current?.feedbackSource || null
    });
    if (!updateAssistantMessageDom(index, next)) renderAssistantPanel();
    scrollChatLogToBottom(GLOBAL_CHAT_ID);
  }

  function collectChatRefsForGenerateFeedback(context) {
    const images = [];
    const addImage = ref => {
      if (!ref?.image || images.some(item => item.id === ref.id)) return;
      images.push(ref);
    };
    addImage({
      id: `${context.nodeId}:${context.versionId}`,
      type: 'generate-version',
      alias: context.versionLabel ? `当前生成${context.versionLabel}` : '当前生成图',
      title: '当前选中生成版本',
      image: context.image
    });
    context.upstream.subjectImages.forEach(addImage);
    context.upstream.referenceImages.forEach(addImage);
    return {
      images,
      details: context.upstream.details,
      textInputs: context.upstream.textInputs,
      scoped: true,
      feedbackContext: context
    };
  }

  function filterChatRefsForDraft(refs, draft) {
    const orderedReferencedIds = getReferencedImageIdsInOrder(draft, refs.images);
    if (!orderedReferencedIds.length) return refs;
    const referencedIds = new Set(orderedReferencedIds);
    return {
      ...refs,
      scoped: true,
      images: refs.images.filter(ref => referencedIds.has(ref.id)),
      details: [],
      textInputs: []
    };
  }

  async function adoptGlobalChatToGenerate(index, options = {}) {
    const assistant = getAssistantState();
    const messages = normalizeChatMessagesForRender(assistant.messages);
    const message = messages[index];
    if (!message || message.role !== 'assistant') {
      toast('只能采用 assistant 回复', 'error');
      return;
    }
    const rawPrompt = mergeAssistantLayoutGuidance(
      extractAdoptablePrompt(message.content),
      extractLayoutGuidanceText(message.content)
    );
    const prompt = message.feedbackSource?.cinemaMode
      ? sanitizeCinemaFinalPrompt(rawPrompt)
      : rawPrompt;
    if (!prompt) {
      toast('这条回复里没有可采用的提示词', 'error');
      return;
    }
    const target = getExplicitSelectedGenerateNode();
    if (!target) {
      toast('请先只选中一个生图节点', 'error');
      return;
    }
    target.text = mergeGeneratePromptWithAssistant(target, prompt);
    if (message.feedbackSource) {
      message.feedbackSource.prompt = prompt;
    }
    target.assistantSource = {
      id: GLOBAL_CHAT_ID,
      messageIndex: index,
      prompt,
      adoptedAt: Date.now(),
      feedbackText: message.feedbackSource?.feedbackText || '',
      sourceGenerateNodeId: message.feedbackSource?.nodeId || target.id,
      sourceVersionId: message.feedbackSource?.versionId || '',
      mode: message.feedbackSource?.mode || 'full',
      useCurrentVersionAsEditInput: Boolean(message.feedbackSource?.nodeId && options.run)
    };
    assistant.messages = messages;
    assistant.adoptedPrompt = prompt;
    assistant.adoptedMessageIndex = index;
    scheduleSaveWorkspace();
    render();
    toast('已写入选中生图', 'success');
    if (options.run) {
      ensureAudioUnlocked();
      await runGenerateNode(target.id);
    }
  }

  function adoptGlobalChatToDetail(index) {
    const assistant = getAssistantState();
    const messages = normalizeChatMessages(assistant.messages);
    const message = messages[index];
    if (!message || message.role !== 'assistant') {
      toast('只能采用 assistant 回复', 'error');
      return;
    }
    const detailText = extractDetailText(message.content);
    if (!detailText) {
      toast('这条回复里没有可写入的产品资料', 'error');
      return;
    }
    const target = getSelectedDetailNode();
    if (!target) {
      toast('请先选中一个产品资料节点', 'error');
      return;
    }
    const existing = String(target.detail?.text || '').trim();
    target.detail = { ...(target.detail || {}), text: [existing, detailText].filter(Boolean).join(existing ? '\n\n' : '') };
    assistant.messages = messages;
    scheduleSaveWorkspace();
    render();
    toast('已写入选中产品资料', 'success');
  }

  function adoptLatestGlobalChatToDetail() {
    const index = getLatestAssistantMessageIndex(normalizeChatMessages(getAssistantState().messages));
    if (index < 0) {
      toast('还没有 assistant 回复可采用', 'error');
      return;
    }
    adoptGlobalChatToDetail(index);
  }

  function adoptGlobalChatToText(index) {
    const assistant = getAssistantState();
    const messages = normalizeChatMessagesForRender(assistant.messages);
    const message = messages[index];
    if (!message || message.role !== 'assistant') {
      toast('只能采用 assistant 回复', 'error');
      return;
    }
    const target = getSelectedTextNode();
    if (!target) {
      toast('请先选中一个反推节点', 'error');
      return;
    }
    const text = extractAssistantPlanText(message.content);
    if (!text) {
      toast('这条回复没有可写入文本', 'error');
      return;
    }
    target.result = text;
    target.text = text;
    target.input = '';
    target.promptSkeleton = {
      taskType: 'detail-page-framework',
      inputRoles: [],
      subjectRefs: [],
      referenceRefs: [],
      subjectAnchors: {},
      styleSkeleton: { layoutTemplate: text },
      referenceBlacklist: [],
      finalPrompt: text,
      skeleton: { layoutTemplate: text },
      blacklist: [],
      raw: text,
      parsed: false,
      source: 'assistant'
    };
    const upstream = collectRefsForNode(target);
    const roleInfos = getTextInputRoleInfos(target, upstream.images);
    target.promptSkeleton.inputRoles = roleInfos.map(item => ({ id: item.id, alias: item.alias, role: 'reference' }));
    target.promptSkeleton.referenceRefs = roleInfos.map(item => item.alias);
    assistant.messages = messages;
    scheduleSaveWorkspace();
    render();
    toast('已写入选中反推节点', 'success');
  }

  function adoptGlobalChatToDetailPage(index) {
    const assistant = getAssistantState();
    const messages = normalizeChatMessagesForRender(assistant.messages);
    const message = messages[index];
    if (!message || message.role !== 'assistant') {
      toast('只能采用 assistant 回复', 'error');
      return;
    }
    const target = getSelectedDetailPageNode();
    if (!target) {
      toast('请先选中详情页节点', 'error');
      return;
    }
    const text = extractAssistantPlanText(message.content);
    if (!text) {
      toast('这条回复没有可写入详情页的方案', 'error');
      return;
    }
    target.settings = { ...(target.settings || {}) };
    target.settings.assistantPlan = {
      text,
      messageIndex: index,
      adoptedAt: Date.now()
    };
    target.debug = '已写入智能体详情页方案，生成详情页时会优先参考';
    target.error = '';
    assistant.messages = messages;
    scheduleSaveWorkspace();
    render();
    toast('已写入详情页节点', 'success');
  }

  function mergeGeneratePromptWithAssistant(node, prompt) {
    const base = getGeneratePromptText(node);
    const nextPrompt = cleanPromptBody(prompt);
    if (!base || LEGACY_GENERATE_PROMPTS.has(String(base || '').trim())) {
      return nextPrompt;
    }
    if (/提示词\s*[:：]/.test(base)) {
      return base.replace(/(提示词\s*[:：])[\s\S]*$/m, `$1${nextPrompt}`);
    }
    return nextPrompt;
  }

  function extractDetailText(text) {
    const value = sanitizeProductNoise(text);
    const fenced = value.match(/```(?:[a-zA-Z]+)?\s*([\s\S]*?)```/);
    const candidate = (fenced ? fenced[1] : value).trim();
    const lines = candidate.split('\n').map(line => line.trim()).filter(Boolean);
    const start = lines.findIndex(line => CHAT_DETAIL_HEADING_RE.test(line));
    if (start < 0) return '';
    const first = lines[start].replace(CHAT_DETAIL_HEADING_RE, '').trim();
    const collected = first ? [first] : [];
    for (let i = start + 1; i < lines.length; i += 1) {
      if (CHAT_BLOCK_STOP_RE.test(lines[i])) break;
      collected.push(lines[i]);
    }
    const detail = collected.join('\n').trim();
    if (/^(无|暂无|没有|无可确认产品资料|无明确产品资料)$/i.test(detail)) return '';
    return detail;
  }

  function normalizeDetailPageSection(section = {}, index = 0, total = DETAIL_PAGE_DEFAULT_COUNT) {
    const order = Math.max(1, Math.min(DETAIL_PAGE_MAX_COUNT, Number(section.order) || index + 1));
    const title = String(section.title || section.name || '').trim() || `详情页第 ${order} 屏`;
    const purpose = String(section.purpose || section.goal || section.scene || '').trim() || title;
    const prompt = cleanPromptBody(section.prompt || section.imagePrompt || section.visualPrompt || '');
    const transition = cleanPromptBody(section.transition || section.seam || section.continuity || '');
    return {
      order,
      title,
      purpose,
      prompt,
      transition,
      continuity: cleanPromptBody(section.continuity || section.visualContinuity || ''),
      total
    };
  }

  function normalizeDetailPageSections(value) {
    const raw = Array.isArray(value) ? value : [];
    const total = Math.max(DETAIL_PAGE_MIN_COUNT, Math.min(DETAIL_PAGE_MAX_COUNT, raw.length || DETAIL_PAGE_DEFAULT_COUNT));
    return raw
      .map((item, index) => normalizeDetailPageSection(item, index, total))
      .filter(item => item.prompt)
      .sort((a, b) => a.order - b.order)
      .slice(0, DETAIL_PAGE_MAX_COUNT)
      .map((item, index, list) => ({ ...item, order: index + 1, total: list.length }));
  }

  function parseDetailPageStoryboard(text) {
    const raw = String(text || '').trim();
    const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const candidate = fenced ? fenced[1].trim() : raw;
    const tryParse = value => {
      try { return JSON.parse(value); } catch { return null; }
    };
    const parsed = tryParse(candidate) || tryParse((candidate.match(/\{[\s\S]*\}/) || [])[0] || '');
    const sections = normalizeDetailPageSections(parsed?.sections || parsed?.screens || parsed?.storyboard || []);
    if (sections.length >= DETAIL_PAGE_MIN_COUNT) {
      return {
        title: String(parsed?.title || parsed?.pageTitle || '淘宝详情页分镜').trim(),
        style: String(parsed?.style || parsed?.visualSystem || '').trim(),
        sections
      };
    }
    throw new Error('详情页分镜解析失败：文本模型没有返回 6-10 个可用分屏 JSON');
  }

  function buildDetailPageStoryboardPrompt(refs, count = DETAIL_PAGE_DEFAULT_COUNT) {
    const aliases = refs.images.map(ref => '@' + (ref.alias || ref.title || '图像')).join('、') || '无';
    const detailBlocks = refs.details.map(item => item.text).filter(Boolean).join('\n\n');
    const textBlocks = refs.textInputs.map(item => item.imagePrompt || item.rawText).filter(Boolean).join('\n\n');
    const assistantPlan = String(refs.assistantPlan || '').trim();
    return [
      '你是淘宝详情页视觉策划和 image2 提示词工程师。请基于当前画布输入，规划一套可上传淘宝的连续分图详情页。',
      `目标：输出 ${count} 屏，允许 6-10 屏；每屏是一张独立竖图，不生成单张超长图。`,
      '必须输出严格 JSON，不要 markdown，不要解释。',
      'JSON 结构：{"title":"","style":"","sections":[{"order":1,"title":"","purpose":"","prompt":"","transition":"","continuity":""}]}',
      DETAIL_PAGE_CATEGORY_RULES.join('\n'),
      'JSON 的 title 或 style 中必须体现商品类别判断，例如“数码配件详情页”“美妆成分详情页”“食品原料详情页”；如果类别不确定，用“通用商品详情页”，不要编造具体品类。',
      'style 必须是整套详情页统一视觉系统，写清统一背景色系、统一字体层级、统一光影方向、统一装饰元素、统一镜头语言和统一商业质感；每一屏都必须沿用 style。',
      '详情页不是一组产品海报。除第 1 屏和收尾屏外，严禁每屏都只放一张居中的完整产品图；必须做成淘宝详情页模块：卖点卡、信息图、参数表、对比栏、细节放大窗、引线标注、场景故事、包装/配件组合、保障图标、转化按钮区。',
      '每个 sections[i].prompt 必须是完整中文生图提示词，适合直接写入一个 Generate 节点；必须包含画面目的、商品事实来源、构图、背景、光影、文案区域、卖点或参数模块、真实商业质感，并明确本屏产品出现方式：不出现完整主体、关键局部、缩略图、侧边辅助、组合陈列、场景出现或首屏全貌。',
      '每屏只能变化内容主题和信息模块，不允许变化商品事实、品牌调性、背景体系、字体体系、光影方向、装饰语言或整体风格；但必须变化画面结构和信息密度，不能 6-10 屏都生成同一种“单产品居中摆拍”。',
      '每屏必须包含“连续感规则”：允许背景色、地面/光影、装饰线条、色块、材质纹理或氛围元素在画面顶部/底部少量延续上一屏或引出下一屏；但禁止把核心产品主体、标题、参数表、按钮、价格区、卖点卡或正文切半跨屏，不能出现半截文字、断裂表格或残缺主体。',
      '每屏必须包含“安全区规则”：顶部 12% 和底部 12% 只允许背景/光影/纹理/装饰延续，不得放标题、表格、按钮、价格、参数、卖点正文或需要阅读的信息；所有信息模块必须在中间 76% 完整闭合。',
      '分屏通用节奏：1 首屏主视觉；2 核心卖点总览；3 关键局部/材质/结构/成分/工艺；4 包装/配件/清单/组合陈列；5 使用方式/步骤/场景演示；6 参数/规格/对比/信息表；7 适用人群/信任背书/售后保障；8 收尾转化。6 屏时合并相邻模块；10 屏时按商品类别拆出更多来源、结构、步骤、对比或场景模块。',
      '事实规则：主图和产品资料决定当前主体、品牌、颜色、材质、参数和禁用词；参考图只迁移版式、风格、光影和信息模块，不继承旧品牌、旧型号、旧价格、旧文案。',
      '缺少产品资料时，价格、功效、规格、活动时间、地址等只保留泛化模块，不编具体数字。',
      `当前图片：${aliases}`,
      detailBlocks ? `产品资料：\n${detailBlocks}` : '产品资料：无明确产品资料，只能使用主图可见事实。',
      textBlocks ? `反推/版式骨架：\n${textBlocks}` : '',
      assistantPlan ? `智能体详情页方案（高优先级，必须转成严格 JSON 分屏执行）：\n${assistantPlan}` : ''
    ].filter(Boolean).join('\n\n');
  }

  function clearGlobalChat() {
    const assistant = getAssistantState();
    assistant.messages = [];
    assistant.draft = '';
    assistant.adoptedPrompt = '';
    assistant.adoptedMessageIndex = -1;
    setAssistantError('');
    assistant.status = 'idle';
    scheduleSaveWorkspace();
    renderAssistantPanel();
  }

  function resetAssistantConversation() {
    const assistant = getAssistantState();
    const open = assistant.open !== false;
    const model = assistant.model || '';
    state.assistant = normalizeAssistantState({ open, model });
  }

  function getDetailPageGenerateNodes(groupId = state.activeDetailPageGroupId) {
    const nodes = state.nodes
      .filter(node => node.type === 'generate' && node.settings?.detailPage?.groupId)
      .filter(node => !groupId || node.settings.detailPage.groupId === groupId)
      .sort((a, b) => (Number(a.settings.detailPage.order) || 0) - (Number(b.settings.detailPage.order) || 0));
    if (nodes.length) return nodes;
    return state.nodes
      .filter(node => node.type === 'generate' && node.settings?.detailPage?.groupId)
      .sort((a, b) => (Number(a.settings.detailPage.order) || 0) - (Number(b.settings.detailPage.order) || 0));
  }

  function getDetailPageGroups() {
    const map = new Map();
    state.nodes.forEach(node => {
      const detailPage = node.settings?.detailPage;
      if (!detailPage?.groupId) return;
      const group = map.get(detailPage.groupId) || {
        id: detailPage.groupId,
        title: detailPage.title || '淘宝详情页',
        createdAt: Number(detailPage.createdAt) || 0,
        count: 0
      };
      group.count += 1;
      group.createdAt = Math.max(group.createdAt, Number(detailPage.createdAt) || 0);
      map.set(group.id, group);
    });
    return [...map.values()].sort((a, b) => b.createdAt - a.createdAt);
  }

  function getDetailPageSectionBlueprint(section = {}, total = DETAIL_PAGE_DEFAULT_COUNT) {
    const order = Number(section.order) || 1;
    const title = `${section.title || ''} ${section.purpose || ''}`;
    const lower = title.toLowerCase();
    if (order === 1 || /首屏|主视觉|hero/.test(lower)) {
      return '本屏结构蓝图：首屏主视觉。允许产品全貌成为主视觉，但必须包含详情页标题区、副标题/短卖点、品牌或品类信任信息、底部承接区；不要只是孤立产品海报。';
    }
    if (order === total || /收尾|转化|购买|结尾|保障/.test(lower)) {
      return '本屏结构蓝图：收尾转化或信任保障。必须包含购买理由总结、服务/保障图标、行动引导区或底部收束条；产品可以不出现完整主体，也可作为缩略图、局部或组合陈列，不能只是一张居中产品照。';
    }
    if (/卖点|优势|核心|亮点/.test(lower) || order === 2) {
      return '本屏结构蓝图：核心卖点总览。使用 3-4 个卖点卡片/图标/短标签形成清晰阅读路径；可完全不出现完整主体，只用产品局部、图标、纹理、场景元素或信息图辅助，产品不能占满画面中央，不能只做单主体摆拍。';
    }
    if (/细节|材质|工艺|局部|质感|结构|成分|原料|来源/.test(lower) || order === 3) {
      return '本屏结构蓝图：关键局部/材料/结构/成分说明。优先不出现完整主体；使用原料/来源画面、材质纹理、结构拆解、局部特写窗口、放大镜圆窗、引线标注和信息卡展示当前商品的关键部位、材料纹理、成分来源、结构层次或工艺特点；禁止把同一个完整主体简单切成几段，禁止重复完整主体居中海报。';
    }
    if (/包装|礼|配件|组合|套装|开箱/.test(lower) || order === 4) {
      return '本屏结构蓝图：包装/配件/清单/组合陈列。产品、包装、配件、清单或组合元素以模块化陈列出现，配合信息卡说明组成和适用场景；画面应像淘宝详情页商品组合模块，不是单产品写真。';
    }
    if (/场景|使用|步骤|生活|氛围|空间|演示|操作|安装/.test(lower) || order === 5) {
      return '本屏结构蓝图：使用步骤/场景演示。把商品、商品局部或相关使用元素放入对应使用场景，加入动作步骤、环境元素、场景标题或流程标注；产品可以只作为局部、道具或结果展示，不必完整居中出现。';
    }
    if (/参数|规格|对比|信息|表格|成分|容量/.test(lower) || order === 6) {
      return '本屏结构蓝图：参数/规格信息图。必须有表格、参数卡、对比栏或信息栅格；本屏可以完全不出现产品主体，或只作为侧边缩略图/局部背景辅助，禁止全屏单产品主视觉。缺少资料时只写泛化字段名，不编具体数字。';
    }
    return '本屏结构蓝图：详情页功能模块。必须使用信息卡、标题层级、图标/标签、引线或分栏形成可阅读详情页版式；产品可以不完整出现，出现方式必须服务本屏信息，不要退化成单张产品海报。';
  }

  function buildDetailPageGeneratePrompt(section, storyboard = {}, refs = {}) {
    const order = Number(section.order) || 1;
    const total = Number(section.total) || DETAIL_PAGE_DEFAULT_COUNT;
    const roleRefs = getDetailPageImageRoleRefs(refs);
    const subjectLine = formatDetailPageRefsLine('主图', roleRefs.subject ? [roleRefs.subject] : []);
    const referenceLine = formatDetailPageRefsLine('参考图', [...roleRefs.references, ...roleRefs.sketches]);
    const visualSystem = storyboard.style || '整套详情页保持同一主体、同一背景色系、同一字体层级、同一光影方向、同一装饰语言和同一商业质感。';
    const sectionBlueprint = getDetailPageSectionBlueprint(section, total);
    return [
      subjectLine,
      referenceLine,
      '提示词：',
      `淘宝详情页连续分图，第 ${order}/${total} 屏。`,
      `本屏主题：${section.title}`,
      `本屏目的：${section.purpose}`,
      `整套视觉系统：${visualSystem}`,
      '统一风格硬约束：本屏必须与整套详情页保持同一商品事实、同一品牌调性、同一背景色系、同一字体层级、同一光影方向、同一装饰元素、同一商业质感；不要求每屏都出现完整主体，只能改变本屏信息主题，但必须改变版式结构和信息模块，不能变成同一种独立产品海报。',
      sectionBlueprint,
      '详情页硬约束：除第 1 屏外，不允许整屏只有一个居中完整产品；非首屏可以完全没有完整主体，必须出现本屏功能模块，例如来源/原料、材质纹理、结构拆解、卖点卡、信息图、参数表、局部特写窗、引线标注、包装/配件清单、场景元素或保障图标。细节页要做独立关键局部特写和标注，不要把同一个完整主体横向切成几段。',
      section.prompt,
      [
        '连续感规则：',
        section.transition || section.continuity || '背景色、地面/光影、装饰元素、色彩系统、标题层级与整套详情页保持一致；顶部和底部可保留少量背景纹理、光带、装饰线或色块作为跨屏衔接带，但本屏核心信息必须完整。',
        '安全区：顶部 12% 和底部 12% 只能放背景、光影、纹理、装饰线、色块或无阅读价值的氛围元素；不要把标题、卡片、表格、按钮、价格、参数、卖点正文、产品信息标题放进上下边缘。',
        '相邻屏交接：当前屏底部只抛出背景/装饰/光影，不抛出下一屏标题或卡片；下一屏顶部先承接背景/装饰/光影，再在中间内容区开始完整标题和模块。',
        '输出单张淘宝详情页分屏，不要输出超长图，不要把多屏拼在同一张图里。允许边缘有 5%-12% 的背景/装饰/光影延续带来制造连续详情页感觉；禁止把产品主体、标题、价格、参数表、按钮、卖点卡、正文内容切半延续到另一屏。',
        '禁止继承参考图旧品牌、旧型号、旧价格、旧文案；缺少资料的价格、功效、规格只做泛化信息模块。'
      ].join('\n')
    ].filter(Boolean).join('\n');
  }

  function createDetailPageNodesFromStoryboard(storyboard, refs = collectDetailPageRefs(), ownerNode = null) {
    const sections = normalizeDetailPageSections(storyboard?.sections || []);
    if (sections.length < DETAIL_PAGE_MIN_COUNT) {
      throw new Error('详情页分镜至少需要 6 屏');
    }
    const groupId = uid(DETAIL_PAGE_GROUP_PREFIX);
    const createdAt = Date.now();
    const ownerBox = ownerNode ? getNodeBox(ownerNode) : null;
    const base = els.canvas
      ? screenToWorld(window.innerWidth / 2, 160)
      : { x: 120, y: 120 };
    const sources = [...refs.details, ...refs.images, ...refs.textInputs]
      .map(ref => ref.id)
      .filter(id => getNode(id));
    const uniqueSources = uniqueIds(sources).slice(0, 12);
    const startX = ownerBox ? Math.round(ownerBox.x + ownerBox.w + 180) : Math.round(base.x + 160);
    const startY = ownerBox ? Math.round(ownerBox.y) : Math.round(base.y);
    const gapY = 360;
    const created = sections.map((section, index) => {
      const node = createNodeObject('generate', {
        x: startX + (index % 2) * (GENERATE_NODE_W + 120),
        y: startY + Math.floor(index / 2) * gapY,
        title: `详情页 ${section.order} · ${section.title}`,
        text: buildDetailPageGeneratePrompt(section, storyboard, refs),
        settings: {
          ratio: '3:4',
          resolution: '2K',
          size: sizeFromRatioResolution('3:4', '2K'),
          referenceMode: DEFAULT_REFERENCE_MODE,
          detailPage: {
            groupId,
            order: section.order,
            total: sections.length,
            title: section.title,
            purpose: section.purpose,
            pageTitle: storyboard?.title || '淘宝详情页',
            createdAt
          }
        }
      });
      state.nodes.push(node);
      uniqueSources.forEach(sourceId => {
        if (sourceId && sourceId !== node.id && !state.connections.some(conn => conn.from === sourceId && conn.to === node.id)) {
          state.connections.push({ from: sourceId, to: node.id });
        }
      });
      return node;
    });
    state.activeDetailPageGroupId = groupId;
    state.detailPageOpen = true;
    if (ownerNode) {
      ownerNode.settings = { ...(ownerNode.settings || {}), detailPageGroupId: groupId, screenCount: sections.length };
      ownerNode.status = 'done';
      ownerNode.error = '';
      ownerNode.debug = `已创建 ${sections.length} 屏详情页分镜`;
    }
    if (els.world) {
      render();
    }
    scheduleSaveWorkspace();
    return { groupId, nodes: created };
  }

  function setDetailPageNodeScreenCount(nodeId, count) {
    const node = getNode(nodeId);
    if (!node || node.type !== 'detailPage') return;
    node.settings = { ...(node.settings || {}), screenCount: normalizeDetailPageScreenCount(count) };
    if (els.world) render();
    scheduleSaveWorkspace();
  }

  function getTryOnConnectedImages(node) {
    const refs = collectRefsForNode(node);
    return refs.images.filter(ref => ref?.id && ref.image && !isSketchReference(ref));
  }

  function setTryOnImageRole(nodeId, imageId, role) {
    const node = getNode(nodeId);
    if (!node || node.type !== 'tryOn') return;
    const image = getTryOnConnectedImages(node).find(ref => ref.id === imageId);
    if (!image) {
      toast('只能选择已连接到换装节点的图片', 'error');
      return;
    }
    const settings = getTryOnSettings(node);
    if (role === 'garment') {
      settings.garmentSourceId = image.id;
      if (settings.modelSourceId === image.id) settings.modelSourceId = '';
      settings.backgroundReferenceIds = settings.backgroundReferenceIds.filter(id => id !== image.id);
      node.debug = `服装来源图：@${image.alias || image.title || '图'}`;
    } else if (role === 'model') {
      settings.modelSourceId = image.id;
      if (settings.garmentSourceId === image.id) settings.garmentSourceId = '';
      settings.backgroundReferenceIds = settings.backgroundReferenceIds.filter(id => id !== image.id);
      settings.modelRegion = { enabled: false, sourceId: '', sourceAlias: '', rect: null };
      node.debug = `模特图：@${image.alias || image.title || '图'}`;
    } else if (role === 'background') {
      if (settings.backgroundReferenceIds.includes(image.id)) {
        settings.backgroundReferenceIds = settings.backgroundReferenceIds.filter(id => id !== image.id);
      } else {
        settings.backgroundReferenceIds = uniqueIds([...settings.backgroundReferenceIds, image.id]).filter(id => id !== settings.garmentSourceId && id !== settings.modelSourceId).slice(0, 4);
      }
    }
    node.settings.tryOn = settings;
    node.error = '';
    if (els.world) render();
    scheduleSaveWorkspace();
  }

  function setTryOnPoseEnabled(nodeId, enabled) {
    const node = getNode(nodeId);
    if (!node || node.type !== 'tryOn') return;
    const settings = getTryOnSettings(node);
    settings.poseChangeEnabled = Boolean(enabled);
    settings.poseVariantCount = Math.min(4, Math.max(1, Math.round(Number(settings.poseVariantCount) || 1)));
    node.settings.tryOn = settings;
    node.debug = settings.poseChangeEnabled
      ? `已开启模特动作：额外生成 ${settings.poseVariantCount} 张`
      : '已关闭模特动作';
    if (els.world) render();
    scheduleSaveWorkspace();
  }

  function setTryOnPoseCount(nodeId, count) {
    const node = getNode(nodeId);
    if (!node || node.type !== 'tryOn') return;
    const settings = getTryOnSettings(node);
    settings.poseChangeEnabled = true;
    settings.poseVariantCount = Math.min(4, Math.max(1, Math.round(Number(count) || 1)));
    node.settings.tryOn = settings;
    node.debug = `模特动作：额外生成 ${settings.poseVariantCount} 张`;
    if (els.world) render();
    scheduleSaveWorkspace();
  }

  function getTryOnRequiredRefs(node) {
    const settings = getTryOnSettings(node);
    const refs = collectRefsForNode(node);
    const garmentRef = refs.images.find(ref => ref.id === settings.garmentSourceId) || null;
    const modelRef = refs.images.find(ref => ref.id === settings.modelSourceId) || null;
    const backgroundRefs = refs.images.filter(ref => settings.backgroundReferenceIds.includes(ref.id));
    return { settings, refs, garmentRef, modelRef, backgroundRefs };
  }

  function buildTryOnGarmentPrompt(garmentRef) {
    const alias = '@' + (garmentRef?.alias || garmentRef?.title || '服装来源图');
    return [
      `主图：${alias}`,
      '提示词：',
      '从主图中识别并重绘整套穿搭，生成一张独立的白底电商商品图；整套穿搭包括上装、下装、连衣裙/外套等服装，以及主图中可见并与穿搭配套的鞋履。',
      '必须完整还原整套穿搭的类别组合、上下装比例、鞋履类型、廓形、长度、宽松度、层次关系、颜色、材质、纹理、图案、透明度、厚薄、垂坠感和整体版型，不要把套装或鞋款改成另一种款式。',
      '逐项保留所有可见结构细节：领口、肩线、袖型、袖长、袖口、门襟、下摆、腰线、裙摆、裤腰、裆线、裤腿宽度、裤脚形状、侧缝、拼接线、省道、褶皱走向、口袋、纽扣、拉链、系带、腰带、装饰边、开衩、荷叶边、压线、印花、织物肌理，以及鞋头形状、鞋帮高度、鞋底厚度、鞋跟高度、鞋带/搭扣、鞋面材质和鞋子颜色。',
      '如果原图中服装或鞋履被人体姿势、遮挡、弯折或透视影响，需要按原款式合理补全为完整穿搭商品图，可采用正面平铺、自然悬挂或标准商品陈列角度；补全时不得改变原有结构、比例、颜色、材质和细节位置。',
      '画面只呈现独立穿搭商品，不呈现穿着者、人体、脸、头发、手、腿、脚、原拍摄场景、水印或旧文字；如果原图有可见鞋履，必须把鞋履作为穿搭的一部分一起提取；如果鞋履完全不可见或无法判断款式，不要凭空添加鞋子。',
      '背景为纯白或接近纯白，整套服装和鞋履居中完整展示，边缘干净，布料与鞋面材质真实，符合电商白底商品图。'
    ].join('\n');
  }

  function buildTryOnComposePrompt(modelRef, garmentNode, backgroundRefs = [], hasRegion = false) {
    const modelAlias = '@' + (modelRef?.alias || modelRef?.title || '模特图');
    const garmentAlias = '@' + (garmentNode?.alias || garmentNode?.title || '白底穿搭图');
    const backgroundLine = backgroundRefs.length ? `背景场景：${backgroundRefs.map(ref => '@' + (ref.alias || ref.title || '图')).join(' ')}` : '';
    return [
      `主图：${modelAlias}`,
      `辅助图：${garmentAlias}`,
      backgroundLine,
      '提示词：',
      '把辅助图里的整套穿搭准确穿到主图模特身上，生成换装后的真实模特图；如果辅助图包含鞋履，鞋子也必须一起替换到模特脚上。',
      backgroundRefs.length
        ? '主图模特必须锁定：脸、五官、发型、表情、头身比例、体型、姿势、手脚位置和镜头角度保持不变；背景、场景、光线、色调和空间氛围改成背景场景图。'
        : '主图模特必须锁定：脸、五官、发型、表情、头身比例、体型、姿势、手脚位置、镜头角度、背景、空间关系和整体光影尽量保持不变。',
      '穿搭必须跟随辅助图：服装款式、颜色、材质、纹理、图案、领口、袖长、下摆、裤腰、裤脚、裙摆、纽扣、拉链、口袋、拼接线、版型特征和鞋履款式都要尽量一致。',
      hasRegion
        ? (backgroundRefs.length
          ? '已提供服装和鞋履区域 mask：mask 白色区域重点替换服装和鞋履；同时允许全图背景、光线和场景氛围按背景场景图调整，但脸、姿势、身体比例和模特身份必须保持。'
          : '已提供 mask：只修改 mask 白色区域内的服装和鞋履，黑色区域必须尽量保持不变。')
        : (backgroundRefs.length
          ? '未提供服装鞋履区域 mask：仍然只允许替换模特身上的服装和鞋履，并把背景/光线/场景改成背景场景图；不要改脸、头发、皮肤、姿势和身体比例。'
          : '未提供 mask：仍然只允许替换模特身上的服装和鞋履区域，不要改脸、头发、皮肤、背景、姿势和身体比例；建议用户框选服装和鞋履区域会更稳。'),
      backgroundRefs.length ? '背景场景图负责最终背景、空间、地面/墙面关系、环境光方向、明暗层次、色调和摄影氛围；不改变服装和鞋履款式，不改变模特身份和姿势。' : '没有指定背景场景图时，默认沿用主图模特的原背景、原光线和原空间关系。',
      '输出自然可信的真人穿搭成片，衣服贴合身体结构和姿势，鞋子贴合脚部落地关系，有合理褶皱、遮挡、布料受力、鞋底接触阴影和透视关系，人物与背景光线统一，不要像贴纸，不要生成多个人，不要添加不存在的品牌 logo、文字或配饰。'
    ].filter(Boolean).join('\n');
  }

  function getTryOnPoseDescription(index) {
    return [
      '先判断服装调性和适合的电商展示气质，自主设计一个正面或接近正面的全身展示动作；必须清楚展示服装正面轮廓、比例和穿着效果。',
      '先判断服装调性，自主设计一个有轻微动态感的展示动作；可以是自然迈步、重心变化或手臂自然摆动，但画面仍要以展示服装正面为主。',
      '先判断服装调性，自主设计一个能展示侧面线条和版型层次的动作；可使用三分之二角度、轻微转身、扶腰或整理衣摆/袖口等自然动作。',
      '先判断服装调性，自主设计一个更有氛围感的补充动作；可以更优雅、松弛或街拍，但不能牺牲服装识别度，不能和前几张动作重复。'
    ][Math.max(0, Math.min(3, index - 1))];
  }

  function buildTryOnPosePrompt(modelRef, garmentNode, backgroundRefs = [], poseIndex = 1, poseCount = 1) {
    const modelAlias = '@' + (modelRef?.alias || modelRef?.title || '模特图');
    const garmentAlias = '@' + (garmentNode?.alias || garmentNode?.title || '白底穿搭图');
    const backgroundLine = backgroundRefs.length ? `背景场景：${backgroundRefs.map(ref => '@' + (ref.alias || ref.title || '图')).join(' ')}` : '';
    const modelReferenceRule = backgroundRefs.length
      ? '主图模特只作为身份、脸、发型、体型比例和镜头人物参考；不要继承主图里的原始身体动作、走路方向、道路/草地/树木等原背景或原光线。'
      : '主图模特作为身份、脸、发型、体型比例、原背景和摄影质感参考；不要继承主图里的原始身体动作或走路方向。';
    const consistencyRule = backgroundRefs.length
      ? '必须保持同一位模特身份、脸、五官、发型、肤色、体型比例、服装款式、服装颜色、服装材质、画幅比例和商业摄影质感一致；背景、光线、地面/墙面、空间氛围必须来自背景场景图。'
      : '必须保持同一位模特身份、脸、五官、发型、肤色、体型比例、服装款式、服装颜色、服装材质、背景、光线、画幅比例、色调和商业摄影质感一致。';
    const poseChangeRule = backgroundRefs.length
      ? '必须按“本张动作方向”重摆身体姿势、朝向、肢体站位、重心和手臂腿部动作；允许从侧身改为正面，也允许从行走改为站立。不要使用主图原背景，不要换成其他场景，不要改变服装，不要生成第二个人。'
      : '必须按“本张动作方向”重摆身体姿势、朝向、肢体站位、重心和手臂腿部动作；允许从侧身改为正面，也允许从行走改为站立。不要改变背景，不要换场景，不要改变服装，不要生成第二个人。';
    return [
      `主图：${modelAlias}`,
      `辅助图：${garmentAlias}`,
      backgroundLine,
      '提示词：',
      `生成同一套换装模特图的动作版本 ${poseIndex}/${poseCount}。`,
      modelReferenceRule,
      consistencyRule,
      '先根据辅助图服装判断调性：通勤、休闲、度假、甜美、极简、高级、运动、街拍、礼服等，再选择符合这套服装销售展示的自然模特动作。',
      poseChangeRule,
      poseIndex === 1 ? '整组动作要求：至少这一张必须是正面或接近正面的全身展示，避免整组都继承主图侧身/走路姿势。' : '整组动作要求：本张必须和其他动作明显不同，但仍符合服装调性和电商展示逻辑。',
      `本张动作方向：${getTryOnPoseDescription(poseIndex)}`,
      backgroundRefs.length
        ? '背景场景必须锁定为背景场景图的空间、地面/墙面关系、光线方向、明暗层次、色调、道具和摄影氛围；不同动作版本之间背景也必须保持一致。禁止沿用主图模特原来的道路、草地、树木、室外街拍背景。'
        : '背景必须锁定为主图模特的原背景、原光线和原空间关系；不同动作版本之间背景也必须保持一致。',
      '穿搭必须跟随辅助图：整体类别组合、上下装比例、鞋履类型、廓形、长度、宽松度、层次、颜色、材质、纹理、图案、领口、袖型、下摆、腰线、裙摆、裤腰、裤腿、口袋、纽扣、拉链、拼接线、鞋头、鞋底、鞋跟和褶皱受力都要尽量一致。',
      '姿势变化要真实自然，衣服要贴合新姿势产生合理褶皱和遮挡，鞋子要随脚部姿势自然落地，不要像贴纸，不要拉伸身体，不要改变模特身份。'
    ].filter(Boolean).join('\n');
  }

  function ensureTryOnGenerateNode(ownerNode, kind, options = {}) {
    const settings = getTryOnSettings(ownerNode);
    const key = kind === 'garment' ? 'garmentGenerateId' : 'tryOnGenerateId';
    const existing = getNode(settings[key]);
    if (existing?.type === 'generate') return existing;
    const { garmentRef, modelRef, backgroundRefs } = getTryOnRequiredRefs(ownerNode);
    const text = kind === 'garment' && garmentRef
      ? buildTryOnGarmentPrompt(garmentRef)
      : kind === 'compose' && modelRef
        ? buildTryOnComposePrompt(modelRef, { title: '换装-白底穿搭图', alias: '白底穿搭' }, backgroundRefs, false)
        : undefined;
    const node = createNodeObject('generate', {
      x: Number.isFinite(options.x) ? options.x : ownerNode.x + 520,
      y: Number.isFinite(options.y) ? options.y : ownerNode.y + (kind === 'garment' ? 0 : 380),
      title: kind === 'garment' ? '换装-白底穿搭图' : '换装-模特成片',
      text,
      settings: {
        model: getCurrentImageModelForGenerate(),
        ratio: kind === 'garment' ? '1:1' : '3:4',
        resolution: '2K',
        size: kind === 'garment' ? sizeFromRatioResolution('1:1', '2K') : sizeFromRatioResolution('3:4', '2K'),
        referenceMode: DEFAULT_REFERENCE_MODE,
        tryOnStep: kind,
        tryOnOwnerId: ownerNode.id
      }
    });
    state.nodes.push(node);
    settings[key] = node.id;
    ownerNode.settings.tryOn = settings;
    return node;
  }

  function ensureTryOnPoseNodes(ownerNode) {
    const settings = getTryOnSettings(ownerNode);
    const count = settings.poseChangeEnabled ? Math.min(4, Math.max(1, settings.poseVariantCount || 1)) : 0;
    const nodes = [];
    for (let i = 0; i < count; i += 1) {
      const existing = getNode(settings.poseGenerateIds[i]);
      if (existing?.type === 'generate') {
        nodes.push(existing);
        continue;
      }
      const node = createNodeObject('generate', {
        x: ownerNode.x + 960,
        y: ownerNode.y + i * 380,
        title: `换装-动作${i + 1}`,
        settings: {
          model: getCurrentImageModelForGenerate(),
          ratio: '3:4',
          resolution: '2K',
          size: sizeFromRatioResolution('3:4', '2K'),
          referenceMode: DEFAULT_REFERENCE_MODE,
          tryOnStep: 'pose',
          tryOnOwnerId: ownerNode.id,
          tryOnPoseIndex: i + 1
        }
      });
      state.nodes.push(node);
      nodes.push(node);
    }
    settings.poseGenerateIds = nodes.map(node => node.id);
    ownerNode.settings.tryOn = settings;
    return nodes;
  }

  function ensureTryOnChildNodes(ownerNode) {
    const garmentNode = ensureTryOnGenerateNode(ownerNode, 'garment', {
      x: ownerNode.x + 520,
      y: ownerNode.y
    });
    const composeNode = ensureTryOnGenerateNode(ownerNode, 'compose', {
      x: ownerNode.x + 520,
      y: ownerNode.y + 380
    });
    return { garmentNode, composeNode };
  }

  function prepareTryOnComposeNode(ownerNode, composeNode = ensureTryOnGenerateNode(ownerNode, 'compose')) {
    const { settings, modelRef, backgroundRefs } = getTryOnRequiredRefs(ownerNode);
    const garmentNode = getNode(settings.garmentGenerateId);
    const validRegion = getValidTryOnModelRegion(ownerNode, modelRef);
    composeNode.text = modelRef && garmentNode
      ? buildTryOnComposePrompt(modelRef, garmentNode, backgroundRefs, Boolean(validRegion))
      : '主图：\n辅助图：\n提示词：等待白底穿搭图生成后自动换装。';
    composeNode.settings = {
      ...(composeNode.settings || {}),
      model: getCurrentImageModelForGenerate(composeNode.settings?.model),
      ratio: '3:4',
      resolution: '2K',
      size: sizeFromRatioResolution('3:4', '2K'),
      n: 1,
      referenceMode: DEFAULT_REFERENCE_MODE,
      tryOnStep: 'compose',
      tryOnOwnerId: ownerNode.id
    };
    if (validRegion) {
      composeNode.settings.regionEdit = {
        enabled: true,
        sourceId: modelRef.id,
        sourceAlias: modelRef.alias || modelRef.title || '模特图',
        rect: validRegion.rect,
        prompt: '只替换框选区域内的衣服，框外模特脸、头发、皮肤、动作、身体比例尽量保持；如设置背景场景图，背景和光线可按背景图调整'
      };
    } else {
      composeNode.settings.regionEdit = { enabled: false, sourceId: '', sourceAlias: '', rect: null, prompt: '' };
    }
    const keepIds = uniqueIds([modelRef?.id, garmentNode?.id, ...backgroundRefs.map(ref => ref.id)].filter(Boolean));
    setIncomingConnectionsInOrder(composeNode.id, keepIds);
    return composeNode;
  }

  function prepareTryOnPoseNode(ownerNode, poseNode, poseIndex, poseCount) {
    const { settings, modelRef, backgroundRefs } = getTryOnRequiredRefs(ownerNode);
    const garmentNode = getNode(settings.garmentGenerateId);
    poseNode.text = modelRef && garmentNode
      ? buildTryOnPosePrompt(modelRef, garmentNode, backgroundRefs, poseIndex, poseCount)
      : '主图：\n辅助图：\n提示词：等待白底穿搭图生成后自动生成动作版本。';
    poseNode.settings = {
      ...(poseNode.settings || {}),
      model: getCurrentImageModelForGenerate(poseNode.settings?.model),
      ratio: '3:4',
      resolution: '2K',
      size: sizeFromRatioResolution('3:4', '2K'),
      n: 1,
      referenceMode: DEFAULT_REFERENCE_MODE,
      tryOnStep: 'pose',
      tryOnOwnerId: ownerNode.id,
      tryOnPoseIndex: poseIndex
    };
    poseNode.settings.regionEdit = { enabled: false, sourceId: '', sourceAlias: '', rect: null, prompt: '' };
    const keepIds = uniqueIds([modelRef?.id, garmentNode?.id, ...backgroundRefs.map(ref => ref.id)].filter(Boolean));
    setIncomingConnectionsInOrder(poseNode.id, keepIds);
    return poseNode;
  }

  function createOrUpdateTryOnResultGroup(ownerNode, nodes = []) {
    if (!ownerNode || ownerNode.type !== 'tryOn') return null;
    const settings = getTryOnSettings(ownerNode);
    const nodeIds = uniqueIds([ownerNode.id, ...nodes.map(node => node?.id).filter(Boolean)]).filter(id => getNode(id));
    if (!nodeIds.length) return null;
    let group = state.groups.find(item => item.id === settings.poseGroupId);
    if (!group) {
      group = createGroup(nodeIds, '换装结果组');
      settings.poseGroupId = group.id;
    } else {
      group.nodeIds = nodeIds;
      group.childGroupIds = [];
      group.title = group.title || '换装结果组';
      updateGroupBounds(group);
    }
    ownerNode.settings.tryOn = settings;
    return group;
  }

  function setIncomingConnectionsInOrder(toId, sourceIds = []) {
    const unique = uniqueIds(sourceIds.filter(Boolean)).filter(id => id !== toId && getNode(id));
    state.connections = state.connections.filter(conn => conn.to !== toId);
    unique.forEach(sourceId => {
      state.connections.push({ from: sourceId, to: toId });
      applyConnectionData(sourceId, toId);
    });
    refreshNodesForConnectionChange([toId]);
  }

  async function runTryOnGarmentStep(nodeId) {
    const ownerNode = getNode(nodeId);
    if (!ownerNode || ownerNode.type !== 'tryOn') return;
    const { settings, garmentRef } = getTryOnRequiredRefs(ownerNode);
    if (!garmentRef) {
      toast('请先指定服装来源图', 'error');
      return;
    }
    const generateNode = ensureTryOnGenerateNode(ownerNode, 'garment');
    generateNode.text = buildTryOnGarmentPrompt(garmentRef);
    generateNode.settings = {
      ...(generateNode.settings || {}),
      model: getCurrentImageModelForGenerate(generateNode.settings?.model),
      ratio: '1:1',
      resolution: '2K',
      size: sizeFromRatioResolution('1:1', '2K'),
      n: 1,
      referenceMode: DEFAULT_REFERENCE_MODE,
      tryOnStep: 'garment',
      tryOnOwnerId: ownerNode.id
    };
    setIncomingConnectionsInOrder(generateNode.id, [garmentRef.id]);
    ownerNode.status = 'generating';
    ownerNode.error = '';
    ownerNode.debug = '正在提取白底穿搭图...';
    render();
    try {
      await runGenerateNode(generateNode.id);
      if (generateNode.status === 'error') throw new Error(generateNode.error || '白底穿搭图生成失败');
      const version = getActiveGenerateVersion(generateNode);
      if (!version?.image && !generateNode.output) throw new Error('白底穿搭图没有生成结果');
      ownerNode.status = 'done';
      ownerNode.debug = '白底穿搭图已生成';
      settings.garmentGenerateId = generateNode.id;
      ownerNode.settings.tryOn = settings;
      toast('白底穿搭图已生成', 'success');
    } catch (err) {
      ownerNode.status = 'error';
      ownerNode.error = getErrMsg(err);
      recordAppLog('error', { source: 'try-on', title: '提取穿搭失败', summary: getErrMsg(err), nodeId: ownerNode.id, nodeType: ownerNode.type, detail: err?.stack || err?.message || String(err) });
      toast('提取穿搭失败：' + getErrMsg(err), 'error');
    } finally {
      if (ownerNode.status === 'generating') ownerNode.status = 'idle';
      render();
      scheduleSaveWorkspace();
    }
  }

  async function runTryOnComposeStep(nodeId) {
    const ownerNode = getNode(nodeId);
    if (!ownerNode || ownerNode.type !== 'tryOn') return;
    const { settings, modelRef, backgroundRefs } = getTryOnRequiredRefs(ownerNode);
    const garmentNode = getNode(settings.garmentGenerateId);
    const garmentVersion = getActiveGenerateVersion(garmentNode);
    const garmentImage = garmentVersion?.image || garmentNode?.output || '';
    if (!modelRef) {
      toast('请先指定模特图', 'error');
      return;
    }
    if (!garmentNode || garmentNode.type !== 'generate' || !garmentImage) {
      toast('请先生成白底穿搭图', 'error');
      return;
    }
    const generateNode = prepareTryOnComposeNode(ownerNode, ensureTryOnGenerateNode(ownerNode, 'compose'));
    const validRegion = getValidTryOnModelRegion(ownerNode, modelRef);
    ownerNode.status = 'generating';
    ownerNode.error = '';
    ownerNode.debug = backgroundRefs.length
      ? (validRegion ? '正在换装并替换背景场景...' : '正在换装并替换背景场景，未框选时会更依赖模型理解...')
      : (validRegion ? '正在局部换装...' : '正在换装，未框选时会更依赖模型理解...');
    render();
    try {
      await runGenerateNode(generateNode.id);
      if (generateNode.status === 'error') throw new Error(generateNode.error || '换装成片生成失败');
      const version = getActiveGenerateVersion(generateNode);
      if (!version?.image && !generateNode.output) throw new Error('换装成片没有生成结果');
      ownerNode.status = 'done';
      ownerNode.debug = '换装成片已生成';
      settings.tryOnGenerateId = generateNode.id;
      ownerNode.settings.tryOn = settings;
      toast('换装成片已生成', 'success');
    } catch (err) {
      ownerNode.status = 'error';
      ownerNode.error = getErrMsg(err);
      recordAppLog('error', { source: 'try-on', title: '换装失败', summary: getErrMsg(err), nodeId: ownerNode.id, nodeType: ownerNode.type, detail: err?.stack || err?.message || String(err) });
      toast('换装失败：' + getErrMsg(err), 'error');
    } finally {
      if (ownerNode.status === 'generating') ownerNode.status = 'idle';
      render();
      scheduleSaveWorkspace();
    }
  }

  async function runTryOnAll(nodeId) {
    const ownerNode = getNode(nodeId);
    if (!ownerNode || ownerNode.type !== 'tryOn') return;
    const { garmentRef, modelRef } = getTryOnRequiredRefs(ownerNode);
    if (!garmentRef || !modelRef) {
      toast('请先指定服装来源图和模特图', 'error');
      return;
    }
    const { garmentNode, composeNode } = ensureTryOnChildNodes(ownerNode);
    const settings = getTryOnSettings(ownerNode);
    settings.garmentGenerateId = garmentNode.id;
    settings.tryOnGenerateId = composeNode.id;
    ownerNode.settings.tryOn = settings;
    const poseNodes = settings.poseChangeEnabled ? ensureTryOnPoseNodes(ownerNode) : [];
    createOrUpdateTryOnResultGroup(ownerNode, [garmentNode, composeNode, ...poseNodes]);
    ownerNode.status = 'generating';
    ownerNode.error = '';
    ownerNode.debug = poseNodes.length
      ? `已创建白底穿搭图、换装成片和 ${poseNodes.length} 个动作版本节点，准备开始...`
      : '已创建白底穿搭图和换装成片两个生图节点，准备开始...';
    render();
    scheduleSaveWorkspace();
    await runTryOnGarmentStep(nodeId);
    const latestOwner = getNode(nodeId);
    if (latestOwner?.status === 'error') return;
    const latestSettings = getTryOnSettings(latestOwner);
    latestSettings.tryOnGenerateId = composeNode.id;
    latestSettings.poseGenerateIds = poseNodes.map(node => node.id);
    latestOwner.settings.tryOn = latestSettings;
    prepareTryOnComposeNode(latestOwner, composeNode);
    poseNodes.forEach((node, index) => prepareTryOnPoseNode(latestOwner, node, index + 1, poseNodes.length));
    createOrUpdateTryOnResultGroup(latestOwner, [garmentNode, composeNode, ...poseNodes]);
    latestOwner.status = 'generating';
    latestOwner.error = '';
    latestOwner.debug = poseNodes.length
      ? `白底穿搭图已生成，正在并发生成普通成片和 ${poseNodes.length} 个动作版本；动作图可能会比较久，请等待返回...`
      : '白底穿搭图已生成，正在生成换装成片...';
    render();
    try {
      const targets = [composeNode, ...poseNodes];
      const results = await Promise.allSettled(targets.map(node => runGenerateNode(node.id)));
      const failed = results
        .map((result, index) => ({ result, node: targets[index] }))
        .filter(item => item.result.status === 'rejected' || item.node.status === 'error');
      if (failed.length) {
        const first = failed[0];
        throw first.result.reason || new Error(first.node.error || `${first.node.title || '动作版本'} 生成失败`);
      }
      latestOwner.status = 'done';
      latestOwner.debug = poseNodes.length
        ? `换装成片和 ${poseNodes.length} 个动作版本已生成`
        : '换装成片已生成';
      toast(latestOwner.debug, 'success');
    } catch (err) {
      latestOwner.status = 'error';
      latestOwner.error = getErrMsg(err);
      recordAppLog('error', { source: 'try-on', title: '一键换装失败', summary: getErrMsg(err), nodeId: latestOwner.id, nodeType: latestOwner.type, detail: err?.stack || err?.message || String(err) });
      toast('换装失败：' + getErrMsg(err), 'error');
    } finally {
      if (latestOwner.status === 'generating') latestOwner.status = 'idle';
      render();
      scheduleSaveWorkspace();
    }
  }

  function getValidTryOnModelRegion(node, modelRef) {
    const settings = getTryOnSettings(node);
    const region = settings.modelRegion || {};
    if (!region.enabled || !region.rect || !modelRef?.id) return null;
    if (region.sourceId && region.sourceId !== modelRef.id) return null;
    return { ...region, sourceId: modelRef.id, sourceAlias: modelRef.alias || modelRef.title || '模特图' };
  }

  function openTryOnModelRegionEditor(nodeId) {
    const ownerNode = getNode(nodeId);
    if (!ownerNode || ownerNode.type !== 'tryOn') return;
    const { modelRef } = getTryOnRequiredRefs(ownerNode);
    if (!modelRef?.image) {
      toast('请先指定模特图', 'error');
      return;
    }
    const settings = getTryOnSettings(ownerNode);
    const region = settings.modelRegion || {};
    state.regionEditor = {
      nodeId: ownerNode.id,
      inline: false,
      source: 'try-on-model',
      sourceId: modelRef.id,
      sourceAlias: modelRef.alias || modelRef.title || '模特图',
      rect: !region.sourceId || region.sourceId === modelRef.id ? normalizeRegionRect(region.rect) : null,
      drag: null
    };
    if (els.regionSubjectLabel) els.regionSubjectLabel.textContent = `模特图：@${state.regionEditor.sourceAlias}`;
    if (els.regionImg) {
      els.regionImg.src = modelRef.image;
      els.regionImg.onload = () => updateRegionSelectionBox();
    }
    els.regionModal?.classList.add('show');
    requestAnimationFrame(() => updateRegionSelectionBox());
  }

  async function createDetailPageStoryboard(nodeId = '') {
    const ownerNode = nodeId ? getNode(nodeId) : null;
    const cfg = getTextModelConfig({ settings: { model: resolveAssistantTextModel() } });
    if (!cfg.apiKey || !cfg.modelId) {
      toast('请先在配置页设置并检测反推/智能体文本模型', 'error');
      return;
    }
    const refs = ownerNode?.type === 'detailPage' ? collectRefsForNode(ownerNode) : collectDetailPageRefs();
    if (ownerNode?.settings?.assistantPlan?.text) {
      refs.assistantPlan = String(ownerNode.settings.assistantPlan.text || '').trim();
    }
    if (!refs.images.length && !refs.details.length) {
      toast(ownerNode ? '请先把产品图、参考图或产品资料连接到详情页节点' : '请先选择或添加产品图、参考图或产品资料', 'error');
      return;
    }
    state.detailPageOpen = true;
    if (ownerNode) {
      ownerNode.status = 'generating';
      ownerNode.error = '';
      ownerNode.debug = '正在生成详情页分镜...';
      render();
    }
    renderDetailPagePanel('正在生成详情页分镜...');
    try {
      const count = ownerNode?.settings?.screenCount || DETAIL_PAGE_DEFAULT_COUNT;
      const prompt = buildDetailPageStoryboardPrompt(refs, count);
      const result = await postVisionText(cfg, prompt, refs.images.slice(0, MAX_REFERENCE_IMAGES));
      const storyboard = parseDetailPageStoryboard(result.text);
      const created = createDetailPageNodesFromStoryboard(storyboard, refs, ownerNode);
      toast(`已创建 ${created.nodes.length} 屏详情页分镜`, 'success');
      if (ownerNode) {
        await runDetailPageBatchForNode(ownerNode.id);
      }
    } catch (err) {
      if (ownerNode) {
        ownerNode.status = 'error';
        ownerNode.error = getErrMsg(err);
        ownerNode.debug = '';
      }
      renderDetailPagePanel();
      toast('详情页分镜失败：' + getErrMsg(err), 'error');
      recordAppLog('error', {
        source: 'detail-page',
        title: '详情页分镜失败',
        summary: getErrMsg(err),
        detail: err?.stack || err?.message || String(err)
      });
    } finally {
      if (ownerNode?.status === 'generating') ownerNode.status = 'idle';
      render();
      scheduleSaveWorkspace();
    }
  }

  function toggleDetailPagePanel(force) {
    state.detailPageOpen = typeof force === 'boolean' ? force : !state.detailPageOpen;
    if (state.detailPageOpen && !state.activeDetailPageGroupId) {
      const groups = getDetailPageGroups();
      state.activeDetailPageGroupId = groups[0]?.id || '';
    }
    renderDetailPagePanel();
    scheduleSaveWorkspace();
  }

  function openDetailPagePreview() {
    toggleDetailPagePanel(true);
  }

  async function runDetailPageBatch(groupId = state.activeDetailPageGroupId) {
    const nodes = getDetailPageGenerateNodes(groupId);
    if (!nodes.length) {
      toast('请先生成详情页分镜', 'error');
      return;
    }
    if (state.detailPageBatchRunning) {
      toast('详情页批量生成正在进行中', 'error');
      return;
    }
    const pending = nodes.filter(node => !(getActiveGenerateVersion(node)?.image || node.output));
    if (!pending.length) {
      toast('当前详情页分屏都已生成', 'success');
      return;
    }
    state.detailPageBatchRunning = true;
    state.detailPageOpen = true;
    const ownerNode = state.nodes.find(item => item.type === 'detailPage' && item.settings?.detailPageGroupId === groupId) || null;
    if (ownerNode) {
      ownerNode.status = 'generating';
      ownerNode.error = '';
      ownerNode.debug = `正在并发生成 ${pending.length} 屏`;
    }
    renderDetailPagePanel(`正在并发生成 ${pending.length} 屏...`);
    try {
      render();
      const results = await Promise.allSettled(pending.map(node => runGenerateNode(node.id)));
      const failed = pending.filter((node, index) => (
        results[index].status === 'rejected' || node.status === 'error'
      ));
      if (ownerNode) {
        const allNodes = getDetailPageGenerateNodes(groupId);
        const ready = allNodes.filter(item => getActiveGenerateVersion(item)?.image || item.output).length;
        ownerNode.status = failed.length ? 'error' : (ready >= allNodes.length ? 'done' : 'idle');
        ownerNode.debug = failed.length
          ? `已完成 ${ready}/${allNodes.length} 屏，${failed.length} 屏失败，可补跑`
          : `已完成 ${ready}/${allNodes.length} 屏`;
        ownerNode.error = failed.length ? failed.map(node => node.error || node.title || '详情页分屏').join('；') : '';
      }
      if (failed.length) throw new Error(`${failed.length} 屏生成失败，可点批量生成补跑未完成屏`);
      toast(`已生成 ${pending.length} 屏详情页`, 'success');
    } catch (err) {
      if (ownerNode) {
        ownerNode.status = 'error';
        ownerNode.error = getErrMsg(err);
        ownerNode.debug = '详情页生成中断，可点批量生成补跑未完成屏';
      }
      toast('详情页批量生成失败：' + getErrMsg(err), 'error');
      recordAppLog('error', {
        source: 'detail-page',
        title: '详情页批量生成失败',
        summary: getErrMsg(err),
        detail: err?.stack || err?.message || String(err)
      });
    } finally {
      state.detailPageBatchRunning = false;
      renderDetailPagePanel();
      render();
      scheduleSaveWorkspace();
    }
  }

  async function runDetailPageBatchForNode(nodeId) {
    const node = getNode(nodeId);
    if (!node || node.type !== 'detailPage') return;
    const groupId = node.settings?.detailPageGroupId || '';
    if (!groupId) {
      toast('请先在详情页节点生成分镜', 'error');
      return;
    }
    await runDetailPageBatch(groupId);
    render();
  }

  function focusDetailPageNode(nodeId) {
    focusNodeById(nodeId);
  }

  function renderDetailPagePanel(statusText = '') {
    if (!els.detailPagePanel) return;
    els.detailPagePanel.classList.toggle('show', Boolean(state.detailPageOpen));
    if (!state.detailPageOpen) return;
    const groups = getDetailPageGroups();
    if (!state.activeDetailPageGroupId && groups.length) state.activeDetailPageGroupId = groups[0].id;
    const nodes = getDetailPageGenerateNodes(state.activeDetailPageGroupId);
    const ready = nodes.filter(node => getActiveGenerateVersion(node)?.image || node.output).length;
    if (els.detailPageSummary) {
      els.detailPageSummary.textContent = statusText || (nodes.length
        ? `${nodes[0]?.settings?.detailPage?.pageTitle || '淘宝详情页'} · ${ready}/${nodes.length} 屏已生成`
        : '还没有详情页分屏');
    }
    if (!els.detailPageFlow) return;
    const pendingCount = nodes.length - ready;
    const groupTabs = groups.length > 1
      ? `<div class="v2-detail-page-tabs">${groups.map(group => `
        <button type="button" class="${group.id === state.activeDetailPageGroupId ? 'active' : ''}" data-detail-page-group="${escHtml(group.id)}">${escHtml(group.title)} · ${group.count}屏</button>
      `).join('')}</div>`
      : '';
    const emptyState = !nodes.length
      ? '<div class="v2-detail-page-empty">右键添加“详情页”节点，把主图、参考图、产品资料连进去；生成分镜和图片后，这里只负责检查上下衔接。</div>'
      : '';
    const previewHead = nodes.length
      ? `<div class="v2-detail-page-preview-head"><strong>连续分图预览</strong><span>${ready}/${nodes.length} 已完成</span></div>`
      : '';
    const screenList = nodes.map(node => {
      const meta = node.settings?.detailPage || {};
      const version = getActiveGenerateVersion(node);
      const image = version?.image || node.output || '';
      return `
        <div class="v2-detail-page-stitch-item ${image ? 'ready' : 'pending'}">
          ${image
            ? `<button type="button" class="v2-detail-page-stitch-image" data-preview-output="${node.id}" title="${escHtml(meta.title || node.title || '详情页分屏')}"><img src="${image}" alt="${escHtml(node.title)}"></button>`
            : `<div class="v2-detail-page-stitch-missing">第 ${escHtml(String(meta.order || ''))}/${escHtml(String(meta.total || nodes.length))} 屏待生成 · ${escHtml(meta.title || node.title || '详情页分屏')}</div>`}
        </div>`;
    }).join('');
    const stitch = nodes.length ? `<div class="v2-detail-page-stitch">${screenList}</div>` : '';
    els.detailPageFlow.innerHTML = (statusText ? `<div class="v2-detail-page-status">${escHtml(statusText)}</div>` : '') + groupTabs + emptyState + previewHead + stitch;
    els.detailPageFlow.querySelectorAll('[data-detail-page-group]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.activeDetailPageGroupId = btn.dataset.detailPageGroup || '';
        renderDetailPagePanel();
        scheduleSaveWorkspace();
      });
    });
    els.detailPageFlow.querySelectorAll('[data-preview-output]').forEach(btn => {
      btn.addEventListener('click', () => previewOutput(btn.dataset.previewOutput));
    });
  }

  function getTextModelConfig(node) {
    return {
      baseUrl: cleanApiBase(storageGet(REVERSE_BASE_STORAGE) || storageGet(API_BASE_STORAGE) || DEFAULT_API_BASE),
      apiKey: storageGet(REVERSE_KEY_STORAGE) || storageGet(API_KEY_STORAGE) || '',
      modelId: resolveTextModel(node) || storageGet(REVERSE_MODEL_STORAGE) || ''
    };
  }

  function resolveAssistantTextModel() {
    const assistant = getAssistantState();
    return assistant.model || getSelectedTextModel();
  }

  // ==========================================================================
  // SECTION: 35 HTTP-VISION
  // ==========================================================================
  async function postVisionText(cfg, prompt, images, signal) {
    const content = [];
    images.slice(0, MAX_REFERENCE_IMAGES).forEach(ref => {
      content.push({ type: 'image_url', image_url: { url: ref.image } });
    });
    content.push({ type: 'text', text: prompt });

    const started = Date.now();
    const endpoint = buildApiEndpoint(cfg.baseUrl, '/v1/chat/completions');
    try {
      const res = await requestJsonEndpoint(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + cfg.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: cfg.modelId,
          messages: [{ role: 'user', content }],
          max_tokens: 1800,
          temperature: 0.5
        }),
        signal
      });
      const elapsed = ((Date.now() - started) / 1000).toFixed(1);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const err = new Error(data?.error?.message || data?.message || `HTTP ${res.status}`);
        err.status = res.status;
        err.elapsed = elapsed;
        throw err;
      }
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content?.trim();
      if (!text) throw new Error('文本模型返回为空');
      return { text, elapsed };
    } catch (err) {
      recordAppLog('error', {
        source: 'text',
        title: '反推文本请求失败',
        summary: getErrMsg(err),
        detail: { url: endpoint, status: err?.status || '', elapsed: err?.elapsed || '', raw: err?.message || String(err) }
      });
      throw err;
    }
  }

  async function postChatAdvisor(cfg, node, refs, options = {}) {
    const messages = normalizeChatMessages(node.messages);
    const latestUserText = [...messages].reverse().find(item => item.role !== 'assistant')?.content || '';
    const intent = classifyChatIntent(latestUserText);
    const feedbackContext = options.feedbackContext || null;
    const carryingHistory = feedbackContext ? true : shouldCarryChatHistoryForDraft(latestUserText, refs);
    const conversationMessages = carryingHistory ? messages.slice(-8) : messages.slice(-2);
    const content = [];
    refs.images.slice(0, MAX_REFERENCE_IMAGES).forEach(ref => {
      content.push({ type: 'image_url', image_url: { url: ref.image } });
    });
    content.push({
      type: 'text',
      text: [
        buildChatSystemPrompt(refs, latestUserText, { intent, carryingHistory }),
        feedbackContext ? formatFeedbackContextPrompt(feedbackContext) : '',
        carryingHistory
          ? '本轮可参考最近对话中的上一版提示词和用户修改意见；如果最近对话里的主体名称与本轮 @ 图片冲突，以本轮 @ 图片为准。'
          : '本轮是新的 @ 图片目标，不要沿用最近对话里的旧主体、旧品牌、旧车型或旧产品名。',
        '最近对话：',
        conversationMessages.map(item => `${item.role === 'assistant' ? 'Assistant' : 'User'}：${item.content}`).join('\n\n'),
        '请回答最后一个 User 的问题。'
      ].join('\n\n')
    });

    const started = Date.now();
    const endpoint = buildApiEndpoint(cfg.baseUrl, '/v1/chat/completions');
    try {
      const payload = {
        model: cfg.modelId,
        messages: [{ role: 'user', content }],
        max_tokens: getChatMaxTokens(intent, feedbackContext),
        temperature: 0.7
      };
      if (typeof options.onDelta === 'function') {
        try {
          return await postChatAdvisorStream(endpoint, cfg.apiKey, payload, {
            started,
            onDelta: options.onDelta
          });
        } catch (streamErr) {
          const partial = String(streamErr?.partialText || '').trim();
          if (partial) {
            recordAppLog('error', {
              source: 'assistant',
              title: '智能体流式输出中断',
              summary: getErrMsg(streamErr),
              detail: { url: endpoint, partialLength: partial.length, raw: streamErr?.message || String(streamErr) }
            });
            return { text: partial, elapsed: streamErr.elapsed || ((Date.now() - started) / 1000).toFixed(1) };
          }
          recordAppLog('info', {
            source: 'assistant',
            title: '智能体流式不可用，回退普通请求',
            summary: getErrMsg(streamErr),
            detail: { url: endpoint, raw: streamErr?.message || String(streamErr) }
          });
        }
      }
      const res = await requestJsonEndpoint(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + cfg.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      const elapsed = ((Date.now() - started) / 1000).toFixed(1);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const err = new Error(data?.error?.message || data?.message || `HTTP ${res.status}`);
        err.status = res.status;
        err.elapsed = elapsed;
        throw err;
      }
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content?.trim();
      if (!text) throw new Error('文本模型返回为空');
      return { text, elapsed };
    } catch (err) {
      recordAppLog('error', {
        source: 'assistant',
        title: '智能体请求失败',
        summary: getErrMsg(err),
        detail: { url: endpoint, status: err?.status || '', elapsed: err?.elapsed || '', raw: err?.message || String(err) }
      });
      throw err;
    }
  }

  async function postChatAdvisorStream(endpoint, apiKey, payload, options = {}) {
    const streamPayload = { ...payload, stream: true };
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), ASSISTANT_STREAM_READ_TIMEOUT_MS);
    let text = '';
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(streamPayload),
        signal: controller.signal
      });
      const elapsed = ((Date.now() - (options.started || Date.now())) / 1000).toFixed(1);
      if (!res.ok) {
        const raw = await res.text().catch(() => '');
        const parsed = parseLooseJson(raw);
        const err = new Error(parsed?.error?.message || parsed?.message || raw || `HTTP ${res.status}`);
        err.status = res.status;
        err.elapsed = elapsed;
        err.partialText = text;
        throw err;
      }
      if (!res.body?.getReader) {
        const err = new Error('当前运行环境不支持 ReadableStream');
        err.partialText = text;
        throw err;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() || '';
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data:')) continue;
          const data = trimmed.replace(/^data:\s*/, '');
          if (data === '[DONE]') {
            clearTimeout(timeout);
            return { text: text.trim(), elapsed };
          }
          const parsed = parseLooseJson(data);
          const delta = parsed?.choices?.[0]?.delta?.content
            || parsed?.choices?.[0]?.message?.content
            || '';
          if (delta) {
            text += delta;
            options.onDelta?.(delta);
          }
        }
      }
      if (!text.trim()) throw new Error('流式文本模型返回为空');
      return { text: text.trim(), elapsed };
    } catch (err) {
      err.partialText = text;
      if (err.name === 'AbortError') err.message = '智能体流式响应超时';
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }

  function parseLooseJson(text) {
    try { return JSON.parse(text); } catch { return null; }
  }

  // ==========================================================================
  // SECTION: 36 GENERATE-RUN
  // ==========================================================================
  function getGenerateRunState(nodeId) {
    return activeGenerateRuns.get(nodeId) || null;
  }

  function canCancelGenerateRun(runState) {
    return runState?.phase === 'pending';
  }

  function getGenerateCancelLabel(runState) {
    return canCancelGenerateRun(runState) ? '撤回生成' : '生成中...';
  }

  function getGenerateCancelHint(runState) {
    return canCancelGenerateRun(runState)
      ? '2 秒内撤回，不会发送生图请求'
      : '已超过 2 秒撤回时间，生成请求已发送';
  }

  function getGenerateRunPreviewText(runState) {
    return runState?.phase === 'pending' ? '准备发送...' : '生成中...';
  }

  function restoreGenerateStatus(node) {
    if (!node || node.type !== 'generate') return;
    node.status = normalizeGenerateVersions(node).length || node.output ? 'done' : 'idle';
  }

  function clearGenerateRun(nodeId) {
    const runState = activeGenerateRuns.get(nodeId);
    if (!runState) return;
    clearTimeout(runState.timer);
    if (typeof runState.resolvePending === 'function') runState.resolvePending(false);
    activeGenerateRuns.delete(nodeId);
  }

  function isGenerateRunCurrent(nodeId, runId) {
    return activeGenerateRuns.get(nodeId)?.runId === runId;
  }

  function cancelGenerateRun(nodeId) {
    const node = getNode(nodeId);
    const runState = activeGenerateRuns.get(nodeId);
    if (!node || !runState) return;
    if (!canCancelGenerateRun(runState)) return;
    runState.canceled = true;
    clearTimeout(runState.timer);
    clearGenerateRun(nodeId);
    restoreGenerateStatus(node);
    node.error = '';
    node.debug = '已撤回，未发送请求';
    toast('已撤回生成，未产生生图请求', 'success');
    render();
    scheduleSaveWorkspace();
  }

  function waitForGenerateSendWindow(nodeId, runId) {
    return new Promise(resolve => {
      const runState = activeGenerateRuns.get(nodeId);
      if (!runState || runState.runId !== runId) {
        resolve(false);
        return;
      }
      runState.resolvePending = resolve;
      runState.timer = setTimeout(() => {
        if (!isGenerateRunCurrent(nodeId, runId)) {
          resolve(false);
          return;
        }
        runState.resolvePending = null;
        runState.phase = 'requesting';
        render();
        resolve(true);
      }, GENERATE_CANCEL_GRACE_MS);
    });
  }

  async function runGenerateNode(id) {
    const node = getNode(id);
    if (!node || node.type !== 'generate') return;
    if (getGenerateRunState(id)) {
      cancelGenerateRun(id);
      return;
    }
    const refs = collectRefsForNode(node);
    const compiled = buildCompiledPrompt(node, refs);
    const prompt = compiled.prompt;
    if (!prompt) {
      toast('请先输入提示词或连接反推节点', 'error');
      return;
    }
    const availableModels = loadAvailableImageModels();
    const model = String(node.settings?.model || '').trim();
    if (!availableModels.length) {
      toast('请先检测并选择当前中转站支持的生图模型', 'error');
      return;
    }
    if (!model || !availableModels.includes(model)) {
      node.settings.model = availableModels[0];
      setSelectedImageModel(node.settings.model);
    }
    applyCurrentImageModelToGenerateNode(node);

    const runId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const controller = new AbortController();
    activeGenerateRuns.set(id, {
      runId,
      phase: 'pending',
      controller,
      timer: null,
      resolvePending: null,
      canceled: false
    });
    node.status = 'generating';
    node.error = '';
    node.debug = '准备发送生图请求，2 秒内可撤回';
    node.promptAudit = compiled.warnings || [];
    node.lastTaskId = null;  // UI 同步：清掉旧 taskId，等 api.js 真正提交后填上
    node.lastTaskSubmittedAt = 0;
    render();

    try {
      const shouldSend = await waitForGenerateSendWindow(id, runId);
      if (!shouldSend) return;
      const requestImages = compiled.requestImages;
      const requestedCount = getGenerateRequestCount(node);
      // 调试：打印 requestImages 详情
      console.log('[DEBUG] runGenerateNode requestImages:\n' + JSON.stringify({
        nodeId: id,
        referenceMode: node.settings.referenceMode,
        referenceModeTouched: node.settings.referenceModeTouched,
        requestImagesLength: requestImages.length,
        compiledKeys: Object.keys(compiled || {}),
        requestImages: requestImages.map(r => ({ id: r.id, alias: r.alias, hasImage: !!r.image, isDataUrl: /^data:/i.test(String(r.image || '')) }))
      }, null, 2));
      const batchInputs = isBatchPerInputRequested([getGeneratePromptText(node), prompt].join('\n'), requestedCount, requestImages, compiled)
        ? getBatchInputRefs(node, refs, compiled, requestedCount)
        : [];
      const results = [];
      if (batchInputs.length >= 2) {
        const roleById = new Map((compiled.imageRoles || []).map(info => [info.id, info]));
        for (let i = 0; i < batchInputs.length; i += 1) {
          if (controller.signal.aborted) throw createUserCanceledError();
          const subjectRef = batchInputs[i];
          const batchPrompt = buildBatchSubjectPrompt(prompt, subjectRef, i, batchInputs.length);
          const batchImages = requestImages.filter(ref => {
            const role = roleById.get(ref.id)?.role || '';
            return ref.id === subjectRef.id || role === 'reference' || isSketchReference(ref);
          });
          node.debug = `正在生成第 ${i + 1}/${batchInputs.length} 张：@${subjectRef.alias || subjectRef.title || '输入图'}`;
          render();
          const result = await requestImageEdit(node, batchPrompt, batchImages, {
            signal: controller.signal,
            n: 1,
            compiled,
            subjectRef
          });
          // UI 同步：保存 lk888 任务 ID，给"同步小马AI 后台"按钮用
          if (result.taskId) {
            node.lastTaskId = result.taskId;
            node.lastTaskSubmittedAt = Date.now();
          }
          results.push(...result.urls.map(url => ({
            url,
            elapsed: result.elapsed,
            compiled: { ...compiled, prompt: batchPrompt, batchSubjectAlias: subjectRef.alias || subjectRef.title || '' },
            refs
          })));
        }
      } else {
        const feedbackEditInput = getAssistantFeedbackEditInput(node);
        const editImages = feedbackEditInput
          ? mergeRefsById([feedbackEditInput], requestImages)
          : requestImages;
        const editPrompt = feedbackEditInput
          ? buildFeedbackEditPrompt(prompt, feedbackEditInput)
          : prompt;
        if (feedbackEditInput) {
          node.debug = `正在使用${feedbackEditInput.alias || '上一轮生成图'}图生图续改`;
          recordAppLog('info', {
            source: 'generate',
            title: '生图续改使用上一版图',
            summary: `节点 ${node.title || node.alias || node.id} 使用 ${feedbackEditInput.alias || feedbackEditInput.sourceVersionId || '上一轮生成图'} 作为图生图输入`,
            detail: [
              `source=${feedbackEditInput.revisionSource || 'assistant'}`,
              `sourceVersionId=${feedbackEditInput.sourceVersionId || ''}`,
              '请求将走 /v1/images/edits，而不是 /v1/images/generations'
            ].join('\n'),
            nodeId: node.id,
            nodeType: node.type,
            nodeTitle: node.title || node.alias || ''
          });
          render();
        }
        const result = editImages.length
          ? await requestImageEdit(node, editPrompt, editImages, { signal: controller.signal, n: requestedCount, compiled })
          : await requestTextToImage(node, prompt, { signal: controller.signal, n: requestedCount });
        // UI 同步：保存 lk888 任务 ID
        if (result.taskId) {
          node.lastTaskId = result.taskId;
          node.lastTaskSubmittedAt = Date.now();
        }
        results.push(...result.urls.map((url, i) => ({
          url,
          // 最小改动：保留原始 COS URL 供下游"图生图"使用
          originalUrl: (result.originalUrls && result.originalUrls[i]) || '',
          elapsed: result.elapsed,
          compiled,
          refs
        })));
      }
      if (!isGenerateRunCurrent(id, runId)) return;
      const versions = results.map(item => appendGenerateVersion(node, item.url, item.compiled, item.refs, item.originalUrl));
      const lastVersion = versions[versions.length - 1];
      node.status = 'done';
      node.debug = `${versions.map(version => version.label).join('、')} 生成完成`;
      markUpstreamDirty(node.id);  // UI: generate 出新版本后，下游应标 dirty
      clearUpstreamDirty(node.id);  // UI: generate 自身不再 dirty
      clearGenerateRevisionEditInput(node, 'cinema');
      toast(`生图已完成 ${versions.length} 张，最新 ${lastVersion?.label || ''}`, 'success');
      playGenerateSuccessSound();
    } catch (err) {
      if (err?.code === 'USER_CANCELED') {
        restoreGenerateStatus(node);
        node.error = '';
        node.debug = getErrMsg(err);
        return;
      }
      if (!isGenerateRunCurrent(id, runId)) return;
      node.status = 'error';
      node.error = getErrMsg(err);
      toast('生图失败：' + node.error, 'error');
    } finally {
      if (isGenerateRunCurrent(id, runId)) clearGenerateRun(id);
    }
    render();
    scheduleSaveWorkspace();
  }

  function getAudioContext() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    if (!audioContext) audioContext = new Ctx();
    return audioContext;
  }

  function ensureAudioUnlocked() {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();
      audioUnlocked = true;
    } catch {
      audioUnlocked = false;
    }
  }

  function playGenerateSuccessSound() {
    try {
      const ctx = getAudioContext();
      if (!ctx || !audioUnlocked) return;
      if (ctx.state === 'suspended') ctx.resume();
      const now = ctx.currentTime;
      playTone(ctx, 660, now, 0.11, 0.08);
      playTone(ctx, 880, now + 0.12, 0.14, 0.07);
    } catch {}
  }

  function playAssistantSendSound() {
    try {
      const ctx = getAudioContext();
      if (!ctx || !audioUnlocked) return;
      if (ctx.state === 'suspended') ctx.resume();
      playTone(ctx, 520, ctx.currentTime, 0.08, 0.045);
    } catch {}
  }

  function playTone(ctx, frequency, startTime, duration, gainValue) {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, startTime);
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(gainValue, startTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(startTime);
    oscillator.stop(startTime + duration + 0.02);
  }

  function getAssistantFeedbackEditInput(node) {
    const pending = normalizeGenerateRevisionEditInput(node?.settings?.revisionEditInput);
    if (pending) {
      const version = normalizeGenerateVersions(node).find(item => item.id === pending.sourceVersionId);
      if (version?.image) {
        return {
          id: `${node.id}:${version.id}:revision-edit`,
          type: 'generate-version',
          alias: version.label ? `上一轮${version.label}` : '上一轮生成图',
          title: '上一轮生成结果',
          image: version.image,
          sourceVersionId: version.id,
          revisionSource: pending.source
        };
      }
      recordAppLog('warn', {
        source: 'generate',
        title: '续改图生图输入缺失',
        summary: `找不到上一版生成图，sourceVersionId=${pending.sourceVersionId}`,
        detail: `versions=${normalizeGenerateVersions(node).map(item => `${item.id}:${item.label}:${item.image ? 'has-image' : 'no-image'}`).join(', ')}`,
        nodeId: node?.id || '',
        nodeType: node?.type || '',
        nodeTitle: node?.title || node?.alias || ''
      });
    }
    const source = node?.assistantSource || null;
    if (!source?.useCurrentVersionAsEditInput || !source.sourceVersionId) return null;
    const version = normalizeGenerateVersions(node).find(item => item.id === source.sourceVersionId);
    if (!version?.image) return null;
    return {
      id: `${node.id}:${version.id}:feedback-edit`,
      type: 'generate-version',
      alias: version.label ? `上一轮${version.label}` : '上一轮生成图',
      title: '上一轮生成结果',
      image: version.image,
      sourceVersionId: version.id,
      revisionSource: 'assistant'
    };
  }

  function buildFeedbackEditPrompt(prompt, editInput) {
    const safePrompt = sanitizeCinemaFinalPrompt(prompt);
    return [
      '【基于上一轮生成结果续改】',
      `输入图：@${editInput.alias || editInput.title || '上一轮生成图'}`,
      '请保留输入图中已经正确的主体身份、构图、镜头方向、空间关系、光影氛围和整体电影感；只根据下面新版提示词修正用户反馈的问题。',
      '保持上一轮图中已经成立的事件目的、真实机位、焦点落点、景深、现场光线、空间层级和主体附近细节；如果上游有电影节点，继续按电影节点 v5 规则修正镜头、光线、色彩、空间层级和画面卫生。',
      '画面保持现场摄影感、自然镜头解析、环境反射托起暗部、真实材质与接触阴影、背景低频安静、主体附近细节集中。',
      safePrompt
    ].filter(Boolean).join('\n\n');
  }

  // ==========================================================================
  // SECTION: 37 HTTP-IMAGE
  // ==========================================================================
  async function requestTextToImage(node, prompt, options = {}) {
    const apiOptions = getGenerateApiLogOptions(node, options);
    return await requestWithSizeFallback(node, async size => {
      const count = normalizeGenerateCount(options.n || node.settings?.n);
      const payload = {
        model: node.settings.model,
        prompt,
        n: count,
        size
      };
      appendOutputParamsToPayload(payload, node.settings);
      const result = await postImageGenerationJSONWithFormatFallback(payload, apiOptions);
      const originalUrls = pickImageUrls(result.data);
      const urls = await resolveV2GeneratedUrls(originalUrls, apiOptions);
      return { urls, originalUrls: originalUrls.map(item => item?.url || ''), url: urls[0], elapsed: result.elapsed, usedSize: size, compiled: buildCompiledPrompt(node, collectRefsForNode(node)) };
    }, apiOptions);
  }

  async function requestImageEdit(node, prompt, images, options = {}) {
    const apiOptions = getGenerateApiLogOptions(node, options);
    const result = await requestWithSizeFallback(node, async size => {
      const count = normalizeGenerateCount(options.n || node.settings?.n);
      const callResult = await postImageEditWithFallback(() => buildImageEditFormDataV2(node, prompt, images, size, {
        ...apiOptions,
        n: count
      }), apiOptions);
      const originalUrls = pickImageUrls(callResult.data);
      const urls = await resolveV2GeneratedUrls(originalUrls, apiOptions);
      return { urls, originalUrls: originalUrls.map(item => item?.url || ''), url: urls[0], elapsed: callResult.elapsed, usedSize: size };
    }, apiOptions);
    // 最小改动：把 buildImageEditFormDataV2 里记下来的丢图汇总到 node.debug，
    // 节点面板上能看到 "⚠ N 张图被丢: alias1(catbox 上传失败)、alias2(...)"
    // apiOptions._dropped 跨 size fallback 重试只保留唯一项（_droppedIds Set 已在内部去重）
    if (apiOptions && Array.isArray(apiOptions._dropped) && apiOptions._dropped.length) {
      const msg = apiOptions._dropped.map(d => `${d.alias}(${d.reason})`).join('、');
      node.debug = (node.debug ? node.debug + ' | ' : '') + `⚠ ${apiOptions._dropped.length} 张图被丢: ${msg}`;
    }
    return result;
  }

  function getGenerateApiLogOptions(node, options = {}) {
    return {
      ...options,
      nodeId: node?.id || options.nodeId || '',
      nodeType: node?.type || options.nodeType || '',
      nodeTitle: node?.title || node?.alias || options.nodeTitle || ''
    };
  }

  async function requestWithSizeFallback(node, requestFn, options = {}) {
    const triedSizes = [];
    let currentSize = node.settings.size || '1024x1024';
    let lastErr = null;

    for (let i = 0; i < 8; i++) {
      if (options?.signal?.aborted) throw createUserCanceledError();
      triedSizes.push(currentSize);
      try {
        const result = await requestFn(currentSize);
        if (result.usedSize && result.usedSize !== node.settings.size) {
          applyGenerateSizeValue(node, result.usedSize);
          node.debug = `已按实际可用尺寸生成：${result.usedSize}`;
        }
        return result;
      } catch (err) {
        lastErr = err;
        if (isUserCanceledError(err)) throw err;
        const nextSize = isImageSizeError(err) ? getNextSmallerImageSize(currentSize, triedSizes) : '';
        if (!nextSize) break;
        currentSize = nextSize;
      }
    }
    if (lastErr) {
      lastErr.triedSizes = triedSizes;
      throw lastErr;
    }
    throw new Error('图片生成失败');
  }

  async function buildImageEditFormDataV2(node, prompt, images, size, options = {}) {
    const fd = new FormData();
    const imageFieldName = normalizeImageEditFieldName(options.imageFieldName || 'image');
    fd.append('model', node.settings.model);
    fd.append('prompt', prompt);
    fd.append('n', String(normalizeGenerateCount(options.n || node.settings?.n)));
    fd.append('size', size);
    appendOutputParamsToPayload(fd, node.settings);
    const refsForNode = collectRefsForNode(node);
    const compiled = options.compiled || buildCompiledPrompt(node, refsForNode);
    const activeVersion = getActiveGenerateVersion(node);
    const resultRegion = getValidResultRegionEdit(node, activeVersion);
    if (resultRegion) {
      const regionPrompt = [
        prompt,
        '【当前生成结果局部续改】',
        '当前生成版本图作为编辑输入。mask 白色区域是允许修改区域，黑色区域必须尽量保持不变。',
        '只修改 mask 白色区域，框外尽量保持不变。',
        resultRegion.prompt ? `框内修改要求：${sanitizeProductNoise(resultRegion.prompt)}` : ''
      ].filter(Boolean).join('\n\n');
      fd.set('prompt', regionPrompt);
      fd.set('n', String(normalizeGenerateCount(options.n || node.settings?.n)));
      fd.append(imageFieldName, await imageSourceToUploadPngBlob(activeVersion.image), `${node.alias || 'generated-version'}-${activeVersion.label || 'current'}.png`);
      fd.append('mask', await buildRegionMaskBlob(activeVersion.image, resultRegion.rect), 'result-region-mask.png');
      return fd;
    }
    const subjectRef = options.subjectRef || getCompiledSubjectRef(refsForNode.images, compiled, node);
    const region = getValidRegionEdit(node, subjectRef);
    const focusRefs = getFocusPromptImageRefs(node, refsForNode);
    // 最小改动：始终把 subject 排第一，formDataToXiaomaMediaPayload 的"第 1 张是主体"指代才稳。
    // 批量模式（runGenerateNode 内部 batchInputs 循环）每次都会传 options.subjectRef，
    // 重新调用 requestImageEdit → buildImageEditFormDataV2，subjectFirst=true 仍然正确。
    const uploadImages = orderRequestImagesForUpload(mergeRefsById(images, focusRefs), subjectRef, true);
    const roleById = new Map((compiled.imageRoles || []).map(item => [item.id, item]));
    const refs = uploadImages.slice(0, MAX_REFERENCE_IMAGES);
      // 调试：打印收集到的 ref 详情（用户诊断为什么图片没传出去）
      if (refs.length === 0 && uploadImages.length > 0) {
        console.warn('[DEBUG] refs 被截断为空', { uploadImages, MAX_REFERENCE_IMAGES });
      } else if (refs.length > 0) {
        console.log('[DEBUG] buildImageEditFormDataV2 refs:', refs.map((r, i) => ({
          i, id: r.id, alias: r.alias,
          hasImage: !!r.image, isDataUrl: /^data:/i.test(String(r.image || '')),
          isHttpUrl: /^https?:\/\//i.test(String(r.image || '')),
          remoteUrl: r.remoteUrl || null
        })));
      }
    // 最小改动：被丢图追踪。用 options._droppedIds 去重（同一 ref 在多次重试中只报一次），
    // 最终由 requestImageEdit 读 options._dropped 写入 node.debug 给用户看。
    const _droppedIds = options._droppedIds || (options._droppedIds = new Set());
    const _droppedList = options._dropped || (options._dropped = []);
    for (let i = 0; i < refs.length; i += 1) {
      const role = roleById.get(refs[i].id)?.role || '';
      const image = role === 'reference' && compiled.referenceMode !== 'direct'
        ? await createStyleProxyDataUrl(refs[i].image)
        : refs[i].image;
      const suffix = role === 'reference' ? 'style-proxy' : 'reference';
      // 最小改动：URL 探测改用统一 pickRefRemoteUrl（ref.remoteUrl 优先，其次 ref.image 本身是 http(s) URL）
      // 没有 remoteUrl 但处于小马AI 域时，自动走 catbox litterbox 把 dataURL 临时上传（24h 过期）拿公网 URL。
      // catbox 失败时跳过这张图，不影响其它参考图；同时把丢图原因记到 _droppedList。
      const refRemoteUrl = pickRefRemoteUrl(refs[i]);
      if (/^https?:\/\//i.test(refRemoteUrl)) {
        fd.append(`_remote_url_${i}`, refRemoteUrl);
        continue;
      }
      const _baseUrl = (typeof getApiBase === 'function') ? getApiBase() : '';
      const _isXiaomaBase = /api\.(lk888|lk666)\.ai/i.test(_baseUrl || '');
      if (_isXiaomaBase && typeof ensureCatboxPublicUrl === 'function' && image && /^data:/i.test(String(image))) {
        try {
          const publicUrl = await ensureCatboxPublicUrl(image, { ttl: '24h' });
          if (/^https?:\/\//i.test(publicUrl)) {
            fd.append(`_remote_url_${i}`, publicUrl);
            console.info('[小马AI画布] catbox fallback ok', { i, ref: refs[i].alias || suffix, publicUrl });
            continue;
          }
          if (!_droppedIds.has(refs[i].id)) {
            _droppedIds.add(refs[i].id);
            _droppedList.push({ id: refs[i].id, alias: refs[i].alias || suffix, reason: 'catbox 返回非 URL' });
          }
          console.warn('[小马AI画布] catbox fallback returned non-url, skip ref', { i, ref: refs[i].alias || suffix });
          continue;
        } catch (e) {
          if (!_droppedIds.has(refs[i].id)) {
            _droppedIds.add(refs[i].id);
            _droppedList.push({ id: refs[i].id, alias: refs[i].alias || suffix, reason: 'catbox 上传失败' });
          }
          console.warn('[小马AI画布] catbox fallback failed, skip ref', { i, ref: refs[i].alias || suffix, error: e?.message || e });
          continue;
        }
      }
      fd.append(imageFieldName, await imageSourceToUploadPngBlob(image), `${refs[i].alias || suffix}-${i + 1}.png`);
    }
    if (region) {
      const maskBlob = await buildRegionMaskBlob(subjectRef.image, region.rect);
      fd.append('mask', maskBlob, 'region-mask.png');
    }
    return fd;
  }

  async function imageSourceToUploadPngBlob(imageSrc) {
    const dataUrl = await imageSourceToDataUrl(imageSrc);
    const img = await loadImageFromDataUrl(dataUrl);
    const width = img.naturalWidth || img.width || 1;
    const height = img.naturalHeight || img.height || 1;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, width, height);
    return await dataUrlToBlob(canvas.toDataURL('image/png'));
  }

  async function createStyleProxyDataUrl(imageSrc) {
    const dataUrl = await imageSourceToDataUrl(imageSrc);
    const img = await loadImageFromDataUrl(dataUrl);
    const sourceW = img.naturalWidth || img.width || 1;
    const sourceH = img.naturalHeight || img.height || 1;
    const ratio = Math.min(1, STYLE_PROXY_MAX_SIDE / Math.max(sourceW, sourceH));
    const outW = Math.max(1, Math.round(sourceW * ratio));
    const outH = Math.max(1, Math.round(sourceH * ratio));
    const lowW = Math.max(8, Math.round(outW / STYLE_PROXY_CELL));
    const lowH = Math.max(8, Math.round(outH / STYLE_PROXY_CELL));

    const low = document.createElement('canvas');
    low.width = lowW;
    low.height = lowH;
    const lowCtx = low.getContext('2d');
    lowCtx.drawImage(img, 0, 0, lowW, lowH);

    const canvas = document.createElement('canvas');
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.filter = `blur(${STYLE_PROXY_BLUR_PX}px) saturate(1.08) contrast(0.92)`;
    ctx.drawImage(low, -STYLE_PROXY_BLUR_PX, -STYLE_PROXY_BLUR_PX, outW + STYLE_PROXY_BLUR_PX * 2, outH + STYLE_PROXY_BLUR_PX * 2);
    ctx.filter = 'none';
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(0, 0, outW, outH);

    return await compressDataUrl(canvas.toDataURL('image/jpeg', STYLE_PROXY_QUALITY), MAX_REFERENCE_IMAGE_BYTES);
  }

  function orderRequestImagesForUpload(images = [], subjectRef = null, subjectFirst = false) {
    const unique = [];
    const seen = new Set();
    (images || []).forEach(ref => {
      if (!ref?.id || seen.has(ref.id)) return;
      seen.add(ref.id);
      unique.push(ref);
    });
    const sketches = unique.filter(isSketchReference);
    const subject = subjectFirst && subjectRef
      ? unique.filter(ref => ref.id === subjectRef.id)
      : [];
    const base = subjectFirst
      ? [...subject, ...unique.filter(ref => !subject.some(item => item.id === ref.id))]
      : unique;
    const firstPage = base.slice(0, MAX_REFERENCE_IMAGES);
    const sketchMissing = sketches.some(ref => !firstPage.some(item => item.id === ref.id));
    if (!sketchMissing) return base;
    const nonSketch = base.filter(ref => !sketches.some(item => item.id === ref.id));
    const keepCount = Math.max(0, MAX_REFERENCE_IMAGES - sketches.length);
    return [...nonSketch.slice(0, keepCount), ...sketches, ...nonSketch.slice(keepCount)];
  }

  async function buildRegionMaskBlob(imageSrc, rect) {
    const dataUrl = await imageSourceToDataUrl(imageSrc);
    const img = await loadImageFromDataUrl(dataUrl);
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    const x = Math.round(rect.x * canvas.width);
    const y = Math.round(rect.y * canvas.height);
    const w = Math.max(1, Math.round(rect.w * canvas.width));
    const h = Math.max(1, Math.round(rect.h * canvas.height));
    ctx.fillRect(x, y, w, h);
    return await dataUrlToBlob(canvas.toDataURL('image/png'));
  }

  async function postImageEditWithFallback(buildFormData, options = {}) {
    // 小马AI 域：单次调用即可。response_format / imageFieldName 在 /v1/media/generate 通道里都不影响结果
    // （api.js 的 runImageEditFromFormData 只看 _remote_url_<i> 和 image Blob 顺序，response_format 已废弃）。
    // 多次重试只会重复提交媒体任务、重复扣费，所以这里直接走单路径。
    if (typeof isXiaomaMediaOnlyBase === 'function' && isXiaomaMediaOnlyBase()) {
      if (options?.signal?.aborted) throw createUserCanceledError();
      const fd = await buildFormData({ imageFieldName: 'image' });
      const result = await postImageEdit(fd, options);
      result.responseFormat = 'url';
      result.imageFieldName = 'image';
      return result;
    }
    // 小马AI 域的端点+格式转换已下沉到 api.js 的 postImageEdit，
    // 这里只保留 OpenAI 风格 image/image[] 字段名的兼容重试。
    const formats = ['', 'b64_json', 'url'];
    const imageFieldNames = ['image', 'image[]'];
    let lastErr = null;
    for (let fieldIndex = 0; fieldIndex < imageFieldNames.length; fieldIndex += 1) {
      const imageFieldName = imageFieldNames[fieldIndex];
      for (let i = 0; i < formats.length; i++) {
        if (options?.signal?.aborted) throw createUserCanceledError();
        const fd = await buildFormData({ imageFieldName });
        if (formats[i]) fd.append('response_format', formats[i]);
        try {
          const result = await postImageEdit(fd, options);
          result.responseFormat = formats[i] || 'default';
          result.imageFieldName = imageFieldName;
          return result;
        } catch (err) {
          lastErr = err;
          if (isUserCanceledError(err)) throw err;
          const canTryNextFormat = shouldRetryResponseFormat(err) && i < formats.length - 1;
          if (canTryNextFormat) continue;
          const canTryImageArray = imageFieldName === 'image' && shouldRetryImageFieldName(err);
          if (canTryImageArray) break;
          throw err;
        }
      }
    }
    throw lastErr || new Error('图片编辑失败');
  }

  // 检测当前 baseUrl 是否属于只支持 /v1/media/generate 异步任务的小马AI 域
  function isXiaomaMediaOnlyBase() {
    try {
      const base = (typeof getApiBase === 'function' ? getApiBase() : '') || '';
      // 匹配 https://api.lk888.ai/api 或 https://api.lk888.ai 或类似前缀
      return /api\.lk888\.ai/i.test(base);
    } catch {
      return false;
    }
  }

  // 将 OpenAI images/edits 风格的 FormData 转换为 /v1/media/generate 风格的 JSON
  async function formDataToImageEditPayload(fd) {
    const obj = {};
    let imageRef = null;
    for (const [key, value] of fd.entries()) {
      if (value instanceof Blob) {
        // 把图片 Blob 转 dataURL，交给 media/generate 作为 image
        imageRef = await blobToDataURL(value);
        continue;
      }
      if (obj[key] === undefined) {
        obj[key] = value;
      }
    }
    // 三级兜底：fd.model → getSelectedImageModel() → 默认 gpt-image-2（适用于小马AI 域）
    let model = (obj.model || '').toString().trim();
    if (!model && typeof getSelectedImageModel === 'function') {
      model = (getSelectedImageModel() || '').toString().trim();
    }
    if (!model) {
      model = 'gpt-image-2';
    }
    const prompt = obj.prompt || '';
    const size = obj.size || '1024x1024';
    const aspectRatio = size.replace('x', ':');
    const payload = {
      model,
      prompt,
      params: { aspectRatio }
    };
    if (imageRef) payload.image = imageRef;
    return payload;
  }

  function blobToDataURL(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('图片转 dataURL 失败'));
      reader.readAsDataURL(blob);
    });
  }

  function appendOutputParamsToPayload(target, settings) {
    if (settings.quality && settings.quality !== 'auto') target.append ? target.append('quality', settings.quality) : target.quality = settings.quality;
    if (settings.format && settings.format !== 'png') target.append ? target.append('output_format', settings.format) : target.output_format = settings.format;
    if (settings.background && settings.background !== 'auto') target.append ? target.append('background', settings.background) : target.background = settings.background;
  }

  async function resolveV2GeneratedUrl(url, options = {}) {
    if (!(url && typeof url === 'object' && url.__needsFetch)) return url;
    const maxRetries = 3;
    let lastErr = null;
    for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
      try {
        if (options?.signal?.aborted) throw createUserCanceledError();
        const response = await fetch(url.url, { signal: options?.signal });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const blob = await response.blob();
        if (!blob || blob.size === 0) throw new Error('图片内容为空（任务可能尚未真正完成）');
        return await new Promise((resolve, reject) => {
          if (options?.signal?.aborted) {
            reject(createUserCanceledError());
            return;
          }
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => reject(new Error('图片读取失败'));
          options?.signal?.addEventListener?.('abort', () => {
            try { reader.abort(); } catch {}
            reject(createUserCanceledError());
          }, { once: true });
          reader.readAsDataURL(blob);
        });
      } catch (err) {
        if (isUserCanceledError(err) || err?.name === 'AbortError') throw createUserCanceledError();
        lastErr = err;
        const isConnectionClosed = /ERR_CONNECTION_CLOSED|ERR_EMPTY_RESPONSE|ERR_INCOMPLETE_CHUNKED_ENCODING|networkerror/i.test(String(err?.message || err));
        const isEmptyBlob = /图片内容为空/.test(String(err?.message || ''));
        const canRetry = (isConnectionClosed || isEmptyBlob) && attempt < maxRetries;
        if (canRetry) {
          const delay = 1500 * attempt;
          console.warn(`[小马AI画布] 图片下载失败（第 ${attempt} 次），${delay}ms 后重试：`, err?.message || err);
          await new Promise(r => setTimeout(r, delay));
          continue;
        }
        const e = new Error(`image2 已返回结果，但图片下载失败：${getErrMsg(err)}。中转站可能返回了不可访问、需要鉴权或已过期的临时 URL。原始 URL：${url.url}`);
        e.remoteUrl = url.url;
        throw e;
      }
    }
    throw lastErr || new Error('图片下载失败');
  }

  async function resolveV2GeneratedUrls(urls = [], options = {}) {
    const resolved = [];
    for (const url of urls) {
      resolved.push(await resolveV2GeneratedUrl(url, options));
    }
    return resolved;
  }

  // ==========================================================================
  // SECTION: 38 PERSISTENCE
  // ==========================================================================
  async function saveWorkspace() {
    clearTimeout(saveTimer);
    const payload = {
      version: 1,
      nodes: state.nodes.map(node => ({
        ...node,
        detail: node.detail ? { ...node.detail } : node.detail,
        settings: node.settings ? { ...node.settings } : node.settings,
        versions: Array.isArray(node.versions)
          ? node.versions.map(version => ({
            ...version,
            settings: version.settings ? { ...version.settings } : version.settings,
            imageRoles: Array.isArray(version.imageRoles) ? version.imageRoles.map(item => ({ ...item })) : []
          }))
          : [],
        sketch: node.sketch ? {
          ...node.sketch,
          mappings: Array.isArray(node.sketch.mappings) ? node.sketch.mappings.map(item => ({ ...item })) : []
        } : node.sketch
      })),
      connections: state.connections,
      groups: state.groups,
      trash: state.trash,
      panX: state.panX,
      panY: state.panY,
      zoom: state.zoom,
      assistant: normalizeAssistantState(state.assistant),
      detailPageOpen: state.detailPageOpen,
      activeDetailPageGroupId: state.activeDetailPageGroupId,
      selectedId: state.selectedId,
      selectedIds: state.selectedIds,
      selectedGroupIds: state.selectedGroupIds
    };
    for (const node of payload.nodes) {
      if (node.image && node.image.startsWith('data:')) {
        const key = IMG_PREFIX + node.id + '_image';
        if (persistedAssetCache.get(key) !== node.image) {
          await dbSet(key, node.image);
          persistedAssetCache.set(key, node.image);
        }
        node.image = '__v2_image_' + node.id;
      }
      if (node.output && node.output.startsWith('data:')) {
        const key = IMG_PREFIX + node.id + '_output';
        if (persistedAssetCache.get(key) !== node.output) {
          await dbSet(key, node.output);
          persistedAssetCache.set(key, node.output);
        }
        node.output = '__v2_output_' + node.id;
      }
      if (Array.isArray(node.versions)) {
        for (const version of node.versions) {
          if (!version?.id || !version.image || !version.image.startsWith('data:')) continue;
          const key = IMG_PREFIX + node.id + '_version_' + version.id;
          if (persistedAssetCache.get(key) !== version.image) {
            await dbSet(key, version.image);
            persistedAssetCache.set(key, version.image);
          }
          version.image = '__v2_version_' + node.id + '_' + version.id;
        }
      }
      if (node.sketch?.image && node.sketch.image.startsWith('data:')) {
        const key = IMG_PREFIX + node.id + '_sketch';
        if (persistedAssetCache.get(key) !== node.sketch.image) {
          await dbSet(key, node.sketch.image);
          persistedAssetCache.set(key, node.sketch.image);
        }
        node.sketch.image = '__v2_sketch_' + node.id;
      }
      if (node.sketch?.sourceImage && node.sketch.sourceImage.startsWith('data:')) {
        const key = IMG_PREFIX + node.id + '_sketch_source';
        if (persistedAssetCache.get(key) !== node.sketch.sourceImage) {
          await dbSet(key, node.sketch.sourceImage);
          persistedAssetCache.set(key, node.sketch.sourceImage);
        }
        node.sketch.sourceImage = '__v2_sketch_source_' + node.id;
      }
    }
    await dbSet(STORE_KEY, JSON.stringify(payload));
  }

  async function loadWorkspace() {
    const raw = await dbGet(STORE_KEY);
    if (!raw) return;
    try {
      const payload = JSON.parse(raw);
      state.nodes = Array.isArray(payload.nodes) ? payload.nodes : [];
      state.trash = Array.isArray(payload.trash) ? payload.trash : [];
      state.connections = Array.isArray(payload.connections) ? payload.connections : [];
      state.groups = Array.isArray(payload.groups) ? payload.groups : [];
      state.panX = payload.panX ?? state.panX;
      state.panY = payload.panY ?? state.panY;
      state.zoom = payload.zoom ?? state.zoom;
      state.assistant = normalizeAssistantState(payload.assistant || state.assistant);
      state.detailPageOpen = Boolean(payload.detailPageOpen);
      state.activeDetailPageGroupId = String(payload.activeDetailPageGroupId || '');
      state.selectedId = payload.selectedId || null;
      state.selectedIds = Array.isArray(payload.selectedIds)
        ? payload.selectedIds.filter(id => state.nodes.some(node => node.id === id))
        : (state.selectedId ? [state.selectedId] : []);
      state.selectedGroupIds = Array.isArray(payload.selectedGroupIds)
        ? payload.selectedGroupIds.filter(id => state.groups.some(group => group.id === id))
        : [];
      state.groups.forEach(normalizeGroupShape);
      cleanupGroups();
      let migrated = false;
      if (migrateChatNodesToAssistant()) migrated = true;
      for (const node of state.nodes) {
        if (node.image && node.image.startsWith('__v2_image_')) {
          const key = IMG_PREFIX + node.id + '_image';
          node.image = await dbGet(key) || '';
          if (node.image) persistedAssetCache.set(key, node.image);
        }
        if (node.output && node.output.startsWith('__v2_output_')) {
          const key = IMG_PREFIX + node.id + '_output';
          node.output = await dbGet(key) || '';
          if (node.output) persistedAssetCache.set(key, node.output);
        }
        if (Array.isArray(node.versions)) {
          for (const version of node.versions) {
            if (!version?.id || !version.image || !version.image.startsWith('__v2_version_')) continue;
            const key = IMG_PREFIX + node.id + '_version_' + version.id;
            version.image = await dbGet(key) || '';
            if (version.image) persistedAssetCache.set(key, version.image);
          }
        }
        if (node.sketch?.image && node.sketch.image.startsWith('__v2_sketch_')) {
          const key = IMG_PREFIX + node.id + '_sketch';
          node.sketch.image = await dbGet(key) || '';
          if (node.sketch.image) persistedAssetCache.set(key, node.sketch.image);
        }
        if (node.sketch?.sourceImage && node.sketch.sourceImage.startsWith('__v2_sketch_source_')) {
          const key = IMG_PREFIX + node.id + '_sketch_source';
          node.sketch.sourceImage = await dbGet(key) || '';
          if (node.sketch.sourceImage) persistedAssetCache.set(key, node.sketch.sourceImage);
        }
        if (node.type === 'generate' && LEGACY_GENERATE_PROMPTS.has(String(node.text || '').trim())) {
          node.text = DEFAULT_GENERATE_PROMPT;
          migrated = true;
        }
        if (node.type === 'generate') {
          const beforeSize = node.settings?.size;
          const beforeReferenceMode = node.settings?.referenceMode;
          const beforeVersionCount = Array.isArray(node.versions) ? node.versions.length : 0;
          const beforeActiveVersionId = node.activeVersionId || '';
          const beforeAssistantSource = JSON.stringify(node.assistantSource || null);
          normalizeGenerateSizeSettings(node);
          normalizeGenerateReferenceMode(node);
          normalizeGenerateVersions(node);
          normalizeGenerateAssistantSource(node);
          if (
            node.settings.size !== beforeSize ||
            node.settings.referenceMode !== beforeReferenceMode ||
            !node.settings.ratio ||
            !node.settings.resolution ||
            beforeVersionCount !== node.versions.length ||
            beforeActiveVersionId !== node.activeVersionId ||
            beforeAssistantSource !== JSON.stringify(node.assistantSource || null)
          ) migrated = true;
        }
        if (node.type === 'detail') {
          node.detail = normalizeDetail(node.detail);
          migrated = true;
        }
        if (node.type === 'tryOn') {
          node.settings = { ...(node.settings || {}), tryOn: normalizeTryOnSettings(node.settings?.tryOn || {}) };
          migrated = true;
        }
        if (node.type === 'cinema') {
          node.settings = { ...(node.settings || {}), cinema: normalizeCinemaSettings(node.settings?.cinema || {}) };
          if (node.settings.cinema.boundGenerateId && getNode(node.settings.cinema.boundGenerateId)?.type !== 'generate') {
            node.settings.cinema.boundGenerateId = '';
          }
          node.messages = normalizeChatMessages(node.messages);
          node.draft = String(node.draft || '');
          node.result = cleanPromptBody(node.result || node.text || '');
          node.text = node.result;
          if (!node.settings?.model || /^gpt-image-/i.test(String(node.settings.model || ''))) {
            node.settings = { ...(node.settings || {}), model: getSelectedTextModel() };
          }
          migrated = true;
        }
        if (node.type === 'text') {
          node.settings = { ...(node.settings || {}) };
          if (!TEXT_TEMPLATES[node.settings.template]) {
            node.settings.template = 'auto';
            migrated = true;
          }
          const inputText = String(node.input || '').trim();
          const textValue = String(node.text || '').trim();
          if (LEGACY_TEXT_TEMPLATE_PROMPTS.has(inputText) || inputText === DEFAULT_TEXT_PROMPT || isTextTemplatePrompt(inputText)) {
            node.input = '';
            if (!node.result && textValue && !isTextTemplatePrompt(textValue)) node.result = sanitizeProductNoise(textValue);
            node.text = sanitizeProductNoise(node.result || '');
            migrated = true;
          }
          if (node.result) {
            node.result = cleanPromptBody(node.result);
            node.text = node.result;
          }
          if (!node.promptSkeleton || typeof node.promptSkeleton !== 'object') node.promptSkeleton = null;
          if (typeof node.input === 'undefined') node.input = '';
          if (!node.settings?.model || /^gpt-image-/i.test(String(node.settings.model || ''))) {
            node.settings = { ...(node.settings || {}), model: getSelectedTextModel() };
          }
        }
        if (node.type === 'sketch') {
          node.sketch = normalizeSketchState(node.sketch || {
            image: node.image || '',
            sourceImage: node.image || '',
            aspectRatio: node.aspectRatio || 1
          });
          if (!node.image && node.sketch.image) node.image = node.sketch.image;
          node.aspectRatio = node.sketch.aspectRatio || node.aspectRatio || 1;
          if (!node.alias) node.alias = nextAlias();
          migrated = true;
        }
      }
      render();
      if (migrated) saveWorkspace();
    } catch (err) {
      console.error('[v2] load workspace failed', err);
    }
  }

  async function clearCanvas() {
    if (!confirm('清空当前新版画布？')) return;
    // 清空前先把当前节点移入回收站
    for (const node of state.nodes) {
      state.trash.push({ ...node, _trashedAt: Date.now() });
    }
    state.nodes = [];
    state.connections = [];
    state.groups = [];
    state.selectedId = null;
    state.selectedIds = [];
    state.selectedGroupIds = [];
    resetAssistantConversation();
    await dbSet(STORE_KEY, JSON.stringify({ version: 1, nodes: [], connections: [], groups: [], trash: state.trash, assistant: normalizeAssistantState(state.assistant) }));
    render();
  }

  // ============ 回收站功能 ============
  function restoreFromTrash(nodeId) {
    const idx = state.trash.findIndex(n => n.id === nodeId);
    if (idx === -1) return;
    const [node] = state.trash.splice(idx, 1);
    delete node._trashedAt;
    state.nodes.push(node);
    render();
    scheduleSaveWorkspace();
  }

  // ============ 节点状态徽章（供 MCP 桥接调用） ============
  // 状态: 'idle' | 'generating' | 'done' | 'error'
  // 仅 UI 状态，不影响节点数据
  const _nodeStatuses = {};

  function setNodeStatus(nodeId, status, message) {
    if (!nodeId) return;
    _nodeStatuses[nodeId] = { status, message: message || '', at: Date.now() };
    // 使节点缓存失效，确保 renderNodes 能检测到变化
    if (typeof invalidateNodeRenderCache === 'function') {
      invalidateNodeRenderCache(nodeId);
    } else {
      _nodeHtmlCache.delete(nodeId);
      _nodesHtmlCache = '';
    }
    // 触发 render 以更新 UI
    if (typeof render === 'function') {
      try { render(); } catch (e) {}
    }
  }

  function getNodeStatus(nodeId) {
    return _nodeStatuses[nodeId] || null;
  }

  function clearAllNodeStatuses() {
    for (const k of Object.keys(_nodeStatuses)) delete _nodeStatuses[k];
    if (typeof render === 'function') {
      try { render(); } catch (e) {}
    }
  }

  function clearTrash() {
    if (!state.trash.length) return;
    if (!confirm('永久清空回收站？删除的节点将无法恢复。')) return;
    state.trash = [];
    render();
    scheduleSaveWorkspace();
  }

  return {
    init,
    applyVirtualization,
    invalidateVirtualization,
    addNode,
    clearCanvas,
    restoreFromTrash,
    clearTrash,
    zoomBy,
    fitView,
    arrangeCanvas,
    arrangeGroup,
    groupSelectedNodes,
    toggleDetailPagePanel,
    openDetailPagePreview,
    createDetailPageStoryboard,
    runDetailPageBatch,
    runDetailPageBatchForNode,
    setDetailPageNodeScreenCount,
    togglePromptLibrary,
    toggleAssetLibrary,
    openAssetFolderCreate,
    toggleAppLogPanel,
    toggleTrashPanel,
    clearAppLogs,
    copyAppLogs,
    recordAppLog,
    sanitizeLogValue,
    state,
    collectRefsForNode,
    buildCompiledPrompt,
    extractAliases,
    collectGlobalChatRefs,
    filterChatRefsForDraft,
    getRegionEditState,
    getValidRegionEdit,
    extractAdoptablePrompt,
    extractDetailText,
    classifyChatIntent,
    getChatMaxTokens,
    buildChatSystemPrompt,
    isContinuationEditRequest,
    shouldCarryChatHistoryForDraft,
    mergeGeneratePromptWithAssistant,
    extractLayoutGuidanceText,
    mergeAssistantLayoutGuidance,
    createStyleProxyDataUrl,
    normalizeGenerateCount,
    getGenerateRequestCount,
    isBatchPerInputRequested,
    getBatchInputRefs,
    buildBatchSubjectPrompt,
    collectDetailPageRefs,
    getDetailPageSourceSummary,
    normalizeDetailPageScreenCount,
    buildDetailPageStoryboardPrompt,
    parseDetailPageStoryboard,
    normalizeDetailPageSections,
    buildDetailPageGeneratePrompt,
    createDetailPageNodesFromStoryboard,
    getDetailPageGenerateNodes,
    normalizeCinemaSettings,
    getCinemaSettings,
    setCinemaImageRole,
    getCinemaImageRoles,
    getCinemaBoundGenerate,
    ensureCinemaBoundGenerate,
    applyCinemaPromptToBoundGenerate,
    retryCinemaBoundGenerate,
    buildCinemaPrompt,
    runCinemaNode,
    sizeFromRatioResolution,
    applyGenerateSizeValue,
    normalizeTryOnSettings,
    getTryOnSettings,
    setTryOnImageRole,
    buildTryOnGarmentPrompt,
    buildTryOnComposePrompt,
    buildTryOnPosePrompt,
    ensureTryOnPoseNodes,
    prepareTryOnPoseNode,
    createOrUpdateTryOnResultGroup,
    ensureTryOnChildNodes,
    shouldUseDirectTryOnInputs,
    buildImageEditFormDataV2,
    getAssistantFeedbackEditInput,
    buildFeedbackEditPrompt,
    postImageEditWithFallback,
    buildGenerateFeedbackContext,
    formatFeedbackContextPrompt,
    insertMention,
    renderAssistantDraftTextarea,
    getActiveGenerateRunSummaries,
    setNodeStatus,
    getNodeStatus,
    clearAllNodeStatuses,
  };
})();

window.V2 = V2;

// 一次性压测工具：批量添加 N 个随机分布的节点（用于测试虚拟化/性能/MCP 高强度工作环境）
window.__stressTest = function(count = 1000) {
  if (!V2 || !V2.addNode) { alert('V2 未就绪'); return; }
  console.log('[stressTest] start: adding ' + count + ' nodes...');
  const t0 = performance.now();
  const types = ['text', 'image', 'detail', 'cinema', 'generate', 'tryOn'];
  // 分批（避免长任务）：每批 100 个
  const BATCH = 100;
  let added = 0;
  const add = () => {
    for (let i = 0; i < BATCH && added < count; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      const x = Math.round((Math.random() - 0.5) * 8000);
      const y = Math.round((Math.random() - 0.5) * 6000);
      V2.addNode(type, { x, y, title: `压测 ${type} ${++added}` });
    }
    if (added < count) {
      setTimeout(add, 0);
    } else {
      const dur = (performance.now() - t0).toFixed(0);
      console.log(`[stressTest] done: ${count} nodes added in ${dur}ms. Current: ${V2.state.nodes.length} nodes.`);
      if (V2.fitView) V2.fitView(false);
    }
  };
  add();
};

// 硬清：清空画布 + 回收站 + IndexedDB + localStorage（彻底重置）
window.__hardReset = async function() {
  if (!confirm('🔥 硬清：清空画布 + 回收站 + 全部 IndexedDB 持久化数据，确定？')) return;
  console.log('[hardReset] starting...');
  // 1) 内存清空
  if (V2 && V2.state) {
    V2.state.nodes = [];
    V2.state.connections = [];
    V2.state.groups = [];
    V2.state.trash = [];
    V2.state.selectedId = null;
    V2.state.selectedIds = [];
    V2.state.selectedGroupIds = [];
  }
  // 2) 清空 localStorage / sessionStorage
  try { localStorage.clear(); sessionStorage.clear(); } catch(e) {}
  // 3) 删除所有 IndexedDB
  try {
    const dbs = await indexedDB.databases?.() || [];
    for (const db of dbs) {
      await new Promise(r => {
        const req = indexedDB.deleteDatabase(db.name);
        req.onsuccess = r; req.onerror = r; req.onblocked = r;
      });
    }
    console.log('[hardReset] deleted', dbs.length, 'IDB databases');
  } catch(e) { console.warn('[hardReset] IDB error:', e); }
  // 4) 重新加载页面
  console.log('[hardReset] reloading...');
  setTimeout(() => location.reload(), 200);
};
document.addEventListener('DOMContentLoaded', V2.init);
