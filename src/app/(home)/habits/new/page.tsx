"use client";

import { HabitForm } from "@/components/habit-form";
import { apiService } from "@/services/api";
import { Habit } from "@/components/habit-card";
import { useRouter } from "next/navigation";

export default function NewHabitPage() {
  const router = useRouter();

  const handleSave = async (habitData: Omit<Habit, 'id' | 'createdAt'>) => {
    try {
      await apiService.createHabit({
        name: habitData.name,
        description: habitData.description,
        category: habitData.category,
        target: habitData.targetCount,
        frequency: habitData.frequency,
        reminderTime: habitData.reminderTime
      });
      router.push('/habits');
    } catch (error) {
      console.error('Failed to create habit:', error);
    }
  };

  const handleCancel = () => {
    router.push('/habits');
  };

  return (
    <div className="container mx-auto p-6">
      <HabitForm
        onSave={handleSave}
        onCancel={handleCancel}
        isEditing={false}
      />
    </div>
  );
}
