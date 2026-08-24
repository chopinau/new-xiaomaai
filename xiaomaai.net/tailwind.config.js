/** @type {import("tailwindcss").Config} */
export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // 小马 AI 品牌色阶：紫罗兰微色调中性色
        ink: {
          0:    '#ffffff',
          50:   '#faf9fe',
          100:  '#f3f0fa',
          200:  '#e8e4f0',
          300:  '#d4cde4',
          400:  '#a9a0be',
          500:  '#7c7a8a',
          600:  '#5a5770',
          700:  '#44415a',
          800:  '#2e2b42',
          900:  '#1e1b2e',
          1000: '#12101c',
        },
        // 状态色（仅功能性使用）
        success: '#10b981',
        warning: '#f59e0b',
        danger:  '#ef4444',
        info:    '#3b82f6',
        // 小马 AI 品牌色
        brand: {
          purple: '#7c3aed',
          blue:   '#06b6d4',
          pink:   '#d946ef',
          deep:   '#4c1d95',
          glow:   '#a78bfa',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'PingFang SC', 'Microsoft YaHei', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'card':  'none',
        'hover': '0 1px 0 0 rgba(0,0,0,0.04)',
      },
      borderRadius: {
        'card': '6px',
      },
      // 关键：让 Tailwind v4 识别 ink-* 颜色
      keyframes: {
        marquee: {
          '0%':   { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        marquee: 'marquee 30s linear infinite',
      },
    },
  },
  plugins: [],
}
