import { useEffect, useState } from 'react';
import { usePwaInstall } from './hooks/usePwaInstall';

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
        <a className="brand" href="./" aria-label="Untitled project home">
          <span className="brand-copy">
            <strong>Untitled project</strong>
            <small>WEB APP</small>
          </span>
        </a>
        <div className="header-status">Available to install</div>
      </header>

      <main className="landing-main">
        <section className="hero-copy">
          <p className="eyebrow">Project</p>
          <h1>Project<br /><span>title</span></h1>
          <p className="hero-description">Install this app on your device for quick access. It is also available offline.</p>

          <button className="install-hero-button" type="button" onClick={() => void installApp()}>
            <span className="install-copy">
              <strong>{install.installed ? 'App installed' : 'Install this app'}</strong>
              <small>{install.installed ? 'Available from your home screen' : 'Add it to your home screen'}</small>
            </span>
          </button>
          <p className="install-caption">AVAILABLE OFFLINE</p>

          <div className="landing-meta">
            <p>This space is reserved for project information.</p>
          </div>
        </section>

        <div className="hero-visual" aria-hidden="true">
          <div className="visual-placeholder" />
        </div>
      </main>

      <footer className="landing-footer">
        <span>UNTITLED PROJECT</span>
        <span>Installable web app</span>
      </footer>

      {showInstallHelp && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setShowInstallHelp(false);
        }}>
          <section className="install-help" role="dialog" aria-modal="true" aria-labelledby="install-title">
            <button className="modal-close" type="button" onClick={() => setShowInstallHelp(false)}>Close</button>
            <p className="eyebrow">Installation</p>
            <h2 id="install-title">{install.installed ? 'App installed' : 'Install this app'}</h2>
            <p>{install.installed ? 'This app is installed on this device.' : 'Open your browser menu and choose Install app or Add to Home Screen. On iPhone or iPad, tap Share, then choose Add to Home Screen.'}</p>
            <button className="help-done" type="button" onClick={() => setShowInstallHelp(false)}>Done</button>
          </section>
        </div>
      )}
    </div>
  );
}

export default App;
