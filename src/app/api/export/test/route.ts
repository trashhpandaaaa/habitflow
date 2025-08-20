import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import dbConnect from '@/lib/mongoose';
import Habit from '@/models/Habit';
import mongoose from 'mongoose';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Just get one habit to check the structure
    const habit = await Habit.findOne({ userId }).lean();
    
    // Type assertion for the _id field
    const habitWithId = habit as { _id?: mongoose.Types.ObjectId; [key: string]: unknown } | null;
    
    return NextResponse.json({
      habit,
      habitKeys: habit ? Object.keys(habit) : [],
      habitId: habitWithId?._id?.toString() || null,
      habitIdType: habitWithId?._id ? typeof habitWithId._id : 'undefined',
    });

  } catch (error) {
    console.error('Test export error:', error);
    return NextResponse.json(
      { error: 'Failed to test export' },
      { status: 500 }
    );
  }
}
