
import React from 'react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface ChatMessageProps {
  message: string;
  isAi: boolean;
  isTyping?: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isAi, isTyping = false }) => {
  return (
    <div className={cn(
      "flex items-start gap-3 mb-4",
      isAi ? "self-start" : "self-end flex-row-reverse"
    )}>
      {isAi && (
        <Avatar className="h-8 w-8 border border-white/20 bg-black">
          <AvatarImage src="/lovable-uploads/018b41f8-4813-494d-a833-b32e800d9f4f.png" alt="Clearfund AI" />
          <AvatarFallback className="bg-black text-white">CF</AvatarFallback>
        </Avatar>
      )}
      <div className={cn(
        "max-w-[85%] p-3 rounded-lg",
        isAi ? "bg-clearfund-dark-blue text-white rounded-tl-none" : "bg-gray-100 rounded-tr-none"
      )}>
        {isTyping ? (
          <div className="flex space-x-2 items-center h-6">
            <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
            <div className="w-2 h-2 rounded-full bg-white animate-pulse delay-150"></div>
            <div className="w-2 h-2 rounded-full bg-white animate-pulse delay-300"></div>
          </div>
        ) : (
          <p className="text-sm md:text-base">{message}</p>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
