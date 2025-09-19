# Vocable

### A Daily Reddit Word Game

## Inspiration

Vocable was inspired by [The New York Times Spelling Bee](https://www.nytimes.com/puzzles/spelling-bee), a daily word puzzle that presents players with a hexagonal grid of 7 letters arrayed in a honeycomb structure. The player scores points by using the 7 letters to form words consisting of four or more letters. However, any words proposed by the player **must** include the letter at the center of the honeycomb.

The Spelling Bee points system works as follows:

- You get one point for each letter in the word, except four letter words only score 1 point.
- Scoring points leads to progressively higher praise for the player's effort, such as "Solid", "Amazing", and "Genius".
- Each puzzle is guaranteed to have at least one pangram, a word containing at least one of each of the seven letters
- Pangrams award 7 extra points (e.g. a seven-letter pangram scores 14 points).
- Without a New York Times subscription, you can play the Spelling Bee for free up to the rank of "Solid" or a percentage of the total points, which is typically 15%.

I have always been a fan of word games and brain teasers like these, so I find it disappointing that Spelling Bee stops accepting words once you reach the "Solid" rank (especially considering the cut-off happens whenever I feel like I'm on a roll). I understand this is a good way to get people to subscribe to - and pay for - a New York Time Games Subscription, but it's frustrating nonetheless.

In fact, playing Spelling Bee while warming up (walking a mile before jogging) and running into this issue is precisely what inspired me to build Vocable for Reddit. 

## What it does

Vocable provides a similar experience to Spelling Bee, but it's tailored for Reddit users.
The game generates a new puzzle each day based on UTC time, ensuring all players worldwide get the same 7 letters on any given calendar day. Like The New York Times Wordle, the puzzle changes at midnight UTC when the date advances globally.

Vocable uses Devvit Web's server capabilities to automatically post new puzzles daily via cron jobs, store persistent game data with Redis, and validate words against a comprehensive dictionary.

### Vocable's Unique Scoring System

Unlike Spelling Bee's simple letter-count system, Vocable uses a Scrabble-inspired scoring approach:

- **Base Points**: Each word earns points equal to its length (4-letter word = 4 points)
- **Rare Letter Bonus**: Words containing V, W, X, Y, or Z earn +2 bonus points per rare letter
- **Pangram Bonus**: Words using all 7 letters earn +7 bonus points
- **No Paywall**: Unlike Spelling Bee, you can play unlimited games without subscription limits
- **Persistent Progress**: Your daily progress saves automatically and persists even if you close Reddit 

## How I built it

1. **Devvit Web Framework**: Used Devvit Web's Phaser.js template to get acquainted with Devvit Web's `client/` `server/` `shared/` environment
2. **Game Logic Development**: Started playing around with 'Spelling Bee' concept, using Amazon Q to provide occasional refactoring and bug fixes
3. **Custom Scoring System**: Created my own scoring system that rewards rare letters like Scrabble (V, W, X, Y, Z get bonus points) while still including pangrams for extra challenge
4. **Data Persistence**: Used Redis & custom JavaScript to make each user's game persist throughout the day. That way, if the user needs a break or to step away, their score and the words they've already guessed will still be there when they return (even if they close Reddit entirely)
5. **Daily Reset Logic**: Used Devvit Web tools, including Redis, to tie each user's daily game data to the calendar date, making sure scores reset automatically when the date changes while letters remain consistent per post
6. **Seeded Random Generation**: Implemented deterministic daily puzzles using date-based seeding (YYYY-MM-DD format) to ensure all players get identical letter combinations on the same calendar day, regardless of timezone
7. **Interactive UI**: Built a responsive hexagonal letter layout with Phaser.js, including shuffle functionality and mobile-optimized touch controls
8. **Dictionary Integration**: Integrated a comprehensive word dictionary with API endpoints for word validation and scoring

## Challenges I Ran into

### Persisting Data

I had a hard time getting the user's score to persist at first, and then I figured out that server/index.ts is connected to shared/types/api.ts. Once I understood the backend configuration I was able to make a better game.

### TypeScript Error Handling

Fixed multiple undefined value errors by adding proper fallback values throughout the codebase, ensuring robust error handling for missing context properties.

### Date-Based Scoring System

Transitioned from post-based to date-based scoring keys to ensure daily score resets while maintaining consistent letter sets per post for replay functionality.

## Accomplishments

- Getting the game to post automatically every day at midnight UTC using scheduler in devvit.json and writing a custom cron job in `server/index.ts`
- Figuring out how to get score data and words already guessed to persist across sessions on my own, making a true daily game experience.

## What I learned

- **Devvit Web Architecture**: Understanding the client/server/shared structure and how components communicate through API endpoints
- **Redis Data Management**: How to implement persistent user data that survives session changes and app restarts
- **Game State Synchronization**: Balancing client-side interactivity with server-side data persistence for seamless user experience
- **Mobile-First Design**: Creating touch-friendly interfaces that work across different screen sizes and input methods
- **Deterministic Random Generation**: Using date-based seeding to ensure all players get identical daily puzzles
- **AI-Assisted Development**: Leveraging Amazon Q for code refactoring, debugging, and implementing complex features efficiently

## What's next for Vocable

- **Leaderboards**: Daily and weekly scoring competitions between Reddit users
- **Achievement System**: Badges for finding pangrams, high scores, and consecutive daily play streaks
- **Hint System**: Optional clues for stuck players without breaking the challenge
- **Word Statistics**: Show players which words they missed at the end of each day
- **Custom Difficulty**: Allow subreddit moderators to adjust letter rarity and dictionary size
- **Social Features**: Share daily scores and compete with friends through Reddit comments

## Credits

- [The New York Times Spelling Bee](https://www.nytimes.com/puzzles/spelling-bee)
- [Amazon Q](https://aws.amazon.com/q/)
- [Devvit Web](https://developers.reddit.com/docs/capabilities/devvit-web/devvit_web_overview)
- [Dictionary Words](raw.githubusercontent.com/sindresorhus/word-list/refs/heads/main/words.txt)