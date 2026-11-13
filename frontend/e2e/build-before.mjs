// Reproduce the pre-split Explorer graph for an apples-to-apples local comparison.
// Source files are not edited; only this benchmark build restores the static map import.
import { build } from 'vite'
import { readFileSync } from 'node:fs'
await build({
  plugins: [
    {
      name: 'benchmark-before-map-split',
      enforce: 'pre',
      transform(code, id) {
        if (id.replaceAll('\\', '/').endsWith('/src/app/App.tsx'))
          return readFileSync(new URL('./fixtures/App.before.txt', import.meta.url), 'utf8')
        if (!id.replaceAll('\\', '/').endsWith('/src/features/explorer/Explorer.tsx')) return null
        return code
          .replace(
            "import { LazyMapCanvas } from './components/LazyMapCanvas'",
            "import { MapCanvas } from './components/MapCanvas'",
          )
          .replaceAll('<LazyMapCanvas', '<MapCanvas')
      },
    },
  ],
  build: { outDir: 'dist-perf-before' },
})
