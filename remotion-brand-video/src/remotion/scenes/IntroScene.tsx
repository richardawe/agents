import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

interface Props {
  screenshot: string;
  brandName: string;
  accentColor: string;
}

export const IntroScene: React.FC<Props> = ({ screenshot, brandName, accentColor }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const opacity      = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
  const scale        = interpolate(frame, [20, 90], [1.0, 1.08], {
    easing: Easing.inOut(Easing.sin),
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const titleOpacity = interpolate(frame, [55, 85], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const titleY       = interpolate(frame, [55, 85], [height * 0.015, 0], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  const fontSize    = Math.round(width * 0.1);   // ~108px at 1080
  const barW        = Math.round(width * 0.1);
  const bottomPad   = Math.round(height * 0.055);

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
          transformOrigin: 'center top',
        }}
      />

      {/* Bottom gradient */}
      <AbsoluteFill
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0) 45%)',
        }}
      />

      {/* Brand name */}
      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-end',
          paddingBottom: bottomPad,
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
          color: '#fff',
        }}
      >
        <div style={{ fontSize, fontWeight: 800, letterSpacing: '-0.03em', textShadow: '0 2px 24px rgba(0,0,0,0.5)', textAlign: 'center', padding: `0 ${width * 0.06}px` }}>
          {brandName || 'Brand Name'}
        </div>
        <div style={{ width: barW, height: 4, background: accentColor, borderRadius: 2, marginTop: Math.round(height * 0.012) }} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
