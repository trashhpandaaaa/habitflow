"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Circle, Edit, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Habit {
  id: string;
  name: string;
  description?: string;
  category: string;
  targetCount: number;
  frequency: 'daily' | 'weekly' | 'monthly';
  completedToday: boolean;
  currentStreak: number;
  bestStreak: number;
  completedCount: number;
  createdAt: Date;
  lastCompletedAt?: Date;
  reminderTime?: string; // Time in HH:MM format
  color?: string;
}

interface HabitCardProps {
  habit: Habit;
  onToggleComplete: (habitId: string) => void;
  onEdit?: (habit: Habit) => void;
  onDelete?: (habitId: string) => void;
  showActions?: boolean;
}

export function HabitCard({ 
  habit, 
  onToggleComplete, 
  onEdit, 
  onDelete,
  showActions = true 
}: HabitCardProps) {
  const progressPercentage = Math.min((habit.completedCount / habit.targetCount) * 100, 100);
  
  const getFrequencyText = () => {
    switch (habit.frequency) {
      case 'daily':
        return 'Daily';
      case 'weekly':
        return 'Weekly';
      case 'monthly':
        return 'Monthly';
      default:
        return habit.frequency;
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      health: 'bg-green-100 text-green-800',
      productivity: 'bg-blue-100 text-blue-800',
      learning: 'bg-purple-100 text-purple-800',
      fitness: 'bg-orange-100 text-orange-800',
      mindfulness: 'bg-pink-100 text-pink-800',
      social: 'bg-yellow-100 text-yellow-800',
      default: 'bg-gray-100 text-gray-800'
    };
    return colors[category as keyof typeof colors] || colors.default;
  };

  return (
    <Card className={cn(
      "transition-all hover:shadow-md",
      habit.completedToday && "ring-2 ring-green-200"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold">{habit.name}</CardTitle>
            {habit.description && (
              <p className="text-sm text-muted-foreground">{habit.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getCategoryColor(habit.category)} variant="secondary">
              {habit.category}
            </Badge>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onToggleComplete(habit.id)}
              className={cn(
                "hover:scale-105 transition-transform",
                habit.completedToday && "text-green-600"
              )}
            >
              {habit.completedToday ? (
                <CheckCircle className="h-6 w-6" />
              ) : (
                <Circle className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{habit.completedCount}/{habit.targetCount}</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold text-orange-600">
              {habit.currentStreak}
            </div>
            <div className="text-xs text-muted-foreground">Current Streak</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-blue-600">
              {habit.bestStreak}
            </div>
            <div className="text-xs text-muted-foreground">Best Streak</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-purple-600">
              {getFrequencyText()}
            </div>
            <div className="text-xs text-muted-foreground">Frequency</div>
          </div>
        </div>

        {showActions && (
          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit?.(habit)}
              className="flex-1"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDelete?.(habit.id)}
              className="flex-1 text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
