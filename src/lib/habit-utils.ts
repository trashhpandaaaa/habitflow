/**
 * Utility functions for habit management and reset logic
 */

import Habit from '@/models/Habit';
import { IHabit } from '@/models/Habit';

/**
 * Check if a habit should be reset based on its frequency and last completion date
 */
export function shouldResetHabit(habit: IHabit, currentDate: Date = new Date()): boolean {
  if (!habit.lastCompletedAt || !habit.completedToday) {
    return false;
  }

  const lastCompleted = new Date(habit.lastCompletedAt);
  const today = currentDate.toISOString().split('T')[0];
  const lastCompletedDate = lastCompleted.toISOString().split('T')[0];

  switch (habit.frequency) {
    case 'daily':
      // Reset if it's a new day
      return lastCompletedDate !== today;

    case 'weekly':
      // Reset if it's a new week (assuming week starts on Monday)
      const daysSinceMonday = (currentDate.getDay() + 6) % 7; // 0 = Monday, 1 = Tuesday, etc.
      const thisWeekStart = new Date(currentDate);
      thisWeekStart.setDate(currentDate.getDate() - daysSinceMonday);
      thisWeekStart.setHours(0, 0, 0, 0);
      return lastCompleted < thisWeekStart;

    case 'monthly':
      // Reset if it's a new month
      const thisMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      return lastCompleted < thisMonthStart;

    default:
      return false;
  }
}

/**
 * Check if a habit's streak should be broken due to missed days
 */
export function shouldBreakStreak(habit: IHabit, currentDate: Date = new Date()): boolean {
  if (!habit.lastCompletedAt || habit.currentStreak === 0) {
    return false;
  }

  const lastCompleted = new Date(habit.lastCompletedAt);
  const lastCompletedDate = lastCompleted.toISOString().split('T')[0];

  switch (habit.frequency) {
    case 'daily':
      // Break streak if last completion was before yesterday
      const yesterday = new Date(currentDate);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayDate = yesterday.toISOString().split('T')[0];
      return lastCompletedDate < yesterdayDate;

    case 'weekly':
      // Break streak if missed more than one week
      const oneWeekAgo = new Date(currentDate);
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      return lastCompleted < oneWeekAgo;

    case 'monthly':
      // Break streak if missed more than one month
      const oneMonthAgo = new Date(currentDate);
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      return lastCompleted < oneMonthAgo;

    default:
      return false;
  }
}

/**
 * Reset habits that need to be reset based on their frequency
 */
export async function resetHabitsForUser(userIds: string[]): Promise<void> {
  try {
    const habits = await Habit.find({ 
      userId: { $in: userIds },
      completedToday: true,
      isActive: true 
    });

    const habitsToReset: string[] = [];
    const habitsToBreakStreak: string[] = [];
    const currentDate = new Date();

    for (const habit of habits) {
      if (shouldResetHabit(habit, currentDate)) {
        habitsToReset.push(habit._id.toString());
      }

      if (shouldBreakStreak(habit, currentDate)) {
        habitsToBreakStreak.push(habit._id.toString());
      }
    }

    // Bulk update habits that need to be reset
    if (habitsToReset.length > 0) {
      await Habit.updateMany(
        { _id: { $in: habitsToReset } },
        { $set: { completedToday: false } }
      );
      console.log(`Reset ${habitsToReset.length} habits`);
    }

    // Bulk update habits that need streak broken
    if (habitsToBreakStreak.length > 0) {
      await Habit.updateMany(
        { _id: { $in: habitsToBreakStreak } },
        { $set: { currentStreak: 0 } }
      );
      console.log(`Broke streaks for ${habitsToBreakStreak.length} habits`);
    }

  } catch (error) {
    console.error('Error resetting habits:', error);
    throw error;
  }
}

/**
 * Get the next reset time for a habit based on its frequency
 */
export function getNextResetTime(habit: IHabit, currentDate: Date = new Date()): Date {
  const nextReset = new Date(currentDate);

  switch (habit.frequency) {
    case 'daily':
      // Next reset is tomorrow at midnight
      nextReset.setDate(nextReset.getDate() + 1);
      nextReset.setHours(0, 0, 0, 0);
      break;

    case 'weekly':
      // Next reset is next Monday at midnight
      const daysUntilMonday = (7 - nextReset.getDay() + 1) % 7 || 7;
      nextReset.setDate(nextReset.getDate() + daysUntilMonday);
      nextReset.setHours(0, 0, 0, 0);
      break;

    case 'monthly':
      // Next reset is first day of next month at midnight
      nextReset.setMonth(nextReset.getMonth() + 1, 1);
      nextReset.setHours(0, 0, 0, 0);
      break;
  }

  return nextReset;
}

/**
 * Calculate completion rate for a habit over a given period
 */
export function calculateCompletionRate(
  completions: number,
  totalDays: number,
  frequency: 'daily' | 'weekly' | 'monthly'
): number {
  let expectedCompletions: number;

  switch (frequency) {
    case 'daily':
      expectedCompletions = totalDays;
      break;
    case 'weekly':
      expectedCompletions = Math.ceil(totalDays / 7);
      break;
    case 'monthly':
      expectedCompletions = Math.ceil(totalDays / 30);
      break;
    default:
      expectedCompletions = totalDays;
  }

  return expectedCompletions > 0 ? Math.min(completions / expectedCompletions, 1) : 0;
}
