import { useEffect, useRef, useState } from 'react';
import { IChartApi } from 'lightweight-charts';

interface UseMobileGesturesProps {
  chart: IChartApi | null;
  containerRef: React.RefObject<HTMLDivElement>;
  enabled?: boolean;
}

interface TouchState {
  startDistance: number;
  startScale: number;
  startTime: number;
  lastTouches: TouchList | null;
  isZooming: boolean;
  isPanning: boolean;
}

export const useMobileGestures = ({ chart, containerRef, enabled = true }: UseMobileGesturesProps) => {
  const touchStateRef = useRef<TouchState>({
    startDistance: 0,
    startScale: 1,
    startTime: 0,
    lastTouches: null,
    isZooming: false,
    isPanning: false,
  });

  const [gestureActive, setGestureActive] = useState(false);

  // Calculate distance between two touches
  const getTouchDistance = (touches: TouchList): number => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Calculate center point between two touches
  const getTouchCenter = (touches: TouchList): { x: number; y: number } => {
    if (touches.length < 2) return { x: 0, y: 0 };
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2,
    };
  };

  useEffect(() => {
    if (!chart || !containerRef.current || !enabled) return;

    const container = containerRef.current;
    const touchState = touchStateRef.current;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        // Two finger gesture - zooming
        e.preventDefault();
        touchState.isZooming = true;
        touchState.startDistance = getTouchDistance(e.touches);
        touchState.startTime = Date.now();
        touchState.lastTouches = e.touches;
        setGestureActive(true);
        
        console.log('Pinch gesture started');
      } else if (e.touches.length === 1) {
        // Single finger - potential panning
        touchState.isPanning = true;
        touchState.lastTouches = e.touches;
        touchState.startTime = Date.now();
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();

      if (touchState.isZooming && e.touches.length === 2) {
        const currentDistance = getTouchDistance(e.touches);
        const scale = currentDistance / touchState.startDistance;
        
        // Apply zoom with smooth scaling
        const timeScale = chart.timeScale();
        const visibleRange = timeScale.getVisibleLogicalRange();
        
        if (visibleRange && scale !== 1) {
          const center = getTouchCenter(e.touches);
          const containerRect = container.getBoundingClientRect();
          const relativeX = (center.x - containerRect.left) / containerRect.width;
          
          // Calculate new range based on zoom
          const currentRangeSize = visibleRange.to - visibleRange.from;
          const newRangeSize = currentRangeSize / scale;
          const centerLogical = visibleRange.from + (currentRangeSize * relativeX);
          
          const newFrom = centerLogical - (newRangeSize * relativeX);
          const newTo = centerLogical + (newRangeSize * (1 - relativeX));
          
          try {
            timeScale.setVisibleLogicalRange({
              from: newFrom,
              to: newTo,
            });
          } catch (error) {
            console.warn('Zoom gesture error:', error);
          }
        }
        
        touchState.startDistance = currentDistance;
      } else if (touchState.isPanning && e.touches.length === 1 && touchState.lastTouches) {
        // Handle panning
        const deltaX = e.touches[0].clientX - touchState.lastTouches[0].clientX;
        const timeScale = chart.timeScale();
        const visibleRange = timeScale.getVisibleLogicalRange();
        
        if (visibleRange && Math.abs(deltaX) > 5) {
          const containerWidth = container.clientWidth;
          const logicalDelta = (deltaX / containerWidth) * (visibleRange.to - visibleRange.from);
          
          try {
            timeScale.setVisibleLogicalRange({
              from: visibleRange.from - logicalDelta,
              to: visibleRange.to - logicalDelta,
            });
          } catch (error) {
            console.warn('Pan gesture error:', error);
          }
        }
      }
      
      touchState.lastTouches = e.touches;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const duration = Date.now() - touchState.startTime;
      
      if (touchState.isZooming) {
        touchState.isZooming = false;
        setGestureActive(false);
        console.log('Pinch gesture ended');
      }
      
      if (touchState.isPanning) {
        touchState.isPanning = false;
        
        // Detect swipe gestures
        if (duration < 300 && touchState.lastTouches && e.changedTouches.length === 1) {
          const touch = e.changedTouches[0];
          const lastTouch = touchState.lastTouches[0];
          const deltaX = touch.clientX - lastTouch.clientX;
          const deltaY = touch.clientY - lastTouch.clientY;
          
          // Horizontal swipe for time navigation
          if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
            const timeScale = chart.timeScale();
            const visibleRange = timeScale.getVisibleLogicalRange();
            
            if (visibleRange) {
              const swipeDirection = deltaX > 0 ? -1 : 1; // Opposite of drag direction
              const rangeSize = visibleRange.to - visibleRange.from;
              const swipeOffset = rangeSize * 0.3 * swipeDirection;
              
              try {
                timeScale.setVisibleLogicalRange({
                  from: visibleRange.from + swipeOffset,
                  to: visibleRange.to + swipeOffset,
                });
                console.log('Swipe navigation:', swipeDirection > 0 ? 'forward' : 'backward');
              } catch (error) {
                console.warn('Swipe navigation error:', error);
              }
            }
          }
        }
      }
      
      touchState.lastTouches = null;
    };

    // Add touch event listeners with passive: false to allow preventDefault
    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: false });
    container.addEventListener('touchcancel', handleTouchEnd, { passive: false });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [chart, containerRef, enabled]);

  const resetZoom = () => {
    if (chart) {
      chart.timeScale().fitContent();
      console.log('Chart zoom reset');
    }
  };

  const zoomIn = () => {
    if (chart) {
      const timeScale = chart.timeScale();
      const visibleRange = timeScale.getVisibleLogicalRange();
      
      if (visibleRange) {
        const center = (visibleRange.from + visibleRange.to) / 2;
        const newSize = (visibleRange.to - visibleRange.from) * 0.8;
        
        try {
          timeScale.setVisibleLogicalRange({
            from: center - newSize / 2,
            to: center + newSize / 2,
          });
        } catch (error) {
          console.warn('Zoom in error:', error);
        }
      }
    }
  };

  const zoomOut = () => {
    if (chart) {
      const timeScale = chart.timeScale();
      const visibleRange = timeScale.getVisibleLogicalRange();
      
      if (visibleRange) {
        const center = (visibleRange.from + visibleRange.to) / 2;
        const newSize = (visibleRange.to - visibleRange.from) * 1.25;
        
        try {
          timeScale.setVisibleLogicalRange({
            from: center - newSize / 2,
            to: center + newSize / 2,
          });
        } catch (error) {
          console.warn('Zoom out error:', error);
        }
      }
    }
  };

  return {
    gestureActive,
    resetZoom,
    zoomIn,
    zoomOut,
    isZooming: touchStateRef.current.isZooming,
    isPanning: touchStateRef.current.isPanning,
  };
};