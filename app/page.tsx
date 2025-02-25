"use client";

import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  X,
  SendHorizontal,
  Bot,
  User,
  Loader2,
  Maximize2,
  Minimize2,
} from "lucide-react";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  isTyping?: boolean;
};

const GridBackground = () => (
  <div className="absolute inset-0 pointer-events-none">
    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />
    <div className="absolute inset-0 [background-size:50px_50px] [background-position:0_0,25px_25px] [background-image:linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)]" />
  </div>
);

export default function Home() {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const validateFile = (file: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      setUploadError('Please upload a valid image file (JPG, PNG, or GIF)');
      return false;
    }

    if (file.size > maxSize) {
      setUploadError('Image size should be less than 5MB');
      return false;
    }

    return true;
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      
      if (validateFile(file)) {
        setImage(file);
        const imageUrl = URL.createObjectURL(file);
        setPreview(imageUrl);
        setChatHistory([]);
      }
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    setUploadError(null);
    
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      const file = event.dataTransfer.files[0];
      
      if (validateFile(file)) {
        setImage(file);
        const imageUrl = URL.createObjectURL(file);
        setPreview(imageUrl);
        setChatHistory([]);
      }
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleCancel = () => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setImage(null);
    setPreview(null);
    setChatHistory([]);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !image || isSending) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: inputMessage.trim(),
    };

    setChatHistory(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsSending(true);

    // Prepare FormData
    const formData = new FormData();
    formData.append("image", image);
    formData.append("prompt", userMessage.content);
    formData.append("history", JSON.stringify(chatHistory.concat(userMessage)));

    try {
      const response = await fetch("/api/gen", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(response.statusText);
      }

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: data.response,
      };

      setChatHistory(prev => [...prev, assistantMessage]);
      
      if (inputRef.current) {
        inputRef.current.focus();
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setChatHistory(prev => [...prev, {
        role: "assistant",
        content: "Sorry, there was an error processing your message. Please try again."
      }]);
    } finally {
      setIsSending(false);
    }
  };
  // Custom Markdown components for styling
const MarkdownComponents = {
  strong: ({ children }: { children: React.ReactNode }) => (
    <span className="font-bold text-white">{children}</span>
  ),
  em: ({ children }: { children: React.ReactNode }) => (
    <span className="italic text-white/90">{children}</span>
  ),
  h1: ({ children }: { children: React.ReactNode }) => (
    <h1 className="text-2xl font-bold mb-4">{children}</h1>
  ),
  h2: ({ children }: { children: React.ReactNode }) => (
    <h2 className="text-xl font-bold mb-3">{children}</h2>
  ),
  h3: ({ children }: { children: React.ReactNode }) => (
    <h3 className="text-lg font-bold mb-2">{children}</h3>
  ),
  p: ({ children }: { children: React.ReactNode }) => (
    <p className="mb-2 leading-relaxed">{children}</p>
  ),
  ul: ({ children }: { children: React.ReactNode }) => (
    <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>
  ),
  li: ({ children }: { children: React.ReactNode }) => (
    <li className="ml-2">{children}</li>
  ),
};

return (
  <div className="flex flex-col md:flex-row min-h-screen bg-gradient-to-br from-orange-500 to-pink-500">
      {!preview ? (
        <div className="w-full h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-lg p-8 bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl relative overflow-hidden">
            <GridBackground />
            
            <motion.div
              className={`relative border-2 border-dashed ${
                isDragging ? "border-blue-400 bg-blue-500/10" : "border-white/40"
              } rounded-2xl w-full h-80 flex flex-col items-center justify-center transition-all duration-300`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <input
                type="file"
                accept="image/jpeg,image/png,image/gif"
                onChange={handleFileChange}
                className="hidden"
                ref={fileInputRef}
              />
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={triggerFileInput}
                  className="bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm text-lg px-8 py-6 rounded-2xl shadow-lg group"
                >
                  <Upload className="mr-3 h-6 w-6 group-hover:scale-110 transition-transform" />
                  Upload Image
                </Button>
              </motion.div>
              <p className="text-white/60 mt-6 text-center text-lg">
                Drag and drop your image here
                <span className="text-sm text-white/40 mt-2 block">
                  Supported formats: JPG, PNG, GIF (max 5MB)
                </span>
              </p>
              {uploadError && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-400 mt-4 text-center"
                >
                  {uploadError}
                </motion.p>
              )}
            </motion.div>
          </Card>
        </div>
    ) : (
      <>
        {/* Image Preview Section */}
        <div className={`relative ${isFullscreen ? 'fixed inset-0 z-50 bg-black' : 'w-full md:w-1/3 h-40 md:h-screen'}`}>
          <motion.div
            className="relative h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <img
              src={preview}
              alt="Uploaded preview"
              className={`w-full h-full object-cover ${isFullscreen ? 'object-contain' : 'object-cover'}`}
            />
            <div className="absolute top-4 right-4 flex gap-2">
              <Button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="bg-black/50 hover:bg-black/70 p-2 rounded-full"
              >
                {isFullscreen ? (
                  <Minimize2 className="h-5 w-5 text-white" />
                ) : (
                  <Maximize2 className="h-5 w-5 text-white" />
                )}
              </Button>
              <Button
                onClick={handleCancel}
                className="bg-red-500/80 hover:bg-red-600 p-2 rounded-full"
              >
                <X className="h-5 w-5 text-white" />
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Chat Section */}
        <div className="flex-1 flex flex-col h-screen">
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
          >
            <AnimatePresence>
              {chatHistory.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-8"
                >
                  <p className="text-white/60 text-lg">
                    Ask anything about the image...
                  </p>
                </motion.div>
              ) : (
                chatHistory.map((msg, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`flex items-start gap-2 max-w-[85%] md:max-w-[70%] ${
                      msg.role === "user" ? "flex-row-reverse" : "flex-row"
                    }`}>
                      <div className={`p-2 rounded-full ${
                        msg.role === "user" ? "bg-blue-500" : "bg-purple-500"
                      }`}>
                        {msg.role === "user" ? (
                          <User className="h-4 w-4 text-white" />
                        ) : (
                          <Bot className="h-4 w-4 text-white" />
                        )}
                      </div>
                      <div className={`p-3 rounded-2xl ${
                        msg.role === "user"
                          ? "bg-blue-500 text-white"
                          : "bg-white/10 text-white"
                      }`}>
                        <div className="prose prose-invert max-w-none">
                          <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap">
                            {msg.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>

          {/* Input Section */}
          <div className="p-4 bg-black/20 border-t border-white/10">
            <div className="flex gap-2 max-w-4xl mx-auto">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask about the image..."
                className="flex-1 px-4 py-2 rounded-xl bg-white/10 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
                disabled={isSending}
              />
              <Button
                onClick={handleSendMessage}
                disabled={isSending || !inputMessage.trim()}
                className={`px-4 py-2 rounded-xl flex items-center gap-2 ${
                  isSending || !inputMessage.trim()
                    ? "bg-white/10 text-white/40"
                    : "bg-blue-500 hover:bg-blue-600 text-white"
                }`}
              >
                {isSending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <SendHorizontal className="h-5 w-5" />
                )}
                <span className="hidden md:inline">
                  {isSending ? "Sending..." : "Send"}
                </span>
              </Button>
            </div>
          </div>
        </div>
      </>
    )}
  </div>
);
}