import Dexie, { type Table } from 'dexie';
import { DEFAULT_SETTINGS, type GameSettings, type RunRecord } from './types';

class ShooterDatabase extends Dexie {
  settings!: Table<GameSettings, string>;
  runs!: Table<RunRecord, number>;

  constructor() {
    super('simple-game-shooter');
    this.version(1).stores({
      settings: 'id',
      runs: '++id, endedAt, score',
    });
  }
}

export const database = new ShooterDatabase();

export async function loadSettings(): Promise<GameSettings> {
  return (await database.settings.get('main')) ?? DEFAULT_SETTINGS;
}

export async function saveSettings(settings: GameSettings): Promise<void> {
  await database.settings.put(settings);
}

export async function loadRecentRuns(limit = 5): Promise<RunRecord[]> {
  return database.runs.orderBy('endedAt').reverse().limit(limit).toArray();
}

export async function saveRun(run: RunRecord): Promise<number> {
  return database.transaction('rw', database.runs, database.settings, async () => {
    const id = await database.runs.add(run);
    const current = (await database.settings.get('main')) ?? DEFAULT_SETTINGS;
    if (run.score > current.highScore) {
      await database.settings.put({ ...current, highScore: run.score });
    }
    return id;
  });
}
