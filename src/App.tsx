import React, { useEffect, useState } from 'react';
import ReactSVG from '@/assets/react.svg';
import { Badge } from '@/components/ui/badge';
import ChatBot from './pages/Chatbot';
import Sidebar from './pages/sidebar';

interface Chat {
  id: string,
  title: string
}

function App() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<string>('1');


  useEffect(() => {
    const storedChats = localStorage.getItem("chats");
    if (storedChats) {
      const chats = JSON.parse(storedChats)
      setChats(chats);
      setActiveChat(chats[0].id)
    }
  }, []);

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
    console.log(`in ${chatid}`)
  }

  const updateChatTitle = (chatTitle: string) => {
    // Find the chat by the activeChat ID and update the title
    const updatedChats = chats.map(chat => 
      chat.id === activeChat ? { ...chat, title: chatTitle } : chat
    );
  
    // Update the state and localStorage
    setChats(updatedChats);
    localStorage.setItem('chats', JSON.stringify(updatedChats));
  };  

  return (
    <main className="flex h-screen w-screen">
      <Sidebar
        chats={chats}
        activeChat={activeChat}
        onSelectChat={handleSelectedChat}
        onNewChat={handleNewChat}
      />
      <div className="flex-grow flex flex-col items-center justify-center">
        <ChatBot activeChat={activeChat} onFirstPrompt={updateChatTitle}/>
      </div>
    </main>
  );
}

export default App;