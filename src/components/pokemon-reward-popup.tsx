"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Star, Gift } from "lucide-react";
import Image from "next/image";

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

interface PokemonRewardPopupProps {
  pokemon: PokemonReward | null;
  isOpen: boolean;
  onClose: () => void;
}

const rarityColors = {
  common: "bg-gray-100 text-gray-800 border-gray-300",
  uncommon: "bg-green-100 text-green-800 border-green-300",
  rare: "bg-blue-100 text-blue-800 border-blue-300",
  legendary: "bg-purple-100 text-purple-800 border-purple-300"
};

const typeColors: { [key: string]: string } = {
  normal: "bg-gray-400",
  fire: "bg-red-500",
  water: "bg-blue-500",
  electric: "bg-yellow-400",
  grass: "bg-green-500",
  ice: "bg-blue-200",
  fighting: "bg-red-700",
  poison: "bg-purple-500",
  ground: "bg-yellow-600",
  flying: "bg-indigo-400",
  psychic: "bg-pink-500",
  bug: "bg-green-400",
  rock: "bg-yellow-800",
  ghost: "bg-purple-700",
  dragon: "bg-indigo-700",
  dark: "bg-gray-800",
  steel: "bg-gray-500",
  fairy: "bg-pink-300",
};

export function PokemonRewardPopup({ pokemon, isOpen, onClose }: PokemonRewardPopupProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isOpen && pokemon) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, pokemon]);

  if (!pokemon) return null;

  const getRarityIcon = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return <Star className="h-4 w-4 text-purple-600" />;
      case 'rare':
        return <Sparkles className="h-4 w-4 text-blue-600" />;
      case 'uncommon':
        return <Gift className="h-4 w-4 text-green-600" />;
      default:
        return <Gift className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRewardMessage = () => {
    if (pokemon.isEvolution) {
      return `🎉 Your Pokemon evolved to ${pokemon.name}!`;
    }
    return `🎁 You received a new Pokemon!`;
  };

  const getRewardSubtitle = () => {
    if (pokemon.reason) {
      return pokemon.reason;
    }
    if (pokemon.isEvolution) {
      return "Congratulations on completing your Pomodoro session!";
    }
    return "Keep up the great work with your habits!";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold">
            {getRewardMessage()}
          </DialogTitle>
        </DialogHeader>
        
        <div className="relative">
          {showConfetti && (
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="absolute animate-bounce"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 50}%`,
                    animationDelay: `${Math.random() * 2}s`,
                    animationDuration: `${1 + Math.random()}s`
                  }}
                >
                  ✨
                </div>
              ))}
            </div>
          )}

          <Card className="border-2 border-dashed border-gray-200">
            <CardContent className="p-6">
              <div className="flex flex-col items-center space-y-4">
                {/* Pokemon Image */}
                <div className="relative w-32 h-32 mx-auto">
                  <Image
                    src={pokemon.imageUrl}
                    alt={pokemon.name}
                    fill
                    className="object-contain"
                    sizes="128px"
                  />
                  {pokemon.isEvolution && (
                    <div className="absolute -top-2 -right-2 bg-yellow-400 rounded-full p-1">
                      <Sparkles className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>

                {/* Pokemon Info */}
                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-bold capitalize">{pokemon.name}</h3>
                  <p className="text-sm text-gray-600">{getRewardSubtitle()}</p>
                </div>

                {/* Pokemon Details */}
                <div className="flex flex-wrap justify-center gap-2">
                  {/* Types */}
                  {pokemon.type.map((type) => (
                    <Badge
                      key={type}
                      variant="secondary"
                      className={`${typeColors[type.toLowerCase()] || typeColors.normal} text-white text-xs`}
                    >
                      {type}
                    </Badge>
                  ))}
                </div>

                {/* Rarity */}
                <div className="flex items-center justify-center gap-2">
                  {getRarityIcon(pokemon.rarity)}
                  <Badge 
                    variant="outline" 
                    className={`${rarityColors[pokemon.rarity]} capitalize font-medium`}
                  >
                    {pokemon.rarity}
                  </Badge>
                </div>

                {/* Evolution Stage */}
                {pokemon.isEvolution && pokemon.evolutionStage && (
                  <div className="text-center">
                    <p className="text-sm text-gray-500">
                      Evolution Stage: {pokemon.evolutionStage}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center mt-6">
            <Button 
              onClick={onClose}
              className="px-8 py-2"
              size="lg"
            >
              Awesome! 🎉
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
