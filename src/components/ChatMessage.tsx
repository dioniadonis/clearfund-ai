
import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface ChatMessageProps {
  message: string;
  isAi: boolean;
  isTyping?: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isAi, isTyping = false }) => {
  const [displayText, setDisplayText] = useState('');
  const [isTypingText, setIsTypingText] = useState(false);
  const [charIndex, setCharIndex] = useState(0);

  // Reset typing animation when message changes
  useEffect(() => {
    if (isAi && message && !isTyping) {
      setDisplayText('');
      setCharIndex(0);
      setIsTypingText(true);
    } else if (!isAi) {
      // For user messages, show full text immediately
      setDisplayText(message);
      setIsTypingText(false);
    }
  }, [message, isAi, isTyping]);

  // Handle the typing animation
  useEffect(() => {
    if (!isTypingText || isTyping) return;

    const typingSpeed = 20; // milliseconds per character
    
    if (charIndex < message.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + message[charIndex]);
        setCharIndex(charIndex + 1);
      }, typingSpeed);
      
      return () => clearTimeout(timeout);
    } else {
      setIsTypingText(false);
    }
  }, [charIndex, message, isTypingText, isTyping]);

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
        <p className="text-sm md:text-base">{isAi && isTypingText ? displayText : message}</p>
      )}
    </div>
  );
};

export default ChatMessage;
