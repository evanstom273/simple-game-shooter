import type { RunRecord } from '../data/types';

interface RunHistoryProps {
  runs: RunRecord[];
}

function formatRunDate(timestamp: number): string {
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(timestamp);
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes}:${remaining.toString().padStart(2, '0')}`;
}

export function RunHistory({ runs }: RunHistoryProps) {
  return (
    <section className="side-card run-history" aria-labelledby="runs-title">
      <div className="side-card-heading">
        <div>
          <p className="eyebrow">RECENT FLIGHTS</p>
          <h2 id="runs-title">Run history</h2>
        </div>
        <span className="history-count">{runs.length.toString().padStart(2, '0')}</span>
      </div>
      {runs.length === 0 ? (
        <p className="empty-history">Your first run is waiting. Make it count.</p>
      ) : (
        <ol className="run-list">
          {runs.map((run, index) => (
            <li className="run-row" key={run.id ?? `${run.endedAt}-${index}`}>
              <div className="run-rank">{(index + 1).toString().padStart(2, '0')}</div>
              <div className="run-summary">
                <strong>{run.score.toLocaleString()} <span>PTS</span></strong>
                <small>{formatRunDate(run.endedAt)} · {formatDuration(run.survivalSeconds)} · WAVE {run.wave}</small>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
