/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config, { webpack }) => {
    // pptxgenjs 引用 node:fs，浏览器端不执行该路径，重写为 fs 再置空
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(/^node:/, (resource) => {
        resource.request = resource.request.replace(/^node:/, '')
      })
    )
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    }
    return config
  },
  // output: 'export', // 已移除：API 路由需要服务端渲染，不能静态导出
  // 2026-07: 移除 / → /index.html 的 redirect，让新版市场页 (app/page.tsx) 生效
  // 旧版首页仍可通过 /index.html 直接访问
}

export default nextConfig
