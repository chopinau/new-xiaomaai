'use client'

/**
 * 临时全屏蒙版：遮蔽尚未完善的主站，展示全球站升级公告与跳转入口。
 * 主站完善后，把 TEMP_GATE_ENABLED 改为 false 即可恢复所有页面（无需改动任何页面代码）。
 */
const TEMP_GATE_ENABLED = true

const GLOBAL_URL = 'https://tokenfree.trade/zh-CN'
const DOMESTIC_URL = 'https://xiaomageai.com'

export default function TempGate() {
  if (!TEMP_GATE_ENABLED) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2147483647,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0,
        padding: '48px 24px 72px',
        color: '#ffffff',
        background:
          'radial-gradient(55% 50% at 50% 30%, rgba(124,58,237,0.32) 0%, rgba(76,29,149,0.16) 45%, rgba(11,9,20,0) 72%), ' +
          'radial-gradient(42% 42% at 80% 76%, rgba(6,182,212,0.16) 0%, rgba(11,9,20,0) 70%), ' +
          'radial-gradient(42% 42% at 18% 80%, rgba(217,70,239,0.14) 0%, rgba(11,9,20,0) 70%), ' +
          '#0b0914',
        overflow: 'hidden',
      }}
    >
      <div className="temp-gate-glow" aria-hidden="true" />

      {/* 主体：点击进入全球站（中文） */}
      <a
        href={GLOBAL_URL}
        aria-label="进入全球站"
        className="temp-gate-main"
        style={{
          width: '100%',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textDecoration: 'none',
          color: '#ffffff',
        }}
      >
        {/* 头像 */}
        <div
          className="temp-gate-avatar-wrap"
          style={{
            position: 'relative',
            width: 'clamp(150px, 34vw, 230px)',
            aspectRatio: '1 / 1',
            marginBottom: 26,
          }}
        >
          <div className="temp-gate-avatar-halo" aria-hidden="true" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/temp-gate-avatar.png"
            alt="小马 AI 吉祥物"
            className="temp-gate-avatar"
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              display: 'block',
              filter: 'drop-shadow(0 16px 40px rgba(124,58,237,0.45))',
            }}
          />
        </div>

        {/* 主标题 */}
        <h1
          style={{
            margin: 0,
            textAlign: 'center',
            fontSize: 'clamp(28px, 6.4vw, 50px)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            lineHeight: 1.2,
            background: 'linear-gradient(100deg, #ffffff 8%, #c4b5fd 52%, #67e8f9 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          小马AI全球站服务升级
        </h1>

        {/* 提示语 */}
        <p
          style={{
            maxWidth: 560,
            margin: '20px 0 0',
            textAlign: 'center',
            fontSize: 'clamp(14px, 3.4vw, 17px)',
            lineHeight: 1.85,
            color: 'rgba(226,232,240,0.72)',
          }}
        >
          为提供更全面的 AI 模型体验，部分大厂模型已迁移至全球站，服务更稳定、模型更丰富，价格更实惠。
        </p>

        {/* 按钮 */}
        <span
          className="temp-gate-cta"
          style={{
            marginTop: 34,
            padding: '16px 52px',
            borderRadius: 9999,
            fontSize: 'clamp(15px, 3.6vw, 18px)',
            fontWeight: 700,
            letterSpacing: '0.02em',
            color: '#ffffff',
            background: 'linear-gradient(100deg, #7c3aed, #4c1d95)',
            boxShadow: '0 10px 34px rgba(124,58,237,0.45)',
            border: '1px solid rgba(167,139,250,0.5)',
          }}
        >
          进入全球站
        </span>
      </a>

      {/* 底部：国内站入口 */}
      <a
        href={DOMESTIC_URL}
        aria-label="访问国内站"
        className="temp-gate-domestic"
        style={{
          position: 'absolute',
          bottom: 28,
          left: 16,
          right: 16,
          textAlign: 'center',
          fontSize: 13,
          lineHeight: 1.7,
          color: 'rgba(226,232,240,0.88)',
          letterSpacing: '0.02em',
          textDecoration: 'underline',
          textUnderlineOffset: '4px',
          textDecorationThickness: '1.5px',
          textDecorationColor: 'rgba(167,139,250,0.85)',
        }}
      >
        国内站：xiaomageai.com
      </a>

      <style jsx>{`
        .temp-gate-glow {
          position: absolute;
          top: 12%;
          left: 50%;
          width: min(80vw, 720px);
          height: min(80vw, 720px);
          transform: translateX(-50%);
          border-radius: 50%;
          background: radial-gradient(circle, rgba(124, 58, 237, 0.24) 0%, rgba(124, 58, 237, 0) 68%);
          filter: blur(30px);
          pointer-events: none;
          animation: temp-gate-pulse 6s ease-in-out infinite;
        }
        .temp-gate-avatar-halo {
          position: absolute;
          inset: 12%;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(167, 139, 250, 0.34) 0%, rgba(6, 182, 212, 0.10) 48%, rgba(124, 58, 237, 0) 72%);
          filter: blur(26px);
          animation: temp-gate-breathe 5s ease-in-out infinite;
        }
        .temp-gate-avatar {
          animation: temp-gate-float 5.5s ease-in-out infinite;
        }
        .temp-gate-cta {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .temp-gate-main:hover .temp-gate-cta {
          transform: translateY(-2px);
          box-shadow: 0 16px 44px rgba(124, 58, 237, 0.62);
        }
        .temp-gate-main:active .temp-gate-cta {
          transform: translateY(0);
        }
        .temp-gate-domestic {
          transition: color 0.2s ease, text-decoration-color 0.2s ease;
        }
        .temp-gate-domestic:hover {
          color: #c4b5fd;
          text-decoration-color: #c4b5fd;
        }
        @keyframes temp-gate-pulse {
          0%, 100% { opacity: 0.72; transform: translateX(-50%) scale(1); }
          50% { opacity: 1; transform: translateX(-50%) scale(1.08); }
        }
        @keyframes temp-gate-breathe {
          0%, 100% { opacity: 0.7; transform: scale(0.96); }
          50% { opacity: 1; transform: scale(1.06); }
        }
        @keyframes temp-gate-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @media (prefers-reduced-motion: reduce) {
          .temp-gate-glow, .temp-gate-avatar-halo, .temp-gate-avatar { animation: none; }
          .temp-gate-cta, .temp-gate-domestic { transition: none; }
        }
      `}</style>
    </div>
  )
}
