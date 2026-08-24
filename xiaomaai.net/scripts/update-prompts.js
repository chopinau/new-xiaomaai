// =====================================================
// Image2 提示词库 - 数据更新脚本
// 从 GitHub API 拉取 awesome-gpt-image-2 相关仓库的最新数据
// 手动运行：node scripts/update-prompts.js
// =====================================================

const fs = require('fs');
const path = require('path');

const GITHUB_REPOS = [
  'YouMind-OpenLab/awesome-gpt-image-2',
  'EvoLinkAI/awesome-gpt-image-2-API-and-Prompts',
  'freestylefly/awesome-gpt-image-2',
];

const OUTPUT_FILE = path.join(__dirname, '..', 'public', 'prompts', 'prompt-data.js');

async function fetchRepoReadme(repo) {
  const url = `https://api.github.com/repos/${repo}/readme`;
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/vnd.github.v3.raw',
      'User-Agent': 'xiaomaai-prompt-updater',
    },
  });
  if (!response.ok) {
    console.error(`  Failed to fetch ${repo}: ${response.status}`);
    return null;
  }
  return response.text();
}

function parsePromptsFromMarkdown(md, source, sourceUrl) {
  const prompts = [];
  // 匹配 Markdown 中的提示词条目（常见格式：**标题** 或 - 标题: prompt）
  const lines = md.split('\n');
  let currentTitle = '';
  let currentPrompt = '';

  for (const line of lines) {
    // 匹配标题行（如 **标题** 或 ## 标题）
    const titleMatch = line.match(/^\*\*(.+?)\*\*|^#{1,3}\s+(.+)/);
    if (titleMatch) {
      if (currentTitle && currentPrompt) {
        prompts.push({ title: currentTitle, prompt: currentPrompt.trim() });
      }
      currentTitle = (titleMatch[1] || titleMatch[2]).trim();
      currentPrompt = '';
    }
    // 匹配提示词内容（引号包裹或多行文本）
    const promptMatch = line.match(/[""](.+?)[""]|Prompt:\s*(.+)|提示词[:：]\s*(.+)/i);
    if (promptMatch) {
      currentPrompt = (promptMatch[1] || promptMatch[2] || promptMatch[3]).trim();
    }
  }

  if (currentTitle && currentPrompt) {
    prompts.push({ title: currentTitle, prompt: currentPrompt.trim() });
  }

  return prompts.map(p => ({
    ...p,
    source,
    sourceUrl,
    author: '@community',
  }));
}

async function main() {
  console.log('Image2 提示词库 - 数据更新\n');

  let allPrompts = [];

  for (const repo of GITHUB_REPOS) {
    console.log(`Fetching ${repo}...`);
    const md = await fetchRepoReadme(repo);
    if (!md) continue;

    const sourceUrl = `https://github.com/${repo}`;
    const source = repo.split('/')[0];
    const prompts = parsePromptsFromMarkdown(md, source, sourceUrl);
    console.log(`  Found ${prompts.length} prompts`);
    allPrompts = allPrompts.concat(prompts);
  }

  console.log(`\nTotal new prompts found: ${allPrompts.length}`);

  if (allPrompts.length === 0) {
    console.log('No new prompts found. Keeping existing data.');
    return;
  }

  // 生成输出文件
  const output = `// =====================================================
// Image2 提示词库 - 精选 200+ 条提示词
// 数据来源: GitHub 公开仓库 (CC BY 4.0)
// 更新: npm run update-prompts
// 自动生成于: ${new Date().toISOString()}
// =====================================================
const PROMPT_LIBRARY = ${JSON.stringify(allPrompts, null, 2)};

// 分类列表（用于筛选按钮）
const PROMPT_CATEGORIES = ['全部', '人物肖像', '产品电商', '场景景观', 'UI/App设计', '动漫漫画', '插画艺术', '3D渲染', '食物饮品', '海报传单', '其他'];
`;

  fs.writeFileSync(OUTPUT_FILE, output, 'utf-8');
  console.log(`\nData written to ${OUTPUT_FILE}`);
  console.log('Done!');
}

main().catch(console.error);