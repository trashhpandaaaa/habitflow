"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiService, ApiHabit } from "@/services/api";
import { Habit } from "@/components/habit-card";
import { TrendingUp, Target, Award, BarChart3, Download } from "lucide-react";

// Convert ApiHabit to Habit format
const convertApiHabitToHabit = (apiHabit: ApiHabit): Habit => {
  if (!apiHabit || !apiHabit._id) {
    throw new Error('Invalid habit data: missing required fields');
  }
  
  return {
    id: apiHabit._id,
    name: apiHabit.name || '',
    description: apiHabit.description || '',
    category: apiHabit.category || 'general',
    targetCount: apiHabit.target || 1,
    frequency: apiHabit.frequency || 'daily',
    completedToday: apiHabit.completedToday || false,
    currentStreak: apiHabit.currentStreak || 0,
    bestStreak: apiHabit.bestStreak || 0,
    completedCount: 0, // This would need to be calculated from completions
    createdAt: new Date(apiHabit.createdAt),
    lastCompletedAt: undefined, // Would need to be calculated
    color: apiHabit.color || '#3B82F6' // Default color
  };
};

interface Stats {
  totalHabits: number;
  activeHabits: number;
  totalCompletions: number;
  completionsByDay: Record<string, number>;
  currentStreaks: number;
  totalPomodoroTime: number;
  pomodorosByDay: Record<string, number>;
  period?: {
    days: number;
    startDate: string;
    endDate: string;
  };
}

export default function StatisticsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [habitsResponse, statsResponse] = await Promise.all([
        apiService.getHabits(),
        apiService.getStatistics()
      ]);
      
      // Handle habits response
      if (habitsResponse.success && habitsResponse.data) {
        const apiHabits = habitsResponse.data.habits || [];
        const convertedHabits = apiHabits.map(convertApiHabitToHabit);
        setHabits(convertedHabits);
      } else {
        console.error('Failed to load habits:', habitsResponse.error);
        setHabits([]);
      }

      // Handle stats response
      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data);
      } else {
        console.error('Failed to load statistics:', statsResponse.error);
        setStats(null);
      }
    } catch (error) {
      console.error('Failed to load statistics:', error);
      setHabits([]); // Ensure habits is always an array
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading statistics...</p>
          </div>
        </div>
      </div>
    );
  }

  // Safety check: ensure habits is always an array
  const safeHabits = Array.isArray(habits) ? habits : [];
  const completedToday = safeHabits.filter(h => h.completedToday).length;
  const completionRate = safeHabits.length > 0 ? Math.round((completedToday / safeHabits.length) * 100) : 0;

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Statistics</h1>
          <p className="text-muted-foreground mt-2">
            Track your progress and analyze your habit patterns
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Habits</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalHabits || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.activeHabits || 0} active habits
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate}%</div>
            <p className="text-xs text-muted-foreground">
              {completedToday}/{safeHabits.length} completed today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Completions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalCompletions || 0}</div>
            <p className="text-xs text-muted-foreground">
              All time completions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Streaks</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.currentStreaks || 0}</div>
            <p className="text-xs text-muted-foreground">
              Current habit streaks
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Habits List */}
      {safeHabits.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Habits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {safeHabits.map((habit) => (
                <div key={habit.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="font-semibold">{habit.name}</div>
                      <div className="text-sm text-muted-foreground capitalize">
                        {habit.category} • {habit.frequency}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <div className="font-semibold text-orange-600">{habit.currentStreak}</div>
                      <div className="text-xs text-muted-foreground">Streak</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-purple-600">{habit.bestStreak}</div>
                      <div className="text-xs text-muted-foreground">Best</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-blue-600">{habit.completedCount}</div>
                      <div className="text-xs text-muted-foreground">Total</div>
                    </div>
                    <Badge variant={habit.completedToday ? "default" : "secondary"}>
                      {habit.completedToday ? "Done" : "Pending"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {safeHabits.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center space-y-4">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto" />
              <div>
                <h3 className="text-lg font-semibold">No data to display</h3>
                <p className="text-muted-foreground">
                  Start tracking habits to see your statistics here!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
