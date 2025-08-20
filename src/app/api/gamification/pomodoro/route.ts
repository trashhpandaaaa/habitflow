import { NextRequest, NextResponse } from 'next/server';
import { GamificationManager } from '@/lib/gamification-manager';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { sessionType, duration } = await request.json();
    
    // Only work sessions count towards evolution (25 minutes standard)
    if (sessionType === 'work' && duration >= 20) {
      const evolutionRewards = await GamificationManager.handlePomodoroCompletion(userId, 1);
      
      return NextResponse.json({
        success: true,
        message: 'Pomodoro session completed',
        evolutionRewards
      });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Pomodoro session completed',
      evolutionRewards: []
    });
    
  } catch (error) {
    console.error('Error handling Pomodoro evolution:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
