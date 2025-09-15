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

export type IncrementResponse = {
  type: 'increment';
  postId: string;
  count: number;
};

export type DecrementResponse = {
  type: 'decrement';
  postId: string;
  count: number;
};

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