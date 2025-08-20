import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/mongoose';
import Habit from '@/models/Habit';
import User from '@/models/User';

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

    // Transform targetCount to target for API compatibility
    const transformedHabits = habits.map(habit => {
      const habitObj = habit.toObject();
      return {
        ...habitObj,
        target: habitObj.targetCount,
        targetCount: undefined // Remove the original field
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

    // Transform targetCount to target for API compatibility
    const habitObj = habit.toObject();
    const transformedHabit = {
      ...habitObj,
      target: habitObj.targetCount,
      targetCount: undefined // Remove the original field
    };

    return NextResponse.json({ habit: transformedHabit }, { status: 201 });
  } catch (error) {
    console.error('Create habit error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
