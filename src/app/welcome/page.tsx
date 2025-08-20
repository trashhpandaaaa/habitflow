'use client';

import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function WelcomeRedirect() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && user) {
      // Check if user just signed up (less than 5 minutes ago)
      const userCreatedAt = new Date(user.createdAt);
      const now = new Date();
      const timeDiff = now.getTime() - userCreatedAt.getTime();
      const minutesDiff = Math.floor(timeDiff / (1000 * 60));

      if (minutesDiff <= 5) {
        // New user, redirect to dashboard with welcome message
        router.push('/?welcome=true');
      } else {
        // Existing user, just go to dashboard
        router.push('/');
      }
    }
  }, [isLoaded, user, router]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Setting up your account...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Welcome! Redirecting you to your dashboard...</p>
      </div>
    </div>
  );
}
