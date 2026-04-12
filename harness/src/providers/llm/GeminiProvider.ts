import { GoogleGenerativeAI } from '@google/generative-ai';
import { LLMProvider, Message, MemoryContext } from '../types';
import pino from 'pino';

const logger = pino({ name: 'llm-gemini' });

export class GeminiProvider implements LLMProvider {
  private client: GoogleGenerativeAI;
  private model: string;

  constructor(apiKey: string, model: string = 'gemini-2.0-flash') {
    this.client = new GoogleGenerativeAI(apiKey);
    this.model = model;
  }

  async *complete(
    messages: Message[],
    context: MemoryContext,
    options: { temperature?: number; maxTokens?: number } = {}
  ): AsyncIterable<string> {
    const systemPrompt = this.buildSystemPrompt(context);
    const model = this.client.getGenerativeModel({ model: this.model });

    // Convert messages to Gemini format
    const geminiMessages = [
      ...(systemPrompt ? [{ role: 'model' as const, parts: [{ text: systemPrompt }] }] : []),
      ...messages.map(m => ({
        role: m.role === 'system' ? 'model' as const : m.role as 'user' | 'model',
        parts: [{ text: m.content }],
      })),
    ];

    const result = await model.generateContentStream({
      contents: geminiMessages,
      generationConfig: {
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxTokens ?? 500,
      },
    });

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) yield text;
    }
  }

  private buildSystemPrompt(context: MemoryContext): string {
    return `You are Xentient, a spatial intelligence assistant.

## User Profile
${context.userProfile}

## What I Know About This User
${context.extractedFacts || 'No facts stored yet.'}

## Relevant Past Conversations
${context.relevantEpisodes || 'No relevant history found.'}

Be concise, warm, and helpful. Respond in 1-3 sentences unless depth is requested.`;
  }
}
