import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
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
  const { width, height } = useVideoConfig();

  const opacity      = interpolate(frame, [0, 25], [0, 1], { extrapolateRight: 'clamp' });
  const scale        = interpolate(frame, [0, FEATURE_FRAMES], [1.02, 1.12], {
    easing: Easing.inOut(Easing.sin),
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const panelOpacity = interpolate(frame, [28, 58], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const accentW      = interpolate(frame, [42, 82], [0, width * 0.09], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const titleOpacity = interpolate(frame, [48, 78], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const titleX       = interpolate(frame, [48, 78], [-width * 0.03, 0], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const descOpacity  = interpolate(frame, [68, 96], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const dotOpacity   = interpolate(frame, [85, 110], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const hasText     = !!feature.title;
  const padH        = Math.round(width * 0.059); // ~64px
  const bottomPad   = Math.round(height * 0.04);
  const titleSize   = Math.round(width * 0.088);  // ~95px
  const labelSize   = Math.round(width * 0.026);  // ~28px
  const descSize    = Math.round(width * 0.042);  // ~45px
  const shortDesc   = feature.description.length > 100
    ? feature.description.slice(0, 100) + '…'
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

      {/* Vignette */}
      <AbsoluteFill
        style={{
          background: 'radial-gradient(ellipse 90% 90% at 50% 50%, transparent 40%, rgba(0,0,0,0.45) 100%)',
        }}
      />

      {/* Bottom gradient */}
      <AbsoluteFill
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.3) 35%, transparent 60%)',
          opacity: panelOpacity,
        }}
      />

      {/* Text */}
      <AbsoluteFill
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          padding: `0 ${padH}px ${bottomPad}px`,
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        }}
      >
        <div style={{ width: '100%' }}>
          {/* Accent line */}
          <div style={{ height: 4, width: accentW, background: accentColor, borderRadius: 2, marginBottom: Math.round(height * 0.012), opacity: titleOpacity }} />

          {/* Label */}
          <div style={{ fontSize: labelSize, fontWeight: 600, color: accentColor, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: Math.round(height * 0.007), opacity: titleOpacity }}>
            {hasText ? `Feature ${featureIndex + 1} / ${totalFeatures}` : `Section ${featureIndex + 1}`}
          </div>

          {/* Title (only when present) */}
          {hasText && (
            <div style={{ fontSize: titleSize, fontWeight: 800, color: '#fff', letterSpacing: '-0.025em', lineHeight: 1.1, maxWidth: '90%', textShadow: '0 2px 16px rgba(0,0,0,0.4)', opacity: titleOpacity, transform: `translateX(${titleX}px)` }}>
              {feature.title}
            </div>
          )}

          {/* Description */}
          {hasText && shortDesc && (
            <div style={{ fontSize: descSize, color: 'rgba(255,255,255,0.68)', marginTop: Math.round(height * 0.008), maxWidth: '90%', lineHeight: 1.5, opacity: descOpacity }}>
              {shortDesc}
            </div>
          )}
        </div>
      </AbsoluteFill>

      {/* Progress dots */}
      <AbsoluteFill
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          paddingTop: Math.round(height * 0.025),
          gap: Math.round(width * 0.018),
          opacity: dotOpacity,
        }}
      >
        {Array.from({ length: totalFeatures }).map((_, i) => (
          <div
            key={i}
            style={{
              width:  i === featureIndex ? Math.round(width * 0.038) : Math.round(width * 0.012),
              height: Math.round(width * 0.012),
              borderRadius: width * 0.006,
              background: i === featureIndex ? accentColor : 'rgba(255,255,255,0.3)',
            }}
          />
        ))}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
