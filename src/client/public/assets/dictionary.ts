export async function GetDictionaryResponse(): Promise<string[]> {
  try {
    const response = await fetch('dict.json');
    const text = await response.text();
    console.log(text);
    const dictionary = text.split('\n').filter((word) => word.length >= 4);
    return dictionary;
    // Fallback dictionary if external fetch fails
  } catch (error) {
    const fallbackDictionary = ['apple', 'banana', 'cherry', 'date', 'elderberry']; 
    return fallbackDictionary;
  }
}
