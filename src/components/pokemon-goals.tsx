"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Target, Trophy, Zap, Calendar, Star, Gift, Crown, Sparkles, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface GoalProgress {
  id: string;
  title: string;
  description: string;
  current: number;
  target: number;
  reward: {
    type: 'pokemon' | 'evolution' | 'achievement';
    rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'shiny';
    name: string;
    description: string;
  };
  icon: React.ReactNode;
  category: 'streak' | 'milestone' | 'perfect' | 'evolution' | 'special';
  isCompleted: boolean;
  timeframe?: string;
}

interface PokemonGoalsProps {
  userId: string;
  className?: string;
}

export function PokemonGoals({ userId, className }: PokemonGoalsProps) {
  const [goals, setGoals] = useState<GoalProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    const fetchGoalProgress = async () => {
      try {
        const response = await fetch(`/api/gamification/goals?userId=${userId}`);
        if (response.ok) {
          const data = await response.json();
          setGoals(data.goals || []);
        }
      } catch (error) {
        console.error('Error fetching goals:', error);
        // Set default goals if API fails
        setDefaultGoals();
      } finally {
        setLoading(false);
      }
    };

    fetchGoalProgress();
  }, [userId]);

  const setDefaultGoals = () => {
    const defaultGoals: GoalProgress[] = [
      {
        id: 'streak-3',
        title: '3-Day Streak',
        description: 'Complete habits for 3 consecutive days',
        current: 0, // This would be fetched from user data
        target: 3,
        reward: {
          type: 'pokemon',
          rarity: 'common',
          name: 'Base Pokemon',
          description: 'Get a Pokemon that can evolve!'
        },
        icon: <Target className="h-5 w-5" />,
        category: 'streak',
        isCompleted: false,
        timeframe: 'Daily'
      },
      {
        id: 'streak-7',
        title: '7-Day Streak',
        description: 'Maintain a week-long habit streak',
        current: 0,
        target: 7,
        reward: {
          type: 'pokemon',
          rarity: 'uncommon',
          name: 'Uncommon Pokemon',
          description: 'Stronger Pokemon with better abilities'
        },
        icon: <Calendar className="h-5 w-5" />,
        category: 'streak',
        isCompleted: false,
        timeframe: 'Weekly'
      },
      {
        id: 'milestone-25',
        title: '25 Completions',
        description: 'Complete any habit 25 times',
        current: 0,
        target: 25,
        reward: {
          type: 'pokemon',
          rarity: 'uncommon',
          name: 'Milestone Pokemon',
          description: 'Special Pokemon for dedication'
        },
        icon: <Trophy className="h-5 w-5" />,
        category: 'milestone',
        isCompleted: false
      },
      {
        id: 'perfect-week',
        title: 'Perfect Week',
        description: 'Complete all habits every day for a week',
        current: 0,
        target: 7,
        reward: {
          type: 'pokemon',
          rarity: 'rare',
          name: 'Rare Pokemon',
          description: 'Exceptional Pokemon for perfect performance'
        },
        icon: <Star className="h-5 w-5" />,
        category: 'perfect',
        isCompleted: false,
        timeframe: 'Weekly'
      },
      {
        id: 'pomodoro-evolution',
        title: 'Pokemon Evolution',
        description: 'Complete Pomodoro sessions to evolve Pokemon',
        current: 0,
        target: 1,
        reward: {
          type: 'evolution',
          rarity: 'uncommon',
          name: 'Evolved Pokemon',
          description: 'Transform your Pokemon into its next form'
        },
        icon: <Zap className="h-5 w-5" />,
        category: 'evolution',
        isCompleted: false
      },
      {
        id: 'streak-30',
        title: '30-Day Streak',
        description: 'Maintain habits for a full month',
        current: 0,
        target: 30,
        reward: {
          type: 'pokemon',
          rarity: 'rare',
          name: 'Elite Pokemon',
          description: 'Powerful Pokemon for exceptional consistency'
        },
        icon: <Crown className="h-5 w-5" />,
        category: 'streak',
        isCompleted: false,
        timeframe: 'Monthly'
      }
    ];

    setGoals(defaultGoals);
  };

  const getRarityConfig = (rarity: string) => {
    const configs = {
      common: {
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200',
        textColor: 'text-gray-700',
        accentColor: 'bg-gray-500',
        gradient: 'from-gray-100 to-gray-50'
      },
      uncommon: {
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        textColor: 'text-green-700',
        accentColor: 'bg-green-500',
        gradient: 'from-green-100 to-green-50'
      },
      rare: {
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        textColor: 'text-blue-700',
        accentColor: 'bg-blue-500',
        gradient: 'from-blue-100 to-blue-50'
      },
      epic: {
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-200',
        textColor: 'text-purple-700',
        accentColor: 'bg-purple-500',
        gradient: 'from-purple-100 to-purple-50'
      },
      legendary: {
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        textColor: 'text-yellow-700',
        accentColor: 'bg-yellow-500',
        gradient: 'from-yellow-100 to-yellow-50'
      },
      shiny: {
        bgColor: 'bg-gradient-to-r from-pink-50 to-purple-50',
        borderColor: 'border-pink-200',
        textColor: 'text-pink-700',
        accentColor: 'bg-gradient-to-r from-pink-500 to-purple-500',
        gradient: 'from-pink-100 via-purple-100 to-blue-100'
      }
    };
    
    return configs[rarity as keyof typeof configs] || configs.common;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'streak': return <Target className="h-4 w-4" />;
      case 'milestone': return <Trophy className="h-4 w-4" />;
      case 'perfect': return <Star className="h-4 w-4" />;
      case 'evolution': return <Zap className="h-4 w-4" />;
      case 'special': return <Sparkles className="h-4 w-4" />;
      default: return <Gift className="h-4 w-4" />;
    }
  };

  const getFilteredGoals = () => {
    if (selectedCategory === 'all') {
      return goals;
    }
    return goals.filter(goal => goal.category === selectedCategory);
  };

  const getProgressPercentage = (goal: GoalProgress) => {
    return Math.min((goal.current / goal.target) * 100, 100);
  };

  const categories = [
    { id: 'all', name: 'All Goals', count: goals.length },
    { id: 'streak', name: 'Streaks', count: goals.filter(g => g.category === 'streak').length },
    { id: 'milestone', name: 'Milestones', count: goals.filter(g => g.category === 'milestone').length },
    { id: 'perfect', name: 'Perfect Days', count: goals.filter(g => g.category === 'perfect').length },
    { id: 'evolution', name: 'Evolution', count: goals.filter(g => g.category === 'evolution').length },
  ];

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const filteredGoals = getFilteredGoals();

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-blue-600" />
          Pokemon Goals & Rewards
        </CardTitle>
        <p className="text-sm text-gray-600">
          Complete these goals to earn new Pokemon and evolve your collection!
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
          {categories.map(category => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
              className="flex items-center gap-1 text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
            >
              {getCategoryIcon(category.id)}
              <span className="hidden xs:inline">{category.name}</span>
              <span className="xs:hidden">{category.name.split(' ')[0]}</span>
              <Badge variant="secondary" className="ml-1 text-[10px] sm:text-xs px-1">
                {category.count}
              </Badge>
            </Button>
          ))}
        </div>

        {/* Goals List */}
        <div className="space-y-4">
          {filteredGoals.length === 0 ? (
            <div className="text-center py-8">
              <Gift className="h-12 w-12 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-500">No goals found for this category</p>
            </div>
          ) : (
            filteredGoals.map((goal) => {
              const rarityConfig = getRarityConfig(goal.reward.rarity);
              const progressPercentage = getProgressPercentage(goal);
              
              return (
                <Card
                  key={goal.id}
                  className={cn(
                    "transition-all hover:shadow-md",
                    goal.isCompleted ? "bg-green-50 border-green-200" : rarityConfig.borderColor
                  )}
                >
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="flex items-center gap-2">
                            {goal.icon}
                            <h3 className="font-semibold text-sm sm:text-base">{goal.title}</h3>
                            {goal.isCompleted && (
                              <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                            )}
                          </div>
                          {goal.timeframe && (
                            <Badge variant="outline" className="text-xs">
                              {goal.timeframe}
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-xs sm:text-sm text-gray-600">
                          {goal.description}
                        </p>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs sm:text-sm">
                            <span>Progress</span>
                            <span className="font-medium">
                              {goal.current} / {goal.target}
                            </span>
                          </div>
                          <Progress 
                            value={progressPercentage} 
                            className="h-2"
                          />
                        </div>
                      </div>
                      
                      {/* Reward Preview */}
                      <div className={cn(
                        "p-3 rounded-lg text-center w-full lg:w-auto lg:min-w-[120px] lg:max-w-[140px]",
                        rarityConfig.bgColor,
                        rarityConfig.borderColor,
                        "border"
                      )}>
                        <div className="flex justify-center mb-2">
                          {goal.reward.type === 'pokemon' && <Gift className="h-5 w-5 sm:h-6 sm:w-6" />}
                          {goal.reward.type === 'evolution' && <Zap className="h-5 w-5 sm:h-6 sm:w-6" />}
                          {goal.reward.type === 'achievement' && <Trophy className="h-5 w-5 sm:h-6 sm:w-6" />}
                        </div>
                        <div className={cn("text-xs font-medium mb-1", rarityConfig.textColor)}>
                          {goal.reward.name}
                        </div>
                        <Badge 
                          className={cn(
                            "text-xs capitalize",
                            rarityConfig.textColor,
                            rarityConfig.bgColor
                          )}
                        >
                          {goal.reward.rarity}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          {goal.reward.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Quick Tips */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
          <h4 className="font-semibold text-blue-800 mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
            <Sparkles className="h-4 w-4" />
            Pro Tips
          </h4>
          <ul className="text-xs sm:text-sm text-blue-700 space-y-2">
            <li className="flex items-start gap-2">
              <CheckCircle className="h-3 w-3 flex-shrink-0 mt-0.5" />
              <span>Start with 3-day streaks to get your first evolvable Pokemon</span>
            </li>
            <li className="flex items-start gap-2">
              <Zap className="h-3 w-3 flex-shrink-0 mt-0.5" />
              <span>Use the Pomodoro timer to evolve your Pokemon collection</span>
            </li>
            <li className="flex items-start gap-2">
              <Star className="h-3 w-3 flex-shrink-0 mt-0.5" />
              <span>Perfect days (completing all habits) give better rewards</span>
            </li>
            <li className="flex items-start gap-2">
              <Crown className="h-3 w-3 flex-shrink-0 mt-0.5" />
              <span>Longer streaks unlock rarer and more powerful Pokemon</span>
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

export default PokemonGoals;
