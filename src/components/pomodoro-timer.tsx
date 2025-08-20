"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, Square, RotateCcw, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";
import { PokemonSelector } from './pokemon-selector';
import { PokemonRewardPopup } from './pokemon-reward-popup';
import Image from "next/image";

export type SessionType = 'work' | 'break' | 'longBreak';

interface Pokemon {
  id: number;
  name: string;
  imageUrl: string;
  type: string[];
  canEvolve: boolean;
  evolutionTarget?: {
    id: number;
    name: string;
    imageUrl: string;
  };
}

interface PokemonReward {
  id: number;
  name: string;
  imageUrl: string;
  type: string[];
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  isEvolution: boolean;
  evolutionStage?: number;
  reason?: string;
}

export interface PomodoroSettings {
  workDuration: number; // in minutes
  breakDuration: number; // in minutes
  longBreakDuration: number; // in minutes
  sessionsUntilLongBreak: number;
}

export interface PomodoroStats {
  totalSessions: number;
  totalWorkTime: number; // in minutes
  totalBreakTime: number; // in minutes
  sessionsToday: number;
  currentStreak: number;
}

interface PomodoroTimerProps {
  settings?: PomodoroSettings;
  onSessionComplete?: (sessionType: SessionType, duration: number) => void;
  onStatsUpdate?: (stats: PomodoroStats) => void;
  className?: string;
}

const DEFAULT_SETTINGS: PomodoroSettings = {
  workDuration: 25,
  breakDuration: 5,
  longBreakDuration: 15,
  sessionsUntilLongBreak: 4,
};

export function PomodoroTimer({
  settings = DEFAULT_SETTINGS,
  onSessionComplete,
  onStatsUpdate,
  className
}: PomodoroTimerProps) {
  const { user } = useUser();
  const [currentSession, setCurrentSession] = useState<SessionType>('work');
  const [timeLeft, setTimeLeft] = useState(settings.workDuration * 60); // in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [selectedPokemon, setSelectedPokemon] = useState<Pokemon | null>(null);
  const [showPokemonSelector, setShowPokemonSelector] = useState(false);
  const [rewardPokemon, setRewardPokemon] = useState<PokemonReward | null>(null);
  const [showRewardPopup, setShowRewardPopup] = useState(false);
  const [stats, setStats] = useState<PomodoroStats>({
    totalSessions: 0,
    totalWorkTime: 0,
    totalBreakTime: 0,
    sessionsToday: 0,
    currentStreak: 0,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load stats from API on mount
  useEffect(() => {
    const loadStats = async () => {
      try {
        // TODO: Replace with actual API call to get pomodoro statistics
        // const response = await fetch('/api/stats?type=pomodoro');
        // const data = await response.json();
        // setStats(data.pomodoro || { totalSessions: 0, totalTime: 0, sessionsToday: 0, timeToday: 0 });
      } catch (error) {
        console.error('Error loading pomodoro stats:', error);
      }
    };
    
    loadStats();
  }, []);

  // Save session to API when completed
  const saveSessionToAPI = useCallback(async (sessionData: {
    sessionType: 'work' | 'shortBreak' | 'longBreak';
    duration: number;
    completed: boolean;
  }) => {
    try {
      await fetch('/api/pomodoro', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData),
      });

      // Also check for Pokemon evolution after completing a work session
      if (sessionData.sessionType === 'work' && sessionData.completed && selectedPokemon) {
        try {
          const evolutionResponse = await fetch('/api/gamification/pomodoro', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              pokemonId: selectedPokemon.id,
            }),
          });

          if (evolutionResponse.ok) {
            const evolutionData = await evolutionResponse.json();
            if (evolutionData.evolved && evolutionData.pokemon) {
              setRewardPokemon({
                ...evolutionData.pokemon,
                isEvolution: true,
                reason: `Your ${selectedPokemon.name} evolved after completing a Pomodoro session!`
              });
              setShowRewardPopup(true);
              setSelectedPokemon(null); // Clear selection since Pokemon evolved
            }
          }
        } catch (evolutionError) {
          console.error('Error checking Pokemon evolution:', evolutionError);
        }
      }
    } catch (error) {
      console.error('Error saving pomodoro session:', error);
    }
  }, [selectedPokemon]);

  const getCurrentSessionDuration = useCallback(() => {
    switch (currentSession) {
      case 'work':
        return settings.workDuration;
      case 'break':
        return settings.breakDuration;
      case 'longBreak':
        return settings.longBreakDuration;
      default:
        return 25;
    }
  }, [currentSession, settings]);

  const handleSessionComplete = useCallback(async () => {
    setIsRunning(false);
    
    // Play notification sound (you can add an audio file)
    // audioRef.current?.play();

    const duration = getCurrentSessionDuration();
    onSessionComplete?.(currentSession, duration);

    // Save session to API
    const apiSessionType = currentSession === 'break' ? 'shortBreak' : currentSession;
    await saveSessionToAPI({
      sessionType: apiSessionType as 'work' | 'shortBreak' | 'longBreak',
      duration,
      completed: true,
    });

    // Update local stats for immediate UI feedback
    const newStats = {
      totalSessions: stats.totalSessions + 1,
      totalWorkTime: currentSession === 'work' 
        ? stats.totalWorkTime + duration
        : stats.totalWorkTime,
      totalBreakTime: currentSession !== 'work'
        ? stats.totalBreakTime + duration
        : stats.totalBreakTime,
      sessionsToday: stats.sessionsToday + 1,
      currentStreak: currentSession === 'work' 
        ? stats.currentStreak + 1
        : stats.currentStreak,
    };
    
    setStats(newStats);
    onStatsUpdate?.(newStats);

    // Move to next session
    if (currentSession === 'work') {
      const newSessionCount = sessionCount + 1;
      setSessionCount(newSessionCount);
      
      if (newSessionCount % settings.sessionsUntilLongBreak === 0) {
        setCurrentSession('longBreak');
        setTimeLeft(settings.longBreakDuration * 60);
      } else {
        setCurrentSession('break');
        setTimeLeft(settings.breakDuration * 60);
      }
    } else {
      setCurrentSession('work');
      setTimeLeft(settings.workDuration * 60);
    }
  }, [currentSession, stats, sessionCount, settings, onSessionComplete, onStatsUpdate, saveSessionToAPI, getCurrentSessionDuration]);

  // Timer logic
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSessionComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft, handleSessionComplete]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getSessionTitle = () => {
    switch (currentSession) {
      case 'work':
        return 'Focus Time';
      case 'break':
        return 'Short Break';
      case 'longBreak':
        return 'Long Break';
      default:
        return 'Pomodoro Timer';
    }
  };

  const getSessionColor = () => {
    switch (currentSession) {
      case 'work':
        return 'text-red-600';
      case 'break':
        return 'text-green-600';
      case 'longBreak':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const getBadgeColor = () => {
    switch (currentSession) {
      case 'work':
        return 'bg-red-100 text-red-800';
      case 'break':
        return 'bg-green-100 text-green-800';
      case 'longBreak':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleStart = () => {
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleStop = () => {
    setIsRunning(false);
    setCurrentSession('work');
    setTimeLeft(settings.workDuration * 60);
    setSessionCount(0);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(getCurrentSessionDuration() * 60);
  };

  const totalDuration = getCurrentSessionDuration() * 60;
  const progress = ((totalDuration - timeLeft) / totalDuration) * 100;

  return (
    <Card className={cn("w-full max-w-md mx-auto", className)}>
      <CardHeader className="text-center">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">{getSessionTitle()}</CardTitle>
          <Badge className={getBadgeColor()} variant="secondary">
            Session {sessionCount + 1}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Timer Display */}
        <div className="text-center space-y-4">
          <div className={cn("text-6xl font-mono font-bold", getSessionColor())}>
            {formatTime(timeLeft)}
          </div>
          <Progress value={progress} className="h-3" />
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-2">
          {!isRunning ? (
            <Button 
              onClick={handleStart} 
              size="lg"
              className="w-20"
            >
              <Play className="h-5 w-5" />
            </Button>
          ) : (
            <Button 
              onClick={handlePause} 
              variant="secondary"
              size="lg"
              className="w-20"
            >
              <Pause className="h-5 w-5" />
            </Button>
          )}
          
          <Button 
            onClick={handleReset} 
            variant="outline"
            size="lg"
            className="w-20"
          >
            <RotateCcw className="h-5 w-5" />
          </Button>
          
          <Button 
            onClick={handleStop} 
            variant="outline"
            size="lg"
            className="w-20"
          >
            <Square className="h-5 w-5" />
          </Button>
        </div>

        {/* Pokemon Selection for Work Sessions */}
        {currentSession === 'work' && user && (
          <div className="border-t pt-4">
            <div className="space-y-3">
              <div className="text-center">
                <p className="text-sm font-medium">Pokemon Evolution</p>
                <p className="text-xs text-muted-foreground">
                  Complete this session to evolve your selected Pokemon!
                </p>
              </div>
              
              {selectedPokemon ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-12">
                        <Image
                          src={selectedPokemon.imageUrl}
                          alt={selectedPokemon.name}
                          fill
                          className="object-contain"
                          sizes="48px"
                        />
                      </div>
                      <div>
                        <p className="font-medium text-blue-800 capitalize">
                          {selectedPokemon.name}
                        </p>
                        <p className="text-xs text-blue-600">Ready to evolve!</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPokemonSelector(true)}
                      className="text-blue-700 border-blue-300 hover:bg-blue-100"
                    >
                      <Zap className="h-4 w-4 mr-1" />
                      Change
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <Button
                    variant="outline"
                    onClick={() => setShowPokemonSelector(true)}
                    className="w-full"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Select Pokemon to Evolve
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Session Info */}
        <div className="grid grid-cols-2 gap-4 text-center text-sm">
          <div>
            <div className="font-semibold text-lg">{stats.sessionsToday}</div>
            <div className="text-muted-foreground">Sessions Today</div>
          </div>
          <div>
            <div className="font-semibold text-lg">{stats.currentStreak}</div>
            <div className="text-muted-foreground">Current Streak</div>
          </div>
        </div>

        {/* Next Session Preview */}
        <div className="text-center text-sm text-muted-foreground">
          {currentSession === 'work' && (
            <>Next: {(sessionCount + 1) % settings.sessionsUntilLongBreak === 0 ? 'Long Break' : 'Short Break'}</>
          )}
          {currentSession !== 'work' && <>Next: Focus Time</>}
        </div>
      </CardContent>

      {/* Pokemon Selector Modal */}
      {user && (
        <PokemonSelector
          userId={user.id}
          selectedPokemon={selectedPokemon}
          onPokemonSelect={setSelectedPokemon}
          isOpen={showPokemonSelector}
          onOpenChange={setShowPokemonSelector}
        />
      )}

      {/* Pokemon Reward Popup */}
      <PokemonRewardPopup
        pokemon={rewardPokemon}
        isOpen={showRewardPopup}
        onClose={() => {
          setShowRewardPopup(false);
          setRewardPokemon(null);
        }}
      />
    </Card>
  );
}
