import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectToDatabase from '@/lib/mongodb';
import { Habit } from '@/models/Habit';
import { HabitCompletion } from '@/models/HabitCompletion';
import { PokemonReward } from '@/models/PokemonReward';

interface HabitData {
  _id: string;
  userId: string;
  name: string;
  createdAt: Date;
  isArchived?: boolean;
}

interface CompletionData {
  _id: string;
  userId: string;
  habitId: string;
  completedAt: Date;
}

interface PokemonData {
  _id: string;
  userId: string;
  pokemonId: number;
  name: string;
  canEvolve: boolean;
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get('userId');

    if (!userId || (requestedUserId && requestedUserId !== userId)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Get user's habits and completions
    const habits = await Habit.find({ userId }).lean();
    const completions = await HabitCompletion.find({ userId }).lean();
    const pokemonRewards = await PokemonReward.find({ userId }).lean();

    // Calculate current progress for different goals
    const currentStats = calculateCurrentProgress(habits, completions, pokemonRewards);

    // Define available goals with current progress
    const goals = [
      {
        id: 'streak-3',
        title: '3-Day Streak',
        description: 'Complete habits for 3 consecutive days',
        current: Math.min(currentStats.currentStreak, 3),
        target: 3,
        reward: {
          type: 'pokemon',
          rarity: 'common',
          name: 'Base Pokemon',
          description: 'Get a Pokemon that can evolve!'
        },
        icon: 'target',
        category: 'streak',
        isCompleted: currentStats.currentStreak >= 3,
        timeframe: 'Daily'
      },
      {
        id: 'streak-7',
        title: '7-Day Streak',
        description: 'Maintain a week-long habit streak',
        current: Math.min(currentStats.currentStreak, 7),
        target: 7,
        reward: {
          type: 'pokemon',
          rarity: 'uncommon',
          name: 'Uncommon Pokemon',
          description: 'Stronger Pokemon with better abilities'
        },
        icon: 'calendar',
        category: 'streak',
        isCompleted: currentStats.currentStreak >= 7,
        timeframe: 'Weekly'
      },
      {
        id: 'streak-14',
        title: '14-Day Streak',
        description: 'Keep your habits going for two weeks',
        current: Math.min(currentStats.currentStreak, 14),
        target: 14,
        reward: {
          type: 'pokemon',
          rarity: 'uncommon',
          name: 'Dedicated Pokemon',
          description: 'Pokemon for consistent dedication'
        },
        icon: 'target',
        category: 'streak',
        isCompleted: currentStats.currentStreak >= 14,
        timeframe: 'Bi-weekly'
      },
      {
        id: 'streak-30',
        title: '30-Day Streak',
        description: 'Maintain habits for a full month',
        current: Math.min(currentStats.currentStreak, 30),
        target: 30,
        reward: {
          type: 'pokemon',
          rarity: 'rare',
          name: 'Elite Pokemon',
          description: 'Powerful Pokemon for exceptional consistency'
        },
        icon: 'crown',
        category: 'streak',
        isCompleted: currentStats.currentStreak >= 30,
        timeframe: 'Monthly'
      },
      {
        id: 'milestone-10',
        title: '10 Completions',
        description: 'Complete any habit 10 times total',
        current: Math.min(currentStats.totalCompletions, 10),
        target: 10,
        reward: {
          type: 'pokemon',
          rarity: 'common',
          name: 'First Milestone Pokemon',
          description: 'Your first milestone achievement'
        },
        icon: 'trophy',
        category: 'milestone',
        isCompleted: currentStats.totalCompletions >= 10
      },
      {
        id: 'milestone-25',
        title: '25 Completions',
        description: 'Complete any habit 25 times total',
        current: Math.min(currentStats.totalCompletions, 25),
        target: 25,
        reward: {
          type: 'pokemon',
          rarity: 'uncommon',
          name: 'Milestone Pokemon',
          description: 'Special Pokemon for dedication'
        },
        icon: 'trophy',
        category: 'milestone',
        isCompleted: currentStats.totalCompletions >= 25
      },
      {
        id: 'milestone-50',
        title: '50 Completions',
        description: 'Complete any habit 50 times total',
        current: Math.min(currentStats.totalCompletions, 50),
        target: 50,
        reward: {
          type: 'pokemon',
          rarity: 'uncommon',
          name: 'Dedicated Pokemon',
          description: 'Pokemon for serious commitment'
        },
        icon: 'trophy',
        category: 'milestone',
        isCompleted: currentStats.totalCompletions >= 50
      },
      {
        id: 'milestone-100',
        title: '100 Completions',
        description: 'Complete any habit 100 times total',
        current: Math.min(currentStats.totalCompletions, 100),
        target: 100,
        reward: {
          type: 'pokemon',
          rarity: 'rare',
          name: 'Century Pokemon',
          description: 'Rare Pokemon for reaching 100 completions'
        },
        icon: 'trophy',
        category: 'milestone',
        isCompleted: currentStats.totalCompletions >= 100
      },
      {
        id: 'perfect-week',
        title: 'Perfect Week',
        description: 'Complete all habits every day for a week',
        current: currentStats.perfectDaysThisWeek,
        target: 7,
        reward: {
          type: 'pokemon',
          rarity: 'rare',
          name: 'Perfect Pokemon',
          description: 'Exceptional Pokemon for perfect performance'
        },
        icon: 'star',
        category: 'perfect',
        isCompleted: currentStats.perfectDaysThisWeek >= 7,
        timeframe: 'Weekly'
      },
      {
        id: 'evolution-ready',
        title: 'Pokemon Evolution',
        description: 'Complete Pomodoro sessions to evolve Pokemon',
        current: currentStats.evolvablePokemon,
        target: 1,
        reward: {
          type: 'evolution',
          rarity: 'uncommon',
          name: 'Evolved Pokemon',
          description: 'Transform your Pokemon into its next form'
        },
        icon: 'zap',
        category: 'evolution',
        isCompleted: currentStats.evolvablePokemon > 0
      },
      {
        id: 'first-habit',
        title: 'First Habit',
        description: 'Create your very first habit',
        current: habits.length > 0 ? 1 : 0,
        target: 1,
        reward: {
          type: 'pokemon',
          rarity: 'uncommon',
          name: 'Starter Pokemon',
          description: 'Your very first Pokemon companion'
        },
        icon: 'gift',
        category: 'special',
        isCompleted: habits.length > 0
      }
    ];

    return NextResponse.json({
      success: true,
      goals: goals.sort((a, b) => {
        // Sort by: incomplete goals first, then by progress percentage
        if (a.isCompleted !== b.isCompleted) {
          return a.isCompleted ? 1 : -1;
        }
        const aProgress = (a.current / a.target) * 100;
        const bProgress = (b.current / b.target) * 100;
        return bProgress - aProgress;
      }),
      stats: currentStats
    });

  } catch (error) {
    console.error('Error fetching goals:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function calculateCurrentProgress(habits: HabitData[], completions: CompletionData[], pokemonRewards: PokemonData[]) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // Calculate current streak (simplified version)
  let currentStreak = 0;
  const completionsByDay = new Map();
  
  completions.forEach(completion => {
    const date = new Date(completion.completedAt);
    const dayKey = date.toDateString();
    if (!completionsByDay.has(dayKey)) {
      completionsByDay.set(dayKey, 0);
    }
    completionsByDay.set(dayKey, completionsByDay.get(dayKey) + 1);
  });

  // Simple streak calculation - count consecutive days with at least one completion
  const checkDate = new Date(today);
  while (completionsByDay.has(checkDate.toDateString())) {
    currentStreak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  // Count perfect days this week
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  
  let perfectDaysThisWeek = 0;
  for (let i = 0; i < 7; i++) {
    const checkDay = new Date(startOfWeek);
    checkDay.setDate(startOfWeek.getDate() + i);
    
    const dayKey = checkDay.toDateString();
    const completionsThisDay = completionsByDay.get(dayKey) || 0;
    const habitsActiveThisDay = habits.filter(h => new Date(h.createdAt) <= checkDay).length;
    
    if (completionsThisDay > 0 && completionsThisDay >= habitsActiveThisDay) {
      perfectDaysThisWeek++;
    }
  }

  // Count evolvable Pokemon (Pokemon with canEvolve = true)
  const evolvablePokemon = pokemonRewards.filter((pokemon: PokemonData) => pokemon.canEvolve === true).length;

  return {
    currentStreak,
    totalCompletions: completions.length,
    perfectDaysThisWeek,
    evolvablePokemon,
    totalHabits: habits.length,
    activeHabits: habits.filter(h => !h.isArchived).length
  };
}
