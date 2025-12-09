import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, Twitter } from 'lucide-react';

interface SEOPreviewProps {
  title: string;
  description: string;
  url: string;
  image?: string;
}

export function SEOPreview({ title, description, url, image }: SEOPreviewProps) {
  const truncatedTitle = title.length > 60 ? title.slice(0, 57) + '...' : title;
  const truncatedDescription = description.length > 160 ? description.slice(0, 157) + '...' : description;
  
  return (
    <div className="space-y-4">
      {/* Google Search Preview */}
      <Card className="bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Google Search Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-background rounded-lg p-4 border border-border">
            <div className="text-sm text-muted-foreground mb-1">{url}</div>
            <div className="text-lg text-primary hover:underline cursor-pointer mb-1">
              {truncatedTitle || 'Page Title'}
            </div>
            <div className="text-sm text-muted-foreground line-clamp-2">
              {truncatedDescription || 'Meta description will appear here...'}
            </div>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            Title: {title.length}/60 chars | Description: {description.length}/160 chars
          </div>
        </CardContent>
      </Card>

      {/* Social Card Preview */}
      <Card className="bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Twitter className="h-4 w-4" />
            Social Card Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-background rounded-lg border border-border overflow-hidden max-w-md">
            {image ? (
              <div className="aspect-video bg-muted relative">
                <img 
                  src={image} 
                  alt="OG Preview" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            ) : (
              <div className="aspect-video bg-muted flex items-center justify-center text-muted-foreground text-sm">
                No image set
              </div>
            )}
            <div className="p-3">
              <div className="text-xs text-muted-foreground uppercase mb-1">
                {url.replace(/https?:\/\//, '').split('/')[0]}
              </div>
              <div className="font-semibold text-foreground line-clamp-1">
                {truncatedTitle || 'Page Title'}
              </div>
              <div className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {truncatedDescription || 'Meta description will appear here...'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
