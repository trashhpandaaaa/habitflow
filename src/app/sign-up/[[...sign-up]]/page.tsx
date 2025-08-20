import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Join HabitFlow
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Create your account to start building better habits
          </p>
        </div>
        <SignUp 
          routing="hash"
          redirectUrl="/welcome"
          signInUrl="/sign-in"
          appearance={{
            elements: {
              formButtonPrimary: 
                "bg-primary text-primary-foreground hover:bg-primary/90 text-sm normal-case",
            },
          }}
        />
      </div>
    </div>
  );
}
