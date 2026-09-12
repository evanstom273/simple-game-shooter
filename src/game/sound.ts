export type SoundCue = 'fire' | 'hit' | 'damage' | 'wave' | 'game-over';

let audioContext: AudioContext | null = null;

export function primeAudio(enabled: boolean): void {
  if (!enabled || typeof window === 'undefined' || !('AudioContext' in window)) return;
  audioContext ??= new AudioContext();
  if (audioContext.state === 'suspended') void audioContext.resume();
}

const cueSettings: Record<SoundCue, { frequency: number; duration: number; type: OscillatorType; volume: number }> = {
  fire: { frequency: 510, duration: 0.055, type: 'square', volume: 0.035 },
  hit: { frequency: 780, duration: 0.09, type: 'triangle', volume: 0.075 },
  damage: { frequency: 145, duration: 0.2, type: 'sawtooth', volume: 0.09 },
  wave: { frequency: 660, duration: 0.16, type: 'sine', volume: 0.07 },
  'game-over': { frequency: 120, duration: 0.42, type: 'triangle', volume: 0.09 },
};

export function playCue(cue: SoundCue, enabled: boolean): void {
  if (!enabled || typeof window === 'undefined' || !('AudioContext' in window)) return;
  audioContext ??= new AudioContext();
  if (audioContext.state === 'suspended') void audioContext.resume();

  const settings = cueSettings[cue];
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const now = audioContext.currentTime;

  oscillator.type = settings.type;
  oscillator.frequency.setValueAtTime(settings.frequency, now);
  if (cue === 'game-over') oscillator.frequency.exponentialRampToValueAtTime(58, now + settings.duration);
  if (cue === 'hit' || cue === 'wave') oscillator.frequency.exponentialRampToValueAtTime(settings.frequency * 1.35, now + settings.duration);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(settings.volume, now + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + settings.duration);

  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start(now);
  oscillator.stop(now + settings.duration + 0.015);
}
