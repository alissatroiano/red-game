import express from 'express';
import { redis, createServer, context } from '@devvit/web/server';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.text());

const router = express.Router();

// --- Load dictionary into Redis ---
async function loadDictionary() {
  const exists = await redis.exists('english_dictionary');
  if (!exists) {
    console.log('Loading dictionary into Redis...');
    const res = await fetch('https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt');
    const text = await res.text();
    const words = text.split(/\r?\n/).map(w => w.toLowerCase());

    const hashObj: Record<string, string> = {};
    for (const word of words) {
      hashObj[word] = '1';
    }

    await redis.hSet('english_dictionary', hashObj);
    console.log(`Dictionary loaded with ${words.length} words.`);
  } else {
    console.log('Dictionary already loaded in Redis.');
  }
}

// --- Check a word endpoint ---
router.get('/api/check-word', async (req, res) => {
  const word = (req.query.word as string)?.toLowerCase();
  if (!word) {
    res.status(400).json({ status: 'error', message: 'word is required' });
    return;
  }

  try {
    await loadDictionary();
    const exists = await redis.hExists('english_dictionary', word);
    console.log(`Word check: "${word}" => ${exists}`);
    res.json({ valid: exists });
  } catch (err) {
    console.error('Word check failed:', err);
    res.status(500).json({ status: 'error', message: 'Dictionary lookup failed' });
  }
});

// --- Track guessed words per post (optional) ---
router.post('/api/submit-word', async (req, res) => {
  const { word } = req.body as { word: string };
  const { postId } = context;

  if (!postId || !word) {
    res.status(400).json({ status: 'error', message: 'postId and word are required' });
    return;
  }

  try {
    await loadDictionary();

    const isValid = await redis.hExists('english_dictionary', word.toLowerCase());
    if (!isValid) {
      return res.json({ valid: false, message: 'Word not recognized.' });
    }

    // Store guessed word per post in Redis Set
    const postKey = `post:${postId}:guessed_words`;
    const alreadyGuessed = await redis.sIsMember(postKey, word.toLowerCase());
    if (alreadyGuessed) {
      return res.json({ valid: true, message: 'Word already guessed.', alreadyGuessed: true });
    }

    await redis.sAdd(postKey, word.toLowerCase());
    const guessedWords = await redis.smembers(postKey);

    res.json({ valid: true, message: 'Word accepted!', guessedWords });
  } catch (err) {
    console.error('Submit word failed:', err);
    res.status(500).json({ status: 'error', message: 'Word submission failed' });
  }
});


app.use(router);
const port = process.env.WEBBIT_PORT || 3000;
const server = createServer(app);
server.on('error', (err) => console.error(`server error; ${err.stack}`));
server.listen(port, () => console.log(`Server running at http://localhost:${port}`));
