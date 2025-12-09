import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLocation } from 'react-router-dom';

export interface SiteMetadata {
  id: string;
  page_path: string;
  page_name: string;
  title: string | null;
  description: string | null;
  og_image_url: string | null;
  keywords: string | null;
  is_indexable: boolean;
  is_dynamic: boolean;
  title_template: string | null;
  description_template: string | null;
  is_global: boolean;
  favicon_url: string | null;
  created_at: string;
  updated_at: string;
}

export function useSiteMetadata() {
  return useQuery({
    queryKey: ['site-metadata'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_metadata')
        .select('*')
        .order('page_path');
      
      if (error) throw error;
      return data as SiteMetadata[];
    },
  });
}

export function useGlobalMetadata() {
  return useQuery({
    queryKey: ['site-metadata', 'global'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_metadata')
        .select('*')
        .eq('is_global', true)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data as SiteMetadata | null;
    },
  });
}

export function usePageMetadata(pagePath: string) {
  const { data: allMetadata } = useSiteMetadata();
  const { data: globalMetadata } = useGlobalMetadata();
  
  // Find exact match or dynamic route match
  const pageMetadata = allMetadata?.find(m => {
    if (m.page_path === pagePath) return true;
    
    // Check for dynamic route match
    if (m.is_dynamic) {
      const pattern = m.page_path.replace(/:[^/]+/g, '[^/]+');
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(pagePath);
    }
    
    return false;
  });
  
  return {
    pageMetadata,
    globalMetadata,
    title: pageMetadata?.title || globalMetadata?.title || 'PromptBox',
    description: pageMetadata?.description || globalMetadata?.description || '',
    ogImage: pageMetadata?.og_image_url || globalMetadata?.og_image_url || '',
    keywords: pageMetadata?.keywords || globalMetadata?.keywords || '',
    isIndexable: pageMetadata?.is_indexable ?? true,
    favicon: globalMetadata?.favicon_url || '/favicon.ico',
  };
}

export function useCurrentPageMetadata() {
  const location = useLocation();
  return usePageMetadata(location.pathname);
}

export function useUpdateSiteMetadata() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (metadata: Partial<SiteMetadata> & { id: string }) => {
      const { id, ...updates } = metadata;
      const { data, error } = await supabase
        .from('site_metadata')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-metadata'] });
    },
  });
}

export function useCreateSiteMetadata() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (metadata: Omit<SiteMetadata, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('site_metadata')
        .insert(metadata)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-metadata'] });
    },
  });
}

export function useDeleteSiteMetadata() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('site_metadata')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-metadata'] });
    },
  });
}
