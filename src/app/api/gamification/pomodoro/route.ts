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

    const { pokemonId } = await request.json();
    
    // Handle Pokemon evolution from Pomodoro completion
    if (pokemonId) {
      try {
        // For now, simulate evolution by returning evolved Pokemon data
        // In production, you'd check evolution requirements and update database
        const evolutionId = pokemonId + 1; // Simple evolution logic
        
        // Mock evolution response - replace with actual evolution logic
        const evolvedPokemon = {
          id: evolutionId,
          name: `Evolved Pokemon ${evolutionId}`,
          imageUrl: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${evolutionId}.png`,
          type: ['normal'],
          rarity: 'uncommon' as const,
          isEvolution: true,
          evolutionStage: 2,
        };
        
        return NextResponse.json({
          evolved: true,
          pokemon: evolvedPokemon
        });
      } catch (error) {
        console.error('Evolution error:', error);
        return NextResponse.json({
          evolved: false,
          message: 'Evolution failed'
        });
      }
    }
    
    // Generic Pomodoro completion without specific Pokemon
    const generalRewards = await GamificationManager.handlePomodoroCompletion(userId, 1);
    
    return NextResponse.json({
      success: true,
      message: 'Pomodoro session completed',
      rewards: generalRewards
    });
    
  } catch (error) {
    console.error('Error handling Pomodoro evolution:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
