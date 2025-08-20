import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import dbConnect from '@/lib/mongoose';
import Habit from '@/models/Habit';
import HabitCompletion from '@/models/HabitCompletion';
import PomodoroSession from '@/models/PomodoroSession';
import User from '@/models/User';

interface ExportData {
  user: {
    clerkId: string;
    email: string;
    name: string;
    joinDate: string;
    settings: {
      darkMode: boolean;
      notifications: boolean;
      reminderTime: string;
    };
  };
  habits: Array<{
    id: string;
    name: string;
    description?: string;
    category: string;
    targetCount: number;
    frequency: string;
    completedCount: number;
    currentStreak: number;
    bestStreak: number;
    reminderTime?: string;
    color?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  }>;
  habitCompletions: Array<{
    habitId: string;
    habitName: string;
    date: string;
    completedAt: string;
    count: number;
  }>;
  pomodoroSessions: Array<{
    sessionType: string;
    duration: number;
    date: string;
    completedAt: string;
  }>;
  exportedAt: string;
  totalHabits: number;
  totalCompletions: number;
  totalPomodoroSessions: number;
}

// Helper function to convert object to CSV row
function objectToCsvRow(obj: Record<string, unknown>, headers: string[]): string {
  return headers.map(header => {
    const value = obj[header];
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') return JSON.stringify(value);
    if (typeof value === 'string' && value.includes(',')) return `"${value}"`;
    return value.toString();
  }).join(',');
}

// Helper function to convert array to CSV
function arrayToCsv(data: Record<string, unknown>[], headers: string[]): string {
  const headerRow = headers.join(',');
  const dataRows = data.map(item => objectToCsvRow(item, headers));
  return [headerRow, ...dataRows].join('\n');
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Get export format from query params
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json'; // 'json' or 'csv'

    // Fetch user data
    const user = await User.findOne({ clerkId: userId }).select('-_id -__v');
    
    // Fetch habits
    const habits = await Habit.find({ userId }).select('-userId -__v').lean();
    
    // Fetch habit completions with habit names
    const habitCompletions = await HabitCompletion.find({ userId })
      .populate('habitId', 'name')
      .select('-userId -__v')
      .lean();
    
    // Fetch pomodoro sessions
    const pomodoroSessions = await PomodoroSession.find({ userId })
      .select('-userId -__v')
      .lean();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Debug: Log the first habit to check structure
    if (habits && habits.length > 0) {
      console.log('Sample habit structure:', JSON.stringify(habits[0], null, 2));
    }

    // Ensure we have valid data arrays
    const habitsArray = habits || [];
    const completionsArray = habitCompletions || [];
    const sessionsArray = pomodoroSessions || [];

    // Format the data for export
    const exportData: ExportData = {
      user: {
        clerkId: user.clerkId,
        email: user.email,
        name: user.name,
        joinDate: user.joinDate.toISOString(),
        settings: user.settings,
      },
      habits: habitsArray.map((habit, index) => {
        try {
          return {
            id: habit._id?.toString() || `habit_${index}`,
            name: habit.name || '',
            description: habit.description || '',
            category: habit.category || '',
            targetCount: habit.targetCount || 1,
            frequency: habit.frequency || 'daily',
            completedCount: habit.completedCount || 0,
            currentStreak: habit.currentStreak || 0,
            bestStreak: habit.bestStreak || 0,
            reminderTime: habit.reminderTime || '',
            color: habit.color || '',
            isActive: habit.isActive !== undefined ? habit.isActive : true,
            createdAt: habit.createdAt?.toISOString() || '',
            updatedAt: habit.updatedAt?.toISOString() || '',
          };
        } catch (error) {
          console.error('Error processing habit at index', index, ':', error);
          return {
            id: `error_habit_${index}`,
            name: 'Error processing habit',
            description: '',
            category: 'other',
            targetCount: 1,
            frequency: 'daily',
            completedCount: 0,
            currentStreak: 0,
            bestStreak: 0,
            reminderTime: '',
            color: '',
            isActive: true,
            createdAt: '',
            updatedAt: '',
          };
        }
      }),
      habitCompletions: completionsArray.map(completion => ({
        habitId: completion.habitId?._id?.toString() || '',
        habitName: (completion.habitId as { name: string })?.name || '',
        date: completion.date,
        completedAt: completion.completedAt?.toISOString() || '',
        count: completion.count,
      })),
      pomodoroSessions: sessionsArray.map(session => ({
        sessionType: session.sessionType,
        duration: session.duration,
        date: session.date,
        completedAt: session.completedAt?.toISOString() || '',
      })),
      exportedAt: new Date().toISOString(),
      totalHabits: habitsArray.length,
      totalCompletions: completionsArray.length,
      totalPomodoroSessions: sessionsArray.length,
    };

    if (format === 'csv') {
      // Create separate CSV files for each data type
      const timestamp = new Date().toISOString().split('T')[0];
      
      // User data CSV
      const userCsv = arrayToCsv([exportData.user], [
        'clerkId', 'email', 'name', 'joinDate', 'settings'
      ]);
      
      // Habits CSV
      const habitsCsv = arrayToCsv(exportData.habits, [
        'id', 'name', 'description', 'category', 'targetCount', 'frequency',
        'completedCount', 'currentStreak', 'bestStreak', 'reminderTime',
        'color', 'isActive', 'createdAt', 'updatedAt'
      ]);
      
      // Habit completions CSV
      const completionsCsv = arrayToCsv(exportData.habitCompletions, [
        'habitId', 'habitName', 'date', 'completedAt', 'count'
      ]);
      
      // Pomodoro sessions CSV
      const pomodorosCsv = arrayToCsv(exportData.pomodoroSessions, [
        'sessionType', 'duration', 'date', 'completedAt'
      ]);

      // Combine all CSV data
      const combinedCsv = `# User Data\n${userCsv}\n\n# Habits\n${habitsCsv}\n\n# Habit Completions\n${completionsCsv}\n\n# Pomodoro Sessions\n${pomodorosCsv}`;

      return new NextResponse(combinedCsv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="habitflow-data-${timestamp}.csv"`,
        },
      });
    }

    // Return JSON format
    return NextResponse.json(exportData, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="habitflow-data-${new Date().toISOString().split('T')[0]}.json"`,
      },
    });

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}
