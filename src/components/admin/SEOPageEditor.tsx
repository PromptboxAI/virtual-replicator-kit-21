import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { SEOPreview } from './SEOPreview';
import { SiteMetadata, useUpdateSiteMetadata } from '@/hooks/useSiteMetadata';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, X, Loader2 } from 'lucide-react';

interface SEOPageEditorProps {
  metadata: SiteMetadata | null;
  open: boolean;
  onClose: () => void;
}

export function SEOPageEditor({ metadata, open, onClose }: SEOPageEditorProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [keywords, setKeywords] = useState('');
  const [ogImage, setOgImage] = useState('');
  const [isIndexable, setIsIndexable] = useState(true);
  const [titleTemplate, setTitleTemplate] = useState('');
  const [descriptionTemplate, setDescriptionTemplate] = useState('');
  const [uploading, setUploading] = useState(false);
  
  const updateMutation = useUpdateSiteMetadata();
  
  useEffect(() => {
    if (metadata) {
      setTitle(metadata.title || '');
      setDescription(metadata.description || '');
      setKeywords(metadata.keywords || '');
      setOgImage(metadata.og_image_url || '');
      setIsIndexable(metadata.is_indexable);
      setTitleTemplate(metadata.title_template || '');
      setDescriptionTemplate(metadata.description_template || '');
    }
  }, [metadata]);
  
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    
    setUploading(true);
    try {
      const fileName = `og-${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from('seo-assets')
        .upload(fileName, file);
      
      if (error) throw error;
      
      const { data: { publicUrl } } = supabase.storage
        .from('seo-assets')
        .getPublicUrl(data.path);
      
      setOgImage(publicUrl);
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };
  
  const handleSave = async () => {
    if (!metadata) return;
    
    try {
      await updateMutation.mutateAsync({
        id: metadata.id,
        title: title || null,
        description: description || null,
        keywords: keywords || null,
        og_image_url: ogImage || null,
        is_indexable: isIndexable,
        title_template: titleTemplate || null,
        description_template: descriptionTemplate || null,
      });
      toast.success('Metadata saved successfully');
      onClose();
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save metadata');
    }
  };
  
  if (!metadata) return null;
  
  const previewUrl = `https://promptbox.ai${metadata.page_path.replace(/:[^/]+/g, 'example')}`;
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Edit SEO: {metadata.page_name}
            <span className="text-sm font-normal text-muted-foreground ml-2">
              {metadata.page_path}
            </span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">
                Page Title
                <span className="text-muted-foreground ml-2 text-xs">
                  ({title.length}/60 recommended)
                </span>
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter page title..."
                className={title.length > 60 ? 'border-destructive' : ''}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">
                Meta Description
                <span className="text-muted-foreground ml-2 text-xs">
                  ({description.length}/160 recommended)
                </span>
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter meta description..."
                rows={3}
                className={description.length > 160 ? 'border-destructive' : ''}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="keywords">Keywords</Label>
              <Input
                id="keywords"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="keyword1, keyword2, keyword3..."
              />
            </div>
            
            {metadata.is_dynamic && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="titleTemplate">
                    Title Template
                    <span className="text-muted-foreground ml-2 text-xs">
                      Use {'{name}'}, {'{symbol}'}, etc.
                    </span>
                  </Label>
                  <Input
                    id="titleTemplate"
                    value={titleTemplate}
                    onChange={(e) => setTitleTemplate(e.target.value)}
                    placeholder="{name} | PromptBox"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="descriptionTemplate">Description Template</Label>
                  <Textarea
                    id="descriptionTemplate"
                    value={descriptionTemplate}
                    onChange={(e) => setDescriptionTemplate(e.target.value)}
                    placeholder="Learn about {name} ({symbol})..."
                    rows={2}
                  />
                </div>
              </>
            )}
            
            <div className="space-y-2">
              <Label>OG Image</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={ogImage}
                  onChange={(e) => setOgImage(e.target.value)}
                  placeholder="Image URL or upload..."
                  className="flex-1"
                />
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={uploading}
                  />
                  <Button variant="outline" size="icon" asChild disabled={uploading}>
                    <span>
                      {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    </span>
                  </Button>
                </label>
                {ogImage && (
                  <Button variant="outline" size="icon" onClick={() => setOgImage('')}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {ogImage && (
                <div className="mt-2">
                  <img 
                    src={ogImage} 
                    alt="OG Preview" 
                    className="max-h-32 rounded border border-border"
                  />
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div>
                <Label htmlFor="indexable">Allow Search Indexing</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  If disabled, adds noindex meta tag
                </p>
              </div>
              <Switch
                id="indexable"
                checked={isIndexable}
                onCheckedChange={setIsIndexable}
              />
            </div>
          </div>
          
          {/* Preview */}
          <div>
            <SEOPreview
              title={title || 'Untitled Page'}
              description={description}
              url={previewUrl}
              image={ogImage}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
