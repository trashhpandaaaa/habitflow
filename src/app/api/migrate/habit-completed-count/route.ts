import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/mongoose';
import Habit from '@/models/Habit';
import HabitCompletion from '@/models/HabitCompletion';
import User from '@/models/User';

export async function POST() {
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

    // Get all habits for this user
    const habits = await Habit.find({ userId: user._id });
    
    const updates = [];
    
    for (const habit of habits) {
      // Count actual completions for this habit
      const completionCount = await HabitCompletion.countDocuments({
        habitId: habit._id,
        userId: userId // Use Clerk userId for completions
      });
      
      // Update the habit with correct completedCount
      await Habit.findByIdAndUpdate(habit._id, {
        completedCount: completionCount
      });
      
      updates.push({
        habitId: habit._id.toString(),
        habitName: habit.name,
        oldCompletedCount: habit.completedCount || 0,
        newCompletedCount: completionCount
      });
    }

    return NextResponse.json({
      message: 'Successfully updated completed counts for habits',
      updates,
      totalHabitsUpdated: updates.length
    });
    
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
