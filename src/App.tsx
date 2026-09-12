import { useEffect, useState } from 'react';
import { usePwaInstall } from './hooks/usePwaInstall';

function InstallMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v11m0 0 4-4m-4 4-4-4" />
      <path d="M5 17v3h14v-3" />
    </svg>
  );
}

function ShipIllustration() {
  return (
    <svg className="ship-art" viewBox="0 0 520 520" fill="none" aria-hidden="true">
      <circle cx="260" cy="260" r="194" stroke="url(#orbit)" strokeWidth="1" strokeDasharray="3 10" />
      <ellipse cx="260" cy="260" rx="213" ry="91" transform="rotate(-34 260 260)" stroke="#72e3ff" strokeOpacity=".2" />
      <circle cx="83" cy="192" r="4" fill="#91efcf" />
      <circle cx="415" cy="326" r="3" fill="#91efcf" />
      <circle cx="324" cy="67" r="2.5" fill="#b8a4ff" />
      <circle cx="139" cy="409" r="2" fill="#72e3ff" />
      <path d="m260 114 48 139 83 100-95-27-36 100-36-100-95 27 83-100z" fill="url(#hull)" stroke="#d7f8ff" strokeOpacity=".7" strokeWidth="2" />
      <path d="m260 114 19 168-19 48-19-48z" fill="#f4fdff" fillOpacity=".75" />
      <path d="m224 327-44 26-40 11 55-63zm72 0 44 26 40 11-55-63z" fill="#83e8ff" />
      <path d="m249 427 11 34 11-34" stroke="#ffb975" strokeWidth="8" strokeLinecap="round" />
      <defs>
        <linearGradient id="hull" x1="260" y1="114" x2="260" y2="426" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f5fdff" />
          <stop offset="1" stopColor="#51dafa" />
        </linearGradient>
        <linearGradient id="orbit" x1="66" y1="66" x2="454" y2="454" gradientUnits="userSpaceOnUse">
          <stop stopColor="#72e3ff" stopOpacity=".55" />
          <stop offset="1" stopColor="#b8a4ff" stopOpacity=".05" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function App() {
  const install = usePwaInstall();
  const [showInstallHelp, setShowInstallHelp] = useState(false);

  useEffect(() => {
    if (!showInstallHelp) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowInstallHelp(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [showInstallHelp]);

  async function installApp(): Promise<void> {
    if (!install.canInstall) {
      setShowInstallHelp(true);
      return;
    }
    try {
      await install.install();
    } catch {
      setShowInstallHelp(true);
    }
  }

  return (
    <div className="landing-shell">
      <header className="landing-header">
        <a className="brand" href="./" aria-label="Simple Game Shooter home">
          <span className="brand-mark" aria-hidden="true"><span /></span>
          <span className="brand-copy"><strong>Simple Game Shooter</strong><small>ARCADE PROJECT</small></span>
        </a>
        <div className="header-status"><span className="status-dot" /> PWA READY</div>
      </header>

      <main className="landing-main">
        <section className="hero-copy">
          <p className="eyebrow"><span className="eyebrow-line" /> IN DEVELOPMENT</p>
          <h1>Simple Game<br /><span>Shooter</span></h1>
          <p className="hero-description">A little arcade action is on its way. Install the app now and keep the project one tap away.</p>

          <button className="install-hero-button" type="button" onClick={() => void installApp()}>
            <span className="install-icon"><InstallMark /></span>
            <span className="install-copy">
              <strong>{install.installed ? 'App installed' : 'Install the app'}</strong>
              <small>{install.installed ? 'Ready on this device' : 'Add it to your home screen'}</small>
            </span>
            <span className="install-arrow" aria-hidden="true">↗</span>
          </button>
          <p className="install-caption">FREE TO INSTALL <span /> WORKS OFFLINE</p>

          <div className="landing-meta">
            <span className="meta-mark">01</span>
            <p><strong>The game is still in development.</strong><br />This page will be your launchpad when it is ready.</p>
          </div>
        </section>

        <div className="hero-visual" aria-hidden="true">
          <div className="visual-glow" />
          <div className="visual-orbit visual-orbit-one" />
          <div className="visual-orbit visual-orbit-two" />
          <ShipIllustration />
          <span className="visual-coordinate coordinate-top">FLIGHT DECK <i>01</i></span>
          <span className="visual-coordinate coordinate-bottom">COMING SOON <i>✳</i></span>
          <span className="visual-cross cross-one">+</span>
          <span className="visual-cross cross-two">+</span>
        </div>
      </main>

      <footer className="landing-footer">
        <span>BUILT FOR YOUR NEXT BREAK BETWEEN RUNS.</span>
        <a href="https://github.com/evanstom273/simple-game-shooter" target="_blank" rel="noreferrer">VIEW PROJECT <span aria-hidden="true">↗</span></a>
      </footer>

      {showInstallHelp && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setShowInstallHelp(false);
        }}>
          <section className="install-help" role="dialog" aria-modal="true" aria-labelledby="install-title">
            <button className="modal-close" type="button" onClick={() => setShowInstallHelp(false)} aria-label="Close install instructions">×</button>
            <div className="install-help-mark"><InstallMark /></div>
            <p className="eyebrow">KEEP IT CLOSE</p>
            <h2 id="install-title">{install.installed ? "You're all set" : 'Install Simple Game Shooter'}</h2>
            <p>{install.installed ? 'Simple Game Shooter is already installed. Open it from your home screen or apps list.' : 'Open your browser menu and choose Install app or Add to Home Screen. On iPhone or iPad, tap Share, then choose Add to Home Screen.'}</p>
            <button className="help-done" type="button" onClick={() => setShowInstallHelp(false)}>Got it</button>
          </section>
        </div>
      )}
    </div>
  );
}

export default App;
