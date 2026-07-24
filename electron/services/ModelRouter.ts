import { eventBus } from './EventBus';

export interface ModelProviderConfig {
  id: string;
  name: string;
  isLocal: boolean;
  maxTokens: number;
  supportsVision: boolean;
  supportsTools: boolean;
}

export class ModelRouter {
  private activeProviderId = 'gemini-flash';

  private providers: Record<string, ModelProviderConfig> = {
    'gemini-flash': { id: 'gemini-flash', name: 'Google Gemini 1.5 Flash (Cloud)', isLocal: false, maxTokens: 1048576, supportsVision: true, supportsTools: true },
    'claude-sonnet': { id: 'claude-sonnet', name: 'Anthropic Claude 3.5 Sonnet (Cloud)', isLocal: false, maxTokens: 200000, supportsVision: true, supportsTools: true },
    'gpt-4o': { id: 'gpt-4o', name: 'OpenAI GPT-4o (Cloud)', isLocal: false, maxTokens: 128000, supportsVision: true, supportsTools: true },
    'ollama-local': { id: 'ollama-local', name: 'Ollama Local (DeepSeek-Coder / Llama 3)', isLocal: true, maxTokens: 32768, supportsVision: false, supportsTools: true }
  };

  public selectBestProvider(taskType: 'CODING' | 'RESEARCH' | 'FAST_CHAT' | 'OFFLINE' | 'VISION'): ModelProviderConfig {
    let chosenId = 'gemini-flash';

    switch (taskType) {
      case 'CODING':
        chosenId = 'claude-sonnet';
        break;
      case 'RESEARCH':
        chosenId = 'gpt-4o';
        break;
      case 'OFFLINE':
        chosenId = 'ollama-local';
        break;
      case 'VISION':
        chosenId = 'gemini-flash';
        break;
      default:
        chosenId = 'gemini-flash';
    }

    if (chosenId !== this.activeProviderId) {
      this.activeProviderId = chosenId;
      eventBus.publish('MODEL_SWITCHED', { providerId: chosenId, name: this.providers[chosenId].name, taskType }, 'LOW');
    }

    return this.providers[chosenId];
  }

  public getActiveProvider(): ModelProviderConfig {
    return this.providers[this.activeProviderId] || this.providers['gemini-flash'];
  }
}

export const modelRouter = new ModelRouter();
