import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Clock, CheckCircle, AlertCircle, Save, Rocket } from 'lucide-react';

interface WorkflowBottomStatusProps {
  lastSaved: Date | null;
  lastPublished: Date | null;
  hasUnsavedChanges: boolean;
}

export function WorkflowBottomStatus({ 
  lastSaved, 
  lastPublished, 
  hasUnsavedChanges 
}: WorkflowBottomStatusProps) {
  const formatRelativeTime = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffMinutes < 1) {
      return 'just now';
    } else if (diffMinutes < 60) {
      return `${diffMinutes} min ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="h-10 border-t bg-card/50 backdrop-blur-sm flex items-center justify-between px-6 text-sm">
      {/* Left Side - Save Status */}
      <div className="flex items-center gap-4">
        {hasUnsavedChanges ? (
          <div className="flex items-center gap-2 text-amber-600">
            <AlertCircle className="w-4 h-4" />
            <span>Unsaved changes</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-4 h-4" />
            <span>All changes saved</span>
          </div>
        )}
        
        {lastSaved && (
          <>
            <Separator orientation="vertical" className="h-4" />
            <div className="flex items-center gap-2 text-muted-foreground">
              <Save className="w-4 h-4" />
              <span>Auto-saved {formatTime(lastSaved)}</span>
            </div>
          </>
        )}
      </div>

      {/* Right Side - Publish Status */}
      <div className="flex items-center gap-4">
        {lastPublished ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Rocket className="w-4 h-4" />
            <span>Last published: {formatRelativeTime(lastPublished)}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>Never published</span>
            <Badge variant="outline" className="text-xs">
              Draft
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
}