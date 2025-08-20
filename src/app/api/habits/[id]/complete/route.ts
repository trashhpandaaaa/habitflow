import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/mongoose';
import HabitCompletion from '@/models/HabitCompletion';
import Habit from '@/models/Habit';
import User from '@/models/User';
import { GamificationManager, RewardResult } from '@/lib/gamification-manager';
import mongoose from 'mongoose';

// Toggle habit completion
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const resolvedParams = await params;
    const habitId = resolvedParams.id;
    const today = new Date().toISOString().split('T')[0];

    // Check if habit belongs to user
    const habit = await Habit.findOne({
      _id: habitId,
      userId: user._id,
    });

    if (!habit) {
      return NextResponse.json(
        { error: 'Habit not found' },
        { status: 404 }
      );
    }

    // Check if already completed today
    const existingCompletion = await HabitCompletion.findOne({
      habitId: new mongoose.Types.ObjectId(habitId),
      userId: userId, // Use Clerk userId instead of user._id
      date: today,
    });

    if (existingCompletion) {
      // Remove completion
      await HabitCompletion.deleteOne({ _id: existingCompletion._id });
      
      // Update habit stats
      const currentStreak = Math.max(0, (habit.currentStreak || 1) - 1);
      await Habit.findByIdAndUpdate(habitId, {
        currentStreak,
        completedToday: false,
      });

      return NextResponse.json({
        message: 'Habit completion removed',
        completed: false,
        currentStreak,
      });
    } else {
      // Add completion
      const completion = new HabitCompletion({
        habitId: new mongoose.Types.ObjectId(habitId),
        userId: userId, // Use Clerk userId instead of user._id
        date: today,
        completedAt: new Date(),
      });

      await completion.save();

      // Update habit stats
      const currentStreak = (habit.currentStreak || 0) + 1;
      const bestStreak = Math.max(habit.bestStreak || 0, currentStreak);

      const updatedHabit = await Habit.findByIdAndUpdate(habitId, {
        currentStreak,
        bestStreak,
        completedToday: true,
        lastCompletedAt: new Date(),
      }, { new: true });

      // Check for Pokemon rewards
      let pokemonRewards: RewardResult[] = [];
      try {
        pokemonRewards = await GamificationManager.checkAndAwardRewards(
          userId, 
          updatedHabit, 
          'daily'
        );
      } catch (gamificationError) {
        console.error('Gamification error:', gamificationError);
        // Don't fail the completion if gamification fails
      }

      return NextResponse.json({
        message: 'Habit marked as completed',
        completed: true,
        completion,
        currentStreak,
        pokemonRewards, // Include Pokemon rewards in the response
      });
    }
  } catch (error) {
    console.error('Toggle completion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get habit completions
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const resolvedParams = await params;
    const query: {
      habitId: mongoose.Types.ObjectId;
      userId: string;
      date?: { $gte: string; $lte: string };
    } = {
      habitId: new mongoose.Types.ObjectId(resolvedParams.id),
      userId: userId, // Use Clerk userId instead of user._id.toString()
    };

    if (startDate && endDate) {
      query.date = {
        $gte: startDate,
        $lte: endDate,
      };
    }

    const completions = await HabitCompletion.find(query)
      .sort({ date: -1 });

    return NextResponse.json({ completions });
  } catch (error) {
    console.error('Get completions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
