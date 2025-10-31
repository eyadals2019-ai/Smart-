
import React, { useState, useRef } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { decode, decodeAudioData } from '../utils/audio';
import Spinner from '../components/Spinner';
import { SpeechIcon } from '../components/Icons';

const TextToSpeech: React.FC = () => {
  const [text, setText] = useState('Hello! I am Gemini. What would you like me to say?');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  
  const getAudioContext = () => {
    if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    return audioContextRef.current;
  };

  const handleSpeak = async () => {
    if (!text.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-tts',
        contents: [{ parts: [{ text: `Say: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

      if (base64Audio) {
        const audioContext = getAudioContext();
        const audioBuffer = await decodeAudioData(
          decode(base64Audio),
          audioContext,
          24000,
          1
        );
        
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        source.start();

      } else {
        setError('Could not generate audio. Please try again.');
      }
    } catch (err) {
      console.error('TTS error:', err);
      setError('An error occurred while generating audio.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-xl overflow-hidden border border-gray-700">
      <header className="bg-gray-800 p-4 border-b border-gray-700">
        <h2 className="text-xl font-semibold text-white">Text to Speech</h2>
      </header>
      <div className="flex-1 p-6 flex flex-col items-center justify-center">
        <div className="w-full max-w-2xl">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter text to convert to speech..."
            className="w-full h-48 bg-gray-700 border border-gray-600 rounded-lg p-4 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            disabled={loading}
          />
          <button
            onClick={handleSpeak}
            disabled={loading || !text.trim()}
            className="mt-4 w-full px-6 py-4 rounded-lg bg-blue-600 text-white font-semibold disabled:bg-gray-500 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <Spinner /> : <SpeechIcon />}
            {loading ? 'Generating Audio...' : 'Speak'}
          </button>
          {error && <p className="text-red-400 text-center mt-4">{error}</p>}
        </div>
      </div>
    </div>
  );
};

export default TextToSpeech;
