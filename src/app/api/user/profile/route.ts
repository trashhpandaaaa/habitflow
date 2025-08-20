import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/mongoose';
import User from '@/models/User';

// Get user profile
export async function GET() {
  try {
    const { userId } = await auth();
    const clerkUser = await currentUser();
    
    console.log('Clerk auth userId:', userId);
    console.log('Clerk user data:', {
      id: clerkUser?.id,
      firstName: clerkUser?.firstName,
      lastName: clerkUser?.lastName,
      emailAddresses: clerkUser?.emailAddresses?.map(e => e.emailAddress),
      fullName: clerkUser?.fullName
    });
    
    if (!userId || !clerkUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    // Find or create user in our database
    let user = await User.findOne({ clerkId: userId });
    
    if (!user) {
      // Create user if doesn't exist
      const firstName = clerkUser.firstName || '';
      const lastName = clerkUser.lastName || '';
      const email = clerkUser.emailAddresses?.[0]?.emailAddress || clerkUser.primaryEmailAddress?.emailAddress || '';
      
      // Try different ways to get the name
      let fullName = '';
      if (clerkUser.fullName) {
        fullName = clerkUser.fullName;
      } else if (firstName || lastName) {
        fullName = [firstName, lastName].filter(Boolean).join(' ');
      } else {
        fullName = email.split('@')[0] || 'User'; // Use email prefix as fallback
      }

      console.log('Creating user with data:', { fullName, email, firstName, lastName });
      
      user = new User({
        clerkId: userId,
        name: fullName,
        email: email,
        settings: {
          darkMode: false,
          notifications: true,
          reminderTime: '09:00'
        }
      });
      await user.save();
      console.log('Created new user:', user.name, 'Email:', user.email, 'for Clerk ID:', userId);
    } else {
      console.log('Found existing user:', user.name, 'Email:', user.email, 'for Clerk ID:', userId);
      
      // Update user data if Clerk data is more complete
      const firstName = clerkUser.firstName || '';
      const lastName = clerkUser.lastName || '';
      const email = clerkUser.emailAddresses?.[0]?.emailAddress || clerkUser.primaryEmailAddress?.emailAddress || '';
      
      let shouldUpdate = false;
      const updates: { name?: string; email?: string } = {};
      
      // Update name if current name is just "User" and we have better data
      if (user.name === 'User' || !user.name) {
        let fullName = '';
        if (clerkUser.fullName) {
          fullName = clerkUser.fullName;
        } else if (firstName || lastName) {
          fullName = [firstName, lastName].filter(Boolean).join(' ');
        } else if (email) {
          fullName = email.split('@')[0];
        }
        
        if (fullName && fullName !== 'User') {
          updates.name = fullName;
          shouldUpdate = true;
        }
      }
      
      // Update email if we don't have one or have a better one
      if (!user.email && email) {
        updates.email = email;
        shouldUpdate = true;
      }
      
      if (shouldUpdate) {
        console.log('Updating user with:', updates);
        user = await User.findOneAndUpdate(
          { clerkId: userId },
          updates,
          { new: true }
        );
        console.log('Updated user:', user?.name, 'Email:', user?.email);
      }
    }

    return NextResponse.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        joinDate: user.createdAt,
        preferences: user.settings,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update user profile
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const { name, preferences } = await request.json();

    const user = await User.findOneAndUpdate(
      { clerkId: userId },
      { 
        name: name || undefined,
        settings: preferences || undefined,
      },
      { new: true, runValidators: true }
    );

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        joinDate: user.createdAt,
        preferences: user.settings,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
