import { createClient, DeepgramClient, LiveTranscriptionEvents } from '@deepgram/sdk';
import { Readable } from 'stream';
import { STTProvider, TranscriptChunk } from '../types';
import pino from 'pino';

const logger = pino({ name: 'stt-deepgram' });

export class DeepgramProvider implements STTProvider {
  private client: DeepgramClient;

  constructor(apiKey: string) {
    this.client = createClient(apiKey);
  }

  /** Batch transcription for short utterances (<30s) */
  async transcribe(audioBuffer: Buffer): Promise<string> {
    const { result, error } = await this.client.listen.prerecorded.transcribeFile(
      audioBuffer,
      {
        model: 'nova-2',
        language: 'en-US',
        smart_format: true,
        punctuate: true,
      }
    );
    if (error) throw new Error(`Deepgram error: ${error.message}`);
    const transcript = result?.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? '';
    logger.debug({ transcript }, 'Deepgram transcription complete');
    return transcript;
  }

  /** Streaming transcription for VAD-delimited audio */
  async *transcribeStream(audioStream: Readable): AsyncIterable<TranscriptChunk> {
    const connection = this.client.listen.live({
      model: 'nova-2',
      language: 'en-US',
      smart_format: true,
      interim_results: true,  // stream partial results for lower perceived latency
      endpointing: 300,
    });

    const chunks: TranscriptChunk[] = [];

    connection.on(LiveTranscriptionEvents.Transcript, (data) => {
      const alt = data.channel?.alternatives?.[0];
      if (alt?.transcript) {
        chunks.push({
          text: alt.transcript,
          is_final: data.is_final ?? false,
          confidence: alt.confidence,
        });
      }
    });

    for await (const chunk of audioStream) {
      connection.send(chunk as Buffer);
    }
    connection.requestClose();

    for (const chunk of chunks) yield chunk;
  }
}
