"use client";

import { createContext, useContext, useState, ReactNode } from 'react';
import { PokemonRewardPopup } from '@/components/pokemon-reward-popup';

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

interface PokemonRewardContextType {
  showReward: (pokemon: PokemonReward) => void;
}

const PokemonRewardContext = createContext<PokemonRewardContextType | undefined>(undefined);

export const usePokemonReward = () => {
  const context = useContext(PokemonRewardContext);
  if (!context) {
    throw new Error('usePokemonReward must be used within a PokemonRewardProvider');
  }
  return context;
};

export function PokemonRewardProvider({ children }: { children: ReactNode }) {
  const [rewardPokemon, setRewardPokemon] = useState<PokemonReward | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const showReward = (pokemon: PokemonReward) => {
    setRewardPokemon(pokemon);
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setRewardPokemon(null);
  };

  return (
    <PokemonRewardContext.Provider value={{ showReward }}>
      {children}
      <PokemonRewardPopup
        pokemon={rewardPokemon}
        isOpen={isOpen}
        onClose={handleClose}
      />
    </PokemonRewardContext.Provider>
  );
}
