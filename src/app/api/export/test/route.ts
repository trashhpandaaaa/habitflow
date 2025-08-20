import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import dbConnect from '@/lib/mongoose';
import Habit from '@/models/Habit';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Just get one habit to check the structure
    const habit = await Habit.findOne({ userId }).lean();
    
    return NextResponse.json({
      habit,
      habitKeys: habit ? Object.keys(habit) : [],
      habitId: habit?._id,
      habitIdType: typeof habit?._id,
    });

  } catch (error) {
    console.error('Test export error:', error);
    return NextResponse.json(
      { error: 'Failed to test export' },
      { status: 500 }
    );
  }
}
