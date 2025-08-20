import { NextRequest, NextResponse } from 'next/server';
import { GamificationManager } from '@/lib/gamification-manager';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';

export async function GET() {
  try {
    await connectDB();
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const stats = await GamificationManager.getUserStats(userId);
    
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching gamification stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await connectDB();
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { action, data } = await request.json();

    switch (action) {
      case 'mark_rewards_viewed':
        await GamificationManager.markRewardsAsViewed(userId, data.rewardIds);
        return NextResponse.json({ success: true });
      
      case 'get_evolvable_pokemon':
        const evolvablePokemon = await GamificationManager.getPokemonThatCanEvolve(userId);
        return NextResponse.json({ success: true, data: evolvablePokemon });
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error updating gamification stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
