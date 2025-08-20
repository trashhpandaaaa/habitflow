import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/mongoose';
import Habit from '@/models/Habit';
import HabitCompletion from '@/models/HabitCompletion';
import User from '@/models/User';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    // Find user
    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get all habits and their completion data
    const habits = await Habit.find({ userId: user._id });
    
    const habitData = [];
    
    for (const habit of habits) {
      // Count completions for this habit
      const completionsFromDB = await HabitCompletion.countDocuments({
        habitId: habit._id,
        userId: userId // Use Clerk userId for completions
      });
      
      // Get the habit's stored completedCount
      const storedCount = habit.completedCount || 0;
      
      habitData.push({
        habitId: habit._id.toString(),
        habitName: habit.name,
        targetCount: habit.targetCount || 1,
        storedCompletedCount: storedCount,
        actualCompletionsFromDB: completionsFromDB,
        completedToday: habit.completedToday || false,
        currentStreak: habit.currentStreak || 0,
        progressPercentage: Math.min(((completionsFromDB) / (habit.targetCount || 1)) * 100, 100)
      });
    }

    return NextResponse.json({
      userId,
      userDbId: user._id.toString(),
      habits: habitData,
      totalHabits: habits.length
    });
    
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
