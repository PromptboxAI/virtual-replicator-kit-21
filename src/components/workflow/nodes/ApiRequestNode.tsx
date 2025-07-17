import React, { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Globe, Plus, X, CheckCircle, AlertCircle } from 'lucide-react';

interface ApiRequestNodeProps {
  data: any;
  id: string;
  selected: boolean;
}

export const ApiRequestNode = ({ data, id, selected }: ApiRequestNodeProps) => {
  const [method, setMethod] = useState(data.method || 'GET');
  const [url, setUrl] = useState(data.url || '');
  const [headers, setHeaders] = useState<Record<string, string>>(data.headers || {});
  const [body, setBody] = useState(data.body || '');
  const [newHeaderKey, setNewHeaderKey] = useState('');
  const [newHeaderValue, setNewHeaderValue] = useState('');

  const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];

  const addHeader = () => {
    if (newHeaderKey && newHeaderValue) {
      setHeaders(prev => ({
        ...prev,
        [newHeaderKey]: newHeaderValue
      }));
      setNewHeaderKey('');
      setNewHeaderValue('');
    }
  };

  const removeHeader = (key: string) => {
    setHeaders(prev => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
  };

  const isValidUrl = (urlString: string) => {
    try {
      new URL(urlString);
      return true;
    } catch {
      return false;
    }
  };

  const hasBody = ['POST', 'PUT', 'PATCH'].includes(method);

  return (
    <div className={`p-4 border-2 rounded-lg shadow-sm transition-all duration-200 min-w-[320px] max-w-[400px] bg-card ${
      selected 
        ? 'border-foreground shadow-lg' 
        : 'border-border hover:border-muted-foreground hover:shadow-md'
    }`}>
      {/* Node Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-gradient-to-br from-cyan-100 to-cyan-200 shadow-sm">
          <Globe className="w-5 h-5 text-cyan-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-sm">{data.label}</h3>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">API REQUEST</p>
        </div>
        {url && isValidUrl(url) && <CheckCircle className="w-4 h-4 text-green-600" />}
        {url && !isValidUrl(url) && <AlertCircle className="w-4 h-4 text-red-600" />}
      </div>

      {/* Request Configuration */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="w-24">
            <Label htmlFor={`method-${id}`} className="text-xs font-medium">Method</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger className="text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {methods.map((m) => (
                  <SelectItem key={m} value={m} className="text-xs">
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Label htmlFor={`url-${id}`} className="text-xs font-medium">URL</Label>
            <Input
              id={`url-${id}`}
              placeholder="https://api.example.com/endpoint"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="text-xs"
            />
          </div>
        </div>

        {/* Headers Section */}
        <div>
          <Label className="text-xs font-medium">Headers</Label>
          <div className="space-y-2 mt-1">
            {Object.entries(headers).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2 p-2 bg-muted/50 rounded text-xs">
                <span className="font-medium">{key}:</span>
                <span className="flex-1 truncate">{value}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeHeader(key)}
                  className="h-5 w-5 p-0"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
            
            <div className="flex gap-2">
              <Input
                placeholder="Header name"
                value={newHeaderKey}
                onChange={(e) => setNewHeaderKey(e.target.value)}
                className="text-xs"
              />
              <Input
                placeholder="Header value"
                value={newHeaderValue}
                onChange={(e) => setNewHeaderValue(e.target.value)}
                className="text-xs"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={addHeader}
                disabled={!newHeaderKey || !newHeaderValue}
                className="h-8 w-8 p-0"
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>

        {/* Request Body (for methods that support it) */}
        {hasBody && (
          <div>
            <Label htmlFor={`body-${id}`} className="text-xs font-medium">Request Body</Label>
            <Textarea
              id={`body-${id}`}
              placeholder='{"key": "value"}'
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
              className="text-xs font-mono"
            />
          </div>
        )}
      </div>

      {/* Status */}
      <div className="mt-3">
        <Badge variant={url && isValidUrl(url) ? "default" : "secondary"} className="text-xs">
          {method} {url && isValidUrl(url) ? 'Ready' : 'Configure URL'}
        </Badge>
      </div>

      {/* Handles */}
      <Handle 
        type="target" 
        position={Position.Left} 
        className="w-3 h-3 border-2 border-background bg-primary"
        isConnectable={true}
        style={{ background: 'hsl(var(--primary))', border: '2px solid hsl(var(--background))' }}
      />
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