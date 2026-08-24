---
name: 周报自动生成
slug: ops-weekly
price: ¥9.9
originalPrice: ¥19.9
category: 运营
cover: /workflows/ops-weekly.png
externalUrl: https://dify.ai/templates/ops-weekly
author: 小马 AI
sales: 256
rating: 4.7
tags: [周报, 自动化, 效率]
description: 汇总一周工作内容,自动生成结构化周报,支持飞书/钉钉/企业微信
models: [GPT-5.4-mini]
estimatedCost: ¥0.02/份
---

# 周报自动生成

## 🎯 适用场景
- 互联网公司员工周报
- 项目进度汇报
- OKR 总结

## ✨ 核心能力
1. **多源汇总**:Git 提交 + 飞书任务 + Jira 工单
2. **智能分类**:按项目/模块自动归类
3. **数据可视化**:自动生成完成率、阻塞项图表
4. **多端推送**:飞书/钉钉/企业微信/邮件

## 🔄 流程图
1. 周五 18:00 定时触发
2. 拉取 Git/Jira/飞书数据
3. LLM 整理成周报
4. 生成 PDF + HTML 双版本
5. 推送到指定 IM

## 💰 费用估算
- ¥0.02/份
- 全员 100 人: ¥2/周
