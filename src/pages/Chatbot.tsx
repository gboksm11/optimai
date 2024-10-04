import React, { useState, KeyboardEvent, ChangeEvent } from 'react';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Mic, Paperclip, Send } from 'lucide-react'
import { useChat } from 'ai/react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const ChatBot: React.FC = () => {
  const { messages, input, handleInputChange, handleSubmit, setInput } = useChat({
    api: '/api/chat', // You'll need to create this API route
    initialMessages: [],
  });

  const [isUploading, setIsUploading] = useState<boolean>(false);

  const handleSend = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    handleSubmit(e);
  };

  const handleVoice = (): void => {
    // Implement voice functionality
    alert('Voice button clicked (functionality not implemented in this preview)');
  };

  const handleAttach = (): void => {
    setIsUploading(true);
    // Simulate file upload
    setTimeout(() => {
      setIsUploading(false);
      setInput(prev => prev + "\n[File attached]");
    }, 1500);
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex flex-col h-[400px] w-full max-w-[500px] bg-gray-100 rounded-lg overflow-hidden">
      <div className="flex-1 p-4 overflow-auto">
        <ScrollArea className="h-full pr-4">
          {messages.map((message, index) => (
            <div key={index} className={`mb-4 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
              <div className={`inline-block p-2 rounded-lg ${message.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-300'}`}>
                {message.content}
              </div>
            </div>
          ))}
        </ScrollArea>
      </div>
      <form onSubmit={handleSend} className="p-4 bg-white">
        <div className="flex items-center space-x-2">
          <Button type="button" variant="outline" size="icon" onClick={handleVoice}>
            <Mic className="h-4 w-4" />
          </Button>
          <Button type="button" variant="outline" size="icon" onClick={handleAttach} disabled={isUploading}>
            <Paperclip className="h-4 w-4" />
          </Button>
          <Input
            value={input}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button type="submit">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ChatBot;