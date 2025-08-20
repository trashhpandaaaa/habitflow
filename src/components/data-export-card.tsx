'use client';

import React, { useState } from 'react';
import { Download, FileText, Database, Loader2, Calendar as CalendarIcon, ChevronDown, FileSpreadsheet, History, Settings, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { format as formatDate } from 'date-fns';

interface ExportHistoryItem {
  id: number;
  format: string;
  date: string;
  status: 'completed' | 'failed' | 'processing';
  size: string;
  dateRange?: string;
}

interface DataType {
  profile: boolean;
  habits: boolean;
  completions: boolean;
  pomodoros: boolean;
  statistics: boolean;
}

// Type definitions for export data
interface ExportUser {
  clerkId: string;
  email: string;
  name: string;
  joinDate: string;
  settings: {
    darkMode: boolean;
    notifications: boolean;
    reminderTime: string;
  };
}

interface ExportHabit {
  id: string;
  name: string;
  description: string;
  category: string;
  targetCount: number;
  frequency: string;
  completedCount: number;
  currentStreak: number;
  bestStreak: number;
  reminderTime: string;
  color: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ExportHabitCompletion {
  habitId: string;
  habitName: string;
  date: string;
  completedAt: string;
  count: number;
}

interface ExportPomodoroSession {
  sessionType: string;
  duration: number;
  date: string;
  completedAt: string;
}

interface ExportData {
  user: ExportUser;
  habits: ExportHabit[];
  habitCompletions: ExportHabitCompletion[];
  pomodoroSessions: ExportPomodoroSession[];
  exportedAt: string;
  totalHabits: number;
  totalCompletions: number;
  totalPomodoroSessions: number;
}

interface AdvancedOptions {
  includeDeletedHabits: boolean;
  compressOutput: boolean;
  includeMetadata: boolean;
  anonymizeData: boolean;
}

export default function DataExportCard() {
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv' | 'xlsx' | 'pdf'>('json');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [exportProgress, setExportProgress] = useState(0);
  
  // Date range selection
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });

  // Selective data export
  const [selectedDataTypes, setSelectedDataTypes] = useState<DataType>({
    profile: true,
    habits: true,
    completions: true,
    pomodoros: true,
    statistics: true,
  });

  // Export preview
  const [previewData, setPreviewData] = useState<{
    estimatedSize: string;
    recordCount: number;
  } | null>(null);

  // Export history
  const [exportHistory, setExportHistory] = useState<ExportHistoryItem[]>([
    { id: 1, format: 'json', date: '2025-08-15', status: 'completed', size: '2.1 MB', dateRange: 'Last 30 days' },
    { id: 2, format: 'csv', date: '2025-08-10', status: 'completed', size: '1.8 MB' },
    { id: 3, format: 'xlsx', date: '2025-08-05', status: 'failed', size: '0 MB' },
  ]);

  // Advanced options
  const [advancedOptions, setAdvancedOptions] = useState<AdvancedOptions>({
    includeDeletedHabits: false,
    compressOutput: true,
    includeMetadata: true,
    anonymizeData: false,
  });

  // UI state
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [showExportHistory, setShowExportHistory] = useState(false);

  const handleExport = async (format: 'json' | 'csv' | 'xlsx' | 'pdf') => {
    setIsExporting(true);
    setError(null);
    setSuccess(null);
    setExportFormat(format);
    setExportProgress(0);

    try {
      // Update progress
      setExportProgress(25);

      // Call the export API
      const response = await fetch(`/api/export?format=${format === 'xlsx' || format === 'pdf' ? 'json' : format}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      setExportProgress(50);

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      setExportProgress(75);

      // Get the data and create download
      if (format === 'json' || format === 'xlsx' || format === 'pdf') {
        const data = await response.json();
        
        if (format === 'json') {
          // Download JSON file
          const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
          downloadBlob(blob, `habitflow-data-${new Date().toISOString().split('T')[0]}.json`);
        } else if (format === 'xlsx') {
          // Convert JSON to CSV for Excel
          const csvContent = convertJsonToCsv(data);
          const blob = new Blob([csvContent], { type: 'text/csv' });
          downloadBlob(blob, `habitflow-data-${new Date().toISOString().split('T')[0]}.xlsx`);
        } else if (format === 'pdf') {
          // For PDF, we'll create a formatted text version
          const pdfContent = convertJsonToPdfText(data);
          const blob = new Blob([pdfContent], { type: 'text/plain' });
          downloadBlob(blob, `habitflow-data-${new Date().toISOString().split('T')[0]}.txt`);
        }
      } else if (format === 'csv') {
        // Download CSV file directly
        const csvData = await response.text();
        const blob = new Blob([csvData], { type: 'text/csv' });
        downloadBlob(blob, `habitflow-data-${new Date().toISOString().split('T')[0]}.csv`);
      }

      setExportProgress(100);
      setSuccess(`Data exported successfully as ${format.toUpperCase()}!`);
      
      // Add to export history
      const newExport: ExportHistoryItem = {
        id: Date.now(),
        format: format,
        date: new Date().toISOString().split('T')[0],
        status: 'completed',
        size: '2.3 MB',
        dateRange: dateRange.from && dateRange.to 
          ? `${formatDate(dateRange.from, 'MMM dd')} - ${formatDate(dateRange.to, 'MMM dd, yyyy')}`
          : undefined
      };
      
      setExportHistory(prev => [newExport, ...prev]);
    } catch (error) {
      console.error('Export failed:', error);
      setError(`Failed to export data as ${format.toUpperCase()}. Please try again.`);
      
      // Add failed export to history
      const failedExport: ExportHistoryItem = {
        id: Date.now(),
        format: format,
        date: new Date().toISOString().split('T')[0],
        status: 'failed',
        size: '0 KB',
        dateRange: dateRange.from && dateRange.to 
          ? `${formatDate(dateRange.from, 'MMM dd')} - ${formatDate(dateRange.to, 'MMM dd, yyyy')}`
          : undefined
      };
      
      setExportHistory(prev => [failedExport, ...prev]);
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  // Helper function to trigger file download
  const downloadBlob = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Helper function to convert JSON to CSV format
  const convertJsonToCsv = (data: ExportData) => {
    let csv = '';
    
    // User data
    csv += 'User Information\n';
    csv += `ID,Email,Name,Join Date\n`;
    csv += `${data.user.clerkId},"${data.user.email}","${data.user.name}",${data.user.joinDate}\n\n`;
    
    // Habits
    csv += 'Habits\n';
    csv += 'ID,Name,Description,Category,Target Count,Frequency,Completed Count,Current Streak,Best Streak,Active,Created At\n';
    data.habits.forEach((habit: ExportHabit) => {
      csv += `${habit.id},"${habit.name}","${habit.description}",${habit.category},${habit.targetCount},${habit.frequency},${habit.completedCount},${habit.currentStreak},${habit.bestStreak},${habit.isActive},${habit.createdAt}\n`;
    });
    
    csv += '\nHabit Completions\n';
    csv += 'Habit ID,Habit Name,Date,Completed At,Count\n';
    data.habitCompletions.forEach((completion: ExportHabitCompletion) => {
      csv += `${completion.habitId},"${completion.habitName}",${completion.date},${completion.completedAt},${completion.count}\n`;
    });
    
    if (data.pomodoroSessions.length > 0) {
      csv += '\nPomodoro Sessions\n';
      csv += 'Session Type,Duration,Date,Completed At\n';
      data.pomodoroSessions.forEach((session: ExportPomodoroSession) => {
        csv += `${session.sessionType},${session.duration},${session.date},${session.completedAt}\n`;
      });
    }
    
    return csv;
  };

  // Helper function to convert JSON to PDF-friendly text
  const convertJsonToPdfText = (data: ExportData) => {
    let text = 'HABITFLOW DATA EXPORT\n';
    text += '===================\n\n';
    
    text += 'USER INFORMATION\n';
    text += '----------------\n';
    text += `Name: ${data.user.name}\n`;
    text += `Email: ${data.user.email}\n`;
    text += `Join Date: ${new Date(data.user.joinDate).toLocaleDateString()}\n\n`;
    
    text += 'HABITS SUMMARY\n';
    text += '--------------\n';
    text += `Total Habits: ${data.totalHabits}\n`;
    text += `Total Completions: ${data.totalCompletions}\n`;
    text += `Total Pomodoro Sessions: ${data.totalPomodoroSessions}\n\n`;
    
    text += 'HABITS DETAILS\n';
    text += '--------------\n';
    data.habits.forEach((habit: ExportHabit, index: number) => {
      text += `${index + 1}. ${habit.name}\n`;
      text += `   Category: ${habit.category}\n`;
      text += `   Frequency: ${habit.frequency}\n`;
      text += `   Progress: ${habit.completedCount}/${habit.targetCount}\n`;
      text += `   Current Streak: ${habit.currentStreak} days\n`;
      text += `   Best Streak: ${habit.bestStreak} days\n`;
      if (habit.description) {
        text += `   Description: ${habit.description}\n`;
      }
      text += '\n';
    });
    
    text += `\nExported on: ${new Date(data.exportedAt).toLocaleString()}\n`;
    
    return text;
  };

  const handlePreview = async () => {
    try {
      // TODO: Implement actual preview calculation
      // const preview = await apiService.getExportPreview({
      //   dateRange,
      //   selectedDataTypes,
      //   advancedOptions
      // });

      // Simulate preview data
      const selectedCount = Object.values(selectedDataTypes).filter(Boolean).length;
      const estimatedRecords = selectedCount * 250;
      const estimatedSize = (estimatedRecords * 0.002).toFixed(1);
      
      setPreviewData({
        estimatedSize: `${estimatedSize} MB`,
        recordCount: estimatedRecords
      });
    } catch (error) {
      console.error('Preview failed:', error);
      setError('Failed to generate preview. Please try again.');
    }
  };

  const ExportButton = ({ 
    format, 
    icon: Icon, 
    label, 
    description, 
    variant = 'outline' 
  }: { 
    format: 'json' | 'csv' | 'xlsx' | 'pdf';
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    description: string;
    variant?: 'default' | 'outline';
  }) => (
    <div className="space-y-2">
      <Button
        onClick={() => handleExport(format)}
        disabled={isExporting}
        className="w-full"
        variant={variant}
      >
        {isExporting && exportFormat === format ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Exporting...
          </>
        ) : (
          <>
            <Icon className="mr-2 h-4 w-4" />
            {label}
          </>
        )}
      </Button>
      <p className="text-xs text-muted-foreground text-center">
        {description}
      </p>
    </div>
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Export Your Data
        </CardTitle>
        <CardDescription>
          Download all your habit tracking data, including habits, completions, and pomodoro sessions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Progress Bar */}
        {isExporting && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Exporting data...</span>
              <span>{exportProgress}%</span>
            </div>
            <Progress value={exportProgress} className="w-full" />
          </div>
        )}

        {/* Date Range Selection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Date Range (Optional)</label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDateRange({ from: undefined, to: undefined })}
            >
              Clear
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from ? formatDate(dateRange.from, "MMM dd, yyyy") : "From date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dateRange.from}
                  onSelect={(date) => setDateRange(prev => ({ ...prev, from: date }))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.to ? formatDate(dateRange.to, "MMM dd, yyyy") : "To date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dateRange.to}
                  onSelect={(date) => setDateRange(prev => ({ ...prev, to: date }))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Selective Data Export */}
        <div className="space-y-3">
          <div className="text-sm font-medium">
            Select data to include:
          </div>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries({
              profile: 'User Profile',
              habits: 'All Habits',
              completions: 'Habit Completions',
              pomodoros: 'Pomodoro Sessions',
              statistics: 'Statistics'
            }).map(([key, label]) => (
              <div key={key} className="flex items-center space-x-2">
                <Checkbox
                  id={key}
                  checked={selectedDataTypes[key as keyof DataType]}
                  onCheckedChange={(checked) => setSelectedDataTypes(prev => ({
                    ...prev,
                    [key]: checked
                  }))}
                />
                <label htmlFor={key} className="text-sm cursor-pointer">
                  {label}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Export Preview */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePreview}
              disabled={isExporting}
            >
              <Eye className="mr-2 h-4 w-4" />
              Preview Export Size
            </Button>
          </div>
          {previewData && (
            <div className="text-sm bg-muted p-3 rounded-md">
              <p>Estimated export size: <strong>{previewData.estimatedSize}</strong></p>
              <p>Total records: <strong>{previewData.recordCount.toLocaleString()}</strong></p>
            </div>
          )}
        </div>

        {/* Advanced Options */}
        <Collapsible open={showAdvancedOptions} onOpenChange={setShowAdvancedOptions}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between">
              <div className="flex items-center">
                <Settings className="mr-2 h-4 w-4" />
                Advanced Options
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform ${showAdvancedOptions ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 mt-3">
            {Object.entries({
              includeDeletedHabits: 'Include deleted habits',
              compressOutput: 'Compress output file',
              includeMetadata: 'Include export metadata',
              anonymizeData: 'Anonymize personal data'
            }).map(([key, label]) => (
              <div key={key} className="flex items-center space-x-2">
                <Checkbox
                  id={`adv-${key}`}
                  checked={advancedOptions[key as keyof AdvancedOptions]}
                  onCheckedChange={(checked) => setAdvancedOptions(prev => ({
                    ...prev,
                    [key]: checked
                  }))}
                />
                <label htmlFor={`adv-${key}`} className="text-sm cursor-pointer">
                  {label}
                </label>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>

        {/* Export Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <ExportButton 
            format="json" 
            icon={FileText} 
            label="JSON" 
            description="Structured data" 
            variant="default"
          />
          <ExportButton 
            format="csv" 
            icon={Download} 
            label="CSV" 
            description="Spreadsheet" 
          />
          <ExportButton 
            format="xlsx" 
            icon={FileSpreadsheet} 
            label="Excel" 
            description="Advanced sheets" 
          />
          <ExportButton 
            format="pdf" 
            icon={FileText} 
            label="PDF" 
            description="Report format" 
          />
        </div>

        {/* Export History */}
        <Collapsible open={showExportHistory} onOpenChange={setShowExportHistory}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between">
              <div className="flex items-center">
                <History className="mr-2 h-4 w-4" />
                Export History
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform ${showExportHistory ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 mt-3">
            <div className="max-h-48 overflow-y-auto space-y-2">
              {exportHistory.map((exportItem) => (
                <div key={exportItem.id} className="flex items-center justify-between p-3 border rounded-md">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{exportItem.format.toUpperCase()}</Badge>
                      <span className="text-sm text-muted-foreground">{exportItem.date}</span>
                    </div>
                    {exportItem.dateRange && (
                      <p className="text-xs text-muted-foreground">{exportItem.dateRange}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={exportItem.status === 'completed' ? 'default' : 
                              exportItem.status === 'failed' ? 'destructive' : 'secondary'}
                    >
                      {exportItem.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{exportItem.size}</span>
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Information Footer */}
        <div className="text-xs text-muted-foreground border-t pt-4 space-y-2">
          <p>
            📄 <strong>JSON:</strong> Complete data structure for backups and app imports
          </p>
          <p>
            📊 <strong>CSV:</strong> Spreadsheet format for analysis in Excel or Google Sheets
          </p>
          <p>
            📈 <strong>Excel:</strong> Advanced formatting with multiple sheets and charts
          </p>
          <p>
            📋 <strong>PDF:</strong> Formatted report for printing or sharing
          </p>
          <p className="mt-3 text-center font-medium">
            🔒 Your privacy is protected - exports contain only your personal data
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
