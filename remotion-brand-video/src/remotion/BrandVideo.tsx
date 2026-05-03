import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

export interface BrandVideoProps {
  screenshot: string;
  brandName: string;
  siteUrl: string;
}

export const BrandVideo: React.FC<BrandVideoProps> = ({ screenshot, brandName, siteUrl }) => {
  const frame = useCurrentFrame();
  const { height } = useVideoConfig();

  const opacity = interpolate(frame, [0, 25], [0, 1], { extrapolateRight: 'clamp' });

  const scale =
    frame <= 120
      ? interpolate(frame, [25, 120], [1, 1.5], {
          easing: Easing.out(Easing.cubic),
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        })
      : frame <= 210
      ? 1.5
      : interpolate(frame, [210, 270], [1.5, 1], {
          easing: Easing.inOut(Easing.cubic),
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });

  const panY =
    frame < 120
      ? 0
      : frame <= 210
      ? interpolate(frame, [120, 210], [0, -height * 0.2], {
          easing: Easing.inOut(Easing.cubic),
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        })
      : frame <= 270
      ? interpolate(frame, [210, 270], [-height * 0.2, 0], {
          easing: Easing.inOut(Easing.cubic),
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        })
      : 0;

  const overlayAlpha = interpolate(frame, [265, 300], [0, 0.88], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const textAlpha = interpolate(frame, [278, 300], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const textSlide = interpolate(frame, [278, 300], [24, 0], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ background: '#000', overflow: 'hidden', opacity }}>
      {screenshot && (
        <img
          src={screenshot}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'top center',
            transform: `translateY(${panY}px) scale(${scale})`,
            transformOrigin: 'top center',
          }}
        />
      )}

      {overlayAlpha > 0 && (
        <AbsoluteFill
          style={{
            background: 'linear-gradient(160deg, rgba(0,0,0,0.92) 0%, rgba(10,10,30,0.88) 100%)',
            opacity: overlayAlpha,
          }}
        />
      )}

      {textAlpha > 0 && (
        <AbsoluteFill
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 0,
            opacity: textAlpha,
            transform: `translateY(${textSlide}px)`,
            color: '#fff',
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
          }}
        >
          <div
            style={{
              fontSize: 72,
              fontWeight: 800,
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
              textAlign: 'center',
              padding: '0 48px',
            }}
          >
            {brandName || 'Brand Name'}
          </div>
          {siteUrl && (
            <div
              style={{
                fontSize: 22,
                fontWeight: 400,
                opacity: 0.55,
                marginTop: 20,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
              }}
            >
              {siteUrl}
            </div>
          )}
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
