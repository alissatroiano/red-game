import express from 'express';

const app = express();
app.use(express.json());

// API endpoint to get a word definition
app.get('/api/define/:word', async (req, res) => {
  const { word } = req.params;

  // Replace with a real dictionary API. This is an example URL.
  // You would typically use an environment variable for your API key.
  const API_URL = `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`;

  try {
    const response = await fetch(API_URL);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching definition:', error);
    res.status(500).json({ error: 'Failed to fetch definition.' });
  }
});

export default app;
