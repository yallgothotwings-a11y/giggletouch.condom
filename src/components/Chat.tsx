import React, { useState, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { Send, MessageSquare, User } from 'lucide-react';
import { motion } from 'motion/react';

type Message = {
  id: string;
  user: string;
  text: string;
  timestamp: number;
  color: string;
};

export default function Chat({ themeColor, socket }: { themeColor: string, socket: Socket | null }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [username, setUsername] = useState(() => localStorage.getItem('chat_username') || '');
  const [isJoined, setIsJoined] = useState(!!localStorage.getItem('chat_username'));
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!socket) return;

    const handleInit = (initialMessages: Message[]) => {
      setMessages(initialMessages);
    };

    const handleNew = (message: Message) => {
      setMessages((prev) => [...prev, message]);
    };

    socket.on('init_messages', handleInit);
    socket.on('new_message', handleNew);

    socket.emit('request_messages');

    return () => {
      socket.off('init_messages', handleInit);
      socket.off('new_message', handleNew);
    };
  }, [socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      localStorage.setItem('chat_username', username.trim());
      setIsJoined(true);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && socket) {
      socket.emit('send_message', {
        user: username,
        text: newMessage.trim(),
        color: themeColor
      });
      setNewMessage('');
    }
  };

  if (!isJoined) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-md mx-auto mt-20"
      >
        <div className="bg-[#141414] border border-[var(--theme-color)]/30 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-[var(--theme-color)]/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 text-center">
            <div className="w-16 h-16 bg-[var(--theme-color)]/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-[var(--theme-color)]/30">
              <User className="w-8 h-8 text-[var(--theme-color)]" />
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-2">Join the Chat</h2>
            <p className="text-gray-400 mb-8">Pick a username to start chatting with others.</p>

            <form onSubmit={handleJoin} className="space-y-4">
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                maxLength={20}
                className="block w-full px-4 py-3 border border-[var(--theme-color)]/30 rounded-xl bg-black/50 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[var(--theme-color)]/50 transition-all duration-200 text-center text-lg"
              />
              <button
                type="submit"
                disabled={!username.trim()}
                className="w-full py-3 px-4 rounded-xl font-medium text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: themeColor }}
              >
                Join Chat
              </button>
            </form>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-4xl mx-auto h-[calc(100vh-12rem)] flex flex-col"
    >
      <div className="bg-[#141414] border border-[var(--theme-color)]/30 rounded-3xl shadow-2xl flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-black/20">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-5 h-5 text-[var(--theme-color)]" />
            <h2 className="text-lg font-semibold text-white">Live Chat</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Logged in as</span>
            <span className="text-sm font-bold" style={{ color: themeColor }}>{username}</span>
            <button 
              onClick={() => {
                localStorage.removeItem('chat_username');
                setIsJoined(false);
              }}
              className="ml-2 text-xs text-gray-500 hover:text-white transition-colors"
            >
              (Change)
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500">
              <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
              <p>No messages yet. Be the first to say hello!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.user === username;
              return (
                <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <span className="text-xs text-gray-500 mb-1 px-1 flex items-center gap-2">
                    <span style={{ color: msg.color }} className="font-bold">{msg.user}</span>
                    <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </span>
                  <div 
                    className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                      isMe 
                        ? 'rounded-tr-sm text-white' 
                        : 'bg-gray-800 rounded-tl-sm text-gray-200'
                    }`}
                    style={isMe ? { backgroundColor: msg.color } : {}}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-black/40 border-t border-gray-800">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-[#1a1a1a] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[var(--theme-color)] transition-colors"
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="p-3 rounded-xl text-white flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
              style={{ backgroundColor: themeColor }}
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </motion.div>
  );
}
