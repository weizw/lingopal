import React, { useState } from 'react';
import { Volume2, RotateCw, CheckCircle2, Star } from 'lucide-react';
import { VocabularyCard } from '../types';
import { playTextToSpeech } from '../services/geminiService';

interface WordCardProps {
  card: VocabularyCard;
  onMaster?: (id: string) => void;
}

export const WordCard: React.FC<WordCardProps> = ({ card, onMaster }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleAudio = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlaying) return;
    setIsPlaying(true);
    await playTextToSpeech(card.word);
    setIsPlaying(false);
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <div 
      className="group perspective-1000 w-full h-64 cursor-pointer"
      onClick={handleFlip}
    >
      <div className={`relative w-full h-full text-center transition-transform duration-500 transform-style-3d shadow-lg rounded-2xl ${isFlipped ? 'rotate-y-180' : ''}`}>
        
        {/* Front */}
        <div className="absolute w-full h-full backface-hidden bg-white rounded-2xl p-6 flex flex-col items-center justify-center border-2 border-slate-100 group-hover:border-brand-200">
          <div className="absolute top-4 right-4">
             <Star className="w-5 h-5 text-yellow-400 fill-current opacity-20" />
          </div>
          
          <h3 className="text-3xl font-bold text-slate-800 mb-2">{card.word}</h3>
          <span className="text-slate-400 font-mono text-lg mb-6">/{card.phonetic}/</span>
          
          <button 
            onClick={handleAudio}
            className={`p-3 rounded-full bg-brand-50 text-brand-600 hover:bg-brand-100 transition-colors ${isPlaying ? 'animate-pulse' : ''}`}
          >
            <Volume2 className="w-6 h-6" />
          </button>
          
          <p className="mt-6 text-sm text-slate-400 flex items-center gap-1">
            <RotateCw className="w-3 h-3" /> 点击查看释义
          </p>
        </div>

        {/* Back */}
        <div className="absolute w-full h-full backface-hidden rotate-y-180 bg-brand-600 text-white rounded-2xl p-6 flex flex-col justify-between items-center shadow-xl">
          <div className="flex-1 flex flex-col justify-center items-center w-full overflow-hidden">
            <p className="text-xl font-medium mb-4">{card.meaning}</p>
            <div className="bg-white/10 p-3 rounded-lg w-full">
              <p className="text-sm italic opacity-90 leading-relaxed">"{card.exampleSentence}"</p>
            </div>
          </div>
          
          <div className="w-full flex gap-2 mt-4">
            <button 
               onClick={(e) => {
                 e.stopPropagation();
                 onMaster && onMaster(card.id);
               }}
               className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                 card.mastered 
                 ? 'bg-green-500 text-white' 
                 : 'bg-white text-brand-700 hover:bg-brand-50'
               }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              {card.mastered ? '已掌握' : '记住了'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};