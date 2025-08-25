import fetch from 'node-fetch';

export class MockOllamaClient {
  baseUrl: string;
  model: string;
  constructor(baseUrl: string, model: string) {
    this.baseUrl = baseUrl;
    this.model = model;
  }

  async generate({ prompt, options = {}, stream = false }: { prompt: string, options?: any, stream?: boolean }) {
    const url = `${this.baseUrl}/api/generate`;
    const body = {
      model: this.model,
      prompt,
      stream,
      ...options
    };
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      throw new Error(`Ollama API error: ${res.status} ${res.statusText}`);
    }
    return await res.json();
  }
}
