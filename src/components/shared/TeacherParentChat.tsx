'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { useState } from 'react';
import LiquidButton from '@/components/ui/LiquidButton';

interface Message {
  id: string;
  sender: 'teacher' | 'parent';
  senderName: string;
  message: string;
  timestamp: string;
  read: boolean;
}

interface TeacherParentChatProps {
  teacherName: string;
  parentName: string;
  studentName: string;
  messages: Message[];
  onSendMessage?: (message: string) => void;
  onClose?: () => void;
  className?: string;
}

export default function TeacherParentChat({
  teacherName,
  parentName,
  studentName,
  messages,
  onSendMessage,
  onClose,
  className = '',
}: TeacherParentChatProps) {
  const [newMessage, setNewMessage] = useState('');

  const handleSend = () => {
    if (newMessage.trim() && onSendMessage) {
      onSendMessage(newMessage);
      setNewMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-3xl ${className}`}
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src="/images/optimized/communication/teacher-parent-chat.webp"
          alt="Teacher Parent Communication"
          fill
          className="object-cover"
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/90 via-blue-900/85 to-indigo-900/90" />
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-white/30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -60, 0],
              x: [0, Math.random() * 40 - 20, 0],
              opacity: [0.2, 0.7, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 6 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 3,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col h-[600px]">
        {/* Header */}
        <div className="backdrop-blur-xl bg-white/10 border-b border-white/20 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-bold text-lg">
                💬
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  {teacherName} & {parentName}
                </h3>
                <p className="text-sm text-cyan-100">About {studentName}</p>
              </div>
            </div>
            
            {onClose && (
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full backdrop-blur-xl bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white transition-colors"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, index) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, x: msg.sender === 'teacher' ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex ${msg.sender === 'parent' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] ${
                  msg.sender === 'parent'
                    ? 'backdrop-blur-xl bg-cyan-500/80 text-white'
                    : 'backdrop-blur-xl bg-white/20 text-white border border-white/20'
                } rounded-2xl p-4`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold">
                    {msg.senderName}
                  </span>
                  {!msg.read && msg.sender === 'teacher' && (
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  )}
                </div>
                <p className="text-sm leading-relaxed">{msg.message}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs opacity-70">{msg.timestamp}</span>
                  {msg.sender === 'parent' && (
                    <span className="text-xs">
                      {msg.read ? '✓✓' : '✓'}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}

          {/* Typing Indicator (example) */}
          {false && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="backdrop-blur-xl bg-white/20 rounded-2xl p-4 border border-white/20">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 rounded-full bg-white"
                      animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.5, 1, 0.5],
                      }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        delay: i * 0.2,
                      }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Input Area */}
        <div className="backdrop-blur-xl bg-white/10 border-t border-white/20 p-4">
          <div className="flex gap-3">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              rows={2}
              className="flex-1 backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400 resize-none"
            />
            <div className="flex flex-col gap-2">
              <button
                className="w-10 h-10 rounded-full backdrop-blur-xl bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white transition-colors"
                title="Attach file"
              >
                📎
              </button>
              <LiquidButton
                variant="primary"
                size="small"
                onClick={handleSend}
                disabled={!newMessage.trim()}
                className="w-10 h-10 rounded-full bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                ➤
              </LiquidButton>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 mt-3">
            <button className="text-xs backdrop-blur-xl bg-white/10 hover:bg-white/20 border border-white/20 rounded-full px-3 py-1 text-white transition-colors">
              📅 Schedule Meeting
            </button>
            <button className="text-xs backdrop-blur-xl bg-white/10 hover:bg-white/20 border border-white/20 rounded-full px-3 py-1 text-white transition-colors">
              📊 Share Progress
            </button>
            <button className="text-xs backdrop-blur-xl bg-white/10 hover:bg-white/20 border border-white/20 rounded-full px-3 py-1 text-white transition-colors">
              📝 Send Feedback
            </button>
          </div>
        </div>
      </div>

      {/* Decorative Gradient Orbs */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-cyan-400 rounded-full blur-3xl opacity-20" />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-400 rounded-full blur-3xl opacity-20" />
    </motion.div>
  );
}
