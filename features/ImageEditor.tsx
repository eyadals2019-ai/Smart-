
import React, { useState, useRef } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { fileToBase64 } from '../utils/file';
import Spinner from '../components/Spinner';

const ImageEditor: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [originalImage, setOriginalImage] = useState<{ url: string; file: File } | null>(null);
  const [editedImageUrl, setEditedImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setOriginalImage({ url: URL.createObjectURL(file), file });
      setEditedImageUrl(null);
    }
  };

  const handleEdit = async () => {
    if (!prompt.trim() || !originalImage) return;

    setLoading(true);
    setError(null);
    setEditedImageUrl(null);

    try {
      const base64Data = await fileToBase64(originalImage.file);
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: originalImage.file.type,
              },
            },
            { text: prompt },
          ],
        },
        config: {
          responseModalities: [Modality.IMAGE],
        },
      });

      const part = response.candidates?.[0]?.content?.parts?.[0];
      if (part?.inlineData) {
        setEditedImageUrl(`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`);
      } else {
        setError('Could not edit the image. Try a different prompt or image.');
      }
    } catch (err) {
      console.error('Image editing error:', err);
      setError('An error occurred during image editing. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-xl overflow-hidden border border-gray-700">
      <header className="bg-gray-800 p-4 border-b border-gray-700">
        <h2 className="text-xl font-semibold text-white">Image Editor</h2>
      </header>
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full md:w-auto px-6 py-3 rounded-lg bg-gray-700 text-white font-semibold hover:bg-gray-600 transition-colors"
          >
            {originalImage ? 'Change Image' : 'Upload Image'}
          </button>
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., Add a retro filter"
            className="flex-1 bg-gray-700 border border-gray-600 rounded-lg p-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={loading || !originalImage}
          />
          <button
            onClick={handleEdit}
            disabled={loading || !prompt.trim() || !originalImage}
            className="w-full md:w-auto px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold disabled:bg-gray-500 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors flex items-center justify-center"
          >
            {loading ? <Spinner /> : 'Edit'}
          </button>
        </div>
        {error && <p className="text-red-400 text-center mb-4">{error}</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="flex flex-col items-center">
            <h3 className="text-lg font-medium mb-2">Original</h3>
            <div className="w-full aspect-square bg-gray-800 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-600">
              {originalImage ? (
                <img src={originalImage.url} alt="Original" className="max-w-full max-h-full object-contain rounded-lg" />
              ) : (
                <p className="text-gray-500">Upload an image to start</p>
              )}
            </div>
          </div>
          <div className="flex flex-col items-center">
            <h3 className="text-lg font-medium mb-2">Edited</h3>
            <div className="w-full aspect-square bg-gray-800 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-600">
            {loading ? (
                <div className="flex flex-col items-center text-gray-400">
                    <Spinner className="w-10 h-10 mb-2"/>
                    <p>Applying edits...</p>
                </div>
            ) : editedImageUrl ? (
                <img src={editedImageUrl} alt="Edited" className="max-w-full max-h-full object-contain rounded-lg" />
            ) : (
                <p className="text-gray-500">Your edited image will appear here</p>
            )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageEditor;
