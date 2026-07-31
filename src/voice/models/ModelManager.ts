/**
 * NEXUS AI OS — Standalone Model Manager
 *
 * Manages STT model metadata, download status, caching paths, model versioning,
 * and language model switching. Decoupled from speech providers and engines.
 */

export interface ModelInfo {
  id: string;
  name: string;
  language: string;
  sizeBytes: number;
  url: string;
  isDownloaded: boolean;
  version: string;
}

export class ModelManager {
  private static instance: ModelManager;

  private activeModelId = 'vosk-small-en-us-0.15';
  private modelCacheDir = 'models/stt';

  private availableModels: Map<string, ModelInfo> = new Map([
    [
      'vosk-small-en-us-0.15',
      {
        id: 'vosk-small-en-us-0.15',
        name: 'Vosk English Small v0.15',
        language: 'en-US',
        sizeBytes: 50 * 1024 * 1024, // ~50MB
        url: 'https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip',
        isDownloaded: true, // Default bundled or auto-cached
        version: '0.15',
      },
    ],
    [
      'vosk-small-es-0.42',
      {
        id: 'vosk-small-es-0.42',
        name: 'Vosk Spanish Small v0.42',
        language: 'es-ES',
        sizeBytes: 39 * 1024 * 1024,
        url: 'https://alphacephei.com/vosk/models/vosk-model-small-es-0.42.zip',
        isDownloaded: false,
        version: '0.42',
      },
    ],
  ]);

  public static getInstance(): ModelManager {
    if (!ModelManager.instance) {
      ModelManager.instance = new ModelManager();
    }
    return ModelManager.instance;
  }

  public getActiveModel(): ModelInfo | undefined {
    return this.availableModels.get(this.activeModelId);
  }

  public getModel(modelId: string): ModelInfo | undefined {
    return this.availableModels.get(modelId);
  }

  public listModels(): ModelInfo[] {
    return Array.from(this.availableModels.values());
  }

  public isModelInstalled(modelId: string): boolean {
    const info = this.availableModels.get(modelId);
    return !!info?.isDownloaded;
  }

  public getModelPath(modelId: string): string {
    return `${this.modelCacheDir}/${modelId}`;
  }

  public async setActiveModel(modelId: string): Promise<boolean> {
    const info = this.availableModels.get(modelId);
    if (!info) return false;

    if (!info.isDownloaded) {
      await this.downloadModel(modelId);
    }

    this.activeModelId = modelId;
    return true;
  }

  public async downloadModel(
    modelId: string,
    onProgress?: (percent: number) => void
  ): Promise<string> {
    const info = this.availableModels.get(modelId);
    if (!info) {
      throw new Error(`Model ${modelId} not found in manifest.`);
    }

    // Simulate progressive download tracking
    if (onProgress) {
      for (let p = 0; p <= 100; p += 25) {
        onProgress(p);
      }
    }

    info.isDownloaded = true;
    return this.getModelPath(modelId);
  }
}

export const modelManager = ModelManager.getInstance();
export default modelManager;
