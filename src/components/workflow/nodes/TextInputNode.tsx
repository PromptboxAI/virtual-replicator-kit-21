import React, { useState, useRef, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare } from 'lucide-react';

interface TextInputNodeProps {
  data: any;
  id: string;
  selected: boolean;
  onChange?: (id: string, data: any) => void;
}

export const TextInputNode = ({ data, id, selected, onChange }: TextInputNodeProps) => {
  const [value, setValue] = useState(data.value || '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus on the textarea when node is selected
  useEffect(() => {
    if (selected && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [selected]);

  const handleValueChange = (newValue: string) => {
    setValue(newValue);
    // Update the node data
    if (onChange) {
      onChange(id, { ...data, value: newValue });
    }
  };

  return (
    <div className={`p-3 border-2 rounded-lg shadow-sm transition-all duration-200 min-w-[240px] max-w-[280px] bg-card ${
      selected 
        ? 'border-primary shadow-lg' 
        : 'border-border hover:border-muted-foreground hover:shadow-md'
    }`}>
      {/* Node Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200">
          <MessageSquare className="w-4 h-4 text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-sm">{data.label || 'Text Input'}</h3>
          <p className="text-xs text-muted-foreground">Enter your text</p>
        </div>
      </div>

      {/* Text Input */}
      <div className="mb-3">
        <Textarea
          ref={textareaRef}
          placeholder="Type your message here..."
          value={value}
          onChange={(e) => handleValueChange(e.target.value)}
          rows={3}
          className="text-sm nodrag resize-none"
        />
      </div>

      {/* Character count */}
      {value && (
        <div className="text-xs text-muted-foreground mb-2">
          {value.length} characters
        </div>
      )}

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