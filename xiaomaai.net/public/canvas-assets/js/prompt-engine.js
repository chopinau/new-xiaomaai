// PromptEngine centralizes reverse-prompt templates, image-role resolution, and final prompt compilation.

const PromptEngine = (() => {
  const DEFAULT_TEXT_PROMPT = '连接参考图后生成视觉优先的可迁移生图提示词。';

  // Legacy: 不再硬编码具体产品名，改用 sanitizeReferenceNoise 只清 blacklist
  const PRODUCT_NOISE_TERMS = [];
  const PRODUCT_NOISE_PHRASES = [];

  const SUBJECT_ANCHOR_KEYWORDS = [
    '品类', '品牌', '包装', '标签', 'logo', 'LOGO', '标识', '瓶身', '罐体', '罐身',
    '袋装', '盒装', '瓶装', '管装', '盒身', '袋身', '管身', '外包装', '内包装',
    '可见文字', '关键部件', '瓶盖', '拉环', '喷头', '泵头', '按压头', '翻盖',
    '封口', '密封', '开口', '接口', '插口', '按钮', '开关', '屏幕', '面板',
    '铭牌', '吊牌', '水洗标', '领标', '袖标', '图案', '印花', '刺绣', '丝印'
  ];

  const LEGACY_TEXT_TEMPLATE_PROMPTS = [
    '你是商业海报提示词反推专家。请分析输入图片，输出一段可直接用于 AI 生图的中文提示词。必须覆盖：画面类型、主体、版式结构、文字层级、背景、色彩、光影、材质质感、装饰元素、镜头/构图、商业氛围、清晰度和质量要求。只输出最终提示词，不要解释。',
    '你是电商产品视觉策划。请基于输入图片反推出适合产品海报生成的中文提示词。必须覆盖：产品主体、产品角度、材质与工艺、卖点表现、陈列方式、背景场景、灯光、构图、品牌调性、文字区域预留、商业摄影质感。只输出最终提示词，不要解释。',
    '你是 AI 绘图提示词工程师。请把输入图片反推成通用生图提示词。必须覆盖：主体描述、环境背景、构图视角、色彩、光照、风格、细节、氛围、画质标签。输出中可保留少量英文质量词，例如 ultra detailed, high quality, sharp focus。只输出最终提示词，不要解释。',
    '你是详情页视觉策划。请分析输入图片并输出可用于详情页生图的一组提示词，按 1/2/3 分条，每条包含画面目的、主体、构图、背景、文案区域、细节表现、质感和质量要求。只输出可执行提示词，不要解释。'
  ];

  const DESIGN_SKELETON_RULES = [
    '反推目标是“参考图模板迁移”，不是复述参考图内容，也不是识别最终主体。',
    '必须先输出结构化模板骨架，再生成可直接交给 image2 的中文自然语言提示词。',
    '根骨架必须覆盖 6 个必填维度：视觉焦点、空间层次/Z 轴、光影结构、材质响应、镜头语言、风格基调。',
    '按图像内容补充 2 个条件维度：有人脸/手/身体时写人物状态；产品置景时写主体与道具/台面/背景的物理关系。',
    '模板迁移必须保留：布局模板、版块数量、版块相对位置、主体占画面比例、标题区、价签/信息卡/短标签/底部栏的商业功能、区域比例、构图节奏、字体系统、文字层级、阅读路径、光影逻辑、材质表现、空间层次、画面张力和使用场景。',
    '颜色必须做“主体色重映射”：保留参考图的明暗关系、冷暖倾向、对比强度和主辅色比例；最终具体主色跟随当前主体/目标主体，不照搬参考图旧主体色相。',
    '元素必须做“功能等价替换”：保留元素的位置、层级、节奏和作用；水果、图标、道具、徽章、花纹、专属符号等必须替换成适合当前主体的等价元素；价格、活动时间、买赠、地址、规格等模块缺少详情事实时，保留模块功能但只写泛化促销词，不编具体数字、日期、地址、规格或功效。',
    '必须丢弃：参考图原主体、原产品名称、原品牌、原型号、原品类事实、原颜色、原卖点/功效词、原成分、原价格、具体参数、口味、营销词、标题原文、人物身份和参考图专属图形符号。',
    '主图用于锁定当前主体身份与结构：保留形状、比例、轮廓、包装/服饰/空间关系、品牌标识、标签文字区、关键部件、开口/接口等可见细节。',
    '产品资料节点只补充当前产品名称、卖点、规格参数、文案和禁用词；如果产品资料与主图可见外观冲突，以主图为准。',
    '没有产品资料节点时，只能使用主图可见事实，禁止编造容量、功率、成分、功效、价格、型号、产地、认证和不可见参数。',
    '参考图外部容器、截图背景、黑色边框、设备框、浏览器/应用预览框、阴影底板和额外留白不属于设计骨架，最终图片必须满版铺到画布四边。'
  ].join('\n');

  const TEXT_TEMPLATES = {
    auto: {
      label: '自动识别',
      focus: '自动识别商业海报、产品摄影、人物手持产品、人像摄影、详情页/信息图、纯文字排版、空间/场景图或通用视觉骨架；如果图像兼具多种类型，按主视觉目的排序组合。'
    },
    poster: {
      label: '商业海报',
      focus: '优先拆标题与主体权重、顶部/中部/底部区域比例、主体与大字/框线的压叠关系、边栏文字、底部信息栏、徽章/图标的功能位置、字体气质、线条边框、留白密度、主辅色比例、远距离识别度和品牌广告情绪。'
    },
    product: {
      label: '产品摄影',
      focus: '优先拆主体比例、产品角度、包装/标签/关键部件保护、棚拍或置景光影、接触阴影、反射关系、材质响应、背景材质、道具层级、陈列方式和产品与环境的物理关系；道具只迁移作用，不迁移旧专属物。'
    },
    handProduct: {
      label: '人物手持产品',
      focus: '优先拆人物/手/产品/桌面/背景的前后关系、手持位置、抓握方式、指尖发力、产品边界、人物表情、服装层次、发丝边缘、展示台关系、稳定机位和整体商业展示光影。'
    },
    portrait: {
      label: '人像摄影',
      focus: '优先拆人物状态、表情张力、眼神方向、头颈肩姿态、肢体线条、服装层次、发丝/皮肤/眼神质感、脸部主光、眼神光、轮廓光、背景材质、镜头焦段、景别、机位、肤色处理和画面情绪；没有产品时不要硬塞产品卖点或参数。'
    },
    portraitProduct: {
      label: '人像/产品',
      focus: '优先拆人物与产品的主次关系、手部/身体承托方式、产品朝向与可见面、脸部表情和产品卖点区域的阅读路径、人物光与产品光的统一关系、背景层次和商业可信度；产品事实仍以后续主图和产品资料为准。'
    },
    typography: {
      label: '纯文字排版',
      focus: '只拆字体气质、字号层级、字重对比、行距字距、对齐方式、网格结构、留白密度、色彩关系、纸感/印刷感、装饰线、阅读路径和版面张力；不硬塞产品材质、镜头参数、模特或置景关系。'
    },
    reverse: {
      label: '通用骨架',
      focus: '保持原图所属视觉类型和使用场景，拆清构图、空间、光影、材质、文字/标注位置和画面秩序；不要把普通摄影、空间图、菜单、信息图都强行改成大字海报。'
    },
    detail: {
      label: '详情页/信息图',
      focus: '优先拆顶部主视觉区、中部信息模块、卖点卡片、局部特写、对比区、参数栏、图标系统、网格分割线、阅读路径、模块主次和长图节奏；参数和卖点必须按新主体重写。'
    }
  };

  const IMAGE_PROMPT_KEYWORDS = [
    '画面', '视觉', '构图', '版式', '布局', '焦点', '主体', '空间', '层次',
    '前景', '中景', '背景', '留白', '文字', '标题', '字体', '字号', '字重',
    '行距', '对齐', '网格', '光影', '灯光', '主光', '轮廓光', '阴影', '反射',
    '高光', '材质', '质感', '纹理', '色彩', '色调', '配色', '镜头', '机位',
    '视角', '景别', '氛围', '商业', '摄影', '海报', '广告', '满版', '边框',
    '装饰', '道具', '陈列', '压叠', '层级', '比例', '区域'
  ];

  const IMAGE_PROMPT_DROP_PATTERNS = [
    /严格\s*JSON/i,
    /不要\s*markdown/i,
    /不要解释/i,
    /字段如下/i,
    /blacklist/i,
    /skeleton/i,
    /finalPrompt/i,
    /subjectAnchors/i,
    /styleSkeleton/i,
    /referenceBlacklist/i,
    /输出必须/i,
    /三层职责/i,
    /参考图原始事实黑名单/i,
    /参考图原商品/i,
    /旧主体|旧品牌|旧文案|旧参数/,
    /参考图.*(产品名称|品类|品牌|价格|型号|参数|功效|成分)/,
    /提示词工程师|反推目标|当前反推模式|模型|节点|image2/
  ];

  function escapeRegExp(str) {
    return String(str || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function sanitizeProductNoise(text, extraNoise = []) {
    let out = String(text || '');
    [...PRODUCT_NOISE_PHRASES, ...extraNoise].forEach(term => {
      const value = String(term || '').trim();
      if (!value) return;
      out = out.replace(new RegExp(escapeRegExp(value), 'g'), '');
    });
    PRODUCT_NOISE_TERMS.forEach(term => {
      if (!term) return;
      out = out.replace(new RegExp(escapeRegExp(term), 'g'), '目标主体');
    });
    out = out
      .replace(/目标主体(技术|工艺|卖点|功效|口味|风味|参数|标题|品牌)/g, '$1占位')
      .replace(/目标主体海报/g, '目标主体视觉')
      .replace(/目标主体品牌/g, '目标品牌')
      .replace(/目标主体目标主体/g, '目标主体')
      .replace(/[ \t]{2,}/g, ' ')
      .replace(/\n{3,}/g, '\n\n');
    return out.trim();
  }

  // 只清除参考图旧事实（blacklist），不碰当前主体
  function sanitizeReferenceNoise(text, blacklist = []) {
    let out = String(text || '');
    const terms = Array.isArray(blacklist) ? blacklist : [];
    terms.forEach(term => {
      const value = String(term || '').trim();
      if (!value || value.length < 2) return;
      out = out.replace(new RegExp(escapeRegExp(value), 'g'), '');
    });
    out = out.replace(/[ \t]{2,}/g, ' ').replace(/\n{3,}/g, '\n\n');
    return out.trim();
  }

  function sanitizeStyleOnlyText(text) {
    return String(text || '')
      .replace(/主体(置于|位于|居于|放置在|呈现为)?/g, '当前主体$1')
      .replace(/[ \t]{2,}/g, ' ')
      .replace(/[，,、]{2,}/g, '，')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  function scoreImagePromptSentence(sentence) {
    const text = String(sentence || '');
    const baseScore = IMAGE_PROMPT_KEYWORDS.reduce((score, keyword) => (
      text.includes(keyword) ? score + 1 : score
    ), 0);
    const anchorBonus = SUBJECT_ANCHOR_KEYWORDS.reduce((score, keyword) => (
      text.includes(keyword) ? score + 2 : score
    ), 0);
    return baseScore + anchorBonus;
  }

  function getReferenceBlacklist(parsed) {
    if (!parsed || typeof parsed !== 'object') return [];
    if (Array.isArray(parsed.referenceBlacklist)) return parsed.referenceBlacklist;
    if (Array.isArray(parsed.blacklist)) return parsed.blacklist;
    const skeleton = parsed.styleSkeleton && typeof parsed.styleSkeleton === 'object'
      ? parsed.styleSkeleton
      : (parsed.skeleton && typeof parsed.skeleton === 'object' ? parsed.skeleton : {});
    return Array.isArray(skeleton.discardedReferenceFacts) ? skeleton.discardedReferenceFacts : [];
  }

  function flattenSubjectAnchors(anchors) {
    if (!anchors || typeof anchors !== 'object') return [];
    return [
      anchors.category,
      anchors.brandOrName,
      ...(Array.isArray(anchors.visibleProductFacts) ? anchors.visibleProductFacts : []),
      ...(Array.isArray(anchors.mustKeepVisualDetails) ? anchors.mustKeepVisualDetails : [])
    ].filter(Boolean);
  }

  function flattenReversePromptText(text, options = {}) {
    const parsed = parseJsonLoose(text);
    if (!parsed || typeof parsed !== 'object') return String(text || '');
    // 新格式优先
    const includeAnchors = options.includeSubjectAnchors !== false;
    const styleOnly = options.styleOnly === true;
    const anchors = parsed.subjectAnchors && typeof parsed.subjectAnchors === 'object' ? parsed.subjectAnchors : {};
    const skeleton = parsed.styleSkeleton && typeof parsed.styleSkeleton === 'object'
      ? parsed.styleSkeleton
      : (parsed.skeleton && typeof parsed.skeleton === 'object' ? parsed.skeleton : {});
    const anchorFields = [
      anchors.category,
      anchors.brandOrName,
      ...(Array.isArray(anchors.visibleProductFacts) ? anchors.visibleProductFacts : []),
      ...(Array.isArray(anchors.mustKeepVisualDetails) ? anchors.mustKeepVisualDetails : [])
    ];
    const skeletonFields = [
      skeleton.visualType,
      skeleton.layoutTemplate,
      skeleton.composition || skeleton.focus,
      skeleton.spatialLayers,
      skeleton.lighting,
      skeleton.material || skeleton.materialResponse,
      skeleton.typography,
      skeleton.typographySystem,
      skeleton.cameraLanguage,
      skeleton.colorSystem,
      skeleton.colorRemapRules,
      skeleton.replaceableInfoRules,
      skeleton.elementReplacementRules,
      skeleton.visualRhythm,
      skeleton.readingPath,
      skeleton.styleBaseline
    ];
    return [
      ...(includeAnchors && !styleOnly ? anchorFields : []),
      ...(styleOnly ? [] : [parsed.finalPrompt || parsed.prompt]),
      ...skeletonFields
    ]
      .flatMap(value => Array.isArray(value) ? value : [value])
      .filter(Boolean)
      .join('。');
  }

  function splitImagePromptSentences(text) {
    return String(text || '')
      .replace(/【[^】]{1,28}】/g, '。')
      .replace(/[#>*`"'{}[\]]/g, ' ')
      .replace(/\r/g, '\n')
      .split(/[\n。！？!?；;]+/)
      .flatMap(part => {
        const clean = part.trim();
        if (clean.length <= 180) return [clean];
        return clean.split(/[，,]+/).map(item => item.trim());
      })
      .map(item => item.replace(/\s+/g, ' ').replace(/^[,，、；;:：.。\s]+|[,，、；;:：.。\s]+$/g, '').trim())
      .filter(Boolean);
  }

  function summarizeTextForImage(text, maxChars = 900, options = {}) {
    if (maxChars && typeof maxChars === 'object') {
      options = maxChars;
      maxChars = 900;
    }
    const parsed = parseJsonLoose(text);
    if (options.styleOnly === true && (!parsed || typeof parsed !== 'object')) {
      return '';
    }
    const anchorBlacklist = parsed && options.includeSubjectAnchors === false
      ? flattenSubjectAnchors(parsed.subjectAnchors)
      : [];
    const flattened = sanitizeReferenceNoise(
      flattenReversePromptText(text, options),
      [...getReferenceBlacklist(parsed), ...anchorBlacklist]
    );
    const cleaned = options.styleOnly === true ? sanitizeStyleOnlyText(flattened) : flattened;
    if (!cleaned) return '';

    const seen = new Set();
    const candidates = splitImagePromptSentences(cleaned)
      .map(sentence => ({
        sentence,
        score: scoreImagePromptSentence(sentence),
        drop: IMAGE_PROMPT_DROP_PATTERNS.some(pattern => pattern.test(sentence))
      }))
      .filter(item => item.sentence.length >= 4 && !item.drop)
      .filter(item => {
        const key = item.sentence.replace(/\s+/g, '');
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

    const selected = [
      ...candidates.filter(item => item.score > 0).sort((a, b) => b.score - a.score),
      ...candidates.filter(item => item.score === 0)
    ];
    const lines = [];
    let total = 0;
    selected.forEach(item => {
      if (lines.length >= 10) return;
      const next = item.sentence
        .replace(/^[\d一二三四五六七八九十]+[、.]\s*/, '')
        .replace(/^[,，、；;:：.。\s]+|[,，、；;:：.。\s]+$/g, '');
      const nextLength = next.length + (lines.length ? 1 : 0);
      if (total + nextLength > maxChars) return;
      lines.push(next);
      total += nextLength;
    });

    const summary = lines.join('；').trim();
    if (summary) return summary;
    return cleaned.slice(0, maxChars).trim();
  }

  function normalizeGeneratePrompt(text) {
    const value = String(text || '').trim();
    if (!value) return '';
    const hasBlocks = /(?:主体|主图|参考|参考图|提示词|prompt|生图提示词)\s*[:：]/i.test(value);
    if (hasBlocks) {
      const blocks = [
        extractPromptBlock(value, 'subject'),
        extractPromptBlock(value, 'reference'),
        extractPromptBlock(value, 'prompt')
      ].map(item => String(item || '').trim());
      return blocks.some(Boolean) ? value : '';
    }
    return `主图：\n参考图：\n提示词：${value}`;
  }

  function extractAliases(text) {
    const aliases = [];
    String(text || '').replace(/@([\u4e00-\u9fa5\w-]+)/g, (_, alias) => {
      aliases.push(alias);
      return _;
    });
    return aliases;
  }

  function promptBlockLabelPattern(label) {
    if (label === 'subject') return '(?:主体|主图)';
    if (label === 'reference') return '(?:参考|参考图)';
    if (label === 'prompt') return '(?:提示词|prompt|生图提示词)';
    return escapeRegExp(label);
  }

  function extractPromptBlock(text, label) {
    const current = promptBlockLabelPattern(label);
    const any = '(?:主体|主图|参考|参考图|提示词|prompt|生图提示词)';
    const re = new RegExp(`${current}\\s*[:：]([\\s\\S]*?)(?=\\n\\s*${any}\\s*[:：]|$)`, 'i');
    const match = String(text || '').match(re);
    return match ? match[1] : '';
  }

  function mentionsAlias(text, alias) {
    if (!text || !alias) return false;
    return new RegExp(`@?${escapeRegExp(alias)}(?![\\w\\u4e00-\\u9fa5])`).test(text);
  }

  function aliasPosition(text, alias) {
    if (!text || !alias) return Number.MAX_SAFE_INTEGER;
    const match = String(text).match(new RegExp(`@?${escapeRegExp(alias)}(?![\\w\\u4e00-\\u9fa5])`));
    return match ? match.index : Number.MAX_SAFE_INTEGER;
  }

  function parseImageRoleHints(text, images = []) {
    const hints = new Map();
    hints.roleOrder = new Map();
    const value = String(text || '');
    hints.hasStructuredBlocks = /(?:主体|主图|参考|参考图|提示词|prompt|生图提示词)\s*[:：]/i.test(value);
    const subjectBlock = extractPromptBlock(value, 'subject');
    const referenceBlock = extractPromptBlock(value, 'reference');
    images.forEach((ref, index) => {
      const alias = ref.alias || ref.title || ('图' + (index + 1));
      if (mentionsAlias(subjectBlock, alias)) {
        hints.set(ref.id, 'subject');
        hints.set(alias, 'subject');
        hints.roleOrder.set(ref.id, aliasPosition(subjectBlock, alias));
      }
      if (mentionsAlias(referenceBlock, alias)) {
        hints.set(ref.id, 'reference');
        hints.set(alias, 'reference');
        hints.roleOrder.set(ref.id, aliasPosition(referenceBlock, alias));
      }
    });
    hints.hasExplicitSubject = images.some((ref, index) => hints.get(ref.id) === 'subject' || hints.get(ref.alias || ref.title || ('图' + (index + 1))) === 'subject');
    hints.hasExplicitReference = images.some((ref, index) => hints.get(ref.id) === 'reference' || hints.get(ref.alias || ref.title || ('图' + (index + 1))) === 'reference');
    return hints;
  }

  function normalizeInputRole(role) {
    const value = String(role || '').trim();
    if (value === 'subject' || value === 'reference' || value === 'support' || value === 'sketch') return value;
    return '';
  }

  function inferImageRole(images = [], index = 0, taskType = '') {
    const ref = images[index];
    if (isSketchRef(ref)) return 'sketch';
    if (images.length < 2) return 'subject';
    if (taskType === 'compose-subject-reference') return index === 0 ? 'subject' : (index === 1 ? 'reference' : 'support');
    return index === 0 ? 'reference' : 'subject';
  }

  function isSketchRef(ref) {
    return ref?.roleHint === 'sketch' || ref?.kind === 'sketch' || ref?.type === 'sketch';
  }

  function resolveImageRole(images = [], index = 0, roleHints = new Map(), taskType = '') {
    const ref = images[index];
    if (isSketchRef(ref)) return 'sketch';
    const alias = ref?.alias || ref?.title || ('图' + (index + 1));
    const explicitRole = normalizeInputRole(ref?.inputRole || ref?.roleHint);
    if (explicitRole && explicitRole !== 'sketch') return explicitRole;
    const hinted = roleHints?.get(ref?.id) || roleHints?.get(alias);
    if (hinted) return hinted;
    if (roleHints.hasExplicitReference) return 'support';
    if (roleHints.hasExplicitSubject) return images.length < 2 ? 'subject' : 'reference';
    return inferImageRole(images, index, taskType);
  }

  function getHintedRole(ref, roleHints = new Map(), index = 0) {
    const alias = ref?.alias || ref?.title || ('图' + (index + 1));
    return normalizeInputRole(ref?.inputRole || ref?.roleHint) || roleHints?.get(ref?.id) || roleHints?.get(alias) || '';
  }

  function scoreSubjectCandidate(ref, index = 0) {
    const label = `${ref?.alias || ''} ${ref?.title || ''}`.trim();
    let score = 100 - index;
    if (/主体|当前|目标|产品|商品|主图|主视觉/i.test(label)) score += 80;
    if (/generate|生成|输出|结果/i.test(label)) score += 24;
    if (ref?.type === 'generate') score += 18;
    if (/参考|样式|风格|细节|局部|轮毂|轮胎|背景|特写/i.test(label)) score -= 50;
    return score;
  }

  function pickPrimarySubjectId(images = [], roleHints = new Map()) {
    const nonSketch = images
      .map((ref, index) => ({ ref, index, hinted: getHintedRole(ref, roleHints, index) }))
      .filter(item => !isSketchRef(item.ref));
    if (!nonSketch.length) return '';
    const explicitSubjects = nonSketch
      .filter(item => item.hinted === 'subject')
      .sort((a, b) => (roleHints.roleOrder?.get(a.ref.id) ?? a.index) - (roleHints.roleOrder?.get(b.ref.id) ?? b.index));
    if (explicitSubjects.length) return explicitSubjects[0].ref.id;
    const referenceIds = new Set(nonSketch.filter(item => item.hinted === 'reference').map(item => item.ref.id));
    const candidates = nonSketch.filter(item => !referenceIds.has(item.ref.id));
    if (candidates.length) {
      return candidates
        .sort((a, b) => scoreSubjectCandidate(b.ref, b.index) - scoreSubjectCandidate(a.ref, a.index))[0].ref.id;
    }
    return nonSketch[nonSketch.length > 1 ? 1 : 0].ref.id;
  }

  function getImageRoleInfos({ rawPrompt = '', images = [], referenceMode = 'style-proxy', taskType = '' }) {
    const roleHints = parseImageRoleHints(rawPrompt, images);
    const primarySubjectId = pickPrimarySubjectId(images, roleHints);
    return images.map((ref, index) => {
      let role = resolveImageRole(images, index, roleHints, taskType);
      const explicitRole = normalizeInputRole(ref?.inputRole || ref?.roleHint);
      if (roleHints.hasStructuredBlocks && !isSketchRef(ref)) {
        const alias = ref?.alias || ref?.title || ('图' + (index + 1));
        const hinted = roleHints.get(ref?.id) || roleHints.get(alias);
        role = hinted || explicitRole || 'connected';
      } else if (!isSketchRef(ref) && !explicitRole && role !== 'reference') {
        role = ref.id === primarySubjectId ? 'subject' : 'support';
      }
      const label = role === 'subject' ? '主图' : role === 'support' ? '辅助图' : role === 'reference' ? '参考图' : role === 'sketch' ? '分层渲染' : role === 'connected' ? '已连接' : '输入图';
      // 修复：referenceMode = 'strong' 时，'connected' 角色走 'image' 通道（让图真传到 catbox → lk888）
      // 其他模式（structure / style-proxy）保持原行为：'connected' 走 'structure' 通道（只做文字约束）
      const channel = role === 'reference'
        ? 'style-proxy'
        : role === 'connected' && referenceMode !== 'strong'
          ? 'structure'
          : 'image';
      return {
        id: ref.id,
        alias: ref.alias || ref.title || ('图' + (index + 1)),
        role,
        label,
        channel,
        roleOrder: roleHints.roleOrder?.get(ref.id) ?? index
      };
    });
  }

  function requestRoleRank(role) {
    if (role === 'subject') return 0;
    if (role === 'support') return 1;
    if (role === 'sketch') return 2;
    if (role === 'reference') return 4;
    if (role === 'connected') return 9;
    return 3;
  }

  function orderRequestImages(images = [], imageRoles = []) {
    const roles = new Map(imageRoles.map((item, index) => [item.id, { ...item, index }]));
    return [...images]
      .map((ref, index) => ({ ref, index, info: roles.get(ref.id) || {} }))
      // 修复：只过滤 channel === 'structure'（结构参考模式）的图，让 strong 模式下的 'connected' 图也能进入 requestImages
      .filter(item => item.info.channel !== 'structure')
      .sort((a, b) => {
        const rankDiff = requestRoleRank(a.info.role) - requestRoleRank(b.info.role);
        if (rankDiff) return rankDiff;
        const orderDiff = (a.info.roleOrder ?? a.index) - (b.info.roleOrder ?? b.index);
        if (orderDiff) return orderDiff;
        return a.index - b.index;
      })
      .map(item => item.ref);
  }

  function buildReversePrompt({ templateKey = 'auto', detailBlocks = [], imageAliases = [], imageRoles = [], taskType = '' } = {}) {
    const template = TEXT_TEMPLATES[templateKey] || TEXT_TEMPLATES.auto;
    const detailText = detailBlocks.filter(Boolean).join('\n\n');
    const aliasText = imageAliases.length ? `已接入图片：${imageAliases.map(alias => '@' + alias).join('、')}。` : '';
    const detailFrameworkMode = taskType === 'detail-page-framework' || (imageAliases || []).length >= 2;
    const promptLengthRule = '4. finalPrompt：必须是一段完整中文自然语言（120-260字），只描述可迁移的版式/风格骨架，不要确认最终主图，不要写“主图：@图”“参考图：@图”“提示词：”等生图节点工作流标签；必须使用“当前主体/目标主体/主视觉主体”，不得出现参考图旧主体、旧品牌、旧型号、旧颜色、原文案或专属装饰；颜色写主体色重映射，元素写功能等价替换；促销模块缺少详情事实时只写泛化促销词，不编具体价格、日期、地址、规格或功效；必须包含参考图的外框比例、主要版块高度关系、关键窗口/卡片宽高倾斜关系和底部字标完整位置。';
    const taskInstruction = detailFrameworkMode
      ? '请执行“多参考图详情页框架反推”。输出目标是一份统一的淘宝详情页设计框架，不是一张图一条提示词，也不是复述参考图内容；请综合多张参考图，提炼全局视觉系统、页面节奏、模块库、标题区/卖点区/参数区/细节区/保障区/收尾区规则、上下衔接节奏和旧品牌旧文案黑名单。'
      : '请执行“参考图快速反推”。输出目标是可迁移的版式/风格骨架，不是参考图内容复述，也不是替生图节点确认最终主体；优先提取版块数量、版块位置、主体占比、标题/价签/短标签/底部栏功能、布局、字体层级、构图、光影、材质、空间节奏、阅读路径、色彩关系和可替换元素规则。版型必须几何化描述：外框纵横比、留白厚度、上/中/下版块高度、窗口宽高和倾斜角、主体与底部文字的相对位置都要写清。';
    return [
      taskInstruction,
      DESIGN_SKELETON_RULES,
      `当前反推模式：${template.label}。${template.focus}`,
      detailText,
      aliasText,
      '输出必须是严格 JSON，不要 markdown，不要解释，字段如下：',
      '{"taskType":"","inputRoles":[],"subjectRefs":[],"referenceRefs":[],"subjectAnchors":{"category":"","brandOrName":"","visibleProductFacts":[],"mustKeepVisualDetails":[]},"styleSkeleton":{"visualType":"","layoutTemplate":"","composition":"","spatialLayers":"","lighting":"","material":"","typography":"","typographySystem":"","cameraLanguage":"","colorSystem":"","colorRemapRules":"","elementReplacementRules":"","visualRhythm":""},"referenceBlacklist":[],"finalPrompt":""}',
      [
        '字段职责说明：',
        '0. taskType：固定写 "template-only"；inputRoles 可记录输入图片 alias，但 role 只能写 reference；subjectRefs 必须为空数组；referenceRefs 可列出被反推的参考素材 alias。',
        '1. subjectAnchors：只记录参考图中可见的旧主体事实，用于生成 referenceBlacklist；除非用户明确把这张图作为主体图，否则不要把它写成最终主体。',
        detailFrameworkMode
          ? '2. styleSkeleton：输出统一详情页框架，layoutTemplate 必须综合多张参考图写出全局视觉系统、页面节奏、模块库、首屏/卖点/细节/场景/参数/保障/收尾屏规则、上下衔接规则、标题层级、信息卡/价签/短标签/底部栏功能；不要把多张参考图拆成多条互相冲突的提示词。'
          : '2. styleSkeleton：只写可迁移模板，layoutTemplate 必须描述版块数量、相对位置、主体占比、标题区、信息卡/价签/短标签/底部栏，并写清外框纵横比、留白厚度、上/中/下版块高度、窗口宽高和倾斜角、主体与底部文字的相对位置；typographySystem、colorRemapRules、elementReplacementRules 和 visualRhythm 必须写清；不要写参考图旧品牌、旧型号、旧颜色、旧卖点和原文案。',
        '3. referenceBlacklist：动态列出参考图旧主体、旧品牌、旧型号、旧颜色、旧装饰物、旧标题原文、旧卖点/参数/专名；不要写当前主体信息。',
        promptLengthRule
      ].join('\n')
    ].filter(Boolean).join('\n\n').trim();
  }

  function parseJsonLoose(text) {
    const raw = String(text || '').trim();
    if (!raw) return null;
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

  function parseReverseResult(text) {
    const parsed = parseJsonLoose(text);
    if (!parsed || typeof parsed !== 'object') {
      return {
        finalPrompt: '',
        subjectAnchors: {},
        styleSkeleton: {},
        referenceBlacklist: [],
        raw: text,
        parsed: false
      };
    }

    // 新格式：subjectAnchors + styleSkeleton + referenceBlacklist
    // 旧格式兼容：skeleton + blacklist
    const subjectAnchors = parsed.subjectAnchors && typeof parsed.subjectAnchors === 'object'
      ? parsed.subjectAnchors
      : {};
    const styleSkeleton = parsed.styleSkeleton && typeof parsed.styleSkeleton === 'object'
      ? parsed.styleSkeleton
      : (parsed.skeleton && typeof parsed.skeleton === 'object' ? parsed.skeleton : {});
    const referenceBlacklist = Array.isArray(parsed.referenceBlacklist)
      ? parsed.referenceBlacklist
      : Array.isArray(parsed.blacklist)
        ? parsed.blacklist
        : Array.isArray(styleSkeleton.discardedReferenceFacts)
          ? styleSkeleton.discardedReferenceFacts
          : [];
    // subjectAnchors 不做噪声清洗，原样保留
    const finalPrompt = sanitizeReferenceNoise(parsed.finalPrompt || parsed.prompt || text, referenceBlacklist);
    const taskType = String(parsed.taskType || '').trim();
    const inputRoles = Array.isArray(parsed.inputRoles) ? parsed.inputRoles : [];
    const subjectRefs = Array.isArray(parsed.subjectRefs) ? parsed.subjectRefs : [];
    const referenceRefs = Array.isArray(parsed.referenceRefs) ? parsed.referenceRefs : [];
    return { finalPrompt, subjectAnchors, styleSkeleton, referenceBlacklist, taskType, inputRoles, subjectRefs, referenceRefs, raw: text, parsed: true };
  }

  function compileGeneratePrompt({ rawPrompt = '', images = [], details = [], textSkeletons = [], subjectAnchorsList = [], sketches = [], settings = {} } = {}) {
    // 修复：优先使用 settings.referenceMode（节点设置），而不是硬编码 'style-proxy'
    // 这样 'strong' / 'structure' 模式才能传到 PromptEngine
    const referenceMode = settings.referenceMode || 'style-proxy';
    const roleHints = parseImageRoleHints(rawPrompt, images);
    const imageRoles = getImageRoleInfos({ rawPrompt, images, referenceMode, taskType: settings.taskType || '' });
    const roleById = new Map(imageRoles.map(item => [item.id, item]));
    const requestImages = orderRequestImages(images, imageRoles);

    const parts = [];
    if (requestImages.length) {
      parts.push([
        '【硬性优先级】',
        '1. 主体事实优先级：主图和产品资料最高，只决定主体身份、外观、颜色、材质、结构、品牌/标识、可见细节、产品名、卖点、规格、文案和禁用词。',
        '2. 版式优先级（最高）：反推骨架和参考图在版式维度是唯一权威来源；必须完整保留参考图的模块数量、模块排列顺序、各模块在画面中的位置和大小比例。',
        '3. 几何锁版：必须复制参考图的外框纵横比、圆角边框厚度、内边距、留白面积、上/中/下版块高度比例和中心轴；不能把参考图的竖向窗口改成横向窗口，不能把底部文字裁切出画面。',
        '4. 必须保留参考图中的线条（分隔线/边框线/装饰线）、方框/卡片/表格的形状和位置；标题区、价格区、信息卡、底部栏、标签位与参考图一致，不可移动或增减。',
        '5. 主图过大或原始构图与参考图版式冲突时，必须缩放、裁切或重排主体来适应参考图版式，不得为了塞进主体而改变版式结构或撑破参考图的版式边界。',
        '6. 参考图以版式参照模板（Layout Reference）身份进入图像通道，只提取模块网格、分割线、对齐方式、空间比例、图文关系、光影质感、材质表现方式和色彩关系；禁止继承参考图里的旧主体、旧品牌、旧型号、旧文案、旧价格和专属符号。',
        '7. 缺少产品资料明确事实时，价格、活动时间、买赠、地址、规格、功效等模块只保留商业功能并使用泛化促销词，例如“新品优惠”“限时活动”“今日推荐”“人气单品”；禁止编具体数字、日期、地址、规格或功效。'
      ].join('\n'));
    }
    const detailBlocks = details.map(item => item.text).filter(Boolean);
    if (detailBlocks.length) {
      parts.push(detailBlocks.join('\n\n'));
    } else if (requestImages.length) {
      parts.push('【主图识别规则】\n没有接入产品资料节点时，只能根据主图识别可见事实：品类、外形、颜色、材质、包装结构、logo 区域、标签位置和可见文字；禁止编造容量、功率、成分、功效、价格、型号、产地、认证和不可见参数。');
    }

    parts.push([
      '【画面质量兜底】',
      '主体必须明确，场景必须清楚，光线要有合理来源，颜色关系保持干净稳定；每张图优先突出一个视觉中心。',
      '背景、装饰、人群、粒子、反射和次要元素适度简化，不与主体争抢注意力。',
      '避免脏乱、灰暗、过锐、廉价 HDR、塑料感、死黑暗部、杂乱反射、无关细节和全画面均匀高清。',
      '这是普通生图的轻量质量兜底，不自动改成电影剧照，不替用户强行选择焦段/景别/电影风格，也不覆盖主图、产品资料、参考图、反推骨架或智能体写回的优先级。'
    ].join('\n'));

    if (requestImages.length) {
      parts.push('【图片角色】\n' + requestImages.map((ref, index) => {
        const alias = '@' + (ref.alias || ref.title || ('图' + (index + 1)));
        const info = roleById.get(ref.id) || { role: inferImageRole(images, index) };
        if (info.role === 'subject') {
          return `${alias} 是主图：主体身份、外观、颜色、比例、结构、品牌/标识和关键细节都以它为准，不被参考图或产品资料节点改写。`;
        }
        if (info.role === 'support') {
          return `${alias} 是辅助图：只补充同一主体的局部细节、角度、材质和结构信息，不能改变主主体身份，也不能把自己变成最终画面主体。`;
        }
        if (info.role === 'reference') {
          return `${alias} 是参考图（Layout Reference）：上传前会被本地转换成弱细节版式参照模板。模型应从参考图提取版式骨架（外框纵横比、圆角边框、内边距、模块网格、分割线、边框线、卡片/表格形状、对齐方式、空间比例、标题区、价格区、信息卡、底部栏和标签位），并将当前主图主体套入该版式；窗口、卡片和底部字标必须保持参考图的宽高比例、倾斜方向和完整位置；禁止继承参考图中的旧主体、文字、品牌、logo、价格、参数和专属图形符号。`;
        }
        if (info.role === 'sketch') {
          return `${alias} 是分层渲染输入：主体必须保留外观、比例、结构、品牌/标识和标签位置；分层颜色表示自动识别出的背景、前景、环境、道具等非主体元素。分层渲染始终进入 image2 图像通道。`;
        }
        return `${alias} 是输入图：未指定时按主图处理，保留它的真实外观。`;
      }).join('\n'));
    }

    const sketchBlocks = sketches
      .map(item => String(item.text || item.sketchText || '').trim())
      .filter(Boolean);
    if (sketchBlocks.length) {
      parts.push([
        '【分层渲染引导】',
        sketchBlocks.join('\n\n'),
        '语义优先级：主图负责产品外观、品牌、材质和比例；分层渲染负责主体保护、自动分层元素、元素位置、前后层次和粗略构图；产品资料节点负责品牌/产品事实；智能体和反推骨架共同负责版式描述、风格指导和商业提示词；智能体的排版建议权重等同反推骨架，必须被生图模型执行。',
        '渲染要求：主体必须保留身份、轮廓、比例、结构和标签/标识位置；自动分层颜色按对应元素渲染为真实背景、前景、环境或道具；不要输出白底色块图、儿童涂鸦线稿、色块边界或草图标注。'
      ].join('\n'));
    }

    const userPrompt = sanitizeReferenceNoise(normalizeGeneratePrompt(rawPrompt));
    const upstreamPrompt = textSkeletons
      .map((text, index) => {
        const parsed = parseJsonLoose(text);
        const task = parsed && typeof parsed === 'object' ? String(parsed.taskType || '').trim() : '';
        const finalPrompt = parsed && typeof parsed === 'object'
          ? sanitizeReferenceNoise(parsed.finalPrompt || parsed.prompt || '', getReferenceBlacklist(parsed))
          : '';
        const summary = finalPrompt || summarizeTextForImage(text, { includeSubjectAnchors: false, styleOnly: true });
        if (!summary) return '';
        if (task === 'cinema-prompt') {
          return `上游电影节点 ${index + 1}（影像语言高优先级：按电影节点最终提示词执行镜头视角、场景层级、光线、色彩、质感、细节控制和避免项；主图和产品资料仍决定主体事实，参考图和反推骨架仍决定版式结构；电影节点不得覆盖可见主体身份、品牌、型号、参数和产品资料事实）：\n${summary}`;
        }
        const label = '上游反推骨架';
        return `${label} ${index + 1}（版式维度高优先级：必须保留版块数量、排列顺序、相对位置、大小比例、主体占比、外框纵横比、圆角边框、内边距、上/中/下版块高度、标题区、价签/信息卡/短标签/底部栏、分隔线、边框线、卡片/表格形状、阅读路径和促销模块功能；主图和产品资料只决定主体事实；不得迁移旧主体/品牌/型号/标题原文；缺少价格日期等事实时用泛化促销词，不编具体数字）：\n${summary}`;
      })
      .filter(Boolean)
      .join('\n\n');
    const mergedPrompt = [userPrompt, upstreamPrompt].filter(Boolean).join('\n\n');
    if (mergedPrompt) parts.push(`【生成意图】\n${mergedPrompt}`);

    if (requestImages.length) {
      parts.push('【生成逻辑】\n生成一张视觉优先的商业图。按维度执行：主体事实以主图和产品资料为准；版式结构以反推骨架和参考图为准；智能体排版建议与反推骨架同优先级执行。必须尽量照模板保留版块数量、排列顺序、位置比例、主体占比、外框纵横比、圆角边框、内边距、上/中/下版块高度、标题/价签/短标签/底部栏功能、分隔线、边框线、卡片/表格形状、阅读路径、光影、材质和色彩关系；主体外观不能被改成参考图旧主体。不得把竖向展示窗改成横向展示窗，不得裁掉底部字标或让主体压住底部文字。参考图没有参数区时不要硬加参数模块；参考图有促销模块但产品资料没有具体事实时，只写泛化促销词。');
      parts.push(sketchBlocks.length
        ? '【图像通道】\n主图、辅助图和分层渲染会以原图进入 image2；参考图会先在本地转换成弱细节版式参照模板（Layout Reference）再进入 image2，只提供版式、光影、色彩关系和空间节奏，具体包括外框纵横比、圆角边框、内边距、上/中/下版块高度、模块网格、分割线、边框线、对齐方式、空间比例、主体占比和图文关系。必须主动排除旧主体、旧品牌、旧文案、旧价格和旧参数污染；必须保留分层渲染自动识别出的主体，并把自动分层色块按对应元素渲染成真实场景。'
        : '【图像通道】\n主图和辅助图会以原图进入 image2；参考图会先在本地转换成弱细节版式参照模板（Layout Reference）再进入 image2，只提供版式、光影、色彩关系和空间节奏，具体包括外框纵横比、圆角边框、内边距、上/中/下版块高度、模块网格、分割线、边框线、对齐方式、空间比例、主体占比和图文关系。必须主动排除旧主体、旧品牌、旧文案、旧价格和旧参数污染。');
    }

    const compiled = {
      prompt: parts.join('\n\n').trim(),
      imageRoles,
      requestImages,
      referenceMode,
      roleHints,
      warnings: []
    };
    compiled.warnings = validateCompiledPrompt(compiled, { rawPrompt, images, textSkeletons, sketches });
    // 调试：打印 compile 结果
    console.log('[DEBUG] compileGeneratePrompt result:\n' + JSON.stringify({
      referenceMode,
      requestImagesLength: requestImages.length,
      imageRoles: imageRoles.map(r => ({ id: r.id, role: r.role, channel: r.channel })),
      requestImages: requestImages.map(r => ({ id: r.id, alias: r.alias, hasImage: !!r.image }))
    }, null, 2));
    return compiled;
  }

  function validateCompiledPrompt(compiled, source = {}) {
    const warnings = [];
    if (!compiled.prompt) warnings.push('最终提示词为空');
    if ((source.images || []).length > 1 && !compiled.roleHints?.hasExplicitSubject && !compiled.roleHints?.hasExplicitReference) {
      warnings.push('多张图片未显式标注主图/参考图，默认只选一张主图，其余按参考或辅助处理');
    }
    if (!String(source.rawPrompt || '').trim() && !(source.textSkeletons || []).length) {
      warnings.push('缺少用户提示词或上游反推骨架');
    }
    if ((source.sketches || []).some(item => !String(item.text || '').includes('自动分层映射') && !String(item.text || '').includes('替换为'))) {
      warnings.push('分层渲染已连接但颜色映射较少，建议补齐颜色对应元素');
    }
    return warnings;
  }

  function isTextTemplatePrompt(value) {
    const text = String(value || '').trim();
    if (!text) return true;
    if (text === DEFAULT_TEXT_PROMPT) return true;
    if (LEGACY_TEXT_TEMPLATE_PROMPTS.includes(text)) return true;
    return Object.values(TEXT_TEMPLATES).some(item => item.prompt?.trim?.() === text || item.focus?.trim?.() === text);
  }

  return {
    DEFAULT_TEXT_PROMPT,
    TEXT_TEMPLATES,
    LEGACY_TEXT_TEMPLATE_PROMPTS,
    buildReversePrompt,
    parseReverseResult,
    compileGeneratePrompt,
    validateCompiledPrompt,
    summarizeTextForImage,
    isTextTemplatePrompt,
    sanitizeProductNoise,
    sanitizeReferenceNoise,
    SUBJECT_ANCHOR_KEYWORDS,
    normalizeGeneratePrompt,
    extractAliases,
    parseImageRoleHints,
    inferImageRole,
    resolveImageRole,
    getImageRoleInfos,
    orderRequestImages,
    normalizeInputRole,
    escapeRegExp
  };
})();

window.PromptEngine = PromptEngine;
