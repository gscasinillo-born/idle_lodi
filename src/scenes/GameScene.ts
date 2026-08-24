import Phaser from "phaser";
import { GameState } from "../state/GameState";
import { deriveStats } from "../data/stats";
import { generateFloorMonster, isBossFloor } from "../systems/FloorGenerator";
import type { MonsterDefinition } from "../data/types";
import { ensureCircleTexture } from "../utils/textures";

const PLAYER_RADIUS = 48;
const BOOTSTRAP_FRAME = 0;

// The player always faces the monster on the right, so only the "right"
// row of each animation set is ever played.
const HERO_FACING = "right";
const HERO_DIRS = ["down", "left", "right", "up"];
const HERO_ANIM_SETS: Record<string, { row: number; rate: number; repeat: number }> = {
  walk: { row: 0, rate: 8, repeat: -1 },
  attack: { row: 4, rate: 12, repeat: 0 },
  hurt: { row: 8, rate: 10, repeat: 0 },
};

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
  private monsterSprite!: Phaser.GameObjects.Image;
  private playerHpBar!: Phaser.GameObjects.Graphics;
  private monsterHpBar!: Phaser.GameObjects.Graphics;
  private floorText!: Phaser.GameObjects.Text;
  private monsterNameText!: Phaser.GameObjects.Text;
  private bossBanner!: Phaser.GameObjects.Text;

  constructor(gameState: GameState) {
    super("GameScene");
    this.gameState = gameState;
  }

  preload() {
    this.load.spritesheet("hero", "/sprites/characters/hero.png", { frameWidth: 32, frameHeight: 32 });
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

    this.createHeroAnimations();
    this.playerSprite = this.add.sprite(width * 0.28, height * 0.58, "hero", BOOTSTRAP_FRAME);
    this.playerSprite.setDisplaySize(PLAYER_RADIUS * 2, PLAYER_RADIUS * 2);
    this.playerSprite.play(`hero-walk-${HERO_FACING}`);
    this.playerHpBar = this.add.graphics();
    this.add.text(width * 0.28, height * 0.58 + PLAYER_RADIUS + 18, "YOU", {
      fontFamily: "monospace",
      fontSize: "14px",
      color: "#cfd8ff",
    }).setOrigin(0.5);

    // Placeholder texture — spawnFloor() below swaps it to the real monster texture before the first render.
    this.monsterSprite = this.add.image(width * 0.72, height * 0.58, "hero", BOOTSTRAP_FRAME);
    this.monsterHpBar = this.add.graphics();
    this.monsterNameText = this.add.text(width * 0.72, height * 0.58 + PLAYER_RADIUS + 18, "", {
      fontFamily: "monospace",
      fontSize: "14px",
      color: "#ffd8d8",
    }).setOrigin(0.5);

    this.spawnFloor();

    this.gameState.onChange(() => this.refreshBars());
  }

  private createHeroAnimations() {
    for (const [set, cfg] of Object.entries(HERO_ANIM_SETS)) {
      HERO_DIRS.forEach((dir, i) => {
        const key = `hero-${set}-${dir}`;
        if (this.anims.exists(key)) return;
        const start = (cfg.row + i) * 4;
        this.anims.create({
          key,
          frames: this.anims.generateFrameNumbers("hero", { start, end: start + 3 }),
          frameRate: cfg.rate,
          repeat: cfg.repeat,
        });
      });
    }
  }

  private playHeroAction(action: "attack" | "hurt") {
    const key = `hero-${action}-${HERO_FACING}`;
    this.playerSprite.play(key);
    this.playerSprite.once(`animationcomplete-${key}`, () => {
      this.playerSprite.play(`hero-walk-${HERO_FACING}`);
    });
  }

  private spawnFloor() {
    this.combatOver = false;
    this.playerAttackAcc = 0;
    this.monsterAttackAcc = 0;
    this.monster = generateFloorMonster(this.gameState.floor);
    this.monsterHp = this.monster.hp;

    const radius = this.monster.isBoss ? 64 : 44;
    const texKey = `monster-${this.monster.color}-${radius}`;
    ensureCircleTexture(this, texKey, this.monster.color, radius);
    this.monsterSprite.setTexture(texKey);

    this.monsterNameText.setText(`${this.monster.name} (Lv.${this.monster.level})`);
    this.floorText.setText(`Floor ${this.gameState.floor}`);
    this.bossBanner.setText(isBossFloor(this.gameState.floor) ? "⚔ BOSS FLOOR ⚔" : "");

    this.gameState.addLog(`Floor ${this.gameState.floor}: a ${this.monster.name} appears.`);
    this.refreshBars();
  }

  private refreshBars() {
    const derived = this.gameState.derived;
    this.drawBar(this.playerHpBar, this.playerSprite, this.gameState.hp, derived.maxHp, 0x4caf50);
    if (this.monster) {
      this.drawBar(this.monsterHpBar, this.monsterSprite, this.monsterHp, this.monster.hp, 0xe74c3c);
    }
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

    this.refreshBars();
  }

  private resolveAttack(atk: number, hit: number, targetFlee: number, isPlayerAttacking: boolean) {
    if (isPlayerAttacking) this.playHeroAction("attack");

    const hitChance = Phaser.Math.Clamp((hit - targetFlee + 100) / 200, 0.15, 0.95);
    const didHit = Math.random() < hitChance;

    if (!didHit) {
      this.gameState.addLog(isPlayerAttacking ? "You missed." : `${this.monster.name} missed.`);
      return;
    }

    const isCrit = Math.random() * 100 < (isPlayerAttacking ? this.gameState.derived.crit : deriveStats(this.monster.level, this.monster.stats).crit);
    const damage = Math.max(1, Math.floor(atk * (isCrit ? 1.75 : 1) * Phaser.Math.FloatBetween(0.85, 1.15)));

    if (isPlayerAttacking) {
      this.monsterHp = Math.max(0, this.monsterHp - damage);
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
    this.time.delayedCall(500, () => this.spawnFloor());
  }

  private onPlayerDefeated() {
    this.combatOver = true;
    this.gameState.addLog(`You were defeated by ${this.monster.name}. Retreating one floor.`);
    this.gameState.retreatFloor();
    this.gameState.fullHeal();
    this.gameState.persist();
    this.time.delayedCall(800, () => this.spawnFloor());
  }
}
