import { supabase } from '@/integrations/supabase/client';
import { DrawingTool } from '@/lib/chartDrawingTools';

export interface ChartDrawing {
  id: string;
  agent_id: string;
  user_id: string;
  drawing_type: 'trendline' | 'horizontal' | 'text';
  drawing_data: any;
  visible: boolean;
  created_at: string;
  updated_at: string;
}

export class ChartDrawingPersistence {
  private agentId: string;
  private userId: string | null = null;

  constructor(agentId: string) {
    this.agentId = agentId;
    this.initializeUser();
  }

  private async initializeUser() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      this.userId = session?.user?.id || null;
    } catch (error) {
      console.warn('Failed to get user session for drawings:', error);
    }
  }

  async saveDrawing(drawing: DrawingTool): Promise<boolean> {
    if (!this.userId) {
      console.warn('No user session, falling back to localStorage');
      return this.saveToLocalStorage(drawing);
    }

    try {
      const { error } = await (supabase as any)
        .from('chart_drawings')
        .upsert({
          id: drawing.id,
          agent_id: this.agentId,
          user_id: this.userId,
          drawing_type: drawing.type,
          drawing_data: drawing.data,
          visible: drawing.visible,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.warn('Database save failed, using localStorage:', error);
        return this.saveToLocalStorage(drawing);
      }

      console.log('Drawing saved to database:', drawing.id);
      return true;
    } catch (error) {
      console.warn('Database error, using localStorage:', error);
      return this.saveToLocalStorage(drawing);
    }
  }

  async loadDrawings(): Promise<DrawingTool[]> {
    if (!this.userId) {
      console.warn('No user session, loading from localStorage');
      return this.loadFromLocalStorage();
    }

    try {
      const { data, error } = await (supabase as any)
        .from('chart_drawings')
        .select('*')
        .eq('agent_id', this.agentId)
        .eq('user_id', this.userId)
        .order('created_at', { ascending: true });

      if (error) {
        console.warn('Database load failed, using localStorage:', error);
        return this.loadFromLocalStorage();
      }

      const drawings: DrawingTool[] = (data || []).map((item: any) => ({
        id: item.id,
        type: item.drawing_type,
        data: item.drawing_data,
        visible: item.visible,
      }));

      console.log('Loaded', drawings.length, 'drawings from database');
      return drawings;
    } catch (error) {
      console.warn('Database error, using localStorage:', error);
      return this.loadFromLocalStorage();
    }
  }

  async removeDrawing(drawingId: string): Promise<boolean> {
    if (!this.userId) {
      return this.removeFromLocalStorage(drawingId);
    }

    try {
      const { error } = await (supabase as any)
        .from('chart_drawings')
        .delete()
        .eq('id', drawingId)
        .eq('user_id', this.userId);

      if (error) {
        console.warn('Database delete failed, using localStorage:', error);
        return this.removeFromLocalStorage(drawingId);
      }

      console.log('Drawing removed from database:', drawingId);
      return true;
    } catch (error) {
      console.warn('Database error, using localStorage:', error);
      return this.removeFromLocalStorage(drawingId);
    }
  }

  async clearAllDrawings(): Promise<boolean> {
    if (!this.userId) {
      return this.clearLocalStorage();
    }

    try {
      const { error } = await (supabase as any)
        .from('chart_drawings')
        .delete()
        .eq('agent_id', this.agentId)
        .eq('user_id', this.userId);

      if (error) {
        console.warn('Database clear failed, using localStorage:', error);
        return this.clearLocalStorage();
      }

      console.log('All drawings cleared from database');
      return true;
    } catch (error) {
      console.warn('Database error, using localStorage:', error);
      return this.clearLocalStorage();
    }
  }

  async updateDrawingVisibility(drawingId: string, visible: boolean): Promise<boolean> {
    if (!this.userId) {
      const drawings = this.loadFromLocalStorage();
      const updated = drawings.map(d => 
        d.id === drawingId ? { ...d, visible } : d
      );
      this.saveAllToLocalStorage(updated);
      return true;
    }

    try {
      const { error } = await (supabase as any)
        .from('chart_drawings')
        .update({ 
          visible, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', drawingId)
        .eq('user_id', this.userId);

      if (error) {
        console.warn('Database visibility update failed:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.warn('Database error updating visibility:', error);
      return false;
    }
  }

  // Fallback localStorage methods
  private saveToLocalStorage(drawing: DrawingTool): boolean {
    try {
      const existing = this.loadFromLocalStorage();
      const updated = existing.filter(d => d.id !== drawing.id);
      updated.push(drawing);
      
      localStorage.setItem(
        `chart_drawings_${this.agentId}`,
        JSON.stringify(updated)
      );
      return true;
    } catch (error) {
      console.error('LocalStorage save failed:', error);
      return false;
    }
  }

  private loadFromLocalStorage(): DrawingTool[] {
    try {
      const saved = localStorage.getItem(`chart_drawings_${this.agentId}`);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('LocalStorage load failed:', error);
      return [];
    }
  }

  private removeFromLocalStorage(drawingId: string): boolean {
    try {
      const existing = this.loadFromLocalStorage();
      const filtered = existing.filter(d => d.id !== drawingId);
      localStorage.setItem(
        `chart_drawings_${this.agentId}`,
        JSON.stringify(filtered)
      );
      return true;
    } catch (error) {
      console.error('LocalStorage remove failed:', error);
      return false;
    }
  }

  private clearLocalStorage(): boolean {
    try {
      localStorage.removeItem(`chart_drawings_${this.agentId}`);
      return true;
    } catch (error) {
      console.error('LocalStorage clear failed:', error);
      return false;
    }
  }

  private saveAllToLocalStorage(drawings: DrawingTool[]): boolean {
    try {
      localStorage.setItem(
        `chart_drawings_${this.agentId}`,
        JSON.stringify(drawings)
      );
      return true;
    } catch (error) {
      console.error('LocalStorage save all failed:', error);
      return false;
    }
  }
}