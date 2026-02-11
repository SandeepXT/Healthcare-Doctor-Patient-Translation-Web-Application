'use client';

import React from 'react';
import { format } from 'date-fns';
import { Volume2 } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import type { Message } from '@/types';

interface MessageBubbleProps {
  message: Message;
  highlight?: string;
}

export function MessageBubble({ message, highlight }: MessageBubbleProps) {
  const isDoctor = message.role === 'DOCTOR';
  
  const highlightText = (text: string, searchTerm?: string) => {
    if (!searchTerm) return text;
    
    const parts = text.split(new RegExp(`(${searchTerm})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === searchTerm.toLowerCase() ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-900">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const playAudio = () => {
    if (message.audioUrl) {
      const audio = new Audio(message.audioUrl);
      audio.play();
    }
  };

  return (
    <div className={cn('flex w-full', isDoctor ? 'justify-end' : 'justify-start')}>
      <Card
        className={cn(
          'max-w-[80%] p-4',
          isDoctor 
            ? 'bg-blue-100 dark:bg-blue-900 border-blue-200 dark:border-blue-800' 
            : 'bg-green-100 dark:bg-green-900 border-green-200 dark:border-green-800'
        )}
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="font-semibold text-sm">
            {isDoctor ? '👨‍⚕️ Doctor' : '🤒 Patient'}
          </span>
          <span className="text-xs text-muted-foreground">
            {format(new Date(message.createdAt), 'HH:mm')}
          </span>
        </div>
        
        <div className="space-y-2">
          <p className="text-sm whitespace-pre-wrap">
            {highlightText(message.originalText, highlight)}
          </p>
          
          {message.translatedText && (
            <div className="pt-2 border-t border-gray-300 dark:border-gray-600">
              <p className="text-xs text-muted-foreground mb-1">
                Translation ({message.targetLang === 'hi' ? 'Hindi' : 'English'}):
              </p>
              <p className="text-sm italic whitespace-pre-wrap">
                {highlightText(message.translatedText, highlight)}
              </p>
            </div>
          )}
          
          {message.audioUrl && (
            <Button
              variant="ghost"
              size="sm"
              onClick={playAudio}
              className="mt-2"
            >
              <Volume2 className="h-4 w-4 mr-2" />
              Play Audio
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
