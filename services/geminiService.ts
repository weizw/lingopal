import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Message, Sender, VocabularyCard } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// --- Chat Service ---

const SYSTEM_INSTRUCTION = `
You are "LingoPal", a friendly, witty, and encouraging English learning companion for a Chinese user.
Your goal is to help the user love English by having interesting conversations.

Rules:
1. **Always speak in English** to the user to maintain an immersive environment, unless they specifically ask for a Chinese explanation.
2. Do NOT act like a strict teacher. Be a friend.
3. Use emojis to set a fun tone.
4. If the user makes a grammar mistake or uses "Chinglish", gently correct them by rephrasing their sentence naturally in your reply (e.g., "Oh, you mean...?"), then continue the conversation.
5. Adjust your vocabulary complexity based on the user's level.
6. Keep responses concise (under 100 words).
`;

export const sendMessageToGemini = async (
  history: Message[], 
  userMessage: string,
  userInterests: string[]
): Promise<string> => {
  try {
    const model = "gemini-2.5-flash";
    
    // Construct a context-aware prompt
    const contextPrompt = `
      User Interests: ${userInterests.join(', ')}.
      Current Message: ${userMessage}
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: [
        ...history.filter(m => m.sender !== Sender.System).map(m => ({
          role: m.sender === Sender.User ? 'user' : 'model',
          parts: [{ text: m.text }]
        })),
        { role: 'user', parts: [{ text: contextPrompt }] }
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.8, // Creative and fun
      }
    });

    return response.text || "哎呀，我好像走神了，能再说一遍吗？";
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return "抱歉，网络连接好像有点问题，请稍后再试。";
  }
};

// --- Vocabulary Extraction Service ---

export const extractVocabularyFromChat = async (chatText: string): Promise<VocabularyCard[]> => {
  try {
    const model = "gemini-2.5-flash";
    // Modified prompt to request Chinese definitions for Chinese learners
    const prompt = `Analyze the following English conversation text and extract 3-5 useful, interesting, or challenging English words/phrases that appear in it. 
    Return them as a JSON list.
    
    IMPORTANT: The 'meaning' field MUST be the concise Chinese translation (中文释义) of the word in this context.
    
    Context text: "${chatText}"`;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              word: { type: Type.STRING },
              phonetic: { type: Type.STRING, description: "IPA notation" },
              meaning: { type: Type.STRING, description: "Concise Chinese definition" },
              exampleSentence: { type: Type.STRING, description: "A short English example sentence containing the word" },
            },
            required: ["word", "phonetic", "meaning", "exampleSentence"]
          }
        }
      }
    });

    const rawData = JSON.parse(response.text || "[]");
    
    // Map to our internal type with IDs
    return rawData.map((item: any) => ({
      id: crypto.randomUUID(),
      word: item.word,
      phonetic: item.phonetic,
      meaning: item.meaning,
      exampleSentence: item.exampleSentence,
      context: "Extracted from chat",
      mastered: false
    }));

  } catch (error) {
    console.error("Vocab Extraction Error:", error);
    return [];
  }
};

// --- TTS Service ---

// Helper to decode raw PCM
const decodeAudioData = async (
  base64Data: string,
  ctx: AudioContext
): Promise<AudioBuffer> => {
  const binaryString = atob(base64Data);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // 16-bit PCM, 24kHz sample rate (default for Gemini TTS)
  const dataInt16 = new Int16Array(bytes.buffer);
  const numChannels = 1;
  const sampleRate = 24000;
  
  const buffer = ctx.createBuffer(numChannels, dataInt16.length, sampleRate);
  const channelData = buffer.getChannelData(0);
  
  for (let i = 0; i < dataInt16.length; i++) {
    // Normalize 16-bit integer to float [-1.0, 1.0]
    channelData[i] = dataInt16[i] / 32768.0;
  }
  
  return buffer;
};

export const playTextToSpeech = async (text: string): Promise<void> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }, // Friendly female voice
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio data returned");

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
    const audioBuffer = await decodeAudioData(base64Audio, audioContext);
    
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.start();

    // Return a promise that resolves when audio finishes
    return new Promise((resolve) => {
      source.onended = () => {
        resolve();
        audioContext.close();
      };
    });

  } catch (error) {
    console.error("TTS Error:", error);
  }
};