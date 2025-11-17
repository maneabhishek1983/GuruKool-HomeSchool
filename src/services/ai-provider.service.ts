/**
 * AI Provider Service - Unified interface for multiple AI APIs
 * Supports: OpenRouter, Kimi K2 (Moonshot), OpenAI
 * Auto-detects available API keys and uses priority: OpenRouter > Kimi K2 > OpenAI
 */

import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

export type AIProvider = 'openrouter' | 'moonshot' | 'openai' | 'none';

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AICompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}

class AIProviderService {
  private static instance: AIProviderService;
  private provider: AIProvider;
  private client: OpenAI | null;
  private providerName: string;

  private constructor() {
    // Auto-detect available AI provider based on environment variables
    const { provider, client, name } = this.detectProvider();
    this.provider = provider;
    this.client = client;
    this.providerName = name;

    if (this.provider !== 'none') {
      console.log(`✅ AI Provider initialized: ${this.providerName}`);
    } else {
      console.warn('⚠️ No AI provider configured. Set API keys in .env.local');
    }
  }

  static getInstance(): AIProviderService {
    if (!AIProviderService.instance) {
      AIProviderService.instance = new AIProviderService();
    }
    return AIProviderService.instance;
  }

  /**
   * Detect and initialize AI provider based on available API keys
   * Priority: OpenRouter > Kimi K2 > OpenAI
   */
  private detectProvider(): {
    provider: AIProvider;
    client: OpenAI | null;
    name: string;
  } {
    // Check for explicit provider selection
    const explicitProvider = process.env.AI_PROVIDER;
    if (explicitProvider && explicitProvider !== 'auto-detect') {
      return this.initializeExplicitProvider(explicitProvider as AIProvider);
    }

    // Auto-detect by priority: OpenRouter > Kimi K2 > OpenAI
    if (process.env.OPENROUTER_API_KEY) {
      return {
        provider: 'openrouter',
        client: new OpenAI({
          apiKey: process.env.OPENROUTER_API_KEY,
          baseURL:
            process.env.OPENROUTER_API_BASE || 'https://openrouter.ai/api/v1',
          defaultHeaders: {
            'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || '',
            'X-Title': 'GuruKool HomeSchool',
          },
        }),
        name: 'OpenRouter',
      };
    }

    if (process.env.MOONSHOT_API_KEY) {
      return {
        provider: 'moonshot',
        client: new OpenAI({
          apiKey: process.env.MOONSHOT_API_KEY,
          baseURL:
            process.env.MOONSHOT_API_BASE || 'https://api.moonshot.cn/v1',
        }),
        name: 'Kimi K2 (Moonshot AI)',
      };
    }

    if (process.env.OPENAI_API_KEY) {
      return {
        provider: 'openai',
        client: new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        }),
        name: 'OpenAI',
      };
    }

    return {
      provider: 'none',
      client: null,
      name: 'None',
    };
  }

  /**
   * Initialize explicitly selected provider
   */
  private initializeExplicitProvider(providerType: AIProvider): {
    provider: AIProvider;
    client: OpenAI | null;
    name: string;
  } {
    switch (providerType) {
      case 'openrouter':
        if (!process.env.OPENROUTER_API_KEY) {
          throw new Error(
            'OPENROUTER_API_KEY not set in environment variables'
          );
        }
        return {
          provider: 'openrouter',
          client: new OpenAI({
            apiKey: process.env.OPENROUTER_API_KEY,
            baseURL:
              process.env.OPENROUTER_API_BASE || 'https://openrouter.ai/api/v1',
            defaultHeaders: {
              'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || '',
              'X-Title': 'GuruKool HomeSchool',
            },
          }),
          name: 'OpenRouter',
        };

      case 'moonshot':
        if (!process.env.MOONSHOT_API_KEY) {
          throw new Error('MOONSHOT_API_KEY not set in environment variables');
        }
        return {
          provider: 'moonshot',
          client: new OpenAI({
            apiKey: process.env.MOONSHOT_API_KEY,
            baseURL:
              process.env.MOONSHOT_API_BASE || 'https://api.moonshot.cn/v1',
          }),
          name: 'Kimi K2 (Moonshot AI)',
        };

      case 'openai':
        if (!process.env.OPENAI_API_KEY) {
          throw new Error('OPENAI_API_KEY not set in environment variables');
        }
        return {
          provider: 'openai',
          client: new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
          }),
          name: 'OpenAI',
        };

      default:
        return {
          provider: 'none',
          client: null,
          name: 'None',
        };
    }
  }

  /**
   * Get the default model for current provider
   */
  private getDefaultModel(): string {
    switch (this.provider) {
      case 'openrouter':
        // OpenRouter popular models
        return (
          process.env.OPENROUTER_MODEL || 'anthropic/claude-3.5-sonnet' // Default to Claude 3.5 Sonnet
        );

      case 'moonshot':
        // Kimi K2 models
        return process.env.MOONSHOT_MODEL || 'moonshot-v1-32k';

      case 'openai':
        return 'gpt-4-turbo-preview';

      default:
        return 'gpt-3.5-turbo';
    }
  }

  /**
   * Send chat completion request
   */
  async chat(
    messages: AIMessage[],
    options: AICompletionOptions = {}
  ): Promise<string> {
    if (!this.client) {
      throw new Error(
        'No AI provider configured. Set API keys in environment variables.'
      );
    }

    const model = options.model || this.getDefaultModel();
    const temperature = options.temperature ?? 0.7;
    const maxTokens = options.maxTokens || 1000;
    const topP = options.topP ?? 1;

    try {
      const completion = await this.client.chat.completions.create({
        model,
        messages: messages as ChatCompletionMessageParam[],
        temperature,
        max_tokens: maxTokens,
        top_p: topP,
      });

      return completion.choices[0]?.message?.content || '';
    } catch (error) {
      console.error(`AI Provider (${this.providerName}) error:`, error);
      throw new Error(
        `AI completion failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Stream chat completion (for real-time responses)
   */
  async *chatStream(
    messages: AIMessage[],
    options: AICompletionOptions = {}
  ): AsyncGenerator<string, void, unknown> {
    if (!this.client) {
      throw new Error(
        'No AI provider configured. Set API keys in environment variables.'
      );
    }

    const model = options.model || this.getDefaultModel();
    const temperature = options.temperature ?? 0.7;
    const maxTokens = options.maxTokens || 1000;
    const topP = options.topP ?? 1;

    try {
      const stream = await this.client.chat.completions.create({
        model,
        messages: messages as ChatCompletionMessageParam[],
        temperature,
        max_tokens: maxTokens,
        top_p: topP,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          yield content;
        }
      }
    } catch (error) {
      console.error(`AI Provider (${this.providerName}) stream error:`, error);
      throw new Error(
        `AI stream failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get current provider info
   */
  getProviderInfo(): {
    provider: AIProvider;
    name: string;
    model: string;
  } {
    return {
      provider: this.provider,
      name: this.providerName,
      model: this.getDefaultModel(),
    };
  }

  /**
   * Check if AI provider is available
   */
  isAvailable(): boolean {
    return this.provider !== 'none' && this.client !== null;
  }
}

// Export singleton instance
export const aiProvider = AIProviderService.getInstance();

// Export class for testing
export { AIProviderService };
