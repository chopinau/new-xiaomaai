---
name: 代码审查助手
slug: dev-codereview
price: ¥29.9
originalPrice: ¥59.9
category: 程序员
cover: /workflows/dev-codereview.png
externalUrl: https://dify.ai/templates/dev-codereview
author: 小马 AI
sales: 86
rating: 4.9
tags: [代码审查, Git, CI/CD]
description: 自动审查 PR 代码,识别 bug、安全漏洞、性能问题,生成审查报告
models: [Claude-Sonnet-5, GPT-5.5]
estimatedCost: ¥0.3/次
---

# 代码审查助手

## 🎯 适用场景
- 中小团队 Code Review
- 开源项目维护者
- 个人项目自检

## ✨ 核心能力
1. **Bug 检测**:空指针、数组越界、类型错误
2. **安全审计**:SQL 注入、XSS、CSRF
3. **性能建议**:N+1 查询、内存泄漏
4. **风格统一**:ESLint 规则增强
5. **自动生成评审报告**:Markdown 格式

## 🔄 流程图
1. Git Hook 触发
2. 拉取 diff
3. 多模型协同审查(Claude + GPT)
4. 合并建议去重
5. 生成结构化报告
6. PR 评论自动发布

## 💰 费用估算
- 平均 200 行代码: ¥0.3/次
- 团队 100 PR/月: ¥30
