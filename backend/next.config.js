/** @type {import('next').NextConfig} */
const nextConfig = {
  // 编译 workspace 内的 TypeScript 包
  transpilePackages: ['@research-os/shared', '@research-os/database'],

  // 仅作为 API 服务，不需要 React 页面
  // 前端由 Vue 3 独立部署
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: process.env.FRONTEND_URL || 'http://localhost:5173' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PATCH,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type,Authorization' },
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
        ],
      },
    ]
  },
}

module.exports = nextConfig
