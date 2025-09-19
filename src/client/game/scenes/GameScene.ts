import Phaser from 'phaser';
import { SpellingBeeGame } from './SpellingBeeGame';
import type { GetDictionaryResponse } from '../../../shared/types/api';

export default class GameScene extends Phaser.Scene {
  private gameLogic: SpellingBeeGame;
  private typedWord: string = '';
  private textInput: Phaser.GameObjects.Text;
  private scoreText: Phaser.GameObjects.Text;
  private messageText: Phaser.GameObjects.Text;
  private wordsGuessedText: Phaser.GameObjects.Text;
  private letterButtons: Phaser.GameObjects.Text[] = [];

  constructor() {
    super({ key: 'GameScene' });
  }

  preload() {
    this.load.image('background', 'assets/bg.png');
    this.load.image('shuffle', 'assets/shuffle.png');
  }

  async create() {
    const alphabet = 'abcdefghijklmnopqrstuvwxyz';
    const today = new Date();
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();

    function seededRandom(seed: number) {
      const x = Math.sin(seed) * 10000;
      return x - Math.floor(x);
    }

    const centerIndex = Math.floor(seededRandom(seed) * alphabet.length);
    const centerLetter = alphabet[centerIndex] || 'a';

    const outerLetters: string[] = [];
    let attempts = 0;
    while (outerLetters.length < 6 && attempts < 100) {
      attempts++;
      const idx = Math.floor(seededRandom(seed + attempts) * alphabet.length);
      const letter = alphabet[idx] || 'b';
      if (letter !== centerLetter && !outerLetters.includes(letter)) {
        outerLetters.push(letter);
      }
    }

    try {
      const response = await fetch('/api/get-dictionary');
      const data: GetDictionaryResponse = await response.json();
      this.gameLogic = new SpellingBeeGame(centerLetter, outerLetters, data.words);
    } catch (error) {
   const fallbackDictionary = ['devil', 'evil', 'file', 'live', 'vile', 'play', 'read', 'dear', 'bead', 'bade', 'fade', 'face', 'cafe', 'decaf'];
      this.gameLogic = new SpellingBeeGame(centerLetter, outerLetters, fallbackDictionary);
    }

    await this.loadDailyProgress();
    this.setupUI();
    this.setupInput();
    this.updateFoundWordsDisplay();
  }

  private setupUI() {
    const { width, height } = this.cameras.main;
    const isSmallScreen = width < 600;
    const centerX = isSmallScreen ? width * 0.5 : width / 2;

    // Score
    this.scoreText = this.add.text(20, 20, ' ', {
      fontSize: '24px',
      color: '#4aff7a',
      fontFamily: 'AnnieUseYourTelescope',
    });

    // Shuffle icon in top middle
    const shuffleIcon = this.add.image(centerX, 30, 'shuffle')
      .setScale(0.3)
      .setInteractive()
      .on('pointerdown', () => this.shuffleLetters());

    // Current word input
    this.textInput = this.add
      .text(centerX, height * 0.15, '', {
        fontSize: '32px',
        color: '#d54aff',
        padding: { x: 10, y: 8 },
        fontFamily: 'Montserrat',
      })
      .setOrigin(0.5);

    // Message area
    this.messageText = this.add
      .text(centerX, height * 0.22, '', {
        fontSize: '24px',
        color: '#f3491aff',
        fontFamily: 'AnnieUseYourTelescope',
      })
      .setOrigin(0.5);

    // Letter hexagon with increased spacing
    const hexRadius = isSmallScreen ? 100 : 120;
    const centerY = height * 0.5;

    // Center letter
    const centerButton = this.add
      .text(centerX, centerY, this.gameLogic.centerLetter.toUpperCase(), {
        fontSize: '33px',
        color: '#000000ff',
        backgroundColor: '#f39c12',
        padding: { x: 20, y: 15 },
        fontFamily: 'Montserrat',
      })
      .setOrigin(0.5)
      .setInteractive();

    centerButton.on('pointerdown', () => this.addLetter(this.gameLogic.centerLetter));
    this.letterButtons.push(centerButton);

    // Outer letters in hexagon pattern
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const x = centerX + Math.cos(angle) * hexRadius;
      const y = centerY + Math.sin(angle) * hexRadius;
      const letter = this.gameLogic.outerLetters[i];

      if (!letter) continue;

      const letterButton = this.add
        .text(x, y, letter.toUpperCase(), {
        fontSize: '30px',
          color: '#000',
          backgroundColor: '#ecf0f1',
          padding: { x: 15, y: 10 },
          fontFamily: 'Montserrat',
        })
        .setOrigin(0.5)
        .setInteractive();

      letterButton.on('pointerdown', () => this.addLetter(letter));
      this.letterButtons.push(letterButton);
    }

    // Action buttons
    const buttonY = height * 0.8;
    const deleteBtn = this.add
      .text(centerX - 120, buttonY, 'DELETE', {
        fontSize: '16px',
        color: '#ff0040ff',
        backgroundColor: 'transparent',
        padding: { x: 12, y: 8 },
        fontFamily: 'MontserratBold',
      })
      .setOrigin(0.5)
      .setInteractive();

    const enterBtn = this.add
      .text(centerX, buttonY, 'ENTER', {
        fontSize: '16px',
        backgroundColor: 'transparent',
        color: 'rgba(59, 250, 42, 1)',
        padding: { x: 12, y: 8 },
        fontFamily: 'MontserratBold',
      })
      .setOrigin(0.5)
      .setInteractive();

    const pauseBtn = this.add
      .text(centerX + 120, buttonY, 'PAUSE', {
        fontSize: '16px',
        color: '#ffbf00ff',
        backgroundColor: 'transparent',
        padding: { x: 12, y: 8 },
        fontFamily: 'MontserratBold',
      })
      .setOrigin(0.5)
      .setInteractive();

    deleteBtn.on('pointerdown', () => this.deleteLetter());
    enterBtn.on('pointerdown', () => this.submitWord());
    pauseBtn.on('pointerdown', () => this.pauseGame());

    this.scoreText.setText(`Score: ${this.gameLogic.getScore()}`);

    // Found words - positioned below action buttons
    this.wordsGuessedText = this.add
      .text(centerX, buttonY + 50, ' ', {
        fontSize: '21px',
        color: '#ffaa00ff',
        wordWrap: { width: width - 40 },
        fontFamily: 'AnnieUseYourTelescope',
      })
      .setOrigin(0.5, 0);
  }

  private setupInput() {
    // Physical keyboard input
    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();

      if (key === 'backspace') {
        this.deleteLetter();
      } else if (key === 'enter') {
        this.submitWord();
      } else if (key === ' ') {
        this.shuffleLetters();
      } else if (this.isValidLetter(key)) {
        this.addLetter(key);
      }
    });
    
  }

  private isValidLetter(letter: string): boolean {
    return letter === this.gameLogic.centerLetter || this.gameLogic.outerLetters.includes(letter);
  }

  private addLetter(letter: string) {
    this.typedWord += letter;
    this.updateDisplay();
  }

  private deleteLetter() {
    this.typedWord = this.typedWord.slice(0, -1);
    this.updateDisplay();
  }

  private shuffleLetters() {
    // Shuffle outer letter positions
    const shuffled = this.gameLogic.shuffleOuterLetters();

    // Update button text
    for (let i = 1; i < this.letterButtons.length; i++) {
      const letter = shuffled[i - 1];
      if (letter) {
        this.letterButtons[i]?.setText(letter.toUpperCase());
      }
    }
  }

  private submitWord() {
    if (this.typedWord.length < 4) {
      this.showMessage('Word must be at least 4 letters');
      return;
    }

    const result = this.gameLogic.validateWord(this.typedWord);

    if (result.isValid) {
      this.showMessage(`+${result.points} points!`);
      this.scoreText.setText(`Score: ${this.gameLogic.getScore()}`);
      this.updateFoundWordsDisplay();
      void this.saveDailyProgress();
    } else {
      this.showMessage(result.message || 'Invalid word');
    }

    this.typedWord = '';
    this.updateDisplay();
  }

  private updateDisplay() {
    this.textInput.setText(this.typedWord.toUpperCase());
  }

  private showMessage(text: string) {
    this.messageText.setText(text);
    this.time.delayedCall(2000, () => this.messageText.setText(''));
  }

  private async loadDailyProgress() {
    try {
      const response = await fetch('/api/daily-game');
      if (!response.ok) return;

      const data = await response.json();
      if (data.gameState) {
        this.gameLogic.loadDailyGameState(data.gameState);
      }
    } catch (error) {
      console.error('Failed to load daily progress:', error);
    }
  }

  private async saveDailyProgress() {
    try {
      const gameState = this.gameLogic.getDailyGameState('current');
      await fetch('/api/daily-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gameState),
      });
    } catch (error) {
      console.error('Failed to save daily progress:', error);
    }
  }

  private updateFoundWordsDisplay() {
    const words = this.gameLogic.getFoundWords();
    this.wordsGuessedText.setText(`${words.join(', ')}`);
  }

  private pauseGame() {
    void this.saveDailyProgress();
    this.scene.start('MainMenu');
  }
}
