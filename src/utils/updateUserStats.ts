import { doc, updateDoc, increment, getDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";

/**
 * Update user rating in Firestore
 * @param userId - User's Firebase UID
 * @param ratingChange - Amount to add/subtract from rating (can be negative)
 */

export async function updateUserRating(
  userId: string,
  ratingChange: number
): Promise<void> {
  try {
    const userDocRef = doc(db, "users", userId);
    await updateDoc(userDocRef, {
      rating: increment(ratingChange),
    });
    console.log(`User rating updated by ${ratingChange}`);
  } catch (error) {
    console.error("Error updating user rating:", error);
    throw error;
  }
}

/**
 * Increment questions solved count
 * @param userId - User's Firebase UID
 * @param count - Number of questions to add (default: 1)
 */
export async function incrementQuestionsSolved(
  userId: string,
  count: number = 1
): Promise<void> {
  try {
    const userDocRef = doc(db, "users", userId);
    await updateDoc(userDocRef, {
      questionsSolved: increment(count),
    });
    console.log(`Questions solved incremented by ${count}`);
  } catch (error) {
    console.error("Error incrementing questions solved:", error);
    throw error;
  }
}

/**
 * Update both rating and questions solved at once
 * @param userId - User's Firebase UID
 * @param ratingChange - Amount to add/subtract from rating
 * @param questionsCount - Number of questions to add (default: 1)
 */
export async function updateUserProgress(
  userId: string,
  ratingChange: number,
  questionsCount: number = 1
): Promise<void> {
  try {
    const userDocRef = doc(db, "users", userId);
    await updateDoc(userDocRef, {
      rating: increment(ratingChange),
      questionsSolved: increment(questionsCount),
    });
    console.log(`User progress updated: +${ratingChange} rating, +${questionsCount} questions`);
  } catch (error) {
    console.error("Error updating user progress:", error);
    throw error;
  }
}

/**
 * Set rating and questions solved to specific values (not increment)
 * @param userId - User's Firebase UID
 * @param rating - Exact rating value to set
 * @param questionsSolved - Exact questions solved count to set
 */
export async function setUserStats(
  userId: string,
  rating: number,
  questionsSolved: number
): Promise<void> {
  try {
    const userDocRef = doc(db, "users", userId);
    await updateDoc(userDocRef, {
      rating,
      questionsSolved,
    });
    console.log(`User stats set to: ${rating} rating, ${questionsSolved} questions`);
  } catch (error) {
    console.error("Error setting user stats:", error);
    throw error;
  }
}

/**
 * Get user statistics (rating and questions solved)
 * @param userId - User's Firebase UID
 * @returns Object with rating and questionsSolved
 */
export async function getUserStats(
  userId: string
): Promise<{ rating: number; questionsSolved: number }> {
  try {
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const data = userDoc.data();
      return {
        rating: data.rating || 0,
        questionsSolved: data.questionsSolved || 0,
      };
    } else {
      return { rating: 0, questionsSolved: 0 };
    }
  } catch (error) {
    console.error("Error getting user stats:", error);
    throw error;
  }
}
