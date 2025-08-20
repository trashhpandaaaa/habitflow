import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 sm:space-y-8">
        <div className="text-center">
          <h2 className="mt-4 sm:mt-6 text-2xl sm:text-3xl font-bold text-gray-900">
            Join HabitFlow
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Create your account to start building better habits
          </p>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
          <SignUp 
            routing="hash"
            redirectUrl="/welcome"
            signInUrl="/sign-in"
            appearance={{
              elements: {
                formButtonPrimary: 
                  "bg-primary text-primary-foreground hover:bg-primary/90 text-sm normal-case",
                card: "shadow-none border-none p-0",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
