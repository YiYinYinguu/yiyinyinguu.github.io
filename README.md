# 个人学术主页

基于 Next.js 构建的简洁、响应式个人学术主页，部署在 GitHub Pages 上。

## 功能特点

- **响应式设计** - 支持桌面端和移动端
- **多个板块** - 关于我、论文发表、简历、获奖情况、学术服务
- **Markdown 支持** - 内容支持 Markdown 格式编辑
- **交互功能** - 平滑滚动导航和滚动进度指示器
- **易于定制** - 所有个人信息集中在配置文件中

## 技术栈

- **框架**: Next.js 15.1.3
- **UI 库**: React 19
- **样式**: Tailwind CSS 3.4.1
- **语言**: TypeScript
- **部署**: GitHub Pages（使用 GitHub Actions 自动部署）

## 项目结构

```
Lu_website/
├── app/              # Next.js App Router 页面
├── components/       # React 组件
│   ├── layout/       # 布局组件 (Header, Sidebar)
│   └── sections/     # 页面板块组件
│       ├── AboutSection.tsx
│       ├── PublicationList.tsx
│       ├── EducationExperience.tsx
│       ├── AwardsSection.tsx
│       └── ServiceSection.tsx
├── config/          # 配置文件
│   └── site.ts      # 个人信息和内容配置
├── public/          # 静态资源 (图片、logo 等)
└── .github/         # GitHub Actions 工作流
```

## 快速开始

### 环境要求

- Node.js 20 或更高版本
- npm 或 yarn

### 安装依赖

```bash
npm install
```

### 本地开发

```bash
# 运行开发服务器
npm run dev
```

在浏览器中打开 [http://localhost:3000](http://localhost:3000) 查看效果。

### 构建生产版本

```bash
npm run build
```

## 自定义配置

所有个人信息都在 `config/site.ts` 中配置：

- **个人信息**: 姓名、职位、邮箱、院系、大学
- **社交链接**: Google Scholar、Twitter、LinkedIn、GitHub
- **导航菜单**: 菜单项和链接
- **内容配置**: 关于我、新闻动态、论文、教育经历、工作经验、获奖、学术服务

## 部署

本项目使用 GitHub Actions 自动部署到 GitHub Pages。

- **访问地址**: [https://yiyinyinguu.github.io](https://yiyinyinguu.github.io)
- **部署分支**: `homepage-v2`
- **CI/CD**: GitHub Actions 工作流 (`.github/workflows/deploy.yml`)

### 部署流程

1. 推送代码到 `homepage-v2` 分支
2. GitHub Actions 自动构建项目
3. 自动部署到 GitHub Pages
4. 网站在 2-5 分钟内更新完成

## 配置文件

- `next.config.mjs` - Next.js 配置（静态导出）
- `tailwind.config.ts` - Tailwind CSS 自定义配置
- `tsconfig.json` - TypeScript 配置

## 许可证

本项目仅供个人使用。
