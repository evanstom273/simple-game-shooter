import type { Difficulty, GameSettings } from '../data/types';

interface SettingsPanelProps {
  settings: GameSettings;
  onChange: (settings: GameSettings) => void;
  onClose: () => void;
}

const difficultyOptions: { id: Difficulty; name: string; description: string }[] = [
  { id: 'chill', name: 'Chill', description: 'A little breathing room.' },
  { id: 'classic', name: 'Classic', description: 'The arcade pace.' },
  { id: 'intense', name: 'Intense', description: 'Fast, crowded waves.' },
];

export function SettingsPanel({ settings, onChange, onClose }: SettingsPanelProps) {
  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="settings-panel" role="dialog" aria-modal="true" aria-labelledby="settings-title">
        <div className="modal-heading">
          <div>
            <p className="eyebrow">LOCAL CONFIG</p>
            <h2 id="settings-title">Settings</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close settings">×</button>
        </div>

        <label className="sound-setting">
          <span>
            <strong>Sound effects</strong>
            <small>Short synth tones generated on your device.</small>
          </span>
          <input
            type="checkbox"
            checked={settings.soundEnabled}
            onChange={(event) => onChange({ ...settings, soundEnabled: event.currentTarget.checked })}
          />
        </label>

        <fieldset className="difficulty-setting">
          <legend>Run intensity</legend>
          <div className="difficulty-options">
            {difficultyOptions.map((option) => (
              <button
                className={`difficulty-option${settings.difficulty === option.id ? ' is-selected' : ''}`}
                type="button"
                key={option.id}
                aria-pressed={settings.difficulty === option.id}
                onClick={() => onChange({ ...settings, difficulty: option.id })}
              >
                <strong>{option.name}</strong>
                <small>{option.description}</small>
              </button>
            ))}
          </div>
        </fieldset>

        <p className="privacy-note">Settings, scores, and run history are stored locally in this browser.</p>
      </section>
    </div>
  );
}
