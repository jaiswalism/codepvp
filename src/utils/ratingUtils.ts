/**
 * Get rating level based on rating points
 * Beginner: 200-399
 * Medium: 400-599
 * Advanced: 600-799
 * Expert: 800+
 */
export function getRatingLevel(rating: number = 200): {
  level: string;
  color: string;
  nextLevel: string;
  pointsToNext: number;
  currentLevelMin: number;
  currentLevelMax: number;
} {
  if (rating < 400) {
    return {
      level: 'Beginner',
      color: 'text-green-400',
      nextLevel: 'Medium',
      pointsToNext: 400 - rating,
      currentLevelMin: 200,
      currentLevelMax: 399,
    };
  } else if (rating < 600) {
    return {
      level: 'Medium',
      color: 'text-blue-400',
      nextLevel: 'Advanced',
      pointsToNext: 600 - rating,
      currentLevelMin: 400,
      currentLevelMax: 599,
    };
  } else if (rating < 800) {
    return {
      level: 'Advanced',
      color: 'text-purple-400',
      nextLevel: 'Expert',
      pointsToNext: 800 - rating,
      currentLevelMin: 600,
      currentLevelMax: 799,
    };
  } else {
    return {
      level: 'Expert',
      color: 'text-orange-400',
      nextLevel: 'Master',
      pointsToNext: Math.max(0, 1000 - rating),
      currentLevelMin: 800,
      currentLevelMax: 999,
    };
  }
}

/**
 * Get progress percentage within current level
 */
export function getRatingProgress(rating: number = 0): number {
  const { currentLevelMin, currentLevelMax } = getRatingLevel(rating);
  const levelRange = currentLevelMax - currentLevelMin + 1;
  const progress = rating - currentLevelMin;
  return Math.min(100, Math.round((progress / levelRange) * 100));
}
