import Phaser from "phaser";
import "./style.css";
import { GameState } from "./state/GameState";
import { GameScene } from "./scenes/GameScene";
import { mountStatPanel } from "./ui/StatPanel";

const gameState = new GameState();

const uiPanel = document.querySelector<HTMLDivElement>("#ui-panel")!;
mountStatPanel(uiPanel, gameState);

const gameContainer = document.querySelector<HTMLDivElement>("#game-container")!;

new Phaser.Game({
  type: Phaser.AUTO,
  parent: gameContainer,
  width: 720,
  height: 480,
  backgroundColor: "#111018",
  scene: [new GameScene(gameState)],
  render: { pixelArt: true },
});

// The pit only progresses while the tab is open — persist on the way out
// rather than simulating elapsed time, so nothing advances while closed.
window.addEventListener("beforeunload", () => gameState.persist());
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") gameState.persist();
});
