import React, { useState, useRef } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Headphones, Upload, X, CheckCircle, Loader2, Mic, Play, Pause } from 'lucide-react';

interface AudioUploadNodeProps {
  data: any;
  id: string;
  selected: boolean;
}

export const AudioUploadNode = ({ data, id, selected }: AudioUploadNodeProps) => {
  const [audioUrl, setAudioUrl] = useState(data.audioUrl || '');
  const [isUploading, setIsUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const { toast } = useToast();

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('audio/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an audio file",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      // Create preview URL
      const preview = URL.createObjectURL(file);
      setAudioUrl(preview);
      
      toast({
        title: "Audio uploaded",
        description: "Audio file has been processed successfully",
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload audio",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks: BlobPart[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      
      toast({
        title: "Recording started",
        description: "Speak into your microphone",
      });
    } catch (error) {
      toast({
        title: "Recording failed",
        description: "Could not access microphone",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast({
        title: "Recording stopped",
        description: "Audio saved successfully",
      });
    }
  };

  const togglePlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
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
          <Headphones className="w-5 h-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-sm">{data.label}</h3>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">AUDIO INPUT</p>
        </div>
        {isUploading && <Loader2 className="w-4 h-4 animate-spin text-blue-600" />}
        {isRecording && <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse" />}
        {audioUrl && !isUploading && !isRecording && <CheckCircle className="w-4 h-4 text-green-600" />}
      </div>

      {/* Audio Controls */}
      {audioUrl && (
        <div className="mb-3 p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={togglePlayback}
              className="h-8 w-8 p-0"
            >
              {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            </Button>
            <div className="flex-1 text-xs text-muted-foreground">Audio ready</div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setAudioUrl('')}
              className="h-6 w-6 p-0"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
          <audio
            ref={audioRef}
            src={audioUrl}
            onEnded={() => setIsPlaying(false)}
            className="hidden"
          />
        </div>
      )}

      {/* Upload/Record Controls */}
      <div className="space-y-3">
        <div>
          <Label htmlFor={`url-${id}`} className="text-xs font-medium">Audio URL</Label>
          <Input
            id={`url-${id}`}
            placeholder="https://example.com/audio.mp3"
            value={audioUrl.startsWith('blob:') ? '' : audioUrl}
            onChange={(e) => setAudioUrl(e.target.value)}
            className="text-xs"
          />
        </div>

        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
            }}
            className="hidden"
          />
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || isRecording}
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload
          </Button>
          <Button
            variant={isRecording ? "destructive" : "outline"}
            size="sm"
            className="flex-1"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isUploading}
          >
            <Mic className="w-4 h-4 mr-2" />
            {isRecording ? 'Stop' : 'Record'}
          </Button>
        </div>
      </div>

      {/* Status */}
      <div className="mt-3">
        <Badge variant={audioUrl ? "default" : "secondary"} className="text-xs">
          {audioUrl ? 'Audio Ready' : 'No Audio'}
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