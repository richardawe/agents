import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

interface Props {
  screenshot: string;
  brandName: string;
  siteUrl: string;
  accentColor: string;
}

export const OutroScene: React.FC<Props> = ({ screenshot, brandName, siteUrl, accentColor }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const opacity        = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
  const scale          = interpolate(frame, [0, 90], [1.06, 1.0], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const overlayAlpha   = interpolate(frame, [0, 45], [0, 0.93], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const contentOpacity = interpolate(frame, [32, 72], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const contentY       = interpolate(frame, [32, 72], [height * 0.02, 0], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const barW           = interpolate(frame, [60, 88], [0, width * 0.14], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  const titleSize = Math.round(width * 0.13);  // ~140px
  const urlSize   = Math.round(width * 0.038); // ~41px

  return (
    <AbsoluteFill style={{ overflow: 'hidden', opacity }}>
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

      <AbsoluteFill
        style={{
          background: 'linear-gradient(160deg, rgba(0,0,0,0.95) 0%, rgba(5,5,20,0.92) 100%)',
          opacity: overlayAlpha,
        }}
      />

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
          padding: `0 ${Math.round(width * 0.08)}px`,
        }}
      >
        <div style={{ fontSize: titleSize, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1 }}>
          {brandName || 'Brand Name'}
        </div>

        {siteUrl && (
          <div style={{ fontSize: urlSize, fontWeight: 400, opacity: 0.5, marginTop: Math.round(height * 0.018), letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            {siteUrl}
          </div>
        )}

        <div style={{ width: barW, height: 5, background: accentColor, borderRadius: 3, marginTop: Math.round(height * 0.025) }} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
