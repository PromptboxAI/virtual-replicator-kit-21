import { IChartApi, ISeriesApi, Time } from 'lightweight-charts';

export interface DrawingTool {
  id: string;
  type: 'trendline' | 'horizontal' | 'text';
  data: any;
  visible: boolean;
}

export interface TrendLineData {
  startTime: Time;
  startPrice: number;
  endTime: Time;
  endPrice: number;
  color: string;
  width: number;
}

export interface HorizontalLineData {
  price: number;
  color: string;
  width: number;
  style: 'solid' | 'dashed';
}

export interface TextAnnotationData {
  time: Time;
  price: number;
  text: string;
  color: string;
  backgroundColor: string;
}

export class ChartDrawingManager {
  private chart: IChartApi;
  private drawings: Map<string, DrawingTool> = new Map();
  private drawingSeries: Map<string, ISeriesApi<any>> = new Map();
  private agentId: string;
  private isDrawing = false;
  private currentDrawingType: 'trendline' | 'horizontal' | 'text' | null = null;

  constructor(chart: IChartApi, agentId: string) {
    this.chart = chart;
    this.agentId = agentId;
    this.loadDrawings();
    this.setupEventListeners();
  }

  private setupEventListeners() {
    // Handle mouse events for drawing
    this.chart.subscribeClick((param: any) => {
      if (this.currentDrawingType && param.time && param.seriesData && param.seriesData.size > 0) {
        // Get price from the first series data
        const firstSeriesData = Array.from(param.seriesData.values())[0] as any;
        const price = firstSeriesData?.close || firstSeriesData?.value || 0;
        this.handleClick(param.time, price);
      }
    });
  }

  setDrawingMode(type: 'trendline' | 'horizontal' | 'text' | null) {
    this.currentDrawingType = type;
    this.isDrawing = type !== null;
    console.log('Drawing mode set to:', type);
  }

  private handleClick(time: Time, price: number) {
    switch (this.currentDrawingType) {
      case 'horizontal':
        this.createHorizontalLine(price);
        break;
      case 'text':
        this.createTextAnnotation(time, price, 'Note');
        break;
      // Trendline requires two clicks, implement if needed
    }
  }

  createHorizontalLine(price: number, options?: Partial<HorizontalLineData>) {
    const id = `horizontal_${Date.now()}`;
    const lineData: HorizontalLineData = {
      price,
      color: options?.color || '#f59e0b',
      width: options?.width || 2,
      style: options?.style || 'solid',
    };

    const lineSeries = this.chart.addSeries('Line', {
      color: lineData.color,
      lineWidth: lineData.width,
      lineStyle: lineData.style === 'dashed' ? 1 : 0,
      priceLineVisible: false,
      crosshairMarkerVisible: false,
    });

    // Create horizontal line data
    const timeScale = this.chart.timeScale();
    const visibleRange = timeScale.getVisibleLogicalRange();
    
    if (visibleRange) {
      const linePoints = [
        { time: timeScale.coordinateToTime(0) as Time, value: price },
        { time: timeScale.coordinateToTime(1000) as Time, value: price },
      ];
      lineSeries.setData(linePoints);
    }

    const drawing: DrawingTool = {
      id,
      type: 'horizontal',
      data: lineData,
      visible: true,
    };

    this.drawings.set(id, drawing);
    this.drawingSeries.set(id, lineSeries);
    this.saveDrawings();

    console.log('Created horizontal line at price:', price);
    return id;
  }

  createTextAnnotation(time: Time, price: number, text: string, options?: Partial<TextAnnotationData>) {
    const id = `text_${Date.now()}`;
    const textData: TextAnnotationData = {
      time,
      price,
      text,
      color: options?.color || '#ffffff',
      backgroundColor: options?.backgroundColor || '#3b82f6',
    };

    // Create a line series for the text marker
    const markerSeries = this.chart.addSeries('Line', {
      color: 'transparent',
      priceLineVisible: false,
      crosshairMarkerVisible: false,
    });

    markerSeries.setData([{ time, value: price }]);
    
    // Note: Markers are not directly supported in this version
    // This is a simplified implementation
    console.log('Text annotation created (markers not fully supported):', text);

    const drawing: DrawingTool = {
      id,
      type: 'text',
      data: textData,
      visible: true,
    };

    this.drawings.set(id, drawing);
    this.drawingSeries.set(id, markerSeries);
    this.saveDrawings();

    console.log('Created text annotation:', text, 'at', time, price);
    return id;
  }

  removeDrawing(id: string) {
    const series = this.drawingSeries.get(id);
    if (series) {
      this.chart.removeSeries(series);
      this.drawingSeries.delete(id);
    }
    this.drawings.delete(id);
    this.saveDrawings();
    console.log('Removed drawing:', id);
  }

  clearAllDrawings() {
    this.drawingSeries.forEach((series) => {
      this.chart.removeSeries(series);
    });
    this.drawings.clear();
    this.drawingSeries.clear();
    this.saveDrawings();
    console.log('Cleared all drawings');
  }

  toggleDrawingVisibility(id: string) {
    const drawing = this.drawings.get(id);
    const series = this.drawingSeries.get(id);
    
    if (drawing && series) {
      drawing.visible = !drawing.visible;
      // Toggle visibility by changing opacity
      const options = series.options();
      (series as any).applyOptions({
        ...options,
        color: drawing.visible ? drawing.data.color : 'transparent',
      });
      this.saveDrawings();
    }
  }

  getDrawings(): DrawingTool[] {
    return Array.from(this.drawings.values());
  }

  private saveDrawings() {
    try {
      const drawingsData = Array.from(this.drawings.entries());
      localStorage.setItem(`chart_drawings_${this.agentId}`, JSON.stringify(drawingsData));
    } catch (error) {
      console.warn('Failed to save drawings:', error);
    }
  }

  private loadDrawings() {
    try {
      const saved = localStorage.getItem(`chart_drawings_${this.agentId}`);
      if (saved) {
        const drawingsData = JSON.parse(saved) as [string, DrawingTool][];
        drawingsData.forEach(([id, drawing]) => {
          this.drawings.set(id, drawing);
          // Recreate series for loaded drawings
          this.recreateDrawing(id, drawing);
        });
        console.log('Loaded', drawingsData.length, 'drawings');
      }
    } catch (error) {
      console.warn('Failed to load drawings:', error);
    }
  }

  private recreateDrawing(id: string, drawing: DrawingTool) {
    switch (drawing.type) {
      case 'horizontal':
        this.recreateHorizontalLine(id, drawing.data as HorizontalLineData);
        break;
      case 'text':
        this.recreateTextAnnotation(id, drawing.data as TextAnnotationData);
        break;
    }
  }

  private recreateHorizontalLine(id: string, data: HorizontalLineData) {
    const lineSeries = this.chart.addSeries('Line', {
      color: data.color,
      lineWidth: data.width,
      lineStyle: data.style === 'dashed' ? 1 : 0,
      priceLineVisible: false,
      crosshairMarkerVisible: false,
    });

    const timeScale = this.chart.timeScale();
    const visibleRange = timeScale.getVisibleLogicalRange();
    
    if (visibleRange) {
      const linePoints = [
        { time: timeScale.coordinateToTime(0) as Time, value: data.price },
        { time: timeScale.coordinateToTime(1000) as Time, value: data.price },
      ];
      lineSeries.setData(linePoints);
    }

    this.drawingSeries.set(id, lineSeries);
  }

  private recreateTextAnnotation(id: string, data: TextAnnotationData) {
    const markerSeries = this.chart.addSeries('Line', {
      color: 'transparent',
      priceLineVisible: false,
      crosshairMarkerVisible: false,
    });

    markerSeries.setData([{ time: data.time, value: data.price }]);
    // Note: Markers not fully supported in this implementation
    
    this.drawingSeries.set(id, markerSeries);
  }

  destroy() {
    this.clearAllDrawings();
    this.currentDrawingType = null;
    this.isDrawing = false;
  }
}