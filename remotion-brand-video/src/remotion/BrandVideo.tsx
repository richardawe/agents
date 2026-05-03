import { AbsoluteFill, Sequence } from 'remotion';
import type { Feature } from '../types';
import { FEATURE_FRAMES, INTRO_FRAMES, OUTRO_FRAMES } from '../types';
import { FeatureScene } from './scenes/FeatureScene';
import { IntroScene } from './scenes/IntroScene';
import { OutroScene } from './scenes/OutroScene';

export interface BrandVideoProps {
  fullScreenshot: string;
  features: Feature[];
  brandName: string;
  siteUrl: string;
  accentColor: string;
}

export const BrandVideo: React.FC<BrandVideoProps> = ({
  fullScreenshot,
  features,
  brandName,
  siteUrl,
  accentColor,
}) => {
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      {/* ── Intro ─────────────────────────────────────────────────────────── */}
      <Sequence from={0} durationInFrames={INTRO_FRAMES}>
        <IntroScene
          screenshot={fullScreenshot}
          brandName={brandName}
          accentColor={accentColor}
        />
      </Sequence>

      {/* ── One scene per detected feature ────────────────────────────────── */}
      {features.map((feature, i) => (
        <Sequence
          key={feature.id}
          from={INTRO_FRAMES + i * FEATURE_FRAMES}
          durationInFrames={FEATURE_FRAMES}
        >
          <FeatureScene
            feature={feature}
            featureIndex={i}
            totalFeatures={features.length}
            accentColor={accentColor}
          />
        </Sequence>
      ))}

      {/* ── Outro ─────────────────────────────────────────────────────────── */}
      <Sequence
        from={INTRO_FRAMES + features.length * FEATURE_FRAMES}
        durationInFrames={OUTRO_FRAMES}
      >
        <OutroScene
          screenshot={fullScreenshot}
          brandName={brandName}
          siteUrl={siteUrl}
          accentColor={accentColor}
        />
      </Sequence>
    </AbsoluteFill>
  );
};
