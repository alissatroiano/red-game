export type InitResponse = {
  type: 'init';
  postId: string;
  count: number;
};

export type GetDictionaryResponse = {
  type: 'dictionary';
  words: string[];
};

export interface GameData {
  gameId: string;
  words: string[];
  attempts: number;
  guessedWords: string[];
  targetWord: string;
  updateScore: (points: number) => void;
  score: number;
}

export type UserScore = {
  type: 'score';
  postId: string;
  count: number;
};

export type saveScore = {
  type: 'score';
  postId: string;
  count: number;
};

export type DailyGameState = {
  type: 'dailyState';
  postId: string;
  date: string;
  score: number;
  foundWords: string[];
  isCompleted: boolean;
};

export type LoadDailyGameResponse = {
  type: 'loadDaily';
  gameState: DailyGameState | null;
};

export type SaveDailyGameResponse = {
  type: 'saveDaily';
  success: boolean;
};

export type GameValidationResult =
  | { type: 'success'; points: number; message: string }
  | { type: 'already_found'; message: string }
  | { type: 'no_center_letter'; message: string }
  | { type: 'too_short'; message: string }
  | { type: 'not_in_dictionary'; message: string }
  | { type: 'wrong_letters'; message: string };

// API Response types
type Response<T> = { status: 'error'; message: string } | ({ status: 'success' } & T);

export type InitGameResponse = Response<{
  gameData: GameData;
  availableWords: string[];
}>;

export type StartGameResponse = Response<{
  gameData: GameData;
}>;

export type SubmitGuessResponse = Response<{
  gameData: GameData;
  correctAnswer?: string;
}>;
