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

// Generate daily letters based on date
function generateDailyLetters(date: string) {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz';
  const vowels = 'aeiou';
  
  // Create a more robust seed from date
  const [year, month, day] = date.split('-').map(Number);
  let seed = year * 10000 + month * 100 + day;
  
  // Linear congruential generator for better randomness
  function seededRandom() {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  }

  const centerIndex = Math.floor(seededRandom() * alphabet.length);
  const centerLetter = alphabet[centerIndex] || 'a';

  const outerLetters: string[] = [];
  let attempts = 0;
  
  // Ensure at least 2 vowels total
  const centerIsVowel = vowels.includes(centerLetter);
  const vowelsNeeded = centerIsVowel ? 1 : 2;
  let vowelsAdded = 0;
  
  while (outerLetters.length < 6 && attempts < 100) {
    attempts++;
    let letter: string;
    
    // Force vowels if we need them
    if (vowelsAdded < vowelsNeeded && outerLetters.length >= 6 - vowelsNeeded) {
      const vowelIdx = Math.floor(seededRandom() * vowels.length);
      letter = vowels[vowelIdx] || 'a';
    } else {
      const idx = Math.floor(seededRandom() * alphabet.length);
      letter = alphabet[idx] || 'b';
    }
    
    if (letter !== centerLetter && !outerLetters.includes(letter)) {
      outerLetters.push(letter);
      if (vowels.includes(letter)) {
        vowelsAdded++;
      }
    }
  }

  return { centerLetter, outerLetters, date };
}

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

    const today = new Date().toISOString().split('T')[0];
    await redis.set(`score:${today}:${userId}`, score.toString());

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

    // Use postId for game state key to allow playing old posts
    const gameStateStr = await redis.get(`daily:${postId}:${userId}`);

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
  
  // Use postId for game state key to allow playing old posts
  await redis.set(`daily:${postId}:${userId}`, JSON.stringify(gameState));

  res.json({
    type: 'saveDaily',
    success: true,
  });
});

router.get('/api/get-dictionary', async (_req, res): Promise<void> => {
  try {
    const response = await fetch('https://raw.githubusercontent.com/sindresorhus/word-list/refs/heads/main/words.txt');
    const text = await response.text();
    const words = text.split('\n').filter(word => word.length >= 4);
    
    res.json({ type: 'dictionary', words });
  } catch (error) {
    const fallbackWords = ['able', 'about', 'above', 'after', 'again', 'agent', 'agree', 'ahead', 'alive', 'allow', 'alone', 'along', 'among', 'angry', 'apart', 'apple', 'apply', 'argue', 'arise', 'array', 'aside', 'avoid', 'awake', 'award', 'aware', 'basic', 'beach', 'began', 'begin', 'being', 'below', 'black', 'block', 'blood', 'board', 'bound', 'brain', 'brand', 'brave', 'bread', 'break', 'breed', 'brief', 'bring', 'broad', 'broke', 'brown', 'build', 'built', 'carry', 'catch', 'cause', 'chain', 'chair', 'charm', 'chart', 'chase', 'cheap', 'check', 'chest', 'chief', 'child', 'china', 'chose', 'civil', 'claim', 'class', 'clean', 'clear', 'click', 'climb', 'clock', 'close', 'cloud', 'coach', 'coast', 'could', 'count', 'court', 'cover', 'craft', 'crash', 'crazy', 'cream', 'crime', 'cross', 'crowd', 'crown', 'curve', 'cycle', 'daily', 'dance', 'death', 'delay', 'depth', 'doing', 'doubt', 'dozen', 'draft', 'drama', 'dream', 'dress', 'drill', 'drink', 'drive', 'drove', 'dying', 'eager', 'early', 'earth', 'eight', 'elite', 'empty', 'enemy', 'enjoy', 'enter', 'entry', 'equal', 'error', 'event', 'every', 'exact', 'exist', 'extra', 'faith', 'false', 'fault', 'field', 'fifth', 'fifty', 'fight', 'final', 'first', 'fixed', 'flash', 'fleet', 'floor', 'fluid', 'focus', 'force', 'forth', 'forty', 'forum', 'found', 'frame', 'frank', 'fraud', 'fresh', 'front', 'fruit', 'fully', 'funny', 'giant', 'given', 'glass', 'globe', 'going', 'grace', 'grade', 'grand', 'grant', 'grass', 'grave', 'great', 'green', 'gross', 'group', 'grown', 'guard', 'guess', 'guest', 'guide', 'happy', 'heart', 'heavy', 'hence', 'horse', 'hotel', 'house', 'human'];
    res.json({ type: 'dictionary', words: fallbackWords });
  }
});

router.get('/api/get-letters', async (_req, res): Promise<void> => {
  const { postId } = context;
  
  if (!postId) {
    res.status(400).json({ status: 'error', message: 'postId is required' });
    return;
  }

  try {
    // First try to get letters specific to this post
    const lettersStr = await redis.get(`post_letters_${postId}`);
    
    if (lettersStr) {
      const letters = JSON.parse(lettersStr);
      res.json(letters);
    } else {
      // Fallback: generate letters based on current date
      const today = new Date().toISOString().split('T')[0] || '2025-01-01';
      const letters = generateDailyLetters(today);
      res.json(letters);
    }
  } catch (error) {
    console.error(`Error getting letters for post ${postId}:`, error);
    res.status(500).json({ status: 'error', message: 'Failed to get letters' });
  }
});

router.post('/internal/on-app-install', async (_req, res): Promise<void> => {
  try {
    const post = await createPost();
    
    // Generate and store letters for this post
    const today = new Date().toISOString().split('T')[0] || '2025-01-01';
    const letters = generateDailyLetters(today);
    await redis.set(`post_letters_${post.id}`, JSON.stringify(letters));
    await redis.set(`daily_letters_${today}`, JSON.stringify({ ...letters, postId: post.id }));

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
    
    // Generate and store letters for this post
    const today = new Date().toISOString().split('T')[0] || '2025-01-01';
    const letters = generateDailyLetters(today);
    await redis.set(`post_letters_${post.id}`, JSON.stringify(letters));
    await redis.set(`daily_letters_${today}`, JSON.stringify({ ...letters, postId: post.id }));

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
  const { subredditName } = context;
  const subreddit = subredditName || 'unknown';
  
  try {
    const post = await createPost();
    
    // Generate letters for this specific post's date
    const postDate = new Date().toISOString().split('T')[0] || '2025-01-01';
    const letters = generateDailyLetters(postDate);
    
    // Store letters with both post ID and date for persistence
    await redis.set(`post_letters_${post.id}`, JSON.stringify(letters));
    await redis.set(`daily_letters_${postDate}`, JSON.stringify({ ...letters, postId: post.id }));
    
    console.log(`Daily post created in r/${subreddit}: ${post.id} for ${postDate} with letters:`, letters);

    res.json({
      status: 'success',
      message: `Daily post created in r/${subreddit} with id ${post.id} for ${postDate}`,
    });
  } catch (error) {
    console.error(`Error creating daily post in r/${subreddit}:`, error);
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

  const today = new Date().toISOString().split('T')[0];
  const score = await redis.get(`score:${today}:${userId}`) || '0';
  
  res.json({
    message: `User: ${userId}\nScore: ${score}`,
  });
});

// Test endpoint to verify daily puzzle generation
router.get('/api/test-daily/:date', async (req, res): Promise<void> => {
  const { date } = req.params;
  const letters = generateDailyLetters(date);
  res.json({ date, letters });
});

// Test endpoint to verify post-specific letters
router.get('/api/test-post/:postId', async (req, res): Promise<void> => {
  const { postId } = req.params;
  
  try {
    const lettersStr = await redis.get(`post_letters_${postId}`);
    
    if (lettersStr) {
      const letters = JSON.parse(lettersStr);
      res.json({ postId, letters, found: true });
    } else {
      res.json({ postId, letters: null, found: false, message: 'No letters found for this post' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve letters' });
  }
});

// Use router middleware
app.use(router);

// Get port from environment variable with fallback
const port = process.env.WEBBIT_PORT || 3000;

const server = createServer(app);
server.on('error', (err) => console.error(`server error; ${err.stack}`));
server.listen(port, () => console.log(`http://localhost:${port}`));
