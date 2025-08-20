import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/mongoose';
import Habit from '@/models/Habit';
import User from '@/models/User';

// Get single habit
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const habit = await Habit.findOne({
      _id: params.id,
      userId: user._id,
    });

    if (!habit) {
      return NextResponse.json(
        { error: 'Habit not found' },
        { status: 404 }
      );
    }

    // Transform targetCount to target for API compatibility
    const habitObj = habit.toObject();
    const transformedHabit = {
      ...habitObj,
      target: habitObj.targetCount,
      targetCount: undefined // Remove the original field
    };

    return NextResponse.json({ habit: transformedHabit });
  } catch (error) {
    console.error('Get habit error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update habit
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const habitData = await request.json();
    
    // Map 'target' to 'targetCount' for the database model
    const updateData = {
      ...habitData,
      updatedAt: new Date(),
    };
    
    // Rename target to targetCount if it exists
    if ('target' in updateData) {
      updateData.targetCount = updateData.target;
      delete updateData.target;
    }

    const habit = await Habit.findOneAndUpdate(
      {
        _id: params.id,
        userId: user._id,
      },
      updateData,
      { new: true, runValidators: true }
    );

    if (!habit) {
      return NextResponse.json(
        { error: 'Habit not found' },
        { status: 404 }
      );
    }

    // Transform targetCount to target for API compatibility
    const habitObj = habit.toObject();
    const transformedHabit = {
      ...habitObj,
      target: habitObj.targetCount,
      targetCount: undefined // Remove the original field
    };

    return NextResponse.json({ habit: transformedHabit });
  } catch (error) {
    console.error('Update habit error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Delete habit
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const habit = await Habit.findOneAndDelete({
      _id: params.id,
      userId: user._id,
    });

    if (!habit) {
      return NextResponse.json(
        { error: 'Habit not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Habit deleted successfully' });
  } catch (error) {
    console.error('Delete habit error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
