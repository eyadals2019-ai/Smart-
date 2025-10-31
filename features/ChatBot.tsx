import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Chat, Part } from '@google/genai';
import { ChatMessage } from '../types';
import { SendIcon, ChatBotIcon, LiveStatusIcon, MicrophoneIcon, AttachmentIcon, ExpertTeacherIcon } from '../components/Icons';
import Spinner from '../components/Spinner';
import { fileToBase64 } from '../utils/file';

const ChatBot: React.FC = () => {
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [chat, setChat] = useState<Chat | null>(null);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const chatInstance = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
          systemInstruction: 'You are a helpful and friendly assistant.'
        }
      });
      setChat(chatInstance);
    } catch (error) {
        console.error("Failed to initialize Gemini:", error);
    }
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [history]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedFile(file);
    }
  };

  const handleSendMessage = async () => {
    if ((!input.trim() && !attachedFile) || !chat || loading) return;

    const userMessageForHistory: ChatMessage = { role: 'user', text: input };
    const apiMessageParts: Part[] = [];

    if (input.trim()) {
      apiMessageParts.push({ text: input });
    }

    if (attachedFile) {
      const base64Data = await fileToBase64(attachedFile);
      apiMessageParts.push({
        inlineData: {
          data: base64Data,
          mimeType: attachedFile.type,
        },
      });
      userMessageForHistory.attachment = {
        url: URL.createObjectURL(attachedFile),
        name: attachedFile.name,
      };
    }

    setHistory((prev) => [...prev, userMessageForHistory]);
    setInput('');
    setAttachedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setLoading(true);

    try {
      const result = await chat.sendMessageStream({ message: apiMessageParts });
      let text = '';
      setHistory((prev) => [...prev, { role: 'model', text: '' }]);
      
      for await (const chunk of result) {
        text += chunk.text;
        setHistory(prev => {
            const newHistory = [...prev];
            newHistory[newHistory.length - 1].text = text;
            return newHistory;
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setHistory((prev) => [
        ...prev,
        { role: 'model', text: 'Sorry, I encountered an error. Please try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleExpertTeacherClick = async () => {
    if (!chat || loading) return;
    
    const expertPrompt = 'اشرح الدرس كمعلم خبير باستخدام أحدث الاستراتيجيات وعلى سبورة تفاعلية مع أفضل المزايا العالمية والتفاعلية';
    
    const userMessage: ChatMessage = { role: 'user', text: expertPrompt };
    setHistory(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      const result = await chat.sendMessageStream({ message: [{ text: expertPrompt }] });
      let text = '';
      setHistory(prev => [...prev, { role: 'model', text: '' }]);
      
      for await (const chunk of result) {
        text += chunk.text;
        setHistory(prev => {
            const newHistory = [...prev];
            newHistory[newHistory.length - 1].text = text;
            return newHistory;
        });
      }
    } catch (error) {
      console.error('Error sending expert teacher message:', error);
      setHistory(prev => [...prev, { role: 'model', text: 'Sorry, I encountered an error.' }]);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-xl overflow-hidden border border-gray-700">
      <header className="bg-gray-800 p-4 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold text-white">Chat Bot</h2>
          <LiveStatusIcon />
        </div>
      </header>
      <div ref={chatContainerRef} className="flex-1 p-6 overflow-y-auto space-y-4">
        {history.map((msg, index) => (
          <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'model' && (
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                <ChatBotIcon />
              </div>
            )}
            <div className={`p-3 rounded-lg max-w-lg ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-gray-700 text-gray-200 rounded-bl-none'
              }`}
            >
              {msg.attachment && (
                <div className="mb-2">
                  <img src={msg.attachment.url} alt={msg.attachment.name} className="rounded-lg max-w-full" />
                </div>
              )}
              {msg.text ? <p className="whitespace-pre-wrap">{msg.text}</p> : null}
            </div>
          </div>
        ))}
      </div>
      <div className="p-4 bg-gray-800 border-t border-gray-700">
        {attachedFile && (
            <div className="px-2 pb-2">
                <div className="bg-gray-600 inline-flex items-center text-sm rounded-full px-3 py-1 gap-2">
                    <span className="max-w-xs truncate">{attachedFile.name}</span>
                    <button
                        onClick={() => {
                            setAttachedFile(null);
                            if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="text-gray-400 hover:text-white text-lg leading-none"
                        aria-label="Remove attachment"
                    >
                        &times;
                    </button>
                </div>
            </div>
        )}
        <div className="flex items-center bg-gray-700 rounded-lg p-2">
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-400 hover:text-white transition-colors"
            aria-label="Attach files"
            disabled={loading || !chat}
          >
            <AttachmentIcon className="w-5 h-5" />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ask your Teacher Ai"
            className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder-gray-400"
            disabled={loading || !chat}
          />
          <button
            onClick={handleExpertTeacherClick}
            className="p-2 text-gray-400 hover:text-white transition-colors"
            aria-label="Expert teacher explanation"
            disabled={loading || !chat}
          >
            <ExpertTeacherIcon className="w-5 h-5" />
          </button>
          <button
            className="p-2 text-gray-400 hover:text-white transition-colors"
            aria-label="Use microphone"
            disabled={loading || !chat}
          >
            <MicrophoneIcon className="w-5 h-5" />
          </button>
          <button
            onClick={handleSendMessage}
            disabled={loading || !chat || (!input.trim() && !attachedFile)}
            className="p-2 rounded-full bg-blue-600 text-white disabled:bg-gray-500 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
            aria-label="Send message"
          >
            {loading ? <Spinner className="w-5 h-5"/> : <SendIcon />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;