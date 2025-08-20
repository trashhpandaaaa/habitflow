'use client';

import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function WelcomeRedirect() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [isProcessingReward, setIsProcessingReward] = useState(false);

  useEffect(() => {
    const processNewUser = async () => {
      if (isLoaded && user) {
        // Check if user just signed up (less than 5 minutes ago)
        const userCreatedAt = user.createdAt ? new Date(user.createdAt) : new Date();
        const now = new Date();
        const timeDiff = now.getTime() - userCreatedAt.getTime();
        const minutesDiff = Math.floor(timeDiff / (1000 * 60));

        if (minutesDiff <= 5) {
          // New user - process signup reward
          setIsProcessingReward(true);
          
          try {
            const response = await fetch('/api/gamification/signup', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
            });

            if (response.ok) {
              const data = await response.json();
              console.log('Signup reward processed:', data);
            }
          } catch (error) {
            console.error('Error processing signup reward:', error);
          }
          
          setIsProcessingReward(false);
          // Redirect to dashboard with welcome message and potential Pokemon reward
          router.push('/?welcome=true&newUser=true');
        } else {
          // Existing user, just go to dashboard
          router.push('/');
        }
      }
    };

    processNewUser();
  }, [isLoaded, user, router]);

  if (!isLoaded || isProcessingReward) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {isProcessingReward ? 'Preparing your welcome gift...' : 'Setting up your account...'}
          </p>
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
