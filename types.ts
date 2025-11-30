export enum Sender {
  User = 'user',
  Bot = 'bot',
  System = 'system'
}

export interface Message {
  id: string;
  text: string;
  sender: Sender;
  timestamp: number;
  isAudioPlaying?: boolean;
}

export interface VocabularyCard {
  id: string;
  word: string;
  phonetic: string;
  meaning: string;
  exampleSentence: string;
  context?: string; // Where it came from in the chat
  mastered: boolean;
}

export enum AppMode {
  Onboarding = 'onboarding',
  Chat = 'chat',
  Review = 'review'
}

export interface UserInterests {
  topics: string[];
  level: 'Beginner' | 'Intermediate' | 'Advanced';
}