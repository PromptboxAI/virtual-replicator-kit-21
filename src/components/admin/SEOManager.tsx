import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { 
  SiteMetadata, 
  useSiteMetadata, 
  useGlobalMetadata, 
  useUpdateSiteMetadata 
} from '@/hooks/useSiteMetadata';
import { SEOPageEditor } from './SEOPageEditor';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Search, 
  Settings, 
  Globe, 
  Upload, 
  Check, 
  AlertCircle, 
  X, 
  Ban,
  Edit,
  Eye,
  Loader2,
  Image as ImageIcon
} from 'lucide-react';

export function SEOManager() {
  const { data: allMetadata, isLoading } = useSiteMetadata();
  const { data: globalMetadata } = useGlobalMetadata();
  const updateMutation = useUpdateSiteMetadata();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [editingPage, setEditingPage] = useState<SiteMetadata | null>(null);
  const [faviconUploading, setFaviconUploading] = useState(false);
  const [globalOgUploading, setGlobalOgUploading] = useState(false);
  const [globalTitle, setGlobalTitle] = useState(globalMetadata?.title || '');
  const [globalDescription, setGlobalDescription] = useState(globalMetadata?.description || '');
  
  // Filter pages (exclude global settings row)
  const pages = allMetadata?.filter(m => !m.is_global) || [];
  const filteredPages = pages.filter(p => 
    p.page_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.page_path.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const getStatusBadge = (metadata: SiteMetadata) => {
    if (!metadata.is_indexable) {
      return <Badge variant="secondary" className="gap-1"><Ban className="h-3 w-3" /> Noindex</Badge>;
    }
    if (metadata.title && metadata.description && metadata.og_image_url) {
      return <Badge variant="default" className="gap-1 bg-green-600"><Check className="h-3 w-3" /> Complete</Badge>;
    }
    if (metadata.title || metadata.description) {
      return <Badge variant="outline" className="gap-1 text-yellow-600 border-yellow-600"><AlertCircle className="h-3 w-3" /> Partial</Badge>;
    }
    return <Badge variant="destructive" className="gap-1"><X className="h-3 w-3" /> Not set</Badge>;
  };
  
  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !globalMetadata) return;
    
    setFaviconUploading(true);
    try {
      const fileName = `favicon-${Date.now()}.${file.name.split('.').pop()}`;
      const { data, error } = await supabase.storage
        .from('seo-assets')
        .upload(fileName, file);
      
      if (error) throw error;
      
      const { data: { publicUrl } } = supabase.storage
        .from('seo-assets')
        .getPublicUrl(data.path);
      
      await updateMutation.mutateAsync({
        id: globalMetadata.id,
        favicon_url: publicUrl,
      });
      
      toast.success('Favicon uploaded successfully');
    } catch (error) {
      console.error('Favicon upload error:', error);
      toast.error('Failed to upload favicon');
    } finally {
      setFaviconUploading(false);
    }
  };
  
  const handleGlobalOgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !globalMetadata) return;
    
    setGlobalOgUploading(true);
    try {
      const fileName = `og-global-${Date.now()}.${file.name.split('.').pop()}`;
      const { data, error } = await supabase.storage
        .from('seo-assets')
        .upload(fileName, file);
      
      if (error) throw error;
      
      const { data: { publicUrl } } = supabase.storage
        .from('seo-assets')
        .getPublicUrl(data.path);
      
      await updateMutation.mutateAsync({
        id: globalMetadata.id,
        og_image_url: publicUrl,
      });
      
      toast.success('Default OG image uploaded successfully');
    } catch (error) {
      console.error('OG image upload error:', error);
      toast.error('Failed to upload OG image');
    } finally {
      setGlobalOgUploading(false);
    }
  };
  
  const handleSaveGlobalSettings = async () => {
    if (!globalMetadata) return;
    
    try {
      await updateMutation.mutateAsync({
        id: globalMetadata.id,
        title: globalTitle || null,
        description: globalDescription || null,
      });
      toast.success('Global settings saved');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save global settings');
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Global Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Global Settings
          </CardTitle>
          <CardDescription>
            Default settings applied to all pages unless overridden
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Favicon */}
            <div className="space-y-3">
              <Label>Favicon</Label>
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded border border-border flex items-center justify-center bg-muted">
                  {globalMetadata?.favicon_url ? (
                    <img 
                      src={globalMetadata.favicon_url} 
                      alt="Favicon" 
                      className="h-8 w-8 object-contain"
                    />
                  ) : (
                    <Globe className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <input
                    type="file"
                    id="favicon-upload"
                    accept="image/*,.ico"
                    className="hidden"
                    onChange={handleFaviconUpload}
                    disabled={faviconUploading}
                  />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={faviconUploading}
                    onClick={() => document.getElementById('favicon-upload')?.click()}
                  >
                    {faviconUploading ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uploading...</>
                    ) : (
                      <><Upload className="h-4 w-4 mr-2" /> Upload Favicon</>
                    )}
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Recommended: 32x32 or 64x64 PNG/ICO
              </p>
            </div>
            
            {/* Default OG Image */}
            <div className="space-y-3">
              <Label>Default Social Image</Label>
              <div className="flex items-start gap-4">
                <div className="h-20 w-32 rounded border border-border flex items-center justify-center bg-muted overflow-hidden">
                  {globalMetadata?.og_image_url ? (
                    <img 
                      src={globalMetadata.og_image_url} 
                      alt="OG Image" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <input
                    type="file"
                    id="og-image-upload"
                    accept="image/*"
                    className="hidden"
                    onChange={handleGlobalOgUpload}
                    disabled={globalOgUploading}
                  />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={globalOgUploading}
                    onClick={() => document.getElementById('og-image-upload')?.click()}
                  >
                    {globalOgUploading ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uploading...</>
                    ) : (
                      <><Upload className="h-4 w-4 mr-2" /> Upload Image</>
                    )}
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Recommended: 1200x630 for optimal social sharing
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="globalTitle">Default Title Suffix</Label>
              <Input
                id="globalTitle"
                value={globalTitle}
                onChange={(e) => setGlobalTitle(e.target.value)}
                placeholder="| PromptBox"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="globalDescription">Default Description</Label>
              <Input
                id="globalDescription"
                value={globalDescription}
                onChange={(e) => setGlobalDescription(e.target.value)}
                placeholder="Default meta description..."
              />
            </div>
          </div>
          
          <Button onClick={handleSaveGlobalSettings} disabled={updateMutation.isPending}>
            Save Global Settings
          </Button>
        </CardContent>
      </Card>
      
      {/* Pages List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Page Metadata
              </CardTitle>
              <CardDescription>
                {filteredPages.length} pages configured
              </CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search pages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Page</TableHead>
                <TableHead>Path</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Indexable</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPages.map((page) => (
                <TableRow key={page.id}>
                  <TableCell className="font-medium">
                    {page.page_name}
                    {page.is_dynamic && (
                      <Badge variant="outline" className="ml-2 text-xs">Dynamic</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-sm">
                    {page.page_path}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(page)}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={page.is_indexable}
                      onCheckedChange={async (checked) => {
                        await updateMutation.mutateAsync({
                          id: page.id,
                          is_indexable: checked,
                        });
                        toast.success(`${page.page_name} is now ${checked ? 'indexable' : 'noindex'}`);
                      }}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingPage(page)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {!page.is_dynamic && page.page_path !== '/' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                        >
                          <a href={page.page_path} target="_blank" rel="noopener noreferrer">
                            <Eye className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Edit Modal */}
      <SEOPageEditor
        metadata={editingPage}
        open={!!editingPage}
        onClose={() => setEditingPage(null)}
      />
    </div>
  );
}
