import { OllamaError, wrapOllamaError } from '../../../../src/services/ollama/error';

describe('OllamaError', () => {
  it('should create an OllamaError with message, modelName, and responseTime', () => {
    const err = new OllamaError('fail', 'test-model', 1234);
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('OllamaError');
    expect(err.message).toBe('fail');
    expect(err.modelName).toBe('test-model');
    expect(err.responseTime).toBe(1234);
  });
});

describe('wrapOllamaError', () => {
  it('should return the same OllamaError if passed', () => {
    const orig = new OllamaError('fail', 'model', 42);
    expect(wrapOllamaError(orig, 'model')).toBe(orig);
  });
  it('should wrap a generic Error', () => {
    const err = new Error('bad');
    const wrapped = wrapOllamaError(err, 'modelX');
    expect(wrapped).toBeInstanceOf(OllamaError);
    expect(wrapped.message).toBe('bad');
    expect(wrapped.modelName).toBe('modelX');
  });
  it('should wrap a string or unknown', () => {
    const wrapped = wrapOllamaError('something went wrong', 'modelY');
    expect(wrapped).toBeInstanceOf(OllamaError);
    expect(wrapped.message).toMatch(/something went wrong/);
    expect(wrapped.modelName).toBe('modelY');
  });
});
