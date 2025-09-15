import express from 'express';
import { redis, createServer, context, getServerPort } from '@devvit/web/server';
import { 
  GetDictionaryResponse,
  InitGameResponse,
  StartGameResponse} from '../shared/types/api.js';
import { initializeGame } from './core/game.js';
import { createPost } from './core/post';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.text());
const router = express.Router();

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

router.get<{ postId: string }, InitGameResponse | { status: string; message: string }>(
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


router.get<{}, InitGameResponse>('/api/init', async (_req, res): Promise<void> => {
  try {
    const { userId } = context();

    if (!userId) {
      res.status(400).json({
        status: 'error',
        message: 'Must be logged in to play',
      });
      return;
    }

    const result = await initializeGame(userId);
    
    res.json({
      status: 'success',
      ...result,
    });
  } catch (error) {
    console.error('API Init Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error during initialization';
    res.status(500).json({ status: 'error', message });
  }
});

// --- Load dictionary into Redis if not already loaded ---
async function loadDictionaryToRedis() {
  const exists = await redis.exists('words');
  if (!exists) {
    console.log('Loading dictionary into Redis...');

    // Fetch words.txt from public/assets
    const response = await fetch('/assets/words.txt'); // relative to server
    const text = await response.text();
    const words = text.split(/\r?\n/).filter(Boolean);
    const key = 'words';
    await redis.set(key, 'words');

    // Store in Redis as a set for fast lookup
    console.log(`Dictionary loaded into Redis with ${words.length} words.`);
  } else {
    console.log('Dictionary already in Redis.');
  }
}

// --- Endpoint to get dictionary ---
router.get<{}, GetDictionaryResponse>('/api/get-dictionary', async (_req, res):
Promise<void> => {
  try {
    const { userId } = ();

    if (!userId) {
           res.status(400).json({ status: 'error', message: 'Must be logged in' });

      return;
    }

    const result = await initializeGame(userId);

    router.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
    
    const response = await fetch('/assets/words.txt');
    const text = await response.text();
    const words = text.split(/\r?\n/).filter(Boolean);
    res.json({ type: 'dictionary', words });
  } catch (error) {
    console.error(`Dictionary fetch failed: ${error}`);
    res.status(500).json({ type: 'dictionary', words: [] });
  }
});

router.post<{}, StartGameResponse>('/api/start-game', async (_req, res): Promise<void> => {
  try {
    const { postId } = context;
    if (!postId) {
      res.status(400).json({ status: 'error', message: 'Must be logged in to start game' });
      return;
    }
    res.json({ status: 'success', gameData: { postId, score: 0, attempts: 0, guessedWords: [], targetWord: '', words: [], updateScore: (points: number) => {} } });
  } catch (error) {
    console.error('Start Game Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error starting game';
    res.status(500).json({ status: 'error', message });
  }
});

app.use(router);

const port = process.env.NODE_ENV === 'development' ? 8081 : getServerPort();
const server = createServer(app);
server.on('error', (err) => console.error(`server error: ${err.stack}`));
server.listen(port, async () => {
  console.log(`Server listening on http://localhost:${port}`);
  await loadDictionaryToRedis();
});
