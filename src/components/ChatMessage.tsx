
import React from 'react';
import { cn } from '@/lib/utils';

interface ChatMessageProps {
  message: string;
  isAi: boolean;
  isTyping?: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isAi, isTyping = false }) => {
  return (
    <div className={cn(
      "max-w-[85%] p-3 rounded-lg mb-4",
      isAi ? "bg-clearfund-pale-blue rounded-tl-none self-start" : "bg-gray-100 rounded-tr-none self-end"
    )}>
      {isTyping ? (
        <div className="flex space-x-2 items-center h-6">
          <div className="w-2 h-2 rounded-full bg-clearfund-blue animate-pulse"></div>
          <div className="w-2 h-2 rounded-full bg-clearfund-blue animate-pulse delay-150"></div>
          <div className="w-2 h-2 rounded-full bg-clearfund-blue animate-pulse delay-300"></div>
        </div>
      ) : (
        <p className="text-sm md:text-base">{message}</p>
      )}
    </div>
  );
};

export default ChatMessage;
