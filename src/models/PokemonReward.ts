import mongoose, { Document, Schema } from 'mongoose';

export interface IPokemonReward extends Document {
  userId: string;
  pokemonId: number;
  pokemonName: string;
  pokemonImage: string;
  pokemonType: string[];
  unlockedAt: Date;
  triggerType: 'streak' | 'completion' | 'milestone' | 'perfect_week' | 'perfect_month' | 'pomodoro_evolution' | 'signup' | 'first_habit';
  triggerValue: number; // streak count, completion count, etc.
  habitId?: string; // specific habit that triggered the reward
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'shiny';
  isViewed: boolean;
  evolutionStage: 1 | 2 | 3;
  canEvolve: boolean;
  evolutionRequirement?: {
    type: 'pomodoro';
    amount: number;
    completed: number;
  };
  parentPokemonId?: number; // If this is an evolution, track the original
}

export interface IGamificationStats extends Document {
  userId: string;
  level: number;
  experience: number;
  totalPokemonCaught: number;
  pokemonCollection: IPokemonReward[];
  achievements: {
    name: string;
    description: string;
    unlockedAt: Date;
    icon: string;
  }[];
  currentTitle: string;
  availableTitles: string[];
  stats: {
    totalHabitsCompleted: number;
    longestStreak: number;
    perfectDays: number;
    perfectWeeks: number;
    perfectMonths: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const PokemonRewardSchema = new Schema<IPokemonReward>({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  pokemonId: {
    type: Number,
    required: true,
  },
  pokemonName: {
    type: String,
    required: true,
  },
  pokemonImage: {
    type: String,
    required: true,
  },
  pokemonType: [{
    type: String,
    required: true,
  }],
  unlockedAt: {
    type: Date,
    default: Date.now,
  },
  triggerType: {
    type: String,
    required: true,
    enum: ['streak', 'completion', 'milestone', 'perfect_week', 'perfect_month', 'pomodoro_evolution'],
  },
  triggerValue: {
    type: Number,
    required: true,
  },
  habitId: {
    type: String,
    required: false,
  },
  rarity: {
    type: String,
    required: true,
    enum: ['common', 'uncommon', 'rare', 'epic', 'legendary', 'shiny'],
    default: 'common',
  },
  isViewed: {
    type: Boolean,
    default: false,
  },
  evolutionStage: {
    type: Number,
    required: true,
    enum: [1, 2, 3],
    default: 1,
  },
  canEvolve: {
    type: Boolean,
    default: false,
  },
  evolutionRequirement: {
    type: {
      type: String,
      enum: ['pomodoro'],
    },
    amount: Number,
    completed: {
      type: Number,
      default: 0,
    },
  },
  parentPokemonId: {
    type: Number,
    required: false,
  },
}, {
  timestamps: true,
});

const GamificationStatsSchema = new Schema<IGamificationStats>({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  level: {
    type: Number,
    default: 1,
    min: 1,
  },
  experience: {
    type: Number,
    default: 0,
    min: 0,
  },
  totalPokemonCaught: {
    type: Number,
    default: 0,
    min: 0,
  },
  pokemonCollection: [PokemonRewardSchema],
  achievements: [{
    name: String,
    description: String,
    unlockedAt: Date,
    icon: String,
  }],
  currentTitle: {
    type: String,
    default: 'Beginner Trainer',
  },
  availableTitles: [{
    type: String,
  }],
  stats: {
    totalHabitsCompleted: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    perfectDays: { type: Number, default: 0 },
    perfectWeeks: { type: Number, default: 0 },
    perfectMonths: { type: Number, default: 0 },
  },
}, {
  timestamps: true,
});

// Indexes for efficient queries
PokemonRewardSchema.index({ userId: 1, unlockedAt: -1 });
PokemonRewardSchema.index({ userId: 1, isViewed: 1 });
GamificationStatsSchema.index({ userId: 1 });

export const PokemonReward = mongoose.models.PokemonReward || mongoose.model<IPokemonReward>('PokemonReward', PokemonRewardSchema);
export const GamificationStats = mongoose.models.GamificationStats || mongoose.model<IGamificationStats>('GamificationStats', GamificationStatsSchema);
