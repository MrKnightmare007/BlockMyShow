import LottiePkg from 'lottie-react';
import blockLoadingAnimationPkg from './BlockLoading.json';

const Lottie = LottiePkg.default || LottiePkg;
const blockLoadingAnimation = blockLoadingAnimationPkg.default || blockLoadingAnimationPkg;

/**
 * Loader Component
 * Full-screen or inline loader using the BlockMyShow Lottie animation.
 *
 * Props:
 *  - fullScreen {boolean} – centres loader over entire viewport (default: true)
 *  - size       {number}  – width/height of the animation in px (default: 160)
 *  - text       {string}  – optional label shown below the animation
 */
const Loader = ({ fullScreen = true, size = 160, text = '' }) => {
  const wrapperStyle = fullScreen
    ? {
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.85)',
        zIndex: 9999,
        backdropFilter: 'blur(4px)',
      }
    : {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      };

  return (
    <div style={wrapperStyle}>
      <Lottie
        animationData={blockLoadingAnimation}
        loop
        autoplay
        style={{ width: size, height: size }}
      />
      {text && (
        <p
          style={{
            color: '#31bbaf',
            fontFamily: 'Space Mono, monospace',
            fontSize: '0.85rem',
            marginTop: '0.75rem',
            letterSpacing: '0.08em',
            opacity: 0.9,
          }}
        >
          {text}
        </p>
      )}
    </div>
  );
};

export default Loader;
