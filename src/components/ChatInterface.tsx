
import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SendIcon } from 'lucide-react';
import ChatMessage from './ChatMessage';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Sample responses for the AI
const aiResponses = [
  "Hello! I'm the Clearfund AI advisor. How can I assist with your AI business financing needs today?",
  "Could you tell me more about your AI business and what type of financing you're looking for?",
  "Based on what you've shared, we offer funding options from $5K to $2M that might be ideal for your situation. This would give you flexible access to capital when needed.",
  "Excellent question! Our funding options typically range from $5,000 to $2,000,000 with flexible terms. The specific rates depend on your business profile, AI technology, and growth trajectory.",
  "Our application process is simple - you can complete it online in about 5 minutes. We'll need your basic business information, 3 months of bank statements, and your AI product roadmap.",
  "I'd be happy to check your pre-qualification options. This would require some basic information about your AI business and won't affect your credit score.",
  "Our funding is specifically designed for AI-driven businesses looking to scale. We understand the unique capital needs of machine learning development, data acquisition, and AI infrastructure costs.",
];

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<{text: string, isAi: boolean}[]>([
    { text: "Hi there! I'm your Clearfund AI financial advisor. How can I help with your AI business financing needs today?", isAi: true }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isAiTyping]);

  const handleSendMessage = () => {
    if (inputValue.trim() === '') return;
    
    // Add user message
    setMessages([...messages, { text: inputValue, isAi: false }]);
    setInputValue('');
    
    // Show AI typing indicator
    setIsAiTyping(true);
    
    // Simulate AI response after a delay
    setTimeout(() => {
      setIsAiTyping(false);
      const randomResponse = aiResponses[Math.floor(Math.random() * aiResponses.length)];
      setMessages(prev => [...prev, { text: randomResponse, isAi: true }]);
    }, 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="bg-clearfund-blue p-4 text-white">
        <div className="flex items-center">
          <Avatar className="h-10 w-10 bg-white rounded-full flex items-center justify-center">
            <AvatarImage src="/lovable-uploads/14c6c273-817c-4014-9024-058bf8ec3e00.png" alt="Clearfund Logo" className="p-1 invert" />
            <AvatarFallback className="bg-white text-clearfund-blue">CF</AvatarFallback>
          </Avatar>
          <div className="ml-3">
            <h3 className="font-medium">Clearfund AI Financial Advisor</h3>
            <div className="flex items-center text-xs">
              <div className="h-2 w-2 bg-green-400 rounded-full mr-2"></div>
              <span>Online now</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex-grow p-4 overflow-y-auto bg-gray-50 flex flex-col">
        {messages.map((message, index) => (
          <ChatMessage 
            key={index} 
            message={message.text} 
            isAi={message.isAi} 
          />
        ))}
        {isAiTyping && <ChatMessage message="" isAi={true} isTyping={true} />}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-4 border-t border-gray-100 bg-white">
        <div className="flex space-x-2">
          <Input
            placeholder="Type your question here..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-grow"
          />
          <Button 
            onClick={handleSendMessage} 
            className="bg-clearfund-blue hover:bg-clearfund-dark-blue"
            disabled={inputValue.trim() === '' || isAiTyping}
          >
            <SendIcon className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
