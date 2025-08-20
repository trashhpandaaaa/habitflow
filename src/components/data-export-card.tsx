'use client';

import React, { useState } from 'react';
import { Download, FileText, Database, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { apiService } from '@/services/api';

interface ExportStats {
  totalHabits: number;
  totalCompletions: number;
  totalPomodoroSessions: number;
}

export default function DataExportCard() {
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleExport = async (format: 'json' | 'csv') => {
    setIsExporting(true);
    setError(null);
    setSuccess(null);

    try {
      await apiService.downloadExport(format);
      setSuccess(`Data exported successfully as ${format.toUpperCase()}!`);
    } catch (error) {
      console.error('Export failed:', error);
      setError(`Failed to export data as ${format.toUpperCase()}. Please try again.`);
    } finally {
      setIsExporting(false);
    }
  };

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
      <CardContent className="space-y-4">
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

        <div className="space-y-3">
          <div className="text-sm text-muted-foreground">
            Your export will include:
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">User Profile</Badge>
            <Badge variant="secondary">All Habits</Badge>
            <Badge variant="secondary">Habit Completions</Badge>
            <Badge variant="secondary">Pomodoro Sessions</Badge>
            <Badge variant="secondary">Statistics</Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-2">
            <Button
              onClick={() => handleExport('json')}
              disabled={isExporting}
              className="w-full"
              variant="default"
            >
              {isExporting && exportFormat === 'json' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Export as JSON
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Structured data format
            </p>
          </div>

          <div className="space-y-2">
            <Button
              onClick={() => handleExport('csv')}
              disabled={isExporting}
              className="w-full"
              variant="outline"
            >
              {isExporting && exportFormat === 'csv' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Export as CSV
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Spreadsheet compatible
            </p>
          </div>
        </div>

        <div className="text-xs text-muted-foreground border-t pt-3">
          <p>
            📄 <strong>JSON format:</strong> Perfect for importing into other apps or backing up your complete data structure.
          </p>
          <p className="mt-1">
            📊 <strong>CSV format:</strong> Great for analysis in Excel, Google Sheets, or other spreadsheet applications.
          </p>
          <p className="mt-2 text-center font-medium">
            Your data privacy is important - exports contain only your personal habit tracking data.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
