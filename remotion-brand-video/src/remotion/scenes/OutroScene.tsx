import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';

interface Props {
  screenshot: string;
  brandName: string;
  siteUrl: string;
  accentColor: string;
}

export const OutroScene: React.FC<Props> = ({ screenshot, brandName, siteUrl, accentColor }) => {
  const frame = useCurrentFrame();

  const opacity        = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
  // Slow zoom-out feel (start slightly zoomed, ease back to 1)
  const scale          = interpolate(frame, [0, 90], [1.06, 1.0], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const overlayAlpha   = interpolate(frame, [0, 45], [0, 0.91], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const contentOpacity = interpolate(frame, [32, 72], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const contentY       = interpolate(frame, [32, 72], [26, 0], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const barW           = interpolate(frame, [60, 88], [0, 80], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ overflow: 'hidden', opacity }}>
      {/* Page screenshot */}
      <img
        src={screenshot}
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'top center',
          transform: `scale(${scale})`,
          transformOrigin: 'center',
        }}
      />

      {/* Rich dark overlay */}
      <AbsoluteFill
        style={{
          background: 'linear-gradient(160deg, rgba(0,0,0,0.94) 0%, rgba(5,5,20,0.91) 100%)',
          opacity: overlayAlpha,
        }}
      />

      {/* Centred brand content */}
      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: contentOpacity,
          transform: `translateY(${contentY}px)`,
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
          color: '#fff',
          textAlign: 'center',
          padding: '0 64px',
        }}
      >
        <div style={{ fontSize: 80, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1 }}>
          {brandName || 'Brand Name'}
        </div>

        {siteUrl && (
          <div
            style={{
              fontSize: 21,
              fontWeight: 400,
              opacity: 0.52,
              marginTop: 20,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
            }}
          >
            {siteUrl}
          </div>
        )}

        {/* Animated accent bar */}
        <div
          style={{
            width: barW,
            height: 4,
            background: accentColor,
            borderRadius: 2,
            marginTop: siteUrl ? 28 : 22,
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
