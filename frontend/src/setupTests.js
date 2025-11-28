import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock window.URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = vi.fn();

// Mock FileReader
class MockFileReader {
  readAsDataURL() {
    setTimeout(() => {
      this.result = 'data:image/png;base64,mockBase64Data';
      this.onload?.();
    }, 0);
  }
}

global.FileReader = MockFileReader;
