import { readFile } from 'node:fs/promises'
import { test, expect } from '@playwright/test'
import { journeys } from './journeys.mjs'

for (const journey of journeys) {
  test(journey.name, async ({ page }) => {
    const driver = {
      goto: (path) => page.goto(path),
      getByRole: (...args) => page.getByRole(...args),
      getByText: (...args) => page.getByText(...args),
      getByLabel: (...args) => page.getByLabel(...args),
      getByTestId: (...args) => page.getByTestId(...args),
      evaluate: (...args) => page.evaluate(...args),
      download: async (trigger) => {
        const pending = page.waitForEvent('download')
        await trigger()
        return readFile(await (await pending).path(), 'utf8')
      },
      noDownload: async (trigger) => {
        const pending = page.waitForEvent('download', { timeout: 1000 }).then(
          () => true,
          () => false,
        )
        await trigger()
        expect(await pending).toBe(false)
      },
    }
    await journey.run(driver)
  })
}
