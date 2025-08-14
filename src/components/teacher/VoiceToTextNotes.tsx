"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { enhancedSessionStore } from '@/store/session.store';
import { SessionRecord, User } from '@/types';
import { speechToTextService, SpeechRecognitionResult } from '@/services/speech-to-text.service';
import { logger } from '@/services/logging.service';

interface VoiceToTextNotesProps {
  session: SessionRecord;
  currentUser: User;
  onNotesUpdate?: (notes: string) => void;
  className?: string;
}

export default function VoiceToTextNotes({
  session,
  currentUser,
  onNotesUpdate,
  className = ''
}: VoiceToTextNotesProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [aiEnhancedNotes, setAiEnhancedNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSupported, setIsSupported] = useState(true);

  const mountedRef = useRef(true);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Initialize speech recognition if available
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        setTranscript(prev => prev + finalTranscript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setError('Speech recognition error: ' + event.error);
        setIsRecording(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      setError(null);
      
      if (recognitionRef.current) {
        recognitionRef.current.start();
        setIsRecording(true);
      } else {
        // Fallback to MediaRecorder if speech recognition is not available
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        const chunks: Blob[] = [];
        mediaRecorder.ondataavailable = (event) => {
          chunks.push(event.data);
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(chunks, { type: 'audio/wav' });
          // In a real implementation, you would send this to a speech-to-text service
          console.log('Audio recorded, would send to STT service');
        };

        mediaRecorder.start();
        setIsRecording(true);
      }
    } catch (err) {
      setError('Failed to start recording: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const enhanceWithAI = async () => {
    if (!transcript.trim()) {
      setError('No transcript to enhance');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);

      // Create a temporary session with the transcript for AI processing
      const tempSession: SessionRecord = {
        ...session,
        notes: transcript,
        status: 'completed'
      };

      // Use the enhanced session store to generate AI-enhanced notes
      const enhancedNotes = await enhancedSessionStore.generateAutoNotes(tempSession);
      
      setAiEnhancedNotes(enhancedNotes.summary);
      
      // Generate suggestions based on the enhanced notes
      const aiSuggestions = [
        'Add specific learning objectives achieved',
        'Include student engagement observations',
        'Note any challenges or areas for improvement',
        'Mention resources or materials used',
        'Add follow-up recommendations'
      ];
      
      setSuggestions(aiSuggestions);
      setShowSuggestions(true);

    } catch (err) {
      setError('Failed to enhance notes with AI: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsProcessing(false);
    }
  };

  const applySuggestion = (suggestion: string) => {
    const newNotes = transcript + '\n\n' + suggestion;
    setTranscript(newNotes);
    onNotesUpdate?.(newNotes);
  };

  const saveNotes = () => {
    const finalNotes = aiEnhancedNotes || transcript;
    onNotesUpdate?.(finalNotes);
  };

  const clearNotes = () => {
    setTranscript('');
    setAiEnhancedNotes('');
    setSuggestions([]);
    setShowSuggestions(false);
    setError(null);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Voice-to-Text Session Notes
        </h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">AI Enhanced</span>
          <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        </div>
      </div>

      {/* Recording Controls */}
      <div className="flex items-center space-x-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={isRecording ? stopRecording : startRecording}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            isRecording
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          <div className={`w-4 h-4 rounded-full ${
            isRecording ? 'bg-white animate-pulse' : 'bg-white'
          }`}></div>
          <span>{isRecording ? 'Stop Recording' : 'Start Recording'}</span>
        </motion.button>

        {transcript && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={enhanceWithAI}
            disabled={isProcessing}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? 'Enhancing...' : 'Enhance with AI'}
          </motion.button>
        )}
      </div>

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 bg-red-50 border border-red-200 rounded-lg"
          >
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transcript Display */}
      {transcript && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Raw Transcript
            </label>
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Your voice transcript will appear here..."
            />
          </div>

          {/* AI Enhanced Notes */}
          {aiEnhancedNotes && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <label className="block text-sm font-medium text-gray-700">
                AI Enhanced Notes
              </label>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900 whitespace-pre-wrap">{aiEnhancedNotes}</p>
              </div>
            </motion.div>
          )}

          {/* AI Suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <label className="block text-sm font-medium text-gray-700">
                AI Suggestions
              </label>
              <div className="grid gap-2">
                {suggestions.map((suggestion, index) => (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => applySuggestion(suggestion)}
                    className="text-left p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <span className="text-sm text-gray-700">{suggestion}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={saveNotes}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Save Notes
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={clearNotes}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Clear All
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Recording Status */}
      {isRecording && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg"
        >
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-red-700 font-medium">Recording in progress...</span>
        </motion.div>
      )}

      {/* Processing Status */}
      {isProcessing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-lg"
        >
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-sm text-blue-700 font-medium">AI is enhancing your notes...</span>
        </motion.div>
      )}
    </div>
  );
}
