import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/mongoose';
import Habit from '@/models/Habit';
import User from '@/models/User';
import { GamificationManager } from '@/lib/gamification-manager';
import connectDB from '@/lib/mongodb';

// Get all habits for user
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

    // Find or create user
    let user = await User.findOne({ clerkId: userId });
    if (!user) {
      user = await User.create({
        clerkId: userId,
        email: '', // Will be updated by webhook
        name: 'User', // Will be updated by webhook
        settings: {
          darkMode: false,
          notifications: true,
          reminderTime: '09:00'
        }
      });
    }

    const habits = await Habit.find({ userId: user._id })
      .sort({ createdAt: -1 });

    // Transform habits to include all necessary fields for the frontend
    const transformedHabits = habits.map(habit => {
      const habitObj = habit.toObject();
      return {
        ...habitObj,
        target: habitObj.targetCount, // Frontend expects 'target' field
        // Keep all other fields from the model
        completedCount: habitObj.completedCount || 0,
        currentStreak: habitObj.currentStreak || 0,
        bestStreak: habitObj.bestStreak || 0,
        completedToday: habitObj.completedToday || false,
        lastCompletedAt: habitObj.lastCompletedAt || null,
      };
    });

    return NextResponse.json({ habits: transformedHabits });
  } catch (error) {
    console.error('Get habits error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Create new habit
export async function POST(request: NextRequest) {
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

    const habitData = await request.json();
    const { name, description, category, frequency, target } = habitData;

    if (!name || !category || !frequency) {
      return NextResponse.json(
        { error: 'Missing required fields: name, category, frequency' },
        { status: 400 }
      );
    }

    const habit = new Habit({
      userId: user._id,
      name,
      description: description || '',
      category,
      frequency,
      targetCount: target || 1,
    });

    await habit.save();

    // Check if this is the user's first habit and give reward
    let firstHabitReward = null;
    try {
      await connectDB();
      const habitsCount = await Habit.countDocuments({ userId: user._id });
      
      if (habitsCount === 1) { // This is their first habit
        firstHabitReward = await GamificationManager.handleFirstHabit(userId);
      }
    } catch (gamificationError) {
      console.error('Error handling first habit reward:', gamificationError);
      // Don't fail the habit creation if gamification fails
    }

    // Transform targetCount to target for API compatibility
    const habitObj = habit.toObject();
    const transformedHabit = {
      ...habitObj,
      target: habitObj.targetCount,
      targetCount: undefined // Remove the original field
    };

    const responseData: { habit: object; firstHabitReward?: object } = { habit: transformedHabit };
    
    if (firstHabitReward) {
      responseData.firstHabitReward = {
        pokemon: firstHabitReward.pokemon,
        isNewReward: firstHabitReward.isNewReward,
        experienceGained: firstHabitReward.experienceGained,
        levelUp: firstHabitReward.levelUp,
        newLevel: firstHabitReward.newLevel,
        achievement: firstHabitReward.achievement,
        message: `Congratulations on your first habit! You received ${firstHabitReward.pokemon.name}!`
      };
    }

    return NextResponse.json(responseData, { status: 201 });
  } catch (error) {
    console.error('Create habit error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
