import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { resetDailyHabits } from '@/lib/daily-reset';

// Check and reset daily habits
export async function POST() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await resetDailyHabits(userId);

    return NextResponse.json({ 
      message: 'Daily habits checked and reset if needed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Daily reset error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
