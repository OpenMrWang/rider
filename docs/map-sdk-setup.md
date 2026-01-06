# 地图 SDK 配置说明

本项目支持三种地图：OSM（OpenStreetMap）、高德地图、百度地图。

## OSM 地图

OSM 地图无需配置，默认可用。使用 MapLibre GL JS 实现。

## 高德地图

### 1. 获取 API Key

1. 访问 [高德开放平台](https://console.amap.com/dev/key/app)
2. 注册/登录账号
3. 创建应用，选择"Web端(JS API)"
4. 获取 Key

### 2. 引入 SDK

在 `index.html` 的 `<head>` 标签中添加：

```html
<script src="https://webapi.amap.com/maps?v=2.0&key=YOUR_AMAP_KEY"></script>
```

将 `YOUR_AMAP_KEY` 替换为你的实际 Key。

### 3. 使用

在应用中选择"高德"地图即可使用。

## 百度地图

### 1. 获取 AK (Access Key)

1. 访问 [百度地图开放平台](https://lbsyun.baidu.com/apiconsole/key)
2. 注册/登录账号
3. 创建应用，选择"浏览器端"
4. 获取 AK

### 2. 引入 SDK

在 `index.html` 的 `<head>` 标签中添加：

```html
<script src="https://api.map.baidu.com/api?v=3.0&ak=YOUR_BAIDU_AK"></script>
```

将 `YOUR_BAIDU_AK` 替换为你的实际 AK。

### 3. 使用

在应用中选择"百度"地图即可使用。

## 注意事项

1. **坐标转换**：项目内部使用 WGS-84 坐标系存储数据，在使用高德/百度地图时会自动转换为对应的坐标系（GCJ-02/BD-09），但原始数据不会被修改。

2. **按需加载**：如果不需要使用高德或百度地图，可以不引入对应的 SDK，应用会继续正常工作（仅 OSM 地图可用）。

3. **API 配额**：高德和百度地图都有免费配额，超出后可能需要付费。请查看各自的官方文档了解详情。

4. **安全建议**：
   - 生产环境建议使用域名白名单限制 Key/AK 的使用范围
   - 不要将 Key/AK 提交到公开的代码仓库

