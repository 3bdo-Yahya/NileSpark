import { spawnSync } from 'node:child_process'
const result = spawnSync(
  process.execPath,
  ['node_modules/vite/bin/vite.js', 'build', '--outDir', 'dist-e2e'],
  {
    stdio: 'inherit',
    env: {
      ...process.env,
      VITE_API_BASE_URL: 'http://127.0.0.1:4175',
      VITE_MAP_STYLE_URL: 'http://127.0.0.1:4175/__test/map-style.json',
    },
  },
)
process.exit(result.status ?? 1)
