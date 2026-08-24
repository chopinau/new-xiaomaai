// CinemaPrompt turns the Quill image prompt guide into an in-app node skill.

const CinemaPrompt = (() => {
  const SOURCE_VERSION = 'Quill_GPT电影感提示词_v5.0';
  const FIELD_NAMES = [
    '主要风格',
    '主体',
    '场景',
    '动作或展示目的',
    '镜头',
    '空间层级',
    '光线',
    '色彩',
    '细节控制',
    '参考图继承',
    '问题修复',
    '避免项'
  ];

  const MODE_LABELS = {
    auto: '自动判断',
    'live-action': '真人电影感',
    anime: '动漫电影感',
    commerce: '电商电影感'
  };

  const ROLE_LABELS = {
    subject: '主体',
    scene: '场景',
    style: '风格',
    camera: '镜头参考'
  };

  const ANTI_AI_SUPPRESSION_RULES = [
    'v4 反 AI / 实拍压制模块：v5 负责判断画面目的、镜头、光线、空间和色彩；v4 只作为压制与自检层使用，不恢复旧版 24 字段输出格式。',
    '真人电影感必须像真实摄影机在现场捕捉到的画面，而不是游戏 CG、概念设计图、宣传海报或全身怪物展示；允许雨雾、遮挡、运动模糊、镜头限制和不完整可见性，让巨大主体或复杂场景更像真实拍摄。',
    '避免 8K、超清、极致细节、sharp focus、ultra detailed、HDR 微对比、油腻高光、过度锐化、全画面均匀高清和没有来源的戏剧化光效。',
    '暗部可以深，但必须由合理环境反射光轻轻托起，保留透明层次和干净色相；避免暗部死黑、脏黑阴影、泥灰色块、彩色噪点、颗粒结块和压缩脏斑。',
    '细节有预算：细节集中在主体、脸、手、关键道具或商品识别面；背景、天空、墙面、草地、烟雾、人群和远景保持大色块、低频、安静，不和主体抢戏。',
    '光线必须有来源，例如窗光、阴天漫射光、路灯、霓虹、屏幕光、水面反射或地面反光；不要随机堆光柱、粒子、神秘背光和不解释来源的高亮边。',
    '续改已有提示词时，只修复用户指出的问题和当前结果图暴露的相关缺陷；不要把上一版有效的主体、镜头、场景、光影、色彩和氛围全部推翻。'
  ].join('\n');

  const FINAL_PROMPT_FORBIDDEN_RE = /\b(?:HDR|CG|8K|sharp focus|ultra detailed)\b|游戏|概念图|概念设计|塑料感|塑料装甲|过度锐化|数码锐化|极致细节|超清|全画面均匀高清|死黑|脏黑|彩色噪点|廉价高清|油腻高光|微对比/i;
  const NEGATIVE_SENTENCE_RE = /[^。！？.!?]*(?:避免|不要|不得|禁止|防止|去掉|减少|拒绝|负面约束|negative)[^。！？.!?]*(?:。|！|？|\.|!|\?|$)/gi;
  const POSITIVE_PHOTOGRAPHIC_LINE = '画面保持现场摄影的自然镜头解析，暗部由环境反射轻轻托起，背景维持低频安静，关键主体和现场道具保留真实磨损、接缝、雨水与接触阴影。';
  const EVENT_AND_CAMERA_LINE = '画面必须明确主体正在发生的事件、动作或展示目的，并写出真实相机的机位、距离、焦点落点、景深、轻微裁切、遮挡或空气柔边等现场拍摄痕迹。';

  const CORE_RULES = [
    '你是 小马AI画布 的电影节点，是内置的"生图提示词"skill，不是聊天闲聊助手。',
    '完整遵循 Quill_GPT电影感提示词_v5.0 的 Image Prompt Helper 规则：根据用户的画面想法、参考图或简单修改诉求，整理成清晰可用的 AI 生图提示词。',
    '基础流程必须执行：1 判断主要风格；2 明确主体、场景、动作或展示目的；3 补充合适的镜头、构图、光线和色彩；4 控制背景和次要细节，突出一个视觉中心；5 输出紧凑、连续、可直接使用的最终提示词。',
    ANTI_AI_SUPPRESSION_RULES,
    '默认中文输出；只有用户明确要求英文时才输出英文最终提示词。',
    '不要堆砌空泛质量词，不要输出互相冲突的备选方案。目标是主体明确、场景清楚、光线稳定、颜色干净，并减少杂乱、灰暗、过锐和塑料感。',
    '必须使用这些决策维度进行内部斟酌：' + FIELD_NAMES.map(name => `【${name}】`).join('、') + '。',
    '每一个维度都必须根据用户提示词、图片内容、产品资料、参考图角色和画面目的逐项选择，不能机械套模板、不能随机堆参数、不能为了填字段写无关内容。镜头、构图、光线、色彩、空间、主体细节、背景控制和避免项都要服务最终画面。',
    '【动作或展示目的】是硬性决策项：每次都必须判断画面正在发生什么，或者商品/角色/场景正在执行什么展示任务；不能只写“一个主体在某种风格里”，不能让画面停成静态概念设定。',
    '输入较少时，直接补全合理的镜头、场景和光线，不频繁追问。只有真人写实、动漫插画或商品展示方向无法判断，且不同选择会明显改变结果时，才在 finalPrompt 中短问一次。',
    '风格选择：真实人物、建筑和自然场景默认真人电影感；可爱角色、魔法和幻想冒险默认动漫插画；明确商品展示、白底图、详情页和商业展示默认电商产品。',
    '真人电影感：画面像摄影机捕捉到的真实瞬间，不像宣传海报；人物自然动作，不要完全正面站定或刻意摆拍；必须写出真实相机痕迹，例如机位高度、镜头距离、焦点落点、景深、轻微裁切、前景遮挡、天气或空气造成的柔边、真实构图的不完美；使用明确现场光，例如窗光、阴天自然光、路灯、门洞光或侧逆光；主体清楚，背景适度简化；避免全画面均匀高清、数码锐化、油腻 HDR、过度磨皮、死黑暗部和脏噪点。',
    '动漫插画：使用清楚色块、明确轮廓和干净阴影；根据题材选择鲜明或克制颜色，不要所有颜色同时抢眼；角色、动作或关键道具最清楚，保留镜头感、空间层级和画面节奏，但不要机械套真人摄影词；背景适度简化；草地、云层、石块、建筑和粒子减少碎纹理；避免泥灰阴影、杂色、过度锐化和廉价高清壁纸感。',
    '电商产品：商品轮廓、比例、展示面和关键卖点清楚可读；根据商品目的明确展示任务，例如陈列、使用、材质展示、结构拆解或场景演示；保留真实镜头、材质反光和自然接触阴影，不强行改成纪实抓拍；背景干净，道具不抢主体；使用柔和商业光；避免广角变形、杂乱反射、过暗氛围、遮挡和强烈色偏。',
    '每张图优先确定一个视觉中心。围绕视觉中心补全主体、场景、镜头、空间、光线、色彩和细节；复杂画面不要平均展示所有内容，人物、商品或核心动作最清楚，背景、人群、粒子和装饰减少碎细节。',
    '参考图规则：有参考图时，先提取用户真正需要保留的内容，包括主体特征、姿态、构图、材质、颜色或整体气质，并写入最终提示词；多张参考图合并时，明确核心主体、位置关系、继承内容和统一光线，不要只写“保持原图风格”。',
    '简单修复规则：太脏太乱就减少背景碎纹理、粒子、杂色和无关细节；太锐太数码就降低硬边、微对比和密集纹理，恢复自然边缘；太灰没颜色就明确主色、辅色和点缀色，提高必要色块亮度或饱和度；暗部死黑就增加来源合理的环境反射并保留阴影层次；主体不突出就强化主体明暗、颜色或清晰度并简化背景；真人脸太假就取消过度磨皮和无来源正面补光，让脸服从现场光；动漫画面杂乱就减少颜色数量、背景碎纹理和随机粒子；商品不清楚就恢复商品轮廓、比例、材质反光和接触阴影。',
    '最终提示词必须按顺序组织：1 主体、正在发生的事件/动作/展示目的，以及镜头视角；2 场景层级、光线和色彩；3 正向画面控制。finalPrompt 第一段必须同时出现主体、事件/动作/展示目的和镜头视角；如果缺少事件目的或真实相机信息，必须补足后再输出。finalPrompt 里不要写“避免/不要/禁止/防止”这类负面句，不要出现 HDR、CG、8K、超清、游戏、概念图、塑料感、过度锐化、死黑、彩色噪点等触发词；把这些内部压制要求改写成正向摄影语言，例如现场摄影感、自然镜头解析、环境反射托起暗部、真实材质磨损、接触阴影、背景低频安静、主体附近细节集中。',
    '最终给 image2 的提示词只输出 1-3 段连续自然语言，开头先写画面中最重要的内容；使用明确选择，不写多个备选方案；只保留会明显影响画面的细节；不要添加字段标题，不展示分析过程，不把本系统规则原文或 JSON schema 塞进最终提示词。'
  ].join('\n');

  function modeLabel(mode) {
    return MODE_LABELS[mode] || MODE_LABELS.auto;
  }

  function roleLabel(role) {
    return ROLE_LABELS[role] || ROLE_LABELS.style;
  }

  function normalizeMode(value) {
    return MODE_LABELS[value] ? value : 'auto';
  }

  function normalizeRole(value) {
    return ROLE_LABELS[value] ? value : 'style';
  }

  function buildImageRoleLines(imageRoles = [], images = []) {
    const roleById = new Map((imageRoles || []).map(item => [item.id, normalizeRole(item.role)]));
    return images.map((image, index) => {
      const alias = image.alias || image.title || `图${index + 1}`;
      const role = roleById.get(image.id) || 'style';
      return `@${alias}：${roleLabel(role)}。${roleUsage(role)}`;
    }).join('\n');
  }

  function roleUsage(role) {
    if (role === 'subject') return '锁定主体身份、外观、比例、材质、服装/产品结构和关键可见细节。';
    if (role === 'scene') return '提供环境、天气、空间、背景层次、地面/墙面/空气状态和整体光线来源。';
    if (role === 'camera') return '提供机位、焦段、景别、透视、构图节奏和镜头心理感。';
    return '提供影调、色彩关系、质感、氛围和电影/电商/动漫风格方向。';
  }

  function buildSystemPrompt({ mode = 'auto' } = {}) {
    return [
      CORE_RULES,
      `当前电影节点模式：${modeLabel(normalizeMode(mode))}。`,
      '如果模式为自动，请根据用户文字、图片内容和产品资料判断真人电影感、动漫插画或电商产品；如果商品展示目的明确，优先电商电影感。',
      '输出必须是严格 JSON，不要 markdown，不要解释，不要额外寒暄。',
      outputSchema()
    ].join('\n\n');
  }

  function outputSchema() {
    return [
      'JSON schema:',
      '{"mode":"","imageRoles":[{"id":"","alias":"","role":"subject|scene|style|camera","reason":""}],"structuredFields":{"主要风格":"","主体":"","场景":"","动作或展示目的":"","镜头":"","空间层级":"","光线":"","色彩":"","细节控制":"","参考图继承":"","问题修复":"","避免项":""},"selfCheck":[""],"revisionSummary":"","finalPrompt":""}',
      'structuredFields 是内部决策记录；finalPrompt 必须是一到三段可直接交给 image2 的连续自然语言提示词。不要包含字段标题、分析过程、“主图：”“参考图：”“提示词：”工作流标签。finalPrompt 第一段必须同时写清主体、正在发生的事件/动作/展示目的和镜头视角。finalPrompt 必须只写正向摄影语言，不写“避免/不要/禁止/防止”句，不出现 HDR、CG、8K、超清、游戏、概念图、塑料感、过度锐化、死黑、彩色噪点等触发词。'
    ].join('\n');
  }

  function buildUserPrompt({ draft = '', refs = {}, mode = 'auto', previous = null, imageRoles = [] } = {}) {
    const images = Array.isArray(refs.images) ? refs.images : [];
    const details = Array.isArray(refs.details) ? refs.details : [];
    const textInputs = Array.isArray(refs.textInputs) ? refs.textInputs : [];
    const parts = [
      `本轮模式：${modeLabel(normalizeMode(mode))}`,
      images.length
        ? `已接入图片及当前角色：\n${buildImageRoleLines(imageRoles, images)}`
        : '未接入图片：请根据用户文字想法直接补全一版电影感生图提示词。',
      details.length
        ? `已接入产品资料：\n${details.map(item => item.text || item.summary || '').filter(Boolean).join('\n\n')}`
        : '没有产品资料时，不编造品牌、型号、功效、参数、价格等不可见事实。',
      textInputs.length
        ? `上游文字/反推参考：\n${textInputs.map(item => item.imagePrompt || item.rawText || '').filter(Boolean).join('\n\n')}`
        : '',
      previous?.finalPrompt
        ? `上一版最终提示词：\n${sanitizeFinalPrompt(previous.finalPrompt)}`
        : '',
      previous?.structuredFields
        ? `上一版内部决策：\n${JSON.stringify(previous.structuredFields, null, 2)}`
        : '',
      previous?.selfCheck
        ? `上一版自检：\n${Array.isArray(previous.selfCheck) ? previous.selfCheck.join('\n') : previous.selfCheck}`
        : '',
      draft
        ? `用户本轮想法/修改要求：\n${draft}`
        : '用户没有补充文字：请基于已接入图片生成一版电影感提示词。',
      previous?.finalPrompt
        ? '这是续改任务：按“修改已有提示词”规则，只根据用户本轮反馈调整相关字段，保持上一版主体方向和有效设定，不要重写成无关新方向。'
        : '这是首轮任务：请完整走风格判断、内部决策维度斟酌和最终自检，再输出 finalPrompt。'
    ];
    return parts.filter(Boolean).join('\n\n');
  }

  function parseResult(text) {
    const raw = String(text || '').trim();
    const parsed = parseJsonLoose(raw);
    if (!parsed || typeof parsed !== 'object') {
      return {
        parsed: false,
        mode: 'auto',
        imageRoles: [],
        structuredFields: {},
        selfCheck: [],
        revisionSummary: '',
        finalPrompt: sanitizeFinalPrompt(raw),
        raw
      };
    }
    return {
      parsed: true,
      mode: normalizeMode(parsed.mode),
      imageRoles: Array.isArray(parsed.imageRoles)
        ? parsed.imageRoles.map(item => ({
          id: String(item?.id || ''),
          alias: String(item?.alias || ''),
          role: normalizeRole(item?.role),
          reason: String(item?.reason || '')
        })).filter(item => item.id || item.alias)
        : [],
      structuredFields: parsed.structuredFields && typeof parsed.structuredFields === 'object' ? parsed.structuredFields : {},
      selfCheck: Array.isArray(parsed.selfCheck) ? parsed.selfCheck.map(String).filter(Boolean) : [],
      revisionSummary: String(parsed.revisionSummary || ''),
      finalPrompt: sanitizeFinalPrompt(parsed.finalPrompt || parsed.prompt || raw),
      raw
    };
  }

  function sanitizeFinalPrompt(text) {
    let value = String(text || '').trim();
    if (!value) return '';
    const hadForbidden = FINAL_PROMPT_FORBIDDEN_RE.test(value) || NEGATIVE_SENTENCE_RE.test(value);
    NEGATIVE_SENTENCE_RE.lastIndex = 0;
    value = value
      .replace(NEGATIVE_SENTENCE_RE, '')
      .replace(/\b(?:HDR|CG|8K|sharp focus|ultra detailed)\b/gi, '')
      .replace(/游戏\s*(?:CG)?|概念图(?:质感)?|概念设计(?:图)?|塑料感|塑料装甲|过度锐化|数码锐化|极致细节|超清|全画面均匀高清|死黑(?:暗部)?|脏黑(?:阴影)?|彩色噪点|廉价高清(?:壁纸感)?|油腻高光|微对比/g, '')
      .replace(/[，、；;]\s*[，、；;]+/g, '，')
      .replace(/\s{2,}/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/^[，、；;。\s]+|[，、；;\s]+$/g, '')
      .trim();
    if (hadForbidden && !value) {
      value = POSITIVE_PHOTOGRAPHIC_LINE;
    } else if (hadForbidden && !value.includes('自然镜头解析')) {
      value = `${value}\n\n${POSITIVE_PHOTOGRAPHIC_LINE}`;
    }
    if (hadForbidden && !/正在|进行|接受|使用|展示|演示|维护|检查|行走|回头|看向|穿过|停放|陈列|拆解|拍到|捕捉/.test(value)) {
      value = `${value}\n\n${EVENT_AND_CAMERA_LINE}`;
    }
    return value;
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

  return {
    SOURCE_VERSION,
    FIELD_NAMES,
    MODE_LABELS,
    ROLE_LABELS,
    ANTI_AI_SUPPRESSION_RULES,
    normalizeMode,
    normalizeRole,
    modeLabel,
    roleLabel,
    buildSystemPrompt,
    buildUserPrompt,
    parseResult,
    sanitizeFinalPrompt
  };
})();

if (typeof window !== 'undefined') window.CinemaPrompt = CinemaPrompt;
