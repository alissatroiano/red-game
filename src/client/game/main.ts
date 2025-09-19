import { Boot } from './scenes/Boot';
import { GameOver } from './scenes/GameOver';
import GameScene from './scenes/GameScene';
import { MainMenu } from './scenes/MainMenu';
import * as Phaser from 'phaser';
import { AUTO, Game } from 'phaser';
import { Preloader } from './scenes/Preloader';

const config: Phaser.Types.Core.GameConfig = {
  type: AUTO,
  parent: 'game-container',
  backgroundColor: '#0a0a0a',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1024,
    height: 768,
  },
  scene: [Boot, Preloader, MainMenu, GameScene, GameOver],
};

const StartGame = (parent: string) => {
  return new Game({ ...config, parent });
};

export const showDirections = () => {
  const modal = document.getElementById('modal');
  modal?.classList.toggle('hidden');
};

// Initialize modal event listeners
document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('modal');
  const closeBtn = document.querySelector('.close');

  closeBtn?.addEventListener('click', showDirections);
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) showDirections();
  });
});

export default StartGame;
