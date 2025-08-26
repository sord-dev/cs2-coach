// Baseline calculation and management (migrated from baseline/)

export * from './baseline';
export * from './baseline-storage';
export * from './leetify-data-transformer';
export * from './adaptive-thresholds';
export * from './area';
export * from './correlation-analyzer';
export * from './metrics';
export * from './pattern-detector';
export * from './state-classifier';

// Export tiltDetector singleton for unified import style
export { tiltDetector } from './tilt-detector.js';
