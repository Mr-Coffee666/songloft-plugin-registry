# songloft-plugin-lxmusic-api

[![Release](https://img.shields.io/github/v/release/songloft-org/songloft-plugin-lxmusic-api)](https://github.com/songloft-org/songloft-plugin-lxmusic-api/releases)
[![License](https://img.shields.io/github/license/songloft-org/songloft-plugin-lxmusic-api)](LICENSE)

> 仓库地址：https://github.com/songloft-org/songloft-plugin-lxmusic-api

Songloft 的音乐 API 适配层插件，为 TV 端等第三方客户端提供统一的接口形态。本插件基于 [Songloft](https://github.com/songloft-org/songloft) 插件系统开发，URL 与歌词获取能力来自配套的源适配插件 [songloft-plugin-lxmusic](https://github.com/songloft-org/songloft-plugin-lxmusic)。

> 本仓库为示例性的 API 适配壳层，**不附带任何第三方音源数据**。是否接入特定音源由各自的源适配插件负责，使用者需自行负责合规性。

## 功能特性

- **统一搜索 API**：聚合下游音源适配器的搜索能力
- **热搜榜单 / 搜索联想**：透传下游能力
- **播放链接**：代理至源适配插件
- **歌词获取**：代理至源适配插件，并提供本地缓存
- **歌单浏览 / 排行榜**：透传下游能力
- **批量导入**：把搜索结果批量入库

## 技术栈

- **语言**：TypeScript（编译为 QuickJS 字节码）
- **插件框架**：[songloft-plugin-sdk](https://github.com/songloft-org/plugin-toolchain)
- **音乐 SDK**：[musicsdk](https://github.com/songloft-org/jsplugin-musicsdk) —— 仅提供接口约定，不内置任何第三方音源实现

## 架构概览

```
TV / 第三方客户端 → lxmusic-api（本插件）
                     │
                     ├── URL/歌词 ─────→ 源适配插件（代理）
                     ├── 搜索/热搜/联想 ─→ musicsdk 注册的适配器
                     ├── 歌单/排行榜  ──→ musicsdk 注册的适配器
                     └── 批量导入  ────→ 源适配插件（代理）
```

**核心约束**：本插件为纯 API 适配层，URL 和歌词能力依赖配套的源适配插件，请确保已安装并启用对应插件。

## API 接口

API 基础路径：`/api/v1/jsplugin/lxmusic-api`

### 搜索

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| `GET` | `/search` | 是 | 音乐搜索 |
| `GET` | `/hotSearch` | 是 | 热搜榜单 |
| `GET` | `/tipSearch` | 是 | 搜索联想 |

### 播放

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| `POST` | `/url` | 是 | 获取播放 URL |

### 歌词

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| `GET` | `/lyric` | 是 | 获取歌词 |
| `GET` | `/cache/lyric` | 是 | 获取缓存歌词 |
| `POST` | `/cache/lyric` | 是 | 缓存歌词 |

### 歌单

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| `GET` | `/songList/tags` | 是 | 获取标签 |
| `GET` | `/songList/list` | 是 | 获取歌单列表 |
| `GET` | `/songList/detail` | 是 | 获取歌单详情 |
| `GET` | `/songList/search` | 是 | 搜索歌单 |

### 排行榜

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| `GET` | `/leaderboard/boards` | 是 | 获取榜单 |
| `GET` | `/leaderboard/list` | 是 | 获取榜单歌曲 |

### 其他

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| `GET` | `/comment` | 是 | 评论（占位实现，返回空） |
| `GET` | `/config` | 是 | TV 播放器配置 |
| `POST` | `/songs/import` | 是 | 批量导入歌曲 |

## 项目结构

```
songloft-plugin-lxmusic-api/
├── src/
│   ├── main.ts              # 插件入口 (onInit/onDeinit/onHTTPRequest)
│   ├── types.ts             # 类型定义
│   ├── utils/
│   │   └── http.ts          # callHostAPI 封装
│   └── handlers/
│       ├── index.ts         # barrel export
│       ├── search.ts        # 搜索/热搜/联想词 + TV config
│       ├── musicurl.ts      # 播放 URL（代理下游源插件）
│       ├── lyric.ts         # 歌词（代理下游源插件 + 缓存）
│       ├── songlist.ts      # 歌单
│       ├── leaderboard.ts   # 排行榜
│       ├── import.ts        # 批量导入（代理下游源插件）
│       ├── comment.ts       # 评论占位
│       └── response.ts      # 统一响应格式
├── static/                  # 静态资源 (欢迎页)
├── docs/                    # 开发文档
├── package.json
├── plugin.json
├── tsconfig.json
└── README.md
```

## 构建

```bash
npm install
npm run build
```

构建产物位于 `dist/` 目录，生成 `lxmusic-api.jsplugin.zip` 可直接安装。

## 依赖

- Node.js 18+
- 一个或多个 Songloft JS 源适配插件（用于提供实际的 URL 与歌词能力）

## 免责声明

- 本项目**仅供个人学习研究技术使用**，严禁任何形式的商业用途，不得使用本代码进行任何形式的牟利 / 贩卖 / 传播。
- 本项目不附带任何第三方音源数据；接入的下游音源插件可能涉及版权数据，对于这些数据本项目不拥有所有权，为避免侵权，使用者务必在 24 小时内清除使用过程中产生的版权数据。
- 本项目完全免费，仅供个人私下范围研究交流学习技术使用，对于使用者在违反当地法律法规情况下使用本项目所造成的任何违法违规行为，由使用者自行承担。
- 若你使用了本项目，即代表你接受以上声明。

## License

本项目基于 [Apache License 2.0](LICENSE) 开源。
