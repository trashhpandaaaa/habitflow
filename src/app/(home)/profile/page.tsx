"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { User, Settings, Moon, Sun, Bell, Trash2 } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import DataExportCard from "@/components/data-export-card";

interface UserProfile {
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

export default function ProfilePage() {
  const { user: clerkUser, isLoaded, isSignedIn } = useUser();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      loadProfile();
    } else if (isLoaded && !isSignedIn) {
      setIsLoading(false);
    }
  }, [isLoaded, isSignedIn]);

  const loadProfile = async () => {
    try {
      console.log('Loading profile...');
      const response = await fetch('/api/user/profile');
      const data = await response.json();
      
      console.log('Profile API response:', { status: response.status, data });
      
      if (response.ok && data.user) {
        console.log('Profile loaded successfully:', data.user);
        setProfile(data.user);
      } else {
        console.error('Failed to load profile:', data.error || 'Unknown error');
        // Don't clear profile on error - let user retry
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      // Don't clear profile on network error - let user retry
    } finally {
      setIsLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!profile) return;
    
    setIsSaving(true);
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: profile.name,
          preferences: profile.preferences,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.user) {
        setProfile(data.user);
        setIsEditing(false);
      } else {
        console.error('Failed to update profile:', data.error);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    if (!profile) return;
    setProfile(prev => ({ ...prev!, [field]: value }));
  };

  const handlePreferenceChange = (key: keyof UserProfile['preferences'], value: boolean | string) => {
    if (!profile) return;
    setProfile(prev => ({
      ...prev!,
      preferences: {
        ...prev!.preferences,
        [key]: value
      }
    }));
  };

  const deleteAccount = () => {
    // This would implement account deletion
    console.log("Deleting account...");
  };

  if (!isLoaded || isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Please sign in to view your profile</h1>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-red-600">Profile not loaded</h1>
          <div className="space-y-2">
            <p>Debug information:</p>
            <p>Clerk loaded: {isLoaded ? 'Yes' : 'No'}</p>
            <p>Signed in: {isSignedIn ? 'Yes' : 'No'}</p>
            <p>Clerk user: {clerkUser?.id || 'None'}</p>
            <p>Profile data: {profile ? 'Loaded' : 'Not loaded'}</p>
          </div>
          <Button onClick={loadProfile} className="mt-4">Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Profile & Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your account and customize your experience
          </p>
        </div>
      </div>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              {isEditing ? (
                <Input
                  id="name"
                  value={profile.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                />
              ) : (
                <div className="p-2 bg-muted rounded-md">{profile.name}</div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="p-2 bg-muted rounded-md">{profile.email}</div>
            </div>

            <div className="space-y-2">
              <Label>Member Since</Label>
              <div className="p-2 bg-muted rounded-md">
                {new Date(profile.joinDate).toLocaleDateString()}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reminderTime">Daily Reminder Time</Label>
              {isEditing ? (
                <Input
                  id="reminderTime"
                  type="time"
                  value={profile.preferences.reminderTime}
                  onChange={(e) => handlePreferenceChange('reminderTime', e.target.value)}
                />
              ) : (
                <div className="p-2 bg-muted rounded-md">{profile.preferences.reminderTime}</div>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            {isEditing ? (
              <>
                <Button onClick={saveProfile} disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Dark Mode</Label>
              <p className="text-sm text-muted-foreground">
                Switch between light and dark themes
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Sun className="h-4 w-4" />
              <Switch
                checked={profile.preferences.darkMode}
                onCheckedChange={(checked) => handlePreferenceChange('darkMode', checked)}
              />
              <Moon className="h-4 w-4" />
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Push Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive daily reminders for your habits
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <Switch
                checked={profile.preferences.notifications}
                onCheckedChange={(checked) => handlePreferenceChange('notifications', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Export */}
      <DataExportCard />

      {/* Account Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This action is irreversible. All your habit data, completions, and pomodoro sessions will be permanently deleted.
            </p>
            <Button variant="destructive" onClick={deleteAccount}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
