import mongoose, { Document, Schema } from 'mongoose';

export interface IPomodoroSession extends Document {
  userId: string; // Changed to string for Clerk ID
  sessionType: 'work' | 'break' | 'longBreak';
  duration: number; // in minutes
  completedAt: Date;
  date: string; // Changed to string for YYYY-MM-DD format
  createdAt: Date;
  updatedAt: Date;
}

const PomodoroSessionSchema = new Schema<IPomodoroSession>({
  userId: {
    type: String, // Changed to String for Clerk ID
    required: true,
    index: true,
  },
  sessionType: {
    type: String,
    required: true,
    enum: ['work', 'break', 'longBreak'],
  },
  duration: {
    type: Number,
    required: true,
    min: 1,
  },
  completedAt: {
    type: Date,
    default: Date.now,
  },
  date: {
    type: String, // Changed to String for YYYY-MM-DD format
    required: true,
  },
}, {
  timestamps: true,
});

// Indexes for efficient queries
PomodoroSessionSchema.index({ userId: 1, date: -1 });
PomodoroSessionSchema.index({ userId: 1, sessionType: 1, date: -1 });

export default mongoose.models.PomodoroSession || mongoose.model<IPomodoroSession>('PomodoroSession', PomodoroSessionSchema);
