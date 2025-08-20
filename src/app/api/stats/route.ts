import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/mongoose';
import Habit from '@/models/Habit';
import HabitCompletion from '@/models/HabitCompletion';
import PomodoroSession from '@/models/PomodoroSession';
import User from '@/models/User';

// Get user statistics
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
    const period = searchParams.get('period') || '7'; // days
    const days = parseInt(period);

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // Get habit statistics
    const totalHabits = await Habit.countDocuments({ userId: user._id });
    const activeHabits = await Habit.countDocuments({ 
      userId: user._id, 
      isActive: true 
    });

    // Get completions in the period
    const completions = await HabitCompletion.find({
      userId: userId, // Use Clerk userId instead of user._id
      date: { $gte: startDateStr, $lte: endDateStr },
    });

    const totalCompletions = completions.length;
    const completionsByDay = completions.reduce((acc, completion) => {
      const date = completion.date;
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Get current streak for each habit
    const habits = await Habit.find({ userId: user._id, isActive: true });
    let totalStreak = 0;
    
    for (const habit of habits) {
      const habitCompletions = await HabitCompletion.find({
        habitId: habit._id,
        userId: userId, // Use Clerk userId instead of user._id
      }).sort({ date: -1 });

      let streak = 0;
      const today = new Date().toISOString().split('T')[0];
      const currentDate = new Date(today);

      for (const completion of habitCompletions) {
        const completionDate = currentDate.toISOString().split('T')[0];
        if (completion.date === completionDate) {
          streak++;
          currentDate.setDate(currentDate.getDate() - 1);
        } else {
          break;
        }
      }

      totalStreak += streak;
    }

    // Get Pomodoro statistics
    const pomodoroSessions = await PomodoroSession.find({
      userId: userId, // Use Clerk userId instead of user._id
      date: { $gte: startDateStr, $lte: endDateStr },
      sessionType: 'work',
      // Removed 'completed: true' since the model doesn't have this field
    });

    const totalPomodoroTime = pomodoroSessions.reduce((acc, session) => {
      return acc + session.duration;
    }, 0);

    const pomodorosByDay = pomodoroSessions.reduce((acc, session) => {
      const date = session.date;
      acc[date] = (acc[date] || 0) + session.duration;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      totalHabits,
      activeHabits,
      totalCompletions,
      completionsByDay,
      currentStreaks: totalStreak,
      totalPomodoroTime,
      pomodorosByDay,
      period: {
        days,
        startDate: startDateStr,
        endDate: endDateStr,
      },
    });
  } catch (error) {
    console.error('Get statistics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
