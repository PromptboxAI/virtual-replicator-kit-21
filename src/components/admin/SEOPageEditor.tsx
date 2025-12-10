import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { SEOPreview } from './SEOPreview';
import { SiteMetadata, useUpdateSiteMetadata } from '@/hooks/useSiteMetadata';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, X, Loader2, Settings2, Search, Share2, FileCode } from 'lucide-react';

interface SEOPageEditorProps {
  metadata: SiteMetadata | null;
  open: boolean;
  onClose: () => void;
}

const STRUCTURED_DATA_TYPES = [
  { value: 'WebPage', label: 'Web Page' },
  { value: 'Article', label: 'Article' },
  { value: 'Product', label: 'Product' },
  { value: 'Organization', label: 'Organization' },
  { value: 'Person', label: 'Person' },
  { value: 'FAQPage', label: 'FAQ Page' },
  { value: 'HowTo', label: 'How To' },
  { value: 'LocalBusiness', label: 'Local Business' },
  { value: 'Event', label: 'Event' },
  { value: 'Recipe', label: 'Recipe' },
  { value: 'VideoObject', label: 'Video' },
  { value: 'BreadcrumbList', label: 'Breadcrumb' },
];

const OG_TYPES = [
  { value: 'website', label: 'Website' },
  { value: 'article', label: 'Article' },
  { value: 'product', label: 'Product' },
  { value: 'profile', label: 'Profile' },
  { value: 'video.movie', label: 'Video (Movie)' },
  { value: 'video.episode', label: 'Video (Episode)' },
  { value: 'music.song', label: 'Music (Song)' },
  { value: 'book', label: 'Book' },
];

const TWITTER_CARD_TYPES = [
  { value: 'summary', label: 'Summary (Small Image)' },
  { value: 'summary_large_image', label: 'Summary Large Image' },
  { value: 'app', label: 'App' },
  { value: 'player', label: 'Player' },
];

const CHANGEFREQ_OPTIONS = [
  { value: 'always', label: 'Always' },
  { value: 'hourly', label: 'Hourly' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'never', label: 'Never' },
];

export function SEOPageEditor({ metadata, open, onClose }: SEOPageEditorProps) {
  // Basic SEO
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [keywords, setKeywords] = useState('');
  const [ogImage, setOgImage] = useState('');
  const [isIndexable, setIsIndexable] = useState(true);
  const [titleTemplate, setTitleTemplate] = useState('');
  const [descriptionTemplate, setDescriptionTemplate] = useState('');
  
  // Advanced SEO
  const [canonicalUrl, setCanonicalUrl] = useState('');
  const [structuredDataType, setStructuredDataType] = useState('WebPage');
  const [robotsDirectives, setRobotsDirectives] = useState('');
  const [sitemapPriority, setSitemapPriority] = useState(0.5);
  const [sitemapChangefreq, setSitemapChangefreq] = useState('weekly');
  const [ogType, setOgType] = useState('website');
  const [twitterCardType, setTwitterCardType] = useState('summary_large_image');
  const [focusKeyword, setFocusKeyword] = useState('');
  const [author, setAuthor] = useState('');
  
  const [uploading, setUploading] = useState(false);
  const updateMutation = useUpdateSiteMetadata();
  
  useEffect(() => {
    if (metadata) {
      // Basic
      setTitle(metadata.title || '');
      setDescription(metadata.description || '');
      setKeywords(metadata.keywords || '');
      setOgImage(metadata.og_image_url || '');
      setIsIndexable(metadata.is_indexable);
      setTitleTemplate(metadata.title_template || '');
      setDescriptionTemplate(metadata.description_template || '');
      // Advanced
      setCanonicalUrl(metadata.canonical_url || '');
      setStructuredDataType(metadata.structured_data_type || 'WebPage');
      setRobotsDirectives(metadata.robots_directives || '');
      setSitemapPriority(metadata.sitemap_priority || 0.5);
      setSitemapChangefreq(metadata.sitemap_changefreq || 'weekly');
      setOgType(metadata.og_type || 'website');
      setTwitterCardType(metadata.twitter_card_type || 'summary_large_image');
      setFocusKeyword(metadata.focus_keyword || '');
      setAuthor(metadata.author || '');
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
        // Basic
        title: title || null,
        description: description || null,
        keywords: keywords || null,
        og_image_url: ogImage || null,
        is_indexable: isIndexable,
        title_template: titleTemplate || null,
        description_template: descriptionTemplate || null,
        // Advanced
        canonical_url: canonicalUrl || null,
        structured_data_type: structuredDataType,
        robots_directives: robotsDirectives || null,
        sitemap_priority: sitemapPriority,
        sitemap_changefreq: sitemapChangefreq,
        og_type: ogType,
        twitter_card_type: twitterCardType,
        focus_keyword: focusKeyword || null,
        author: author || null,
        modified_date: new Date().toISOString(),
      });
      toast.success('Metadata saved successfully');
      onClose();
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save metadata');
    }
  };

  // Calculate SEO score
  const calculateSEOScore = () => {
    let score = 0;
    const checks = [];
    
    if (title && title.length >= 30 && title.length <= 60) {
      score += 20;
      checks.push({ label: 'Title length optimal', pass: true });
    } else {
      checks.push({ label: 'Title length (30-60 chars)', pass: false });
    }
    
    if (description && description.length >= 120 && description.length <= 160) {
      score += 20;
      checks.push({ label: 'Description length optimal', pass: true });
    } else {
      checks.push({ label: 'Description length (120-160 chars)', pass: false });
    }
    
    if (focusKeyword && title?.toLowerCase().includes(focusKeyword.toLowerCase())) {
      score += 15;
      checks.push({ label: 'Focus keyword in title', pass: true });
    } else if (focusKeyword) {
      checks.push({ label: 'Focus keyword in title', pass: false });
    }
    
    if (focusKeyword && description?.toLowerCase().includes(focusKeyword.toLowerCase())) {
      score += 15;
      checks.push({ label: 'Focus keyword in description', pass: true });
    } else if (focusKeyword) {
      checks.push({ label: 'Focus keyword in description', pass: false });
    }
    
    if (ogImage) {
      score += 15;
      checks.push({ label: 'OG image set', pass: true });
    } else {
      checks.push({ label: 'OG image set', pass: false });
    }
    
    if (structuredDataType !== 'WebPage') {
      score += 15;
      checks.push({ label: 'Structured data configured', pass: true });
    } else {
      checks.push({ label: 'Structured data configured', pass: false });
    }
    
    return { score, checks };
  };
  
  const { score, checks } = calculateSEOScore();
  
  if (!metadata) return null;
  
  const previewUrl = `https://promptbox.com${metadata.page_path.replace(/:[^/]+/g, 'example')}`;
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Edit SEO: {metadata.page_name}
            <span className="text-sm font-normal text-muted-foreground">
              {metadata.page_path}
            </span>
            <div className={`ml-auto px-2 py-1 rounded text-sm font-medium ${
              score >= 80 ? 'bg-green-500/20 text-green-400' :
              score >= 50 ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-red-500/20 text-red-400'
            }`}>
              SEO Score: {score}%
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic" className="gap-2">
              <Search className="h-4 w-4" /> Basic
            </TabsTrigger>
            <TabsTrigger value="social" className="gap-2">
              <Share2 className="h-4 w-4" /> Social
            </TabsTrigger>
            <TabsTrigger value="advanced" className="gap-2">
              <Settings2 className="h-4 w-4" /> Advanced
            </TabsTrigger>
            <TabsTrigger value="preview" className="gap-2">
              <FileCode className="h-4 w-4" /> Preview
            </TabsTrigger>
          </TabsList>
          
          {/* Basic Tab */}
          <TabsContent value="basic" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="focusKeyword">Focus Keyword</Label>
                  <Input
                    id="focusKeyword"
                    value={focusKeyword}
                    onChange={(e) => setFocusKeyword(e.target.value)}
                    placeholder="Primary keyword to optimize for..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Main keyword this page should rank for
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="title">
                    Page Title
                    <span className={`ml-2 text-xs ${title.length > 60 ? 'text-destructive' : 'text-muted-foreground'}`}>
                      ({title.length}/60)
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
                    <span className={`ml-2 text-xs ${description.length > 160 ? 'text-destructive' : 'text-muted-foreground'}`}>
                      ({description.length}/160)
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
              </div>
              
              {/* SEO Checklist */}
              <div className="space-y-4">
                <Label>SEO Checklist</Label>
                <div className="rounded-lg border border-border p-4 space-y-2">
                  {checks.map((check, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <div className={`h-2 w-2 rounded-full ${check.pass ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span className={check.pass ? 'text-green-400' : 'text-muted-foreground'}>
                        {check.label}
                      </span>
                    </div>
                  ))}
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
            </div>
          </TabsContent>
          
          {/* Social Tab */}
          <TabsContent value="social" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
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
                    <img src={ogImage} alt="OG Preview" className="max-h-32 rounded border border-border" />
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label>Open Graph Type</Label>
                  <Select value={ogType} onValueChange={setOgType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {OG_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    How this content appears when shared on Facebook, LinkedIn
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label>Twitter Card Type</Label>
                  <Select value={twitterCardType} onValueChange={setTwitterCardType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TWITTER_CARD_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    How this content appears when shared on Twitter/X
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="author">Author</Label>
                  <Input
                    id="author"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="Author name for article pages..."
                  />
                </div>
              </div>
              
              {/* Social Preview */}
              <div className="space-y-4">
                <SEOPreview
                  title={title || 'Untitled Page'}
                  description={description}
                  url={previewUrl}
                  image={ogImage}
                />
              </div>
            </div>
          </TabsContent>
          
          {/* Advanced Tab */}
          <TabsContent value="advanced" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="canonicalUrl">Canonical URL</Label>
                  <Input
                    id="canonicalUrl"
                    value={canonicalUrl}
                    onChange={(e) => setCanonicalUrl(e.target.value)}
                    placeholder="https://promptbox.com/page (leave empty for auto)"
                  />
                  <p className="text-xs text-muted-foreground">
                    Specify the preferred URL for this page to prevent duplicate content
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label>Structured Data Type (JSON-LD)</Label>
                  <Select value={structuredDataType} onValueChange={setStructuredDataType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STRUCTURED_DATA_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Schema.org type for rich snippets in search results
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="robotsDirectives">Additional Robots Directives</Label>
                  <Input
                    id="robotsDirectives"
                    value={robotsDirectives}
                    onChange={(e) => setRobotsDirectives(e.target.value)}
                    placeholder="noarchive, max-snippet:-1, max-image-preview:large"
                  />
                  <p className="text-xs text-muted-foreground">
                    Comma-separated directives: nofollow, noarchive, nosnippet, max-snippet:N, max-image-preview:large/standard/none
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-3">
                  <Label>Sitemap Priority: {sitemapPriority.toFixed(1)}</Label>
                  <Slider
                    value={[sitemapPriority]}
                    onValueChange={([v]) => setSitemapPriority(v)}
                    min={0}
                    max={1}
                    step={0.1}
                  />
                  <p className="text-xs text-muted-foreground">
                    0.0 = lowest priority, 1.0 = highest (homepage should be 1.0)
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label>Sitemap Change Frequency</Label>
                  <Select value={sitemapChangefreq} onValueChange={setSitemapChangefreq}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CHANGEFREQ_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    How often search engines should re-crawl this page
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* Preview Tab */}
          <TabsContent value="preview" className="mt-4">
            <div className="grid grid-cols-2 gap-6">
              <SEOPreview
                title={title || 'Untitled Page'}
                description={description}
                url={previewUrl}
                image={ogImage}
              />
              
              <div className="space-y-4">
                <Label>Generated Meta Tags</Label>
                <pre className="p-4 rounded-lg bg-muted text-xs overflow-auto max-h-96">
{`<title>${title || 'Untitled'}</title>
<meta name="description" content="${description}" />
<meta name="keywords" content="${keywords}" />
<meta name="robots" content="${isIndexable ? 'index, follow' : 'noindex, nofollow'}${robotsDirectives ? ', ' + robotsDirectives : ''}" />
${canonicalUrl ? `<link rel="canonical" href="${canonicalUrl}" />` : `<link rel="canonical" href="${previewUrl}" />`}
${author ? `<meta name="author" content="${author}" />` : ''}

<!-- Open Graph -->
<meta property="og:type" content="${ogType}" />
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${description}" />
<meta property="og:url" content="${previewUrl}" />
${ogImage ? `<meta property="og:image" content="${ogImage}" />` : ''}

<!-- Twitter Card -->
<meta name="twitter:card" content="${twitterCardType}" />
<meta name="twitter:title" content="${title}" />
<meta name="twitter:description" content="${description}" />
${ogImage ? `<meta name="twitter:image" content="${ogImage}" />` : ''}

<!-- JSON-LD -->
<script type="application/ld+json">
${JSON.stringify({
  "@context": "https://schema.org",
  "@type": structuredDataType,
  "name": title,
  "description": description,
  "url": previewUrl,
  ...(ogImage && { "image": ogImage }),
  ...(author && { "author": { "@type": "Person", "name": author } })
}, null, 2)}
</script>`}
                </pre>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
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