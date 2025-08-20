import mongoose, { Document, Schema } from 'mongoose';

export interface IHabitCompletion extends Document {
  userId: string; // Clerk user ID
  habitId: mongoose.Types.ObjectId; // Reference to Habit model
  date: string; // Date of completion (YYYY-MM-DD format)
  completedAt: Date; // Exact timestamp of completion
  count: number; // Number of times completed on this date (for habits with targetCount > 1)
  createdAt: Date;
  updatedAt: Date;
}

const HabitCompletionSchema = new Schema<IHabitCompletion>({
  userId: {
    type: String, // Changed to String for Clerk ID
    required: true,
    index: true,
  },
  habitId: {
    type: Schema.Types.ObjectId, // Reference to Habit model
    ref: 'Habit',
    required: true,
    index: true,
  },
  date: {
    type: String, // Changed to String for YYYY-MM-DD format
    required: true,
  },
  completedAt: {
    type: Date,
    default: Date.now,
  },
  count: {
    type: Number,
    default: 1,
    min: 1,
  },
}, {
  timestamps: true,
});

// Compound index to ensure one completion record per habit per day per user
HabitCompletionSchema.index({ userId: 1, habitId: 1, date: 1 }, { unique: true });
HabitCompletionSchema.index({ userId: 1, date: -1 });
HabitCompletionSchema.index({ habitId: 1, date: -1 });

export default mongoose.models.HabitCompletion || mongoose.model<IHabitCompletion>('HabitCompletion', HabitCompletionSchema);
