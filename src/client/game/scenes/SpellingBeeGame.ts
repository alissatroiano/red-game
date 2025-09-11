interface GameState {
  centerLetter: string;
  outerLetters: string[];
  foundWords: Set<string>;
  currentScore: number;
}

export class SpellingBeeGame {
  private gameState: GameState;

  constructor(centerLetter: string, outerLetters: string[]) {
    this.gameState = {
      centerLetter,
      outerLetters,
      foundWords: new Set<string>(),
      currentScore: 0,
    };
  }

  public basicRuleCheck(word: string): GameValidationResult {
    if (!word.includes(this.gameState.centerLetter)) {
      return { type: 'no_center_letter', message: 'Must use the center letter.' };
    }
    if (word.length < 4) {
      return { type: 'too_short', message: 'Too short.' };
    }
    const allLetters = new Set([...this.gameState.outerLetters, this.gameState.centerLetter]);
    for (const char of word) {
      if (!allLetters.has(char)) {
        return { type: 'wrong_letters', message: 'Contains invalid letters.' };
      }
    }
    return { type: 'success', points: 0, message: 'Passed local checks.' };
  }

  public acceptWord(word: string): GameValidationResult {
    if (this.gameState.foundWords.has(word)) {
      return { type: 'already_found', message: 'Already found.' };
    }
    this.gameState.foundWords.add(word);

    const points = this.calculatePoints(word);
    this.gameState.currentScore += points;

    return { type: 'success', points, message: 'Great job!' };
  }

  private calculatePoints(word: string): number {
    if (word.length === 4) return 1;
    let points = word.length;

    const allLetters = new Set([...this.gameState.outerLetters, this.gameState.centerLetter]);
    const wordLetters = new Set(word);
    if (allLetters.size === wordLetters.size && [...allLetters].every(l => wordLetters.has(l))) {
      points += 7; // pangram bonus
    }
    return points;
  }

  public getGameState(): GameState {
    return this.gameState;
  }
}

export type GameValidationResult =
  | { type: 'success'; points: number; message: string }
  | { type: 'already_found'; message: string }
  | { type: 'no_center_letter'; message: string }
  | { type: 'too_short'; message: string }
  | { type: 'not_in_dictionary'; message: string }
  | { type: 'wrong_letters'; message: string };
