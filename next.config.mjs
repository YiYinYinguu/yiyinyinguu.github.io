/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // 静态导出，用于 GitHub Pages 部署
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
