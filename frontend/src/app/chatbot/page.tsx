"use client";

import { useState, useRef, useEffect } from "react";
import { Send, ArrowLeft, Youtube } from "lucide-react";
import Link from "next/link";

interface Message {
  id: number;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}

interface VideoRecommendation {
  title: string;
  video_id: string;
  thumbnail: string;
  url: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hello! I'm here to support your mental wellness journey. How are you feeling today?",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [videoRecommendations, setVideoRecommendations] = useState<
    VideoRecommendation[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Prevent body scrolling when component mounts
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    // Store the message before clearing
    const messageText = inputMessage.trim();

    const userMessage: Message = {
      id: Date.now(),
      text: messageText,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages([...messages, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      // Call backend API
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: messageText,
          session_id: sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response from server");
      }

      const data = await response.json();
      console.log("Backend response:", data);

      // Update session ID if new
      if (data.session_id && !sessionId) {
        setSessionId(data.session_id);
      }

      // Update video recommendations
      if (data.video_recommendations && data.video_recommendations.length > 0) {
        setVideoRecommendations(data.video_recommendations);
      }

      // Add bot response
      if (data.response) {
        const botResponse: Message = {
          id: Date.now(), // Use timestamp for unique ID
          text: data.response,
          sender: "bot",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botResponse]);
      } else {
        console.error("No response text in data:", data);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      // Fallback response
      const errorResponse: Message = {
        id: Date.now(),
        text: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.",
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 w-full h-screen overflow-hidden">
      {/* Back Button */}
      <div className="absolute top-6 left-6 z-20">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[#3A4F3A] hover:text-[#2A3F2A] transition-colors duration-200 group bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-200" />
          <span className="font-light">Back to Home</span>
        </Link>
      </div>

      {/* Messages Container - Only scrolls when content overflows */}
      <div className="absolute inset-0 pt-20 pb-32 overflow-y-auto lg:pl-64 lg:pr-[19rem] px-6">
        <div className="max-w-3xl space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[70%] rounded-2xl px-5 py-4 shadow-md ${
                  message.sender === "user"
                    ? "bg-[#b8d4c6] text-[#2A3F2A]"
                    : "bg-white/70 backdrop-blur-sm text-[#3A4F3A]"
                }`}
              >
                <p className="text-sm leading-relaxed">{message.text}</p>
                <span className="text-xs opacity-70 mt-1 block">
                  {message.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area - Fixed at bottom with high z-index */}
      <form
        onSubmit={handleSendMessage}
        className="fixed bottom-6 lg:left-64 left-6 lg:right-[19rem] right-6 z-30"
      >
        <div className="flex gap-3 items-center max-w-3xl">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type your message here..."
            className="flex-1 px-6 py-4 rounded-full bg-white border border-[#b8d4c6]/30 focus:outline-none focus:border-[#b8d4c6] text-[#3A4F3A] placeholder:text-[#6B8E6B]/60 font-light shadow-md transition-all duration-200"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="w-14 h-14 bg-[#b8d4c6] hover:bg-[#a8c4b6] text-[#2A3F2A] rounded-full transition-all duration-200 flex items-center justify-center shadow-md hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-[#2A3F2A] border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </form>

      {/* Fixed Recommendations Section - Right side */}
      {videoRecommendations.length > 0 && (
        <div className="hidden lg:flex fixed right-8 top-13 w-72 flex-col gap-4 z-10">
          {videoRecommendations.map((video) => (
            <a
              key={video.video_id}
              href={video.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-white/50 backdrop-blur-md rounded-2xl overflow-hidden shadow-md hover:shadow-xl hover:bg-white/60 transition-all duration-300 group"
            >
              <div className="relative h-32 bg-[#b8d4c6]/60 flex items-center justify-center overflow-hidden">
                {video.thumbnail ? (
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Youtube className="w-12 h-12 text-[#6b7d72] group-hover:scale-110 transition-transform duration-300" />
                )}
              </div>
              <div className="p-4 bg-white/40">
                <h4 className="font-medium text-[#3A4F3A] text-sm mb-1.5 line-clamp-2">
                  {video.title}
                </h4>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
