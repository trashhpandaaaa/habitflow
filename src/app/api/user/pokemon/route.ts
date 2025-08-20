import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { PokemonReward } from '@/models/PokemonReward';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const evolvable = searchParams.get('evolvable') === 'true';

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    await connectToDatabase();

    const query = evolvable 
      ? { userId, canEvolve: true }
      : { userId };

    const pokemonRewards = await PokemonReward.find(query).sort({ createdAt: -1 });

    // If requesting evolvable Pokemon, enhance with evolution data
    const enhancedPokemon = await Promise.all(
      pokemonRewards.map(async (reward: { pokemonId: number; name: string; imageUrl: string; type: string[]; canEvolve: boolean }) => {
        const pokemon: {
          id: number;
          name: string;
          imageUrl: string;
          type: string[];
          canEvolve: boolean;
          evolutionTarget?: {
            id: number;
            name: string;
            imageUrl: string;
          };
        } = {
          id: reward.pokemonId,
          name: reward.name,
          imageUrl: reward.imageUrl,
          type: reward.type || [],
          canEvolve: reward.canEvolve || false,
        };

        // If this Pokemon can evolve, fetch evolution data
        if (evolvable && reward.canEvolve) {
          try {
            // Use the Pokemon service to get the correct next evolution
            const { PokemonService } = await import('@/services/pokemon-service');
            const nextEvolutionId = PokemonService.getNextEvolution(reward.pokemonId);
            
            if (nextEvolutionId) {
              const evolutionData = await PokemonService.fetchPokemon(nextEvolutionId);
              
              if (evolutionData) {
                pokemon.evolutionTarget = {
                  id: evolutionData.id,
                  name: evolutionData.name,
                  imageUrl: evolutionData.image,
                };
              }
            }
          } catch (error) {
            console.error('Error fetching evolution data for Pokemon:', reward.pokemonId, error);
          }
        }

        return pokemon;
      })
    );

    return NextResponse.json({ 
      pokemon: enhancedPokemon,
      count: enhancedPokemon.length 
    });

  } catch (error) {
    console.error('Error fetching user Pokemon:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
