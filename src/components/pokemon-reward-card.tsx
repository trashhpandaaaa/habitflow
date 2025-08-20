"use client";

import React from 'react';
import Image from 'next/image';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, Star, Crown, Zap } from 'lucide-react';
import { cn } from "@/lib/utils";
import { RewardResult } from '@/lib/gamification-manager';

interface PokemonRewardCardProps {
  reward: RewardResult;
  onClose?: () => void;
  showCelebration?: boolean;
}

export function PokemonRewardCard({ 
  reward, 
  onClose,
  showCelebration = true 
}: PokemonRewardCardProps) {
  const { pokemon, isNewReward, experienceGained, levelUp, newLevel, achievement } = reward;

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
        bgColor: 'bg-rainbow',
        borderColor: 'border-pink-300',
        textColor: 'text-pink-700',
        icon: <Sparkles className="w-4 h-4" />,
        gradient: 'from-pink-100 via-purple-100 to-blue-100'
      }
    };
    
    return configs[rarity as keyof typeof configs] || configs.common;
  };

  const rarityConfig = getRarityConfig(pokemon.rarity);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className={cn(
        "max-w-sm w-full mx-auto transform transition-all duration-300",
        rarityConfig.borderColor,
        "border-2",
        showCelebration && "animate-bounce"
      )}>
        <div className={cn(
          "absolute inset-0 rounded-lg opacity-20",
          `bg-gradient-to-br ${rarityConfig.gradient}`
        )} />
        
        <CardContent className="relative p-6 text-center space-y-4">
          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2">
              <h2 className="text-2xl font-bold">
                {isNewReward ? "New Pokemon Caught!" : "Pokemon Encountered!"}
              </h2>
              {pokemon.rarity === 'shiny' && (
                <Sparkles className="w-6 h-6 text-pink-500 animate-pulse" />
              )}
            </div>
            
            {levelUp && (
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
                🎉 Level Up! Now Level {newLevel}!
              </div>
            )}
          </div>

          {/* Pokemon Image */}
          <div className="relative">
            <div className={cn(
              "w-32 h-32 mx-auto rounded-full flex items-center justify-center border-4 relative overflow-hidden",
              rarityConfig.borderColor,
              `bg-gradient-to-br ${rarityConfig.gradient}`
            )}>
              <Image 
                src={pokemon.image} 
                alt={pokemon.name}
                width={112}
                height={112}
                className="object-contain"
                unoptimized // For external Pokemon API images
                onError={(e) => {
                  // Fallback to a default Pokemon sprite if the official artwork fails
                  const target = e.target as HTMLImageElement;
                  target.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`;
                }}
              />
            </div>
            
            {pokemon.rarity === 'shiny' && (
              <div className="absolute -top-2 -right-2">
                <div className="bg-pink-500 text-white px-2 py-1 rounded-full text-xs font-bold animate-pulse">
                  ✨ SHINY
                </div>
              </div>
            )}
          </div>

          {/* Pokemon Details */}
          <div className="space-y-3">
            <div>
              <h3 className="text-xl font-bold text-gray-800">{pokemon.name}</h3>
              <div className="flex items-center justify-center gap-2 mt-1">
                {pokemon.types.map(type => (
                  <Badge 
                    key={type} 
                    variant="secondary" 
                    className="text-xs capitalize"
                  >
                    {type}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Rarity Badge */}
            <Badge 
              className={cn(
                "text-sm font-semibold px-3 py-1",
                rarityConfig.textColor,
                rarityConfig.bgColor
              )}
            >
              <div className="flex items-center gap-1">
                {rarityConfig.icon}
                <span className="capitalize">{pokemon.rarity}</span>
              </div>
            </Badge>

            {/* Experience Gained */}
            <div className="bg-blue-50 px-4 py-2 rounded-lg">
              <p className="text-sm text-blue-700">
                <span className="font-semibold">+{experienceGained} XP</span>
              </p>
            </div>

            {/* Achievement */}
            {achievement && (
              <div className="bg-yellow-50 border border-yellow-200 px-4 py-2 rounded-lg">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-lg">{achievement.icon}</span>
                  <div className="text-left">
                    <p className="font-semibold text-yellow-800">{achievement.name}</p>
                    <p className="text-xs text-yellow-600">{achievement.description}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Duplicate Notice */}
            {!isNewReward && (
              <div className="bg-amber-50 border border-amber-200 px-4 py-2 rounded-lg">
                <p className="text-sm text-amber-700">
                  You already have this Pokemon in your collection!
                </p>
              </div>
            )}
          </div>

          {/* Close Button */}
          <Button 
            onClick={onClose}
            className="w-full mt-6"
            variant="default"
          >
            Continue Training
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default PokemonRewardCard;
