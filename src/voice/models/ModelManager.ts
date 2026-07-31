/**
 * NEXUS AI OS — Standalone Model Manager
 *
 * Manages STT model metadata, download status, caching paths, model versioning,
 * and language model switching. Decoupled from speech providers and engines.
 * Supports generic Whisper and offline speech model abstractions.
 */

export interface ModelInfo {
  id: string;
  name: string;
  language: string;
  sizeBytes: number;
  size: string; // e.g. "39MB"
  url: string;
  downloadStatus: boolean;
  isDownloaded: boolean;
  version: string;
  cacheDir: string;
}

export class ModelManager {
  private static instance: ModelManager;

  private activeModelId = 'whisper-tiny.en';
  private modelCacheDir = 'models/stt';

  private availableModels: Map<string, ModelInfo> = new Map([
    [
      'whisper-tiny.en',
      {
        id: 'whisper-tiny.en',
        name: 'Whisper English Tiny',
        language: 'en-US',
        sizeBytes: 39 * 1024 * 1024,
        size: '39MB',
        url: 'https://huggingface.co/onnx-community/whisper-tiny.en',
        downloadStatus: true,
        isDownloaded: true,
        version: 'tiny.en',
        cacheDir: 'models/stt/whisper-tiny.en',
      },
    ],
    [
      'whisper-base.en',
      {
        id: 'whisper-base.en',
        name: 'Whisper English Base',
        language: 'en-US',
        sizeBytes: 74 * 1024 * 1024,
        size: '74MB',
        url: 'https://huggingface.co/onnx-community/whisper-base.en',
        downloadStatus: false,
        isDownloaded: false,
        version: 'base.en',
        cacheDir: 'models/stt/whisper-base.en',
      },
    ],
    [
      'whisper-small',
      {
        id: 'whisper-small',
        name: 'Whisper Multilingual Small',
        language: 'multilingual',
        sizeBytes: 244 * 1024 * 1024,
        size: '244MB',
        url: 'https://huggingface.co/onnx-community/whisper-small',
        downloadStatus: false,
        isDownloaded: false,
        version: 'small',
        cacheDir: 'models/stt/whisper-small',
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
    const model = this.availableModels.get(this.activeModelId);
    if (model) {
      console.log(`[NEXUS/ModelManager] Active model: ${model.id}`);
    }
    return model;
  }

  public getModel(modelId: string): ModelInfo | undefined {
    return this.availableModels.get(modelId);
  }

  public listModels(): ModelInfo[] {
    return Array.from(this.availableModels.values());
  }

  public isModelInstalled(modelId: string): boolean {
    const info = this.availableModels.get(modelId);
    return !!(info?.downloadStatus || info?.isDownloaded);
  }

  public getModelPath(modelId: string): string {
    const info = this.availableModels.get(modelId);
    return info?.cacheDir || `${this.modelCacheDir}/${modelId}`;
  }

  public validateModel(modelId: string): { valid: boolean; error?: string; model?: ModelInfo } {
    const info = this.availableModels.get(modelId);
    if (!info) {
      return { valid: false, error: `Model "${modelId}" not found in manifest.` };
    }
    if (!info.downloadStatus && !info.isDownloaded) {
      return { valid: false, error: `Model "${modelId}" is not downloaded or available.` };
    }
    if (!info.cacheDir || !info.version || !info.id || !info.name) {
      return { valid: false, error: `Model "${modelId}" has invalid or missing metadata.` };
    }
    return { valid: true, model: info };
  }

  public async setActiveModel(modelId: string): Promise<boolean> {
    const info = this.availableModels.get(modelId);
    if (!info) return false;

    if (!info.isDownloaded && !info.downloadStatus) {
      await this.downloadModel(modelId);
    }

    this.activeModelId = modelId;
    console.log(`[NEXUS/ModelManager] Active model: ${modelId}`);
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

    // Simulate progressive download tracking metadata
    if (onProgress) {
      for (let p = 0; p <= 100; p += 25) {
        onProgress(p);
      }
    }

    info.downloadStatus = true;
    info.isDownloaded = true;
    return this.getModelPath(modelId);
  }
}

export const modelManager = ModelManager.getInstance();
export default modelManager;
