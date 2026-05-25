import { ImageResponse } from 'next/og';
import { getProductBySlug } from '@/lib/sanity';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProductBySlug(id).catch(() => null);

  const name = product?.name ?? 'Кофе ДАНЛЕОН';
  const price = product?.price ?? null;
  const imageUrl = product?.image ?? null;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: '#2C1A0E',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Right: product image with dark fade */}
        {imageUrl && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt=""
              style={{
                position: 'absolute',
                right: 0,
                top: 0,
                width: 560,
                height: 630,
                objectFit: 'cover',
                objectPosition: 'center',
              }}
            />
            {/* Fade from espresso to transparent */}
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: 0,
                width: 560,
                height: 630,
                background: 'linear-gradient(to right, #2C1A0E 0%, rgba(44,26,14,0.4) 55%, rgba(44,26,14,0) 100%)',
                display: 'flex',
              }}
            />
          </>
        )}

        {/* Left: text content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '60px 80px',
            flex: 1,
            zIndex: 1,
          }}
        >
          {/* Brand */}
          <div
            style={{
              fontFamily: 'serif',
              fontSize: 22,
              color: 'rgba(245,240,232,0.45)',
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              marginBottom: 28,
            }}
          >
            ДАНЛЕОН
          </div>

          {/* Product name */}
          <div
            style={{
              fontFamily: 'serif',
              fontSize: name.length > 20 ? 54 : 68,
              fontWeight: 900,
              color: '#F5F0E8',
              letterSpacing: '0.06em',
              lineHeight: 1.1,
              textTransform: 'uppercase',
              marginBottom: 28,
            }}
          >
            {name}
          </div>

          {/* Crimson line */}
          <div style={{ width: 48, height: 3, background: '#B91C1C', marginBottom: 28, display: 'flex' }} />

          {/* Price */}
          {price && (
            <div
              style={{
                fontFamily: 'serif',
                fontSize: 40,
                fontWeight: 700,
                color: '#B91C1C',
                letterSpacing: '0.05em',
              }}
            >
              {price.toLocaleString('ru-RU')} ₽
            </div>
          )}
        </div>
      </div>
    ),
    { ...size }
  );
}
