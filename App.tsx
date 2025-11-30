import React, { useState, useEffect } from 'react';
import { BrainCircuit, Library, Menu, X, Wand2 } from 'lucide-react';
import { TopicSelector } from './components/TopicSelector';
import { ChatArea } from './components/ChatArea';
import { WordCard } from './components/WordCard';
import { Message, Sender, VocabularyCard, AppMode, UserInterests } from './types';
import { sendMessageToGemini, extractVocabularyFromChat } from './services/geminiService';

const App = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.Onboarding);
  const [userInterests, setUserInterests] = useState<UserInterests | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [vocabDeck, setVocabDeck] = useState<VocabularyCard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);

  // Handle Onboarding Completion
  const handleOnboardingComplete = (topics: string[], level: string) => {
    const interests = { topics, level: level as any };
    setUserInterests(interests);
    setMode(AppMode.Chat);
    
    // Add initial greeting
    const initialMsg: Message = {
      id: 'init-1',
      text: `Hi there! 👋 I'm LingoPal. I see you are interested in ${topics.map(t => {
         // Simple map back to English for the sentence, or just use generic
         return t;
      }).join(', ')}. \n\nLet's chat! What's on your mind today?`,
      sender: Sender.Bot,
      timestamp: Date.now()
    };
    setMessages([initialMsg]);
  };

  // Handle Sending Messages
  const handleSendMessage = async (text: string) => {
    if (!userInterests) return;

    // Add User Message
    const userMsg: Message = {
      id: crypto.randomUUID(),
      text,
      sender: Sender.User,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    // Get Bot Response
    const responseText = await sendMessageToGemini(messages.slice(-5), text, userInterests.topics);
    
    const botMsg: Message = {
      id: crypto.randomUUID(),
      text: responseText,
      sender: Sender.Bot,
      timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, botMsg]);
    setIsLoading(false);
  };

  // Handle Vocabulary Extraction ("Magic Button")
  const handleMagicExtract = async () => {
    if (messages.length < 2) return;
    setIsExtracting(true);
    
    // Analyze the last few bot messages
    const recentBotText = messages
      .filter(m => m.sender === Sender.Bot)
      .slice(-3)
      .map(m => m.text)
      .join(" ");

    const newCards = await extractVocabularyFromChat(recentBotText);
    
    // Avoid duplicates based on word
    const existingWords = new Set(vocabDeck.map(c => c.word.toLowerCase()));
    const uniqueNewCards = newCards.filter(c => !existingWords.has(c.word.toLowerCase()));

    if (uniqueNewCards.length > 0) {
      setVocabDeck(prev => [...uniqueNewCards, ...prev]);
      if (!isSidebarOpen) setIsSidebarOpen(true);
    }
    
    setIsExtracting(false);
  };

  const toggleCardMastery = (id: string) => {
    setVocabDeck(prev => prev.map(card => 
      card.id === id ? { ...card, mastered: !card.mastered } : card
    ));
  };

  if (mode === AppMode.Onboarding) {
    return <TopicSelector onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="flex h-screen w-full bg-slate-100 overflow-hidden relative">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content (Chat) */}
      <div className="flex-1 flex flex-col h-full relative z-10 transition-all duration-300">
        
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 shadow-sm z-30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <h1 className="font-bold text-slate-800 hidden sm:block">LingoPal 英语语伴</h1>
          </div>
          
          <div className="flex items-center gap-3">
             {/* Magic Wand Button */}
             <button
              onClick={handleMagicExtract}
              disabled={isExtracting || messages.length < 2}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                isExtracting 
                  ? 'bg-purple-100 text-purple-700' 
                  : 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:shadow-lg active:scale-95'
              }`}
            >
              <Wand2 className={`w-4 h-4 ${isExtracting ? 'animate-spin' : ''}`} />
              {isExtracting ? '提取中...' : '一键提取单词'}
            </button>

            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg relative"
            >
              {vocabDeck.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-ping" />
              )}
              {isSidebarOpen ? <X className="w-6 h-6" /> : <Library className="w-6 h-6" />}
            </button>
          </div>
        </header>

        {/* Chat Body */}
        <main className="flex-1 overflow-hidden relative">
          <ChatArea 
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
          />
        </main>
      </div>

      {/* Vocabulary Sidebar (Drawer) */}
      <aside 
        className={`
          fixed md:relative inset-y-0 right-0 z-30
          w-80 lg:w-96 bg-slate-50 border-l border-slate-200 shadow-xl md:shadow-none
          transform transition-transform duration-300 ease-in-out flex flex-col
          ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0 md:hidden'} 
        `}
      >
        <div className="p-4 border-b border-slate-200 bg-white flex justify-between items-center">
          <div>
            <h2 className="font-bold text-slate-800">生词本</h2>
            <p className="text-xs text-slate-500">已掌握 {vocabDeck.filter(c => c.mastered).length} / {vocabDeck.length} 个单词</p>
          </div>
          <button 
             onClick={() => setIsSidebarOpen(false)}
             className="md:hidden p-1 text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {vocabDeck.length === 0 ? (
            <div className="text-center mt-20 p-6">
              <div className="bg-slate-200 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Library className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-600 font-medium">还没有单词哦</p>
              <p className="text-sm text-slate-400 mt-2">和 LingoPal 聊几句，然后点击“一键提取单词”来积累词汇量吧。</p>
            </div>
          ) : (
            vocabDeck.map(card => (
              <WordCard 
                key={card.id} 
                card={card} 
                onMaster={toggleCardMastery}
              />
            ))
          )}
        </div>
      </aside>
    </div>
  );
};

export default App;