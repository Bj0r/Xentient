import OpenAI from 'openai';
import { Readable } from 'stream';
import { STTProvider, TranscriptChunk } from '../types';
import { Blob } from 'buffer';

export class WhisperProvider implements STTProvider {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async transcribe(audioBuffer: Buffer): Promise<string> {
    const file = new File([audioBuffer], 'audio.wav', { type: 'audio/wav' });
    const response = await this.client.audio.transcriptions.create({
      model: 'whisper-1',
      file,
      language: 'en',
    });
    return response.text;
  }

  async *transcribeStream(_audioStream: Readable): AsyncIterable<TranscriptChunk> {
    // Whisper doesn't support true streaming — collect buffer then transcribe
    const chunks: Buffer[] = [];
    for await (const chunk of _audioStream) chunks.push(chunk as Buffer);
    const full = Buffer.concat(chunks);
    const text = await this.transcribe(full);
    yield { text, is_final: true };
  }
}
