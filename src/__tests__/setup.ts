import '@testing-library/jest-dom';
import { vi } from 'vitest';

// jsdom doesn't implement URL.createObjectURL
Object.defineProperty(URL, 'createObjectURL', {
  writable: true,
  value: vi.fn(() => 'blob:mock-url'),
});
Object.defineProperty(URL, 'revokeObjectURL', {
  writable: true,
  value: vi.fn(),
});

// jsdom doesn't implement canvas 2D context
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: vi.fn().mockReturnValue({
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    scale: vi.fn(),
    drawImage: vi.fn(),
  }),
});
Object.defineProperty(HTMLCanvasElement.prototype, 'toBlob', {
  writable: true,
  value: vi.fn((callback: BlobCallback) => {
    callback(new Blob(['fake-image-data'], { type: 'image/jpeg' }));
  }),
});

// navigator.clipboard (JSDOM stub)
Object.assign(navigator, {
  clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
});

// window.matchMedia (JSDOM stub for Tailwind/theme checks)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })),
});
