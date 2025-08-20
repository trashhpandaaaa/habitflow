import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { PokemonReward } from '@/models/PokemonReward';
import { PokemonService } from '@/services/pokemon-service';

// This is a one-time migration endpoint to fix existing Pokemon canEvolve flags
export async function POST() {
  try {
    console.log('Starting Pokemon canEvolve migration...');
    
    await connectToDatabase();

    // Get all Pokemon rewards
    const allPokemon = await PokemonReward.find({});
    console.log(`Found ${allPokemon.length} Pokemon to check`);

    let updatedCount = 0;

    for (const pokemon of allPokemon) {
      // Get the Pokemon data from the service to check if it can evolve
      const pokemonData = await PokemonService.fetchPokemon(pokemon.pokemonId);
      
      // Update the canEvolve flag if it's different
      if (pokemon.canEvolve !== pokemonData.canEvolve) {
        await PokemonReward.findByIdAndUpdate(pokemon._id, {
          canEvolve: pokemonData.canEvolve,
          evolutionRequirement: pokemonData.canEvolve ? {
            type: 'pomodoro',
            amount: pokemonData.evolutionRequirement?.amount || 5,
            completed: 0
          } : undefined
        });
        
        updatedCount++;
        console.log(`Updated ${pokemon.name} (ID: ${pokemon.pokemonId}) - canEvolve: ${pokemonData.canEvolve}`);
      }
    }

    console.log(`Migration complete! Updated ${updatedCount} Pokemon records.`);

    return NextResponse.json({
      success: true,
      message: `Migration complete! Updated ${updatedCount} out of ${allPokemon.length} Pokemon records.`,
      totalChecked: allPokemon.length,
      totalUpdated: updatedCount
    });

  } catch (error) {
    console.error('Error during migration:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Migration failed', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}
