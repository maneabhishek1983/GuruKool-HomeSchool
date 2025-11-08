'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/design-system/components/base/Card';
import { SessionRecord } from '@/types/session.types';
import { User } from '@/types';
import { enhancedSessionStore } from '@/store/session.store';

interface VoiceToTextNotesProps {
  sessionId: string;
  user: User;
  onNotesUpdate?: (notes: string) => void;
  className?: string;
}

interface VoiceRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

interface AIEnhancement {
  originalText: string;
  enhancedText: string;
  suggestions: string[];
  confidence: number;
}

export const VoiceToTextNotes: React.FC<VoiceToTextNotesProps> = ({
  sessionId,
  user,
  onNotesUpdate,
  className = '',
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiEnhancement, setAiEnhancement] = useState<AIEnhancement | null>(
    null
  );
  const [savedNotes, setSavedNotes] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Check if speech recognition is supported
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      setIsSupported(true);
      recognitionRef.current = new SpeechRecognition();

      // Configure speech recognition
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.maxAlternatives = 1;

      // Event handlers
      recognitionRef.current.onstart = () => {
        setIsRecording(true);
        setError(null);
      };

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscriptPart = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscriptPart += result[0].transcript;
          } else {
            interimTranscript += result[0].transcript;
          }
        }

        setTranscript(interimTranscript);

        if (finalTranscriptPart) {
          setFinalTranscript(prev => prev + finalTranscriptPart + ' ');

          // Auto-enhance with AI after a pause
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }

          timeoutRef.current = setTimeout(() => {
            enhanceWithAI(finalTranscript + finalTranscriptPart);
          }, 2000);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        setError(`Speech recognition error: ${event.error}`);
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    } else {
      setError('Speech recognition is not supported in this browser');
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [finalTranscript]);

  const startRecording = () => {
    if (recognitionRef.current && !isRecording) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        setError('Failed to start recording. Please try again.');
      }
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
    }
  };

  const enhanceWithAI = async (text: string) => {
    if (!text.trim()) {
      return;
    }

    setIsProcessing(true);
    try {
      // Simulate AI enhancement - in real implementation, this would call an AI service
      const enhancement = await simulateAIEnhancement(text);
      setAiEnhancement(enhancement);
    } catch (error) {
      console.error('AI enhancement failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const simulateAIEnhancement = async (
    text: string
  ): Promise<AIEnhancement> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock AI enhancement
    const enhancedText = text
      .replace(/um+/gi, '')
      .replace(/uh+/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    const sentences = enhancedText.split(/[.!?]+/).filter(s => s.trim());
    const structuredText = sentences
      .map(sentence => sentence.trim())
      .filter(sentence => sentence.length > 0)
      .map(
        sentence => `• ${sentence.charAt(0).toUpperCase() + sentence.slice(1)}`
      )
      .join('\n');

    return {
      originalText: text,
      enhancedText: structuredText,
      suggestions: [
        'Add specific learning objectives',
        'Include student engagement metrics',
        'Note areas for improvement',
        'Add follow-up action items',
      ],
      confidence: 0.85,
    };
  };

  const acceptAIEnhancement = () => {
    if (aiEnhancement) {
      const newNotes = savedNotes + '\n\n' + aiEnhancement.enhancedText;
      setSavedNotes(newNotes);
      setFinalTranscript('');
      setTranscript('');
      setAiEnhancement(null);
      onNotesUpdate?.(newNotes);
    }
  };

  const rejectAIEnhancement = () => {
    if (aiEnhancement) {
      const newNotes = savedNotes + '\n\n' + aiEnhancement.originalText;
      setSavedNotes(newNotes);
      setFinalTranscript('');
      setTranscript('');
      setAiEnhancement(null);
      onNotesUpdate?.(newNotes);
    }
  };

  const saveNotes = async () => {
    try {
      const allNotes = savedNotes + '\n\n' + finalTranscript + transcript;

      // Save to session store
      await enhancedSessionStore.updateSession(
        {
          sessionId,
          updates: { notes: allNotes },
          requestedBy: user.id,
          aiAssisted: true,
        },
        user
      );

      setSavedNotes(allNotes);
      setFinalTranscript('');
      setTranscript('');
      setAiEnhancement(null);
      onNotesUpdate?.(allNotes);
    } catch (error) {
      setError('Failed to save notes. Please try again.');
    }
  };

  const clearNotes = () => {
    setSavedNotes('');
    setFinalTranscript('');
    setTranscript('');
    setAiEnhancement(null);
    onNotesUpdate?.('');
  };

  if (!isSupported) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg
              className="w-12 h-12 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Voice Recognition Not Supported
          </h3>
          <p className="text-gray-600 mb-4">
            Your browser doesn't support voice recognition. Please use a modern
            browser like Chrome or Edge.
          </p>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Manual Notes</h4>
            <textarea
              className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Type your session notes here..."
              value={savedNotes}
              onChange={e => {
                setSavedNotes(e.target.value);
                onNotesUpdate?.(e.target.value);
              }}
            />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Voice-to-Text Session Notes
          </h3>
          <div className="flex items-center gap-2">
            {isProcessing && (
              <div className="flex items-center gap-2 text-blue-600">
                <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                <span className="text-sm">AI Enhancing...</span>
              </div>
            )}
            <span
              className={`px-2 py-1 text-xs rounded-full ${
                isRecording
                  ? 'bg-red-100 text-red-700'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {isRecording ? 'Recording' : 'Ready'}
            </span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Recording Controls */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              isRecording
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isRecording ? (
              <>
                <div className="w-4 h-4 bg-white rounded-sm"></div>
                Stop Recording
              </>
            ) : (
              <>
                <div className="w-4 h-4 bg-white rounded-full"></div>
                Start Recording
              </>
            )}
          </button>

          <button
            onClick={saveNotes}
            disabled={!finalTranscript && !transcript}
            className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Save Notes
          </button>

          <button
            onClick={clearNotes}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
          >
            Clear All
          </button>
        </div>

        {/* Live Transcript */}
        {(transcript || finalTranscript) && (
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-2">Live Transcript</h4>
            <div className="bg-gray-50 p-4 rounded-lg min-h-[100px] max-h-[200px] overflow-y-auto">
              <p className="text-gray-900 whitespace-pre-wrap">
                {finalTranscript}
                <span className="text-gray-500 italic">{transcript}</span>
                {isRecording && (
                  <motion.span
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="inline-block w-2 h-5 bg-blue-600 ml-1"
                  />
                )}
              </p>
            </div>
          </div>
        )}

        {/* AI Enhancement */}
        <AnimatePresence>
          {aiEnhancement && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg"
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-purple-900">
                  AI Enhancement Available
                </h4>
                <span className="text-sm text-purple-600">
                  {Math.round(aiEnhancement.confidence * 100)}% confidence
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">
                    Original
                  </h5>
                  <div className="bg-white p-3 rounded border text-sm text-gray-600 max-h-32 overflow-y-auto">
                    {aiEnhancement.originalText}
                  </div>
                </div>
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">
                    Enhanced
                  </h5>
                  <div className="bg-white p-3 rounded border text-sm text-gray-900 max-h-32 overflow-y-auto whitespace-pre-line">
                    {aiEnhancement.enhancedText}
                  </div>
                </div>
              </div>

              {aiEnhancement.suggestions.length > 0 && (
                <div className="mb-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">
                    AI Suggestions
                  </h5>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {aiEnhancement.suggestions.map((suggestion, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-purple-500 mt-1">•</span>
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={acceptAIEnhancement}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
                >
                  Accept Enhancement
                </button>
                <button
                  onClick={rejectAIEnhancement}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
                >
                  Use Original
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Saved Notes */}
        {savedNotes && (
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Saved Notes</h4>
            <div className="bg-gray-50 p-4 rounded-lg max-h-[300px] overflow-y-auto">
              <p className="text-gray-900 whitespace-pre-wrap">{savedNotes}</p>
            </div>
          </div>
        )}
      </Card>

      {/* Recording Tips */}
      <Card className="p-4">
        <h4 className="font-medium text-gray-900 mb-2">Recording Tips</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Speak clearly and at a moderate pace</li>
          <li>• Use punctuation words like "period" and "comma"</li>
          <li>• Pause briefly between thoughts for better AI enhancement</li>
          <li>• Review and edit AI suggestions before accepting</li>
        </ul>
      </Card>
    </div>
  );
};
