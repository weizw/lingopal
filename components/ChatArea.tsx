import React, { useRef, useEffect } from 'react';
import { Send, Sparkles, Bot, User } from 'lucide-react';
import { Message, Sender } from '../types';
import { playTextToSpeech } from '../services/geminiService';

interface ChatAreaProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  isLoading: boolean;
}

export const ChatArea: React.FC<ChatAreaProps> = ({ messages, onSendMessage, isLoading }) => {
  const [inputText, setInputText] = React.useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [audioPlayingId, setAudioPlayingId] = React.useState<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    onSendMessage(inputText);
    setInputText('');
  };

  const handleAudio = async (text: string, id: string) => {
    if (audioPlayingId) return;
    setAudioPlayingId(id);
    await playTextToSpeech(text);
    setAudioPlayingId(null);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-60">
            <Bot className="w-16 h-16 mb-2" />
            <p>开始聊天，练习英语吧！</p>
          </div>
        )}
        
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex w-full ${msg.sender === Sender.User ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex max-w-[85%] md:max-w-[70%] gap-3 ${msg.sender === Sender.User ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.sender === Sender.User ? 'bg-indigo-100' : 'bg-brand-100'
              }`}>
                {msg.sender === Sender.User ? <User className="w-5 h-5 text-indigo-600" /> : <Bot className="w-5 h-5 text-brand-600" />}
              </div>
              
              <div 
                className={`p-4 rounded-2xl shadow-sm text-sm md:text-base leading-relaxed cursor-pointer group hover:shadow-md transition-shadow ${
                  msg.sender === Sender.User 
                    ? 'bg-white text-slate-800 rounded-tr-none border border-slate-100' 
                    : 'bg-white text-slate-800 rounded-tl-none border-l-4 border-l-brand-400 border-y border-r border-slate-100'
                }`}
                onClick={() => msg.sender === Sender.Bot && handleAudio(msg.text, msg.id)}
              >
                <div className="whitespace-pre-wrap">{msg.text}</div>
                {msg.sender === Sender.Bot && (
                  <div className={`mt-2 flex items-center gap-1 text-xs font-semibold ${audioPlayingId === msg.id ? 'text-brand-600' : 'text-slate-300 group-hover:text-brand-400'}`}>
                     <Sparkles className="w-3 h-3" /> 
                     {audioPlayingId === msg.id ? '播放中...' : '点击收听'}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
           <div className="flex justify-start w-full">
             <div className="flex gap-3 max-w-[70%]">
               <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center">
                 <Bot className="w-5 h-5 text-brand-600" />
               </div>
               <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-slate-100 flex items-center gap-2">
                 <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce"></div>
                 <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce delay-75"></div>
                 <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce delay-150"></div>
               </div>
             </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-slate-100">
        <form onSubmit={handleSubmit} className="flex gap-2 max-w-4xl mx-auto">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="输入消息... (例如: Tell me a funny story about cats)"
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all placeholder-slate-400"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !inputText.trim()}
            className="bg-brand-600 text-white p-3 rounded-xl hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};