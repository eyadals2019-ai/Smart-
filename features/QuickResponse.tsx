
import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import Spinner from '../components/Spinner';

const QuickResponse: React.FC = () => {
  const [prompt, setPrompt] = useState('Summarize the concept of quantum computing in one sentence.');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);
    setResponse('');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const result = await ai.models.generateContent({
        model: 'gemini-2.5-flash-lite',
        contents: prompt,
      });
      setResponse(result.text);
    } catch (err) {
      console.error('Quick response error:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-xl overflow-hidden border border-gray-700">
      <header className="bg-gray-800 p-4 border-b border-gray-700">
        <h2 className="text-xl font-semibold text-white">Quick Response (Flash-Lite)</h2>
      </header>
      <div className="flex-1 p-6 flex flex-col">
        <div className="w-full max-w-3xl mx-auto flex flex-col flex-grow">
          <label htmlFor="prompt" className="font-semibold mb-2 text-gray-300">Your Prompt:</label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter a prompt for a quick response..."
            className="w-full h-24 bg-gray-700 border border-gray-600 rounded-lg p-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            disabled={loading}
          />
          <button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className="mt-4 px-6 py-3 self-start rounded-lg bg-blue-600 text-white font-semibold disabled:bg-gray-500 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors flex items-center justify-center"
          >
            {loading ? <Spinner /> : 'Generate'}
          </button>
          <div className="mt-6 flex-grow">
            <label className="font-semibold mb-2 text-gray-300">Gemini's Response:</label>
            <div className="w-full h-full min-h-48 bg-gray-800 rounded-lg p-4 border border-gray-700 text-gray-200 whitespace-pre-wrap">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                    <Spinner className="w-8 h-8"/>
                </div>
              ) : error ? (
                <p className="text-red-400">{error}</p>
              ) : (
                response
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickResponse;
