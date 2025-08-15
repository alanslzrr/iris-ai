"use client";

import { cn } from "@/lib/utils";

interface SimpleMarkdownProps {
  children: string;
  className?: string;
}

export function SimpleMarkdown({ children, className = "rv-typography" }: SimpleMarkdownProps) {
  const markdownToHtml = (text: string) => {
    if (!text) return '';
    return text
      // Headers
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      
      // Bold and italic
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      
      // Code
      .replace(/`(.*?)`/g, '<code>$1</code>')
      
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
      
      // Lists
      .replace(/^\- (.*$)/gim, '<li>$1</li>')
      .replace(/^(\d+)\. (.*$)/gim, '<li>$1. $2</li>')
      
      // Line breaks
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      
      // Wrap in paragraph tags
      .replace(/^(.*)$/gim, '<p>$1</p>')
      
      // Clean up empty paragraphs
      .replace(/<p><\/p>/g, '')
      .replace(/<p><br><\/p>/g, '')
      
      // Clean up list items that got wrapped in paragraphs
      .replace(/<p><li/g, '<li')
      .replace(/<\/li><\/p>/g, '<\/li>')
      .replace(/<li>(.*?)<\/li>/g, '<li>$1<\/li>')
      
      // Wrap consecutive list items in ul tags
      .replace(/(<li>.*?<\/li>)+/g, function(match) {
        return '<ul>' + match + '<\/ul>';
      });
  };
  
  return (
    <div 
      className={cn(className)}
      dangerouslySetInnerHTML={{ __html: markdownToHtml(children) }}
    />
  );
} 