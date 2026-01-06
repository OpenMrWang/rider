## 王师傅骑行路线可视化

### 项目愿景

**王师傅骑行路线可视化** 是一个用地图和数据把「王师傅的日记：第一季」完整骑行旅程还原出来的开源项目：

- **目标**：
  - 把每天的路线、分段行程、关键节点（起点 / 落脚点 / 轮渡 / 大坡 / 景点…）结构化保存。
  - 在地图上 **可视化整条旅程**（总览 + 每日视图），并为后续展示、分析、创作打好数据基础。
  - 做一份 **开放的骑行旅程数据集 + 地图 UI + 工具脚本**，方便任何人复用和二次开发。
- **非常希望大家协助**：
  - 一起补完 / 修正每天的路线数据（点位、规划路线、距离）。
  - 一起改进前端体验或增加新特性（导出 GPX / KML、更多地图源、更丰富的统计等）。

项目定位是：**“骑行旅程数据档案 + 地图前端 + 数据工具”**，不是一个封闭成品网站，而是一套可持续维护、可拓展的工具箱。

---

## 技术栈

- **前端框架**：React 18 + TypeScript
- **构建工具**：Vite
- **样式**：Tailwind CSS
- **地图相关**：
  - 默认在线使用 **百度地图 JS API v3**（含坐标转换 & 骑行路径规划）
  - 已实现 OSM + MapLibre 适配器（便于将来拓展不同底图）
- **地理计算**：
  - `@turf/turf`：里程计算、几何操作
  - `gcoord`：WGS‑84 / GCJ‑02 / BD‑09 坐标系转换
- **Node.js 脚本**：
  - `scripts/download-subtitles-from-videos.js`：批量下载 B 站视频 AI 中文字幕
  - `scripts/extract-subtitle-text.js`：从字幕 JSON 中提取纯文本
  - `scripts/merge-everyday-to-sample.js`：合并每日 JSON + 线索文本，生成 `everyday-merged.json`

---

## 数据结构概览

主要数据结构在 `src/types/index.ts` 中定义，核心为 `TripData` / `DayRecord`：

- **TripMeta**

```ts
interface TripMeta {
  title: string;
  author: string;
  description: string;
}
```

- **Point**

```ts
interface Point {
  name: string;
  lat: number; // WGS-84
  lon: number; // WGS-84
}
```

- **DayRecord**

```ts
interface DayRecord {
  day: number;
  date: string;
  // 可选：扩展字段（在 everyday JSON 中已有）：
  // title, video, goal, meta, segments, clue 等

  points: Point[];

  // 支持单段或多段路线：
  // - 手工/脚本生成：LineString（按 points 连线）
  // - 百度骑行规划：LineString 或 MultiLineString
  routeGeoJSON: GeoJSON.LineString | GeoJSON.MultiLineString | null;

  // 单日总距离（公里），由 routeGeoJSON 或 points 计算而来
  distanceKm: number | null;
}
```

- **TripData**

```ts
interface TripData {
  meta: TripMeta;
  days: DayRecord[];
}
```

---

## 运行与开发

### 环境要求

- Node.js 18+
- Yarn 或 npm

### 安装依赖

```bash
yarn
# 或
npm install
```

### 开发模式（带编辑功能）

```bash
yarn dev
# 或
npm run dev
```

打开浏览器访问 `http://localhost:5173`，在 **开发环境** 下你会看到：

- **顶部**：`王师傅骑行` 标题 + favicon (`public/wsf.webp`)
- **主体布局（App.tsx）**：
  - 左侧大区域：`MapView`（默认百度地图）
    - 默认展示所有天的合并路线
    - 选中某一天时展示该日的路线，自动缩放以适配所有点
  - 右上：`DayList`（每日列表，分页 + 倒序）
  - 右下：`DayDetail`（当前天的详情）
  - 底部：`DataManager`（数据导入/导出/重置）

### 只读模式（生产环境默认）

```bash
yarn build
yarn preview
# 或将 dist 部署到任意静态服务器
```

在 **生产构建** 中：

- `AppContent` 中会检测 `import.meta.env.DEV`：
  - 若为 `false`（生产环境），直接返回 `<ReadOnlyView />`
  - 即：**只显示只读视图，不暴露编辑/数据管理 UI**
- `ReadOnlyView` 布局：
  - 左侧：地图（百度）
  - 右上：每日列表（只读）
  - 右下：当天详情（title / goal / meta / segments / clue）

---

## 默认数据加载（everyday-merged.json）

项目在 `useTripData` 中实现了默认数据加载逻辑：

- 首次加载且当前 `tripData.days.length === 0` 时：
  - 尝试 `fetch('/everyday-merged.json')`
  - 若成功，使用 `importTripData` 解析并 `setTripData(data)`
- 这意味着：
  - 在生产部署时，只要你将最新的 `everyday-merged.json` 放在 `public` 目录下，页面就会自动使用它作为默认数据。
  - 如果你在开发时想切换数据，可以通过右下角的「导入 JSON」按钮手动导入其它文件。

---

## 数据文件说明

### 1. 单日数据（可编辑源）

- 目录：`public/everyday/`
- 命名：`day0xx_YYYY-MM-DD_标题.json`
- 示例结构：

```json
{
  "day": 44,
  "date": "2025-09-19",
  "title": "两天从上海骑到杭州上",
  "video": { "season_id": 6103236, "...": "..." },
  "goal": { "deadline": "...", "description": "..." },
  "meta": { "...": "..." },
  "segments": [
    {
      "order": 1,
      "type": "ride",
      "mode": "bike",
      "from": { "name": "上海市内（出发点）", "...": "..." },
      "to": { "name": "陈年线城航路轮渡口附近", "...": "..." }
    }
    // ...
  ],
  "clue": "从线索文本抽取的长段说明...",
  "points": [
    { "name": "宁波奉化区", "lat": 29.6574, "lon": 121.4024 },
    { "name": "宁海县", "lat": 29.2904, "lon": 121.4255 }
  ],
  "routeGeoJSON": {
    "type": "LineString",
    "coordinates": [
      [121.4024, 29.6574],
      [121.4255, 29.2904]
    ]
  },
  "distanceKm": 105.23
}
```

> **建议**：把「权威版」数据维护在 `public/everyday/` 下，通过脚本合并为 `everyday-merged.json`，再供前端默认加载。

### 2. 行程线索文本

- 目录：`public/everyday-clue/`
- 命名与 `everyday` 对应：`day0xx_YYYY-MM-DD_....txt`
- 内容是「旅行骑行线索提取」，用于人工阅读和辅助编辑：

```text
旅行骑行线索提取

日期信息：
- 2025年9月19日 早上11:23分 - 从上海出发
...
```

> 合并脚本会去掉开头的「旅行骑行线索提取」及紧随的空行，把剩余内容存入 `clue` 字段。

### 3. 合并数据

- 文件：`public/everyday-merged.json`
- 由 `scripts/merge-everyday-to-sample.js` 生成：

```bash
yarn merge-everyday
```

生成结构即为 `TripData`：

```json
{
  "meta": { "title": "...", "author": "...", "description": "..." },
  "days": [ /* 多个 DayRecord */ ]
}
```

这是生产环境默认加载的数据源。

---

## 数据编辑与路线规划工作流

### 在开发环境中编辑某一天

1. 启动开发环境：

```bash
yarn dev
```

2. 确认加载了 `everyday-merged.json` 或手动导入你的 JSON。

3. 在右侧 `DayList` 中选择某一天：
   - 地图显示该日路线（若有）
   - 下方 `DayDetail` 展示 `goal` / `meta` / `segments` / `clue`。

4. 点击列表中的 **「编辑」**：
   - 进入 `PointEditor`：
     - 左侧：百度地图 + 当天详情
     - 右侧：点位编辑 + 百度地址解析 + 当天 JSON 预览

5. 在编辑页中，你可以：

- **从分段生成点位**：

  - 按 `segments` 中每段的 `from` / `to` 生成一组点位（去重）。

- **地图点击选点**：

  - 直接在百度地图上点击，即可为当前编辑的点写入经纬度；
  - 若没有正在编辑的点，将自动新建一个点。

- **百度地址解析**：

  - 在某一行点击「编辑」，输入地点或地址关键词；
  - 点击「地址解析」：
    - 使用 `BMap.Geocoder.getPoint(name, city?)` 获取 BD‑09 坐标；
    - 通过 `gcoord` 转为 WGS‑84，写入当前点的 `lat` / `lon`。

- **使用百度骑行重新规划**：

  - 点击「使用百度骑行重新规划」：
    - 对当前 `points` 两两调用百度骑行路线规划；
    - 把每一段的 path 抽取出来，合并为 `LineString` 或 `MultiLineString`；
    - 写入 `routeGeoJSON`（WGS‑84 坐标）并更新 `distanceKm`。
  - 规划只在你点击按钮时触发一次，避免在浏览/编辑时反复调用百度 API。

- **JSON 预览与复制**：

  - 右侧有「当天 JSON 数据」预览（只读）。
  - 按下「复制 points + routeGeoJSON」按钮，会复制出类似片段：

    ```json
      "points": [
        { "name": "宁波奉化区", "lat": 29.657496082639064, "lon": 121.40248192502118 },
        { "name": "宁海县", "lat": 29.290482296669907, "lon": 121.4255256530645 }
      ],
      "routeGeoJSON": {
        "type": "LineString",
        "coordinates": [
          [121.40248192502118, 29.657496082639064],
          [121.4255256530645, 29.290482296669907]
        ]
      },
      "distanceKm": 105.23,
    ```

    方便你直接粘贴回 `public/everyday/day0xx_...json` 中对应的位置。

6. 点击「保存」：
   - 当前天的 `points` / `routeGeoJSON` / `distanceKm` 会写回全局 `TripData`。

7. 多天编辑完成后：
   - 可以通过 `DataManager` 导出一份新的 JSON；
   - 或将 `public/everyday` 中每天的 JSON 更新后，重新运行：

```bash
yarn merge-everyday
```

   - 生成最新的 `public/everyday-merged.json`，用于部署。

---

## 如何参与与协作

非常欢迎你参与这个项目，无论是：

- **数据贡献**：
  - 校正每天的 `points` + `routeGeoJSON`，尽量贴近真实路线；
  - 补充/修正 `segments`（更精细的分段）、`meta`（统计信息）、`clue`（文字说明）。

- **功能开发**：
  - 增加新的地图底图（高德 / OSM 切换、更好看的样式）。
  - 支持导出 GPX / KML 等格式，方便导航设备或其他应用使用。
  - 增加统计视图：累计海拔、每天爬升、平均速度等（需要额外数据）。

- **脚本 & 工具**：
  - 优化 B 站字幕抓取与 AI 字幕匹配逻辑；
  - 自动将字幕中的地名 / 事件与地图上的节点关联；
  - 为其他系列（第二季 或 其他骑行作者）建立新的数据管线。

### 贡献方式

- Fork 仓库，创建你的分支，完成修改后提交 PR；
- 或先在 Issue 中描述你的想法、数据来源、模型设计，一起讨论确定方案；
- 如果你只想贡献数据，也可以直接发整理好的 JSON / 文本，我们一起整合进仓库。

---

## 致谢

感谢王师傅的公开视频记录，让这样一条真实的长途骑行路线有机会在数据和地图上被“复刻”出来。  
也感谢每一位愿意为这个项目贡献数据、代码或想法的朋友——希望它最终能成为一个 **由社区共同维护的骑行旅程档案**，也能启发更多关于出行、地理和生活的有趣创作。 ***

