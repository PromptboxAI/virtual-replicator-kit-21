import React, { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { MessageSquare, CheckCircle } from 'lucide-react';

interface TextInputNodeProps {
  data: any;
  id: string;
  selected: boolean;
}

export const TextInputNode = ({ data, id, selected }: TextInputNodeProps) => {
  const [inputType, setInputType] = useState(data.inputType || 'text');
  const [placeholder, setPlaceholder] = useState(data.placeholder || 'Enter your message...');
  const [required, setRequired] = useState(data.required || false);
  const [value, setValue] = useState(data.value || '');

  const inputTypes = [
    { value: 'text', label: 'Single Line Text' },
    { value: 'textarea', label: 'Multi-line Text' },
    { value: 'email', label: 'Email' },
    { value: 'number', label: 'Number' },
    { value: 'url', label: 'URL' },
    { value: 'password', label: 'Password' },
  ];

  return (
    <div className={`p-4 border-2 rounded-lg shadow-sm transition-all duration-200 min-w-[280px] max-w-[320px] bg-card ${
      selected 
        ? 'border-foreground shadow-lg' 
        : 'border-border hover:border-muted-foreground hover:shadow-md'
    }`}>
      {/* Node Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200 shadow-sm">
          <MessageSquare className="w-5 h-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-sm">{data.label}</h3>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">TEXT INPUT</p>
        </div>
        {value && <CheckCircle className="w-4 h-4 text-green-600" />}
      </div>

      {/* Input Configuration */}
      <div className="space-y-3">
        <div>
          <Label htmlFor={`input-type-${id}`} className="text-xs font-medium">Input Type</Label>
          <Select value={inputType} onValueChange={setInputType}>
            <SelectTrigger className="text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {inputTypes.map((type) => (
                <SelectItem key={type.value} value={type.value} className="text-xs">
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor={`placeholder-${id}`} className="text-xs font-medium">Placeholder</Label>
          <Input
            id={`placeholder-${id}`}
            placeholder="Enter placeholder text..."
            value={placeholder}
            onChange={(e) => setPlaceholder(e.target.value)}
            className="text-xs"
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor={`required-${id}`} className="text-xs font-medium">Required</Label>
          <Switch
            id={`required-${id}`}
            checked={required}
            onCheckedChange={setRequired}
          />
        </div>

        {/* Preview Input */}
        <div>
          <Label className="text-xs font-medium">Preview</Label>
          <div className="mt-1">
            {inputType === 'textarea' ? (
              <Textarea
                placeholder={placeholder}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                rows={3}
                className="text-xs"
              />
            ) : (
              <Input
                type={inputType}
                placeholder={placeholder}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="text-xs"
              />
            )}
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="mt-3">
        <Badge variant={value ? "default" : "secondary"} className="text-xs">
          {value ? 'Has Value' : placeholder ? 'Ready' : 'Configure'}
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