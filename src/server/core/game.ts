import { redis } from '@devvit/redis';
import { GameData, InitGameResponse } from '../shared/types/api.js';
 
export async function initializeGame(userId: string): Promise<{
  gameData: GameData;
  availableWords: string[];
}> {
  // Fetch the dictionary from Redis
  const wordsData = await redis.get('words');
  const availableWords = wordsData ? wordsData.split(',') : [];
    const gameData: GameData = {
    gameId: 'game-' + Date.now(),
    words: availableWords,
    attempts: 0,
    guessedWords: [],
    targetWord: '',
    updateScore: (points: number) => {
        // Update score logic here
        console.log(`Score updated by ${points} points.`);
    },
    score: 0,
  };
    return { gameData, availableWords };
}