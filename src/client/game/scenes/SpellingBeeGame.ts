import { UserScore, DailyGameState } from '../../../shared/types/api';

export interface GameState {
  centerLetter: string;
  outerLetters: string[];
  foundWords: Set<string>;
  currentScore: number;
}

export class SpellingBeeGame {
  private dictionary: Set<string>; // All possible words
  private gameState: GameState;

  constructor(centerLetter: string, outerLetters: string[], dictionary: string[]) {
    // Initialize game state with provided letters and dictionary
    this.gameState = {
      centerLetter: centerLetter,
      outerLetters: outerLetters,
      foundWords: new Set<string>(),
      currentScore: 0,
    };
    this.dictionary = new Set(dictionary?.map((word) => word.toLowerCase()) || []);
  }

  // Returns a `GameValidationResult` object to communicate the outcome
  public submitWord(word: string): GameValidationResult {
    const lowerWord = word.toLowerCase();

    // Check if the word is valid based on the game rules
    if (this.isValidWord(lowerWord)) {
      // Check if the word has already been found
      if (this.gameState.foundWords.has(lowerWord)) {
        return { type: 'already_found', message: 'Already found.' };
      }

      // Word is new and valid, so add it and update the score
      this.gameState.foundWords.add(lowerWord);
      const points = this.calculatePoints(lowerWord);
      this.gameState.currentScore += points;

      return { type: 'success', points: points, message: 'Great job!' };
    } else {
      // Word is not valid, determine the specific error
      return this.getInvalidWordReason(lowerWord);
    }
  }

  private isValidWord(word: string): boolean {
    // Must contain center letter
    if (!word.includes(this.gameState.centerLetter)) {
      return false;
    }

    // Must be at least 4 letters long
    if (word.length < 4) {
      return false;
    }

    // All letters must be from the available set
    const allLetters = new Set([...this.gameState.outerLetters, this.gameState.centerLetter]);
    for (const char of word) {
      if (!allLetters.has(char)) {
        return false;
      }
    }

    // Must be in the dictionary
    if (!this.dictionary.has(word)) {
      return false;
    }

    return true;
  }

  private getInvalidWordReason(word: string): GameValidationResult {
    if (!word.includes(this.gameState.centerLetter)) {
      return { type: 'no_center_letter', message: 'Must use the center letter.' };
    }
    if (word.length < 4) {
      return { type: 'too_short', message: 'Too short.' };
    }
    if (!this.dictionary.has(word)) {
      return { type: 'not_in_dictionary', message: 'Not a recognized word.' };
    }
    return { type: 'wrong_letters', message: 'Contains invalid letters.' };
  }

  private calculatePoints(word: string): number {
    // Base points equal to word length
    let points = word.length;

    // Bonus points for rare letters
    const rareLetters = new Set(['v', 'w', 'x', 'y', 'z']);
    for (const letter of word) {
      if (rareLetters.has(letter)) {
        points += 2;
      }
    }

    // Bonus for pangrams (using all 7 letters)
    const allLetters = new Set([...this.gameState.outerLetters, this.gameState.centerLetter]);
    const wordLetters = new Set(word);
    if (
      allLetters.size === wordLetters.size &&
      [...allLetters].every((letter) => wordLetters.has(letter))
    ) {
      points += 7;
    }

    return points;
  }

  // Getters for game state
  public getGameState(): GameState {
    return this.gameState;
  }

  public get centerLetter(): string {
    return this.gameState.centerLetter;
  }

  public get outerLetters(): string[] {
    return this.gameState.outerLetters;
  }

  public getScore(): number {
    return this.gameState.currentScore;
  }

  public getFoundWords(): string[] {
    return Array.from(this.gameState.foundWords).sort();
  }

  public validateWord(word: string): { isValid: boolean; points?: number; message?: string } {
    const result = this.submitWord(word);
    if (result.type === 'success') {
      return { isValid: true, points: result.points };
    }
    return { isValid: false, message: result.message };
  }

  public shuffleOuterLetters(): string[] {
    const shuffled = [...this.gameState.outerLetters].sort(() => Math.random() - 0.5);
    this.gameState.outerLetters = shuffled;
    return shuffled;
  }

  public getUserScore(postId: string): UserScore {
    return {
      type: 'score',
      postId: postId,
      count: this.gameState.currentScore,
    };
  }

  public getDailyGameState(postId: string): DailyGameState {
    return {
      type: 'dailyState',
      postId,
      date: new Date().toISOString().split('T')[0]!,
      score: this.gameState.currentScore,
      foundWords: Array.from(this.gameState.foundWords),
      isCompleted: false,
    };
  }

  public loadDailyGameState(gameState: DailyGameState): void {
    this.gameState.currentScore = gameState.score;
    this.gameState.foundWords = new Set(gameState.foundWords);
  }
}

// Result type for submitted words
export type GameValidationResult =
  | { type: 'success'; points: number; message: string }
  | { type: 'already_found'; message: string }
  | { type: 'no_center_letter'; message: string }
  | { type: 'too_short'; message: string }
  | { type: 'not_in_dictionary'; message: string }
  | { type: 'wrong_letters'; message: string };
