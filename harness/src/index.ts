import * as dotenv from 'dotenv';
dotenv.config();

import config from '../config/default.json';
import { MqttClient } from './comms/MqttClient';
import { AudioServer } from './comms/AudioServer';
import { DeepgramProvider } from './providers/stt/DeepgramProvider';
import { WhisperProvider } from './providers/stt/WhisperProvider';
import { ElevenLabsProvider } from './providers/tts/ElevenLabsProvider';
import { OpenAIProvider } from './providers/llm/OpenAIProvider';
import { Pipeline } from './engine/Pipeline';
import { STTProvider, TTSProvider, LLMProvider, MemoryContext } from './providers/types';
import pino from 'pino';

const logger = pino({ name: 'xentient-harness' });

function createSTTProvider(): STTProvider {
  const provider = process.env.STT_PROVIDER ?? config.stt.provider;
  if (provider === 'deepgram') {
    const key = process.env.DEEPGRAM_API_KEY;
    if (!key) throw new Error('DEEPGRAM_API_KEY not set');
    return new DeepgramProvider(key);
  }
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY not set');
  return new WhisperProvider(key);
}

function createTTSProvider(): TTSProvider {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error('ELEVENLABS_API_KEY not set');
  return new ElevenLabsProvider(key, process.env.ELEVENLABS_VOICE_ID ?? config.tts.voiceId);
}

function createLLMProvider(): LLMProvider {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY not set');
  return new OpenAIProvider(key, config.llm.model);
}

async function main() {
  logger.info('Starting Xentient Harness...');

  const mqtt = new MqttClient(process.env.MQTT_BROKER_URL ?? config.mqtt.brokerUrl, config.nodeId);
  const audioServer = new AudioServer(config.audio.wsPort);
  const stt = createSTTProvider();
  const tts = createTTSProvider();
  const llm = createLLMProvider();

  // Placeholder memory context — will be replaced by Plan 02-02
  const getMemoryContext = async (_: string): Promise<MemoryContext> => ({
    userProfile: 'You are talking to an unknown user.',
    relevantEpisodes: '',
    extractedFacts: '',
  });

  const pipeline = new Pipeline({ stt, tts, llm, mqtt, audio: audioServer, getMemoryContext });

  pipeline.on('transcript', (t) => logger.info({ transcript: t }, 'User said'));
  pipeline.on('turnComplete', (t) => logger.info(t, 'Turn complete'));
  pipeline.on('heartbeat', (h) => logger.debug(h, 'Heartbeat'));

  logger.info({ wsPort: config.audio.wsPort, mqtt: config.mqtt.brokerUrl }, 'Harness ready');

  // Graceful shutdown
  process.on('SIGINT', () => {
    logger.info('Shutting down...');
    mqtt.disconnect();
    audioServer.close();
    process.exit(0);
  });
}

main().catch((err) => {
  logger.error({ err }, 'Fatal harness error');
  process.exit(1);
});
