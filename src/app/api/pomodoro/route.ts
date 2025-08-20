import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/mongoose';
import PomodoroSession from '@/models/PomodoroSession';
import User from '@/models/User';

// Get all Pomodoro sessions for user
export async function GET(request: NextRequest) {
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
    const type = searchParams.get('type');

    const query: {
      userId: string;
      date?: { $gte: string; $lte: string };
      sessionType?: string;
    } = {
      userId: user._id.toString(),
    };

    if (startDate && endDate) {
      query.date = {
        $gte: startDate,
        $lte: endDate,
      };
    }

    if (type) {
      query.sessionType = type;
    }

    const sessions = await PomodoroSession.find(query)
      .sort({ createdAt: -1 });

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('Get Pomodoro sessions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Create new Pomodoro session
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

    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const sessionData = await request.json();
    const today = new Date().toISOString().split('T')[0];

    const session = new PomodoroSession({
      ...sessionData,
      userId: user._id,
      date: today,
    });

    await session.save();

    return NextResponse.json({ session }, { status: 201 });
  } catch (error) {
    console.error('Create Pomodoro session error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
