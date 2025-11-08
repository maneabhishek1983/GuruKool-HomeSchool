/**
 * Speech-to-Text Service
 * Handles voice recording and transcription functionality
 */

import { logger } from './logging.service';

export interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

export interface AudioRecordingOptions {
  sampleRate?: number;
  channelCount?: number;
  bitDepth?: number;
  format?: 'wav' | 'mp3';
}

export interface STTServiceOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
  enableAudioRecording?: boolean;
  audioOptions?: AudioRecordingOptions;
}

export class SpeechToTextService {
  private static instance: SpeechToTextService;
  private recognition: any | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioStream: MediaStream | null = null;
  private audioChunks: Blob[] = [];
  private isRecording = false;
  private options: STTServiceOptions;

  // Callbacks
  private onResult: ((result: SpeechRecognitionResult) => void) | null = null;
  private onError: ((error: string) => void) | null = null;
  private onStart: (() => void) | null = null;
  private onEnd: (() => void) | null = null;

  private constructor(options: STTServiceOptions = {}) {
    this.options = {
      language: 'en-US',
      continuous: true,
      interimResults: true,
      maxAlternatives: 1,
      enableAudioRecording: true,
      audioOptions: {
        sampleRate: 44100,
        channelCount: 1,
        format: 'wav',
      },
      ...options,
    };

    this.initializeSpeechRecognition();
  }

  public static getInstance(options?: STTServiceOptions): SpeechToTextService {
    if (!SpeechToTextService.instance) {
      SpeechToTextService.instance = new SpeechToTextService(options);
    }
    return SpeechToTextService.instance;
  }

  private initializeSpeechRecognition(): void {
    // Check if browser supports Speech Recognition
    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      logger.warn('app', 'SpeechRecognition API not supported in this browser');
      return;
    }

    this.recognition = new SpeechRecognitionAPI();
    this.recognition.lang = this.options.language!;
    this.recognition.continuous = this.options.continuous!;
    this.recognition.interimResults = this.options.interimResults!;
    this.recognition.maxAlternatives = this.options.maxAlternatives!;

    // Event handlers
    this.recognition.onstart = () => {
      logger.info('app', 'Speech recognition started');
      this.onStart?.();
    };

    this.recognition.onresult = (event: any) => {
      const results = event.results;
      const lastResult = results[results.length - 1];
      const transcript = lastResult[0].transcript;
      const confidence = lastResult[0].confidence;
      const isFinal = lastResult.isFinal;

      logger.debug('app', 'Speech recognition result', {
        transcript,
        confidence,
        isFinal,
      });

      this.onResult?.({
        transcript,
        confidence,
        isFinal,
      });
    };

    this.recognition.onerror = (event: any) => {
      const errorMessage = `Speech recognition error: ${event.error}`;
      logger.error('app', errorMessage);
      this.onError?.(errorMessage);
    };

    this.recognition.onend = () => {
      logger.info('app', 'Speech recognition ended');
      this.isRecording = false;
      this.onEnd?.();
    };
  }

  public async startRecording(): Promise<boolean> {
    try {
      if (this.isRecording) {
        logger.warn('app', 'Recording is already in progress');
        return false;
      }

      // Start speech recognition if available
      if (this.recognition) {
        this.recognition.start();
      }

      // Start audio recording if enabled
      if (this.options.enableAudioRecording) {
        await this.startAudioRecording();
      }

      this.isRecording = true;
      return true;
    } catch (error) {
      const errorMessage = `Failed to start recording: ${error instanceof Error ? error.message : 'Unknown error'}`;
      logger.error(
        'app',
        errorMessage,
        error instanceof Error ? error : undefined
      );
      this.onError?.(errorMessage);
      return false;
    }
  }

  public stopRecording(): void {
    if (!this.isRecording) {
      logger.warn('app', 'No recording in progress');
      return;
    }

    // Stop speech recognition
    if (this.recognition) {
      this.recognition.stop();
    }

    // Stop audio recording
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
    }

    // Stop audio stream
    if (this.audioStream) {
      this.audioStream.getTracks().forEach(track => track.stop());
      this.audioStream = null;
    }

    this.isRecording = false;
    logger.info('app', 'Recording stopped');
  }

  private async startAudioRecording(): Promise<void> {
    try {
      this.audioStream = await navigator.mediaDevices.getUserMedia({
        audio:
          this.options.audioOptions?.sampleRate !== undefined ||
          this.options.audioOptions?.channelCount !== undefined
            ? {
                ...(this.options.audioOptions.sampleRate !== undefined && {
                  sampleRate: this.options.audioOptions.sampleRate,
                }),
                ...(this.options.audioOptions.channelCount !== undefined && {
                  channelCount: this.options.audioOptions.channelCount,
                }),
                echoCancellation: true,
                noiseSuppression: true,
              }
            : {
                echoCancellation: true,
                noiseSuppression: true,
              },
      });

      this.audioChunks = [];
      this.mediaRecorder = new MediaRecorder(this.audioStream);

      this.mediaRecorder.ondataavailable = event => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(this.audioChunks, {
          type:
            this.options.audioOptions?.format === 'mp3'
              ? 'audio/mp3'
              : 'audio/wav',
        });

        // In a real implementation, you could send this to a cloud STT service
        // For now, we'll just log it
        logger.info('app', 'Audio recording completed', {
          size: audioBlob.size,
          type: audioBlob.type,
        });

        // Optional: Send to external STT service
        await this.processAudioWithExternalService(audioBlob);
      };

      this.mediaRecorder.start();
      logger.info('app', 'Audio recording started');
    } catch (error) {
      throw new Error(
        `Failed to start audio recording: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private async processAudioWithExternalService(
    audioBlob: Blob
  ): Promise<void> {
    // Placeholder for external STT service integration
    // You would implement integration with services like:
    // - Google Cloud Speech-to-Text
    // - Azure Speech Services
    // - Amazon Transcribe
    // - OpenAI Whisper API

    try {
      // Example structure for external service call:
      /*
      const formData = new FormData();
      formData.append('audio', audioBlob);
      formData.append('language', this.options.language);
      
      const response = await fetch('/api/speech-to-text', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const result = await response.json();
        this.onResult?.({
          transcript: result.transcript,
          confidence: result.confidence,
          isFinal: true,
        });
      }
      */

      logger.debug('app', 'Audio would be processed by external STT service', {
        size: audioBlob.size,
      });
    } catch (error) {
      logger.error(
        'app',
        'Failed to process audio with external service',
        error instanceof Error ? error : undefined
      );
    }
  }

  public isSupported(): boolean {
    return !!(
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition
    );
  }

  public isCurrentlyRecording(): boolean {
    return this.isRecording;
  }

  public setOptions(newOptions: Partial<STTServiceOptions>): void {
    this.options = { ...this.options, ...newOptions };

    if (this.recognition) {
      this.recognition.lang = this.options.language!;
      this.recognition.continuous = this.options.continuous!;
      this.recognition.interimResults = this.options.interimResults!;
      this.recognition.maxAlternatives = this.options.maxAlternatives!;
    }
  }

  // Event handler setters
  public onResultReceived(
    callback: (result: SpeechRecognitionResult) => void
  ): void {
    this.onResult = callback;
  }

  public onErrorOccurred(callback: (error: string) => void): void {
    this.onError = callback;
  }

  public onRecordingStarted(callback: () => void): void {
    this.onStart = callback;
  }

  public onRecordingEnded(callback: () => void): void {
    this.onEnd = callback;
  }

  public cleanup(): void {
    this.stopRecording();
    this.recognition = null;
    this.mediaRecorder = null;
    this.audioStream = null;
    this.audioChunks = [];
  }
}

// Export default instance
export const speechToTextService = SpeechToTextService.getInstance();
