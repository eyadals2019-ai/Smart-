
import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import Spinner from '../components/Spinner';

const ImageGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);
    setImageUrl(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/png',
          aspectRatio: '1:1',
        },
      });

      if (response.generatedImages && response.generatedImages.length > 0) {
        const base64Image = response.generatedImages[0].image.imageBytes;
        setImageUrl(`data:image/png;base64,${base64Image}`);
      } else {
        setError('No image was generated. Please try a different prompt.');
      }
    } catch (err) {
      console.error('Image generation error:', err);
      setError('An error occurred while generating the image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-xl overflow-hidden border border-gray-700">
      <header className="bg-gray-800 p-4 border-b border-gray-700">
        <h2 className="text-xl font-semibold text-white">Image Generator</h2>
      </header>
      <div className="flex-1 p-6 overflow-y-auto flex flex-col items-center">
        <div className="w-full max-w-2xl">
          <div className="flex items-center gap-2 mb-4">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., A futuristic cat wearing sunglasses"
              className="flex-1 bg-gray-700 border border-gray-600 rounded-lg p-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            />
            <button
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
              className="px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold disabled:bg-gray-500 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors flex items-center justify-center"
            >
              {loading ? <Spinner /> : 'Generate'}
            </button>
          </div>
          {error && <p className="text-red-400 text-center mb-4">{error}</p>}
          <div className="mt-6 w-full aspect-square bg-gray-800 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-600">
            {loading ? (
                <div className="flex flex-col items-center text-gray-400">
                    <Spinner className="w-10 h-10 mb-2"/>
                    <p>Generating your masterpiece...</p>
                </div>
            ) : imageUrl ? (
              <img src={imageUrl} alt={prompt} className="max-w-full max-h-full object-contain rounded-lg" />
            ) : (
              <p className="text-gray-500">Your generated image will appear here</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageGenerator;
