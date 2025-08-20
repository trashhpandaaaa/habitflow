"use client";

import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Zap, ArrowRight, Info } from "lucide-react";
import Image from "next/image";

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

interface PokemonSelectorProps {
  userId: string;
  selectedPokemon: Pokemon | null;
  onPokemonSelect: (pokemon: Pokemon | null) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

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

export function PokemonSelector({ 
  userId, 
  selectedPokemon, 
  onPokemonSelect, 
  isOpen, 
  onOpenChange 
}: PokemonSelectorProps) {
  const [evolvablePokemon, setEvolvablePokemon] = useState<Pokemon[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadEvolvablePokemon = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/user/pokemon?userId=${userId}&evolvable=true`);
      if (response.ok) {
        const data = await response.json();
        setEvolvablePokemon(data.pokemon || []);
      }
    } catch (error) {
      console.error('Error loading evolvable Pokemon:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (isOpen) {
      loadEvolvablePokemon();
    }
  }, [isOpen, loadEvolvablePokemon]);

  const handleSelectPokemon = (pokemon: Pokemon) => {
    onPokemonSelect(pokemon);
    onOpenChange(false);
  };

  const handleClearSelection = () => {
    onPokemonSelect(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Choose Pokemon to Evolve
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">How Pokemon Evolution Works:</p>
                <p className="mt-1">
                  Complete a Pomodoro session to evolve your selected Pokemon! 
                  Only Pokemon that can evolve will appear in this list.
                </p>
              </div>
            </div>
          </div>

          {selectedPokemon && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
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
                    <p className="font-medium text-green-800">Currently Selected:</p>
                    <p className="text-green-700 capitalize">{selectedPokemon.name}</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleClearSelection}
                  className="text-green-700 border-green-300 hover:bg-green-100"
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          )}

          <ScrollArea className="h-96">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : evolvablePokemon.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No evolvable Pokemon found.</p>
                <p className="text-sm text-gray-400 mt-1">
                  Complete more habit streaks to collect Pokemon!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {evolvablePokemon.map((pokemon) => (
                  <Card 
                    key={pokemon.id}
                    className={`cursor-pointer transition-all hover:shadow-md hover:scale-105 ${
                      selectedPokemon?.id === pokemon.id 
                        ? 'ring-2 ring-blue-500 bg-blue-50' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleSelectPokemon(pokemon)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        {/* Current Pokemon */}
                        <div className="flex flex-col items-center space-y-1">
                          <div className="relative w-16 h-16">
                            <Image
                              src={pokemon.imageUrl}
                              alt={pokemon.name}
                              fill
                              className="object-contain"
                              sizes="64px"
                            />
                          </div>
                          <p className="text-xs font-medium capitalize text-center">
                            {pokemon.name}
                          </p>
                          <div className="flex gap-1">
                            {pokemon.type.slice(0, 2).map((type) => (
                              <div
                                key={type}
                                className={`w-2 h-2 rounded-full ${
                                  typeColors[type.toLowerCase()] || typeColors.normal
                                }`}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Evolution Arrow */}
                        {pokemon.evolutionTarget && (
                          <>
                            <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            
                            {/* Evolution Target */}
                            <div className="flex flex-col items-center space-y-1">
                              <div className="relative w-16 h-16">
                                <Image
                                  src={pokemon.evolutionTarget.imageUrl}
                                  alt={pokemon.evolutionTarget.name}
                                  fill
                                  className="object-contain"
                                  sizes="64px"
                                />
                              </div>
                              <p className="text-xs font-medium capitalize text-center">
                                {pokemon.evolutionTarget.name}
                              </p>
                              <Badge variant="secondary" className="text-xs px-2 py-0">
                                Evolution
                              </Badge>
                            </div>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
