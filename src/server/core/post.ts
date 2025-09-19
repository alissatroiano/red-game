import { context, reddit } from '@devvit/web/server';
import { Devvit } from '@devvit/public-api';

Devvit.configure({
  redditAPI: true,
});

export const createPost = async () => {
  const { subredditName } = context;
  if (!subredditName) {
    throw new Error('subredditName is required');
  }

  const formattedDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return await reddit.submitCustomPost({
    splash: {
      appDisplayName: 'Vocable',
    },
    subredditName: subredditName,
    title: `Vocable - ${formattedDate}`,
  });
};

Devvit.addMenuItem({
  label: 'Play Vocable',
  location: 'subreddit',
  onPress: async (_, context) => {
    try {
      await createPost();
      context.ui.showToast('Game created successfully!');
    } catch (e) {
      context.ui.showToast(
        'Failed to create post: ' + (e instanceof Error ? e.message : 'Unknown error')
      );
    }
  },
});
