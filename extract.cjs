const fs = require('fs');
const path = require('path');

const filePath = path.resolve('./dict.txt');

// Read the existing words
const text = fs.readFileSync(filePath, 'utf-8');
const words = text
  .split(/\r?\n/)
  .map(word => word.toLowerCase())
  .filter(word => /^[a-z]+$/.test(word) && word.length >= 4); // only letters, length >= 4

// Save cleaned words back to dict.txt
fs.writeFileSync(filePath, words.join('\n'), 'utf-8');

// Also save as JSON
const jsonPath = path.resolve('./dict.json');
fs.writeFileSync(jsonPath, JSON.stringify(words, null, 2), 'utf-8');

console.log(`Filtered dict.txt to ${words.length} words (letters only, min 4 chars).`);
console.log(`Saved JSON version to dict.json.`);
