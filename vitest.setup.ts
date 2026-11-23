import "@testing-library/jest-dom/vitest";

// Mock ResizeObserver for cmdk / Radix UI in JSDOM
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = ResizeObserverMock;
// Mock scrollIntoView for command list navigation in JSDOM
window.HTMLElement.prototype.scrollIntoView = () => {};
