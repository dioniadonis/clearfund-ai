
import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SendIcon, AlertCircle } from 'lucide-react';
import ChatMessage from './ChatMessage';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Fallback responses in case the API is unavailable
const fallbackResponses = [
  "Hello! I'm the Clearfund AI assistant. How can I assist with your AI business financing needs today?",
  "Could you tell me more about your AI business and what type of financing you're looking for?",
  "Based on what you've shared, we offer funding options from $5K to $2M that might be ideal for your situation. This would give you flexible access to capital when needed.",
  "Excellent question! Our funding options typically range from $5,000 to $2,000,000 with flexible terms. The specific rates depend on your business profile, AI technology, and growth trajectory.",
  "Our application process is simple - you can complete it online in about 5 minutes. We'll need your basic business information, 3 months of bank statements, and your AI product roadmap.",
  "I'd be happy to check your pre-qualification options. This would require some basic information about your AI business and won't affect your credit score.",
  "Our funding is specifically designed for AI-driven businesses looking to scale. We understand the unique capital needs of machine learning development, data acquisition, and AI infrastructure costs.",
];

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<{text: string, isAi: boolean}[]>([
    { text: "Hi there! I'm your Clearfund AI assistant. How can I help with your business funding needs today?", isAi: true }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [currentStreamedText, setCurrentStreamedText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isAiTyping]);

  const handleStreamResponse = async (reader: ReadableStreamDefaultReader<Uint8Array>) => {
    const decoder = new TextDecoder();
    let accumulatedText = '';
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          // End of stream, add the final message
          if (accumulatedText) {
            setMessages(prev => [...prev, { text: accumulatedText, isAi: true }]);
          }
          setIsAiTyping(false);
          setCurrentStreamedText('');
          break;
        }
        
        const chunk = decoder.decode(value, { stream: true });
        
        // Process the chunk to extract the content from SSE format
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.choices && data.choices[0].delta && data.choices[0].delta.content) {
                accumulatedText += data.choices[0].delta.content;
                setCurrentStreamedText(accumulatedText);
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error reading stream:', error);
      setIsAiTyping(false);
      toast.error('Error reading response stream');
      
      // If we have accumulated some text, use it
      if (accumulatedText) {
        setMessages(prev => [...prev, { text: accumulatedText, isAi: true }]);
      } else {
        // Otherwise use fallback
        const fallbackResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
        setMessages(prev => [...prev, { text: fallbackResponse, isAi: true }]);
      }
    }
  };

  const getAIResponse = async (userMessage: string) => {
    try {
      // Clear any previous API error
      setApiError(null);
      
      // First attempt with direct fetch and complete headers
      try {
        // Get the session first using the correct method
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData?.session?.access_token || '';
        
        // Set proper headers including Accept: text/event-stream for streaming
        const response = await fetch('https://kuclqjvdrtetmtygujbd.supabase.co/functions/v1/deepseek-chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream',
            'Authorization': `Bearer ${accessToken}`,
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1Y2xxanZkcnRldG10eWd1amJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1MjgxMjUsImV4cCI6MjA2MzEwNDEyNX0.lvIsuzbauBxfyWH5dZlTgDfIV3tSIQ3vG6zMr0ebWyQ'
          },
          body: JSON.stringify({ message: userMessage }),
        });
        
        if (response.ok && response.body) {
          const reader = response.body.getReader();
          await handleStreamResponse(reader);
          return null;
        } else {
          const errorText = await response.text();
          console.error('API error response:', response.status, errorText);
          throw new Error(`API returned status ${response.status}: ${errorText}`);
        }
      } catch (initialError) {
        console.error('Error connecting to DeepSeek API:', initialError);
        
        // Try fallback with just the API key (anonymous access) and different headers
        try {
          const response = await fetch('https://kuclqjvdrtetmtygujbd.supabase.co/functions/v1/deepseek-chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'text/event-stream',
              'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1Y2xxanZkcnRldG10eWd1amJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1MjgxMjUsImV4cCI6MjA2MzEwNDEyNX0.lvIsuzbauBxfyWH5dZlTgDfIV3tSIQ3vG6zMr0ebWyQ'
            },
            body: JSON.stringify({ message: userMessage }),
          });
          
          if (response.ok && response.body) {
            const reader = response.body.getReader();
            await handleStreamResponse(reader);
            return null;
          } else {
            const errorText = await response.text();
            throw new Error(`API returned status ${response.status}: ${errorText}`);
          }
        } catch (fetchError) {
          console.error('All connection attempts failed:', fetchError);
          // Continue to fallback response
          throw fetchError;
        }
      }
      
      // If we've reached this point, use fallback response
      setApiError('Unable to reach AI service. Using fallback responses.');
      return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    } catch (err) {
      console.error('Final catch - Exception calling DeepSeek API:', err);
      setApiError('Unable to reach AI service. Using fallback responses.');
      toast.error('Failed to get AI response. Using fallback response instead.');
      return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    }
  };

  const handleSendMessage = async () => {
    if (inputValue.trim() === '' || isAiTyping) return;
    
    // Add user message
    setMessages(prev => [...prev, { text: inputValue, isAi: false }]);
    const userMessage = inputValue;
    setInputValue('');
    
    // Show AI typing indicator
    setIsAiTyping(true);
    
    try {
      // Get response from DeepSeek API
      const aiResponse = await getAIResponse(userMessage);
      
      // If we got a direct response (non-streaming), add it to messages
      // Otherwise the stream handler will add the messages
      if (aiResponse) {
        setIsAiTyping(false);
        setMessages(prev => [...prev, { text: aiResponse, isAi: true }]);
      }
    } catch (error) {
      console.error('Error getting AI response:', error);
      setIsAiTyping(false);
      // Use fallback response if API fails
      const fallbackResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
      setMessages(prev => [...prev, { text: fallbackResponse, isAi: true }]);
      toast.error('Error getting AI response. Using fallback response instead.');
    }
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
          <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center">
            <span className="font-bold text-clearfund-blue">CF</span>
          </div>
          <div className="ml-3">
            <h3 className="font-medium">Clearfund AI Financial Advisor</h3>
            <div className="flex items-center text-xs">
              <div className="h-2 w-2 bg-green-400 rounded-full mr-2"></div>
              <span>Online now</span>
            </div>
          </div>
        </div>
      </div>
      
      {apiError && (
        <Alert variant="destructive" className="mx-4 mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{apiError}</AlertDescription>
        </Alert>
      )}
      
      <div className="flex-grow p-4 overflow-y-auto bg-gray-50 flex flex-col">
        {messages.map((message, index) => (
          <ChatMessage 
            key={index} 
            message={message.text} 
            isAi={message.isAi} 
          />
        ))}
        {isAiTyping && (
          <ChatMessage 
            message={currentStreamedText || ""} 
            isAi={true} 
            isTyping={currentStreamedText ? false : true} 
          />
        )}
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
