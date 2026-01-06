# B 站字幕下载脚本

用于批量下载 B 站视频字幕的 Node.js 脚本。

## 使用方法

### 1. 从 JSON 数据文件下载

如果你的 JSON 数据文件中包含 `bvid` 字段：

```bash
npm run download-subtitles -- --json public/sample-data.json public/subtitles
```

或者直接使用 node：

```bash
node scripts/download-bilibili-subtitles.js --json public/sample-data.json public/subtitles
```

**注意**：JSON 数据中的 `vlog` 对象需要包含 `bvid` 字段，例如：

```json
{
  "vlog": {
    "platform": "bilibili",
    "episode": "EP01",
    "bvid": "BV1Q2tMzcEa4"
  }
}
```

### 2. 从 BV 号列表下载

```bash
npm run download-subtitles -- --list BV1Q2tMzcEa4 BV1xxx BV2xxx public/subtitles
```

### 3. 下载单个视频

```bash
npm run download-subtitles -- --single BV1Q2tMzcEa4 public/subtitles
```

## 输出格式

字幕文件会保存为 JSON 格式，包含时间戳和文本内容，例如：

```json
{
  "body": [
    {
      "from": 0.0,
      "to": 2.5,
      "location": 2,
      "content": "这是第一句字幕"
    },
    {
      "from": 2.5,
      "to": 5.0,
      "location": 2,
      "content": "这是第二句字幕"
    }
  ]
}
```

## 注意事项

1. **BV 号格式**：确保 BV 号格式正确（如 `BV1Q2tMzcEa4`）
2. **请求频率**：脚本会在每个请求之间延迟 1 秒，避免请求过快
3. **字幕语言**：脚本会优先选择中文字幕（zh-CN, zh-Hans），如果没有则选择其他可用字幕
4. **输出目录**：如果输出目录不存在，脚本会自动创建

## 如果 JSON 中没有 BV 号

如果你的 JSON 数据中没有 `bvid` 字段，你可以：

1. **手动添加**：在 JSON 文件的每个 `vlog` 对象中添加 `bvid` 字段
2. **使用 BV 号列表**：直接使用 `--list` 参数提供 BV 号列表
3. **修改脚本**：在脚本中添加 BV 号映射逻辑

## 字幕数据结构

下载的字幕 JSON 文件结构：

```json
{
  "font_size": 0.4,
  "font_color": "#FFFFFF",
  "background_alpha": 0.5,
  "background_color": "#9C27B0",
  "Stroke": "none",
  "body": [
    {
      "from": 0.0,
      "to": 2.5,
      "location": 2,
      "content": "字幕文本"
    }
  ]
}
```

- `from`: 开始时间（秒）
- `to`: 结束时间（秒）
- `location`: 字幕位置（2=底部）
- `content`: 字幕文本内容

## 提取旅行线索脚本

使用 AI 从字幕文件中提取旅行骑行的线索（日期和地点）。

### 使用方法

#### 1. 批量处理所有字幕文件

```bash
npm run extract-travel-clues -- --api-key "your-openai-api-key"
```

或者直接使用 node：

```bash
node scripts/extract-travel-clues.js --api-key "your-openai-api-key"
```

#### 2. 使用环境变量设置 API 密钥

**PowerShell:**
```powershell
$env:OPENAI_API_KEY="your-openai-api-key"
npm run extract-travel-clues
```

**Bash:**
```bash
export OPENAI_API_KEY="your-openai-api-key"
npm run extract-travel-clues
```

#### 3. 处理单个文件

```bash
node scripts/extract-travel-clues.js --api-key "your-api-key" --file "day001_2025-08-04_第一天：决定开始自律.txt"
```

#### 4. 使用自定义 API 服务

```bash
node scripts/extract-travel-clues.js --api-key "your-api-key" --api-base "https://api.example.com/v1"
```

### 参数说明

- `--api-key`: OpenAI API 密钥（必需）
- `--api-base`: API 基础 URL（可选，默认为 `https://api.openai.com/v1`）
- `--file`: 指定要处理的单个文件（可选，不指定则处理所有文件）

### 输出

提取的线索会保存到 `public/eveyday-clue/` 目录，文件名与原字幕文件相同。

### 注意事项

1. **API 密钥**: 需要有效的 OpenAI API 密钥
2. **处理速度**: 脚本会在每个文件之间延迟 1 秒，避免 API 请求过快
3. **文件跳过**: 如果输出文件已存在，会自动跳过
4. **文本长度**: 如果字幕文本过长（超过 8000 字符），会自动截断
5. **模型选择**: 默认使用 `gpt-4o-mini` 模型（更经济），可以在脚本中修改为 `gpt-4o` 或其他模型

