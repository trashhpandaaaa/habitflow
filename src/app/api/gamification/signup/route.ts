import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { GamificationManager } from '@/lib/gamification-manager';
import connectDB from '@/lib/mongodb';

export async function POST() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    // Handle signup reward
    const reward = await GamificationManager.handleUserSignup(userId);
    
    if (!reward) {
      return NextResponse.json({
        success: true,
        message: 'User initialized, but no Pokemon reward available'
      });
    }

    return NextResponse.json({
      success: true,
      reward: {
        pokemon: reward.pokemon,
        isNewReward: reward.isNewReward,
        experienceGained: reward.experienceGained,
        levelUp: reward.levelUp,
        newLevel: reward.newLevel,
        achievement: reward.achievement,
      },
      message: `Welcome! You received ${reward.pokemon.name}!`
    });

  } catch (error) {
    console.error('Error handling signup reward:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process signup reward',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
