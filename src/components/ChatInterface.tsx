import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SendIcon, AlertCircle } from 'lucide-react';
import ChatMessage from './ChatMessage';
import { toast } from "@/components/ui/sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/deepseek-chat`;

const fallbackResponses = [
  "Hello! I'm the Clearfund AI assistant. How can I assist with your AI business financing needs today?",
  "Could you tell me more about your AI business and what type of financing you're looking for?",
  "Based on what you've shared, we offer funding options from $5K to $2M that might be ideal for your situation.",
  "Our application process is simple - you can complete it online in about 5 minutes.",
  "Our funding is specifically designed for AI-driven businesses looking to scale.",
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
  }, [messages, isAiTyping, currentStreamedText]);

  const streamChat = async (userMessage: string) => {
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ message: userMessage }),
    });

    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({ error: "Unknown error" }));
      if (resp.status === 429) {
        toast.error("Rate limit exceeded. Please try again in a moment.");
      } else if (resp.status === 402) {
        toast.error("AI service requires payment. Please contact support.");
      }
      throw new Error(errorData.error || `API returned status ${resp.status}`);
    }

    if (!resp.body) throw new Error("No response body");

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let accumulatedText = '';
    let textBuffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") break;

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            accumulatedText += content;
            setCurrentStreamedText(accumulatedText);
          }
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }

    // Final flush
    if (textBuffer.trim()) {
      for (let raw of textBuffer.split("\n")) {
        if (!raw) continue;
        if (raw.endsWith("\r")) raw = raw.slice(0, -1);
        if (raw.startsWith(":") || raw.trim() === "") continue;
        if (!raw.startsWith("data: ")) continue;
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === "[DONE]") continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) accumulatedText += content;
        } catch { /* ignore */ }
      }
    }

    return accumulatedText;
  };

  const handleSendMessage = async () => {
    if (inputValue.trim() === '' || isAiTyping) return;

    setMessages(prev => [...prev, { text: inputValue, isAi: false }]);
    const userMessage = inputValue;
    setInputValue('');
    setIsAiTyping(true);
    setApiError(null);
    setCurrentStreamedText('');

    try {
      const response = await streamChat(userMessage);
      setMessages(prev => [...prev, { text: response || "I'm sorry, I couldn't generate a response.", isAi: true }]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      setApiError('Unable to reach AI service. Using fallback responses.');
      const fallback = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
      setMessages(prev => [...prev, { text: fallback, isAi: true }]);
    } finally {
      setIsAiTyping(false);
      setCurrentStreamedText('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSendMessage();
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
          <ChatMessage key={index} message={message.text} isAi={message.isAi} />
        ))}
        {isAiTyping && (
          <ChatMessage
            message={currentStreamedText || ""}
            isAi={true}
            isTyping={!currentStreamedText}
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
