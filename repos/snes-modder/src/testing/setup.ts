import { afterEach, vi } from 'vitest';

// Ensure mocks are cleared between individual tests for deterministic runs.
afterEach(() => {
  vi.restoreAllMocks();
});
