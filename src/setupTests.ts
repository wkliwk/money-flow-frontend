// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// jsdom (used by jest) does not provide a global fetch. Tests should mock fetch
// per-test, but provide a default no-op stub so unrelated code paths (e.g.
// useFxRates fallback) don't throw ReferenceError during render.
if (typeof (globalThis as { fetch?: unknown }).fetch === 'undefined') {
  (globalThis as { fetch: jest.Mock }).fetch = jest.fn(() =>
    Promise.reject(new Error('fetch not mocked'))
  );
}

window.matchMedia = window.matchMedia || function matchMediaMock(query: string) {
  return {
    matches: query === '(prefers-color-scheme: dark)',
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  };
};

if (!window.matchMedia || typeof window.matchMedia !== 'function') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
}
