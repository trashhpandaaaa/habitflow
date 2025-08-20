import mongoose, { Document, Schema } from 'mongoose';

export interface IHabit extends Document {
  userId: string; // Changed to string for Clerk ID
  name: string;
  description?: string;
  category: string;
  targetCount: number;
  frequency: 'daily' | 'weekly' | 'monthly';
  completedCount: number;
  currentStreak: number;
  bestStreak: number;
  completedToday: boolean;
  lastCompletedAt?: Date;
  reminderTime?: string; // Time in HH:MM format (e.g., "09:00", "14:30")
  color?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const HabitSchema = new Schema<IHabit>({
  userId: {
    type: String, // Changed to String for Clerk ID
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500,
  },
  category: {
    type: String,
    required: true,
    enum: ['health', 'fitness', 'productivity', 'learning', 'mindfulness', 'social', 'creativity', 'finance', 'other'],
    default: 'other',
  },
  targetCount: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
  },
  frequency: {
    type: String,
    required: true,
    enum: ['daily', 'weekly', 'monthly'],
    default: 'daily',
  },
  completedCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  currentStreak: {
    type: Number,
    default: 0,
    min: 0,
  },
  bestStreak: {
    type: Number,
    default: 0,
    min: 0,
  },
  completedToday: {
    type: Boolean,
    default: false,
  },
  lastCompletedAt: {
    type: Date,
  },
  reminderTime: {
    type: String,
    required: false,
    validate: {
      validator: function(v: string) {
        if (!v) return true; // Allow empty/undefined
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v); // HH:MM format
      },
      message: 'Reminder time must be in HH:MM format (e.g., 09:00, 14:30)'
    }
  },
  color: {
    type: String,
    default: '#3B82F6',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Index for efficient queries
HabitSchema.index({ userId: 1, isActive: 1 });
HabitSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.Habit || mongoose.model<IHabit>('Habit', HabitSchema);
