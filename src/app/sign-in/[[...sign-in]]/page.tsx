import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Welcome back to HabitFlow
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to continue tracking your habits
          </p>
        </div>
        <SignIn 
          routing="hash"
          redirectUrl="/"
          signUpUrl="/sign-up"
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
