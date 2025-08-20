import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
  className?: string;
  width?: string;
  height?: string;
  variant?: 'text' | 'circular' | 'rectangular';
}

export function LoadingSkeleton({ 
  className, 
  width = "100%", 
  height = "1rem",
  variant = "rectangular"
}: LoadingSkeletonProps) {
  const variantClasses = {
    text: "h-4",
    circular: "rounded-full aspect-square",
    rectangular: "rounded-md"
  };

  return (
    <div 
      className={cn(
        "loading-skeleton animate-pulse bg-gray-200",
        variantClasses[variant],
        className
      )}
      style={{ width, height: variant === 'circular' ? width : height }}
      aria-label="Loading..."
    />
  );
}

export function HabitCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <LoadingSkeleton width="60%" height="1.5rem" />
        <LoadingSkeleton variant="circular" width="2rem" />
      </div>
      <LoadingSkeleton width="80%" height="1rem" />
      <div className="flex items-center gap-4">
        <LoadingSkeleton width="4rem" height="1rem" />
        <LoadingSkeleton width="4rem" height="1rem" />
      </div>
      <LoadingSkeleton width="100%" height="0.5rem" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header skeleton */}
      <div className="space-y-4">
        <LoadingSkeleton width="40%" height="2rem" />
        <LoadingSkeleton width="60%" height="1rem" />
      </div>
      
      {/* Stats cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 space-y-3">
            <LoadingSkeleton width="50%" height="1rem" />
            <LoadingSkeleton width="30%" height="2rem" />
          </div>
        ))}
      </div>
      
      {/* Habits grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <HabitCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
