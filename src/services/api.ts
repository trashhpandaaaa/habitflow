// API service layer for client-side data fetching
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  joinDate: string;
  preferences: {
    darkMode: boolean;
    notifications: boolean;
    reminderTime: string;
  };
}

export interface HabitCompletion {
  _id: string;
  habitId: string;
  userId: string;
  date: string;
  completedAt: string;
}

export interface ApiHabit {
  _id: string;
  name: string;
  description?: string;
  category: string;
  target: number;
  frequency: 'daily' | 'weekly' | 'monthly';
  completedToday?: boolean;
  currentStreak: number;
  bestStreak: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
  color?: string;
}

export interface PomodoroSession {
  _id: string;
  userId: string;
  sessionType: 'work' | 'shortBreak' | 'longBreak';
  duration: number;
  completedAt: string;
  date: string;
  createdAt: string;
}

class ApiService {
  private baseUrl = '/api';

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'An error occurred',
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: 'Network error occurred',
      };
    }
  }

  // User methods
  async getProfile(): Promise<ApiResponse<{ user: User }>> {
    return this.request('/user/profile');
  }

  async updateProfile(profileData: Partial<User>): Promise<ApiResponse<{ user: User }>> {
    return this.request('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  // Habit methods
  async getHabits(): Promise<ApiResponse<{ habits: ApiHabit[] }>> {
    return this.request('/habits');
  }

  async getHabit(habitId: string): Promise<ApiResponse<{ habit: ApiHabit }>> {
    return this.request(`/habits/${habitId}`);
  }

  async createHabit(habitData: {
    name: string;
    description?: string;
    category: string;
    target?: number;
    frequency: string;
  }): Promise<ApiResponse<{ habit: ApiHabit }>> {
    return this.request('/habits', {
      method: 'POST',
      body: JSON.stringify(habitData),
    });
  }

  async updateHabit(habitId: string, habitData: Partial<ApiHabit>): Promise<ApiResponse<{ habit: ApiHabit }>> {
    return this.request(`/habits/${habitId}`, {
      method: 'PUT',
      body: JSON.stringify(habitData),
    });
  }

  async deleteHabit(habitId: string): Promise<ApiResponse<{ message: string }>> {
    return this.request(`/habits/${habitId}`, {
      method: 'DELETE',
    });
  }

  async toggleHabitCompletion(habitId: string): Promise<ApiResponse<{ 
    completed: boolean; 
    message: string;
    currentStreak?: number;
  }>> {
    return this.request(`/habits/${habitId}/complete`, {
      method: 'POST',
    });
  }

  async removeHabitCompletion(habitId: string): Promise<ApiResponse<{ 
    message: string;
    currentStreak?: number;
  }>> {
    return this.request(`/habits/${habitId}/complete`, {
      method: 'DELETE',
    });
  }

  async getHabitCompletions(habitId: string, startDate?: string, endDate?: string): Promise<ApiResponse<{ completions: HabitCompletion[] }>> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    return this.request(`/habits/${habitId}/complete?${params.toString()}`);
  }

  async getAllCompletions(): Promise<ApiResponse<{ completions: HabitCompletion[] }>> {
    return this.request('/completions');
  }

  // Pomodoro methods
  async getPomodoroSessions(startDate?: string, endDate?: string, type?: string): Promise<ApiResponse<{ sessions: PomodoroSession[] }>> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (type) params.append('type', type);
    
    return this.request(`/pomodoro?${params.toString()}`);
  }

  async createPomodoroSession(sessionData: {
    sessionType: 'work' | 'shortBreak' | 'longBreak';
    duration: number;
    completedAt: string;
  }): Promise<ApiResponse<{ session: PomodoroSession }>> {
    return this.request('/pomodoro', {
      method: 'POST',
      body: JSON.stringify(sessionData),
    });
  }

  // Statistics methods
  async getStatistics(period?: number): Promise<ApiResponse<{
    totalHabits: number;
    activeHabits: number;
    totalCompletions: number;
    completionsByDay: Record<string, number>;
    currentStreaks: number;
    totalPomodoroTime: number;
    pomodorosByDay: Record<string, number>;
    period: {
      days: number;
      startDate: string;
      endDate: string;
    };
  }>> {
    const params = new URLSearchParams();
    if (period) params.append('period', period.toString());
    
    return this.request(`/stats?${params.toString()}`);
  }
}

export const apiService = new ApiService();
