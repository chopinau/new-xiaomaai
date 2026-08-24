# 小马 AI / lingke.vip「参考图」三步上手（客户开发版）

> 你已经会调 lingke.vip 的生图 API，**唯一卡点**：本地图片 / base64 / 远程 URL 怎么变成小马后端能下载的公网 URL。
> 答案：用我们提供的 `/upload` 端点把图传上 catbox 图床，立刻拿到 24h 有效的公网 URL。
> 整个过程 **30 秒搞定**，上传不需要 API Key。

---

## 0. 30 秒总览

```
你电脑里的图片 ──▶ POST https://api.xiaomaai.net/upload ──▶ 拿到公网 URL ──▶ 塞进 lingke.vip 的生图请求
                  （不要 API Key）                            （24h 有效）        （params.images）
```

---

## 1. 调一次 /upload 拿 URL

**端点**：`POST https://api.xiaomaai.net/upload`
**鉴权**：**不需要**（公开端点）
**Content-Type**：`multipart/form-data`

### 必填字段

| 字段 | 类型 | 取值 | 说明 |
|------|------|------|------|
| `reqtype` | text | `fileupload` | 固定 |
| `time` | text | `1h` / `12h` / `24h` / `72h` | 保留时长，**默认填 `24h`** |
| `fileToUpload` | file | 你的图片 | PNG / JPG / WebP，单文件 ≤ 200MB |

### 返回

```json
{ "url": "https://litter.catbox.moe/abc123.png" }
```

> 这个 `url` 就是你要的"参考图公网 URL"，**24 小时内有效**，足够小马后端用完。

---

## 2. 用 URL 调 lingke.vip 生图

lingke.vip（api.lk888.ai / api.lk666.ai）走 `/v1/media/generate` 异步通道，**参考图放在 `params.images` 数组里**。

### 请求示例（curl）

```bash
# ========== 第一步：上传图拿 URL ==========
REF_URL=$(curl -s -X POST https://api.xiaomaai.net/upload \
  -F "reqtype=fileupload" \
  -F "time=24h" \
  -F "fileToUpload=@./my-reference.png" \
  | python -c "import sys,json;print(json.load(sys.stdin)['url'])")

echo "参考图 URL：$REF_URL"

# ========== 第二步：用 URL 调 lingke.vip ==========
curl -X POST https://api.lk888.ai/v1/media/generate \
  -H "Authorization: Bearer YOUR_LINGKE_VIP_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"model\": \"gpt-image-2\",
    \"prompt\": \"把这张参考图改成赛博朋克风格，霓虹灯，雨夜\",
    \"params\": {
      \"aspectRatio\": \"1:1\",
      \"imageSize\": \"1K\",
      \"images\": [\"$REF_URL\"]
    }
  }"
```

### 返回

```json
{
  "code": 0,
  "data": { "task_id": 123456 },
  "msg": "ok"
}
```

### 第三步：轮询拿结果

```bash
# 每 5 秒查一次，最长 15 分钟
curl "https://api.lk888.ai/v1/skills/task-status?task_id=123456" \
  -H "Authorization: Bearer YOUR_LINGKE_VIP_API_KEY"
```

任务完成时返回里会有 `result_url` 或 `image_url`，那就是生成的图。

---

## 3. 多语言完整示例

### 3.1 Python（最常用）

```python
import requests

# ========== 1. 上传图拿 URL ==========
def upload_to_catbox(image_path: str, ttl: str = "24h") -> str:
    """
    把本地图片上传到 catbox 图床，返回公网 URL（24h 有效）
    不需要 API Key
    """
    with open(image_path, "rb") as f:
        r = requests.post(
            "https://api.xiaomaai.net/upload",
            files={"fileToUpload": (image_path, f, "image/png")},
            data={"reqtype": "fileupload", "time": ttl},
            timeout=60,
        )
    r.raise_for_status()
    return r.json()["url"]


# ========== 2. 用 URL 调 lingke.vip 生图 ==========
def generate_with_reference(
    api_key: str,
    prompt: str,
    ref_urls: list[str],
    model: str = "gpt-image-2",
    size: str = "1024x1024",
    n: int = 1,
) -> int:
    """提交生图任务，返回 task_id"""
    endpoint = "https://api.lk888.ai/v1/media/generate"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    # 把 1024x1024 这种 size 拆成 aspectRatio + imageSize
    w, h = map(int, size.lower().split("x"))
    body = {
        "model": model,
        "prompt": prompt,
        "params": {
            "aspectRatio": f"{w}:{h}",   # 也可填 "1:1" / "16:9" / "auto"
            "imageSize": "1K",          # 1K / 2K / 4K
            "images": ref_urls,         # ← 参考图 URL 数组放这里
        },
    }
    if n > 1:
        body["count"] = n
    r = requests.post(endpoint, headers=headers, json=body, timeout=30)
    r.raise_for_status()
    return r.json()["data"]["task_id"]


# ========== 3. 轮询拿结果 ==========
def poll_result(api_key: str, task_id: int, max_wait_sec: int = 900) -> str:
    """轮询直到任务完成，返回 result_url"""
    import time
    headers = {"Authorization": f"Bearer {api_key}"}
    endpoint_status = f"https://api.lk888.ai/v1/skills/task-status?task_id={task_id}"
    deadline = time.time() + max_wait_sec
    while time.time() < deadline:
        r = requests.get(endpoint_status, headers=headers, timeout=30)
        task = (r.json() or {}).get("data", {}).get("data") or (r.json() or {}).get("data") or {}
        if task.get("is_final") is True or task.get("is_final") == "true":
            err = task.get("error")
            if err:
                raise RuntimeError(f"任务失败：{err}")
            return task.get("result_url") or task.get("url") or task.get("image_url")
        time.sleep(5)
    raise TimeoutError(f"任务 {task_id} 超过 {max_wait_sec}s 未完成")


# ========== 一键使用 ==========
if __name__ == "__main__":
    API_KEY = "sk-your-lingke-vip-key"

    # 1. 上传参考图
    ref_url = upload_to_catbox("./my-reference.png", ttl="24h")
    print(f"参考图 URL：{ref_url}")

    # 2. 提交生图任务
    task_id = generate_with_reference(
        api_key=API_KEY,
        prompt="把这张图改成赛博朋克风格，霓虹灯，雨夜，8K 细节",
        ref_urls=[ref_url],
        model="gpt-image-2",
        size="1024x1024",
    )
    print(f"任务已提交：{task_id}")

    # 3. 等待结果
    result_url = poll_result(API_KEY, task_id)
    print(f"生成结果：{result_url}")
```

### 3.2 Node.js / JavaScript（浏览器 + Node 都可用）

```javascript
import fs from 'node:fs';
import FormData from 'form-data';

const LINGKE_BASE = 'https://api.lk888.ai';
const UPLOAD_BASE  = 'https://api.xiaomaai.net';
const API_KEY = process.env.LINGKE_VIP_KEY;

// 1. 上传图
async function uploadToCatbox(filePath, ttl = '24h') {
  const fd = new FormData();
  fd.append('reqtype', 'fileupload');
  fd.append('time', ttl);
  fd.append('fileToUpload', fs.createReadStream(filePath));
  const r = await fetch(`${UPLOAD_BASE}/upload`, { method: 'POST', body: fd });
  if (!r.ok) throw new Error(`上传失败 HTTP ${r.status}`);
  const { url } = await r.json();
  return url;
}

// 2. 提交生图
async function generateWithReference(prompt, refUrls, opts = {}) {
  const { model = 'gpt-image-2', size = '1024x1024', n = 1 } = opts;
  const [w, h] = size.toLowerCase().split('x').map(Number);
  const body = {
    model,
    prompt,
    params: {
      aspectRatio: `${w}:${h}`,
      imageSize: '1K',
      images: refUrls,
    },
  };
  if (n > 1) body.count = n;
  const r = await fetch(`${LINGKE_BASE}/v1/media/generate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`提交失败 HTTP ${r.status}`);
  const { data: { task_id } } = await r.json();
  return task_id;
}

// 3. 轮询
async function pollResult(taskId, maxWaitMs = 15 * 60 * 1000) {
  const deadline = Date.now() + maxWaitMs;
  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, 5000));
    const r = await fetch(
      `${LINGKE_BASE}/v1/skills/task-status?task_id=${taskId}`,
      { headers: { 'Authorization': `Bearer ${API_KEY}` } },
    );
    const json = await r.json();
    const task = json?.data?.data || json?.data || json;
    if (task?.is_final === true || task?.is_final === 'true') {
      if (task.error) throw new Error(`任务失败：${task.error}`);
      return task.result_url || task.url || task.image_url;
    }
  }
  throw new Error('轮询超时');
}

// 一键使用
const refUrl = await uploadToCatbox('./input.png');
console.log('参考图 URL：', refUrl);

const taskId = await generateWithReference(
  '改成赛博朋克',
  [refUrl],
  { model: 'gpt-image-2', size: '1024x1024' },
);
console.log('task_id =', taskId);

const resultUrl = await pollResult(taskId);
console.log('生成结果：', resultUrl);
```

### 3.3 浏览器端（无后端）

```html
<input type="file" id="file" accept="image/*">
<button id="go">上传 + 生图</button>
<pre id="out"></pre>

<script>
const UPLOAD_URL = 'https://api.xiaomaai.net/upload';
const LINGKE_URL = 'https://api.lk888.ai/v1/media/generate';
const API_KEY = 'sk-your-lingke-vip-key';  // ⚠️ 生产环境走后端代理

async function uploadToCatbox(file) {
  const fd = new FormData();
  fd.append('reqtype', 'fileupload');
  fd.append('time', '24h');
  fd.append('fileToUpload', file);
  const r = await fetch(UPLOAD_URL, { method: 'POST', body: fd });
  if (!r.ok) throw new Error('上传失败');
  return (await r.json()).url;
}

async function generateWithRef(prompt, refUrl) {
  const r = await fetch(LINGKE_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-image-2',
      prompt,
      params: {
        aspectRatio: '1:1',
        imageSize: '1K',
        images: [refUrl],
      },
    }),
  });
  return (await r.json()).data.task_id;
}

document.getElementById('go').onclick = async () => {
  const file = document.getElementById('file').files[0];
  if (!file) return alert('请先选图');
  const out = document.getElementById('out');
  out.textContent = '上传中…';
  const refUrl = await uploadToCatbox(file);
  out.textContent = `参考图 URL：${refUrl}\n提交生图中…`;
  const taskId = await generateWithRef('改成水彩风格', refUrl);
  out.textContent += `\ntask_id = ${taskId}\n轮询中…`;
  // 轮询略（同 Node 版）
};
</script>
```

---

## 4. 多张参考图怎么传

`params.images` 是**有序数组**，按你给的顺序发给模型。**最多张数**取决于模型：

| 模型 | 最大参考图数 |
|------|--------------|
| gpt-image-2 / gpt-image-2-2k | 1-4 |
| gpt-image-2-4k | 1-2（4K 通道窄） |
| gemini-2.5-flash-image | 最多 14 |
| seedream-4 / 4.5 | 最多 10 |
| qwen-image-edit | 1-3 |

```json
{
  "model": "gpt-image-2",
  "prompt": "把图1的构图 + 图2的色调 融合成新海报",
  "params": {
    "aspectRatio": "16:9",
    "imageSize": "1K",
    "images": [
      "https://litter.catbox.moe/aaa.png",  // 图1：构图参考
      "https://litter.catbox.moe/bbb.png"   // 图2：色调参考
    ]
  }
}
```

---

## 5. base64 / dataURL 行不行？

**不行。** lingke.vip 后端只接 `http(s)://` 开头的公网 URL，看到 `data:image/png;base64,...` 会直接报 `unsupported url scheme`。

→ **必须先过一遍 `/upload` 转成公网 URL**。

---

## 6. 性能与省钱技巧

| 技巧 | 怎么做 | 好处 |
|------|--------|------|
| **并发上传** | 5 张图同时 `Promise.all(uploadToCatbox(...))` | 5 张图只花 1-2 秒 |
| **复用 URL** | 同一张图反复生图时，**URL 缓存下来 24h 内不用再传** | 省 catbox 流量 |
| **选合适 TTL** | 测试用 `1h`，生产用 `24h` | 减少 catbox 占用 |
| **提前压缩** | 客户端先压到 2048px 以内 | catbox 上传更快 |

---

## 7. 出问题排错

| 错误现象 | 原因 | 解决 |
|----------|------|------|
| `/upload` 返回 `413` | 文件超过 200MB | 压到 2048px 以内再传 |
| `/upload` 返回 `429` | 上传太频繁 | 加 1-2 秒间隔，或换 IP |
| `/upload` 返回 `502 catbox 返回非 URL` | catbox 拒收（敏感内容/格式错） | 换张图试 |
| lingke.vip 返回 `unsupported url scheme: data:` | 传了 base64 | 走 `/upload` 拿公网 URL |
| lingke.vip 返回 `image download failed` | catbox 上的图过期/被删 | 重新上传拿新 URL |
| `轮询超时` 15 分钟没结果 | 模型卡了/4K 太大 | 改小尺寸或换模型 |

---

## 8. 关键 URL 一览（收藏用）

| 用途 | URL |
|------|-----|
| **上传图拿 URL** | `POST https://api.xiaomaai.net/upload` |
| 提交生图任务 | `POST https://api.lk888.ai/v1/media/generate` |
| 轮询任务状态 | `GET https://api.lk888.ai/v1/skills/task-status?task_id={id}` |
| 备用域 | `api.lk666.ai` / `xomodel.com` / `xiaomageai.com` |

---

## 9. 30 秒抄走版（最快上手）

```bash
# 1. 上传拿 URL
URL=$(curl -s -X POST https://api.xiaomaai.net/upload \
  -F "reqtype=fileupload" -F "time=24h" -F "fileToUpload=@./ref.png" \
  | python -c "import sys,json;print(json.load(sys.stdin)['url'])")

# 2. 调 lingke.vip
TASK=$(curl -s -X POST https://api.lk888.ai/v1/media/generate \
  -H "Authorization: Bearer $LINGKE_VIP_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"model\":\"gpt-image-2\",\"prompt\":\"改成水彩风\",\"params\":{\"aspectRatio\":\"1:1\",\"imageSize\":\"1K\",\"images\":[\"$URL\"]}}" \
  | python -c "import sys,json;print(json.load(sys.stdin)['data']['task_id'])")

echo "task_id = $TASK"
# 3. 等 5-30 秒后跑：curl "https://api.lk888.ai/v1/skills/task-status?task_id=$TASK" -H "Authorization: Bearer $LINGKE_VIP_KEY"
```

> 跑通后，**核心模式 = "先 /upload 拿 URL，再把 URL 塞进 params.images"**。
> 其他都是这个模式的排列组合。

---

> 文档版本：2026-07-14
> 对应源文件：[app/api/upload/route.ts](app/api/upload/route.ts)
