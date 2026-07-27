// Curated starter set for the "Add habit" template gallery. Name + emoji +
// a suggested daily target — not tied to any external data source.
export const HABIT_CATEGORIES = ['Health', 'Fitness', 'Mind', 'Productivity', 'Home', 'Other'];

export const HABIT_PRESETS = {
  Health: [
    { name: 'Drink water', emoji: '💧', target_count: 8 },
    { name: 'Take vitamins', emoji: '💊', target_count: 1 },
    { name: 'Sleep routine', emoji: '😴', target_count: 1 },
    { name: 'No sugar', emoji: '🚫', target_count: 1 },
    { name: 'Eat a vegetable', emoji: '🥦', target_count: 1 },
  ],
  Fitness: [
    { name: 'Workout', emoji: '🏋️', target_count: 1 },
    { name: 'Walk 10k steps', emoji: '🚶', target_count: 1 },
    { name: 'Stretch', emoji: '🤸', target_count: 1 },
    { name: 'Run', emoji: '🏃', target_count: 1 },
    { name: 'Yoga', emoji: '🧘', target_count: 1 },
  ],
  Mind: [
    { name: 'Meditate', emoji: '🧘‍♂️', target_count: 1 },
    { name: 'Journal', emoji: '📓', target_count: 1 },
    { name: 'Read', emoji: '📖', target_count: 1 },
    { name: 'Gratitude list', emoji: '🙏', target_count: 1 },
    { name: 'No phone before bed', emoji: '📵', target_count: 1 },
  ],
  Productivity: [
    { name: 'Plan the day', emoji: '🗓️', target_count: 1 },
    { name: 'Inbox zero', emoji: '📥', target_count: 1 },
    { name: 'Deep work session', emoji: '🎯', target_count: 1 },
    { name: 'No social media', emoji: '📴', target_count: 1 },
    { name: 'Review goals', emoji: '✅', target_count: 1 },
  ],
  Home: [
    { name: 'Make the bed', emoji: '🛏️', target_count: 1 },
    { name: 'Tidy up', emoji: '🧹', target_count: 1 },
    { name: 'Do the dishes', emoji: '🍽️', target_count: 1 },
    { name: 'Water plants', emoji: '🪴', target_count: 1 },
    { name: 'Laundry', emoji: '🧺', target_count: 1 },
  ],
  Other: [
    { name: 'Call family', emoji: '📞', target_count: 1 },
    { name: 'Learn something new', emoji: '🧠', target_count: 1 },
    { name: 'Practice instrument', emoji: '🎸', target_count: 1 },
    { name: 'Save money', emoji: '💰', target_count: 1 },
    { name: 'Random act of kindness', emoji: '💛', target_count: 1 },
  ],
};

export const HABIT_ACCENT_COLORS = ['#30d158', '#64d2ff', '#ff9f0a', '#ff375f', '#bf5af2', '#ffd60a'];

export const HABIT_EMOJI_CHOICES = [
  '✅', '💧', '🏋️', '📖', '😴', '🧘', '🚶', '🍽️', '🧹', '💰',
  '📵', '🙏', '🎸', '🪴', '🧺', '📓', '🎯', '🏃', '🚫', '🥦',
];
