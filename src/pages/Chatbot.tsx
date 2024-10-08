import React, { useState, useEffect, useRef, useCallback, act, useMemo } from 'react';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Mic, Paperclip, Send } from 'lucide-react'
import logo from "../assets/hovering-logo.gif";
import Image from '@/components/custom-components/Image';
import loadingAnim from "../assets/loading-anim.gif";
import MarkdownIt from 'markdown-it';
import "./test.css";

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
    id: number,
    images: any []
  }
  

interface ChatBotProps {
  activeChat: any // id of thread to be loaded
  onFirstPrompt: (chatTitle: string) => void
  onNoChat: (chatId: string, chatTitle: string) =>  void
  isMobile: boolean,
  isNewChat: boolean
}

const baseApiUrl = import.meta.env.MODE === 'production'
  ? import.meta.env.VITE_API_BASE_URL
  : '';

const ChatBot: React.FC<ChatBotProps> = ({ activeChat, onFirstPrompt, isMobile, onNoChat}) => {
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
  const [chatFiles, setChatFiles] = useState<any[]>([]);

  const mdParser = useMemo(() => new MarkdownIt(), []);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [isNoChat, setIsNoChat] = useState(false);

  const [lastMessageIsLoading, setLastMessageIsLoading] = useState(false);

  useEffect(() => {
    if (isMobile) {
      // Mobile-specific adjustments
      const metaViewport = document.querySelector('meta[name=viewport]');
      const viewportContent = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0';
      if (metaViewport) {
        metaViewport.setAttribute('content', viewportContent);
      } else {
        const newMetaViewport = document.createElement('meta');
        newMetaViewport.name = 'viewport';
        newMetaViewport.content = viewportContent;
        document.head.appendChild(newMetaViewport);
      }
    }
  }, [isMobile]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({behavior: "instant" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = useCallback(async () => {
    if (isNoChat) {
        setIsNoChat(false);
        return;
    }

    if (!activeChat.isNewChat && !isNoChat) {
        setIsLoadingMessages(true);
        try {
          const response = await fetch(`${baseApiUrl}/api/getThreadMessages?id=${activeChat.id}`);
          if (!response.ok) {
            throw new Error('Failed to load messages');
          }
          const data = await response.json();
          setMessages(data.messages);
          const messages = data.messages;


        const chatImages : ChatImage[] = [];
        let index = -1;
        for (const message of messages) {
            index++;
            const messageURLs = [];
            const messageImages = message.content.filter(c => c.type === 'image_file');

            for (const messageImage of messageImages) {
                const fileId = messageImage.image_file.file_id;
                const objectUrl = await fetchImageById(fileId);
                messageURLs.push(objectUrl)
            }

            chatImages.push({id: index, images: messageURLs})
        }

        setChatImages(chatImages);

        } catch (error) {
          console.error('Error loading messages:', error);
        } finally {
          setIsLoadingMessages(false);
        }
    } else {
        setMessages([]);
        setLastMessageIsLoading(false)
    }

  }, [activeChat]);

  useEffect(() => {

    if (activeChat) {

        loadMessages();

      setInput(''); // Clear the input when switching chats
      setSelectedImages([]); // clear images preview
      setSelectedFiles([])
      setSelectedImagesURLs([])
      setChatImages([])
      setChatFiles([]);
    }

  }, [activeChat, loadMessages]);


  useEffect(() => {
    if (messages.length == 1) {
        onFirstPrompt(messages[0].content[0].text.value);
    }
  }, [messages])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    setInput(e.target.value);
  };


  const handleSend = async (e: React.FormEvent<HTMLFormElement>) => {
    setLastMessageIsLoading(true);
    e.preventDefault();
    // let newChatId = "";
    if (activeChat.id == '1' ) { // first ever chat
        setIsNoChat(true);
    }
    


    if (isSending) return;

    setIsSending(true);


    const newMessage : Message = {
        threadId: activeChat.id == "1" ? null : activeChat.id,
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

    const messageImages = [...selectedImagesURLs];

    const userMessageIndexId = messages.length;

    setChatImages([...chatImages, {id: messages.length, images: messageImages}]);
    setMessages(prev => [...prev, newMessage]);




    setSelectedFiles([]);
    setSelectedImages([]);
    setSelectedImagesURLs([])
    setInput('');

    try {
      const response = await fetch(`${baseApiUrl}/api/assistant`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        setIsSending(false);
        throw new Error('Failed to send message');
      }


      let newMessageId = "";
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = new TextDecoder().decode(value);
        console.log(`chunk = ${chunk}`)
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
          if (event.type == "file") {
            const file_id_generated = event.file_id;
            const file_type = event.file_type;

            console.log("file generated id = ", file_id_generated);
            console.log("file type = ", file_type);

            const file_url = await fetchImageById(file_id_generated, file_type);
            setChatFiles(prev => [...prev, {id: userMessageIndexId + 1, fileUrl: file_url}])
          }

          if (event.type == "threadId") {
            onNoChat(event.threadId, input.trim());
          }

          if (event.type == "done") {
            setLastMessageIsLoading(false)
          }

        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const parseMessage = (message: Message, index: number) => {
    const messageContents = message.content;
    let messageText = "";
    let messageImages = [];
    let messageFileUrl = "";



    chatImages.map(chatImg => {
        if (chatImg.id == index) {
            if (chatImg.images) {
                messageImages = [...chatImg.images];
            }
        }
    });

    chatFiles.map(chatFile => {
      if (chatFile.id == index) {
        messageFileUrl = chatFile.fileUrl;
      }
    })

    


    for (const messageContent of messageContents) {
        if (messageContent.type == "text" ) {
            messageText = messageContent.text.value;
            //console.log(messageText)
        } else if (messageContent.type == "image_file") {

        }
    }

    return (
        <div className='message'>
            {messageImages.length > 0 && messageImages.map((image, index) => (
                <Image width={350} key={index} src={image} className="w-48 rounded"></Image>
        // <img key={index} src={image} alt="preview" className="w-48 rounded" />
        ))}

            {/* <p>{messageText}</p> */}

            {/* <div className='inline' dangerouslySetInnerHTML={{__html: marked.parse(messageText)}}></div>*/}
            { message.role == "assistant" ? 
                      <div className='markdown-content' dangerouslySetInnerHTML={{__html: mdParser.render(messageText)}}></div> :
                      <p className='text-left'>{messageText}</p>
            }

            {messageFileUrl && <iframe
  src={messageFileUrl}
  style={{ width: "100%", height: "600px", border: "none" }}
  title="PDF Viewer"
/>}

        </div>
    )
  }

  // Function to fetch image from OpenAI and create ObjectURL
  const fetchImageById = async (fileId : string, fileType: string = "") => {
    try {
      const response = await fetch(`${baseApiUrl}/api/getFile/${fileId}${fileType ? `?fileType=${fileType}` : ""}`);
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
      //console.log(filesArray);
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
    <div className="flex flex-col h-full w-full bg-white rounded-lg overflow-hidden">
      <ScrollArea className="flex-grow p-4 md:px-16 whitespace-pre-wrap overflow-y-auto" ref={scrollAreaRef}>
        {messages.length == 0 && activeChat.isNewChat &&
            <img className='mx-auto w-48 md:w-72' src={logo} alt="Logo" />
        }
        {isLoadingMessages ? (
            <img className='w-48 md:w-96 mx-auto mt-12' src={loadingAnim} alt="Loading" />
        ) : (
          messages.map((message, index) => (
            <div key={index} className={`mb-4 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
              <div className={`inline-block p-2 rounded-lg ${message.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black'}`}>
                {parseMessage(message, index)}
              </div>
            </div>
          ))
          
        )}
        { lastMessageIsLoading && <div>
            <img className='w-24 md:w-48 mx-auto mt-6' src={loadingAnim}></img>
            <p className='text-blue-600 font-bold text-center'>Generating...</p>
            </div>}
        <div ref={messagesEndRef} />
      </ScrollArea>
      
      <form onSubmit={handleSend} className="p-4 bg-white">
        <div className="flex flex-col space-y-2">
          <div className="flex space-x-2">
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
                multiple
              />
              <Button type="button" variant="outline" size="icon" onClick={handleUploadClick} disabled={isUploading}>
                <Paperclip className="h-4 w-4" />
              </Button>
            </div>
            <Input
              value={input}
              onChange={handleInputChange}
              placeholder="Type a message..."
              className="flex-1"  // Allow text area to grow
            />
            <Button type="submit" disabled={isSending || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
          
          {(selectedImages.length > 0 || selectedFiles.length > 0) && (
            <div className="flex flex-wrap gap-2">
              {selectedImagesURLs.map((image, index) => (
                <img key={index} src={image} alt="preview" className="h-10 w-10 rounded object-cover" />
              ))}
              {selectedFiles.map((file, index) => (
                <div key={index} className="h-10 w-10 flex items-center justify-center bg-gray-200 rounded">
                  <p className="text-xs text-gray-600 text-center">
                    {file.name.slice(0, 6)}...<br />({file.type.split('/').pop()})
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default ChatBot;