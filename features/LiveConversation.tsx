
import React, { useState, useRef, useEffect, useCallback } from 'react';
// FIX: `LiveSession` is not an exported member of `@google/genai`.
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { decode, decodeAudioData, createBlob } from '../utils/audio';

const LiveConversation: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcripts, setTranscripts] = useState<{ user: string; model: string }[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [currentOutput, setCurrentOutput] = useState('');
  const [error, setError] = useState<string | null>(null);

  // FIX: Use `any` for the session promise as `LiveSession` type is not exported.
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const stopRecording = useCallback(() => {
    if (sessionPromiseRef.current) {
      sessionPromiseRef.current.then(session => session.close());
      sessionPromiseRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }
    if (mediaStreamSourceRef.current) {
      mediaStreamSourceRef.current.disconnect();
      mediaStreamSourceRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsRecording(false);
  }, []);

  const startRecording = async () => {
    setError(null);
    setTranscripts([]);
    setCurrentInput('');
    setCurrentOutput('');
    setIsRecording(true);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      nextStartTimeRef.current = 0;
      sourcesRef.current.clear();
      const outputNode = outputAudioContextRef.current.createGain();

      let tempCurrentInput = '';
      let tempCurrentOutput = '';

      sessionPromiseRef.current = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
        },
        callbacks: {
          onopen: async () => {
            mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            mediaStreamSourceRef.current = audioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
            scriptProcessorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);
            
            scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              if (sessionPromiseRef.current) {
                sessionPromiseRef.current.then((session) => {
                  session.sendRealtimeInput({ media: pcmBlob });
                });
              }
            };
            
            mediaStreamSourceRef.current.connect(scriptProcessorRef.current);
            scriptProcessorRef.current.connect(audioContextRef.current.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.inputTranscription) {
              tempCurrentInput += message.serverContent.inputTranscription.text;
              setCurrentInput(tempCurrentInput);
            }
            if (message.serverContent?.outputTranscription) {
              tempCurrentOutput += message.serverContent.outputTranscription.text;
              setCurrentOutput(tempCurrentOutput);
            }
            if(message.serverContent?.turnComplete) {
              setTranscripts(prev => [...prev, {user: tempCurrentInput, model: tempCurrentOutput}]);
              tempCurrentInput = '';
              tempCurrentOutput = '';
              setCurrentInput('');
              setCurrentOutput('');
            }
            
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData.data;
            if (base64Audio && outputAudioContextRef.current) {
              const audioCtx = outputAudioContextRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, audioCtx.currentTime);
              
              const audioBuffer = await decodeAudioData(decode(base64Audio), audioCtx, 24000, 1);
              const source = audioCtx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputNode);
              outputNode.connect(audioCtx.destination);
              source.addEventListener('ended', () => sourcesRef.current.delete(source));
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }

            if(message.serverContent?.interrupted){
                for (const source of sourcesRef.current.values()) {
                    source.stop();
                    sourcesRef.current.delete(source);
                }
                nextStartTimeRef.current = 0;
            }
          },
          onerror: (e: ErrorEvent) => {
            console.error('Live session error:', e);
            setError('A connection error occurred. Please try again.');
            stopRecording();
          },
          onclose: (e: CloseEvent) => {
            stopRecording();
          },
        },
      });

    } catch (err) {
      console.error('Failed to start recording:', err);
      setError('Could not access microphone or start session.');
      stopRecording();
    }
  };

  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, [stopRecording]);

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-xl overflow-hidden border border-gray-700">
      <header className="bg-gray-800 p-4 border-b border-gray-700 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">Live Conversation</h2>
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`px-4 py-2 rounded-lg font-semibold text-white transition-colors flex items-center gap-2 ${
            isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isRecording ? 'Stop' : 'Start'} Conversation
        </button>
      </header>
      <div className="flex-1 p-6 overflow-y-auto space-y-4">
        {error && <div className="p-4 bg-red-900 border border-red-700 rounded-lg text-red-200">{error}</div>}
        {transcripts.map((t, i) => (
          <div key={i} className="space-y-2">
            <p><strong className="text-blue-400">You:</strong> {t.user}</p>
            <p><strong className="text-purple-400">Gemini:</strong> {t.model}</p>
          </div>
        ))}
        {isRecording && (
          <div className="space-y-2 pt-4 border-t border-gray-700">
             {currentInput && <p className="text-gray-400"><strong className="text-blue-400">You:</strong> {currentInput}</p>}
             {currentOutput && <p className="text-gray-400"><strong className="text-purple-400">Gemini:</strong> {currentOutput}</p>}
          </div>
        )}
        {!isRecording && transcripts.length === 0 && !error && (
            <div className="text-center text-gray-500 pt-10">Click "Start Conversation" to begin.</div>
        )}
      </div>
    </div>
  );
};

export default LiveConversation;
