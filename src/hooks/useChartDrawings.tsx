import { useEffect, useRef, useState } from 'react';
import { IChartApi } from 'lightweight-charts';
import { ChartDrawingManager, DrawingTool } from '@/lib/chartDrawingTools';

interface UseChartDrawingsProps {
  chart: IChartApi | null;
  agentId: string;
  enabled?: boolean;
}

export const useChartDrawings = ({ chart, agentId, enabled = true }: UseChartDrawingsProps) => {
  const drawingManagerRef = useRef<ChartDrawingManager | null>(null);
  const [activeDrawingMode, setActiveDrawingMode] = useState<'trendline' | 'horizontal' | 'text' | null>(null);
  const [drawings, setDrawings] = useState<DrawingTool[]>([]);

  // Initialize drawing manager
  useEffect(() => {
    if (!chart || !enabled || !agentId) return;

    const manager = new ChartDrawingManager(chart, agentId);
    drawingManagerRef.current = manager;
    
    // Load existing drawings
    setDrawings(manager.getDrawings());

    return () => {
      manager.destroy();
      drawingManagerRef.current = null;
    };
  }, [chart, agentId, enabled]);

  const setDrawingMode = (mode: 'trendline' | 'horizontal' | 'text' | null) => {
    if (drawingManagerRef.current) {
      drawingManagerRef.current.setDrawingMode(mode);
      setActiveDrawingMode(mode);
      console.log('Drawing mode changed to:', mode);
    }
  };

  const createHorizontalLine = (price: number, options?: any) => {
    if (drawingManagerRef.current) {
      const id = drawingManagerRef.current.createHorizontalLine(price, options);
      setDrawings(drawingManagerRef.current.getDrawings());
      return id;
    }
  };

  const createTextAnnotation = (time: any, price: number, text: string, options?: any) => {
    if (drawingManagerRef.current) {
      const id = drawingManagerRef.current.createTextAnnotation(time, price, text, options);
      setDrawings(drawingManagerRef.current.getDrawings());
      return id;
    }
  };

  const removeDrawing = (id: string) => {
    if (drawingManagerRef.current) {
      drawingManagerRef.current.removeDrawing(id);
      setDrawings(drawingManagerRef.current.getDrawings());
    }
  };

  const clearAllDrawings = () => {
    if (drawingManagerRef.current) {
      drawingManagerRef.current.clearAllDrawings();
      setDrawings([]);
    }
  };

  const toggleDrawingVisibility = (id: string) => {
    if (drawingManagerRef.current) {
      drawingManagerRef.current.toggleDrawingVisibility(id);
      setDrawings(drawingManagerRef.current.getDrawings());
    }
  };

  return {
    // State
    activeDrawingMode,
    drawings,
    drawingCount: drawings.length,
    
    // Actions
    setDrawingMode,
    createHorizontalLine,
    createTextAnnotation,
    removeDrawing,
    clearAllDrawings,
    toggleDrawingVisibility,
    
    // Manager reference
    drawingManager: drawingManagerRef.current,
  };
};