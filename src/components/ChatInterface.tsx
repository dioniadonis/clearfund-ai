
import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SendIcon } from 'lucide-react';
import ChatMessage from './ChatMessage';

// Sample responses for the AI
const aiResponses = [
  "Hello! I'm the BluVine AI advisor. How can I assist with your business financing needs today?",
  "Could you tell me more about your business and what type of financing you're looking for?",
  "Based on what you've shared, a Line of Credit might be ideal for your situation. This would give you flexible access to funds when needed, with interest only on what you use.",
  "Excellent question! Our business loans typically range from $5,000 to $250,000 with terms from 6 to 12 months. The specific rates depend on your business profile and credit history.",
  "Our application process is simple - you can complete it online in about 5 minutes. We'll need your basic business information, 3 months of bank statements, and a brief overview of how you plan to use the funds.",
  "I'd be happy to check your pre-qualification options. This would require some basic information about your business and won't affect your credit score.",
  "Invoice factoring is a great option for businesses with outstanding invoices. It allows you to get immediate cash for your unpaid invoices, improving your cash flow while waiting for customers to pay.",
];

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<{text: string, isAi: boolean}[]>([
    { text: "Hi there! I'm your BluVine AI financial advisor. How can I help with your business financing needs today?", isAi: true }
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
      <div className="bg-bluevine-dark-blue p-4 text-white">
        <div className="flex items-center">
          <div className="h-10 w-10 bg-bluevine-accent rounded-full flex items-center justify-center">
            <span className="font-bold">AI</span>
          </div>
          <div className="ml-3">
            <h3 className="font-medium">BluVine AI Financial Advisor</h3>
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
            className="bg-bluevine-accent hover:bg-bluevine-dark-blue"
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
