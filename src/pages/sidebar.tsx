import React from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { PlusCircle } from 'lucide-react';

interface SidebarProps {
  chats: { id: string; title: string }[];
  activeChat: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ chats, activeChat, onSelectChat, onNewChat }) => {
    return (
        <div className="w-64 bg-gray-900 text-white h-screen flex flex-col">
          <div className="p-4">
            <p className='p-4 scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl'>Optim<span className='text-[#012ea5]'>AI</span></p>
            <Button onClick={onNewChat} className="w-full bg-gray-700 hover:bg-gray-600">
              <PlusCircle className="mr-2 h-4 w-4" /> New chat
            </Button>
          </div>
          <ScrollArea className="flex-grow w-full flex flex-col items-center justify-start ">
            {chats.map((chat) => (
              <Button
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                className={`w-11/12 justify-start px-4 py-2 text-left mt-2 ml-2 text-white text-clip overflow-hidden ${
                  activeChat === chat.id ? 'bg-white text-gray-900' : 'bg-gray-800 hover:bg-gray-700'
                }`}
              >
                {chat.title}
              </Button>
            ))}
          </ScrollArea>
        </div>
      );
};

export default Sidebar;