import express from 'express';
import {
  InitResponse,
  saveScore,
  DailyGameState,
  LoadDailyGameResponse,
  SaveDailyGameResponse,
} from '../shared/types/api';
import { redis, createServer, context } from '@devvit/web/server';
import { createPost } from './core/post';

const app = express();

// Middleware for JSON body parsing
app.use(express.json());
// Middleware for URL-encoded body parsing
app.use(express.urlencoded({ extended: true }));
// Middleware for plain text body parsing
app.use(express.text());

const router = express.Router();

router.get<{ postId: string }, InitResponse | { status: string; message: string }>(
  '/api/init',
  async (_req, res): Promise<void> => {
    const { postId } = context;

    if (!postId) {
      console.error('API Init Error: postId not found in devvit context');
      res.status(400).json({
        status: 'error',
        message: 'postId is required but missing from context',
      });
      return;
    }

    try {
      const count = await redis.get('count');
      res.json({
        type: 'init',
        postId: postId,
        count: count ? parseInt(count) : 0,
      });
    } catch (error) {
      console.error(`API Init Error for post ${postId}:`, error);
      let errorMessage = 'Unknown error during initialization';
      if (error instanceof Error) {
        errorMessage = `Initialization failed: ${error.message}`;
      }
      res.status(400).json({ status: 'error', message: errorMessage });
    }
  }
);

router.get('/api/user', async (_req, res): Promise<void> => {
  const { userId } = context;
  res.json({ userId: userId || 'userId' });
});

router.post<{ postId: string }, saveScore | { status: string; message: string }, { score: number }>(
  '/api/score',
  async (req, res): Promise<void> => {
    const { postId, userId } = context;
    if (!postId || !userId) {
      res.status(400).json({
        status: 'error',
        message: 'postId and userId are required',
      });
      return;
    }

    const { score } = req.body;
    if (typeof score !== 'number') {
      res.status(400).json({
        status: 'error',
        message: 'score must be a number',
      });
      return;
    }

    await redis.set(`score:${postId}:${userId}`, score.toString());

    res.json({
      type: 'score',
      postId,
      count: score,
    });
  }
);

router.get<{ postId: string }, LoadDailyGameResponse | { status: string; message: string }>(
  '/api/daily-game',
  async (_req, res): Promise<void> => {
    const { postId, userId } = context;
    if (!postId || !userId) {
      res.status(400).json({ status: 'error', message: 'postId and userId are required' });
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const gameStateStr = await redis.get(`daily:${postId}:${userId}:${today}`);

    res.json({
      type: 'loadDaily',
      gameState: gameStateStr ? JSON.parse(gameStateStr) : null,
    });
  }
);

router.post<
  { postId: string },
  SaveDailyGameResponse | { status: string; message: string },
  DailyGameState
>('/api/daily-game', async (req, res): Promise<void> => {
  const { postId, userId } = context;
  if (!postId || !userId) {
    res.status(400).json({ status: 'error', message: 'postId and userId are required' });
    return;
  }

  const gameState = req.body;
  const today = new Date().toISOString().split('T')[0];

  await redis.set(`daily:${postId}:${userId}:${today}`, JSON.stringify(gameState));

  res.json({
    type: 'saveDaily',
    success: true,
  });
});

router.post('/internal/on-app-install', async (_req, res): Promise<void> => {
  try {
    const post = await createPost();

    res.json({
      status: 'success',
      message: `Post created in subreddit ${context.subredditName} with id ${post.id}`,
    });
  } catch (error) {
    console.error(`Error creating post: ${error}`);
    res.status(400).json({
      status: 'error',
      message: 'Failed to create post',
    });
  }
});

router.post('/internal/menu/post-create', async (_req, res): Promise<void> => {
  try {
    const post = await createPost();

    res.json({
      navigateTo: `https://reddit.com/r/${context.subredditName}/comments/${post.id}`,
    });
  } catch (error) {
    console.error(`Error creating post: ${error}`);
    res.status(400).json({
      status: 'error',
      message: 'Failed to create post',
    });
  }
});

router.post('/internal/cron/daily-job', async (_req, res): Promise<void> => {
  try {
    const post = await createPost();
    console.log(`Daily post created: ${post.id}`);

    res.json({
      status: 'success',
      message: `Daily post created with id ${post.id}`,
    });
  } catch (error) {
    console.error(`Error creating daily post: ${error}`);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create daily post',
    });
  }
});

router.post('/internal/menu/show-info', async (_req, res): Promise<void> => {
  const { postId, userId } = context;
  
  if (!postId || !userId) {
    res.status(400).json({ status: 'error', message: 'Missing context' });
    return;
  }

  const score = await redis.get(`score:${postId}:${userId}`) || '0';
  
  res.json({
    message: `User: ${userId}\nScore: ${score}`,
  });
});

// Use router middleware
app.use(router);

// Get port from environment variable with fallback
const port = process.env.WEBBIT_PORT || 3000;

const server = createServer(app);
server.on('error', (err) => console.error(`server error; ${err.stack}`));
server.listen(port, () => console.log(`http://localhost:${port}`));
