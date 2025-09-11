import express from 'express';
import { redis, createServer, context } from '@devvit/web/server';
import fs from 'fs';
import path from 'path';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.text());

const router = express.Router();

// --- Redis dictionary key ---
const REDIS_DICTIONARY_KEY = 'english_words';

// --- Load dictionary into Redis if not already loaded ---
async function loadDictionaryToRedis() {
  const exists = await redis.exists(REDIS_DICTIONARY_KEY);
  if (!exists) {
    console.log('Loading dictionary into Redis...');
    const filePath = path.resolve('./words.txt'); // adjust path if needed
    const text = fs.readFileSync(filePath, 'utf-8');
    const words = text.split(/\r?\n/).filter(Boolean);
    
    // Use Redis SET for fast membership checking
    await redis.sAdd(REDIS_DICTIONARY_KEY, ...words);
    console.log(`Dictionary loaded into Redis with ${words.length} words.`);
  } else {
    console.log('Dictionary already in Redis.');
  }
}

// --- Endpoint to check a word ---
router.get('/api/check-word', async (req, res) => {
  const word = (req.query.word as string)?.toLowerCase();
  if (!word) {
    return res.status(400).json({ status: 'error', message: 'word is required' });
  }

  try {
    await loadDictionaryToRedis(); // ensures dictionary is loaded

    const isValid = await redis.sIsMember(REDIS_DICTIONARY_KEY, word);
    res.json({ valid: Boolean(isValid) });
  } catch (error) {
    console.error(`Word check failed: ${error}`);
    res.status(500).json({ status: 'error', message: 'Dictionary lookup failed' });
  }
});

// --- Other demo routes (init, increment, decrement) if needed ---
// router.get('/api/init', ...)

app.use(router);

const port = process.env.WEBBIT_PORT || 3000;
const server = createServer(app);
server.on('error', (err) => console.error(`server error; ${err.stack}`));
server.listen(port, () => console.log(`Server listening on http://localhost:${port}`));
