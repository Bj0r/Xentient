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
import { initDatabase } from './memory/schema';
import { MemoryDB } from './memory/MemoryDB';
import { MemoryInjector } from './memory/MemoryInjector';
import { FactExtractor } from './memory/FactExtractor';
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

  // Initialize Hermes memory system
  const db = initDatabase();
  const memoryDb = new MemoryDB(db);
  const memoryInjector = new MemoryInjector(memoryDb, llm);
  const factExtractor = new FactExtractor(llm, memoryDb);

  // Real memory context function (replaces stub)
  const getMemoryContext = async (userMessage: string): Promise<MemoryContext> => {
    return memoryInjector.buildContext(userMessage);
  };

  // Track turn count for session summary
  let turnCount = 0;

  // Post-turn callback: save episode + extract facts
  const onTurnComplete = async (userMessage: string, aiResponse: string): Promise<void> => {
    memoryDb.saveTurn('user', userMessage);
    memoryDb.saveTurn('assistant', aiResponse);
    turnCount++;
    // Fire-and-forget — extractAfterTurn queues internally (returns void, not a Promise)
    factExtractor.extractAfterTurn(userMessage, aiResponse);
  };

  const pipeline = new Pipeline({ stt, tts, llm, mqtt, audio: audioServer, getMemoryContext, onTurnComplete });

  pipeline.on('transcript', (t) => logger.info({ transcript: t }, 'User said'));
  pipeline.on('turnComplete', (t) => logger.info(t, 'Turn complete'));
  pipeline.on('heartbeat', (h) => logger.debug(h, 'Heartbeat'));

  // Log memory system status
  const userName = memoryDb.getUserName();
  logger.info({ userName: userName ?? 'unknown' }, 'Memory system ready');
  logger.info({ wsPort: config.audio.wsPort, mqtt: config.mqtt.brokerUrl }, 'Harness ready');

  // Graceful shutdown — handle both SIGINT (Ctrl+C) and SIGTERM (Docker/PM2/K8s)
  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Shutting down gracefully...');
    await factExtractor.flush();
    memoryDb.endSession(turnCount);
    mqtt.disconnect();
    audioServer.close();
    process.exit(0);
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((err) => {
  logger.error({ err }, 'Fatal harness error');
  process.exit(1);
});