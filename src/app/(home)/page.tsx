"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Target, TrendingUp, Calendar, Timer, Sparkles } from "lucide-react";
import Link from "next/link";
import { apiService, ApiHabit } from "@/services/api";

export default function Dashboard() {
  const { user, isLoaded } = useUser();
  const searchParams = useSearchParams();
  const [habits, setHabits] = useState<ApiHabit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    if (isLoaded && user) {
      loadHabits();
      // Check if this is a welcome redirect
      if (searchParams.get('welcome') === 'true') {
        setShowWelcome(true);
      }
    }
  }, [isLoaded, user, searchParams]);

  const loadHabits = async () => {
    const response = await apiService.getHabits();
    if (response.success && response.data) {
      setHabits(response.data.habits);
    } else {
      console.error('Failed to load habits:', response.error);
    }
    setLoading(false);
  };

  const handleToggleComplete = async (habitId: string) => {
    const response = await apiService.toggleHabitCompletion(habitId);
    if (response.success) {
      // Reload habits to get updated data
      await loadHabits();
    } else {
      console.error('Failed to toggle habit:', response.error);
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your habits...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in to continue</h1>
          <Link href="/sign-in">
            <Button>Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Calculate dashboard stats
  const totalHabits = habits.length;
  const completedToday = habits.filter(h => h.completedToday).length;
  const completionRate = totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0;
  const totalStreak = habits.reduce((sum, h) => sum + h.currentStreak, 0);
  const avgStreak = totalHabits > 0 ? Math.round(totalStreak / totalHabits) : 0;

  // Get today's habits (limit to 6 for dashboard view)
  const todaysHabits = habits.slice(0, 6);

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Welcome Message for New Users */}
      {showWelcome && (
        <Alert className="border-green-200 bg-green-50">
          <Sparkles className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <div className="flex items-center justify-between">
              <div>
                <strong>Welcome to HabitFlow!</strong> 🎉 Your account is ready. 
                Start by creating your first habit to begin tracking your progress.
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowWelcome(false)}
                className="text-green-600 hover:text-green-800"
              >
                ✕
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            Welcome back{user.firstName ? `, ${user.firstName}` : ''}!
          </h1>
          <p className="text-muted-foreground mt-2">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        <div className="flex gap-3">
          <Button asChild>
            <Link href="/habits/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Habit
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/pomodoro">
              <Timer className="h-4 w-4 mr-2" />
              Pomodoro
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Progress</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedToday}/{totalHabits}</div>
            <Progress value={completionRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {completionRate}% completion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Habits</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHabits}</div>
            <p className="text-xs text-muted-foreground">
              Active habits tracked
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Streak</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgStreak}</div>
            <p className="text-xs text-muted-foreground">
              Days on average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Best Streak</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.max(...habits.map(h => h.bestStreak), 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Personal best
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Habits */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Today&apos;s Habits</h2>
          {habits.length > 6 && (
            <Button variant="outline" asChild>
              <Link href="/habits">View All</Link>
            </Button>
          )}
        </div>

        {habits.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="text-center space-y-4">
                <Target className="h-12 w-12 text-muted-foreground mx-auto" />
                <div>
                  <h3 className="text-lg font-semibold">No habits yet</h3>
                  <p className="text-muted-foreground">
                    Start building better habits by creating your first one!
                  </p>
                </div>
                <Button asChild>
                  <Link href="/habits/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Habit
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {todaysHabits.map((habit) => (
              <Card key={habit._id} className={`transition-all hover:shadow-md ${habit.completedToday ? 'ring-2 ring-green-500/20 bg-green-50/50' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold line-clamp-1">
                        {habit.name}
                      </CardTitle>
                      {habit.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {habit.description}
                        </p>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600 capitalize">
                        {habit.category} • {habit.frequency}
                      </div>
                      <div className="text-sm font-medium">
                        {habit.currentStreak} day streak
                      </div>
                    </div>

                    <Button
                      onClick={() => handleToggleComplete(habit._id)}
                      variant={habit.completedToday ? "default" : "outline"}
                      className="w-full"
                    >
                      {habit.completedToday ? "Completed ✓" : "Mark as Done"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-20" asChild>
              <Link href="/habits" className="flex flex-col items-center gap-2">
                <Target className="h-6 w-6" />
                <span>View All Habits</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-20" asChild>
              <Link href="/statistics" className="flex flex-col items-center gap-2">
                <TrendingUp className="h-6 w-6" />
                <span>View Statistics</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-20" asChild>
              <Link href="/pomodoro" className="flex flex-col items-center gap-2">
                <Timer className="h-6 w-6" />
                <span>Start Pomodoro</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}