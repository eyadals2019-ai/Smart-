
import React, { useState, useMemo } from 'react';

import { ChatBotIcon, ImageIcon, ImageEditIcon, MicIcon, SpeechIcon, ZapIcon } from './components/Icons';
import ChatBot from './features/ChatBot';
import ImageGenerator from './features/ImageGenerator';
import ImageEditor from './features/ImageEditor';
import TextToSpeech from './features/TextToSpeech';
import QuickResponse from './features/QuickResponse';
import LiveConversation from './features/LiveConversation';

type Feature = 'chat' | 'live' | 'imageGen' | 'imageEdit' | 'tts' | 'quick';

const App: React.FC = () => {
  const [activeFeature, setActiveFeature] = useState<Feature>('chat');

  const features = useMemo(() => [
    { id: 'chat' as Feature, name: 'Chat Bot', icon: <ChatBotIcon /> },
    { id: 'live' as Feature, name: 'Live Conversation', icon: <MicIcon /> },
    { id: 'imageGen' as Feature, name: 'Image Generation', icon: <ImageIcon /> },
    { id: 'imageEdit' as Feature, name: 'Image Editing', icon: <ImageEditIcon /> },
    { id: 'tts' as Feature, name: 'Text to Speech', icon: <SpeechIcon /> },
    { id: 'quick' as Feature, name: 'Quick Response', icon: <ZapIcon /> },
  ], []);

  const renderFeature = () => {
    switch (activeFeature) {
      case 'chat':
        return <ChatBot />;
      case 'live':
        return <LiveConversation />;
      case 'imageGen':
        return <ImageGenerator />;
      case 'imageEdit':
        return <ImageEditor />;
      case 'tts':
        return <TextToSpeech />;
      case 'quick':
        return <QuickResponse />;
      default:
        return <ChatBot />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100 font-sans">
      <aside className="w-16 md:w-64 bg-gray-950 p-2 md:p-4 flex flex-col space-y-2 border-r border-gray-800 transition-all duration-300">
        <h1 className="text-xl md:text-2xl font-bold text-white mb-4 hidden md:block">
          Smart App
        </h1>
        <div className="w-full h-px bg-gray-700 mb-4 hidden md:block"></div>
        <nav className="flex-grow">
          {features.map((feature) => (
            <button
              key={feature.id}
              onClick={() => setActiveFeature(feature.id)}
              className={`w-full flex items-center p-3 my-1 rounded-lg transition-colors duration-200 ${
                activeFeature === feature.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <div className="w-6 h-6">{feature.icon}</div>
              <span className="ml-4 hidden md:inline">{feature.name}</span>
            </button>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        {renderFeature()}
      </main>
    </div>
  );
};

export default App;