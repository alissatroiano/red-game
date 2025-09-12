import express from 'express';
import { redis, createServer } from '@devvit/web/server';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.text());

const router = express.Router();

const REDIS_DICTIONARY_KEY = 'words';

// --- Load dictionary into Redis if not already loaded ---
async function loadDictionaryToRedis() {
  const exists = await redis.exists(REDIS_DICTIONARY_KEY);
  if (!exists) {
    console.log('Loading dictionary into Redis...');

    // Fetch words.txt from public/assets
    const response = await fetch('/assets/words.txt'); // relative to server
    const text = await response.text();
    const words = text.split(/\r?\n/).filter(Boolean);

    // Store in Redis as a set for fast lookup
    await redis.sAdd(REDIS_DICTIONARY_KEY, ...words);
    console.log(`Dictionary loaded into Redis with ${words.length} words.`);
  } else {
    console.log('Dictionary already in Redis.');
  }
}

// --- Endpoint to get dictionary ---
router.get('/api/get-dictionary', async (req, res) => {
  try {
    const response = await fetch('/assets/words.txt');
    const text = await response.text();
    const words = text.split(/\r?\n/).filter(Boolean);

    res.json({ type: 'dictionary', words });
  } catch (error) {
    console.error(`Dictionary fetch failed: ${error}`);
    res.status(500).json({ status: 'error', message: 'Dictionary fetch failed' });
  }
});

app.use(router);

const port = process.env.WEBBIT_PORT || 3000;
const server = createServer(app);
server.on('error', (err) => console.error(`server error: ${err.stack}`));
server.listen(port, async () => {
  console.log(`Server listening on http://localhost:${port}`);
  await loadDictionaryToRedis();
});
