import { useCallback, useEffect, useState } from 'react';
import { ArcadeCanvas } from './components/ArcadeCanvas';
import { RunHistory } from './components/RunHistory';
import { SettingsPanel } from './components/SettingsPanel';
import { loadRecentRuns, loadSettings, saveRun, saveSettings } from './data/database';
import { DEFAULT_SETTINGS, type GameSettings, type HudSnapshot, type RunRecord } from './data/types';
import { playCue, primeAudio, type SoundCue } from './game/sound';
import { useGameOrientation } from './hooks/useGameOrientation';
import { usePwaInstall } from './hooks/usePwaInstall';

type GamePhase = 'menu' | 'playing' | 'paused' | 'over';

const EMPTY_HUD: HudSnapshot = { score: 0, lives: 3, wave: 1, kills: 0 };

function Icon({ name }: { name: 'sound' | 'mute' | 'settings' | 'download' | 'pause' }) {
  const paths = {
    sound: <><path d="M4 10v4h3l5 4V6l-5 4H4Z" /><path d="M16 9a5 5 0 0 1 0 6" /><path d="M18.5 6.5a9 9 0 0 1 0 11" /></>,
    mute: <><path d="M4 10v4h3l5 4V6l-5 4H4Z" /><path d="m17 9 5 6m0-6-5 6" /></>,
    settings: <><path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" /><path d="m19.4 15 .1.1a1.7 1.7 0 0 1-2.4 2.4l-.1-.1a1.7 1.7 0 0 0-2.9 1.2v.2a1.7 1.7 0 0 1-3.4 0v-.2a1.7 1.7 0 0 0-2.9-1.2l-.1.1a1.7 1.7 0 0 1-2.4-2.4l.1-.1a1.7 1.7 0 0 0-1.2-2.9H4a1.7 1.7 0 0 1 0-3.4h.2a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a1.7 1.7 0 0 1 2.4-2.4l.1.1a1.7 1.7 0 0 0 2.9-1.2V2a1.7 1.7 0 0 1 3.4 0v.2a1.7 1.7 0 0 0 2.9 1.2l.1-.1a1.7 1.7 0 0 1 2.4 2.4l-.1.1a1.7 1.7 0 0 0 1.2 2.9h.2a1.7 1.7 0 0 1 0 3.4h-.2a1.7 1.7 0 0 0-1.2 2.9Z" /></>,
    download: <><path d="M12 3v11m0 0 4-4m-4 4-4-4" /><path d="M5 17v3h14v-3" /></>,
    pause: <><path d="M8 5h3v14H8zM15 5h3v14h-3z" /></>,
  };
  return <svg aria-hidden="true" className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

function App() {
  const [phase, setPhase] = useState<GamePhase>('menu');
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [runs, setRuns] = useState<RunRecord[]>([]);
  const [hud, setHud] = useState<HudSnapshot>(EMPTY_HUD);
  const [runKey, setRunKey] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [rotationHelp, setRotationHelp] = useState(false);
  const [allowPortrait, setAllowPortrait] = useState(false);
  const [storageNotice, setStorageNotice] = useState('');
  const orientation = useGameOrientation();
  const pwaInstall = usePwaInstall();

  useEffect(() => {
    let current = true;
    Promise.all([loadSettings(), loadRecentRuns()])
      .then(([savedSettings, savedRuns]) => {
        if (!current) return;
        setSettings(savedSettings);
        setRuns(savedRuns);
      })
      .catch(() => {
        if (current) setStorageNotice('Local storage is unavailable. This run will not be saved.');
      });
    return () => { current = false; };
  }, []);

  useEffect(() => {
    if (phase !== 'playing') return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.key.toLowerCase() === 'p') setPhase('paused');
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') setPhase('paused');
    };
    window.addEventListener('keydown', onKeyDown);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [phase]);

  useEffect(() => {
    if (!orientation.isPortrait || orientation.isFoldableOrLargeTouch) setRotationHelp(false);
  }, [orientation.isFoldableOrLargeTouch, orientation.isPortrait]);

  const changeSettings = useCallback((next: GameSettings) => {
    setSettings(next);
    void saveSettings(next).then(() => setStorageNotice('')).catch(() => {
      setStorageNotice('Could not save settings in this browser.');
    });
    if (next.soundEnabled) primeAudio(true);
  }, []);

  const cue = useCallback((sound: SoundCue) => {
    playCue(sound, settings.soundEnabled);
  }, [settings.soundEnabled]);

  const requestRunOrientation = useCallback(async () => {
    const locked = await orientation.requestGameOrientation();
    const portrait = window.innerHeight > window.innerWidth;
    setRotationHelp(!locked && orientation.isSmallTouchscreen && portrait);
  }, [orientation]);

  const startRun = useCallback(async () => {
    primeAudio(settings.soundEnabled);
    setHud(EMPTY_HUD);
    setAllowPortrait(false);
    setRunKey((key) => key + 1);
    setPhase('playing');
    await requestRunOrientation();
  }, [requestRunOrientation, settings.soundEnabled]);

  const resumeRun = useCallback(async () => {
    primeAudio(settings.soundEnabled);
    setPhase('playing');
    await requestRunOrientation();
  }, [requestRunOrientation, settings.soundEnabled]);

  const handleGameOver = useCallback(async (finalHud: HudSnapshot, survivalSeconds: number) => {
    setHud(finalHud);
    setPhase('over');
    setRotationHelp(false);
    const run: RunRecord = {
      endedAt: Date.now(),
      score: finalHud.score,
      wave: finalHud.wave,
      survivalSeconds,
    };
    try {
      await saveRun(run);
      const [savedSettings, recentRuns] = await Promise.all([loadSettings(), loadRecentRuns()]);
      setSettings(savedSettings);
      setRuns(recentRuns);
      setStorageNotice('');
    } catch {
      setStorageNotice('This run ended, but the browser could not save it locally.');
    }
  }, []);

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="./" aria-label="Simple Game Shooter home">
          <span className="brand-mark" aria-hidden="true"><span /></span>
          <span className="brand-copy"><strong>Simple Game Shooter</strong><small>ARCADE / SOLO FLIGHT</small></span>
        </a>
        <div className="topbar-actions">
          <span className="system-status"><span className="status-dot" /> LOCAL SYSTEM READY</span>
          {pwaInstall.canInstall && (
            <button className="button button-secondary install-button" type="button" onClick={() => void pwaInstall.install()}>
              <Icon name="download" /> <span>Install</span>
            </button>
          )}
          <button
            className="icon-button"
            type="button"
            onClick={() => changeSettings({ ...settings, soundEnabled: !settings.soundEnabled })}
            aria-label={settings.soundEnabled ? 'Turn sound off' : 'Turn sound on'}
            title={settings.soundEnabled ? 'Sound on' : 'Sound off'}
          >
            <Icon name={settings.soundEnabled ? 'sound' : 'mute'} />
          </button>
          <button className="button button-quiet settings-button" type="button" onClick={() => setSettingsOpen(true)}>
            <Icon name="settings" /> <span>Settings</span>
          </button>
        </div>
      </header>

      <main className="game-layout">
        <section className="arena-column" aria-label="Arcade game">
          <div className="stage-toolbar">
            <div className="stage-title"><span className="signal-bars" aria-hidden="true"><i /><i /><i /></span><span>SECTOR 07</span><span className="toolbar-divider" />{settings.difficulty.toUpperCase()} MODE</div>
            <div className="stage-actions">
              <span className="touch-hint">DRAG TO STEER · AUTO FIRE</span>
              {phase === 'playing' && (
                <button className="pause-button" type="button" onClick={() => setPhase('paused')} aria-label="Pause run">
                  <Icon name="pause" /> PAUSE
                </button>
              )}
            </div>
          </div>

          <div className="game-frame">
            <ArcadeCanvas
              active={phase === 'playing'}
              runKey={runKey}
              difficulty={settings.difficulty}
              onHud={setHud}
              onGameOver={(snapshot, seconds) => void handleGameOver(snapshot, seconds)}
              onCue={cue}
            />
            <div className="frame-vignette" aria-hidden="true" />

            <div className="arena-hud" aria-label="Current run status">
              <div className="hud-stat"><span>RUN SCORE</span><strong>{hud.score.toLocaleString().padStart(5, '0')}</strong></div>
              <div className="hud-stat hud-wave"><span>WAVE</span><strong>{hud.wave.toString().padStart(2, '0')}</strong></div>
              <div className="hud-stat hud-hull"><span>HULL</span><strong aria-label={`${hud.lives} lives`}>{'◆'.repeat(Math.max(0, hud.lives))}<span className="lost-life">{'◇'.repeat(Math.max(0, 3 - hud.lives))}</span></strong></div>
            </div>

            {phase !== 'playing' && (
              <div className="game-overlay">
                <div className="overlay-card">
                  <span className={`overlay-symbol${phase === 'over' ? ' symbol-over' : ''}`} aria-hidden="true">{phase === 'paused' ? 'Ⅱ' : phase === 'over' ? '✦' : '↗'}</span>
                  {phase === 'menu' && <>
                    <p className="eyebrow">YOUR NEXT FLIGHT</p>
                    <h1>Ready when<br />you are.</h1>
                    <p className="overlay-description">Slip through the incoming wave. Your cannons handle the firing. You just keep moving.</p>
                    <button className="button button-primary launch-button" type="button" onClick={() => void startRun()}>
                      <span>Launch run</span><span aria-hidden="true">↗</span>
                    </button>
                    <p className="input-hint"><span className="desktop-hint">WASD / ARROW KEYS</span><span className="mobile-hint">TOUCH AND DRAG</span><span className="hint-dot" /> AUTO FIRE</p>
                  </>}
                  {phase === 'paused' && <>
                    <p className="eyebrow">FLIGHT HOLD</p>
                    <h1>Catch your<br />breath.</h1>
                    <p className="overlay-description">Score {hud.score.toLocaleString()} · Wave {hud.wave} · {hud.kills} targets cleared.</p>
                    <button className="button button-primary launch-button" type="button" onClick={() => void resumeRun()}>
                      <span>Resume flight</span><span aria-hidden="true">↗</span>
                    </button>
                    <button className="text-button" type="button" onClick={() => setPhase('menu')}>End this run</button>
                  </>}
                  {phase === 'over' && <>
                    <p className="eyebrow">FLIGHT COMPLETE</p>
                    <h1>Nice run.</h1>
                    <p className="overlay-description">You cleared {hud.kills} targets and reached wave {hud.wave}.</p>
                    <div className="final-score"><span>FINAL SCORE</span><strong>{hud.score.toLocaleString()}</strong></div>
                    <button className="button button-primary launch-button" type="button" onClick={() => void startRun()}>
                      <span>Fly again</span><span aria-hidden="true">↗</span>
                    </button>
                    <button className="text-button" type="button" onClick={() => setPhase('menu')}>Back to launchpad</button>
                  </>}
                </div>
              </div>
            )}

            {rotationHelp && phase === 'playing' && !allowPortrait && (
              <div className="rotation-overlay" role="dialog" aria-modal="true" aria-labelledby="rotate-title">
                <span className="rotate-device" aria-hidden="true">▱</span>
                <p className="eyebrow">LANDSCAPE FLIGHT</p>
                <h2 id="rotate-title">Turn your phone sideways</h2>
                <p>This game plays best in landscape. Your browser could not rotate the screen automatically.</p>
                <button className="button button-secondary" type="button" onClick={() => { setAllowPortrait(true); setRotationHelp(false); }}>Continue in portrait</button>
              </div>
            )}
          </div>

          <div className="arena-footer">
            <span><i className="live-dot" /> {phase === 'playing' ? 'LIVE RUN' : phase === 'paused' ? 'PAUSED' : phase === 'over' ? 'RUN COMPLETE' : 'FLIGHT DECK'}</span>
            <span>{orientation.isFoldableOrLargeTouch ? 'FOLDABLE / LARGE DISPLAY' : orientation.isSmallTouchscreen ? 'TOUCH DISPLAY' : 'DESKTOP FLIGHT DECK'}</span>
          </div>
        </section>

        <div className="hinge-space" aria-hidden="true" />

        <aside className="side-column" aria-label="Pilot stats and history">
          <section className="side-card best-score">
            <div className="side-card-heading">
              <div><p className="eyebrow">PERSONAL BEST</p><h2>Top score</h2></div>
              <span className="best-icon" aria-hidden="true">✦</span>
            </div>
            <strong className="best-score-value">{settings.highScore.toLocaleString().padStart(5, '0')}</strong>
            <div className="score-foot"><span>ALL-TIME HIGH</span><span>LOCAL SAVE</span></div>
          </section>

          <RunHistory runs={runs} />

          <section className="side-card controls-card" aria-labelledby="controls-title">
            <div className="side-card-heading"><div><p className="eyebrow">FLIGHT SCHOOL</p><h2 id="controls-title">Controls</h2></div></div>
            <div className="control-row"><span className="keyboard-key desktop-hint">WASD</span><span className="keyboard-key desktop-hint">← ↑ ↓ →</span><span className="mobile-control mobile-hint">TOUCH + DRAG</span><span>Steer your ship</span></div>
            <div className="control-row"><span className="auto-fire-mark" aria-hidden="true">✳</span><span>Automatic cannons</span></div>
            <div className="control-row"><span className="keyboard-key desktop-hint">ESC</span><span className="keyboard-key desktop-hint">P</span><span className="mobile-control mobile-hint">PAUSE</span><span>Pause the run</span></div>
          </section>
          {storageNotice && <p className="storage-notice" role="status">{storageNotice}</p>}
          {pwaInstall.installed && <p className="installed-note"><span className="status-dot" /> INSTALLED APP</p>}
        </aside>
      </main>

      <footer className="page-footer"><span>NO ACCOUNT. NO TRACKING. JUST ONE MORE RUN.</span><span>BUILD 001 · LOCAL ARCADE</span></footer>

      {settingsOpen && <SettingsPanel settings={settings} onChange={changeSettings} onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}

export default App;
