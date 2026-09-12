import type { Difficulty, HudSnapshot } from '../data/types';
import type { SoundCue } from './sound';

interface Enemy {
  x: number;
  y: number;
  radius: number;
  speed: number;
  drift: number;
  phase: number;
}

interface Shot {
  x: number;
  y: number;
  speed: number;
}

interface Star {
  x: number;
  y: number;
  speed: number;
  size: number;
  alpha: number;
}

const difficultyPace: Record<Difficulty, number> = {
  chill: 1.08,
  classic: 0.82,
  intense: 0.62,
};

export class ShooterGame {
  private readonly context: CanvasRenderingContext2D;
  private readonly resizeObserver: ResizeObserver;
  private width = 0;
  private height = 0;
  private dpr = 1;
  private running = false;
  private frameId = 0;
  private lastFrame = 0;
  private elapsed = 0;
  private hudElapsed = 0;
  private spawnElapsed = 0;
  private fireElapsed = 0;
  private invulnerableFor = 0;
  private score = 0;
  private lives = 3;
  private kills = 0;
  private wave = 1;
  private shotsFired = 0;
  private playerX = 0;
  private playerY = 0;
  private pointerActive = false;
  private pointerTargetX = 0;
  private pointerTargetY = 0;
  private readonly keys = new Set<string>();
  private readonly enemies: Enemy[] = [];
  private readonly shots: Shot[] = [];
  private readonly stars: Star[] = [];
  private readonly onHud: (snapshot: HudSnapshot) => void;
  private readonly onGameOver: (snapshot: HudSnapshot, survivalSeconds: number) => void;
  private readonly onCue: (cue: SoundCue) => void;
  private readonly difficulty: Difficulty;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    difficulty: Difficulty,
    onHud: (snapshot: HudSnapshot) => void,
    onGameOver: (snapshot: HudSnapshot, survivalSeconds: number) => void,
    onCue: (cue: SoundCue) => void,
  ) {
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('This browser could not create a 2D canvas context.');
    this.context = context;
    this.difficulty = difficulty;
    this.onHud = onHud;
    this.onGameOver = onGameOver;
    this.onCue = onCue;
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas.parentElement ?? canvas);
    window.addEventListener('resize', this.resize);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    canvas.addEventListener('pointerdown', this.onPointerDown);
    canvas.addEventListener('pointermove', this.onPointerMove);
    canvas.addEventListener('pointerup', this.onPointerUp);
    canvas.addEventListener('pointercancel', this.onPointerUp);
    this.resize();
    this.draw();
  }

  start(): void {
    if (this.running || this.lives <= 0) return;
    this.running = true;
    this.lastFrame = 0;
    this.frameId = requestAnimationFrame(this.animate);
  }

  pause(): void {
    this.running = false;
    cancelAnimationFrame(this.frameId);
    this.lastFrame = 0;
  }

  dispose(): void {
    this.pause();
    this.resizeObserver.disconnect();
    window.removeEventListener('resize', this.resize);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    this.canvas.removeEventListener('pointermove', this.onPointerMove);
    this.canvas.removeEventListener('pointerup', this.onPointerUp);
    this.canvas.removeEventListener('pointercancel', this.onPointerUp);
  }

  private resize = (): void => {
    const rect = (this.canvas.parentElement ?? this.canvas).getBoundingClientRect();
    this.width = Math.max(1, rect.width);
    this.height = Math.max(1, rect.height);
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(this.width * this.dpr);
    this.canvas.height = Math.round(this.height * this.dpr);
    this.context.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.playerX = this.playerX ? Math.min(this.width - 28, Math.max(28, this.playerX)) : this.width / 2;
    this.playerY = this.playerY ? Math.min(this.height - 30, Math.max(this.height * 0.45, this.playerY)) : this.height - 58;
    this.pointerTargetX = this.playerX;
    this.pointerTargetY = this.playerY;

    if (this.stars.length === 0) {
      for (let i = 0; i < 92; i += 1) {
        this.stars.push({
          x: Math.random() * this.width,
          y: Math.random() * this.height,
          speed: 18 + Math.random() * 66,
          size: Math.random() * 1.8 + 0.35,
          alpha: Math.random() * 0.55 + 0.18,
        });
      }
    }
    this.draw();
  };

  private onKeyDown = (event: KeyboardEvent): void => {
    const key = event.key.toLowerCase();
    if (['arrowleft', 'arrowright', 'arrowup', 'arrowdown', 'w', 'a', 's', 'd'].includes(key)) {
      if (this.running) event.preventDefault();
      this.keys.add(key);
    }
  };

  private onKeyUp = (event: KeyboardEvent): void => {
    this.keys.delete(event.key.toLowerCase());
  };

  private onPointerDown = (event: PointerEvent): void => {
    this.pointerActive = true;
    this.canvas.setPointerCapture?.(event.pointerId);
    this.setPointerTarget(event);
  };

  private onPointerMove = (event: PointerEvent): void => {
    if (this.pointerActive) this.setPointerTarget(event);
  };

  private onPointerUp = (): void => {
    this.pointerActive = false;
  };

  private setPointerTarget(event: PointerEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    this.pointerTargetX = event.clientX - rect.left;
    this.pointerTargetY = event.clientY - rect.top;
  }

  private animate = (timestamp: number): void => {
    if (!this.running) return;
    const delta = this.lastFrame ? Math.min((timestamp - this.lastFrame) / 1000, 0.05) : 0;
    this.lastFrame = timestamp;
    this.update(delta);
    this.draw();
    if (this.running) this.frameId = requestAnimationFrame(this.animate);
  };

  private update(delta: number): void {
    this.elapsed += delta;
    this.hudElapsed += delta;
    this.spawnElapsed += delta;
    this.fireElapsed += delta;
    this.invulnerableFor = Math.max(0, this.invulnerableFor - delta);

    this.movePlayer(delta);
    this.updateStars(delta);
    this.fireIfReady();
    this.updateShots(delta);
    this.updateEnemies(delta);
    this.resolveCollisions();

    if (this.hudElapsed >= 0.12) {
      this.hudElapsed = 0;
      this.onHud(this.snapshot());
    }
    if (this.lives <= 0) {
      this.running = false;
      this.onCue('game-over');
      this.onHud(this.snapshot());
      this.onGameOver(this.snapshot(), Math.floor(this.elapsed));
    }
  }

  private movePlayer(delta: number): void {
    const speed = 360;
    let dx = 0;
    let dy = 0;
    if (this.keys.has('arrowleft') || this.keys.has('a')) dx -= 1;
    if (this.keys.has('arrowright') || this.keys.has('d')) dx += 1;
    if (this.keys.has('arrowup') || this.keys.has('w')) dy -= 1;
    if (this.keys.has('arrowdown') || this.keys.has('s')) dy += 1;

    if (dx || dy) {
      const length = Math.hypot(dx, dy) || 1;
      this.playerX += (dx / length) * speed * delta;
      this.playerY += (dy / length) * speed * delta;
    } else if (this.pointerActive) {
      const catchup = Math.min(1, delta * 11);
      this.playerX += (this.pointerTargetX - this.playerX) * catchup;
      this.playerY += (this.pointerTargetY - this.playerY) * catchup;
    }

    this.playerX = Math.max(24, Math.min(this.width - 24, this.playerX));
    this.playerY = Math.max(this.height * 0.42, Math.min(this.height - 28, this.playerY));
  }

  private updateStars(delta: number): void {
    for (const star of this.stars) {
      star.y += star.speed * delta;
      if (star.y > this.height + 2) {
        star.y = -2;
        star.x = Math.random() * this.width;
      }
    }
  }

  private fireIfReady(): void {
    if (this.fireElapsed < 0.23) return;
    this.fireElapsed = 0;
    this.shots.push({ x: this.playerX, y: this.playerY - 22, speed: 620 });
    this.shotsFired += 1;
    if (this.shotsFired % 3 === 0) this.onCue('fire');
  }

  private updateShots(delta: number): void {
    for (let i = this.shots.length - 1; i >= 0; i -= 1) {
      const shot = this.shots[i];
      if (!shot) continue;
      shot.y -= shot.speed * delta;
      if (shot.y < -16) this.shots.splice(i, 1);
    }
  }

  private updateEnemies(delta: number): void {
    const spawnInterval = difficultyPace[this.difficulty] / (1 + (this.wave - 1) * 0.12);
    if (this.spawnElapsed >= spawnInterval) {
      this.spawnElapsed = 0;
      const radius = 13 + Math.random() * 9;
      this.enemies.push({
        x: radius + Math.random() * Math.max(1, this.width - radius * 2),
        y: -radius,
        radius,
        speed: (82 + Math.random() * 54 + (this.wave - 1) * 8) * (this.difficulty === 'intense' ? 1.22 : 1),
        drift: (Math.random() - 0.5) * 100,
        phase: Math.random() * Math.PI * 2,
      });
    }

    for (let i = this.enemies.length - 1; i >= 0; i -= 1) {
      const enemy = this.enemies[i];
      if (!enemy) continue;
      enemy.y += enemy.speed * delta;
      enemy.phase += delta * 2.4;
      enemy.x += (enemy.drift * 0.24 + Math.sin(enemy.phase) * 22) * delta;
      if (enemy.x < enemy.radius || enemy.x > this.width - enemy.radius) enemy.drift *= -1;
      if (enemy.y > this.height + enemy.radius) {
        this.enemies.splice(i, 1);
        this.loseLife();
      }
    }
  }

  private resolveCollisions(): void {
    for (let enemyIndex = this.enemies.length - 1; enemyIndex >= 0; enemyIndex -= 1) {
      const enemy = this.enemies[enemyIndex];
      if (!enemy) continue;

      let destroyed = false;
      for (let shotIndex = this.shots.length - 1; shotIndex >= 0; shotIndex -= 1) {
        const shot = this.shots[shotIndex];
        if (!shot) continue;
        const distance = Math.hypot(enemy.x - shot.x, enemy.y - shot.y);
        if (distance < enemy.radius + 5) {
          this.shots.splice(shotIndex, 1);
          this.enemies.splice(enemyIndex, 1);
          this.score += 10 * this.wave;
          this.kills += 1;
          this.onCue('hit');
          destroyed = true;
          break;
        }
      }
      if (destroyed) continue;

      if (this.invulnerableFor <= 0 && Math.hypot(enemy.x - this.playerX, enemy.y - this.playerY) < enemy.radius + 16) {
        this.enemies.splice(enemyIndex, 1);
        this.loseLife();
      }
    }

    const nextWave = 1 + Math.floor(this.score / 120);
    if (nextWave > this.wave) {
      this.wave = nextWave;
      this.onCue('wave');
    }
  }

  private loseLife(): void {
    if (this.invulnerableFor > 0 || this.lives <= 0) return;
    this.lives -= 1;
    this.invulnerableFor = 1.15;
    this.onCue('damage');
  }

  private snapshot(): HudSnapshot {
    return { score: this.score, lives: this.lives, wave: this.wave, kills: this.kills };
  }

  private draw(): void {
    const { context: ctx, width, height } = this;
    if (!width || !height) return;
    const background = ctx.createLinearGradient(0, 0, width, height);
    background.addColorStop(0, '#0c1723');
    background.addColorStop(0.56, '#10152a');
    background.addColorStop(1, '#171022');
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(97, 155, 201, 0.055)';
    ctx.lineWidth = 1;
    const gridSize = 42;
    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    for (const star of this.stars) {
      ctx.globalAlpha = star.alpha;
      ctx.fillStyle = '#b7e8ff';
      ctx.fillRect(star.x, star.y, star.size, star.size);
    }
    ctx.globalAlpha = 1;

    for (const shot of this.shots) {
      ctx.save();
      ctx.shadowColor = '#52dfff';
      ctx.shadowBlur = 13;
      ctx.strokeStyle = '#b9f5ff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(shot.x, shot.y + 8);
      ctx.lineTo(shot.x, shot.y - 9);
      ctx.stroke();
      ctx.restore();
    }

    for (const enemy of this.enemies) this.drawEnemy(enemy);
    this.drawPlayer();
  }

  private drawPlayer(): void {
    const { context: ctx } = this;
    if (this.invulnerableFor > 0 && Math.floor(this.elapsed * 14) % 2 === 0) return;
    ctx.save();
    ctx.translate(this.playerX, this.playerY);
    ctx.shadowColor = '#51ddff';
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#75e7ff';
    ctx.beginPath();
    ctx.moveTo(0, -23);
    ctx.lineTo(19, 16);
    ctx.lineTo(7, 12);
    ctx.lineTo(0, 19);
    ctx.lineTo(-7, 12);
    ctx.lineTo(-19, 16);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#f2fcff';
    ctx.beginPath();
    ctx.moveTo(0, -13);
    ctx.lineTo(5, 7);
    ctx.lineTo(-5, 7);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  private drawEnemy(enemy: Enemy): void {
    const { context: ctx } = this;
    ctx.save();
    ctx.translate(enemy.x, enemy.y);
    ctx.rotate(Math.sin(enemy.phase) * 0.08);
    ctx.shadowColor = '#ff5f98';
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#ff648d';
    ctx.beginPath();
    ctx.moveTo(0, -enemy.radius);
    ctx.lineTo(enemy.radius * 0.92, -enemy.radius * 0.28);
    ctx.lineTo(enemy.radius * 0.68, enemy.radius * 0.85);
    ctx.lineTo(0, enemy.radius * 0.55);
    ctx.lineTo(-enemy.radius * 0.68, enemy.radius * 0.85);
    ctx.lineTo(-enemy.radius * 0.92, -enemy.radius * 0.28);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff2f7';
    ctx.fillRect(-enemy.radius * 0.42, -2, 4, 4);
    ctx.fillRect(enemy.radius * 0.22, -2, 4, 4);
    ctx.restore();
  }
}
