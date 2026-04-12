import { Readable } from 'stream';

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface TranscriptChunk {
  text: string;
  is_final: boolean;
  confidence?: number;
}

export interface MemoryContext {
  userProfile: string;     // From USER.md
  relevantEpisodes: string; // Retrieved from FTS5
  extractedFacts: string;  // From facts table
}

// Core provider interfaces — ALL providers MUST implement these
export interface STTProvider {
  /**
   * Stream transcription from audio chunks.
   * Audio format: Raw PCM 16-bit mono 16kHz Buffer chunks.
   * Returns async iterable of transcript chunks.
   */
  transcribe(audioBuffer: Buffer): Promise<string>;
  transcribeStream(audioStream: Readable): AsyncIterable<TranscriptChunk>;
}

export interface TTSProvider {
  /**
   * Synthesize text to audio.
   * Returns a Readable stream of MP3/PCM audio data.
   */
  synthesize(text: string): Promise<Readable>;
  synthesizeStreaming(textStream: AsyncIterable<string>): Readable;
}

export interface LLMProvider {
  /**
   * Generate a response with optional memory context.
   * Returns an async iterable of text tokens for streaming output.
   */
  complete(
    messages: Message[],
    context: MemoryContext,
    options?: { temperature?: number; maxTokens?: number }
  ): AsyncIterable<string>;
}

// Factory types for dependency injection
export type ProviderConfig = {
  stt: { provider: 'deepgram' | 'whisper'; apiKey: string };
  tts: { provider: 'elevenlabs' | 'google'; apiKey: string; voiceId?: string };
  llm: { provider: 'openai' | 'anthropic' | 'gemini'; apiKey: string; model?: string };
};
