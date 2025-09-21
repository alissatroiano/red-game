import Phaser from 'phaser';
import { SpellingBeeGame } from './SpellingBeeGame';
import type { GetDictionaryResponse } from '../../../shared/types/api';

function getLocalISODate(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatLocalISO(iso: string) {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default class GameScene extends Phaser.Scene {
  private gameLogic: SpellingBeeGame;
  private typedWord: string = '';
  private textInput: Phaser.GameObjects.Text;
  private scoreText: Phaser.GameObjects.Text;
  private messageText: Phaser.GameObjects.Text;
  private wordsGuessedText: Phaser.GameObjects.Text;
  private dateText: Phaser.GameObjects.Text;
  private letterButtons: Phaser.GameObjects.Text[] = [];

  constructor() {
    super({ key: 'GameScene' });
  }

  preload() {
    this.load.image('background', 'assets/bg.png');
    this.load.image('shuffle', 'assets/shuffle.png');
  }

  async create() {
    // Get letters for this specific post
    let centerLetter: string;
    let outerLetters: string[];
    let gameDate: string;

    try {
      const lettersResponse = await fetch('/api/get-letters');
      const lettersData = await lettersResponse.json();
      centerLetter = lettersData.centerLetter;
      outerLetters = lettersData.outerLetters;
      gameDate = lettersData.date || getLocalISODate();
    } catch (error) {
      // Fallback to current date generation
      gameDate = getLocalISODate();
      const generated = this.generateDailyLetters(gameDate);
      centerLetter = generated.centerLetter;
      outerLetters = generated.outerLetters;
    }

    // Load dictionary
    try {
      const response = await fetch('/api/get-dictionary');
      const data: GetDictionaryResponse = await response.json();
      this.gameLogic = new SpellingBeeGame(centerLetter, outerLetters, data.words);
    } catch (error) {
      const fallbackDictionary = ['example', 'words', 'for', 'fallback', 'game', 'play', 'enemy', 'gameplay', 'lamp', 'maple', 'meat', 'team', 'mate', 'tame'];
        this.gameLogic = new SpellingBeeGame(centerLetter, outerLetters, fallbackDictionary);
    }

    await this.loadDailyProgress();
    this.setupUI(gameDate);
    this.setupInput();
    this.updateFoundWordsDisplay();
  }

  private generateDailyLetters(date: string) {
    const alphabet = 'abcdefghijklmnopqrstuvwxyz';
    const vowels = 'aeiou';
    
    const [year, month, day] = date.split('-').map(Number);
    let seed = year * 10000 + month * 100 + day;
    
    function seededRandom() {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    }

    const centerIndex = Math.floor(seededRandom() * alphabet.length);
    const centerLetter = alphabet[centerIndex] || 'a';

    const outerLetters: string[] = [];
    let attempts = 0;
    
    const centerIsVowel = vowels.includes(centerLetter);
    const vowelsNeeded = centerIsVowel ? 1 : 2;
    let vowelsAdded = 0;
    
    while (outerLetters.length < 6 && attempts < 100) {
      attempts++;
      let letter: string;
      
      if (vowelsAdded < vowelsNeeded && outerLetters.length >= 6 - vowelsNeeded) {
        const vowelIdx = Math.floor(seededRandom() * vowels.length);
        letter = vowels[vowelIdx] || 'a';
      } else {
        const idx = Math.floor(seededRandom() * alphabet.length);
        letter = alphabet[idx] || 'b';
      }
      
      if (letter !== centerLetter && !outerLetters.includes(letter)) {
        outerLetters.push(letter);
        if (vowels.includes(letter)) {
          vowelsAdded++;
        }
      }
    }

    return { centerLetter, outerLetters };
  }

  private setupUI(gameDate: string) {
    const { width, height } = this.cameras.main;
    const isSmallScreen = width < 600;
    const centerX = isSmallScreen ? width * 0.5 : width / 2;

    const formattedDate = formatLocalISO(gameDate);

    this.dateText = this.add.text(20, 20, formattedDate, {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'Montserrat',
    });

    this.scoreText = this.add.text(20, 45, ' ', {
      fontSize: '24px',
      color: '#4aff7a',
      fontFamily: 'AnnieUseYourTelescope',
    });

    const shuffleIcon = this.add
      .image(centerX, 30, 'shuffle')
      .setScale(0.3)
      .setInteractive()
      .on('pointerdown', () => this.shuffleLetters());

    this.textInput = this.add
      .text(centerX, height * 0.15, '', {
        fontSize: '32px',
        color: '#d54aff',
        padding: { x: 10, y: 8 },
        fontFamily: 'Montserrat',
      })
      .setOrigin(0.5);

    this.messageText = this.add
      .text(centerX, height * 0.22, '', {
        fontSize: '24px',
        color: '#f3491aff',
        fontFamily: 'AnnieUseYourTelescope',
      })
      .setOrigin(0.5);

    const hexRadius = isSmallScreen ? 100 : 120;
    const centerY = height * 0.5;

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
    for (let i = this.gameLogic.outerLetters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.gameLogic.outerLetters[i], this.gameLogic.outerLetters[j]] = 
        [this.gameLogic.outerLetters[j], this.gameLogic.outerLetters[i]];
    }
    
    const { width, height } = this.cameras.main;
    const isSmallScreen = width < 600;
    const centerX = isSmallScreen ? width * 0.5 : width / 2;
    const hexRadius = isSmallScreen ? 100 : 120;
    const centerY = height * 0.5;
    
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const x = centerX + Math.cos(angle) * hexRadius;
      const y = centerY + Math.sin(angle) * hexRadius;
      const letter = this.gameLogic.outerLetters[i];
      
      if (this.letterButtons[i + 1] && letter) {
        this.letterButtons[i + 1].setText(letter.toUpperCase());
        this.letterButtons[i + 1].setPosition(x, y);
        this.letterButtons[i + 1].removeAllListeners('pointerdown');
        this.letterButtons[i + 1].on('pointerdown', () => this.addLetter(letter));
      }
    }
  }

  private async submitWord() {
    if (this.typedWord.length < 4) {
      this.showMessage('Too short');
      return;
    }

    const result = this.gameLogic.submitWord(this.typedWord);
    
    if (result.valid) {
      this.showMessage(`+${result.points} points!`);
      this.typedWord = '';
      this.updateDisplay();
      this.updateFoundWordsDisplay();
      await this.saveDailyProgress();
    } else {
      this.showMessage(result.message || 'Invalid word');
    }
  }

  private updateDisplay() {
    this.textInput.setText(this.typedWord.toUpperCase());
    this.scoreText.setText(`Score: ${this.gameLogic.getScore()}`);
  }

  private showMessage(text: string) {
    this.messageText.setText(text);
    this.time.delayedCall(2000, () => {
      this.messageText.setText('');
    });
  }

  private async loadDailyProgress() {
    try {
      const response = await fetch('/api/daily-game');
      if (!response.ok) return;

      const data = await response.json();
      if (data.gameState) {
        this.gameLogic.setScore(data.gameState.score || 0);
        this.gameLogic.setFoundWords(data.gameState.foundWords || []);
      }
    } catch (error) {
      console.log('No previous progress found');
    }
  }

  private async saveDailyProgress() {
    try {
      const gameState = {
        type: 'dailyState',
        postId: 'current',
        date: getLocalISODate(),
        score: this.gameLogic.getScore(),
        foundWords: this.gameLogic.getFoundWords(),
        isCompleted: false
      };
      
      await fetch('/api/daily-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gameState)
      });
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  }

  private updateFoundWordsDisplay() {
    const foundWords = this.gameLogic.getFoundWords();
    if (foundWords.length > 0) {
      this.wordsGuessedText.setText(`Words found: ${foundWords.join(', ')}`);
    } else {
      this.wordsGuessedText.setText('');
    }
  }

  private pauseGame() {
    this.scene.pause();
  }
}