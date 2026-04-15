import OpenAI from 'openai';
import { LLMProvider, Message, MemoryContext } from '../types';
import pino from 'pino';

const logger = pino({ name: 'llm-openai' });

export class OpenAIProvider implements LLMProvider {
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, model: string = 'gpt-4o', baseURL?: string) {
    this.client = new OpenAI({ 
      apiKey, 
      baseURL,
      // OpenRouter compatibility requirement for some headers:
      defaultHeaders: baseURL?.includes('openrouter') ? {
        'HTTP-Referer': 'http://localhost:8080',
        'X-Title': 'Xentient Harness Local',
      } : undefined
    });
    this.model = model;
  }

  async *complete(
    messages: Message[],
    context: MemoryContext,
    options: { temperature?: number; maxTokens?: number } = {}
  ): AsyncIterable<string> {
    // Build system prompt with memory context injected
    const systemPrompt = this.buildSystemPrompt(context);
    const fullMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...messages.map(m => ({ role: m.role, content: m.content })),
    ];

    logger.debug({ model: this.model, messageCount: fullMessages.length }, 'LLM request');

    const stream = await this.client.chat.completions.create({
      model: this.model,
      messages: fullMessages,
      stream: true,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 500,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) yield content;
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
