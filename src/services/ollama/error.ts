// Error handling for Ollama service

export class OllamaError extends Error {
  modelName?: string;
  responseTime?: number;
  constructor(message: string, modelName?: string, responseTime?: number) {
    super(message);
    this.name = 'OllamaError';
    this.modelName = modelName;
    this.responseTime = responseTime;
  }
}

export function wrapOllamaError(error: unknown, modelName: string): OllamaError {
  if (error instanceof OllamaError) return error;
  if (error instanceof Error) {
    return new OllamaError(error.message, modelName);
  }
  return new OllamaError(String(error), modelName);
}
