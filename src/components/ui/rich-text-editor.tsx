import React, { useMemo } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './rich-text-editor.css';
import { cn, getPlainTextFromHTML } from '@/lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  maxLength?: number;
  showCharacterCount?: boolean;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Start writing...",
  className,
  id,
  maxLength,
  showCharacterCount = false
}) => {
  const modules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'align': [] }],
      ['link'],
      ['clean']
    ],
  }), []);

  const formats = [
    'header',
    'bold', 'italic', 'underline',
    'list', 'bullet',
    'align',
    'link'
  ];

  const plainTextLength = value ? getPlainTextFromHTML(value).length : 0;
  const isOverLimit = maxLength ? plainTextLength > maxLength : false;
  const isNearLimit = maxLength ? plainTextLength > maxLength * 0.9 : false;

  const handleChange = (content: string) => {
    if (maxLength && getPlainTextFromHTML(content).length > maxLength) {
      return; // Don't allow changes that would exceed the limit
    }
    onChange(content);
  };

  return (
    <div className={cn("rich-text-editor", className)}>
      <ReactQuill
        id={id}
        theme="snow"
        value={value}
        onChange={handleChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        style={{
          '--ql-font-size-small': '0.75rem',
          '--ql-font-size-normal': '0.875rem',
          '--ql-font-size-large': '1.125rem',
          '--ql-font-size-huge': '1.5rem'
        } as React.CSSProperties}
      />
      {showCharacterCount && (
        <div className={cn(
          "text-sm mt-2 text-right",
          isOverLimit ? "text-destructive" : 
          isNearLimit ? "text-warning" : 
          "text-muted-foreground"
        )}>
          {plainTextLength}{maxLength ? ` / ${maxLength}` : ''} characters
        </div>
      )}
    </div>
  );
};