---
title: Midjourney v7 完全指南
slug: midjourney-v7-guide
category: Midjourney
cover: /manuals/midjourney-v7-guide.png
author: 小马 AI 编辑部
publishedAt: 2026-06-20
updatedAt: 2026-08-05
views: 9820
tags: [Midjourney, AI 绘画, 提示词]
relatedTools: [midjourney, dalle, stable-diffusion]
---

# Midjourney v7 完全指南

Midjourney v7 是当前最强的 AI 绘画模型之一,以艺术感和美学著称。

## 产品介绍

Midjourney v7 的核心特性:
- 🎨 **艺术感最强**:在风格化任务上无出其右
- 🖼️ **超高分辨率**:支持 2048×2048
- 🔄 **强大的风格参考**:`--sref` 参数
- 👤 **人物一致性**:`--cref` 参数

## 5 个实战案例

### 案例 1:商业海报
**提示词**:
```
a cinematic poster for a sci-fi movie "Neon City",
cyberpunk style, neon lights, raining, --ar 16:9 --s 750 --v 7
```

### 案例 2:产品概念图
**提示词**:
```
a futuristic sneaker design, white and orange color,
studio lighting, 3D render, --ar 1:1 --v 7
```

### 案例 3:角色设计
**提示词**:
```
a young female warrior with silver armor and red cape,
full body, fantasy art style, --ar 2:3 --v 7
```

### 案例 4:建筑可视化
**提示词**:
```
a modern minimalist villa in the forest, sunset lighting,
architectural digest style, --ar 16:9 --v 7
```

### 案例 5:插画风格
**提示词**:
```
a children's book illustration, a fox reading a book under a tree,
watercolor style, soft colors, --ar 1:1 --niji 7
```

## 进阶玩法

### 1. 风格参考 --sref
上传一张参考图,提取其风格:
```
a cat sitting on a windowsill --sref https://example.com/style.jpg
```

### 2. 角色参考 --cref
保持角色一致性,适合系列创作:
```
a girl walking in the park --cref https://example.com/character.jpg
```

### 3. 多图融合 --iw
控制参考图的影响权重(0-2):
```
[主提示词] --iw 1.5
```

## 提示词合集

```text
1. 写实人像: "a portrait of [人物描述], natural lighting, 85mm lens"
2. 概念艺术: "[主题] concept art, by [艺术家名], detailed"
3. 3D 渲染: "[物体] 3D render, octane, studio lighting"
4. 复古风: "vintage [主题], 1980s style, grain, faded colors"
5. 极简: "minimalist [主题], clean background, simple lines"
```
