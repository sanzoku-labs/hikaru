import '@testing-library/jest-dom/vitest'

// Ensure localStorage works correctly for Zustand persist middleware in jsdom.
// jsdom provides Storage but some Zustand versions need the prototype methods
// to be directly callable. This polyfill ensures compatibility.
const store: Record<string, string> = {}
const localStorageMock: Storage = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => {
    store[key] = value
  },
  removeItem: (key: string) => {
    delete store[key]
  },
  clear: () => {
    for (const key of Object.keys(store)) {
      delete store[key]
    }
  },
  get length() {
    return Object.keys(store).length
  },
  key: (index: number) => Object.keys(store)[index] ?? null,
}

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock })
