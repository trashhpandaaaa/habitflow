"use client";

import { Footer } from "./footer";
import { Navbar } from "./navbar";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface Props {
    children: React.ReactNode;
};

function AuthFallback() {
  const router = useRouter();
  
  useEffect(() => {
    router.push('/sign-in');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">HabitFlow</h1>
          <p className="text-muted-foreground mt-2">
            Redirecting to sign in...
          </p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mt-4"></div>
        </div>
      </div>
    </div>
  );
}

const Layout = ({children}: Props) => { 
    const { isLoaded, isSignedIn } = useAuth();

    console.log('Layout auth state:', { isLoaded, isSignedIn });

    if (!isLoaded) {
      console.log('Auth not loaded yet');
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      );
    }

    if (!isSignedIn) {
      console.log('User not signed in, redirecting to sign-in');
      return <AuthFallback />;
    }

    console.log('User is signed in, rendering app');
    return (
        <div className="flex flex-col min-h-screen">
            <Navbar />
            <div className="flex-1 bg-[#F4F4F0]">
                {children}
            </div>
            <Footer />
        </div>
    );
};

export default Layout;
