# Vocable

### A Daily Reddit Word Game

## Inspiration

Vocable was inspired by The New York Times Spelling Bee, a daily word puzzle that presents players with a hexagonal grid of 7 letters arrayed in a honeycomb structure.The player scores points by using the 7 letters to form words consisting of four or more letters. However, any words proposed by the player **must** include the letter at the center of the honeycomb.

The Spelling Bee points system works as follows:

- You get one point for each letter in the word, except four letter words only score 1 point.
- Scoring points leads to progressively higher praise for the player's effort, such as "Solid", "Amazing", and "Genius".
- Each puzzle is guaranteed to have at least one pangram, a word containing at least one of each of the seven letters
- Pangrams award 7 extra points (e.g. a seven-letter pangram scores 14 points).
- Without a New York Times subscription, you can play the Spelling Bee for free up to the rank of "Solid" or a percentage of the total points, which is typically 15%.

I have always been a fan of word games and brain teasers like these, so I find it disappointing that Spelling Bee stops accepting words once you reach the "Solid" rank (especially considering the cut-off happens whenever I feel like I'm on a roll). I understand this is a good way to get people to subscribe to - and pay for - a New York Time Games Subscription, but it's frustrating nonetheless.

In fact, playing Spelling Bee while warming up (walking a mile before jogging) and running into this issue is precisely what inspired me to build Vocable for Reddit. 

## What it does

Vocable provides the Spelling Bee game experience for Reddit users. 

## Getting Started

> Make sure you have Node 22 downloaded on your machine before running!

1. Run `npm create devvit@latest --template=phaser`
2. Go through the installation wizard. You will need to create a Reddit account and connect it to Reddit developers
3. Copy the command on the success page into your terminal

## Commands

- `npm run dev`: Starts a development server where you can develop your application live on Reddit.
- `npm run build`: Builds your client and server projects
- `npm run deploy`: Uploads a new version of your app
- `npm run launch`: Publishes your app for review
- `npm run login`: Logs your CLI into Reddit
- `npm run check`: Type checks, lints, and prettifies your app

## Cursor Integration

This template comes with a pre-configured cursor environment. To get started, [download cursor](https://www.cursor.com/downloads) and enable the `devvit-mcp` when prompted.

## Credits

Thanks to the Phaser team for [providing a great template](https://github.com/phaserjs/template-vite-ts)!
