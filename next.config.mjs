/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // 静态导出，用于 GitHub Pages 部署
  // 每个路由导出成 <路由>/index.html。不加这个的话 /life/baking 会同时存在
  // baking.html 和 baking/ 目录，静态服务器碰上同名就分不清该给哪个。
  trailingSlash: true,
  images: {
    unoptimized: true, // GitHub Pages 不支持 Next.js 图片优化，需要禁用
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'spaces-cdn.owlstown.com',
      },
    ],
  },
};

export default nextConfig;
