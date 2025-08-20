"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Star, Crown, Zap, Trophy, TrendingUp } from 'lucide-react';
import { cn } from "@/lib/utils";
import { IGamificationStats } from '@/models/PokemonReward';

interface PokemonCollectionProps {
  userId: string;
}

export function PokemonCollection({ userId }: PokemonCollectionProps) {
  const [stats, setStats] = useState<IGamificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRarity, setSelectedRarity] = useState<string>('all');

  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        const response = await fetch(`/api/gamification/stats?userId=${userId}`);
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserStats();
  }, [userId]);

  const getRarityConfig = (rarity: string) => {
    const configs = {
      common: {
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200',
        textColor: 'text-gray-700',
        icon: null,
        gradient: 'from-gray-100 to-gray-50'
      },
      uncommon: {
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        textColor: 'text-green-700',
        icon: <Zap className="w-4 h-4" />,
        gradient: 'from-green-100 to-green-50'
      },
      rare: {
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        textColor: 'text-blue-700',
        icon: <Star className="w-4 h-4" />,
        gradient: 'from-blue-100 to-blue-50'
      },
      epic: {
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-200',
        textColor: 'text-purple-700',
        icon: <Crown className="w-4 h-4" />,
        gradient: 'from-purple-100 to-purple-50'
      },
      legendary: {
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-300',
        textColor: 'text-yellow-700',
        icon: <Crown className="w-4 h-4" />,
        gradient: 'from-yellow-100 to-yellow-50'
      },
      shiny: {
        bgColor: 'bg-gradient-to-r from-pink-50 to-purple-50',
        borderColor: 'border-pink-300',
        textColor: 'text-pink-700',
        icon: <Sparkles className="w-4 h-4" />,
        gradient: 'from-pink-100 via-purple-100 to-blue-100'
      }
    };
    
    return configs[rarity as keyof typeof configs] || configs.common;
  };

  const getFilteredPokemon = () => {
    if (!stats) return [];
    
    if (selectedRarity === 'all') {
      return stats.pokemonCollection;
    }
    
    return stats.pokemonCollection.filter(pokemon => pokemon.rarity === selectedRarity);
  };

  const getRarityStats = () => {
    if (!stats) return {};
    
    return stats.pokemonCollection.reduce((acc, pokemon) => {
      acc[pokemon.rarity] = (acc[pokemon.rarity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  };

  const getExperienceProgress = () => {
    if (!stats) return { current: 0, required: 100, percentage: 0 };
    
    const currentLevelXP = Math.pow(stats.level - 1, 2) * 50;
    const nextLevelXP = Math.pow(stats.level, 2) * 50;
    const currentProgress = stats.experience - currentLevelXP;
    const requiredForNext = nextLevelXP - currentLevelXP;
    
    return {
      current: currentProgress,
      required: requiredForNext,
      percentage: (currentProgress / requiredForNext) * 100
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">Unable to load Pokemon collection</p>
      </div>
    );
  }

  const rarityStats = getRarityStats();
  const experienceProgress = getExperienceProgress();
  const filteredPokemon = getFilteredPokemon();

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.level}</div>
            <div className="text-sm text-gray-600">Level</div>
            <Progress value={experienceProgress.percentage} className="mt-2" />
            <div className="text-xs text-gray-500 mt-1">
              {experienceProgress.current}/{experienceProgress.required} XP
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.totalPokemonCaught}</div>
            <div className="text-sm text-gray-600">Pokemon Caught</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.achievements.length}</div>
            <div className="text-sm text-gray-600">Achievements</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.stats.longestStreak}</div>
            <div className="text-sm text-gray-600">Best Streak</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="collection" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="collection">Pokemon Collection</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="collection" className="space-y-4">
          {/* Rarity Filter */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedRarity === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedRarity('all')}
            >
              All ({stats.pokemonCollection.length})
            </Button>
            {['common', 'uncommon', 'rare', 'epic', 'legendary', 'shiny'].map(rarity => {
              const count = rarityStats[rarity] || 0;
              if (count === 0) return null;
              
              const config = getRarityConfig(rarity);
              
              return (
                <Button
                  key={rarity}
                  variant={selectedRarity === rarity ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedRarity(rarity)}
                  className={cn(
                    selectedRarity === rarity && config.textColor
                  )}
                >
                  <div className="flex items-center gap-1">
                    {config.icon}
                    <span className="capitalize">{rarity}</span>
                    <span>({count})</span>
                  </div>
                </Button>
              );
            })}
          </div>

          {/* Pokemon Grid */}
          {filteredPokemon.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-500">No Pokemon found for this filter</p>
                <p className="text-sm text-gray-400 mt-2">
                  Complete more habits to catch Pokemon!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {filteredPokemon.map((pokemon, index) => {
                const config = getRarityConfig(pokemon.rarity);
                
                return (
                  <Card key={`${pokemon.pokemonId || pokemon._id || 'pokemon'}-${index}`} className={cn(
                    "transition-all hover:scale-105 cursor-pointer",
                    config.borderColor,
                    "border-2"
                  )}>
                    <CardContent className="p-3 text-center">
                      <div className={cn(
                        "w-20 h-20 mx-auto rounded-full flex items-center justify-center border-2 mb-2 relative overflow-hidden",
                        config.borderColor,
                        `bg-gradient-to-br ${config.gradient}`
                      )}>
                        <Image 
                          src={pokemon.pokemonImage} 
                          alt={pokemon.pokemonName}
                          width={64}
                          height={64}
                          className="object-contain"
                          unoptimized
                        />
                        {pokemon.rarity === 'shiny' && (
                          <div className="absolute -top-1 -right-1">
                            <Sparkles className="w-3 h-3 text-pink-500" />
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-1">
                        <p className="font-semibold text-sm truncate">
                          {pokemon.pokemonName}
                        </p>
                        
                        <Badge 
                          className={cn(
                            "text-xs",
                            config.textColor,
                            config.bgColor
                          )}
                        >
                          <div className="flex items-center gap-1">
                            {config.icon}
                            <span className="capitalize">{pokemon.rarity}</span>
                          </div>
                        </Badge>
                        
                        <div className="text-xs text-gray-500">
                          {new Date(pokemon.unlockedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          {stats.achievements.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Trophy className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No achievements yet</p>
                <p className="text-sm text-gray-400 mt-2">
                  Keep completing habits to unlock achievements!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stats.achievements.map((achievement, index) => (
                <Card key={`${achievement.name}-${achievement.unlockedAt}-${index}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">{achievement.icon}</div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{achievement.name}</h3>
                        <p className="text-sm text-gray-600">{achievement.description}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(achievement.unlockedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Habit Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Total Habits Completed:</span>
                  <span className="font-semibold">{stats.stats.totalHabitsCompleted}</span>
                </div>
                <div className="flex justify-between">
                  <span>Longest Streak:</span>
                  <span className="font-semibold">{stats.stats.longestStreak} days</span>
                </div>
                <div className="flex justify-between">
                  <span>Perfect Days:</span>
                  <span className="font-semibold">{stats.stats.perfectDays}</span>
                </div>
                <div className="flex justify-between">
                  <span>Perfect Weeks:</span>
                  <span className="font-semibold">{stats.stats.perfectWeeks}</span>
                </div>
                <div className="flex justify-between">
                  <span>Perfect Months:</span>
                  <span className="font-semibold">{stats.stats.perfectMonths}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Collection Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(rarityStats).map(([rarity, count]) => {
                  const config = getRarityConfig(rarity);
                  return (
                    <div key={rarity} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {config.icon}
                        <span className="capitalize">{rarity}</span>
                      </div>
                      <Badge className={cn(config.textColor, config.bgColor)}>
                        {count}
                      </Badge>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default PokemonCollection;
