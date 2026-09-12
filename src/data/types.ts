export type Difficulty = 'chill' | 'classic' | 'intense';

export interface GameSettings {
  id: 'main';
  soundEnabled: boolean;
  difficulty: Difficulty;
  highScore: number;
}

export interface RunRecord {
  id?: number;
  endedAt: number;
  score: number;
  wave: number;
  survivalSeconds: number;
}

export const DEFAULT_SETTINGS: GameSettings = {
  id: 'main',
  soundEnabled: true,
  difficulty: 'classic',
  highScore: 0,
};
