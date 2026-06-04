# coffee Songloft Plugin Registry

[Songloft](https://github.com/songloft-org/songloft) 个人插件源。

用户在 Songloft「插件商店 → 管理订阅源」中添加以下地址即可浏览并安装本插件源中的所有插件：

```
https://raw.githubusercontent.com/Mr-Coffee666/songloft-plugin-registry/main/registry.json
```

## 包含的插件

| 插件名称 | 说明 |
|---------|------|
| 洛雪音乐API | 洛雪音乐API - TV客户端、xiaomusic 等客户端统一API适配层 |
| 洛雪音源 | 洛雪音源 - 多平台音乐搜索、歌单管理、音源管理 |
| GD音乐台 | 提供基于 GD Studio (music.gdstudio.xyz) 的音乐搜索与高音质下载支持 |

## 制作你自己的插件源

1. **Fork** 本仓库
2. 编辑 `registry.json`，将 `plugins` 数组中的 URL 替换为你自己的插件 `plugin.json` 地址
3. 推送到你的 GitHub 仓库
4. 源地址为：`https://raw.githubusercontent.com/{你的用户名}/songloft-plugin-registry/main/registry.json`

## JSON 格式

```json
{
  "name": "我的插件源",
  "includes": [],
  "plugins": [
    "https://raw.githubusercontent.com/you/your-plugin/main/plugin.json"
  ]
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | string | 否 | 源名称，在 UI 中显示 |
| `includes` | string[] | 否 | 嵌套引用其他源的 URL |
| `plugins` | string[] | 是 | 各插件 `plugin.json` 的 URL |

每个 `plugin.json` URL 由 Songloft 后端自动拉取，解析插件名称、版本、描述等信息，并通过 `updateUrl` 链式获取下载地址。无需在源文件中重复填写。

### 插件配置说明

每个插件目录下需要包含：

- `plugin.json`：插件元数据配置，包含 `updateUrl` 字段指向 `manifest.json`
- `manifest.json`：插件更新清单，包含 `version` 和 `download_url` 字段
- 插件的源代码（`src/` 目录）和静态资源（`static/` 目录）

### 嵌套源

`includes` 可以引用其他插件源，实现聚合分发：

```json
{
  "name": "社区聚合源",
  "includes": [
    "https://raw.githubusercontent.com/alice/plugins/main/registry.json",
    "https://raw.githubusercontent.com/bob/plugins/main/registry.json"
  ],
  "plugins": []
}
```

同一 `entryPath` 出现多次时，保留版本号更高的条目。

详细文档：[插件源制作指南](https://github.com/songloft-org/songloft/blob/main/docs/plugin_registry.md)

## 发布插件

1. 构建插件生成 `.jsplugin.zip` 包
2. 在 GitHub Releases 中发布版本，上传插件包
3. 更新对应插件目录下的 `manifest.json`，将 `download_url` 指向 Releases 中的下载地址
4. 提交并推送更改

## 限制

| 限制 | 值 |
|------|-----|
| 插件总数上限 | 500 个 |
| 递归深度上限 | 20 层 |
| 单个 JSON 大小上限 | 2 MB |
| 单 URL 请求超时 | 15 秒 |

## License

[Apache-2.0](LICENSE)
