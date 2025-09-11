import Phaser from 'phaser';
import { SpellingBeeGame, GameValidationResult } from './SpellingBeeGame';

export default class GameScene extends Phaser.Scene {
  private gameLogic: SpellingBeeGame;
  private typedWord: string = '';
  private textInput: Phaser.GameObjects.Text;
  private scoreText: Phaser.GameObjects.Text;
  private messageText: Phaser.GameObjects.Text;
  private guessedWordsText: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'GameScene' });
  }

  preload() {
    this.load.image('background', 'assets/bg.png');
  }

  async create() {
    const centerLetter = 'p';
    const outerLetters = ['a', 'c', 'l', 'e', 's', 'o'];

    // Initialize game logic without dictionary
    this.gameLogic = new SpellingBeeGame(centerLetter, outerLetters, []);

    this.setupUI();
    this.setupInput();
  }

  // ✅ Arrow function for TypeScript-safe this binding
  private checkWord = async (word: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/check-word?word=${word}`);
      const data = await response.json();
      return data.valid;
    } catch (error) {
      console.error('Word check failed', error);
      return false;
    }
  };

  setupUI() {
    // Center letter
    this.add
      .text(400, 200, this.gameLogic.getGameState().centerLetter.toUpperCase(), {
        fontSize: '48px',
      })
      .setOrigin(0.5);

    // Outer letters in hexagon
    const outerLetterPositions = [
      [400, 100],
      [500, 150],
      [500, 250],
      [400, 300],
      [300, 250],
      [300, 150],
    ];
    this.gameLogic.getGameState().outerLetters.forEach((letter, index) => {
      this.add
        .text(
          outerLetterPositions[index]![0]!,
          outerLetterPositions[index]![1]!,
          letter.toUpperCase(),
          {
            fontSize: '32px',
          }
        )
        .setOrigin(0.5);
    });

    // Input area
    this.textInput = this.add.text(400, 400, '', { fontSize: '32px' }).setOrigin(0.5);

    // Score
    this.scoreText = this.add.text(
      100,
      50,
      `Score: ${this.gameLogic.getGameState().currentScore}`,
      {
        fontSize: '24px',
      }
    );

    // Feedback message
    this.messageText = this.add
      .text(400, 450, '', { fontSize: '24px', color: '#ff0000' })
      .setOrigin(0.5);

    // Guessed words list
    this.guessedWordsText = this.add
      .text(600, 50, 'Guessed Words:\n', {
        fontSize: '20px',
        wordWrap: { width: 200, useAdvancedWrap: true },
      })
      .setOrigin(0, 0);
  }

  setupInput() {
    this.input.keyboard!.on('keydown', (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();

      if (key === 'backspace') {
        this.typedWord = this.typedWord.slice(0, -1);
      } else if (key === 'enter') {
        this.submitWord();
      } else if (key.length === 1 && key.match(/[a-z]/)) {
        const allowedLetters = new Set([
          ...this.gameLogic.getGameState().outerLetters,
          this.gameLogic.getGameState().centerLetter,
        ]);
        if (allowedLetters.has(key)) {
          this.typedWord += key;
        } else {
          this.showFeedback('Invalid letter.', '#ff0000');
        }
      }

      this.textInput.setText(this.typedWord.toUpperCase());
    });
  }

  async submitWord() {
    if (!this.typedWord) return;
    const guess = this.typedWord.toLowerCase();

    // Step 1: local rule check
    const localResult = this.gameLogic.basicRuleCheck(guess);
    if (localResult.type !== 'success') {
      this.showFeedback(localResult.message, '#ff0000');
      this.resetInput();
      return;
    }

    // Step 2: dictionary check
    const isValid = await this.checkWord(guess);
    if (!isValid) {
      this.showFeedback('Not a recognized word.', '#ff0000');
      this.resetInput();
      return;
    }

    // Step 3: officially submit word
    const result = this.gameLogic.acceptWord(guess);
    const pointsText = 'points' in result ? ` +${(result as any).points}` : '';
    this.showFeedback(`${result.message}${pointsText}`, '#00ff00');

    this.updateScore();
    this.updateGuessedWords();
    this.resetInput();
  }

  private resetInput() {
    this.typedWord = '';
    this.textInput.setText('');
  }

  private updateGuessedWords() {
    const words = Array.from(this.gameLogic.getGameState().foundWords);
    this.guessedWordsText.setText('Guessed Words:\n' + words.join('\n'));
  }

  private updateScore() {
    this.scoreText.setText(`Score: ${this.gameLogic.getGameState().currentScore}`);
  }

  private showFeedback(message: string, color: string) {
    this.messageText.setText(message);
    this.messageText.setColor(color);
    this.time.delayedCall(2000, () => {
      this.messageText.setText('');
    });
  }
}
