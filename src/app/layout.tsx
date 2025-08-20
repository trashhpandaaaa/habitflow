import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs';
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HabitFlow - Habit Tracker & Pomodoro",
  description: "Track your habits and boost productivity with Pomodoro timer.",
};

// Setup guide component for when Clerk isn't configured
function ClerkSetupGuide() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m0 0a2 2 0 012 2m-2-2a2 2 0 00-2 2m2-2V5a2 2 0 00-2-2" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to HabitFlow!
          </h1>
          <p className="text-lg text-gray-600">
            Let's set up your authentication system to get started
          </p>
        </div>

        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Setup Steps:</h2>
            <ol className="space-y-3 text-gray-700">
              <li className="flex items-start">
                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">1</span>
                <div>
                  <p className="font-medium">Create a Clerk account</p>
                  <a href="https://dashboard.clerk.com" target="_blank" className="text-blue-600 hover:underline text-sm">
                    Go to dashboard.clerk.com →
                  </a>
                </div>
              </li>
              <li className="flex items-start">
                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">2</span>
                <div>
                  <p className="font-medium">Create a new application</p>
                  <p className="text-sm text-gray-600">Choose "Next.js" as your framework</p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">3</span>
                <div>
                  <p className="font-medium">Copy your API keys</p>
                  <p className="text-sm text-gray-600">From the "API Keys" section in your Clerk dashboard</p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">4</span>
                <div>
                  <p className="font-medium">Update your .env.local file</p>
                  <div className="bg-gray-900 text-green-400 p-3 rounded-lg text-xs font-mono mt-2 overflow-x-auto">
                    <p>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here</p>
                    <p>CLERK_SECRET_KEY=sk_test_your_key_here</p>
                  </div>
                </div>
              </li>
              <li className="flex items-start">
                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">5</span>
                <div>
                  <p className="font-medium">Restart the development server</p>
                  <p className="text-sm text-gray-600">Run: <code className="bg-gray-100 px-1 rounded">npm run dev</code></p>
                </div>
              </li>
            </ol>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-yellow-800">Current Status</p>
                <p className="text-sm text-yellow-700">
                  Clerk keys are not configured. Please follow the steps above to set up authentication.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Check if Clerk is properly configured
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const isClerkConfigured = publishableKey && 
    !publishableKey.includes('your_clerk_publishable_key_here') &&
    !publishableKey.includes('your_actual_publishable_key_here') &&
    publishableKey.startsWith('pk_');

  if (!isClerkConfigured) {
    return (
      <html lang="en">
        <body className={`${dmSans.className} antialiased`}>
          <ClerkSetupGuide />
        </body>
      </html>
    );
  }

  return (
    <ClerkProvider
      afterSignInUrl="/"
      afterSignUpUrl="/welcome"
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
    >
      <html lang="en">
        <body className={`${dmSans.className} antialiased`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
