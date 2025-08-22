import { connectToDatabase } from '@/lib/mongoose';
import Habit from '@/models/Habit';
import HabitCompletion from '@/models/HabitCompletion';

/**
 * Check if a habit should be reset for today based on its last completion
 * and frequency settings
 */
export function shouldResetHabit(lastCompletedAt: Date | null, frequency: string): boolean {
  if (!lastCompletedAt) return false;
  
  const now = new Date();
  const lastCompleted = new Date(lastCompletedAt);
  
  switch (frequency) {
    case 'daily':
      // Reset if last completion was not today
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const completionDate = new Date(lastCompleted.getFullYear(), lastCompleted.getMonth(), lastCompleted.getDate());
      return completionDate < today;
      
    case 'weekly':
      // Reset if last completion was not this week (Monday to Sunday)
      const thisWeekStart = new Date(now);
      thisWeekStart.setDate(now.getDate() - now.getDay() + 1); // Monday of current week
      thisWeekStart.setHours(0, 0, 0, 0);
      return lastCompleted < thisWeekStart;
      
    case 'monthly':
      // Reset if last completion was not this month
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      return lastCompleted < thisMonthStart;
      
    default:
      return false;
  }
}

/**
 * Reset completedToday status for habits that should be reset
 * This should be called when the user loads the habits page or when a new day is detected
 */
export async function resetDailyHabits(clerkUserId: string): Promise<void> {
  try {
    await connectToDatabase();
    
    // First find the user by Clerk ID to get MongoDB ObjectId
    const User = (await import('@/models/User')).default;
    const user = await User.findOne({ clerkId: clerkUserId });
    
    if (!user) {
      console.warn(`User not found for Clerk ID: ${clerkUserId}`);
      return;
    }
    
    // Find all active habits for the user that are marked as completed
    const habits = await Habit.find({
      userId: user._id,
      isActive: true,
      completedToday: true,
      lastCompletedAt: { $exists: true, $ne: null }
    });

    const habitsToReset: string[] = [];
    
    for (const habit of habits) {
      if (shouldResetHabit(habit.lastCompletedAt, habit.frequency)) {
        habitsToReset.push(habit._id.toString());
      }
    }

    if (habitsToReset.length > 0) {
      // Bulk update to reset completedToday status
      await Habit.updateMany(
        { _id: { $in: habitsToReset } },
        { 
          $set: { 
            completedToday: false 
          }
        }
      );
      
      console.log(`Reset ${habitsToReset.length} habits for user ${clerkUserId}`);
    }
  } catch (error) {
    console.error('Error resetting daily habits:', error);
    // Don't throw error to prevent breaking the main flow
  }
}

/**
 * Calculate current streak based on actual completions
 * This ensures streak accuracy after daily resets
 */
export async function recalculateStreak(habitId: string, userId: string, frequency: string): Promise<number> {
  try {
    await connectToDatabase();
    
    const completions = await HabitCompletion.find({
      habitId: habitId,
      userId: userId
    }).sort({ date: -1 }).limit(100); // Get last 100 completions for efficiency

    if (completions.length === 0) return 0;

    let currentStreak = 0;
    const today = new Date();
    
    // Check each completion to see if it fits the expected streak pattern
    for (let i = 0; i < completions.length; i++) {
      const completion = completions[i];
      const completionDate = new Date(completion.date);
      
      // Calculate what date we expect for this streak position
      const expectedDate = new Date(today);
      switch (frequency) {
        case 'daily':
          expectedDate.setDate(today.getDate() - i);
          break;
        case 'weekly':
          expectedDate.setDate(today.getDate() - (i * 7));
          break;
        case 'monthly':
          expectedDate.setMonth(today.getMonth() - i);
          break;
      }
      
      const expectedDateStr = expectedDate.toISOString().split('T')[0];
      const completionDateStr = completionDate.toISOString().split('T')[0];
      
      if (completionDateStr === expectedDateStr) {
        currentStreak++;
      } else {
        // Gap in streak, stop counting
        break;
      }
    }
    
    return currentStreak;
  } catch (error) {
    console.error('Error recalculating streak:', error);
    return 0;
  }
}

/**
 * Get today's date in YYYY-MM-DD format
 * Useful for consistent date comparisons
 */
export function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(date1: Date | string, date2: Date | string): boolean {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
  
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
}

/**
 * Check if it's a new day since the last check
 * This can be used in the frontend to detect day changes
 */
export function isNewDay(lastCheckDate: Date | string | null): boolean {
  if (!lastCheckDate) return true;
  
  const now = new Date();
  const lastCheck = typeof lastCheckDate === 'string' ? new Date(lastCheckDate) : lastCheckDate;
  
  return !isSameDay(now, lastCheck);
}
