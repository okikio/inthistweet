import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    testTimeout: 500_000    
    // ...
  },
  define: {
    self: "globalThis",
    global: "globalThis",
  }
})