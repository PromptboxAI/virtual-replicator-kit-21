import React, { useState, useRef } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Image, Upload, X, CheckCircle, Loader2 } from 'lucide-react';

interface ImageUploadNodeProps {
  data: any;
  id: string;
  selected: boolean;
}

export const ImageUploadNode = ({ data, id, selected }: ImageUploadNodeProps) => {
  const [imageUrl, setImageUrl] = useState(data.imageUrl || '');
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(data.previewUrl || '');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      // Create preview URL
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);
      
      // In a real implementation, you'd upload to Supabase Storage
      // For now, we'll just use the preview URL
      setImageUrl(preview);
      
      toast({
        title: "Image uploaded",
        description: "Image has been processed successfully",
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleUrlChange = (url: string) => {
    setImageUrl(url);
    setPreviewUrl(url);
  };

  return (
    <div className={`p-4 border-2 rounded-lg shadow-sm transition-all duration-200 min-w-[280px] max-w-[320px] bg-card ${
      selected 
        ? 'border-foreground shadow-lg' 
        : 'border-border hover:border-muted-foreground hover:shadow-md'
    }`}>
      {/* Node Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200 shadow-sm">
          <Image className="w-5 h-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-sm">{data.label}</h3>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">IMAGE INPUT</p>
        </div>
        {isUploading && <Loader2 className="w-4 h-4 animate-spin text-blue-600" />}
        {imageUrl && !isUploading && <CheckCircle className="w-4 h-4 text-green-600" />}
      </div>

      {/* Image Preview */}
      {previewUrl && (
        <div className="mb-3 relative">
          <img 
            src={previewUrl} 
            alt="Preview" 
            className="w-full h-32 object-cover rounded-lg border"
          />
          <Button
            size="sm"
            variant="destructive"
            className="absolute top-2 right-2 h-6 w-6 p-0"
            onClick={() => {
              setImageUrl('');
              setPreviewUrl('');
            }}
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      )}

      {/* Upload Controls */}
      <div className="space-y-3">
        <div>
          <Label htmlFor={`url-${id}`} className="text-xs font-medium">Image URL</Label>
          <Input
            id={`url-${id}`}
            placeholder="https://example.com/image.jpg"
            value={imageUrl}
            onChange={(e) => handleUrlChange(e.target.value)}
            className="text-xs"
          />
        </div>

        <div className="text-center text-xs text-muted-foreground">or</div>

        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
            }}
            className="hidden"
          />
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            <Upload className="w-4 h-4 mr-2" />
            {isUploading ? 'Uploading...' : 'Upload Image'}
          </Button>
        </div>
      </div>

      {/* Status */}
      <div className="mt-3">
        <Badge variant={imageUrl ? "default" : "secondary"} className="text-xs">
          {imageUrl ? 'Image Ready' : 'No Image'}
        </Badge>
      </div>

      {/* Handles */}
      <Handle 
        type="source" 
        position={Position.Right} 
        className="w-3 h-3 border-2 border-background bg-primary"
        isConnectable={true}
        style={{ background: 'hsl(var(--primary))', border: '2px solid hsl(var(--background))' }}
      />
    </div>
  );
};