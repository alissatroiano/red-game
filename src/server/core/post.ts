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

  return await reddit.submitCustomPost({
    splash: {
      appDisplayName: 'Vocable',
    },
    subredditName: subredditName,
    title: 'Vocable',
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
      context.ui.showToast('Failed to create post: ' + (e instanceof Error ? e.message : 'Unknown error'));
    }
  },
});
