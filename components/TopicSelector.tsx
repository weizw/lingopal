import React, { useState } from 'react';
import { Sparkles, Music, Film, Code, Globe, Coffee, BookOpen, Briefcase } from 'lucide-react';

interface TopicSelectorProps {
  onComplete: (topics: string[], level: string) => void;
}

const TOPICS = [
  { id: 'movies', label: '看美剧/电影', icon: Film },
  { id: 'music', label: '欧美音乐', icon: Music },
  { id: 'travel', label: '出国旅游', icon: Globe },
  { id: 'tech', label: '科技数码', icon: Code },
  { id: 'daily', label: '日常生活', icon: Coffee },
  { id: 'career', label: '职场英语', icon: Briefcase },
];

export const TopicSelector: React.FC<TopicSelectorProps> = ({ onComplete }) => {
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [level, setLevel] = useState<string>('Intermediate');

  const toggleTopic = (id: string) => {
    setSelectedTopics(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const getLevelLabel = (l: string) => {
    switch(l) {
      case 'Beginner': return '初级 (能说简单的句子)';
      case 'Intermediate': return '中级 (能进行日常交流)';
      case 'Advanced': return '高级 (追求地道表达)';
      default: return l;
    }
  };

  return (
    <div className="min-h-full flex items-center justify-center p-4 bg-gradient-to-br from-brand-50 to-brand-100">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 transform transition-all">
        <div className="text-center mb-8">
          <div className="bg-brand-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-brand-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">欢迎来到 LingoPal</h1>
          <p className="text-slate-500">定制你的专属英语语伴，让开口不再困难。</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">我对这些话题感兴趣...</label>
            <div className="grid grid-cols-2 gap-3">
              {TOPICS.map((topic) => {
                const Icon = topic.icon;
                const isSelected = selectedTopics.includes(topic.id);
                return (
                  <button
                    key={topic.id}
                    onClick={() => toggleTopic(topic.id)}
                    className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                      isSelected 
                        ? 'border-brand-500 bg-brand-50 text-brand-700' 
                        : 'border-slate-100 bg-white text-slate-600 hover:border-brand-200'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isSelected ? 'text-brand-500' : 'text-slate-400'}`} />
                    <span className="text-sm font-medium">{topic.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">我的英语水平是...</label>
            <div className="flex flex-col gap-2">
              {['Beginner', 'Intermediate', 'Advanced'].map((l) => (
                <button
                  key={l}
                  onClick={() => setLevel(l)}
                  className={`w-full py-3 px-4 text-left text-sm font-medium rounded-xl transition-all border-2 ${
                    level === l 
                      ? 'border-brand-500 bg-brand-50 text-brand-700' 
                      : 'border-transparent bg-slate-50 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {getLevelLabel(l)}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => onComplete(selectedTopics, level)}
            disabled={selectedTopics.length === 0}
            className="w-full bg-brand-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
          >
            开始对话
          </button>
        </div>
      </div>
    </div>
  );
};