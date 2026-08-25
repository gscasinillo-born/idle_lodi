import Phaser from "phaser";
import { GameState } from "../state/GameState";
import { BASE_STAT_VALUE, deriveStats } from "../data/stats";
import { generateFloorMonster, isBossFloor } from "../systems/FloorGenerator";
import { BOSS_TEMPLATES, REGULAR_TEMPLATES } from "../data/monsterTemplates";
import type { MonsterDefinition } from "../data/types";
import { ensureCircleTexture } from "../utils/textures";

const PLAYER_RADIUS = 48;
const BOOTSTRAP_FRAME = 0;

type AnimSets = Record<string, { row: number; rate: number; repeat: number }>;
type Dir = "down" | "left" | "right" | "up";
interface Zone { xMin: number; xMax: number; yMin: number; yMax: number; }

// Shared 4-column x 12-row layout: walk/attack/hurt rows, each x 4 directions x 4 frames.
const DIRS: Dir[] = ["down", "left", "right", "up"];

const HERO_ANIM_SETS: AnimSets = {
  walk: { row: 0, rate: 8, repeat: -1 },
  attack: { row: 4, rate: 12, repeat: 0 },
  hurt: { row: 8, rate: 10, repeat: 0 },
};

const MONSTER_ANIM_SETS: AnimSets = {
  walk: { row: 0, rate: 7, repeat: -1 },
  attack: { row: 4, rate: 11, repeat: 0 },
  hurt: { row: 8, rate: 10, repeat: 0 },
};

// Regular monsters and bosses share the same sheet format, so both are loaded
// and animated the same way — a missing file (e.g. no boss art yet) is caught
// per-monster at spawn time via textures.exists(), not here.
const ALL_MONSTER_TEMPLATES = [...REGULAR_TEMPLATES, ...BOSS_TEMPLATES];

// AGI speeds up the attack swing itself (not just how often it triggers), scaling
// from 1x at the base stat value up to 2x by 100 AGI — matches the same "AGI makes
// you faster" read as attackIntervalMs, just applied to the animation's frame rate.
const AGI_AT_MAX_ANIM_SPEED = 100;

function attackAnimSpeedMultiplier(agi: number): number {
  return Phaser.Math.Clamp(1 + (agi - BASE_STAT_VALUE) / (AGI_AT_MAX_ANIM_SPEED - BASE_STAT_VALUE), 1, 2);
}

// Idle wandering is a leisurely stroll; an attack lunge is a quick, fixed-duration step
// in and back regardless of distance, so it always reads as a snappy strike.
const WANDER_SPEED_PX_PER_SEC = 45;
const MELEE_GAP = 58;
const LUNGE_OUT_MS = 130;
const LUNGE_BACK_MS = 170;

function facingForVector(dx: number, dy: number): Dir {
  if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? "right" : "left";
  return dy >= 0 ? "down" : "up";
}

function oppositeDir(dir: Dir): Dir {
  switch (dir) {
    case "left": return "right";
    case "right": return "left";
    case "up": return "down";
    case "down": return "up";
  }
}

interface Positioned {
  x: number;
  y: number;
  displayHeight: number;
}

export class GameScene extends Phaser.Scene {
  private gameState!: GameState;

  private monster!: MonsterDefinition;
  private monsterHp = 0;
  private playerAttackAcc = 0;
  private monsterAttackAcc = 0;
  private combatOver = false;

  private playerSprite!: Phaser.GameObjects.Sprite;
  private monsterSprite!: Phaser.GameObjects.Sprite;
  private monsterHasSprite = false;
  private playerHpBar!: Phaser.GameObjects.Graphics;
  private monsterHpBar!: Phaser.GameObjects.Graphics;
  private floorText!: Phaser.GameObjects.Text;
  private playerNameText!: Phaser.GameObjects.Text;
  private monsterNameText!: Phaser.GameObjects.Text;
  private bossBanner!: Phaser.GameObjects.Text;

  // Which way each combatant is currently facing — no longer fixed, since both now
  // wander the arena and turn to face whichever direction they're moving or attacking.
  private playerFacing: Dir = "right";
  private monsterFacing: Dir = "left";
  // True while a scripted movement (floor transition, spawn entrance, defeat flee) owns
  // the sprite's position, so idle wandering knows to hold off until it's done.
  private playerBusy = false;
  private monsterBusy = false;
  private playerZone!: Zone;
  private monsterZone!: Zone;
  // The point each combatant settles back to after an attack lunge or a wander leg — a
  // live-mutated point rather than a snapshot, so an in-flight lunge's return trip always
  // heads to wherever wandering most recently decided "home" should be.
  private playerRest = { x: 0, y: 0 };
  private monsterRest = { x: 0, y: 0 };

  constructor(gameState: GameState) {
    super("GameScene");
    this.gameState = gameState;
  }

  preload() {
    this.load.spritesheet("hero", "/sprites/characters/hero.png", { frameWidth: 32, frameHeight: 32 });
    for (const template of ALL_MONSTER_TEMPLATES) {
      const size = template.frameSize ?? 32;
      this.load.spritesheet(template.id, `/sprites/monsters/${template.id}.png`, { frameWidth: size, frameHeight: size });
    }
    // A monster template with no art file yet (e.g. a boss before its sprite is added)
    // 404s harmlessly here — spawnFloor() falls back to a generated blob for it.
    this.load.on("loaderror", (file: { key: string }) => {
      console.warn(`No sprite sheet found for "${file.key}" — falling back to a blob.`);
    });
  }

  create() {
    const { width, height } = this.scale;

    this.cameras.main.setBackgroundColor(0x111018);

    this.floorText = this.add.text(width / 2, 32, "", {
      fontFamily: "monospace",
      fontSize: "22px",
      color: "#ffffff",
    }).setOrigin(0.5);

    this.bossBanner = this.add.text(width / 2, 62, "", {
      fontFamily: "monospace",
      fontSize: "16px",
      color: "#ff5555",
    }).setOrigin(0.5);

    this.createAnimSet("hero", HERO_ANIM_SETS);
    for (const template of ALL_MONSTER_TEMPLATES) {
      if (this.textures.exists(template.id)) this.createAnimSet(template.id, MONSTER_ANIM_SETS);
    }

    // Each combatant wanders within its own half of the arena so idle movement never
    // strays into the other's space — only an attack lunge crosses the gap between them.
    const zoneTop = height * 0.40;
    const zoneBottom = height * 0.66;
    this.playerZone = { xMin: width * 0.12, xMax: width * 0.40, yMin: zoneTop, yMax: zoneBottom };
    this.monsterZone = { xMin: width * 0.60, xMax: width * 0.88, yMin: zoneTop, yMax: zoneBottom };

    this.playerRest = { x: width * 0.28, y: height * 0.58 };
    this.monsterRest = { x: width * 0.72, y: height * 0.58 };

    this.playerSprite = this.add.sprite(this.playerRest.x, this.playerRest.y, "hero", BOOTSTRAP_FRAME);
    this.playerSprite.setDisplaySize(PLAYER_RADIUS * 2, PLAYER_RADIUS * 2);
    this.playerSprite.play(`hero-walk-${this.playerFacing}`);
    this.playerHpBar = this.add.graphics();
    this.playerNameText = this.add.text(this.playerRest.x, this.playerRest.y + PLAYER_RADIUS + 18, "YOU", {
      fontFamily: "monospace",
      fontSize: "14px",
      color: "#cfd8ff",
    }).setOrigin(0.5);

    // Placeholder texture — spawnFloor() below swaps it to the real monster texture before the first render.
    this.monsterSprite = this.add.sprite(this.monsterRest.x, this.monsterRest.y, "hero", BOOTSTRAP_FRAME);
    this.monsterHpBar = this.add.graphics();
    this.monsterNameText = this.add.text(this.monsterRest.x, this.monsterRest.y + PLAYER_RADIUS + 18, "", {
      fontFamily: "monospace",
      fontSize: "14px",
      color: "#ffd8d8",
    }).setOrigin(0.5);

    this.spawnFloor();
    this.scheduleWander("player");
    this.scheduleWander("monster");

    this.gameState.onChange(() => this.refreshBars());
    this.gameState.onFloorJump((direction) => this.playFloorTransition(direction, () => this.spawnFloor()));
  }

  /** Plays the hero's walk-up/walk-down animation before handing off to the next floor's encounter. */
  private playFloorTransition(direction: "up" | "down", onComplete: () => void) {
    this.playerBusy = true;
    this.playerFacing = direction;
    const key = `hero-walk-${direction}`;
    if (this.anims.exists(key)) this.playerSprite.play(key);
    this.time.delayedCall(400, () => {
      this.playerBusy = false;
      onComplete();
    });
  }

  private createAnimSet(textureKey: string, sets: AnimSets) {
    for (const [set, cfg] of Object.entries(sets)) {
      DIRS.forEach((dir, i) => {
        const key = `${textureKey}-${set}-${dir}`;
        if (this.anims.exists(key)) return;
        const start = (cfg.row + i) * 4;
        this.anims.create({
          key,
          frames: this.anims.generateFrameNumbers(textureKey, { start, end: start + 3 }),
          frameRate: cfg.rate,
          repeat: cfg.repeat,
        });
      });
    }
  }

  /** Sets which way a combatant is facing and, if it has animation frames, plays the
   * matching idle/walk loop for that direction. */
  private setFacing(who: "player" | "monster", dir: Dir) {
    if (who === "player") {
      this.playerFacing = dir;
      const key = `hero-walk-${dir}`;
      if (this.anims.exists(key)) this.playerSprite.play(key);
    } else {
      this.monsterFacing = dir;
      if (!this.monsterHasSprite) return;
      const key = `${this.monster.id}-walk-${dir}`;
      if (this.anims.exists(key)) this.monsterSprite.play(key);
    }
  }

  /** Idle wandering: every couple of seconds, stroll to a new random point within the
   * combatant's own half of the arena — this is what puts the left/right/up/down walk
   * rows to use outside of combat. */
  private scheduleWander(who: "player" | "monster") {
    const delay = Phaser.Math.Between(1400, 3200);
    this.time.delayedCall(delay, () => this.wanderStep(who));
  }

  private wanderStep(who: "player" | "monster") {
    const busy = who === "player" ? this.playerBusy : this.monsterBusy;
    if (!busy) {
      const zone = who === "player" ? this.playerZone : this.monsterZone;
      const rest = who === "player" ? this.playerRest : this.monsterRest;
      const sprite = who === "player" ? this.playerSprite : this.monsterSprite;

      rest.x = Phaser.Math.Between(zone.xMin, zone.xMax);
      rest.y = Phaser.Math.Between(zone.yMin, zone.yMax);

      const dx = rest.x - sprite.x;
      const dy = rest.y - sprite.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 4) {
        this.setFacing(who, facingForVector(dx, dy));
        this.tweens.killTweensOf(sprite);
        this.tweens.add({
          targets: sprite,
          x: rest.x,
          y: rest.y,
          duration: (dist / WANDER_SPEED_PX_PER_SEC) * 1000,
          ease: "Linear",
        });
      }
    }
    this.scheduleWander(who);
  }

  /** A quick step toward the target (its otherwise-static rest spot is left in the
   * live-mutated `rest` point, so if wandering picks a new spot mid-lunge the return
   * trip still heads to the right place) followed by a step back. */
  private lungeToward(who: "player" | "monster") {
    const sprite = who === "player" ? this.playerSprite : this.monsterSprite;
    const targetSprite = who === "player" ? this.monsterSprite : this.playerSprite;
    const rest = who === "player" ? this.playerRest : this.monsterRest;

    const dx = targetSprite.x - sprite.x;
    const dy = targetSprite.y - sprite.y;
    const dist = Math.max(1, Math.hypot(dx, dy));
    const ratio = Math.max(0, (dist - MELEE_GAP) / dist);
    const approachX = sprite.x + dx * ratio;
    const approachY = sprite.y + dy * ratio;

    this.tweens.killTweensOf(sprite);
    this.tweens.add({
      targets: sprite,
      x: approachX,
      y: approachY,
      duration: LUNGE_OUT_MS,
      ease: "Sine.easeOut",
      onComplete: () => {
        this.tweens.add({
          targets: sprite,
          x: rest.x,
          y: rest.y,
          duration: LUNGE_BACK_MS,
          ease: "Sine.easeIn",
        });
      },
    });
  }

  private playHeroAction(action: "attack" | "hurt") {
    const key = `hero-${action}-${this.playerFacing}`;
    if (action === "attack") {
      const frameRate = HERO_ANIM_SETS.attack.rate * attackAnimSpeedMultiplier(this.gameState.effectiveStats.agi);
      this.playerSprite.play({ key, frameRate });
    } else {
      this.playerSprite.play(key);
    }
    this.playerSprite.once(`animationcomplete-${key}`, () => {
      this.playerSprite.play(`hero-walk-${this.playerFacing}`);
    });
  }

  private playMonsterAction(action: "attack" | "hurt") {
    if (!this.monsterHasSprite) return;
    const monsterId = this.monster.id;
    const key = `${monsterId}-${action}-${this.monsterFacing}`;
    if (action === "attack") {
      const frameRate = MONSTER_ANIM_SETS.attack.rate * attackAnimSpeedMultiplier(this.monster.stats.agi);
      this.monsterSprite.play({ key, frameRate });
    } else {
      this.monsterSprite.play(key);
    }
    this.monsterSprite.once(`animationcomplete-${key}`, () => {
      // A one-shot anim can outlive its monster (e.g. a killing blow right before
      // the next floor spawns) — don't stomp whatever's showing by then.
      if (this.monster.id !== monsterId) return;
      this.monsterSprite.play(`${monsterId}-walk-${this.monsterFacing}`);
    });
  }

  private spawnFloor() {
    this.combatOver = false;
    this.playerAttackAcc = 0;
    this.monsterAttackAcc = 0;
    this.monster = generateFloorMonster(this.gameState.floor);
    this.monsterHp = this.monster.hp;

    // Reset the hero back to its default combat-facing stance in case a floor-transition
    // animation (walk-up/walk-down) was still playing when this monster spawned in.
    this.playerBusy = false;
    this.setFacing("player", "right");

    const radius = this.monster.isBoss ? 64 : 44;
    // Bosses don't have art yet, so they fall back to a generated blob texture.
    this.monsterHasSprite = this.textures.exists(this.monster.id);

    this.monsterRest.x = Phaser.Math.Between(this.monsterZone.xMin, this.monsterZone.xMax);
    this.monsterRest.y = Phaser.Math.Between(this.monsterZone.yMin, this.monsterZone.yMax);

    if (this.monsterHasSprite) {
      // Walks in from above before settling into its facing-the-hero combat stance —
      // uses the sheet's "down" row, which combat itself never needs.
      const entranceKey = `${this.monster.id}-walk-down`;
      this.monsterBusy = true;
      this.monsterFacing = "down";
      this.monsterSprite.setPosition(this.monsterRest.x, this.monsterRest.y - 46);
      if (this.anims.exists(entranceKey)) this.monsterSprite.play(entranceKey);
      const monsterId = this.monster.id;
      this.tweens.add({
        targets: this.monsterSprite,
        x: this.monsterRest.x,
        y: this.monsterRest.y,
        duration: 400,
        ease: "Sine.easeOut",
        onComplete: () => {
          if (this.monster.id !== monsterId) return;
          this.monsterBusy = false;
          this.setFacing("monster", "left");
        },
      });
    } else {
      const texKey = `monster-${this.monster.color}-${radius}`;
      ensureCircleTexture(this, texKey, this.monster.color, radius);
      this.monsterSprite.stop();
      this.monsterSprite.setTexture(texKey);
      this.monsterSprite.setPosition(this.monsterRest.x, this.monsterRest.y);
      this.monsterBusy = false;
    }
    this.monsterSprite.setDisplaySize(radius * 2, radius * 2);

    this.monsterNameText.setText(`${this.monster.name} (Lv.${this.monster.level})`);
    this.floorText.setText(`Floor ${this.gameState.floor}`);
    this.bossBanner.setText(isBossFloor(this.gameState.floor) ? "⚔ BOSS FLOOR ⚔" : "");

    this.gameState.addLog(`Floor ${this.gameState.floor}: a ${this.monster.name} appears.`);
    this.refreshBars();
  }

  private refreshBars() {
    const derived = this.gameState.derived;
    this.drawBar(this.playerHpBar, this.playerSprite, this.gameState.hp, derived.maxHp, 0x4caf50);
    this.playerNameText.setPosition(this.playerSprite.x, this.playerSprite.y + this.playerSprite.displayHeight / 2 + 18);
    if (this.monster) {
      this.drawBar(this.monsterHpBar, this.monsterSprite, this.monsterHp, this.monster.hp, 0xe74c3c);
      this.monsterNameText.setPosition(this.monsterSprite.x, this.monsterSprite.y + this.monsterSprite.displayHeight / 2 + 18);
    }
  }

  private popupCombatText(target: Positioned, kind: "miss" | "hit" | "crit", isPlayerAttacking: boolean, amount?: number) {
    const baseX = target.x + Phaser.Math.Between(-10, 10);
    const baseY = target.y - target.displayHeight / 2 - 34;

    // The player's own miss renders red; the enemy's miss stays neutral gray.
    // Damage the player TAKES renders red; damage the player DEALS stays neutral white.
    const redColor = "#ff5555";
    const style =
      kind === "miss"
        ? { text: "MISS", color: isPlayerAttacking ? redColor : "#aaaaaa", fontSize: "16px", fontStyle: "italic" }
        : kind === "crit"
          ? { text: `-${amount} CRITICAL!`, color: "#ffcc33", fontSize: "22px", fontStyle: "bold" }
          : { text: `-${amount}`, color: isPlayerAttacking ? "#ffffff" : redColor, fontSize: "18px", fontStyle: "normal" };

    const label = this.add
      .text(baseX, baseY, style.text, {
        fontFamily: "monospace",
        fontSize: style.fontSize,
        fontStyle: style.fontStyle,
        color: style.color,
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(10);

    this.tweens.add({
      targets: label,
      y: baseY - 36,
      alpha: 0,
      duration: 750,
      ease: "Cubic.easeOut",
      onComplete: () => label.destroy(),
    });
  }

  private drawBar(gfx: Phaser.GameObjects.Graphics, sprite: Positioned, hp: number, maxHp: number, color: number) {
    const barWidth = 100;
    const barHeight = 10;
    const x = sprite.x - barWidth / 2;
    const y = sprite.y - sprite.displayHeight / 2 - 24;
    const pct = Phaser.Math.Clamp(hp / maxHp, 0, 1);

    gfx.clear();
    gfx.fillStyle(0x000000, 0.5);
    gfx.fillRect(x, y, barWidth, barHeight);
    gfx.fillStyle(color, 1);
    gfx.fillRect(x, y, barWidth * pct, barHeight);
    gfx.lineStyle(1, 0xffffff, 0.4);
    gfx.strokeRect(x, y, barWidth, barHeight);
  }

  update(_time: number, delta: number) {
    if (!this.monster) return;

    this.gameState.regen(delta / 1000);
    this.gameState.tickAutoSave(delta);
    // Runs every frame regardless of combat state so the HP bars and name labels keep
    // tracking the sprites while they wander, lunge, flee, or walk in — not just mid-fight.
    this.refreshBars();

    if (this.combatOver) return;

    const playerStats = this.gameState.derived;
    const monsterStats = deriveStats(this.monster.level, this.monster.stats);

    this.playerAttackAcc += delta;
    this.monsterAttackAcc += delta;

    if (this.playerAttackAcc >= playerStats.attackIntervalMs) {
      this.playerAttackAcc = 0;
      this.resolveAttack(playerStats.atk, playerStats.hit, monsterStats.flee, true);
    }

    if (this.combatOver) return;

    if (this.monsterAttackAcc >= monsterStats.attackIntervalMs) {
      this.monsterAttackAcc = 0;
      this.resolveAttack(monsterStats.atk, monsterStats.hit, playerStats.flee, false);
    }
  }

  private resolveAttack(atk: number, hit: number, targetFlee: number, isPlayerAttacking: boolean) {
    const attackerSprite = isPlayerAttacking ? this.playerSprite : this.monsterSprite;
    const targetSprite = isPlayerAttacking ? this.monsterSprite : this.playerSprite;

    // Face each other for the exchange, regardless of whatever direction idle
    // wandering last left them facing.
    const towardTarget = facingForVector(targetSprite.x - attackerSprite.x, targetSprite.y - attackerSprite.y);
    if (isPlayerAttacking) {
      this.playerFacing = towardTarget;
      this.monsterFacing = oppositeDir(towardTarget);
    } else {
      this.monsterFacing = towardTarget;
      this.playerFacing = oppositeDir(towardTarget);
    }

    this.lungeToward(isPlayerAttacking ? "player" : "monster");

    if (isPlayerAttacking) this.playHeroAction("attack");
    else this.playMonsterAction("attack");

    // 75% baseline for an even matchup; hit/flee gaps in this system are typically only
    // in the tens (not hundreds), so a small divisor is needed for a real stat/level
    // advantage to actually swing the odds instead of barely nudging off the baseline.
    const hitChance = Phaser.Math.Clamp(0.75 + (hit - targetFlee) / 50, 0.05, 0.99);
    const didHit = Math.random() < hitChance;

    if (!didHit) {
      this.popupCombatText(targetSprite, "miss", isPlayerAttacking);
      this.gameState.addLog(isPlayerAttacking ? "You missed." : `${this.monster.name} missed.`);
      return;
    }

    const isCrit = Math.random() * 100 < (isPlayerAttacking ? this.gameState.derived.crit : deriveStats(this.monster.level, this.monster.stats).crit);
    const damage = Math.max(1, Math.floor(atk * (isCrit ? 1.75 : 1) * Phaser.Math.FloatBetween(0.85, 1.15)));
    this.popupCombatText(targetSprite, isCrit ? "crit" : "hit", isPlayerAttacking, damage);

    if (isPlayerAttacking) {
      this.monsterHp = Math.max(0, this.monsterHp - damage);
      this.playMonsterAction("hurt");
      this.gameState.addLog(`You hit ${this.monster.name} for ${damage}${isCrit ? " (CRIT)" : ""}.`);
      if (this.monsterHp <= 0) this.onMonsterDefeated();
    } else {
      const died = this.gameState.takeDamage(damage);
      this.playHeroAction("hurt");
      this.gameState.addLog(`${this.monster.name} hits you for ${damage}${isCrit ? " (CRIT)" : ""}.`);
      if (died) this.onPlayerDefeated();
    }
  }

  private onMonsterDefeated() {
    this.combatOver = true;
    const { leveledUp } = this.gameState.gainRewards(this.monster.expReward, this.monster.goldReward);
    this.gameState.addLog(`Defeated ${this.monster.name}! +${this.monster.expReward} EXP, +${this.monster.goldReward} gold.`);
    if (leveledUp) this.gameState.addLog(`Level up! You are now level ${this.gameState.level}.`);
    this.gameState.advanceFloor();
    this.gameState.persist();

    const monsterId = this.monster.id;
    const hasSprite = this.monsterHasSprite;
    this.monsterBusy = true;
    // Let the killing blow's hurt animation finish naturally first (~400ms), then have the
    // monster flee off the top of the screen (its otherwise-unused "up" row, plus an actual
    // upward step) while the hero presses on deeper ("down").
    this.time.delayedCall(420, () => {
      if (this.monster.id === monsterId) {
        if (hasSprite) this.setFacing("monster", "up");
        this.tweens.killTweensOf(this.monsterSprite);
        this.tweens.add({
          targets: this.monsterSprite,
          y: this.monsterSprite.y - 70,
          duration: 400,
          ease: "Sine.easeIn",
        });
      }
      this.playFloorTransition("down", () => this.spawnFloor());
    });
  }

  private onPlayerDefeated() {
    this.combatOver = true;
    this.gameState.addLog(`You were defeated by ${this.monster.name}. Retreating one floor.`);
    this.gameState.retreatFloor();
    this.gameState.fullHeal();
    this.gameState.persist();
    this.time.delayedCall(800, () => this.playFloorTransition("up", () => this.spawnFloor()));
  }
}
