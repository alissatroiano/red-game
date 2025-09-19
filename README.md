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
The game's programming makes it so a new puzzle will post at midnight every day using UTC. That way, the new puzzle is posted  based on each user's timezone.

## How I built it

1. Used Devvit Web's Phaser.js template to get acquainted with devvit's client/server/shared environment
2. Started playing around with 'Spelling Bee' concept, using Amazon Q to provide occasional refactoring and bug fixes
3. Created my own scoring system and left out the Pangram, as to not completely copy Spelling Bee (my JavaScript scoring system is more similar to Scrabble, placing a higher value on less common letters, like Z, Y, V, X)
4. Used Redis & custom JavaScript to make each user's game persist throughout the day. That way, if the user needs a break or to step away, their score and the words they've already guessed will still be there when they return (even if they close Reddit entirely). 
5. Made it so the user's game data for each stay is tied to a postID, but the data resets at midnight UTC every night - so, the game will always work - even without a new automated post.

## Challenges I Ran into

### Persisting Data

I had a hard time getting the user's score to persist at first, and then I figured out that server/index.ts is connected to shared/types/api.ts. Once I understood the backend configuration I was able to make a better game.

## Accomplishments

## What I learned

## What's next for Vocable

## Credits

- [The New York Times Spelling Bee](https://www.nytimes.com/puzzles/spelling-bee)
- [Amazon Q](https://aws.amazon.com/q/)
- 