import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  clerkId: string; // Clerk user ID
  email: string;
  name: string;
  imageUrl?: string;
  joinDate: Date;
  settings: {
    darkMode: boolean;
    notifications: boolean;
    reminderTime: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  clerkId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  email: {
    type: String,
    required: false, // Made optional since webhooks will populate this
    lowercase: true,
    trim: true,
    default: '', // Default empty string
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  imageUrl: {
    type: String,
    required: false,
  },
  joinDate: {
    type: Date,
    default: Date.now,
  },
  settings: {
    darkMode: {
      type: Boolean,
      default: false,
    },
    notifications: {
      type: Boolean,
      default: true,
    },
    reminderTime: {
      type: String,
      default: '09:00',
    },
  },
}, {
  timestamps: true,
});

// Prevent re-compilation during development
export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
