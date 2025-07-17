import React, { useState, useRef } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { FileText, Upload, X, CheckCircle, Loader2, File } from 'lucide-react';

interface FileUploadNodeProps {
  data: any;
  id: string;
  selected: boolean;
}

export const FileUploadNode = ({ data, id, selected }: FileUploadNodeProps) => {
  const [fileUrl, setFileUrl] = useState(data.fileUrl || '');
  const [fileName, setFileName] = useState(data.fileName || '');
  const [fileType, setFileType] = useState(data.fileType || 'any');
  const [maxSize, setMaxSize] = useState(data.maxSize || '10');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const fileTypes = [
    { value: 'any', label: 'Any File' },
    { value: 'pdf', label: 'PDF Documents' },
    { value: 'image', label: 'Images' },
    { value: 'document', label: 'Documents (DOC, DOCX)' },
    { value: 'spreadsheet', label: 'Spreadsheets (XLS, XLSX, CSV)' },
    { value: 'text', label: 'Text Files' },
    { value: 'video', label: 'Video Files' },
    { value: 'audio', label: 'Audio Files' },
  ];

  const getAcceptAttribute = () => {
    switch (fileType) {
      case 'pdf': return '.pdf';
      case 'image': return 'image/*';
      case 'document': return '.doc,.docx';
      case 'spreadsheet': return '.xls,.xlsx,.csv';
      case 'text': return '.txt,.md';
      case 'video': return 'video/*';
      case 'audio': return 'audio/*';
      default: return '*/*';
    }
  };

  const handleFileUpload = async (file: File) => {
    const maxSizeBytes = parseInt(maxSize) * 1024 * 1024; // Convert MB to bytes
    
    if (file.size > maxSizeBytes) {
      toast({
        title: "File too large",
        description: `File size must be less than ${maxSize}MB`,
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      // Create preview URL
      const preview = URL.createObjectURL(file);
      setFileUrl(preview);
      setFileName(file.name);
      
      toast({
        title: "File uploaded",
        description: "File has been processed successfully",
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
          <FileText className="w-5 h-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-sm">{data.label}</h3>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">FILE INPUT</p>
        </div>
        {isUploading && <Loader2 className="w-4 h-4 animate-spin text-blue-600" />}
        {fileName && !isUploading && <CheckCircle className="w-4 h-4 text-green-600" />}
      </div>

      {/* File Preview */}
      {fileName && (
        <div className="mb-3 p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <File className="w-4 h-4 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{fileName}</p>
              <p className="text-xs text-muted-foreground">Ready for processing</p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setFileUrl('');
                setFileName('');
              }}
              className="h-6 w-6 p-0"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Upload Controls */}
      <div className="space-y-3">
        <div>
          <Label htmlFor={`file-type-${id}`} className="text-xs font-medium">File Type</Label>
          <Select value={fileType} onValueChange={setFileType}>
            <SelectTrigger className="text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {fileTypes.map((type) => (
                <SelectItem key={type.value} value={type.value} className="text-xs">
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor={`max-size-${id}`} className="text-xs font-medium">Max Size (MB)</Label>
          <Input
            id={`max-size-${id}`}
            type="number"
            min="1"
            max="100"
            value={maxSize}
            onChange={(e) => setMaxSize(e.target.value)}
            className="text-xs"
          />
        </div>

        <div>
          <Label htmlFor={`url-${id}`} className="text-xs font-medium">File URL</Label>
          <Input
            id={`url-${id}`}
            placeholder="https://example.com/file.pdf"
            value={fileUrl.startsWith('blob:') ? '' : fileUrl}
            onChange={(e) => setFileUrl(e.target.value)}
            className="text-xs"
          />
        </div>

        <div className="text-center text-xs text-muted-foreground">or</div>

        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept={getAcceptAttribute()}
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
            {isUploading ? 'Uploading...' : 'Upload File'}
          </Button>
        </div>
      </div>

      {/* Status */}
      <div className="mt-3">
        <Badge variant={fileName ? "default" : "secondary"} className="text-xs">
          {fileName ? 'File Ready' : 'No File'}
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