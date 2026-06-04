# GitHub Releases 发布指南

## 快速开始

### 一键构建所有插件

```powershell
.\scripts\build-all.ps1
```

产物自动复制到 `releases/` 目录。

### 一键发布所有插件

```powershell
# 1. 安装 GitHub CLI（如未安装）
winget install GitHub.cli

# 2. 登录 GitHub
gh auth login

# 3. 发布所有插件
.\scripts\publish-release.ps1 -All
```

---

## 详细流程

### 单独构建插件

```powershell
cd plugin/<插件目录>
npm install
npm run build
```

### 发布单个插件

```powershell
# 发布指定插件
.\scripts\publish-release.ps1 -Plugin lxmusic-api

# 指定版本号
.\scripts\publish-release.ps1 -Plugin gdstudio -Version 1.0.1

# 其他选项
.\scripts\publish-release.ps1 -Plugin lxmusic-api -Draft      # 草稿
.\scripts\publish-release.ps1 -Plugin lxmusic-api -Prerelease # 预发布
```

---

## 快速参考

### 插件速查表

| 插件 | entryPath | 标签格式 | 构建产物路径 |
|------|-----------|---------|-------------|
| 洛雪音乐API | `lxmusic-api` | `lxmusic-api-v{版本}` | `plugin/songloft-jsplugin-lxmusic-api-main/dist/lxmusic-api.jsplugin.zip` |
| 洛雪音源 | `lxmusic` | `lxmusic-v{版本}` | `plugin/songloft-jsplugin-lxmusic-main/dist/lxmusic.jsplugin.zip` |
| GD音乐台 | `gdstudio` | `gdstudio-v{版本}` | `plugin/songloft-plugin-gdstudio-main/dist/gdstudio.jsplugin.zip` |

### 常用命令

```powershell
# 构建所有插件
.\scripts\build-all.ps1

# 发布所有插件
.\scripts\publish-release.ps1 -All

# 查看发布脚本参数
Get-Help .\scripts\publish-release.ps1
```

### 插件源地址

```
https://raw.githubusercontent.com/Mr-Coffee666/songloft-plugin-registry/main/registry.json
```

---

## 更新插件流程

1. 修改插件代码
2. 更新 `plugin.json` 中的 `version` 字段
3. 重新构建：`.\scripts\build-all.ps1`
4. 提交并推送代码
5. 发布：`.\scripts\publish-release.ps1 -Plugin <名称> -Version <版本>`

---

## 常见问题

| 问题 | 原因 | 解决 |
|------|------|------|
| 构建报错 `无法加载文件` | PowerShell 执行策略 | `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned` |
| `npm run build` 报错 `module not found` | 依赖未安装 | 在插件目录执行 `npm install` |
| 插件商店看不到插件 | 哈希值不为空 / 未推送 / raw 缓存 | 确认 `entryHash` 和 `zipHash` 为空；确认 `git push` 成功；等待 raw 缓存刷新 |
| 插件下载失败 | Release 不存在 / 文件名不匹配 / 草稿状态 | 检查 Release 标签和附件文件名是否与 `manifest.json` 一致；确认已发布 |
| `git push` 失败 | 网络 / 代理问题 | 配置或取消代理：<br>`git config --global http.proxy http://127.0.0.1:7890`<br>`git config --global --unset http.proxy` |
