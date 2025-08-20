// Pokemon service for fetching Pokemon data and managing rewards
export interface Pokemon {
  id: number;
  name: string;
  image: string;
  types: string[];
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'shiny';
  evolutionStage: 1 | 2 | 3;
  evolutionChain?: {
    stage1: number;
    stage2?: number;
    stage3?: number;
  };
  canEvolve: boolean;
  evolutionRequirement?: {
    type: 'pomodoro';
    amount: number;
  };
}

export interface RewardTrigger {
  type: 'streak' | 'completion' | 'milestone' | 'perfect_week' | 'perfect_month' | 'pomodoro_evolution';
  value: number;
  habitId?: string;
  pokemonId?: number; // For evolutions
}

export class PokemonService {
  private static readonly POKEAPI_BASE_URL = 'https://pokeapi.co/api/v2';
  private static readonly POKEMON_IMAGE_BASE_URL = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork';
  
  // Cache for Pokemon data to reduce API calls
  private static pokemonCache = new Map<number, Pokemon>();
  private static cacheExpiry = new Map<number, number>();
  private static readonly CACHE_DURATION = 1000 * 60 * 30; // 30 minutes

  // Evolution chains for common Pokemon (Stage 1 -> Stage 2 -> Stage 3)
  private static readonly EVOLUTION_CHAINS: Record<number, { stage1: number; stage2?: number; stage3?: number }> = {
    // Kanto starters
    1: { stage1: 1, stage2: 2, stage3: 3 },       // Bulbasaur -> Ivysaur -> Venusaur
    4: { stage1: 4, stage2: 5, stage3: 6 },       // Charmander -> Charmeleon -> Charizard
    7: { stage1: 7, stage2: 8, stage3: 9 },       // Squirtle -> Wartortle -> Blastoise
    
    // Popular chains
    25: { stage1: 25, stage2: 26 },               // Pikachu -> Raichu
    129: { stage1: 129, stage2: 130 },            // Magikarp -> Gyarados
    10: { stage1: 10, stage2: 11, stage3: 12 },   // Caterpie -> Metapod -> Butterfree
    13: { stage1: 13, stage2: 14, stage3: 15 },   // Weedle -> Kakuna -> Beedrill
    19: { stage1: 19, stage2: 20 },               // Rattata -> Raticate
    21: { stage1: 21, stage2: 22 },               // Spearow -> Fearow
    23: { stage1: 23, stage2: 24 },               // Ekans -> Arbok
    27: { stage1: 27, stage2: 28 },               // Sandshrew -> Sandslash
    29: { stage1: 29, stage2: 30, stage3: 31 },   // Nidoran♀ -> Nidorina -> Nidoqueen
    32: { stage1: 32, stage2: 33, stage3: 34 },   // Nidoran♂ -> Nidorino -> Nidoking
    35: { stage1: 35, stage2: 36 },               // Clefairy -> Clefable
    37: { stage1: 37, stage2: 38 },               // Vulpix -> Ninetales
    39: { stage1: 39, stage2: 40 },               // Jigglypuff -> Wigglytuff
    41: { stage1: 41, stage2: 42 },               // Zubat -> Golbat
    43: { stage1: 43, stage2: 44, stage3: 45 },   // Oddish -> Gloom -> Vileplume
    46: { stage1: 46, stage2: 47 },               // Paras -> Parasect
    48: { stage1: 48, stage2: 49 },               // Venonat -> Venomoth
    50: { stage1: 50, stage2: 51 },               // Diglett -> Dugtrio
    52: { stage1: 52, stage2: 53 },               // Meowth -> Persian
    54: { stage1: 54, stage2: 55 },               // Psyduck -> Golduck
    56: { stage1: 56, stage2: 57 },               // Mankey -> Primeape
    58: { stage1: 58, stage2: 59 },               // Growlithe -> Arcanine
    60: { stage1: 60, stage2: 61, stage3: 62 },   // Poliwag -> Poliwhirl -> Poliwrath
    63: { stage1: 63, stage2: 64, stage3: 65 },   // Abra -> Kadabra -> Alakazam
    66: { stage1: 66, stage2: 67, stage3: 68 },   // Machop -> Machoke -> Machamp
    69: { stage1: 69, stage2: 70, stage3: 71 },   // Bellsprout -> Weepinbell -> Victreebel
    72: { stage1: 72, stage2: 73 },               // Tentacool -> Tentacruel
    74: { stage1: 74, stage2: 75, stage3: 76 },   // Geodude -> Graveler -> Golem
    77: { stage1: 77, stage2: 78 },               // Ponyta -> Rapidash
    79: { stage1: 79, stage2: 80 },               // Slowpoke -> Slowbro
    81: { stage1: 81, stage2: 82 },               // Magnemite -> Magneton
    84: { stage1: 84, stage2: 85 },               // Doduo -> Dodrio
    86: { stage1: 86, stage2: 87 },               // Seel -> Dewgong
    88: { stage1: 88, stage2: 89 },               // Grimer -> Muk
    90: { stage1: 90, stage2: 91 },               // Shellder -> Cloyster
    92: { stage1: 92, stage2: 93, stage3: 94 },   // Gastly -> Haunter -> Gengar
    95: { stage1: 95, stage2: 208 },              // Onix -> Steelix (Gen 2)
    96: { stage1: 96, stage2: 97 },               // Drowzee -> Hypno
    98: { stage1: 98, stage2: 99 },               // Krabby -> Kingler
    100: { stage1: 100, stage2: 101 },            // Voltorb -> Electrode
    102: { stage1: 102, stage2: 103 },            // Exeggcute -> Exeggutor
    104: { stage1: 104, stage2: 105 },            // Cubone -> Marowak
    108: { stage1: 108, stage2: 463 },            // Lickitung -> Lickilicky
    109: { stage1: 109, stage2: 110 },            // Koffing -> Weezing
    111: { stage1: 111, stage2: 112 },            // Rhyhorn -> Rhydon
    113: { stage1: 113, stage2: 242 },            // Chansey -> Blissey
    114: { stage1: 114, stage2: 465 },            // Tangela -> Tangrowth
    116: { stage1: 116, stage2: 117 },            // Horsea -> Seadra
    118: { stage1: 118, stage2: 119 },            // Goldeen -> Seaking
    120: { stage1: 120, stage2: 121 },            // Staryu -> Starmie
    123: { stage1: 123, stage2: 212 },            // Scyther -> Scizor
    125: { stage1: 125, stage2: 466 },            // Electabuzz -> Electivire
    126: { stage1: 126, stage2: 467 },            // Magmar -> Magmortar
    127: { stage1: 127, stage2: 214 },            // Pinsir -> Heracross (not real evolution, but similar)
    128: { stage1: 128, stage2: 149 },            // Tauros -> Dragonite (not real, but progression)
    133: { stage1: 133, stage2: 134, stage3: 135 }, // Eevee -> Vaporeon (simplified)
    138: { stage1: 138, stage2: 139 },            // Omanyte -> Omastar
    140: { stage1: 140, stage2: 141 },            // Kabuto -> Kabutops
    147: { stage1: 147, stage2: 148, stage3: 149 }, // Dratini -> Dragonair -> Dragonite
  };

  // Pokemon rarity based on their original game rarity/legendaries
  private static readonly POKEMON_RARITY_MAP: Record<number, Pokemon['rarity']> = {
    // Legendary Pokemon (Epic/Legendary)
    144: 'legendary', // Articuno
    145: 'legendary', // Zapdos
    146: 'legendary', // Moltres
    150: 'legendary', // Mewtwo
    151: 'legendary', // Mew
    243: 'legendary', // Raikou
    244: 'legendary', // Entei
    245: 'legendary', // Suicune
    249: 'legendary', // Lugia
    250: 'legendary', // Ho-Oh
    380: 'legendary', // Latias
    381: 'legendary', // Latios
    382: 'legendary', // Kyogre
    383: 'legendary', // Groudon
    384: 'legendary', // Rayquaza
    
    // Pseudo-legendary (Epic)
    147: 'epic', // Dratini
    148: 'epic', // Dragonair
    149: 'epic', // Dragonite
    246: 'epic', // Larvitar
    247: 'epic', // Pupitar
    248: 'epic', // Tyranitar
    
    // Final evolutions of popular chains (Rare)
    3: 'rare',   // Venusaur
    6: 'rare',   // Charizard
    9: 'rare',   // Blastoise
    26: 'rare',  // Raichu
    130: 'rare', // Gyarados
    
    // Base Pokemon (Common/Uncommon)
    1: 'common',  // Bulbasaur
    4: 'common',  // Charmander
    7: 'common',  // Squirtle
    25: 'uncommon', // Pikachu
    129: 'common',  // Magikarp
  };

  static async fetchPokemon(id: number): Promise<Pokemon> {
    // Check cache first
    const cached = this.pokemonCache.get(id);
    const expiry = this.cacheExpiry.get(id);
    
    if (cached && expiry && Date.now() < expiry) {
      return cached;
    }

    try {
      // Use a timeout for the API request to prevent blocking
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(`${this.POKEAPI_BASE_URL}/pokemon/${id}`, {
        signal: controller.signal,
        // Add cache headers
        headers: {
          'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch Pokemon ${id}`);
      }
      
      const data = await response.json();
      const evolutionChain = this.EVOLUTION_CHAINS[id];
      const evolutionStage = this.getEvolutionStage(id);
      
      const pokemon: Pokemon = {
        id: data.id,
        name: data.name.charAt(0).toUpperCase() + data.name.slice(1),
        image: `${this.POKEMON_IMAGE_BASE_URL}/${data.id}.png`,
        types: data.types.map((type: { type: { name: string } }) => type.type.name),
        rarity: this.POKEMON_RARITY_MAP[data.id] || 'common',
        evolutionStage,
        evolutionChain,
        canEvolve: evolutionChain ? this.canPokemonEvolve(id, evolutionChain) : false,
        evolutionRequirement: this.canPokemonEvolve(id, evolutionChain) ? {
          type: 'pomodoro',
          amount: evolutionStage === 1 ? 5 : 10 // Stage 1->2 needs 5 pomodoros, Stage 2->3 needs 10
        } : undefined
      };

      // Cache the result
      this.pokemonCache.set(id, pokemon);
      this.cacheExpiry.set(id, Date.now() + this.CACHE_DURATION);
      
      return pokemon;
    } catch (error) {
      console.error('Error fetching Pokemon:', error);
      // Return cached fallback if available
      const fallbackCached = this.pokemonCache.get(129);
      if (fallbackCached) {
        return fallbackCached;
      }
      
      // Fallback Pokemon (Magikarp - the most common!)
      const fallback: Pokemon = {
        id: 129,
        name: 'Magikarp',
        image: `${this.POKEMON_IMAGE_BASE_URL}/129.png`,
        types: ['water'],
        rarity: 'common',
        evolutionStage: 1,
        evolutionChain: this.EVOLUTION_CHAINS[129],
        canEvolve: true,
        evolutionRequirement: {
          type: 'pomodoro',
          amount: 5
        }
      };
      
      // Cache the fallback too
      this.pokemonCache.set(129, fallback);
      this.cacheExpiry.set(129, Date.now() + this.CACHE_DURATION);
      
      return fallback;
    }
  }

  static getEvolutionStage(pokemonId: number): 1 | 2 | 3 {
    // Check all evolution chains to see which stage this Pokemon is in
    for (const chain of Object.values(this.EVOLUTION_CHAINS)) {
      if (chain.stage1 === pokemonId) return 1;
      if (chain.stage2 === pokemonId) return 2;
      if (chain.stage3 === pokemonId) return 3;
    }
    return 1; // Default to stage 1 if not found in any chain
  }

  static canPokemonEvolve(pokemonId: number, evolutionChain?: { stage1: number; stage2?: number; stage3?: number }): boolean {
    if (!evolutionChain) return false;
    
    // Can evolve if it's stage 1 and has stage 2, or stage 2 and has stage 3
    if (pokemonId === evolutionChain.stage1 && evolutionChain.stage2) return true;
    if (pokemonId === evolutionChain.stage2 && evolutionChain.stage3) return true;
    
    return false;
  }

  static getNextEvolution(pokemonId: number): number | null {
    for (const chain of Object.values(this.EVOLUTION_CHAINS)) {
      if (chain.stage1 === pokemonId && chain.stage2) return chain.stage2;
      if (chain.stage2 === pokemonId && chain.stage3) return chain.stage3;
    }
    return null;
  }

  static determinePokemonReward(trigger: RewardTrigger): Pokemon['rarity'] {
    const { type, value } = trigger;
    
    // Shiny chance (1% for any reward)
    if (Math.random() < 0.01) {
      return 'shiny';
    }
    
    switch (type) {
      case 'streak':
        // 3-day streaks give base Pokemon (stage 1)
        if (value === 3) return 'common'; 
        if (value >= 100) return 'legendary';
        if (value >= 50) return 'epic';
        if (value >= 30) return 'rare';
        if (value >= 10) return 'uncommon';
        return 'common';
        
      case 'perfect_month':
        return Math.random() < 0.3 ? 'legendary' : 'epic';
        
      case 'perfect_week':
        return Math.random() < 0.2 ? 'epic' : 'rare';
        
      case 'milestone':
        if (value >= 1000) return 'legendary';
        if (value >= 500) return 'epic';
        if (value >= 100) return 'rare';
        if (value >= 50) return 'uncommon';
        return 'common';
        
      case 'completion':
        return 'common';

      case 'pomodoro_evolution':
        // Evolutions inherit base rarity but could be upgraded
        return 'uncommon'; // Evolved Pokemon are at least uncommon
        
      default:
        return 'common';
    }
  }

  static getPokemonByRarity(rarity: Pokemon['rarity'], forStreakReward = false): number {
    // For 3-day streak rewards, prioritize base Pokemon that can evolve
    if (forStreakReward && rarity === 'common') {
      const basePokemon = [1, 4, 7, 25, 129, 10, 13, 19, 21, 23, 27, 29, 32, 35, 37, 39, 41, 43, 46, 48, 50, 52, 54, 56, 58, 60, 63, 66, 69, 72, 74, 77, 79, 81, 84, 86, 88, 90, 92, 95, 96, 98, 100, 102, 104, 108, 109, 111, 113, 114, 116, 118, 120, 123, 125, 126, 127, 128, 133, 138, 140, 147];
      return basePokemon[Math.floor(Math.random() * basePokemon.length)];
    }

    const pokemonIds: Record<Pokemon['rarity'], number[]> = {
      common: [1, 4, 7, 10, 13, 16, 19, 21, 23, 27, 29, 32, 35, 37, 39, 41, 43, 46, 48, 50, 52, 54, 56, 58, 60, 63, 66, 69, 72, 74, 77, 79, 81, 83, 84, 86, 88, 90, 92, 95, 96, 98, 100, 102, 104, 108, 109, 111, 113, 114, 115, 116, 118, 120, 122, 123, 124, 125, 126, 127, 128, 129, 133, 134, 135, 136, 137, 138, 140, 152, 155, 158, 161, 163, 165, 167, 170, 172, 173, 174, 175, 177, 179, 183, 185, 187, 190, 191, 193, 194, 198, 200, 204, 206, 209, 213, 214, 215, 216, 218, 220, 222, 223, 225, 226, 228, 231, 234, 235, 236, 238, 239, 240, 252, 255, 258, 261, 263, 265, 267, 269, 270, 273, 276, 278, 283, 285, 287, 290, 293, 296, 299, 300, 303, 304, 307, 309, 311, 312, 313, 314, 315, 316, 318, 320, 322, 325, 327, 328, 331, 333, 335, 336, 337, 338, 339, 341, 343, 345, 347, 349, 351, 352, 353, 355, 357, 358, 359, 360, 361, 363, 366, 369, 370, 371, 374],
      uncommon: [2, 5, 8, 11, 14, 17, 20, 22, 24, 26, 28, 30, 33, 36, 38, 40, 42, 44, 47, 49, 51, 53, 55, 57, 59, 61, 64, 67, 70, 75, 78, 80, 82, 85, 87, 89, 91, 93, 97, 99, 101, 103, 105, 106, 107, 110, 112, 117, 119, 121, 130, 139, 141, 153, 156, 159, 162, 164, 166, 168, 171, 176, 178, 180, 184, 186, 188, 192, 195, 199, 201, 205, 207, 210, 217, 219, 221, 224, 227, 229, 232, 233, 237, 241, 253, 256, 259, 262, 264, 266, 268, 271, 274, 277, 279, 284, 286, 288, 291, 294, 297, 301, 305, 308, 310, 317, 319, 321, 323, 326, 329, 332, 334, 340, 342, 344, 346, 348, 350, 354, 356, 362, 364, 367, 372],
      rare: [3, 6, 9, 12, 15, 18, 25, 31, 34, 45, 62, 65, 68, 71, 73, 76, 94, 131, 132, 142, 143, 154, 157, 160, 181, 182, 189, 196, 197, 202, 203, 208, 211, 212, 230, 242, 254, 257, 260, 272, 275, 280, 281, 282, 289, 292, 295, 298, 302, 306, 324, 330, 365, 368, 373, 375],
      epic: [147, 148, 149, 246, 247, 248, 142, 345, 347, 349, 351, 374, 375, 376],
      legendary: [144, 145, 146, 150, 151, 243, 244, 245, 249, 250, 251, 377, 378, 379, 380, 381, 382, 383, 384, 385, 386],
      shiny: [] // Shiny variants use the same ID but with special handling
    };

    const availablePokemon = pokemonIds[rarity];
    if (!availablePokemon || availablePokemon.length === 0) {
      return 129; // Fallback to Magikarp
    }
    
    return availablePokemon[Math.floor(Math.random() * availablePokemon.length)];
  }

  static async generateReward(trigger: RewardTrigger): Promise<Pokemon> {
    const rarity = this.determinePokemonReward(trigger);
    let pokemonId: number;

    if (trigger.type === 'pomodoro_evolution' && trigger.pokemonId) {
      // Evolution case - get the next evolution
      const nextEvolutionId = this.getNextEvolution(trigger.pokemonId);
      if (nextEvolutionId) {
        pokemonId = nextEvolutionId;
      } else {
        // Fallback if no evolution exists
        pokemonId = trigger.pokemonId;
      }
    } else {
      // Regular reward case
      const isStreakReward = trigger.type === 'streak' && trigger.value === 3;
      pokemonId = this.getPokemonByRarity(rarity === 'shiny' ? 'common' : rarity, isStreakReward);
    }
    
    const pokemon = await this.fetchPokemon(pokemonId);
    
    // Override rarity if it's shiny
    if (rarity === 'shiny') {
      pokemon.rarity = 'shiny';
    }
    
    return pokemon;
  }

  static async evolvePokemon(pokemonId: number): Promise<Pokemon | null> {
    const nextEvolutionId = this.getNextEvolution(pokemonId);
    if (!nextEvolutionId) return null;
    
    return await this.fetchPokemon(nextEvolutionId);
  }

  static getExperienceForCompletion(rarity: Pokemon['rarity']): number {
    const xpMap: Record<Pokemon['rarity'], number> = {
      common: 10,
      uncommon: 25,
      rare: 50,
      epic: 100,
      legendary: 200,
      shiny: 300
    };
    
    return xpMap[rarity];
  }

  static getLevelFromExperience(experience: number): number {
    // Level formula: every 100 XP = 1 level, with scaling
    return Math.floor(Math.sqrt(experience / 50)) + 1;
  }

  static getRequiredExperienceForLevel(level: number): number {
    return Math.pow(level - 1, 2) * 50;
  }

  static async getWelcomePokemon(): Promise<Pokemon> {
    // Give one of the original starter Pokemon for signup
    const starterIds = [1, 4, 7]; // Bulbasaur, Charmander, Squirtle
    const randomStarterId = starterIds[Math.floor(Math.random() * starterIds.length)];
    
    const pokemon = await this.fetchPokemon(randomStarterId);
    pokemon.rarity = 'uncommon'; // Make starter Pokemon slightly special
    return pokemon;
  }

  static async getFirstHabitPokemon(): Promise<Pokemon> {
    // Give a different helpful Pokemon for first habit creation
    const firstHabitIds = [25, 129, 133]; // Pikachu, Magikarp, Eevee - iconic and motivational
    const randomId = firstHabitIds[Math.floor(Math.random() * firstHabitIds.length)];
    
    const pokemon = await this.fetchPokemon(randomId);
    pokemon.rarity = 'uncommon'; // Make first habit Pokemon special
    return pokemon;
  }
}
