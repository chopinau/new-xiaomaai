// 视频工作室 - 核心逻辑
// 复用画布配置（API_BASE / API_KEY），独立运作

const VS = (() => {
  // ============ 常量 ============
  const CHANNEL = (typeof appChannel === 'function' && appChannel() !== 'stable') ? `_${appChannel()}` : '';
  const WORKSPACE_KEY = `xiaoma_ai_v2_workspace${CHANNEL}`;
  const IMG_PREFIX = `xiaoma_ai_v2_img${CHANNEL}_`;
  const DB_NAME = (typeof appChannel !== 'function' || appChannel() === 'stable')
    ? 'pipeline_canvas_db'
    : `pipeline_canvas_db_${appChannel()}`;
  const STORE_NAME = 'images';
  const HISTORY_KEY = `xiaoma_video_studio_history${CHANNEL}`;

  // ============ IndexedDB 视频缓存 ============
  const VIDEO_CACHE_DB = 'xiaoma_video_cache';
  const VIDEO_CACHE_STORE = 'videos';

  function openVideoCacheDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(VIDEO_CACHE_DB, 1);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(VIDEO_CACHE_STORE)) {
          db.createObjectStore(VIDEO_CACHE_STORE, { keyPath: 'id' });
        }
      };
      req.onsuccess = (e) => resolve(e.target.result);
      req.onerror = (e) => reject(e.target.error);
    });
  }

  async function saveVideoToCache(taskId, blob) {
    try {
      const db = await openVideoCacheDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(VIDEO_CACHE_STORE, 'readwrite');
        tx.objectStore(VIDEO_CACHE_STORE).put({ id: taskId, blob, timestamp: Date.now() });
        tx.oncomplete = () => resolve();
        tx.onerror = (e) => reject(e.target.error);
      });
    } catch (e) {
      console.warn('保存视频到缓存失败:', e.message);
    }
  }

  async function getVideoFromCache(taskId) {
    try {
      const db = await openVideoCacheDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(VIDEO_CACHE_STORE, 'readonly');
        const req = tx.objectStore(VIDEO_CACHE_STORE).get(taskId);
        req.onsuccess = (e) => resolve(e.target.result ? e.target.result.blob : null);
        req.onerror = (e) => reject(e.target.error);
      });
    } catch (e) {
      return null;
    }
  }

  // ============ 创建预览视频（带本地缓存回退）============
  async function showVideoPreview(container, videoUrl, taskId, extraMsg) {
    container.innerHTML = '';
    // 优先尝试从缓存加载
    let blob = null;
    if (taskId) {
      blob = await getVideoFromCache(taskId);
    }
    if (blob) {
      const video = document.createElement('video');
      video.src = URL.createObjectURL(blob);
      video.controls = true;
      video.autoplay = true;
      video.loop = true;
      video.style.cssText = 'max-width:100%;max-height:100%';
      container.appendChild(video);
    } else {
      // 无缓存，通过 createPreviewVideo 加载远程 URL
      const div = createPreviewVideo(videoUrl, extraMsg);
      container.appendChild(div);
    }
  }

  // ============ 模型参数映射（经 API 验证）============
  const MODEL_PARAMS = {
    // 万相（阿里）
    'wan2.7-shouweizhen':   { imageType: 'images', has_resolution: true,  has_quality: false, durationOpts: ['3','6','9'] },
    'wan2.7-cankaosheng':   { imageType: 'images', has_resolution: true,  has_quality: false, durationOpts: ['3','6','9'] },
    // wan2.7-shouzheng: 404 不存在
    'wan2.6-shouweizhen':   { imageType: 'images', has_resolution: true,  has_quality: false, durationOpts: ['5','10'] },
    'wan2.6-cankaosheng':   { imageType: 'images', has_resolution: true,  has_quality: false, durationOpts: ['5','10'] },
    // wan2.6-shouzheng: 保留（img_url 参数不同）
    // wan2.5-cankaosheng: 404 不存在
    // wan2.2-animate-mix: 404 不存在
    // wan2.2-a14b-turbo: 404 不存在
    // Seedance（字节跳动）
    // Seedance 2.0 = kwvideo-v2
    'kwvideo-v2':           { imageType: 'images', has_resolution: true,  has_quality: false, durationOpts: ['4','5','6','8','10','12'] },
    // doubao-seedance-2-0-260128: 404 不存在
    // doubao-seedance-2-0-fast-260128: 404 不存在
    // 即梦 doubao-seedance-1-5-pro-251215 支持首尾帧模式（2张图片）
    'doubao-seedance-1-5-pro-251215': { imageType: 'images', has_resolution: false, has_quality: false, useSize: '720P', durationOpts: ['4','5','8','10','12'] },
    // doubao-seedance-1-5-pro-fast-251215: 404 不存在
    // doubao-seedance-1-0-pro-250528: 404 不存在
    // doubao-seedance-1-0-pro-fast-250528: 404 不存在
    // seedance-lite: 404 不存在
    // Sora（OpenAI）
    'sora-2':               { imageType: 'img_url', has_resolution: false, has_quality: false, durationOpts: ['4','8','12'] },
    // 可灵（快手）
    'kling-v3-video':       { imageType: 'images', has_resolution: false, has_quality: false, useMode: 'std', durationOpts: ['5','10','15'] },
    // kling-3-0-pro: 404 不存在
    // kling-3-0-standard: 404 不存在
    // kling-o3-4k: 404 不存在
    'kling-o3-pro':         { imageType: 'images', has_resolution: true,  has_quality: false, useMode: 'pro', durationOpts: ['5','10'] },
    // kling-o3-standard: 404 不存在
    // kling-2-6-i2v: 404 不存在
    'kling-v2-6':           { imageType: 'images', has_resolution: false, has_quality: false, useMode: 'std', durationOpts: ['5','10','15'] },
    'kling-motion-control': { imageType: 'images', has_resolution: false, has_quality: false, useMode: 'std', durationOpts: ['5','10'] },
    'kling-avatar-image2video': { imageType: 'images', has_resolution: false, has_quality: false, useMode: 'std', durationOpts: ['5','10'] },
    // 海螺（MiniMax）
    'hailuo-2.3':           { imageType: 'images', has_resolution: true,  has_quality: false, durationOpts: ['6','10'] },
    // hailuo-2.3-fast: 404 不存在
    // hailuo-02: 404 不存在
    // hailuo-02-pro: 404 不存在
    // Google Veo
    'veo3.1':               { imageType: 'images', has_resolution: false, has_quality: false, generationMode: 'pro', durationOpts: ['5','10'] },
    'veo3.1-lite':          { imageType: 'images', has_resolution: false, has_quality: false, generationMode: 'fast', veoQuality: 'sd', durationOpts: ['5','10'] },
    'veo3.1-4k':            { imageType: 'images', has_resolution: false, has_quality: false, generationMode: 'fast', durationOpts: ['5','8','10'] },
    // PixVerse
    'pixverse-v5.6-r2v':         { imageType: 'images', has_resolution: true,  has_quality: false, durationOpts: ['5','8','10'] },
    'pixverse-v5.6-shouweizhen': { imageType: 'images', has_resolution: true,  has_quality: false, durationOpts: ['5','8','10'] },
    // pixverse-v5.6-shouzheng: 404 不存在
    'pixverse-c1-shouweizhen':   { imageType: 'images', has_resolution: false, has_quality: false, durationOpts: ['5','8','10'] },
    'pixverse-c1-cankaosheng':   { imageType: 'images', has_resolution: false, has_quality: false, durationOpts: ['5','8','10'] },
    // pixverse-v5: 404 不存在
    // pixverse-v4-5: 404 不存在
    // Vidu
    // viduq2-pro: 404 不存在
    'viduq2-cankaosheng':  { imageType: 'images', has_resolution: true,  has_quality: false, durationOpts: ['5','10'] },
    // viduq2-turbo: 404 不存在
    // vidu-q1: 404 不存在
    'vidu-jieshuoman':     { imageType: 'images', has_resolution: false, has_quality: false, durationOpts: ['5','10'] },
    // 其他
    'grok-video-3':        { imageType: 'images', has_resolution: false, has_quality: false, useSize: '1080P', durationOpts: ['6','10'] },
    'grok-imagine-video-1.5-preview': { imageType: 'images', has_resolution: false, has_quality: false, durationOpts: ['5','6','10'] },
    // happyhorse-1.0: 404 不存在
  };

  // ============ 预设智能体数据 ============
  const AGENTS = [
    // ── 电商产品 ──
    {
      id: 'product-cinematic', name: '产品电影感展示', icon: '🎬', category: 'product',
      description: '适合电商产品的电影感运镜视频',
      source: { name: 'ComfyUI', url: 'https://github.com/comfyanonymous/ComfyUI' },
      presets: { model: 'kling-v3-video', aspect: '16:9', duration: '5', resolution: '1080P', quality: 'standard' },
      promptTemplate: '{userPrompt}, cinematic lighting, slow motion orbit, shallow depth of field, professional product photography, 4k quality',
      defaultPrompt: 'cinematic product showcase on clean studio background',
      referencePrompts: [
        { label: '⌚ 手表展示', prompt: 'Luxury watch on dark marble, spotlight revealing details, smooth rotation, premium feel' },
        { label: '🥤 饮料展示', prompt: 'Fresh juice poured into crystal glass with ice, splash droplets, bright studio lighting' },
        { label: '🎧 耳机展示', prompt: 'White earbuds floating against gradient background, holographic effects, tech reveal' }
      ],
      tips: '建议使用纯色背景以获得最佳效果'
    },
    {
      id: 'product-360', name: '产品360旋转', icon: '🔄', category: 'product',
      description: '产品360度旋转展示，适合电商主图',
      source: { name: 'Stable Video Diffusion', url: 'https://github.com/Stability-AI/generative-models' },
      presets: { model: 'wan2.7-shouweizhen', aspect: '1:1', duration: '6', resolution: '720P', quality: 'standard' },
      promptTemplate: '{userPrompt}, product rotating 360 degrees on turntable, smooth motion, studio lighting, clean background, 4k',
      defaultPrompt: 'product rotating 360 degrees on white background',
      referencePrompts: [
        { label: '👟 鞋子旋转', prompt: 'Sneaker rotating 360 on turntable, studio lighting, white background' },
        { label: '💄 香水旋转', prompt: 'Perfume bottle rotating slowly, soft lighting, gradient background' },
        { label: '📱 手机旋转', prompt: 'Smartphone rotating 360, sleek product shot, dark studio background' }
      ],
      tips: '建议使用白色或纯色背景'
    },
    {
      id: 'product-scene', name: '产品场景融入', icon: '🌄', category: 'product',
      description: '将产品融入真实场景的动态展示',
      source: { name: 'VideoCrafter', url: 'https://github.com/AILab-CVC/VideoCrafter' },
      presets: { model: 'pixverse-v5.6-r2v', aspect: '16:9', duration: '8', resolution: '720P', quality: 'standard' },
      promptTemplate: '{userPrompt}, product placed in natural environment, soft natural lighting, cinematic composition, depth of field',
      defaultPrompt: 'product in lifestyle scene, natural lighting',
      referencePrompts: [
        { label: '🪑 家具场景', prompt: 'Modern chair in sunlit living room, plants, warm tones, lifestyle' },
        { label: '🍳 厨具场景', prompt: 'Cookware set on kitchen counter, morning light, fresh ingredients' }
      ],
      tips: '选择与产品风格匹配的场景'
    },
    {
      id: 'product-compare', name: '产品对比展示', icon: '📊', category: 'product',
      description: '前后对比或多产品并列展示',
      source: { name: 'fal.ai', url: 'https://github.com/fal-ai-community/video-starter-kit' },
      presets: { model: 'viduq2-cankaosheng', aspect: '16:9', duration: '5', resolution: '720P', quality: 'standard' },
      promptTemplate: '{userPrompt}, split screen comparison, before and after, product demonstration, clean composition',
      defaultPrompt: 'before and after product comparison',
      referencePrompts: [
        { label: '🧹 清洁对比', prompt: 'Split screen before and after cleaning, dramatic transformation' },
        { label: '💡 亮度对比', prompt: 'Side by side comparison, dim vs bright lighting, product effectiveness' }
      ],
      tips: '确保两张素材构图一致'
    },
    {
      id: 'product-detail', name: '产品动态详情', icon: '📱', category: 'product',
      description: '竖屏产品详情视频，适合电商详情页',
      source: { name: 'GPTProto', url: 'https://github.com/GPTProto/ai-workflow' },
      presets: { model: 'hailuo-2.3', aspect: '9:16', duration: '6', resolution: '720P', quality: 'standard' },
      promptTemplate: '{userPrompt}, vertical product showcase, smooth camera movement, professional lighting, detail close-up, 4k',
      defaultPrompt: 'vertical product detail showcase',
      referencePrompts: [
        { label: '👗 服装展示', prompt: 'Vertical fashion showcase, model walking, smooth pan, studio lighting' },
        { label: '💎 珠宝展示', prompt: 'Vertical jewelry close-up, sparkling details, slow motion, luxury feel' }
      ],
      tips: '竖屏视频适合手机端展示'
    },
    // ── 创意艺术 ──
    {
      id: 'art-oil-painting', name: '油画风格动画', icon: '🎨', category: 'art',
      description: '将图片转为油画风格的动态视频',
      source: { name: 'AnimateDiff', url: 'https://github.com/Kosinkadink/ComfyUI-AnimateDiff-Evolved' },
      presets: { model: 'grok-video-3', aspect: '1:1', duration: '6', resolution: '1080P', quality: 'standard' },
      promptTemplate: '{userPrompt}, oil painting style, thick brushstrokes, rich textures, artistic, van gogh style, painterly',
      defaultPrompt: 'oil painting style landscape, artistic',
      referencePrompts: [
        { label: '🌅 风景油画', prompt: 'Sunset landscape in oil painting style, thick brushstrokes, warm colors' },
        { label: '🌸 花卉油画', prompt: 'Flower bouquet in oil painting style, impressionist, vibrant colors' },
        { label: '🏛️ 建筑油画', prompt: 'Historical building in oil painting style, classical, detailed textures' }
      ],
      tips: '适合艺术感和装饰性强的图片'
    },
    {
      id: 'art-ink-wash', name: '水墨风格视频', icon: '🖌️', category: 'art',
      description: '中国传统水墨画风格的动态效果',
      source: { name: 'ComfyUI', url: 'https://github.com/comfyanonymous/ComfyUI' },
      presets: { model: 'wan2.7-shouweizhen', aspect: '16:9', duration: '9', resolution: '720P', quality: 'standard' },
      promptTemplate: '{userPrompt}, Chinese ink wash painting style, brush strokes, flowing ink, traditional, zen, minimalist',
      defaultPrompt: 'Chinese ink wash painting, mountain and water',
      referencePrompts: [
        { label: '🏔️ 山水', prompt: 'Chinese ink wash landscape, misty mountains, flowing water, zen' },
        { label: '🎋 竹韵', prompt: 'Bamboo in ink wash style, gentle breeze, traditional aesthetic' }
      ],
      tips: '适合意境深远的山水或花鸟题材'
    },
    {
      id: 'art-cyberpunk', name: '赛博朋克风格', icon: '🌃', category: 'art',
      description: '霓虹灯效的赛博朋克风格视频',
      source: { name: 'VideoCrafter', url: 'https://github.com/AILab-CVC/VideoCrafter' },
      presets: { model: 'kling-v3-video', aspect: '16:9', duration: '5', resolution: '1080P', quality: 'standard' },
      promptTemplate: '{userPrompt}, cyberpunk style, neon lights, rain reflections, futuristic city, dark atmosphere, blade runner',
      defaultPrompt: 'cyberpunk city street at night, neon',
      referencePrompts: [
        { label: '🌆 城市夜景', prompt: 'Cyberpunk city street, neon signs reflecting on wet pavement, rain, futuristic' },
        { label: '🤖 赛博人像', prompt: 'Cyberpunk portrait, neon glow, holographic elements, futuristic aesthetic' },
        { label: '🚗 未来交通', prompt: 'Flying cars in cyberpunk city, neon lights, rain, night atmosphere' }
      ],
      tips: '适合城市夜景或科技感强的图片'
    },
    {
      id: 'art-anime', name: '动漫风格', icon: '🌸', category: 'art',
      description: '日式动漫风格的动态视频',
      source: { name: 'AnimateDiff', url: 'https://github.com/Kosinkadink/ComfyUI-AnimateDiff-Evolved' },
      presets: { model: 'pixverse-v5.6-shouweizhen', aspect: '16:9', duration: '8', resolution: '720P', quality: 'standard' },
      promptTemplate: '{userPrompt}, anime style, Studio Ghibli inspired, vibrant colors, cel shading, 2D animation aesthetic',
      defaultPrompt: 'anime style scene, vibrant colors',
      referencePrompts: [
        { label: '🌿 治愈系', prompt: 'Anime countryside scene, Ghibli style, warm sunlight, gentle breeze' },
        { label: '⚔️ 战斗系', prompt: 'Anime battle scene, dynamic action, speed lines, dramatic lighting' },
        { label: '🏫 校园系', prompt: 'Anime school scene, cherry blossoms, afternoon sunlight, nostalgic' }
      ],
      tips: '适合插画风格的图片'
    },
    // ── 人像人物 ──
    {
      id: 'portrait-cinematic', name: '人像电影感', icon: '👤', category: 'portrait',
      description: '人物肖像的电影感动态效果',
      source: { name: 'ComfyUI', url: 'https://github.com/comfyanonymous/ComfyUI' },
      presets: { model: 'kling-v3-video', aspect: '9:16', duration: '5', resolution: '1080P', quality: 'standard' },
      promptTemplate: '{userPrompt}, cinematic portrait, shallow depth of field, soft lighting, professional photography, film grain',
      defaultPrompt: 'cinematic portrait, soft natural lighting',
      referencePrompts: [
        { label: '🎭 情绪人像', prompt: 'Cinematic portrait, dramatic lighting, shallow depth of field, emotional' },
        { label: '☀️ 自然光', prompt: 'Portrait in golden hour, soft natural light, warm tones, cinematic' },
        { label: '⚫ 黑白人像', prompt: 'Black and white cinematic portrait, high contrast, dramatic shadows' }
      ],
      tips: '建议使用面部清晰的肖像照片'
    },
    {
      id: 'portrait-digital-human', name: '数字人介绍', icon: '🤖', category: 'portrait',
      description: '数字人/虚拟主播的自我介绍视频',
      source: { name: 'fal.ai', url: 'https://github.com/fal-ai-community/video-starter-kit' },
      presets: { model: 'kling-avatar-image2video', aspect: '9:16', duration: '10', resolution: '720P', quality: 'standard' },
      promptTemplate: '{userPrompt}, digital human presentation, professional, talking head, studio lighting, clean background',
      defaultPrompt: 'digital human introduction, professional presentation',
      referencePrompts: [
        { label: '🎙️ 产品介绍', prompt: 'Digital presenter introducing product, professional, studio lighting' },
        { label: '📢 品牌宣讲', prompt: 'Digital spokesperson, brand presentation, confident, professional' }
      ],
      tips: '适合数字人形象的头像图片'
    },
    {
      id: 'portrait-dynamic', name: '人物动态展示', icon: '🏃', category: 'portrait',
      description: '人物动作姿态的动态视频',
      source: { name: 'Stable Video Diffusion', url: 'https://github.com/Stability-AI/generative-models' },
      presets: { model: 'wan2.7-shouweizhen', aspect: '16:9', duration: '6', resolution: '720P', quality: 'standard' },
      promptTemplate: '{userPrompt}, dynamic movement, natural motion, flowing clothes, cinematic, slow motion effect',
      defaultPrompt: 'person walking dynamically, cinematic',
      referencePrompts: [
        { label: '💃 舞蹈', prompt: 'Dancer spinning, flowing dress, dramatic lighting, slow motion' },
        { label: '🏃 奔跑', prompt: 'Person running in slow motion, dynamic pose, cinematic background' }
      ],
      tips: '选择有动态姿态的人物图片'
    },
    // ── 特殊效果 ──
    {
      id: 'effect-transition', name: '首尾帧过渡', icon: '✨', category: 'effect',
      description: '两张图片之间的平滑过渡动画',
      source: { name: 'ComfyUI', url: 'https://github.com/comfyanonymous/ComfyUI' },
      presets: { model: 'wan2.7-shouweizhen', aspect: '16:9', duration: '6', resolution: '720P', quality: 'standard' },
      promptTemplate: '{userPrompt}, smooth transition between scenes, morphing effect, seamless, fluid animation',
      defaultPrompt: 'smooth scene transition, morphing',
      referencePrompts: [
        { label: '🌄 场景过渡', prompt: 'Smooth transition from day to night, time lapse effect, seamless' },
        { label: '🎭 风格过渡', prompt: 'Transition from realistic to painting style, morphing effect, artistic' }
      ],
      tips: '需要提供首尾两张图片作为素材'
    },
    {
      id: 'effect-style-transfer', name: '参考图风格迁移', icon: '🎭', category: 'effect',
      description: '将参考图的风格应用到目标图片',
      source: { name: 'VideoCrafter', url: 'https://github.com/AILab-CVC/VideoCrafter' },
      presets: { model: 'pixverse-v5.6-r2v', aspect: '1:1', duration: '8', resolution: '720P', quality: 'standard' },
      promptTemplate: '{userPrompt}, style transfer, artistic filter, consistent style, vibrant, creative',
      defaultPrompt: 'artistic style transfer, creative',
      referencePrompts: [
        { label: '🎨 油画迁移', prompt: 'Style transfer to oil painting, artistic filter, rich textures' },
        { label: '🖼️ 水彩迁移', prompt: 'Style transfer to watercolor, soft colors, artistic, flowing' }
      ],
      tips: '提供风格参考图效果更佳'
    },
    {
      id: 'effect-extension', name: '视频延展', icon: '📐', category: 'effect',
      description: '延展视频画面边界，扩展视野',
      source: { name: 'Stable Video Diffusion', url: 'https://github.com/Stability-AI/generative-models' },
      presets: { model: 'wan2.7-xuxie', aspect: '16:9', duration: '10', resolution: '720P', quality: 'standard' },
      promptTemplate: '{userPrompt}, extend video frame, expand view, wider angle, seamless extension, cinematic',
      defaultPrompt: 'extend video frame, wider view',
      referencePrompts: [
        { label: '🏞️ 风景延展', prompt: 'Extend landscape view, wider angle, seamless, natural' },
        { label: '🏠 室内延展', prompt: 'Extend interior view, reveal more space, seamless expansion' }
      ],
      tips: '需要视频素材作为输入'
    }
  ];

  // ============ 状态 ============
  let state = {
    assets: [],
    selectedIds: [],    // 多选：首尾帧模式选2张，普通模式选1张
    selectedId: null,   // 兼容旧代码：单选的最后选中项
    history: [],
    historyFilter: 'all',
    historySearch: '',
    config: null,
    isGenerating: false,
    selectedAgentId: null,
    agentCategory: 'all',
    // 任务池(购物车) - 累积式
    taskPool: [],
    // 模式: single(单视频) / batch(批量) / agent(智能体)
    mode: 'single',
    // 批量模式下每次加入创建的任务数 (1-5)
    batchNum: 1
  };

  // ============ DOM ============
  const $ = id => document.getElementById(id);
  const els = {
    assetGrid: $('vs-asset-grid'),
    assetCount: $('vs-asset-count'),
    assetFilter: $('vs-asset-filter'),
    refresh: $('vs-refresh'),
    clearHistory: $('vs-clear-history'),
    previewStage: $('vs-preview-stage'),
    download: $('vs-download'),
    taskLink: $('vs-task-link'),
    model: $('vs-model'),
    aspect: $('vs-aspect'),
    duration: $('vs-duration'),
    resolution: $('vs-resolution'),
    quality: $('vs-quality'),
    prompt: $('vs-prompt'),
    generate: $('vs-generate'),
    status: $('vs-status'),
    historyList: $('vs-history-list'),
    toast: $('vs-toast'),
    agentBar: $('vs-agent-bar'),
    agentCategories: $('vs-agent-categories'),
    agentChips: $('vs-agent-chips'),
    agentInfo: $('vs-agent-info'),
    agentSuffix: $('vs-agent-suffix'),
    refPrompts: $('vs-ref-prompts'),
    clearAgent: $('vs-clear-agent'),
    manageAgent: $('vs-manage-agent'),
    // 批量
    batchBar: $('vs-batch-bar'),
    selectAll: $('vs-select-all'),
    batchCount: $('vs-batch-count'),
    batchGenerate: $('vs-batch-generate'),
    batchBoard: $('vs-batch-board'),
    batchProgress: $('vs-batch-progress'),
    batchTaskList: $('vs-batch-task-list'),
    batchDownloadAll: $('vs-batch-download-all'),
    batchClose: $('vs-batch-close'),
    // 任务池(购物车)
    taskPool: $('vs-task-pool'),
    taskPoolGrid: $('vs-task-pool-grid'),
    taskPoolCount: $('vs-task-pool-count'),
    taskPoolBadge: $('vs-task-pool-badge'),
    taskPoolRun: $('vs-task-pool-run'),
    taskPoolClear: $('vs-task-pool-clear'),
    // 模式 + 数量
    modeTabs: $('vs-mode-tabs'),
    batchCountGroup: $('vs-batch-count-group'),
    batchNum: $('vs-batch-num'),
    numMinus: $('vs-num-minus'),
    numPlus: $('vs-num-plus'),
    // 下载弹窗
    dlModal: $('vs-download-modal'),
    dlPreview: $('vs-dl-preview'),
    dlFilename: $('vs-dl-filename'),
    dlMeta: $('vs-dl-meta'),
    dlConfirm: $('vs-dl-confirm'),
    dlShare: $('vs-dl-share'),
    dlClose: $('vs-dl-close'),
    // 历史
    historySearch: $('vs-history-search'),
    historyFilters: $('vs-history-filters'),
    historyModal: $('vs-history-modal'),
    historyClose: $('vs-history-close'),
    openHistory: $('vs-open-history'),
    historyMini: $('vs-history-mini'),
    // 音频
    soundField: $('vs-sound-field'),
    sound: $('vs-sound')
  };

  // ============ 工具 ============
  function isFirstLastFrameModel(model) {
    return /shouweizhen|first.*last|首尾帧|veo3\.1-4k|doubao-seedance-1-5-pro-251215/i.test(model);
  }

  function toast(msg, type = 'info', duration = 3000) {
    els.toast.textContent = msg;
    els.toast.className = 'vs-toast show ' + type;
    setTimeout(() => { els.toast.className = 'vs-toast'; }, duration);
  }

  function setStatus(text, type = '') {
    els.status.textContent = text;
    els.status.className = 'vs-status' + (type ? ' ' + type : '');
  }

  function escapeHtml(s) {
    return String(s).replace(/[<>&"']/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function formatTime(ts) {
    const d = new Date(ts);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 86400000);
    if (d >= today) return '今天 ' + d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    if (d >= yesterday) return '昨天 ' + d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString('zh-CN') + ' ' + d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  }

  function getDateGroup(ts) {
    const d = new Date(ts);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 86400000);
    if (d >= today) return '今天';
    if (d >= yesterday) return '昨天';
    return d.toLocaleDateString('zh-CN');
  }

  // ============ IndexedDB（复用画布协议）============
  function openDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onerror = () => reject(req.error);
      req.onsuccess = () => resolve(req.result);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
    });
  }

  async function dbGet(key) {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const req = tx.objectStore(STORE_NAME).get(key);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      return null;
    }
  }

  // ============ 加载画布素材 ============
  async function loadAssets() {
    setStatus('正在加载画布素材...', 'running');

    let raw = null;
    try { raw = await dbGet(WORKSPACE_KEY); } catch (_) {}
    if (!raw) raw = localStorage.getItem(WORKSPACE_KEY);
    if (!raw) {
      state.assets = [];
      renderAssets();
      setStatus('未找到画布工作区数据。请先在画布里生成或上传图片。', 'error');
      return;
    }
    let workspace;
    try {
      workspace = typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch (e) {
      setStatus('画布数据解析失败', 'error');
      return;
    }

    const nodes = [...(workspace.nodes || []), ...(workspace.trash || [])].filter(n =>
      (n.type === 'image' && n.image) ||
      (n.type === 'generate' && n.output) ||
      (n.type === 'sketch' && (n.image || n.sketch?.image))
    );

    const assets = [];
    for (const node of nodes) {
      let dataUrl = '';
      let lk888Url = '';

      if (node.type === 'image' || node.type === 'sketch') {
        if (node.image && node.image.startsWith('data:')) {
          dataUrl = node.image;
        } else if (node.image && node.image.startsWith('__v2_image_')) {
          const key = IMG_PREFIX + node.id + '_image';
          dataUrl = await dbGet(key) || '';
        }
        if (node.type === 'sketch') {
          lk888Url = node.sketch?.resultUrl || '';
        }
      } else if (node.type === 'generate') {
        if (node.output && node.output.startsWith('data:')) {
          dataUrl = node.output;
        } else if (node.output && node.output.startsWith('__v2_output_')) {
          const key = IMG_PREFIX + node.id + '_output';
          dataUrl = await dbGet(key) || '';
        }
        const versions = node.versions || [];
        const activeVer = versions.find(v => v.id === node.activeVersionId) || versions[versions.length - 1];
        lk888Url = activeVer?.remoteUrl || '';
      }
      if (!dataUrl) continue;

      const thumb = await makeThumb(dataUrl);

      assets.push({
        id: node.id,
        nodeType: node.type,
        title: node.title || node.alias || node.id.slice(-6),
        prompt: extractPromptFromNode(node),
        dataUrl,
        lk888Url,
        thumbDataUrl: thumb,
        timestamp: node.updatedAt || Date.now()
      });
    }

    state.assets = assets;
    renderAssets();
    setStatus(`已加载 ${assets.length} 张素材`, 'success');
  }

  // 从视频URL提取最后一帧，返回 base64 dataUrl
  async function extractLastFrame(videoUrl) {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.muted = true;
      video.preload = 'auto';
      video.src = videoUrl;
      video.onerror = function() {
        console.warn('extractLastFrame: \u89C6\u9891\u52A0\u8F7D\u5931\u8D25\uFF08\u53EF\u80FD\u662F CORS \u6216\u94FE\u63A5\u5DF2\u8FC7\u671F\uFF09', videoUrl.slice(0, 80));
        resolve(null);
      };

      video.addEventListener('loadeddata', () => {
        if (video.duration && isFinite(video.duration)) {
          video.currentTime = Math.max(0, video.duration - 0.1); // 倒数第0.1秒
        } else {
          video.currentTime = 0;
        }
      });

      video.addEventListener('seeked', () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth || 720;
          canvas.height = video.videoHeight || 1280;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        } catch {
          resolve('');
        }
        video.remove();
      });

      video.addEventListener('error', () => { resolve(''); video.remove(); });

      // 超时保护
      setTimeout(() => { resolve(''); video.remove(); }, 15000);
    });
  }

  // 将最后一帧加入素材库，并在预览区下方显示明显的卡片
  async function addLastFrameToAssets(videoUrl, sourceTitle) {
    const dataUrl = await extractLastFrame(videoUrl);
    if (!dataUrl) return;

    const id = 'frame_' + Date.now();
    const thumb = await makeThumb(dataUrl);
    const asset = {
      id,
      nodeType: 'generate',
      title: `尾帧-${sourceTitle || '视频'}-${new Date().toLocaleTimeString()}`,
      prompt: '',
      dataUrl,
      lk888Url: '',
      thumbDataUrl: thumb,
      timestamp: Date.now()
    };
    state.assets.push(asset);
    renderAssets();

    // 在视频预览区下方显示最后一帧卡片
    showLastFrameCard(asset);

    toast('已提取视频最后一帧，可作为下一段首帧使用', 'success', 4000);
  }

  // 在预览区下方显示最后一帧卡片
  function showLastFrameCard(asset) {
    // 移除旧卡片
    const old = document.getElementById('vs-last-frame-card');
    if (old) old.remove();

    const card = document.createElement('div');
    card.id = 'vs-last-frame-card';
    card.className = 'vs-last-frame-card';
    card.innerHTML = `
      <div class="vs-last-frame-inner">
        <div class="vs-last-frame-icon"></div>
        <div class="vs-last-frame-info">
          <div class="vs-last-frame-title">已提取最后一帧</div>
          <div class="vs-last-frame-sub">可作为下一段视频的首帧，实现连贯衔接</div>
        </div>
        <div class="vs-last-frame-thumb">
          <img src="${asset.thumbDataUrl}" alt="最后一帧" />
        </div>
        <button class="vs-last-frame-btn" data-use-as-first="${asset.id}">用作首帧 →</button>
      </div>
    `;

    // 插入到预览区和工具栏之间
    const previewContainer = els.previewStage?.parentElement;
    const toolbar = previewContainer?.querySelector('.vs-preview-toolbar');
    if (previewContainer) {
      if (toolbar) {
        previewContainer.insertBefore(card, toolbar);
      } else {
        previewContainer.appendChild(card);
      }
    } else {
      document.body.appendChild(card);
    }

    // 点击"用作首帧"按钮
    card.querySelector('.vs-last-frame-btn').addEventListener('click', () => {
      // 清除当前选中
      state.selectedIds = [asset.id];
      state.selectedId = asset.id;
      renderAssets();
      toast('已将最后一帧设为首帧，请再选一张尾帧', 'success');
      card.remove();
    });

    // 5秒后自动隐藏（但素材仍在库中）
    setTimeout(() => {
      if (card.parentElement) {
        card.style.opacity = '0';
        card.style.transform = 'translateY(-10px)';
        setTimeout(() => card.remove(), 300);
      }
    }, 8000);
  }

  function extractPromptFromNode(node) {
    if (node.type === 'generate') {
      return node.settings?.prompt || node.prompt || node.compiledPrompt || node.versions?.[0]?.prompt || '';
    }
    if (node.type === 'sketch') {
      return node.sketch?.preservedSubjectHint || '';
    }
    return '';
  }

  function makeThumb(dataUrl, max = 240) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const ratio = Math.min(max / img.width, max / img.height, 1);
        const w = Math.round(img.width * ratio);
        const h = Math.round(img.height * ratio);
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        try { resolve(canvas.toDataURL('image/jpeg', 0.7)); }
        catch (e) { resolve(dataUrl); }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  }

  // ============ 渲染素材库 ============
  function renderAssets() {
    const filter = els.assetFilter.value;
    const list = state.assets.filter(a => filter === 'all' || a.nodeType === filter);
    els.assetCount.textContent = list.length;

    if (!list.length) {
      els.assetGrid.innerHTML = '<div class="vs-empty">暂无素材<br/><span>请先在画布中生成或上传图片</span></div>';
      return;
    }

    const model = els.model.value;
    const isFL = isFirstLastFrameModel(model);
    const maxSelect = isFL ? 2 : 1;

    els.assetGrid.innerHTML = list.map(a => {
      const isSelected = state.selectedIds.includes(a.id);
      const inPool = state.taskPool.some(t => t.assetId === a.id);
      const typeLabel = { generate: '生图', image: '本地图', sketch: '分层' }[a.nodeType] || a.nodeType;
      const badge = a.lk888Url ? '<span class="vs-asset-badge lk888">🔗</span>' : '';
      const tempBadge = a.id.startsWith('frame_') ? '<span class="vs-asset-badge temp">临时</span>' : '';
      const addBtnClass = inPool ? 'added' : '';
      const addBtnText = inPool ? '✓' : '+';
      const addBtnTitle = inPool ? '已加入任务池(点击移出)' : '加入任务池';
      // 首尾帧模式：标注第几张
      let frameLabel = '';
      if (isFL && isSelected) {
        const idx = state.selectedIds.indexOf(a.id);
        frameLabel = idx === 0 ? '<span class="vs-frame-label first">首帧</span>' : '<span class="vs-frame-label last">尾帧</span>';
      }
      return `
        <div class="vs-asset-card${isSelected ? ' selected' : ''}" data-id="${a.id}">
          <img src="${a.thumbDataUrl}" alt="${a.title}" loading="lazy" />
          ${frameLabel}
          <div class="vs-asset-meta">
            <span class="vs-asset-type ${a.nodeType}">${typeLabel}</span>
            <span>${a.title.slice(0, 8)}</span>
          </div>
          ${badge}
          ${tempBadge}
          <button class="vs-asset-add-btn ${addBtnClass}" data-id="${a.id}" title="${addBtnTitle}">${addBtnText}</button>
        </div>
      `;
    }).join('');

    // 事件绑定
    els.assetGrid.querySelectorAll('.vs-asset-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.vs-asset-add-btn')) return;
        const id = card.dataset.id;
        if (isFL) {
          // 首尾帧模式：多选，最多2张
          const idx = state.selectedIds.indexOf(id);
          if (idx >= 0) {
            state.selectedIds.splice(idx, 1);
          } else if (state.selectedIds.length < 2) {
            state.selectedIds.push(id);
          } else {
            toast('首尾帧模式最多选2张图片', 'warning');
            return;
          }
          state.selectedId = state.selectedIds[0] || null;
        } else {
          // 普通模式：单选
          state.selectedIds = [id];
          state.selectedId = id;
        }
        const asset = state.assets.find(a => a.id === state.selectedId);
        if (asset) {
          if (isFL && state.selectedIds.length === 2) {
            const first = state.assets.find(a => a.id === state.selectedIds[0]);
            const last = state.assets.find(a => a.id === state.selectedIds[1]);
            els.previewStage.innerHTML = `<div class="vs-dual-preview">
              <div class="vs-dual-frame"><span class="vs-dual-label">首帧</span><img src="${first.dataUrl}" alt="首帧" /></div>
              <div class="vs-dual-frame"><span class="vs-dual-label">尾帧</span><img src="${last.dataUrl}" alt="尾帧" /></div>
            </div>`;
          } else if (isFL && state.selectedIds.length === 1) {
            els.previewStage.innerHTML = `<img src="${asset.dataUrl}" alt="${asset.title}" /><div class="vs-frame-hint">请再选一张作为${state.selectedIds.length === 0 ? '首帧' : '尾帧'}</div>`;
          } else {
            els.previewStage.innerHTML = `<img src="${asset.dataUrl}" alt="${asset.title}" />`;
          }
          els.generate.disabled = false;
          els.download.disabled = true;
          els.taskLink.style.display = 'none';
        }
        renderAssets();
        applyModelSettings(els.model.value);
      });
    });
    els.assetGrid.querySelectorAll('.vs-asset-add-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleTaskPool(btn.dataset.id);
      });
    });

    // 首尾帧模式提示
    const hint = els.assetGrid.parentElement.querySelector('.vs-fl-hint');
    if (isFL) {
      if (!hint) {
        const div = document.createElement('div');
        div.className = 'vs-fl-hint';
        div.textContent = `首尾帧模式：请选择2张图片（已选 ${state.selectedIds.length}/2）`;
        els.assetGrid.parentElement.insertBefore(div, els.assetGrid);
      } else {
        hint.textContent = `首尾帧模式：请选择2张图片（已选 ${state.selectedIds.length}/2）`;
      }
    } else {
      if (hint) hint.remove();
    }
  }

  // ============ 任务池(购物车) ============
  // 智能体模式: 每个智能体点击时调用, agentId 决定是否允许同素材并存
  function addTaskToPool(assetId, opts = {}) {
    const asset = state.assets.find(a => a.id === assetId);
    if (!asset) return false;
    const model = opts.model || els.model.value;
    const cfg = MODEL_PARAMS[model] || {};
    if (cfg.noImageMode) {
      toast('当前模型需要上传视频，不支持图生视频', 'error');
      return false;
    }

    // 同素材去重: 单视频/批量模式拒绝；智能体模式允许(因为不同智能体就是不同任务)
    const alreadyIn = state.taskPool.find(t => t.assetId === assetId);
    if (alreadyIn && state.mode !== 'agent') {
      toast('该素材已在任务池，请删除后再加', 'warning');
      return false;
    }

    const prompt = opts.prompt || els.prompt.value.trim();
    const agent = AGENTS.find(a => a.id === (opts.agentId || state.selectedAgentId));
    const finalPrompt = agent ? agent.promptTemplate.replace('{userPrompt}', prompt || agent.defaultPrompt || '') : prompt;

    const newTask = {
      id: 'pool_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      assetId,
      asset,
      model,
      prompt: finalPrompt,
      aspect: opts.aspect || els.aspect.value,
      duration: opts.duration || els.duration.value,
      resolution: opts.resolution || els.resolution.value,
      quality: opts.quality || els.quality.value,
      agentId: opts.agentId || state.selectedAgentId,
      agentName: agent?.name || '',
      status: 'pending',
      progress: 0,
      taskId: '',
      videoUrl: '',
      error: '',
      addedAt: Date.now()
    };
    state.taskPool.push(newTask);
    return true;
  }

  // 主入口: 智能体模式下应调用 addTaskToPool + agentId, 单/批模式用 toggleTaskPool
  function toggleTaskPool(assetId) {
    const existing = state.taskPool.find(t => t.assetId === assetId);
    if (existing) {
      // 已存在 → 删除（单/批模式）
      if (existing.status === 'running') {
        toast('任务已提交API，无法移除', 'warning');
        return;
      }
      state.taskPool = state.taskPool.filter(t => t.id !== existing.id);
      toast(`已移出任务池`, 'info', 1500);
    } else {
      // 不存在 → 按当前模式决定添加数量
      const count = (state.mode === 'batch') ? state.batchNum : 1;
      let added = 0;
      for (let i = 0; i < count; i++) {
        // 多个任务需要不同 ID 后缀避免冲突
        if (addTaskToPool(assetId)) added++;
        else break;  // 同素材已存在则中断
      }
      if (added > 0) {
        const asset = state.assets.find(a => a.id === assetId);
        toast(`已加入 ${added} 个任务: ${asset.title.slice(0, 12)}`, 'success', 1500);
      }
    }
    renderTaskPool();
    renderAssets();
  }

  function renderTaskPool() {
    const pool = state.taskPool;
    els.taskPoolCount.textContent = pool.length;
    els.taskPoolBadge.textContent = `🛒 ${pool.length}`;
    const pendingCount = pool.filter(t => t.status === 'pending').length;
    els.taskPoolRun.disabled = pendingCount === 0;
    els.taskPoolRun.textContent = pendingCount > 0 ? `▶ 开始生成 (${pendingCount})` : '▶ 开始生成';

    if (!pool.length) {
      els.taskPoolGrid.innerHTML = '<div class="vs-empty-small" style="grid-column:1/-1;padding:8px 0;color:var(--vs-text-muted)">点击素材的 ➕ 按钮添加任务</div>';
      return;
    }

    els.taskPoolGrid.innerHTML = pool.map(t => {
      const thumb = t.asset?.thumbDataUrl || t.asset?.dataUrl || '';
      const lock = t.status === 'running' ? '<span class="vs-pool-item-lock">🔒</span>' : '';
      const prog = (t.status === 'running' || t.status === 'pending')
        ? `<div class="vs-pool-item-progress"><div style="width:${t.progress}%"></div></div>`
        : '';
      const statusIcon = { running: '🎬', completed: '✅', failed: '❌', pending: '⏳' }[t.status] || '⏳';
      return `
        <div class="vs-pool-item ${t.status}" data-id="${t.id}" title="${escapeHtml(t.asset?.title || '')} · ${t.status}${t.status === 'running' ? '（已提交，参数锁定）' : ''}">
          <img src="${thumb}" alt="" />
          ${t.status === 'completed' && t.videoUrl ? `<video src="${t.videoUrl}" muted loop></video>` : ''}
          ${lock}${prog}
          <button class="vs-pool-item-del" data-id="${t.id}">✕</button>
          <div style="position:absolute;top:1px;left:1px;font-size:10px;background:rgba(0,0,0,0.5);color:#fff;padding:1px 3px;border-radius:3px">${statusIcon}</div>
        </div>
      `;
    }).join('');

    // 缩略图点击 - 预览/选中
    els.taskPoolGrid.querySelectorAll('.vs-pool-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.closest('.vs-pool-item-del')) return;
        const t = state.taskPool.find(x => x.id === item.dataset.id);
        if (!t) return;
        if (t.status === 'completed' && t.videoUrl) {
          els.previewStage.innerHTML = '';
          showVideoPreview(els.previewStage, t.videoUrl, t.id);
          els.download.disabled = false;
          els.download.onclick = () => showDownloadModal(t.videoUrl, `xiaoma-video-${Date.now()}.mp4`);
        } else {
          // pending - 选中该任务，把参数填回表单
          els.model.value = t.model;
          els.aspect.value = t.aspect;
          els.duration.value = t.duration;
          els.resolution.value = t.resolution;
          els.quality.value = t.quality;
          if (t.prompt) els.prompt.value = t.prompt;
          applyModelSettings(t.model);
          if (t.asset) {
            state.selectedId = t.assetId;
            els.previewStage.innerHTML = `<img src="${t.asset.dataUrl}" alt="${t.asset.title}" />`;
          }
          renderAssets();
        }
      });
    });
    // 删除按钮
    els.taskPoolGrid.querySelectorAll('.vs-pool-item-del').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const t = state.taskPool.find(x => x.id === btn.dataset.id);
        if (t && t.status === 'running') {
          toast('任务已提交API，无法移除', 'warning');
          return;
        }
        state.taskPool = state.taskPool.filter(x => x.id !== btn.dataset.id);
        renderTaskPool();
        renderAssets();
      });
    });
  }

  function clearTaskPool() {
    const locked = state.taskPool.filter(t => t.status === 'running').length;
    const pending = state.taskPool.filter(t => t.status !== 'running').length;
    if (!pending && !locked) return;
    if (!confirm(`确认清空任务池？\n待执行: ${pending} 个\n运行中(保留): ${locked} 个`)) return;
    state.taskPool = state.taskPool.filter(t => t.status === 'running');
    renderTaskPool();
    renderAssets();
    toast('任务池已清空（运行中任务保留）', 'info');
  }

  async function runTaskPool() {
    const pending = state.taskPool.filter(t => t.status === 'pending');
    if (!pending.length) return;

    const totalCost = pending.length;
    if (!confirm(`即将提交 ${totalCost} 个视频任务到小马AI。\n\n提交后将开始扣费，请确认。`)) return;

    if (!els.config) {
      els.config = await getCanvasConfig();
    }

    els.taskPoolRun.disabled = true;
    const CONCURRENCY = 3;
    let cursor = 0;
    const queue = [...pending];

    const runOne = async () => {
      while (queue.length) {
        const t = queue.shift();
        if (!t) break;
        const idx = state.taskPool.findIndex(x => x.id === t.id);
        if (idx < 0) continue;
        const task = state.taskPool[idx];

        task.status = 'running';
        task.progress = 10;
        renderTaskPool();

        try {
          const publicUrl = await getPublicUrl(task.asset);
          const params = buildParams(task.model, publicUrl);
          task.progress = 30;
          renderTaskPool();

          const { taskId } = await submitVideoTask({ model: task.model, prompt: task.prompt, params });
          task.taskId = taskId;
          task.progress = 50;
          renderTaskPool();

          // 存历史
          saveHistory({
            taskId, prompt: task.prompt, model: task.model, params,
            sourceAssetTitle: task.asset?.title || '',
            timestamp: Date.now(), status: 'running', videoUrl: '', error: ''
          });

          // 轮询
          const result = await pollVideoTask(taskId);
          if (result.completed && result.resultUrl) {
            task.status = 'completed';
            task.videoUrl = result.resultUrl;
            task.progress = 100;
            updateHistoryItem(taskId, { status: 'completed', videoUrl: result.resultUrl });
            // 自动提取最后一帧加入素材库（用于首尾帧衔接）
            if (isFirstLastFrameModel(task.model)) {
              addLastFrameToAssets(result.resultUrl, task.asset?.title || '');
            }
          } else if (result.completed && result.error) {
            task.status = 'failed';
            task.error = result.error;
            updateHistoryItem(taskId, { status: 'failed', error: result.error });
          } else if (result.timedOut) {
            task.status = 'timeout';
            task.error = '轮询超时，后台抓取';
            updateHistoryItem(taskId, { status: 'timeout', error: task.error });
          }
        } catch (e) {
          task.status = 'failed';
          task.error = e.message;
        }
        renderTaskPool();
      }
    };

    // 启动 N 个并发
    const workers = [];
    for (let i = 0; i < Math.min(CONCURRENCY, queue.length); i++) {
      workers.push(runOne());
    }
    await Promise.all(workers);

    toast(`任务池完成！${state.taskPool.filter(t => t.status === 'completed').length} 个成功`, 'success', 4000);
    renderTaskPool();
  }

  // ============ 根据模型更新参数面板 ============
  function applyModelSettings(model) {
    const cfg = MODEL_PARAMS[model] || { imageType: 'images', has_resolution: false, has_quality: false, durationOpts: ['5','10'] };

    const currentDuration = els.duration.value;
    const durationOpts = cfg.durationOpts || ['5','10'];
    const durationLabels = {
      '3': '3 秒', '4': '4 秒', '5': '5 秒', '6': '6 秒',
      '8': '8 秒', '9': '9 秒', '10': '10 秒',
      '12': '12 秒', '15': '15 秒', '20': '20 秒'
    };
    els.duration.innerHTML = durationOpts.map(v =>
      `<option value="${v}"${v === currentDuration && durationOpts.includes(currentDuration) ? ' selected' : ''}>${durationLabels[v] || v + ' 秒'}</option>`
    ).join('');

    els.resolution.parentElement.style.display = cfg.has_resolution ? '' : 'none';

    if (cfg.useVeoQuality || cfg.veoQuality || cfg.generationMode) {
      els.quality.parentElement.style.display = 'none';
    } else {
      els.quality.parentElement.style.display = cfg.has_quality ? '' : 'none';
    }

    // 音频：所有模型都显示
    els.soundField.style.display = '';
  }

  // ============ 从画布配置获取 URL + API Key ============
  function getCanvasConfig() {
    const candidates = ['xiaoma_ai_config', 'xiaoma-canvas-config', 'xiaoma_api_config'];
    for (const key of candidates) {
      const raw = localStorage.getItem(key);
      if (raw) {
        try {
          const obj = JSON.parse(raw);
          if (obj.apiBase && obj.apiKey) return obj;
        } catch (e) {}
      }
    }
    return {
      apiBase: 'https://api.lk888.ai',
      apiKey: 'sk-058b716a8bf05335cb0689624f86130d504b97c85197d849'
    };
  }

  // ============ 图片上传（多通道备用）============
  const CATBOX_PROXY = 'https://api.xiaomaai.net/upload';
  const CATBOX_DIRECT = 'https://catbox.moe/user/api.php';
  const _vsCatboxCache = new Map();

  // 备用上传服务（优先级从高到低）
  const UPLOAD_SERVICES = [
    // 1. 本地 Next.js 代理（开发环境，同源无 CORS）
    {
      name: 'local-proxy',
      url: '/api/upload',
      type: 'catbox',
      timeout: 60000,
    },
    // 2. catbox 代理（Cloudflare Worker，生产环境）
    {
      name: 'catbox-proxy',
      url: CATBOX_PROXY,
      type: 'catbox',
      timeout: 30000,
    },
    // 3. 直连 catbox（兜底，可能被 CORS 拦截）
    {
      name: 'catbox-direct',
      url: CATBOX_DIRECT,
      type: 'catbox',
      timeout: 30000,
    },
  ];

  async function dataUrlToBlob(dataUrl) {
    const r = await fetch(dataUrl);
    return await r.blob();
  }

  async function compressBlobIfLarge(blob, maxSide = 2048) {
    if (!blob || !/^image\//.test(blob.type || '')) return blob;
    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const fr = new FileReader();
        fr.onload = () => resolve(fr.result);
        fr.onerror = () => reject(fr.error);
        fr.readAsDataURL(blob);
      });
      const img = await new Promise((resolve, reject) => {
        const i = new Image();
        i.onload = () => resolve(i);
        i.onerror = () => reject(new Error('图片解码失败'));
        i.src = dataUrl;
      });
      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;
      const maxDim = Math.max(w, h);
      if (maxDim <= maxSide) return blob;
      const ratio = maxSide / maxDim;
      const nw = Math.max(1, Math.round(w * ratio));
      const nh = Math.max(1, Math.round(h * ratio));
      const canvas = document.createElement('canvas');
      canvas.width = nw; canvas.height = nh;
      canvas.getContext('2d').drawImage(img, 0, 0, nw, nh);
      const compressedDataUrl = canvas.toDataURL('image/png');
      const r = await fetch(compressedDataUrl);
      return await r.blob();
    } catch (e) {
      return blob;
    }
  }

  async function uploadDataUrlToCatbox(dataUrl, attempts = 3) {
    if (_vsCatboxCache.has(dataUrl)) return _vsCatboxCache.get(dataUrl);

    // 优先使用已有的 ensureCatboxPublicUrl
    if (typeof ensureCatboxPublicUrl === 'function') {
      try {
        const url = await ensureCatboxPublicUrl(dataUrl, { ttl: '24h' });
        _vsCatboxCache.set(dataUrl, url);
        return url;
      } catch (e) {
        console.warn('ensureCatboxPublicUrl 失败，尝试其他服务:', e.message);
      }
    }

    let blob = await dataUrlToBlob(dataUrl);
    blob = await compressBlobIfLarge(blob);

    // 依次尝试所有上传服务
    for (const svc of UPLOAD_SERVICES) {
      try {
        const url = await _uploadToService(svc, blob);
        if (url) {
          _vsCatboxCache.set(dataUrl, url);
          return url;
        }
      } catch (e) {
        console.warn(`${svc.name} 上传失败:`, e.message);
      }
    }

    // 所有服务都失败，重试一轮
    for (let retry = 1; retry <= attempts; retry++) {
      for (const svc of UPLOAD_SERVICES) {
        try {
          setStatus(`上传重试 ${retry}/${attempts} (${svc.name})...`, 'warning');
          const url = await _uploadToService(svc, blob);
          if (url) {
            _vsCatboxCache.set(dataUrl, url);
            return url;
          }
        } catch (e) {
          console.warn(`${svc.name} 重试 ${retry} 失败:`, e.message);
        }
      }
      if (retry < attempts) {
        await new Promise(r => setTimeout(r, 2000 * retry));
      }
    }

    throw new Error('所有上传服务均失败，请检查网络或稍后重试');
  }

  // 单个上传服务
  async function _uploadToService(svc, blob) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), svc.timeout);

    try {
      // catbox 类型：发送 FormData，返回 URL 文本或 { url } JSON
      const fd = new FormData();
      fd.append('reqtype', 'fileupload');
      fd.append('time', '24h');
      fd.append('fileToUpload', new File([blob], 'asset.png', { type: blob.type || 'image/png' }));

      const res = await fetch(svc.url, { method: 'POST', body: fd, signal: ctrl.signal });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const raw = await res.text();
      let url = '';
      try {
        const body = JSON.parse(raw);
        url = body?.url || '';
      } catch {
        const text = raw.trim();
        if (/^https?:\/\//i.test(text)) url = text;
      }
      if (!url || !/^https?:\/\//i.test(url)) throw new Error('返回非 URL');
      return url;
    } finally {
      clearTimeout(timer);
    }
  }

  // ============ 根据模型构造 params ============
  function buildParams(model, urls) {
    const cfg = MODEL_PARAMS[model] || { imageType: 'images', has_resolution: false, has_quality: false, durationOpts: ['5','10'] };
    const params = {};

    // urls 可能是数组（多图）或单字符串（兼容旧调用）
    const urlList = Array.isArray(urls) ? urls : [urls];

    if (cfg.imageType === 'img_url') {
      params.img_url = urlList[0];
    } else {
      params.images = urlList;
    }

    params.aspect_ratio = els.aspect.value;
    params.duration = els.duration.value;

    // useSize 优先级最高：固定尺寸（4K/1080P/720P）时跳过用户选择的 resolution
    if (cfg.useSize) {
      params.size = cfg.useSize;
    } else if (cfg.has_resolution) {
      params.resolution = els.resolution.value;
    }
    if (cfg.has_quality)    params.quality = els.quality.value;
    if (cfg.useMode)        params.mode = cfg.useMode;
    if (cfg.useVeoQuality)  params.quality = cfg.useVeoQuality;
    if (cfg.veoQuality)     params.quality = cfg.veoQuality;
    if (cfg.generationMode) params.generation_mode = cfg.generationMode;
    if (cfg.has_sound !== undefined) params.sound = cfg.has_sound;

    return params;
  }

  async function submitVideoTask({ model, prompt, params }) {
    const cfg = getCanvasConfig();
    const res = await fetch(`${cfg.apiBase}/v1/media/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cfg.apiKey}`
      },
      body: JSON.stringify({ model, prompt, params })
    });
    const json = await res.json();
    if (json.code !== 200 && json.code !== undefined) {
      throw new Error(json.msg || `提交失败: ${json.code}`);
    }
    const taskId = json.data?.task_id || json.data?.任务id;
    if (!taskId) throw new Error('未返回 task_id');
    return { taskId, raw: json.data };
  }

  // ============ 查询单个任务状态 ============
  async function checkTaskStatus(taskId) {
    const cfg = getCanvasConfig();
    const res = await fetch(`${cfg.apiBase}/v1/skills/task-status?task_id=${taskId}`, {
      headers: { 'Authorization': `Bearer ${cfg.apiKey}` }
    });
    const json = await res.json();
    const data = json.data || json;
    return {
      isFinal: data.is_final === true || data.is_final === 'true' || data.is_final === 1,
      status: data.status || data.state || '提交中',
      resultUrl: data.result_url || data.url || data.image_url || data.output_url || '',
      error: data.error || '',
      progress: data.progress || '0%',
      state: data.state || ''
    };
  }

  // ============ 后台轮询（不阻塞 UI）============
  async function pollVideoTask(taskId) {
    for (let i = 0; i < 200; i++) {
      await new Promise(r => setTimeout(r, 3000));
      const result = await checkTaskStatus(taskId);
      if (result.isFinal || result.resultUrl) {
        if (result.resultUrl && /^https?:\/\//i.test(result.resultUrl)) {
          return { completed: true, resultUrl: result.resultUrl };
        }
        const errMsg = result.error || '';
        if (result.status.includes('失败') || result.status.includes('错误') || result.state === 'failed' || errMsg) {
          return { completed: true, error: errMsg || result.status };
        }
        if (!result.resultUrl) {
          return { completed: true, error: '任务完成但未返回 result_url' };
        }
      }
      if (result.status.includes('失败') || result.status.includes('错误') || result.state === 'failed') {
        return { completed: true, error: result.error || result.status };
      }
    }
    return { completed: false, timedOut: true };
  }

  // ============ 获取公网 URL ============
  async function getPublicUrl(asset) {
    if (asset.lk888Url) return asset.lk888Url;
    if (!asset.dataUrl || !/^data:/i.test(asset.dataUrl)) {
      throw new Error('素材没有可用的 dataURL');
    }
    setStatus('图片无 lk888 永久链接，上传到 catbox 兜底...', 'running');
    const url = await uploadDataUrlToCatbox(asset.dataUrl);
    setStatus('catbox 上传成功', 'running');
    return url;
  }

  // ============ 单个生成 ============
  async function generate() {
    if (state.isGenerating) return;

    const model = els.model.value;
    const cfg = MODEL_PARAMS[model] || {};
    if (cfg.noImageMode) {
      toast('「' + els.model.options[els.model.selectedIndex].text + '」需要上传视频，暂不支持', 'error');
      return;
    }

    const isFL = isFirstLastFrameModel(model);
    const selectedIds = state.selectedIds;
    if (!selectedIds.length) return toast('请先选择素材', 'error');

    if (isFL && selectedIds.length < 2) {
      return toast('首尾帧模式需要选择2张图片（首帧 + 尾帧）', 'error');
    }

    const prompt = els.prompt.value.trim();
    if (!prompt) return toast('请输入提示词', 'error');

    const agent = AGENTS.find(a => a.id === state.selectedAgentId);
    const finalPrompt = agent ? agent.promptTemplate.replace('{userPrompt}', prompt) : prompt;

    state.isGenerating = true;
    els.generate.disabled = true;
    setStatus('准备生成...', 'running');

    try {
      // 获取所有选中素材的 public URL
      const assets = selectedIds.map(id => state.assets.find(a => a.id === id)).filter(Boolean);
      const publicUrls = await Promise.all(assets.map(a => getPublicUrl(a)));
      const params = buildParams(model, publicUrls);

      setStatus('提交任务到小马AI...', 'running');
      const { taskId } = await submitVideoTask({ model, prompt: finalPrompt, params });
      setStatus(`任务已提交（ID: ${taskId}），后台轮询中...`, 'running');

      els.taskLink.href = `https://api.lk888.ai/v1/skills/task-status?task_id=${taskId}`;
      els.taskLink.style.display = '';

      const historyItem = {
        taskId, prompt, model, params,
        sourceAssetTitle: assets.map(a => a.title).join(' + '),
        timestamp: Date.now(),
        status: 'running',
        videoUrl: '', error: ''
      };
      saveHistory(historyItem);

      pollVideoTask(taskId).then(result => {
        if (result.completed && result.resultUrl) {
          updateHistoryItem(taskId, { status: 'completed', videoUrl: result.resultUrl });
          // 异步缓存视频到本地（不阻塞后续流程）
          cacheVideoFromUrl(taskId, result.resultUrl);
          toast('视频生成成功：' + prompt.slice(0, 20) + '...', 'success');
          if (state.selectedIds.length && state.selectedId) {
            els.previewStage.innerHTML = '';
            showVideoPreview(els.previewStage, result.resultUrl, taskId);
            els.download.disabled = false;
            els.download.onclick = () => showDownloadModal(result.resultUrl, `xiaoma-video-${Date.now()}.mp4`);
          }
          // 自动提取最后一帧加入素材库（用于首尾帧衔接）
          if (isFirstLastFrameModel(model)) {
            addLastFrameToAssets(result.resultUrl, assets.map(a => a.title).join('+'));
          }
        } else if (result.completed && result.error) {
          updateHistoryItem(taskId, { status: 'failed', error: result.error });
          toast('生成失败: ' + result.error, 'error');
        } else if (result.timedOut) {
          updateHistoryItem(taskId, { status: 'timeout', error: '轮询超时，后台将继续抓取' });
          setStatus('轮询超时，后台将继续抓取...', 'warning');
          toast('生成超时，后台将继续抓取结果', 'warning');
        }
      }).catch(e => {
        updateHistoryItem(taskId, { status: 'failed', error: e.message });
      });

    } catch (e) {
      console.error(e);
      setStatus('提交失败: ' + e.message, 'error');
      toast('提交失败: ' + e.message, 'error');
    } finally {
      state.isGenerating = false;
      els.generate.disabled = false;
    }
  }

  // ============ 批量生成 ============
  // ============ 下载弹窗 ============
  let _dlUrl = '';
  let _dlFilename = '';

  function showDownloadModal(url, filename) {
    _dlUrl = url;
    _dlFilename = filename;
    els.dlPreview.innerHTML = '';
    showVideoPreview(els.dlPreview, url, null);
    els.dlFilename.value = filename;
    els.dlMeta.textContent = `格式: MP4 · 来源: 小马AI`;
    els.dlModal.style.display = 'flex';
  }

  function hideDownloadModal() {
    els.dlModal.style.display = 'none';
  }

  function confirmDownload() {
    const name = els.dlFilename.value.trim() || _dlFilename;
    downloadFile(_dlUrl, name);
    hideDownloadModal();
    toast('下载已开始: ' + name, 'success');
  }

  // ============ 文件下载（通过本地代理，解决跨域限制）============
  async function downloadFile(url, filename) {
    // 通过同源代理下载，避免跨域 CORS 限制
    const proxyUrl = `/api/download?url=${encodeURIComponent(url)}`;
    try {
      const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(120000) });
      if (res.ok) {
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
        return;
      }
    } catch (e) {
      console.warn('代理下载失败，回退到直接链接:', e.message);
    }
    // 回退：直接打开链接（跨域需用户手动右键）
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.target = '_blank';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  // ============ 创建预览视频（带加载失败错误提示）============
  function createPreviewVideo(src, extraMsg) {
    const container = document.createElement('div');
    container.style.cssText = 'width:100%;height:100%;display:flex;align-items:center;justify-content:center';
    const video = document.createElement('video');
    video.src = src;
    video.controls = true;
    video.autoplay = true;
    video.loop = true;
    video.style.cssText = 'max-width:100%;max-height:100%';
    video.onerror = function() {
      container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#ef4444;font-size:13px;text-align:center;padding:20px;flex-direction:column;gap:6px"><span>\u26A0\uFE0F \u89C6\u9891\u94FE\u63A5\u5DF2\u8FC7\u671F\u6216\u65E0\u6CD5\u52A0\u8F7D</span>' + (extraMsg || '') + '</div>';
    };
    container.appendChild(video);
    return container;
  }

  async function cacheVideoFromUrl(taskId, videoUrl) {
    try {
      const res = await fetch(`/api/download?url=${encodeURIComponent(videoUrl)}`, { signal: AbortSignal.timeout(120000) });
      if (res.ok) {
        const blob = await res.blob();
        await saveVideoToCache(taskId, blob);
        console.log('视频已缓存到本地:', taskId.slice(0, 12));
      }
    } catch (e) {
      console.warn('视频缓存失败（不影响播放）:', e.message);
    }
  }

  // ============ 历史记录 ============
  function loadHistory() {
    try { state.history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch (e) { state.history = []; }
    renderHistory();
    renderHistoryMini();
  }

  function saveHistory(item) {
    state.history.unshift(item);
    if (state.history.length > 50) state.history = state.history.slice(0, 50);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(state.history));
    renderHistory();
    renderHistoryMini();
  }

  function updateHistoryItem(taskId, updates) {
    const item = state.history.find(h => h.taskId === taskId);
    if (!item) return;
    Object.assign(item, updates);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(state.history));
    renderHistory();
    renderHistoryMini();
  }

  function deleteHistoryItem(index) {
    state.history.splice(index, 1);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(state.history));
    renderHistory();
    renderHistoryMini();
  }

  // ============ 历史弹窗 ============
  function showHistoryModal() {
    renderHistory();
    els.historyModal.style.display = 'flex';
  }

  function hideHistoryModal() {
    els.historyModal.style.display = 'none';
  }

  function renderHistoryMini() {
    if (!els.historyMini) return;
    const total = state.history.length;
    const completed = state.history.filter(h => h.status === 'completed').length;
    const running = state.history.filter(h => h.status === 'running').length;
    const failed = state.history.filter(h => h.status === 'failed').length;
    if (!total) {
      els.historyMini.innerHTML = '<div class="vs-empty-small">暂无历史</div>';
      return;
    }
    els.historyMini.innerHTML = `
      <div>共 <b>${total}</b> 条</div>
      <div style="margin-top:4px;display:flex;gap:8px;flex-wrap:wrap">
        <span style="color:var(--vs-success)">✅ ${completed}</span>
        <span style="color:var(--vs-warning)">⏳ ${running}</span>
        <span style="color:var(--vs-error)">❌ ${failed}</span>
      </div>
    `;
  }

  function renderHistory() {
    let list = state.history;

    // 搜索过滤
    const search = state.historySearch.toLowerCase().trim();
    if (search) {
      list = list.filter(h =>
        (h.prompt || '').toLowerCase().includes(search) ||
        (h.model || '').toLowerCase().includes(search)
      );
    }

    // 状态筛选
    const filter = state.historyFilter;
    if (filter !== 'all') {
      list = list.filter(h => h.status === filter);
    }

    if (!list.length) {
      els.historyList.innerHTML = '<div class="vs-empty-small">暂无匹配记录</div>';
      return;
    }

    // 按日期分组
    const groups = {};
    list.forEach((h, i) => {
      const group = getDateGroup(h.timestamp);
      if (!groups[group]) groups[group] = [];
      groups[group].push({ ...h, origIndex: state.history.indexOf(h) });
    });

    const groupOrder = ['今天', '昨天'];
    const otherGroups = Object.keys(groups).filter(g => !groupOrder.includes(g)).sort().reverse();

    let html = '';
    [...groupOrder, ...otherGroups].forEach(group => {
      if (!groups[group]) return;
      html += `<div class="vs-history-date-group">`;
      html += `<div class="vs-history-date-label">${group} (${groups[group].length})</div>`;
      groups[group].forEach(h => {
        const statusIcon = {
          running: '⏳', completed: '✅', failed: '❌', timeout: '⏰'
        }[h.status] || '';
        const thumbHtml = h.videoUrl
          ? `<video src="${h.videoUrl}" muted preload="metadata"></video>`
          : `<span class="vs-history-thumb-placeholder">🎬</span>`;
        html += `
          <div class="vs-history-item" data-orig-index="${h.origIndex}">
            <div class="vs-history-thumb">${thumbHtml}</div>
            <div class="vs-history-body">
              <div class="vs-history-prompt">${escapeHtml(h.prompt || '(无提示词)')}</div>
              <div class="vs-history-meta">
                <span>${h.model || ''}</span>
                <span>${statusIcon}</span>
                <span class="vs-history-time">${formatTime(h.timestamp)}</span>
              </div>
            </div>
            <button class="vs-history-delete" data-orig-index="${h.origIndex}" title="删除">✕</button>
          </div>
        `;
      });
      html += `</div>`;
    });

    els.historyList.innerHTML = html;

    // 点击回放 → 关闭弹窗，在预览区播放
    els.historyList.querySelectorAll('.vs-history-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.closest('.vs-history-delete')) return;
        const origIndex = parseInt(item.dataset.origIndex);
        const h = state.history[origIndex];
        if (!h) return;
        hideHistoryModal(); // 先关弹窗，让预览区可见
        if (h.videoUrl) {
          els.previewStage.innerHTML = '';
          showVideoPreview(els.previewStage, h.videoUrl, h.taskId, '<small style="color:#888">请重新生成视频</small>');
          els.download.disabled = false;
          els.download.onclick = () => showDownloadModal(h.videoUrl, `xiaoma-video-${h.timestamp}.mp4`);
        } else {
          els.previewStage.innerHTML = `<div class="vs-empty-large"><span>任务 ${h.taskId}<br/>状态: ${h.status}<br/>${h.error || '等待中...'}</span></div>`;
          els.download.disabled = true;
        }
        els.taskLink.style.display = 'none';
      });
    });

    // 删除
    els.historyList.querySelectorAll('.vs-history-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const origIndex = parseInt(btn.dataset.origIndex);
        deleteHistoryItem(origIndex);
      });
    });
  }

  // ============ 监听画布更新 ============
  function watchCanvas() {
    window.addEventListener('storage', (e) => {
      if (e.key === WORKSPACE_KEY) loadAssets();
    });
    try {
      const ch = new BroadcastChannel('xiaoma-canvas-assets');
      ch.onmessage = (e) => {
        if (e.data?.type === 'asset-added' || e.data?.type === 'asset-updated') loadAssets();
      };
    } catch (e) {}
  }

  // ============ 预设智能体 ============
  const CATEGORIES = [
    { id: 'all', label: '全部', icon: '📋' },
    { id: 'product', label: '电商产品', icon: '📦' },
    { id: 'art', label: '创意艺术', icon: '🎨' },
    { id: 'portrait', label: '人像人物', icon: '👤' },
    { id: 'effect', label: '特殊效果', icon: '✨' }
  ];

  function renderAgentBar() {
    // 分类标签
    els.agentCategories.innerHTML = CATEGORIES.map(c =>
      `<button class="vs-cat-btn${state.agentCategory === c.id ? ' active' : ''}" data-cat="${c.id}">${c.icon} ${c.label}</button>`
    ).join('');

    els.agentCategories.querySelectorAll('.vs-cat-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        state.agentCategory = btn.dataset.cat;
        renderAgentBar();
      });
    });

    // 筛选后的智能体列表
    const filtered = state.agentCategory === 'all'
      ? AGENTS
      : AGENTS.filter(a => a.category === state.agentCategory);

    els.agentChips.innerHTML = filtered.map(a => {
      const sel = a.id === state.selectedAgentId ? ' selected' : '';
      return `<button class="vs-agent-chip${sel}" data-id="${a.id}">${a.icon} ${a.name}</button>`;
    }).join('');

    els.agentChips.querySelectorAll('.vs-agent-chip').forEach(btn => {
      btn.addEventListener('click', () => selectAgent(btn.dataset.id));
    });

    // 信息条
    const current = AGENTS.find(a => a.id === state.selectedAgentId);
    if (current) {
      const src = current.source;
      els.agentInfo.innerHTML = `${current.icon} 已选: ${current.name} · ${current.presets.model} · ${current.presets.aspect} · 来源: <a href="${src.url}" target="_blank">${src.name}</a>`;
      els.agentInfo.style.display = '';
      els.clearAgent.style.display = '';
      els.agentBar.classList.remove('vs-agent-bar-collapsed');
      renderReferencePrompts(current);
    } else {
      els.agentInfo.style.display = 'none';
      els.clearAgent.style.display = 'none';
      els.refPrompts.innerHTML = '';
      els.agentSuffix.textContent = '';
      els.agentBar.classList.add('vs-agent-bar-collapsed');
    }
  }

  function selectAgent(id) {
    const agent = AGENTS.find(a => a.id === id);
    if (!agent) return;
    state.selectedAgentId = id;
    const p = agent.presets;

    els.model.value = p.model;
    els.aspect.value = p.aspect;
    els.duration.value = p.duration;
    els.resolution.value = p.resolution;
    els.quality.value = p.quality;

    applyModelSettings(p.model);

    if (!els.prompt.value.trim()) {
      els.prompt.value = agent.defaultPrompt;
    }

    const suffix = agent.promptTemplate.replace('{userPrompt}', '').replace(/^,\s*/, '');
    els.agentSuffix.textContent = `🤖 将附加: "${suffix}"`;

    renderAgentBar();
    toast(`已选智能体: ${agent.name}`, 'info');
  }

  function clearAgent() {
    state.selectedAgentId = null;
    els.agentInfo.style.display = 'none';
    els.clearAgent.style.display = 'none';
    els.refPrompts.innerHTML = '';
    els.agentSuffix.textContent = '';
    els.agentBar.classList.add('vs-agent-bar-collapsed');
    renderAgentBar();
    toast('已取消智能体', 'info');
  }

  function renderReferencePrompts(agent) {
    if (!agent.referencePrompts || !agent.referencePrompts.length) {
      els.refPrompts.innerHTML = '';
      return;
    }
    els.refPrompts.innerHTML = '<div class="vs-ref-label">📋 参考案例（点击填入提示词）</div>' +
      agent.referencePrompts.map(rp =>
        `<button class="vs-ref-btn" data-prompt="${escapeHtml(rp.prompt)}">${rp.label}</button>`
      ).join('');

    els.refPrompts.querySelectorAll('.vs-ref-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        els.prompt.value = btn.dataset.prompt;
        toast('已填入参考案例提示词', 'info');
      });
    });
  }

  // ============ 智能体管理 ============
  function exportAgent() {
    const agent = AGENTS.find(a => a.id === state.selectedAgentId);
    if (!agent) return toast('请先选择一个智能体', 'error');
    const json = JSON.stringify(agent, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agent-${agent.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast('智能体已导出', 'success');
  }

  function importAgent() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      try {
        const text = await e.target.files[0].text();
        const agent = JSON.parse(text);
        if (!agent.id || !agent.name || !agent.presets) {
          throw new Error('无效的智能体格式');
        }
        const custom = JSON.parse(localStorage.getItem('vs_custom_agents') || '[]');
        custom.push(agent);
        localStorage.setItem('vs_custom_agents', JSON.stringify(custom));
        toast('智能体已导入: ' + agent.name, 'success');
      } catch (err) {
        toast('导入失败: ' + err.message, 'error');
      }
    };
    input.click();
  }

  function resetAgents() {
    if (!confirm('确认重置所有自定义智能体？内置智能体不受影响。')) return;
    localStorage.removeItem('vs_custom_agents');
    toast('已重置自定义智能体', 'info');
  }

  function showAgentManager() {
    const action = prompt('智能体管理:\n1 - 导出当前智能体\n2 - 导入智能体 JSON\n3 - 重置自定义智能体\n\n输入数字:');
    if (action === '1') exportAgent();
    else if (action === '2') importAgent();
    else if (action === '3') resetAgents();
  }

  // ============ 后台定时器：扫描未完成的任务 ============
  function startBackgroundPoller() {
    setInterval(async () => {
      const pending = state.history.filter(h => h.status === 'running' || h.status === 'timeout');
      if (!pending.length) return;
      for (const item of pending) {
        try {
          const result = await checkTaskStatus(item.taskId);
          if (result.isFinal || result.resultUrl) {
            if (result.resultUrl && /^https?:\/\//i.test(result.resultUrl)) {
              updateHistoryItem(item.taskId, { status: 'completed', videoUrl: result.resultUrl });
              toast('视频生成完成：' + (item.prompt || '').slice(0, 20), 'success');
              // 后台轮询完成也提取最后一帧
              if (isFirstLastFrameModel(item.model)) {
                addLastFrameToAssets(result.resultUrl, item.sourceAssetTitle || '');
              }
            } else {
              const errMsg = result.error || '';
              if (result.status.includes('失败') || result.status.includes('错误') || result.state === 'failed' || errMsg) {
                updateHistoryItem(item.taskId, { status: 'failed', error: errMsg || result.status });
              }
            }
          }
        } catch (e) {
          // 静默跳过
        }
      }
    }, 30000);
  }

  // ============ 启动 ============
  function init() {
    loadAssets();
    loadHistory();
    watchCanvas();
    startBackgroundPoller();
    renderAgentBar();

    // 模型切换
    els.model.addEventListener('change', () => {
      // 切换模型时清空选中，避免首尾帧/普通模式冲突
      state.selectedIds = [];
      state.selectedId = null;
      applyModelSettings(els.model.value);
      renderAssets();
    });

    // 刷新
    els.refresh.addEventListener('click', loadAssets);

    // 素材筛选
    els.assetFilter.addEventListener('change', renderAssets);

    // 生成
    els.generate.addEventListener('click', generate);

    // 模式选择
    els.modeTabs.addEventListener('click', (e) => {
      const btn = e.target.closest('.vs-mode-tab');
      if (!btn) return;
      els.modeTabs.querySelectorAll('.vs-mode-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.mode = btn.dataset.mode;
      els.batchCountGroup.style.display = (state.mode === 'batch') ? 'flex' : 'none';
      // 切到智能体模式时自动展开智能体栏
      if (state.mode === 'agent' && els.agentBar.classList.contains('vs-agent-bar-collapsed')) {
        els.agentBar.classList.remove('vs-agent-bar-collapsed');
      }
      toast(`已切换到${btn.textContent.trim()}模式`, 'info', 1200);
    });

    // 数量 stepper
    function updateBatchNum() {
      let n = parseInt(els.batchNum.value) || 1;
      n = Math.max(1, Math.min(5, n));
      els.batchNum.value = n;
      state.batchNum = n;
    }
    els.numMinus.addEventListener('click', () => { els.batchNum.value = Math.max(1, (parseInt(els.batchNum.value) || 1) - 1); updateBatchNum(); });
    els.numPlus.addEventListener('click', () => { els.batchNum.value = Math.min(5, (parseInt(els.batchNum.value) || 1) + 1); updateBatchNum(); });
    els.batchNum.addEventListener('change', updateBatchNum);
    els.batchNum.addEventListener('input', updateBatchNum);

    // 下载弹窗
    els.dlConfirm.addEventListener('click', confirmDownload);
    els.dlClose.addEventListener('click', hideDownloadModal);
    els.dlModal.addEventListener('click', (e) => {
      if (e.target === els.dlModal) hideDownloadModal();
    });

    // 历史
    els.clearHistory.addEventListener('click', () => {
      if (confirm('确认清空所有历史？')) {
        state.history = [];
        localStorage.removeItem(HISTORY_KEY);
        renderHistory();
        renderHistoryMini();
        toast('历史已清空', 'info');
      }
    });
    els.openHistory.addEventListener('click', showHistoryModal);
    els.historyClose.addEventListener('click', hideHistoryModal);
    els.historyModal.addEventListener('click', (e) => {
      if (e.target === els.historyModal || e.target.classList.contains('vs-modal-overlay')) {
        hideHistoryModal();
      }
    });
    els.historySearch.addEventListener('input', () => {
      state.historySearch = els.historySearch.value;
      renderHistory();
    });
    els.historyFilters.addEventListener('click', (e) => {
      const btn = e.target.closest('.vs-hf-btn');
      if (!btn) return;
      els.historyFilters.querySelectorAll('.vs-hf-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.historyFilter = btn.dataset.filter;
      renderHistory();
    });

    // 智能体
    els.clearAgent.addEventListener('click', clearAgent);
    els.manageAgent.addEventListener('click', showAgentManager);

    // 任务池(购物车)
    els.taskPoolRun.addEventListener('click', runTaskPool);
    els.taskPoolClear.addEventListener('click', clearTaskPool);
    renderTaskPool();

    // 初始应用默认模型的参数面板
    applyModelSettings(els.model.value);

    // 监听 Ctrl+Enter 快捷键
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (!els.generate.disabled) generate();
      }
    });
  }

  return { init, loadAssets };
})();

document.addEventListener('DOMContentLoaded', VS.init);

