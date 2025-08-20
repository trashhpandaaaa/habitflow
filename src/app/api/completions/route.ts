import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/mongoose';
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
    
    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const completions = await HabitCompletion.find({ 
      userId: userId  // Use Clerk userId instead of user._id
    })
    .populate('habitId', 'name category')
    .sort({ completedAt: -1 });

    return NextResponse.json({ completions });
  } catch (error) {
    console.error('Get completions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
