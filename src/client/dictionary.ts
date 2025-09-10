export async function getDictionary() {
  // Fetch from a free dictionary API
  try {
    const response = await fetch('https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt');
    const text = await response.text();
    const dictionary = text.split('\n').filter(word => word.length >= 4);
    return dictionary;
  } catch (error) {
    // Fallback dictionary if external fetch fails
    const fallbackDictionary = [
      "able", "about", "above", "across", "after", "again", "against", "also", "always", "another",
      "back", "because", "been", "before", "being", "below", "between", "both", "came", "come",
      "could", "does", "each", "even", "every", "first", "from", "give", "good", "great",
      "hand", "have", "here", "home", "house", "just", "keep", "know", "large", "last",
      "left", "life", "like", "line", "live", "long", "look", "made", "make", "many",
      "most", "move", "much", "must", "name", "need", "never", "next", "night", "only",
      "open", "other", "over", "part", "place", "point", "right", "said", "same", "seem",
      "show", "side", "small", "some", "such", "take", "than", "that", "them", "then",
      "there", "these", "they", "thing", "think", "this", "those", "three", "time", "turn",
      "under", "until", "very", "want", "water", "well", "went", "were", "what", "when",
      "where", "which", "while", "will", "with", "word", "work", "world", "would", "write",
      "year", "your", "collapse", "palace", "pale", "pole", "scope", "cape", "pace", "place",
      "space", "lapse", "clasp", "scale", "peace", "lease", "please", "escape", "special"
    ];
    return fallbackDictionary;
  }
}