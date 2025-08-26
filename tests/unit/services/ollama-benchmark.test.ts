
import { MockOllamaClient } from './mock-ollama-client';

const maybeDescribe = process.env.CI ? describe.skip : describe;

maybeDescribe('Ollama Model Benchmark (fetch-based)', () => {
  let ollama: MockOllamaClient;

  beforeAll(() => {
    ollama = new MockOllamaClient('http://localhost:11434', 'cs2-coach');
  });

  test('should complete minimal prompt in under 15 seconds', async () => {
    const start = Date.now();
    let response;
    try {
      response = await ollama.generate({ prompt: 'Say hello' });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Ollama minimal prompt error:', err);
      throw err;
    }
    const elapsed = (Date.now() - start) / 1000;
    console.log(`Ollama minimal prompt completed in ${elapsed}s`);
    expect(elapsed).toBeLessThan(20);
    expect(typeof response.response).toBe('string');
  }, 20000);
});
