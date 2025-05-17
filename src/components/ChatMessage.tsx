
import React from 'react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ChatMessageProps {
  message: string;
  isAi: boolean;
  isTyping?: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isAi, isTyping = false }) => {
  return (
    <div className={cn(
      "flex items-start mb-4 gap-2",
      isAi ? "self-start" : "self-end flex-row-reverse"
    )}>
      {isAi && (
        <Avatar className="h-8 w-8 mt-1 bg-clearfund-dark-blue rounded-full flex-shrink-0">
          <AvatarImage src="/lovable-uploads/14c6c273-817c-4014-9024-058bf8ec3e00.png" alt="Clearfund Logo" className="p-1 invert" />
          <AvatarFallback className="bg-clearfund-dark-blue text-white text-xs">CF</AvatarFallback>
        </Avatar>
      )}
      <div className={cn(
        "max-w-[85%] p-3 rounded-lg",
        isAi 
          ? "bg-clearfund-pale-blue text-clearfund-dark-blue rounded-tl-none" 
          : "bg-clearfund-blue text-white rounded-tr-none"
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
    </div>
  );
};

export default ChatMessage;
