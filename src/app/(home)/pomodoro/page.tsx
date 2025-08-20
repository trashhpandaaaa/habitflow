"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PomodoroTimer, PomodoroSettings, PomodoroStats } from "@/components/pomodoro-timer";
import { Settings, TrendingUp, Clock, Target } from "lucide-react";

export default function PomodoroPage() {
  const [stats, setStats] = useState<PomodoroStats>({
    totalSessions: 0,
    totalWorkTime: 0,
    totalBreakTime: 0,
    sessionsToday: 0,
    currentStreak: 0,
  });

  const [settings] = useState<PomodoroSettings>({
    workDuration: 25,
    breakDuration: 5,
    longBreakDuration: 15,
    sessionsUntilLongBreak: 4,
  });

  useEffect(() => {
    // Load stats from API on mount - handled by the timer component
    // Future: Load user's pomodoro statistics from the API
  }, []);

  const handleStatsUpdate = (newStats: PomodoroStats) => {
    setStats(newStats);
  };

  const handleSessionComplete = (sessionType: 'work' | 'break' | 'longBreak', duration: number) => {
    // You can add additional logic here, like habit completion tracking
    console.log(`${sessionType} session completed: ${duration} minutes`);
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Pomodoro Timer</h1>
          <p className="text-muted-foreground mt-2">
            Stay focused and productive with the Pomodoro Technique
          </p>
        </div>
        <Button variant="outline">
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </div>

      {/* Main Timer Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Pomodoro Timer */}
        <div className="lg:col-span-2">
          <PomodoroTimer
            settings={settings}
            onSessionComplete={handleSessionComplete}
            onStatsUpdate={handleStatsUpdate}
            className="w-full"
          />
        </div>

        {/* Quick Stats */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Today&apos;s Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Sessions</span>
                <Badge variant="secondary">{stats.sessionsToday}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Work Time</span>
                <Badge variant="secondary">{formatTime(stats.totalWorkTime)}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Break Time</span>
                <Badge variant="secondary">{formatTime(stats.totalBreakTime)}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Current Streak</span>
                <Badge variant="secondary">{stats.currentStreak}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Technique Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <Target className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <p>Focus on one task during work sessions</p>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <p>Take breaks to maintain productivity</p>
              </div>
              <div className="flex items-start gap-2">
                <TrendingUp className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                <p>Track your progress and celebrate wins</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSessions}</div>
            <p className="text-xs text-muted-foreground">
              All time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Work Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTime(stats.totalWorkTime)}</div>
            <p className="text-xs text-muted-foreground">
              Total focused time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Break Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTime(stats.totalBreakTime)}</div>
            <p className="text-xs text-muted-foreground">
              Total break time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.currentStreak}</div>
            <p className="text-xs text-muted-foreground">
              Consecutive sessions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* How it Works */}
      <Card>
        <CardHeader>
          <CardTitle>How the Pomodoro Technique Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-red-100 text-red-800 rounded-full flex items-center justify-center mx-auto">
                1
              </div>
              <h3 className="font-semibold">Work Session</h3>
              <p className="text-sm text-muted-foreground">
                Focus on a single task for 25 minutes
              </p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-green-100 text-green-800 rounded-full flex items-center justify-center mx-auto">
                2
              </div>
              <h3 className="font-semibold">Short Break</h3>
              <p className="text-sm text-muted-foreground">
                Take a 5-minute break to recharge
              </p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-red-100 text-red-800 rounded-full flex items-center justify-center mx-auto">
                3
              </div>
              <h3 className="font-semibold">Repeat</h3>
              <p className="text-sm text-muted-foreground">
                Continue work sessions and short breaks
              </p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center mx-auto">
                4
              </div>
              <h3 className="font-semibold">Long Break</h3>
              <p className="text-sm text-muted-foreground">
                After 4 sessions, take a 15-minute break
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
