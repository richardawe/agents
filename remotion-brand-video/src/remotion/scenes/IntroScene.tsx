import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';

interface Props {
  screenshot: string;
  brandName: string;
  accentColor: string;
}

export const IntroScene: React.FC<Props> = ({ screenshot, brandName, accentColor }) => {
  const frame = useCurrentFrame();

  const opacity     = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
  const scale       = interpolate(frame, [20, 90], [1.0, 1.08], {
    easing: Easing.inOut(Easing.sin),
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const titleOpacity = interpolate(frame, [55, 85], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const titleY       = interpolate(frame, [55, 85], [22, 0], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ overflow: 'hidden', opacity }}>
      {/* Page screenshot with slow Ken-Burns zoom */}
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

      {/* Gradient veil at bottom so text is readable */}
      <AbsoluteFill
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.0) 55%)',
        }}
      />

      {/* Brand name */}
      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-end',
          paddingBottom: 68,
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
          color: '#fff',
        }}
      >
        <div style={{ fontSize: 52, fontWeight: 800, letterSpacing: '-0.03em', textShadow: '0 2px 20px rgba(0,0,0,0.5)' }}>
          {brandName || 'Brand Name'}
        </div>
        <div
          style={{
            width: 56,
            height: 4,
            background: accentColor,
            borderRadius: 2,
            marginTop: 16,
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
