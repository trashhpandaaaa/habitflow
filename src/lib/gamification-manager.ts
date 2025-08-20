import { PokemonService, RewardTrigger, Pokemon } from '@/services/pokemon-service';
import { PokemonReward, GamificationStats, IPokemonReward, IGamificationStats } from '@/models/PokemonReward';
import { IHabit } from '@/models/Habit';

export interface RewardResult {
  pokemon: Pokemon;
  isNewReward: boolean;
  experienceGained: number;
  levelUp: boolean;
  newLevel?: number;
  achievement?: {
    name: string;
    description: string;
    icon: string;
  };
}

export class GamificationManager {
  static async initializeUserStats(userId: string): Promise<IGamificationStats> {
    try {
      let stats = await GamificationStats.findOne({ userId });
      
      if (!stats) {
        stats = new GamificationStats({
          userId,
          level: 1,
          experience: 0,
          totalPokemonCaught: 0,
          pokemonCollection: [],
          achievements: [],
          currentTitle: 'Beginner Trainer',
          availableTitles: ['Beginner Trainer'],
          stats: {
            totalHabitsCompleted: 0,
            longestStreak: 0,
            perfectDays: 0,
            perfectWeeks: 0,
            perfectMonths: 0,
          }
        });
        
        await stats.save();
      }
      
      return stats;
    } catch (error) {
      console.error('Error initializing user stats:', error);
      throw new Error('Failed to initialize gamification stats');
    }
  }

  static async handleUserSignup(userId: string): Promise<RewardResult | null> {
    try {
      // Initialize user stats first
      await this.initializeUserStats(userId);
      
      // Give a welcome Pokemon (starter Pokemon)
      const starterPokemon = await PokemonService.getWelcomePokemon();
      
      if (!starterPokemon) {
        console.warn('No starter Pokemon available for signup reward');
        return null;
      }

      const reward = await this.giveReward(userId, 'signup', starterPokemon);
      
      // Add welcome achievement
      await this.addAchievement(userId, {
        name: 'Welcome Trainer!',
        description: 'Started your Pokemon journey with HabitFlow',
        icon: '🌟',
        unlockedAt: new Date(),
      });

      return reward;
    } catch (error) {
      console.error('Error handling user signup reward:', error);
      return null;
    }
  }

  static async handleFirstHabit(userId: string): Promise<RewardResult | null> {
    try {
      // Check if user already has the first habit achievement
      const stats = await GamificationStats.findOne({ userId });
      if (!stats) {
        throw new Error('User stats not found');
      }

      const hasFirstHabitAchievement = stats.achievements.some(
        (achievement: { name: string }) => achievement.name === 'First Step'
      );

      if (hasFirstHabitAchievement) {
        return null; // Already gave first habit reward
      }

      // Give a first habit Pokemon
      const firstHabitPokemon = await PokemonService.getFirstHabitPokemon();
      
      if (!firstHabitPokemon) {
        console.warn('No Pokemon available for first habit reward');
        return null;
      }

      const reward = await this.giveReward(userId, 'first_habit', firstHabitPokemon);
      
      // Add first habit achievement
      await this.addAchievement(userId, {
        name: 'First Step',
        description: 'Created your very first habit',
        icon: '🎯',
        unlockedAt: new Date(),
      });

      return reward;
    } catch (error) {
      console.error('Error handling first habit reward:', error);
      return null;
    }
  }

  static async giveReward(
    userId: string, 
    triggerType: 'signup' | 'first_habit',
    pokemon: Pokemon
  ): Promise<RewardResult | null> {
    try {
      const stats = await GamificationStats.findOne({ userId });
      if (!stats) {
        throw new Error('User stats not found');
      }

      const experienceGained = PokemonService.getExperienceForCompletion(pokemon.rarity);
      
      // Check if user already has this exact Pokemon (prevent duplicates for special rewards)
      const isDuplicate = stats.pokemonCollection.some(
        (p: IPokemonReward) => p.pokemonId === pokemon.id && p.triggerType === triggerType
      );

      if (isDuplicate && (triggerType === 'signup' || triggerType === 'first_habit')) {
        return null; // Don't give duplicate special rewards
      }

      // Create Pokemon reward entry
      const pokemonReward = new PokemonReward({
        userId,
        pokemonId: pokemon.id,
        pokemonName: pokemon.name,
        pokemonImage: pokemon.image,
        pokemonType: pokemon.types,
        triggerType: triggerType,
        triggerValue: 1,
        rarity: pokemon.rarity,
        isViewed: false,
        evolutionStage: pokemon.evolutionStage,
        canEvolve: pokemon.canEvolve,
        evolutionRequirement: pokemon.canEvolve ? {
          type: 'pomodoro',
          amount: pokemon.evolutionRequirement?.amount || 5,
          completed: 0
        } : undefined,
      });

      // Add to collection
      stats.pokemonCollection.push(pokemonReward as IPokemonReward);
      stats.totalPokemonCaught += 1;
      
      // Add experience
      const oldLevel = stats.level;
      stats.experience += experienceGained;
      stats.level = PokemonService.getLevelFromExperience(stats.experience);
      
      const levelUp = stats.level > oldLevel;

      await stats.save();

      return {
        pokemon,
        isNewReward: !isDuplicate,
        experienceGained,
        levelUp,
        newLevel: levelUp ? stats.level : undefined
      };
    } catch (error) {
      console.error('Error giving reward:', error);
      return null;
    }
  }

  static async checkAndAwardRewards(
    userId: string, 
    habit: IHabit, 
    completionType: 'daily' | 'streak' | 'milestone'
  ): Promise<RewardResult[]> {
    const rewards: RewardResult[] = [];
    const stats = await this.initializeUserStats(userId);
    
    // Update basic stats
    stats.stats.totalHabitsCompleted += 1;
    if (habit.currentStreak > stats.stats.longestStreak) {
      stats.stats.longestStreak = habit.currentStreak;
    }

    // Check for various reward triggers
    const triggers = this.getRewardTriggers(habit, completionType);
    
    for (const trigger of triggers) {
      const reward = await this.generateReward(userId, trigger, stats);
      if (reward) {
        rewards.push(reward);
      }
    }

    // Check for achievements
    const achievements = this.checkAchievements(stats);
    for (const achievement of achievements) {
      stats.achievements.push({
        name: achievement.name,
        description: achievement.description,
        unlockedAt: new Date(),
        icon: achievement.icon
      });
      
      // Add achievement to the first reward or create a new one
      if (rewards.length > 0) {
        rewards[0].achievement = achievement;
      }
    }

    // Update titles based on achievements and stats
    this.updateAvailableTitles(stats);
    
    await stats.save();
    
    return rewards;
  }

  private static getRewardTriggers(
    habit: IHabit, 
    completionType: 'daily' | 'streak' | 'milestone'
  ): RewardTrigger[] {
    const triggers: RewardTrigger[] = [];

    // Daily completion reward (low chance)
    if (completionType === 'daily' && Math.random() < 0.1) {
      triggers.push({
        type: 'completion',
        value: 1,
        habitId: habit.id
      });
    }

    // 3-day streak gives base Pokemon that can evolve!
    if (habit.currentStreak === 3) {
      triggers.push({
        type: 'streak',
        value: 3,
        habitId: habit.id
      });
    }

    // Other streak rewards (7, 14, 21, etc.)
    if (habit.currentStreak > 3 && habit.currentStreak % 7 === 0) {
      triggers.push({
        type: 'streak',
        value: habit.currentStreak,
        habitId: habit.id
      });
    }

    // Milestone rewards
    const milestones = [10, 25, 50, 100, 250, 500, 1000];
    if (milestones.includes(habit.completedCount)) {
      triggers.push({
        type: 'milestone',
        value: habit.completedCount,
        habitId: habit.id
      });
    }

    return triggers;
  }

  private static async generateReward(
    userId: string,
    trigger: RewardTrigger,
    stats: IGamificationStats
  ): Promise<RewardResult | null> {
    try {
      const pokemon = await PokemonService.generateReward(trigger);
      const experienceGained = PokemonService.getExperienceForCompletion(pokemon.rarity);
      
      // Check if this is a duplicate Pokemon (lower chance for higher rarity)
      const existingPokemon = stats.pokemonCollection.find(p => p.pokemonId === pokemon.id);
      const isDuplicate = existingPokemon !== undefined;
      
      // Create Pokemon reward entry
      const pokemonReward = new PokemonReward({
        userId,
        pokemonId: pokemon.id,
        pokemonName: pokemon.name,
        pokemonImage: pokemon.image,
        pokemonType: pokemon.types,
        triggerType: trigger.type,
        triggerValue: trigger.value,
        habitId: trigger.habitId,
        rarity: pokemon.rarity,
        isViewed: false,
        evolutionStage: pokemon.evolutionStage,
        canEvolve: pokemon.canEvolve,
        evolutionRequirement: pokemon.canEvolve ? {
          type: 'pomodoro',
          amount: pokemon.evolutionRequirement?.amount || 5,
          completed: 0
        } : undefined,
        parentPokemonId: trigger.type === 'pomodoro_evolution' ? trigger.pokemonId : undefined
      });

      // Add to collection
      stats.pokemonCollection.push(pokemonReward as IPokemonReward);
      stats.totalPokemonCaught += 1;
      
      // Add experience
      const oldLevel = stats.level;
      stats.experience += experienceGained;
      stats.level = PokemonService.getLevelFromExperience(stats.experience);
      
      const levelUp = stats.level > oldLevel;

      return {
        pokemon,
        isNewReward: !isDuplicate,
        experienceGained,
        levelUp,
        newLevel: levelUp ? stats.level : undefined
      };
    } catch (error) {
      console.error('Error generating reward:', error);
      return null;
    }
  }

  private static checkAchievements(stats: IGamificationStats): Array<{
    name: string;
    description: string;
    icon: string;
  }> {
    const newAchievements = [];
    const existingAchievements = stats.achievements.map(a => a.name);

    // First Pokemon achievement
    if (stats.totalPokemonCaught >= 1 && !existingAchievements.includes('First Catch')) {
      newAchievements.push({
        name: 'First Catch',
        description: 'Caught your first Pokemon!',
        icon: '🎯'
      });
    }

    // Collection milestones
    const collectionMilestones = [
      { count: 10, name: 'Collector', description: 'Caught 10 Pokemon!', icon: '📦' },
      { count: 25, name: 'Trainer', description: 'Caught 25 Pokemon!', icon: '🎒' },
      { count: 50, name: 'Pokemon Master', description: 'Caught 50 Pokemon!', icon: '👑' },
      { count: 100, name: 'Legendary Trainer', description: 'Caught 100 Pokemon!', icon: '⭐' }
    ];

    for (const milestone of collectionMilestones) {
      if (stats.totalPokemonCaught >= milestone.count && !existingAchievements.includes(milestone.name)) {
        newAchievements.push(milestone);
      }
    }

    // Streak achievements
    const streakMilestones = [
      { streak: 7, name: 'Week Warrior', description: '7-day streak achieved!', icon: '🔥' },
      { streak: 30, name: 'Month Master', description: '30-day streak achieved!', icon: '💪' },
      { streak: 100, name: 'Streak Legend', description: '100-day streak achieved!', icon: '🏆' }
    ];

    for (const milestone of streakMilestones) {
      if (stats.stats.longestStreak >= milestone.streak && !existingAchievements.includes(milestone.name)) {
        newAchievements.push(milestone);
      }
    }

    // Rarity achievements
    const rarePokemon = stats.pokemonCollection.filter(p => p.rarity === 'rare').length;
    const epicPokemon = stats.pokemonCollection.filter(p => p.rarity === 'epic').length;
    const legendaryPokemon = stats.pokemonCollection.filter(p => p.rarity === 'legendary').length;
    const shinyPokemon = stats.pokemonCollection.filter(p => p.rarity === 'shiny').length;

    if (rarePokemon >= 1 && !existingAchievements.includes('Rare Hunter')) {
      newAchievements.push({
        name: 'Rare Hunter',
        description: 'Caught your first rare Pokemon!',
        icon: '💎'
      });
    }

    if (epicPokemon >= 1 && !existingAchievements.includes('Epic Collector')) {
      newAchievements.push({
        name: 'Epic Collector',
        description: 'Caught your first epic Pokemon!',
        icon: '🌟'
      });
    }

    if (legendaryPokemon >= 1 && !existingAchievements.includes('Legend Seeker')) {
      newAchievements.push({
        name: 'Legend Seeker',
        description: 'Caught your first legendary Pokemon!',
        icon: '🌠'
      });
    }

    if (shinyPokemon >= 1 && !existingAchievements.includes('Shiny Hunter')) {
      newAchievements.push({
        name: 'Shiny Hunter',
        description: 'Caught a shiny Pokemon!',
        icon: '✨'
      });
    }

    return newAchievements;
  }

  private static updateAvailableTitles(stats: IGamificationStats): void {
    const titles = new Set(stats.availableTitles);
    
    // Level-based titles
    if (stats.level >= 10) titles.add('Experienced Trainer');
    if (stats.level >= 25) titles.add('Expert Trainer');
    if (stats.level >= 50) titles.add('Elite Trainer');
    if (stats.level >= 100) titles.add('Champion');

    // Collection-based titles
    if (stats.totalPokemonCaught >= 50) titles.add('Pokemon Master');
    if (stats.totalPokemonCaught >= 100) titles.add('Pokedex Completionist');

    // Achievement-based titles
    const achievementNames = stats.achievements.map(a => a.name);
    if (achievementNames.includes('Legend Seeker')) titles.add('Legend Whisperer');
    if (achievementNames.includes('Shiny Hunter')) titles.add('Shiny Specialist');
    if (stats.stats.longestStreak >= 100) titles.add('Habit Grandmaster');

    stats.availableTitles = Array.from(titles);
  }

  static async getUserStats(userId: string): Promise<IGamificationStats> {
    return await this.initializeUserStats(userId);
  }

  static async getUnviewedRewards(userId: string): Promise<IPokemonReward[]> {
    const stats = await GamificationStats.findOne({ userId });
    if (!stats) return [];
    
    return stats.pokemonCollection.filter((pokemon: IPokemonReward) => !pokemon.isViewed);
  }

  static async markRewardsAsViewed(userId: string, rewardIds: string[]): Promise<void> {
    const stats = await GamificationStats.findOne({ userId });
    if (!stats) return;
    
    stats.pokemonCollection.forEach((pokemon: IPokemonReward) => {
      if (rewardIds.includes(pokemon.id)) {
        pokemon.isViewed = true;
      }
    });
    
    await stats.save();
  }

  static async handlePomodoroCompletion(userId: string, pomodoroCount: number): Promise<RewardResult[]> {
    const stats = await this.initializeUserStats(userId);
    const rewards: RewardResult[] = [];
    
    // Find Pokemon that can evolve and update their progress
    for (const pokemon of stats.pokemonCollection) {
      if (pokemon.canEvolve && pokemon.evolutionRequirement) {
        pokemon.evolutionRequirement.completed += pomodoroCount;
        
        // Check if Pokemon can evolve now
        if (pokemon.evolutionRequirement.completed >= pokemon.evolutionRequirement.amount) {
          try {
            const evolutionReward = await this.evolvePokemon(userId, pokemon.pokemonId);
            if (evolutionReward) {
              rewards.push(evolutionReward);
              
              // Mark original Pokemon as no longer able to evolve
              pokemon.canEvolve = false;
            }
          } catch (error) {
            console.error('Evolution error:', error);
          }
        }
      }
    }
    
    await stats.save();
    return rewards;
  }

  static async evolvePokemon(userId: string, pokemonId: number): Promise<RewardResult | null> {
    try {
      const evolutionTrigger: RewardTrigger = {
        type: 'pomodoro_evolution',
        value: 1,
        pokemonId
      };
      
      const pokemon = await PokemonService.generateReward(evolutionTrigger);
      const experienceGained = PokemonService.getExperienceForCompletion(pokemon.rarity);
      
      const stats = await this.initializeUserStats(userId);
      
      // Create evolution reward entry
      const pokemonReward = new PokemonReward({
        userId,
        pokemonId: pokemon.id,
        pokemonName: pokemon.name,
        pokemonImage: pokemon.image,
        pokemonType: pokemon.types,
        triggerType: 'pomodoro_evolution',
        triggerValue: 1,
        rarity: pokemon.rarity,
        isViewed: false,
        evolutionStage: pokemon.evolutionStage,
        canEvolve: pokemon.canEvolve,
        evolutionRequirement: pokemon.canEvolve ? {
          type: 'pomodoro',
          amount: pokemon.evolutionRequirement?.amount || 10,
          completed: 0
        } : undefined,
        parentPokemonId: pokemonId
      });

      // Add to collection
      stats.pokemonCollection.push(pokemonReward as IPokemonReward);
      stats.totalPokemonCaught += 1;
      
      // Add experience
      const oldLevel = stats.level;
      stats.experience += experienceGained;
      stats.level = PokemonService.getLevelFromExperience(stats.experience);
      
      const levelUp = stats.level > oldLevel;
      
      await stats.save();

      return {
        pokemon,
        isNewReward: true,
        experienceGained,
        levelUp,
        newLevel: levelUp ? stats.level : undefined,
        achievement: {
          name: 'Evolution Master',
          description: `${pokemon.name} evolved through Pomodoro training!`,
          icon: '🔥'
        }
      };
    } catch (error) {
      console.error('Error evolving Pokemon:', error);
      return null;
    }
  }

  static async getPokemonThatCanEvolve(userId: string): Promise<IPokemonReward[]> {
    const stats = await GamificationStats.findOne({ userId });
    if (!stats) return [];
    
    return stats.pokemonCollection.filter((pokemon: IPokemonReward) =>
      pokemon.canEvolve && pokemon.evolutionRequirement
    );
  }

  static async addAchievement(userId: string, achievement: {
    name: string;
    description: string;
    icon: string;
    unlockedAt: Date;
  }): Promise<void> {
    try {
      const stats = await GamificationStats.findOne({ userId });
      if (!stats) {
        throw new Error('User stats not found');
      }

      // Check if achievement already exists
      const existingAchievement = stats.achievements.find((a: { name: string }) => a.name === achievement.name);
      if (existingAchievement) {
        return; // Already has this achievement
      }

      // Add the achievement
      stats.achievements.push(achievement);
      await stats.save();
    } catch (error) {
      console.error('Error adding achievement:', error);
      throw error;
    }
  }
}
