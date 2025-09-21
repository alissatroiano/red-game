// Test script to verify daily letter generation
function generateDailyLetters(date) {
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

  const outerLetters = [];
  let attempts = 0;
  
  // Ensure at least 2 vowels total
  const centerIsVowel = vowels.includes(centerLetter);
  const vowelsNeeded = centerIsVowel ? 1 : 2;
  let vowelsAdded = 0;
  
  while (outerLetters.length < 6 && attempts < 100) {
    attempts++;
    let letter;
    
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

// Test different dates
const testDates = [
  '2025-09-20', // Yesterday
  '2025-09-21', // Today
  '2025-09-22', // Tomorrow
  '2025-09-19', // Day before yesterday
  '2025-01-15', // Random past date
];

console.log('Testing daily letter generation:');
testDates.forEach(date => {
  const result = generateDailyLetters(date);
  console.log(`${date}: Center=${result.centerLetter.toUpperCase()}, Outer=[${result.outerLetters.map(l => l.toUpperCase()).join(', ')}]`);
});

// Test consistency - same date should always produce same letters
console.log('\nTesting consistency (same date multiple times):');
const testDate = '2025-09-21';
for (let i = 0; i < 3; i++) {
  const result = generateDailyLetters(testDate);
  console.log(`${testDate} (test ${i+1}): Center=${result.centerLetter.toUpperCase()}, Outer=[${result.outerLetters.map(l => l.toUpperCase()).join(', ')}]`);
}