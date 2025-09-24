import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  TrendingUp, Minus, Type, Trash2, Eye, EyeOff,
  Download, Camera, RotateCcw, ZoomIn, ZoomOut,
  Maximize, Settings, Target
} from 'lucide-react';

export interface ChartToolbarProps {
  // Drawing tools
  onDrawingModeChange: (mode: 'trendline' | 'horizontal' | 'text' | null) => void;
  activeDrawingMode: 'trendline' | 'horizontal' | 'text' | null;
  
  // Chart controls
  onResetZoom: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFullscreen: () => void;
  onScreenshot: () => void;
  onExportData: () => void;
  
  // Drawing management
  onClearDrawings: () => void;
  drawingCount: number;
  
  // Overlays
  onToggleGraduation: () => void;
  graduationVisible: boolean;
  
  // Mobile
  isMobile?: boolean;
}

export const ChartToolbar: React.FC<ChartToolbarProps> = ({
  onDrawingModeChange,
  activeDrawingMode,
  onResetZoom,
  onZoomIn,
  onZoomOut,
  onFullscreen,
  onScreenshot,
  onExportData,
  onClearDrawings,
  drawingCount,
  onToggleGraduation,
  graduationVisible,
  isMobile = false
}) => {
  const drawingTools = [
    { mode: 'trendline' as const, icon: TrendingUp, label: 'Trend Line', disabled: true },
    { mode: 'horizontal' as const, icon: Minus, label: 'Horizontal Line' },
    { mode: 'text' as const, icon: Type, label: 'Text Note' },
  ];

  const chartControls = [
    { action: onResetZoom, icon: RotateCcw, label: 'Reset View' },
    { action: onZoomIn, icon: ZoomIn, label: 'Zoom In' },
    { action: onZoomOut, icon: ZoomOut, label: 'Zoom Out' },
    { action: onFullscreen, icon: Maximize, label: 'Fullscreen' },
  ];

  const exportTools = [
    { action: onScreenshot, icon: Camera, label: 'Screenshot' },
    { action: onExportData, icon: Download, label: 'Export Data' },
  ];

  if (isMobile) {
    return (
      <div className="flex items-center justify-between p-2 bg-background/80 backdrop-blur-sm border-t border-border">
        <div className="flex items-center gap-1">
          {/* Essential mobile controls */}
          <Button
            variant={activeDrawingMode === 'horizontal' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onDrawingModeChange(activeDrawingMode === 'horizontal' ? null : 'horizontal')}
          >
            <Minus className="h-4 w-4" />
          </Button>
          
          <Button
            variant={graduationVisible ? 'default' : 'ghost'}
            size="sm"
            onClick={onToggleGraduation}
          >
            <Target className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={onResetZoom}>
            <RotateCcw className="h-4 w-4" />
          </Button>
          
          <Button variant="ghost" size="sm" onClick={onFullscreen}>
            <Maximize className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-3 bg-background/80 backdrop-blur-sm border-b border-border">
      <div className="flex items-center gap-4">
        {/* Drawing Tools */}
        <div className="flex items-center gap-1">
          <span className="text-xs font-medium text-muted-foreground mr-2">Draw:</span>
          {drawingTools.map(({ mode, icon: Icon, label, disabled }) => (
            <Button
              key={mode}
              variant={activeDrawingMode === mode ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onDrawingModeChange(activeDrawingMode === mode ? null : mode)}
              disabled={disabled}
              title={disabled ? 'Coming Soon' : label}
            >
              <Icon className="h-4 w-4" />
            </Button>
          ))}
          
          {drawingCount > 0 && (
            <>
              <Badge variant="secondary" className="text-xs">
                {drawingCount}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearDrawings}
                title="Clear All Drawings"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Overlays */}
        <div className="flex items-center gap-1">
          <span className="text-xs font-medium text-muted-foreground mr-2">Show:</span>
          <Button
            variant={graduationVisible ? 'default' : 'ghost'}
            size="sm"
            onClick={onToggleGraduation}
            title="Graduation Threshold"
          >
            <Target className="h-4 w-4" />
            {graduationVisible ? <Eye className="h-3 w-3 ml-1" /> : <EyeOff className="h-3 w-3 ml-1" />}
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Chart Controls */}
        <div className="flex items-center gap-1">
          {chartControls.map(({ action, icon: Icon, label }, index) => (
            <Button
              key={index}
              variant="ghost"
              size="sm"
              onClick={action}
              title={label}
            >
              <Icon className="h-4 w-4" />
            </Button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-1">
        {/* Export Tools */}
        {exportTools.map(({ action, icon: Icon, label }, index) => (
          <Button
            key={index}
            variant="ghost"
            size="sm"
            onClick={action}
            title={label}
          >
            <Icon className="h-4 w-4" />
          </Button>
        ))}
      </div>
    </div>
  );
};