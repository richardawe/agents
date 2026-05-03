import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';
import type { Feature } from '../../types';
import { FEATURE_FRAMES } from '../../types';

interface Props {
  feature: Feature;
  featureIndex: number;
  totalFeatures: number;
  accentColor: string;
}

export const FeatureScene: React.FC<Props> = ({ feature, featureIndex, totalFeatures, accentColor }) => {
  const frame = useCurrentFrame();

  // Entrance
  const opacity       = interpolate(frame, [0, 25], [0, 1], { extrapolateRight: 'clamp' });
  // Slow Ken-Burns throughout scene
  const scale         = interpolate(frame, [0, FEATURE_FRAMES], [1.02, 1.12], {
    easing: Easing.inOut(Easing.sine),
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  // Bottom panel
  const panelOpacity  = interpolate(frame, [28, 58], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  // Accent line width (0 → 52 px)
  const accentW       = interpolate(frame, [42, 82], [0, 52], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  // Title slide-in
  const titleOpacity  = interpolate(frame, [48, 78], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const titleX        = interpolate(frame, [48, 78], [-18, 0], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  // Description fade
  const descOpacity   = interpolate(frame, [68, 96], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  // Progress dot
  const dotOpacity    = interpolate(frame, [85, 110], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const shortDesc = feature.description.length > 110
    ? feature.description.slice(0, 110) + '…'
    : feature.description;

  return (
    <AbsoluteFill style={{ overflow: 'hidden', opacity }}>
      {/* Section screenshot */}
      <img
        src={feature.screenshot}
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

      {/* Edge vignette */}
      <AbsoluteFill
        style={{
          background: 'radial-gradient(ellipse 90% 90% at 50% 50%, transparent 45%, rgba(0,0,0,0.45) 100%)',
        }}
      />

      {/* Bottom gradient panel */}
      <AbsoluteFill
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.28) 42%, transparent 68%)',
          opacity: panelOpacity,
        }}
      />

      {/* Text block */}
      <AbsoluteFill
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          padding: '0 64px 56px',
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        }}
      >
        <div style={{ width: '100%' }}>
          {/* Animated accent line */}
          <div
            style={{
              height: 3,
              width: accentW,
              background: accentColor,
              borderRadius: 2,
              marginBottom: 14,
              opacity: titleOpacity,
            }}
          />

          {/* "Feature N / M" label */}
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: accentColor,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              marginBottom: 10,
              opacity: titleOpacity,
            }}
          >
            Feature {featureIndex + 1} / {totalFeatures}
          </div>

          {/* Heading */}
          <div
            style={{
              fontSize: 50,
              fontWeight: 800,
              color: '#fff',
              letterSpacing: '-0.025em',
              lineHeight: 1.1,
              maxWidth: 820,
              textShadow: '0 2px 12px rgba(0,0,0,0.4)',
              opacity: titleOpacity,
              transform: `translateX(${titleX}px)`,
            }}
          >
            {feature.title}
          </div>

          {/* Description */}
          {shortDesc && (
            <div
              style={{
                fontSize: 21,
                color: 'rgba(255,255,255,0.68)',
                marginTop: 10,
                maxWidth: 720,
                lineHeight: 1.55,
                opacity: descOpacity,
              }}
            >
              {shortDesc}
            </div>
          )}
        </div>
      </AbsoluteFill>

      {/* Progress dots (top-right) */}
      <AbsoluteFill
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'flex-start',
          padding: '32px 48px 0 0',
          gap: 8,
          opacity: dotOpacity,
        }}
      >
        {Array.from({ length: totalFeatures }).map((_, i) => (
          <div
            key={i}
            style={{
              width: i === featureIndex ? 20 : 6,
              height: 6,
              borderRadius: 3,
              background: i === featureIndex ? accentColor : 'rgba(255,255,255,0.3)',
              transition: 'width 0.3s',
            }}
          />
        ))}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
