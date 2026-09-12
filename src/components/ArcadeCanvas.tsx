import { useEffect, useRef } from 'react';
import type { Difficulty, HudSnapshot } from '../data/types';
import { ShooterGame } from '../game/engine';
import type { SoundCue } from '../game/sound';

interface ArcadeCanvasProps {
  active: boolean;
  runKey: number;
  difficulty: Difficulty;
  onHud: (snapshot: HudSnapshot) => void;
  onGameOver: (snapshot: HudSnapshot, survivalSeconds: number) => void;
  onCue: (cue: SoundCue) => void;
}

export function ArcadeCanvas({ active, runKey, difficulty, onHud, onGameOver, onCue }: ArcadeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<ShooterGame | null>(null);
  const callbacksRef = useRef({ onHud, onGameOver, onCue });
  callbacksRef.current = { onHud, onGameOver, onCue };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const game = new ShooterGame(
      canvas,
      difficulty,
      (snapshot) => callbacksRef.current.onHud(snapshot),
      (snapshot, survivalSeconds) => callbacksRef.current.onGameOver(snapshot, survivalSeconds),
      (cue) => callbacksRef.current.onCue(cue),
    );
    gameRef.current = game;
    return () => {
      game.dispose();
      gameRef.current = null;
    };
  }, [difficulty, runKey]);

  useEffect(() => {
    if (active) gameRef.current?.start();
    else gameRef.current?.pause();
  }, [active, difficulty, runKey]);

  return (
    <canvas
      ref={canvasRef}
      className="arcade-canvas"
      aria-label="Arcade shooter playfield. Use WASD or arrow keys, or drag on the screen to steer. Firing is automatic."
      tabIndex={0}
    />
  );
}
