# Life 板块 + 站点多页化设计

日期：2026-08-09
状态：已确认（方案一：主页概览 + 独立页）

## 背景与目标

个人主页目前是单页滚动结构，所有内容都在 `app/page.tsx` 由 `config/site.ts` 驱动。两个增长压力：

1. 想新增"个人生活"板块（烘焙、编织），内容形式是**照片 + 配方/心得长文**，会持续更新；
2. 论文数量持续增加，单页 Publications 列表会越来越长。

目标：主页保持精炼的学术概览（一屏刷完的体验），为两类会无限增长的内容（论文、生活记录）各开独立页面。

## 总体架构

- **主页 `/`**：保持单页滚动，但 Publications 区只展示代表作（selected），底部链接到完整列表。
- **`/publications`**：完整论文列表页，按年分组。
- **`/life`**：生活总入口（hub）：每个生活板块一张卡片（烘焙、编织，未来可加摄影、旅行等）。
- **`/life/[category]`**：单个板块的作品列表页（卡片网格）。
- **`/life/[category]/[slug]`**：单篇详情页（照片 + markdown 正文），构建时静态生成。

板块（category）是一等公民：新增板块 = 在配置里加一行 + 新建内容文件夹，不写页面代码。

部署方式不变：`output: 'export'` 静态导出 + GitHub Pages。所有新页面必须兼容静态导出（`generateStaticParams`，无服务端运行时）。

## 内容模型（Life）

### 板块定义

板块列表定义在 `config/site.ts`（新增 `lifeCategories` 字段），每项包含：`id`（目录名/URL 段，如 `baking`）、`name`（显示名）、`emoji`、`description`（一句话简介）、`cover`（hub 卡片封面图）。初始两个板块：`baking`、`knitting`。

### 内容文件

内容以 Markdown 文件按板块分目录存放，**日常更新不碰代码**：

```
content/life/
  baking/basque-cheesecake.md
  knitting/cardigan.md
public/life/
  baking/basque-1.jpg
  knitting/cardigan-1.jpg
```

frontmatter：

```yaml
---
title: 巴斯克蛋糕
date: 2026-08-01
cover: /life/baking/basque-1.jpg
---
```

category 由所在目录决定，不写在 frontmatter 里，避免两处不一致。文件名即 slug。

### 解析与渲染

- frontmatter 解析：`gray-matter`（构建时用）。
- 正文渲染：`react-markdown` + `remark-gfm`（表格支持）。
- 读取：`lib/life.ts` 提供 `getPostsByCategory(category)`（按 date 倒序）和 `getPost(category, slug)`，server component 中用 `fs` 读取，构建期完成。

### 内容作者体验（重要）

站点作者不是前端开发者，写错 markdown 时必须**立刻看到明确报错**，而不是静默产出错误页面：

- 日期格式不合 `YYYY-MM-DD` 时构建失败并报错。
- 任何解析错误的消息都要带上出错的文件路径。
- 正文里误写 `# 标题` 不应产生第二个 `<h1>`。

## 页面设计

### `/life` 总入口（hub）

每个板块一张大卡片：封面图 + emoji + 板块名 + 简介 + 作品数。点击进入 `/life/<category>`。

### `/life/[category]` 板块列表页

板块标题 + 简介 + 作品卡片网格（封面图 + 标题 + 日期）。空状态显示友好提示。`generateStaticParams` 枚举 `lifeCategories`。

### `/life/[category]/[slug]` 详情页

封面大图 + 标题 + 日期 + 所属板块 + ReactMarkdown 正文 + 返回链接。`generateStaticParams` 枚举所有 (category, slug) 组合。

### SEO

三级页面各自设置 metadata（标题、描述、OG 图），不能全部继承根布局的通用信息——站点已配置 OpenGraph，分享卡片要各页有别。

### `/publications` 页

复用现有 `PublicationList` 组件，展示全部论文按年分组。

### 主页改动

`SiteConfig.publications` 新增可选 `selected?: boolean`；主页只渲染 selected 的论文，区块底部加 "View all publications →"。

## 导航与共享布局

- 导航项：About | Publications | CV | Awards | Service | Life
  - Publications → `/publications`、Life → `/life`（页面跳转）
  - About/CV/Awards/Service 保持主页锚点
- Header 需区分链接类型：锚点在主页平滑滚动，在其他页面跳转 `/#<section>`。
- 滚动高亮只在主页生效。

## 明确不做（YAGNI）

不做评论、标签系统、RSS、分页、搜索。不为板块目录名做构建期校验。不提取共享卡片组件（当前重复量适度）。

## 验证方式

- `npm run build` 静态导出成功（所有 slug 均生成）。
- 检查导出的 HTML：markdown 结构正确、各页 title 互不相同、无属性泄漏。
- dev server 截图人工核对：主页代表作区、/publications、/life 三级页面、跨页锚点、移动端 390px 不破版。
