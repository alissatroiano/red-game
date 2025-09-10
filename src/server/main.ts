import express from 'express';
import { getDictionary } from './dictionary.js';

const app = express();

app.get('/api/dictionary', async (req, res) => {
  try {
    const dictionary = await getDictionary();
    res.json(dictionary);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load dictionary' });
  }
});

export default app;