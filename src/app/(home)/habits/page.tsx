"use client";

import { useEffect, useState, useMemo, lazy, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HabitCard, Habit } from "@/components/habit-card";
import { HabitForm } from "@/components/habit-form";
import { HabitCardSkeleton } from "@/components/ui/loading-skeleton";
import { apiService, ApiHabit, PokemonReward } from "@/services/api";
import { RewardResult } from "@/lib/gamification-manager";
import { Plus, Search, Filter, Target } from "lucide-react";

// Lazy load Pokemon reward card for better performance
const PokemonRewardCard = lazy(() => 
  import("@/components/pokemon-reward-card").then(module => ({
    default: module.PokemonRewardCard
  }))
);

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

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Pokemon reward states
  const [pokemonRewards, setPokemonRewards] = useState<RewardResult[]>([]);
  const [currentRewardIndex, setCurrentRewardIndex] = useState(0);

  // Memoize filtered habits for better performance
  const filteredHabits = useMemo(() => {
    let filtered = [...habits];

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(habit => 
        habit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        habit.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        habit.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter(habit => habit.category === categoryFilter);
    }

    // Status filter
    if (statusFilter === "completed") {
      filtered = filtered.filter(habit => habit.completedToday);
    } else if (statusFilter === "pending") {
      filtered = filtered.filter(habit => !habit.completedToday);
    } else if (statusFilter === "streak") {
      filtered = filtered.filter(habit => habit.currentStreak > 0);
    }

    return filtered;
  }, [habits, searchQuery, categoryFilter, statusFilter]);

  useEffect(() => {
    loadHabits();
  }, []);

  const loadHabits = async () => {
    try {
      const response = await apiService.getHabits();
      // The API service returns { success: true, data: { habits: ApiHabit[] } }
      if (response.success && response.data) {
        const apiHabits = response.data.habits || [];
        const convertedHabits = apiHabits.map(convertApiHabitToHabit);
        setHabits(convertedHabits);
      } else {
        console.error('Failed to load habits:', response.error);
        setHabits([]);
      }
    } catch (error) {
      console.error('Failed to load habits:', error);
      setHabits([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleToggleComplete = async (habitId: string) => {
    try {
      const response = await apiService.toggleHabitCompletion(habitId);
      if (response.success) {
        // Check if there are Pokemon rewards in the response
        if (response.data && response.data.pokemonRewards && response.data.pokemonRewards.length > 0) {
          // Map API rewards to RewardResult format
          const mappedRewards: RewardResult[] = response.data.pokemonRewards.map((reward: PokemonReward) => ({
            pokemon: {
              ...reward.pokemon,
              rarity: (reward.pokemon.rarity as 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'shiny') || 'common',
              evolutionStage: 1,
              canEvolve: true,
              evolutionChain: undefined,
              evolutionRequirement: undefined
            },
            isNewReward: true,
            experienceGained: 10,
            levelUp: false
          }));
          setPokemonRewards(mappedRewards);
          setCurrentRewardIndex(0);
        }
        
        // Reload habits to get updated data
        await loadHabits();
      } else {
        console.error('Failed to toggle habit completion:', response.error);
      }
    } catch (error) {
      console.error('Failed to toggle habit completion:', error);
    }
  };

  const handleEdit = (habit: Habit) => {
    setEditingHabit(habit);
    setShowForm(true);
  };

  const handleDelete = async (habitId: string) => {
    if (confirm("Are you sure you want to delete this habit?")) {
      try {
        const response = await apiService.deleteHabit(habitId);
        if (response.success) {
          // Remove from local state
          setHabits(prev => prev.filter(h => h.id !== habitId));
        } else {
          console.error('Failed to delete habit:', response.error);
        }
      } catch (error) {
        console.error('Failed to delete habit:', error);
      }
    }
  };

  const handleSave = async (habitData: Omit<Habit, 'id' | 'createdAt'>) => {
    try {
      if (editingHabit) {
        // Update existing habit
        const response = await apiService.updateHabit(editingHabit.id, {
          name: habitData.name,
          description: habitData.description,
          category: habitData.category,
          target: habitData.targetCount,
          frequency: habitData.frequency
        });
        
        if (response.success && response.data) {
          const updatedHabit = convertApiHabitToHabit(response.data.habit);
          setHabits(prev => 
            prev.map(h => h.id === editingHabit.id ? updatedHabit : h)
          );
        } else {
          console.error('Failed to update habit:', response.error);
          return;
        }
      } else {
        // Create new habit
        const response = await apiService.createHabit({
          name: habitData.name,
          description: habitData.description,
          category: habitData.category,
          target: habitData.targetCount,
          frequency: habitData.frequency
        });
        
        if (response.success && response.data) {
          const newHabit = convertApiHabitToHabit(response.data.habit);
          setHabits(prev => [...prev, newHabit]);
          
          // Check for first habit reward
          // TODO: Implement proper API response type for first habit rewards
          /* 
          if (response.data.firstHabitReward) {
            setPokemonRewards([{
              pokemon: response.data.firstHabitReward.pokemon,
              isNewReward: response.data.firstHabitReward.isNewReward,
              experienceGained: response.data.firstHabitReward.experienceGained,
              levelUp: response.data.firstHabitReward.levelUp,
              newLevel: response.data.firstHabitReward.newLevel,
              achievement: response.data.firstHabitReward.achievement,
            }]);
            setCurrentRewardIndex(0);
          }
          */
        } else {
          console.error('Failed to create habit:', response.error);
          return;
        }
      }
      
      setShowForm(false);
      setEditingHabit(null);
    } catch (error) {
      console.error('Failed to save habit:', error);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingHabit(null);
  };

  const handlePokemonRewardClose = () => {
    if (currentRewardIndex < pokemonRewards.length - 1) {
      // Show next reward
      setCurrentRewardIndex(prev => prev + 1);
    } else {
      // All rewards shown, clear the state
      setPokemonRewards([]);
      setCurrentRewardIndex(0);
    }
  };

  const getUniqueCategories = () => {
    if (!Array.isArray(habits)) return [];
    const categories = habits.map(h => h.category);
    return [...new Set(categories)];
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your habits...</p>
          </div>
        </div>
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="container mx-auto p-6">
        <HabitForm
          habit={editingHabit || undefined}
          onSave={handleSave}
          onCancel={handleCancel}
          isEditing={!!editingHabit}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">My Habits</h1>
          <p className="text-muted-foreground mt-2">
            Track and manage your daily habits
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add New Habit
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search habits..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {getUniqueCategories().map(category => (
                  <SelectItem key={category} value={category}>
                    <span className="capitalize">{category}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Habits</SelectItem>
                <SelectItem value="completed">Completed Today</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="streak">On Streak</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                setCategoryFilter("all");
                setStatusFilter("all");
              }}
            >
              <Filter className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Habits Grid */}
      {/* Loading State */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <HabitCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredHabits.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center space-y-4">
              <Target className="h-12 w-12 text-muted-foreground mx-auto" />
              <div>
                <h3 className="text-lg font-semibold">
                  {habits.length === 0 ? "No habits yet" : "No matching habits"}
                </h3>
                <p className="text-muted-foreground">
                  {habits.length === 0 
                    ? "Start building better habits by creating your first one!"
                    : "Try adjusting your search or filters to find what you're looking for."
                  }
                </p>
              </div>
              {habits.length === 0 && (
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Habit
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHabits.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              onToggleComplete={handleToggleComplete}
              onEdit={handleEdit}
              onDelete={handleDelete}
              showActions={true}
            />
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {habits.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Total Habits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{habits.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {habits.filter(h => h.completedToday).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Active Streaks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {habits.filter(h => h.currentStreak > 0).length}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Pokemon Reward Modal */}
      {pokemonRewards.length > 0 && currentRewardIndex < pokemonRewards.length && (
        <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-center text-gray-600">Loading your reward...</p>
          </div>
        </div>}>
          <PokemonRewardCard
            reward={pokemonRewards[currentRewardIndex]}
            onClose={handlePokemonRewardClose}
            showCelebration={true}
          />
        </Suspense>
      )}
    </div>
  );
}
