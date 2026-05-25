import { ImageResponse } from 'next/og';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#2C1A0E',
          position: 'relative',
        }}
      >
        {/* Subtle texture overlay using radial gradient */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 70% 50%, rgba(185,28,28,0.18) 0%, transparent 65%)',
          }}
        />

        {/* Decorative top line */}
        <div style={{ position: 'absolute', top: 60, left: 80, right: 80, height: 1, background: 'rgba(255,255,255,0.12)', display: 'flex' }} />
        <div style={{ position: 'absolute', bottom: 60, left: 80, right: 80, height: 1, background: 'rgba(255,255,255,0.12)', display: 'flex' }} />

        {/* Main content */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, zIndex: 1 }}>
          {/* Brand name */}
          <div
            style={{
              fontFamily: 'serif',
              fontSize: 96,
              fontWeight: 900,
              color: '#F5F0E8',
              letterSpacing: '0.18em',
              lineHeight: 1,
              marginBottom: 16,
            }}
          >
            ДАНЛЕОН
          </div>

          {/* Crimson divider */}
          <div style={{ width: 64, height: 3, background: '#B91C1C', marginBottom: 24, display: 'flex' }} />

          {/* Tagline */}
          <div
            style={{
              fontFamily: 'serif',
              fontSize: 28,
              color: 'rgba(245,240,232,0.65)',
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
            }}
          >
            Uganda Coffee
          </div>
        </div>

        {/* Bottom URL */}
        <div
          style={{
            position: 'absolute',
            bottom: 44,
            fontFamily: 'serif',
            fontSize: 18,
            color: 'rgba(245,240,232,0.3)',
            letterSpacing: '0.15em',
          }}
        >
          danleon.ru
        </div>
      </div>
    ),
    { ...size }
  );
}
