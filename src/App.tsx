import React, { useEffect, useState, useRef } from 'react';
import ReactSVG from '@/assets/react.svg';
import { Badge } from '@/components/ui/badge';
import ChatBot from './pages/Chatbot';
import Sidebar from './pages/sidebar';
import StreamingTextDemo from './pages/text';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Chat {
  id: string,
  title: string
}

function App() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<string>('1');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const sidebarRef = useRef<HTMLDivElement>(null);
  const toggleButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768); // Adjust this breakpoint as needed
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);

    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  useEffect(() => {
    const storedChats = localStorage.getItem("chats");
    if (storedChats) {
      const chats = JSON.parse(storedChats)
      setChats(chats);
      setActiveChat(chats[0].id)
    }
  }, []);

  useEffect(() => {
    // ... existing code ...
  
    const handleClickOutside = (event: MouseEvent) => {
      if (isSidebarOpen &&
          sidebarRef.current &&
          !sidebarRef.current.contains(event.target as Node) &&
          toggleButtonRef.current &&
          !toggleButtonRef.current.contains(event.target as Node)) {
        setIsSidebarOpen(false);
      }
    };
  
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSidebarOpen]);

  const handleNewChat = async() => {
    const response = await fetch('/api/createThread', {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      },
    })

    if (!response.ok) {
      alert(`Failed to create new chat: ${response.status}`)
    }

    const data = await response.json();

    const id = data.id;
    console.log(`Creating new chat with id = ${id}`)

    const newChat = { id: id, title: `New Chat` };
    const updatedChats = [...chats, newChat];
    setChats(updatedChats);
    setActiveChat(newChat.id);

    localStorage.setItem('chats', JSON.stringify(updatedChats));
  };

  const handleSelectedChat = (chatid : string) => {
    setActiveChat(chatid);
    setIsSidebarOpen(false); // Close sidebar on mobile after selecting a chat
    console.log(`in ${chatid}`)
  }

  const updateChatTitle = (chatTitle: string) => {
    const updatedChats = chats.map(chat => 
      chat.id === activeChat ? { ...chat, title: chatTitle } : chat
    );
  
    setChats(updatedChats);
    localStorage.setItem('chats', JSON.stringify(updatedChats));
  };  

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <main className="flex h-screen w-screen overflow-hidden">
      <div ref={sidebarRef} className={`fixed inset-y-0 left-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition duration-200 ease-in-out z-30 md:z-auto`}>
        <Sidebar
          chats={chats}
          activeChat={activeChat}
          onSelectChat={handleSelectedChat}
          onNewChat={handleNewChat}
        />
      </div>
      <div className="flex-grow flex flex-col w-full md:w-auto">
        <div className="md:hidden">
          <Button ref={toggleButtonRef} onClick={toggleSidebar} className="m-2">
            <Menu className="h-6 w-6" />
          </Button>
        </div>
        <ChatBot isMobile={isMobile} activeChat={activeChat} onFirstPrompt={updateChatTitle}/>
      </div>
    </main>
  );
}

export default App;