const fs = require('fs');
const path = require('path');

const filePath = path.resolve('./words.txt');

// Read the existing words
const text = fs.readFileSync(filePath, 'utf-8');
const words = text
  .split(/\r?\n/)
  .map(word => word.toLowerCase())
  .filter(word => /^[a-z]+$/.test(word) && word.length >= 4); // only letters, length >= 4

// Save cleaned words back to words.txt
fs.writeFileSync(filePath, words.join('\n'), 'utf-8');

console.log(`Filtered words.txt to ${words.length} words (letters only, min 4 chars).`);
