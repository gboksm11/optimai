import React, { useState, useEffect, useRef, useCallback, act } from 'react';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Mic, Paperclip, Send } from 'lucide-react'
import logo from "../assets/logo.png";


  
interface TextContent {
    value: string;
    annotations?: any;
  }
  
  interface ImageFileContent {
    file_id: string;
    detail: string;
  }
  
  interface TextTypeContent {
    type: "text";
    text: TextContent;
  }
  
  interface ImageFileTypeContent {
    type: "image_file";
    image_file: ImageFileContent;
  }
  
  // The Content type is either TextTypeContent or ImageFileTypeContent
  type Content = TextTypeContent | ImageFileTypeContent;
  
  interface Message {
    id?: string | null;
    object?: string | null;
    created_at?: number | null;
    threadId?: string | null;
    role: "user" | "assistant";
    content: Content[];
    assistant_id?: string | null;
    run_id?: string | null;
    attachments?: any[];  // Adjust this if attachments have a defined structure
    metadata?: {} | null;  // Assuming metadata is a key-value object; adjust if necessary
  }

  interface ChatImage {
    id: string,
    images: any []
  }
  

interface ChatBotProps {
  activeChat: string // id of thread to be loaded
  onFirstPrompt: (chatTitle: string) => void
}

const ChatBot: React.FC<ChatBotProps> = ({ activeChat, onFirstPrompt }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>('');

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [selectedImagesURLs, setSelectedImagesURLs] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const [chatImages, setChatImages] = useState<ChatImage[]>([]); // image urls

  const loadMessages = useCallback(async () => {
    if (activeChat !== "1") {
        console.log(activeChat)
        setIsLoadingMessages(true);
        try {
          const response = await fetch(`/api/getThreadMessages?id=${activeChat}`);
          if (!response.ok) {
            throw new Error('Failed to load messages');
          }
          const data = await response.json();
          setMessages(data.messages);
          const messages = data.messages;


        const chatImages : ChatImage[] = [];
    
        for (const message of messages) {
            const messageURLs = [];
            const messageImages = message.content.filter(c => c.type === 'image_file');

            for (const messageImage of messageImages) {
                const fileId = messageImage.image_file.file_id;
                const objectUrl = await fetchImageById(fileId);
                messageURLs.push(objectUrl)
            }

            console.log(messageURLs);
            chatImages.push({id: message.id, images: messageURLs})
        }

        setChatImages(chatImages)
        } catch (error) {
          console.error('Error loading messages:', error);
        } finally {
          setIsLoadingMessages(false);
        }
    } else {

    }

  }, [activeChat]);

  useEffect(() => {
    if (activeChat) {
      loadMessages();
      setInput(''); // Clear the input when switching chats
      setSelectedImages([]); // clear images preview
      setSelectedFiles([])
      setSelectedImagesURLs([])
      setChatImages([]);
    }
  }, [activeChat, loadMessages]);


  useEffect(() => {
    if (messages.length == 1) {
        onFirstPrompt(messages[0].content[0].text.value);
    }
  }, [messages])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSend = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSending) return;

    setIsSending(true);
    const newMessage : Message = {
        threadId: activeChat,
        role: "user",
        content: []
    };
    
    if (input.trim()) {  // there is text in the prompt
        newMessage.content.push({
            type: "text",
            text: {
                value: input.trim()
            }
        });
    }

    const formData = new FormData();
    // Append the newMessage as a JSON string to the FormData
    formData.append('newMessage', JSON.stringify(newMessage));

    // Append each selected file to the FormData
    selectedFiles.forEach((file, index) => {
        formData.append('files', file);  // Append files (non-image files)
    });

    // Append each selected image to the FormData
    selectedImages.forEach((image, index) => {
        formData.append('images', image);  // Append images (image files)
    });

    setMessages(prev => [...prev, newMessage]);

    const messageImages = [...selectedImagesURLs];
    console.log(messageImages)

    setSelectedFiles([]);
    setSelectedImages([]);
    setSelectedImagesURLs([])
    setInput('');

    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }


      let newMessageId = "";
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n').filter(line => line.trim() !== '');
        
        for (const line of lines) {
          const event = JSON.parse(line.replace(/^data: /, ''));
          if (event.type === 'message_id') {
            newMessageId = event.messageId;

          }
          if (event.type === 'message') {
           setMessages(prev => {
                let newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage.role === 'assistant') {
                    if (lastMessage.content[0] && lastMessage.content[0].type == "text") {
                        lastMessage.content[0].text.value += event.content;
                    }

                } else {
                    lastMessage.id = newMessageId,
                  newMessages.push({ role: 'assistant', content: [{
                    type: "text",
                    text: {
                        value: event.content,
                    }
                  }] });
                }
                return newMessages;
              });
          }
        }
        setChatImages([...chatImages, {id: newMessageId, images: messageImages}]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const parseMessage = (message: Message) => {
    const messageContents = message.content;
    let messageText = "";
    let messageImages = [];



    chatImages.map(chatImg => {
        if (chatImg.id == message.id) {
            console.log(chatImg.id);
            console.log(message.id);
            if (chatImg.images) {
                messageImages = [...chatImg.images];
            }
        }
    })


    for (const messageContent of messageContents) {
        if (messageContent.type == "text" ) {
            messageText = messageContent.text.value;
        } else if (messageContent.type == "image_file") {

        }
    }

    return (
        <div>
            {messageImages.length > 0 && messageImages.map((image, index) => (
        <img key={index} src={image} alt="preview" className="w-48 rounded" />
        ))}
            <p>{messageText}</p>
        </div>
    )
  }

  // Function to fetch image from OpenAI and create ObjectURL
  const fetchImageById = async (fileId : string) => {
    try {
      const response = await fetch(`/api/getFile/${fileId}`);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      return objectUrl;
    } catch (error) {
      console.error('Error fetching image:', error);
    }
  };

  const handleVoice = () => {
    alert('Voice button clicked (functionality not implemented in this preview)');
  };

  // uploading images and files

  const handleUploadClick = () => {
    // Trigger the hidden file input when the button is clicked
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
        const filesArray = Array.from(event.target.files);
        setSelectedFiles(filesArray);

        const images = filesArray
        .filter(file => file.type.startsWith('image/')) // Filter images
         // Create object URLs for preview

        const nonImages = filesArray.filter(file => !file.type.startsWith('image/'));

        setSelectedImages(images);
        setSelectedImagesURLs(images.map(imageFile => URL.createObjectURL(imageFile)));
        setSelectedFiles(nonImages);
      
      // You can handle file upload here, or set files in state for later use.
      console.log(filesArray);
    }
  };

  const handleAttach = () => {
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      setInput(prev => prev + "\n[File attached]");
    }, 1500);
  };


  return (
    <div className="flex flex-col h-full w-full bg-gray-100 rounded-lg overflow-hidden">
      <ScrollArea className="flex-grow p-4 pl-16 pr-16">
        {messages.length == 0 &&
            <img className='ml-auto mr-auto w-72' src={logo}></img>
        }
        {isLoadingMessages ? (
          <div className="text-center">Loading messages...</div>
        ) : (
          messages.map((message, index) => (
            <div key={index} className={`mb-4 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
              <div className={`inline-block p-2 rounded-lg ${message.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-300'}`}>
                {parseMessage(message)}
              </div>
            </div>
          ))
        )}
      </ScrollArea>
      <form onSubmit={handleSend} className="p-4 bg-white">
        <div className="flex items-center space-x-2">
          <Button type="button" variant="outline" size="icon" onClick={handleVoice}>
            <Mic className="h-4 w-4" />
          </Button>
          <div>
            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileSelect}
                accept=".txt, .pdf, .doc, .docx, image/*"
                multiple // Accept specific file types
            />
            <Button type="button" variant="outline" size="icon" onClick={handleUploadClick} disabled={isUploading}>
                <Paperclip className="h-4 w-4" />
            </Button>
          </div>

                    {/* Render selected images */}
            {selectedImages.length > 0 && (
            <div className="image-preview flex space-x-2">
              {selectedImagesURLs.map((image, index) => (
                <img key={index} src={image} alt="preview" className="h-10 w-10 rounded" />
              ))}
            </div>
            )}

                      {/* Render non-image files */}
          {selectedFiles.length > 0 && (
            <div className="file-preview flex space-x-2">
              {selectedFiles.map((file, index) => (
                <div key={index} className="h-10 w-10 flex items-center justify-center bg-gray-200 rounded">
                  <p className="text-xs text-gray-600 text-center">
                    {file.name}<br />({file.type.split('/').pop()})
                  </p>
                </div>
              ))}
            </div>
          )}
          
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button type="submit" disabled={isSending || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ChatBot;