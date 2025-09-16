import { context, reddit, redis } from '@devvit/web/server';
import { DailyGameState, InitResponse, UserScore } from '../../shared/types/api';

export const createPost = async () => {
  const { subredditName, postId } = context;
  if (!subredditName) {
    throw new Error('subredditName is required');
  }
  if (!postId) {
    throw new Error('postId is required');
  }

  // Get current score for display
  const today = new Date().toISOString().split('T')[0];
  const gameStateStr = await redis.get(`daily:${postId}:${today}`);
  const gameState: DailyGameState | null = gameStateStr ? JSON.parse(gameStateStr) : null;
  const currentScore = gameState?.score || 0;

  return await reddit.submitCustomPost({
    splash: {
      appDisplayName: 'Vocable',
    },
    subredditName: subredditName,
    title: 'Vocable',
    textFallback: {
      text: `Current Score: ${currentScore}`,
    },
  });
};

export const getDailyGameState = async (postId: string): Promise<DailyGameState | null> => {
  const stateJson = await redis.get(`dailyState:${postId}`);

  if (stateJson) {
    return JSON.parse(stateJson) as DailyGameState;
  }
  return null;
};

export const saveDailyGameState = async (postId: string, state: DailyGameState): Promise<void> => {
  await redis.set(`dailyState:${postId}`, JSON.stringify(state));
};

export const initializePostData = async (postId: string): Promise<InitResponse> => {
  const existingCount = await redis.get(`count:${postId}`);
  if (existingCount !== null) {
    return {
      type: 'init',
      postId,
      count: parseInt('existingCount', 10),
    };
  }
  const initialCount = 0;
  await redis.set(`count:${postId}`, initialCount.toString());
  return {
    type: 'init',
    postId,
    count: initialCount,
  };
};