import Phaser from 'phaser';
import { SpellingBeeGame, GameValidationResult } from './SpellingBeeGame';

export default class GameScene extends Phaser.Scene {
    private gameLogic: SpellingBeeGame;
    private typedWord: string = '';
    private textInput: Phaser.GameObjects.Text;
    private scoreText: Phaser.GameObjects.Text;
    private messageText: Phaser.GameObjects.Text;

    constructor() {
        super({ key: 'GameScene' });
    }

    preload() {
        // Preload any assets like background images or letter graphics
        // For simplicity, we'll use text
    }

    async create() {
        // Load dictionary from server
        const centerLetter = 'p';
        const outerLetters = ['a', 'c', 'l', 'e', 's', 'o'];
        
        try {
            const response = await fetch('../../server/dictionary.json');
            const dictionary = await response.json();
            this.gameLogic = new SpellingBeeGame(centerLetter, outerLetters, dictionary);
        } catch (error) {
            // Fallback dictionary if server fails
            const fallbackDictionary = ["collapse", "palace", "pale", "pole", "scope", "cap"];
            this.gameLogic = new SpellingBeeGame(centerLetter, outerLetters, fallbackDictionary);
        }
        
        this.setupUI();
        this.setupInput();
    }

    setupUI() {
        // Display the center letter
        this.add.text(400, 200, this.gameLogic.getGameState().centerLetter.toUpperCase(), { fontSize: '48px' }).setOrigin(0.5);

        // Display the outer letters in a hexagon shape
        const outerLetterPositions = [
            [400, 100], [500, 150], [500, 250], [400, 300], [300, 250], [300, 150]
        ];
        this.gameLogic.getGameState().outerLetters.forEach((letter, index) => {
            this.add.text(outerLetterPositions[index]![0]!, outerLetterPositions[index]![1]!, letter.toUpperCase(), { fontSize: '32px' }).setOrigin(0.5);
        });

        // Display current word input area
        this.textInput = this.add.text(400, 400, '', { fontSize: '32px' }).setOrigin(0.5);
        
        // Display score
        this.scoreText = this.add.text(100, 50, `Score: ${this.gameLogic.getGameState().currentScore}`, { fontSize: '24px' });

        // Display feedback message
        this.messageText = this.add.text(400, 450, '', { fontSize: '24px', color: '#ff0000' }).setOrigin(0.5);
    }

    setupInput() {
        // Handle keyboard input for typing and submitting words
        this.input.keyboard!.on('keydown', (event: KeyboardEvent) => {
            const key = event.key.toLowerCase();

            if (key === 'backspace') {
                this.typedWord = this.typedWord.slice(0, -1);
            } else if (key === 'enter') {
                this.submitWord();
            } else if (key.length === 1 && key.match(/[a-z]/)) {
                // Ensure only allowed letters can be typed
                const allowedLetters = new Set([...this.gameLogic.getGameState().outerLetters, this.gameLogic.getGameState().centerLetter]);
                if (allowedLetters.has(key)) {
                    this.typedWord += key;
                } else {
                    this.showFeedback('Invalid letter.', '#ff0000');
                }
            }

            this.textInput.setText(this.typedWord.toUpperCase());
        });
    }

    submitWord() {
        if (this.typedWord.length > 0) {
            const result: GameValidationResult = this.gameLogic.submitWord(this.typedWord);
            
            // Display feedback based on the result
            if (result.type === 'success') {
                this.showFeedback(`${result.message} +${result.points}`, '#00ff00');
                this.updateScore();
            } else {
                this.showFeedback(result.message, '#ff0000');
            }
            
            // Clear the input area
            this.typedWord = '';
            this.textInput.setText('');
        }
    }

    updateScore() {
        this.scoreText.setText(`Score: ${this.gameLogic.getGameState().currentScore}`);
    }

    showFeedback(message: string, color: string) {
        this.messageText.setText(message);
        this.messageText.setColor(color);
        this.time.delayedCall(2000, () => {
            this.messageText.setText('');
        });
    }
}
