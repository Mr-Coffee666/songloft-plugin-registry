# Songloft Plugin: GD Studio

这是一个基于 GD Studio 提供的免费音乐 API 构建的 Songloft 音源插件。它可以让 Songloft 直接接入各类网络音乐（包括 Netease, Kuwo, Joox 等），支持搜索、试听、歌词和封面加载。

> [!WARNING]
> **免责声明**：本站资源（GD Studio 提供）来自网络，仅限本人学习参考，严禁下载、传播或商用。继续使用将视为同意本声明。如果使用本站提供的 API，请注明出处“GD音乐台(music.gdstudio.xyz)”，尊重作者。

## 特性

- **多源搜索**：支持指定 Netease, Kuwo, Joox 等多种稳定的音源。
- **高音质**：支持指定最高可达 24bit 无损（999级别）的试听体验。
- **歌词支持**：支持 LRC 格式原文歌词及中文翻译。
- **封面加载**：支持高清专辑封面图片加载。

## 限制说明

根据接口提供方的规则，当前访问频率限制为：**5分钟内不超过50次请求**。如果你遇到请求失败，请注意是否触发了频控。

## 安装与开发

```bash
# 安装依赖
npm install

# 编译构建
npm run build

# 验证插件
npm run validate
```
