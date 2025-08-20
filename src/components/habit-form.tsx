"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";
import { Habit } from "./habit-card";

interface HabitFormProps {
  habit?: Partial<Habit>;
  onSave: (habit: Omit<Habit, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

const CATEGORIES = [
  'health',
  'fitness',
  'productivity',
  'learning',
  'mindfulness',
  'social',
  'creativity',
  'finance',
  'other'
];

const FREQUENCIES = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' }
] as const;

export function HabitForm({ habit, onSave, onCancel, isEditing = false }: HabitFormProps) {
  const [formData, setFormData] = useState({
    name: habit?.name || '',
    description: habit?.description || '',
    category: habit?.category || 'health',
    targetCount: habit?.targetCount || 1,
    frequency: habit?.frequency || 'daily' as const,
    completedToday: habit?.completedToday || false,
    currentStreak: habit?.currentStreak || 0,
    bestStreak: habit?.bestStreak || 0,
    completedCount: habit?.completedCount || 0,
    lastCompletedAt: habit?.lastCompletedAt,
    reminderTime: habit?.reminderTime || '',
    color: habit?.color || '#3B82F6'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Habit name is required';
    }

    if (formData.targetCount < 1) {
      newErrors.targetCount = 'Target count must be at least 1';
    }

    // Validate reminder time format if provided
    if (formData.reminderTime && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(formData.reminderTime)) {
      newErrors.reminderTime = 'Reminder time must be in HH:MM format (e.g., 09:00, 14:30)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    onSave(formData);
  };

  const handleInputChange = (field: string, value: string | number | boolean | Date | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{isEditing ? 'Edit Habit' : 'Create New Habit'}</CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onCancel}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Habit Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Habit Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Drink 8 glasses of water"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Add details about your habit..."
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => handleInputChange('category', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(category => (
                  <SelectItem key={category} value={category}>
                    <div className="flex items-center gap-2">
                      <span className="capitalize">{category}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Frequency and Target */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="frequency">Frequency</Label>
              <Select
                value={formData.frequency}
                onValueChange={(value) => handleInputChange('frequency', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCIES.map(freq => (
                    <SelectItem key={freq.value} value={freq.value}>
                      {freq.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetCount">
                Target Count ({formData.frequency === 'daily' ? 'per day' : 
                          formData.frequency === 'weekly' ? 'per week' : 'per month'})
              </Label>
              <Input
                id="targetCount"
                type="number"
                min="1"
                value={formData.targetCount}
                onChange={(e) => handleInputChange('targetCount', parseInt(e.target.value) || 1)}
                className={errors.targetCount ? 'border-red-500' : ''}
              />
              {errors.targetCount && (
                <p className="text-sm text-red-600">{errors.targetCount}</p>
              )}
            </div>
          </div>

          {/* Color Picker */}
          <div className="space-y-2">
            <Label htmlFor="color">Habit Color</Label>
            <div className="flex items-center gap-3">
              <input
                id="color"
                type="color"
                value={formData.color}
                onChange={(e) => handleInputChange('color', e.target.value)}
                className="w-12 h-10 rounded-md border border-gray-300 cursor-pointer"
              />
              <div className="flex gap-2">
                {['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#F97316', '#EC4899'].map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => handleInputChange('color', color)}
                    className="w-8 h-8 rounded-full border-2 border-gray-200 hover:border-gray-400"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Reminder Time */}
          <div className="space-y-2">
            <Label htmlFor="reminderTime">Reminder Time (Optional)</Label>
            <Input
              id="reminderTime"
              type="time"
              value={formData.reminderTime}
              onChange={(e) => handleInputChange('reminderTime', e.target.value)}
              className={errors.reminderTime ? 'border-red-500' : ''}
              placeholder="Set a time for daily reminders"
            />
            {errors.reminderTime && (
              <p className="text-sm text-red-600">{errors.reminderTime}</p>
            )}
            <p className="text-sm text-gray-500">
              Choose a time when you&apos;d like to be reminded about this habit
            </p>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1">
              {isEditing ? 'Update Habit' : 'Create Habit'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
