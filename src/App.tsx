import React, { useEffect, useState, useRef } from 'react';
import ReactSVG from '@/assets/react.svg';
import { Badge } from '@/components/ui/badge';
import ChatBot from './pages/Chatbot';
import Sidebar from './pages/sidebar';
import StreamingTextDemo from './pages/text';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

const baseApiUrl = import.meta.env.MODE === 'production'
  ? import.meta.env.VITE_API_BASE_URL
  : '';

  console.log(import.meta.env.MODE)

interface Chat {
  id: string,
  title: string
}

interface ActiveChat {
  id: string,
  isNewChat: boolean
}

function App() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<ActiveChat>({id: "1", isNewChat: true});
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const sidebarRef = useRef<HTMLDivElement>(null);
  const toggleButtonRef = useRef<HTMLButtonElement>(null);

  const [isCurrentlyNewChat, setIsCurrentlyNewChat] = useState(false);

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
    if (storedChats && JSON.parse(storedChats).length > 0) {
      const chats = JSON.parse(storedChats)
      setChats(chats);
      setActiveChat({id: chats[0].id, isNewChat: false})
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
    console.log(`creating new chat id`)
    const response = await fetch(`${baseApiUrl}/api/createThread`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      },
    })

    if (!response.ok) {
      alert(`Failed to create new chat: ${response.status}`)
    }
    console.log(`done`)
    const data = await response.json();

    const id = data.id;
    console.log(`Creating new chat with id = ${id}`)

    const newChat = { id: id, title: `New Chat` };
    const updatedChats = [...chats, newChat];
    setChats(updatedChats);
    setActiveChat({id: newChat.id, isNewChat: true});
    localStorage.setItem('chats', JSON.stringify(updatedChats));

    return newChat.id;
  };

  const handleSelectedChat = (chatid : string) => {
    setIsCurrentlyNewChat(false)
    setActiveChat({id: chatid, isNewChat: false});
    setIsSidebarOpen(false); // Close sidebar on mobile after selecting a chat
    console.log(`in ${chatid}`)
  }

  const updateChatTitle = (chatTitle: string) => {
    const updatedChats = chats.map(chat => 
      chat.id === activeChat.id ? { ...chat, title: chatTitle } : chat
    );
  
    setChats(updatedChats);
    localStorage.setItem('chats', JSON.stringify(updatedChats));
  };  

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleNoSelectedChat = (chatId: string, chatTitle: string) => {
    setIsCurrentlyNewChat(true)
    const newChat = { id: chatId, title: chatTitle};
    const updatedChats = [...chats, newChat];
    setChats(updatedChats);
    setActiveChat({id: newChat.id, isNewChat: true});
    localStorage.setItem('chats', JSON.stringify(updatedChats));
  }


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
        <ChatBot isMobile={isMobile} activeChat={activeChat} onFirstPrompt={updateChatTitle} onNoChat={handleNoSelectedChat}/>
      </div>
    </main>
  );
}

export default App;