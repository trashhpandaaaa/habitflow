import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/mongoose';
import Habit from '@/models/Habit';
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

    // Get habits with their actual data
    const habits = await Habit.find({ userId: user._id });
    
    const habitData = habits.map(habit => ({
      id: habit._id.toString(),
      name: habit.name,
      completedCount: habit.completedCount || 0,
      targetCount: habit.targetCount || 1,
      progressPercentage: Math.min(((habit.completedCount || 0) / (habit.targetCount || 1)) * 100, 100),
      completedToday: habit.completedToday || false,
      currentStreak: habit.currentStreak || 0
    }));

    return NextResponse.json({
      message: 'Habit progress data',
      habits: habitData,
      totalHabits: habits.length
    });
    
  } catch (error) {
    console.error('Test endpoint error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
