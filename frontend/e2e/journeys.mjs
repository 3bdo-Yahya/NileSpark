import assert from 'node:assert/strict'

const button = (d, name) => d.getByRole('button', { name, exact: true })
const text = (d, value) => d.getByText(value, { exact: true })
const summary = (d) => d.getByRole('region', { name: 'Query summary', exact: true })
const heading = (d, name) => d.getByRole('heading', { name, exact: true })
async function start(d, scenario = 'success') {
  await d.goto('/__test/start/' + scenario)
  await button(d, 'Load API calendar →').waitFor({ state: 'visible' })
}
async function load(d) {
  await button(d, 'Load API calendar →').press('Enter')
  await text(d, 'Loaded query').waitFor({ state: 'visible' })
}
async function setDate(d, label, value) {
  const field = d.getByLabel(label, { exact: true })
  await field.fill(value)
  // Native segmented date fields commit through keyboard input in WebView as well as Chromium.
  await field.press('ArrowUp')
  await field.press('ArrowDown')
  assert.equal(await field.evaluate((e) => e.value), value)
}
async function noOverflow(d) {
  const sizes = await d.evaluate(() => ({
    page: document.documentElement.scrollWidth,
    viewport: innerWidth,
  }))
  assert.ok(sizes.page <= sizes.viewport, JSON.stringify(sizes))
}
async function requests(d) {
  await d.goto('/__test/requests')
  return JSON.parse(await d.getByTestId('fixture-requests').innerText())
}
async function exportBlocked(d, message) {
  await d.noDownload(async () => {
    await button(d, 'Export month CSV').press('Enter')
    await text(d, message).waitFor({ state: 'visible' })
  })
}

export const journeys = [
  {
    name: 'landing route, blank dates and correct hemispheres',
    run: async (d) => {
      await start(d)
      await d.getByRole('link', { name: 'Back to Earth', exact: true }).press('Enter')
      await d.getByRole('link', { name: 'Explore the Nile', exact: true }).press('Enter')
      await d.getByLabel('From', { exact: true }).press('Backspace')
      await d.getByLabel('To', { exact: true }).press('Backspace')
      await button(d, 'Load API calendar →').press('Enter')
      assert.match(await d.getByRole('alert').innerText(), /valid start and end date/)
      assert.match(
        await summary(d).innerText(),
        /Choose a valid start date.*Choose a valid end date/s,
      )
      await button(d, 'Brazil').press('Enter')
      assert.match(await summary(d).innerText(), /56°W.*15°S/s)
      await button(d, 'Australia').press('Enter')
      assert.match(await summary(d).innerText(), /143°E.*31°S/s)
      await noOverflow(d)
    },
  },
  {
    name: 'AOI edits invalidate results and require valid applied coordinates',
    run: async (d) => {
      await start(d)
      await load(d)
      await text(d, 'Coordinates / manual input').press('Enter')
      await d.getByLabel('west (°)', { exact: true }).fill('40')
      assert.equal(await button(d, 'Export month CSV').isEnabled(), false)
      assert.match(await summary(d).innerText(), /no result loaded/)
      assert.doesNotMatch(await summary(d).innerText(), /previous query/)
      await button(d, 'Apply coordinates').press('Enter')
      assert.match(await d.getByRole('alert').innerText(), /west < east/)
      await d.getByLabel('west (°)', { exact: true }).fill('31.5')
      await button(d, 'Apply coordinates').press('Enter')
      await load(d)
      assert.match(await summary(d).innerText(), /31.5°E/)
      await button(d, 'Reset').press('Enter')
      assert.equal(await button(d, 'Load API calendar →').isEnabled(), false)
      assert.equal(await button(d, 'Export month CSV').isEnabled(), false)
    },
  },
  {
    name: 'raw and harmonized values preserve explicit zero and missing months',
    run: async (d) => {
      await start(d)
      await load(d)
      await button(d, 'January 2025: 10 API value').waitFor({ state: 'visible' })
      const details = d.getByRole('complementary', { name: 'January 2025', exact: true })
      assert.match((await details.innerText()).replace(/\s+/g, ' '), /MODIS: 5 VIIRS: 10/)
      await d
        .getByRole('combobox', { name: 'Raw calendar sensor', exact: true })
        .selectOption('modis')
      await button(d, 'January 2025: 5 API value').waitFor({ state: 'visible' })
      await d.getByRole('radio', { name: 'Harmonized (API)', exact: true }).press('Space')
      await button(d, 'January 2025: 20 API value').waitFor({ state: 'visible' })
      await button(d, 'February 2025: 0 API value').press('Enter')
      assert.match(
        await d.getByRole('complementary', { name: 'February 2025', exact: true }).innerText(),
        /Value supplied; coverage not reported/,
      )
      await button(d, 'March 2025: value unavailable').press('Enter')
      assert.match(
        await d.getByRole('complementary', { name: 'March 2025', exact: true }).innerText(),
        /No value supplied for this month/,
      )
      await noOverflow(d)
    },
  },
  {
    name: 'methodology retries independently and Escape restores its trigger',
    run: async (d) => {
      await start(d, 'method-error')
      await button(d, 'Data & method').first().press('Enter')
      await button(d, 'Retry methodology').waitFor({ state: 'visible' })
      await button(d, 'Retry methodology').press('Enter')
      await text(
        d,
        'SYNTHETIC TEST METHODOLOGY. Not NASA observations or a validated scientific method.',
      ).waitFor({ state: 'visible' })
      await button(d, 'Close data and method').press('Escape')
      assert.equal(
        await d.evaluate(() => document.activeElement?.textContent?.trim()),
        'Data & method',
      )
    },
  },
  ...[
    ['calendar-error', /Fixture service unavailable/],
    ['rate-limit', /Too many requests/],
    ['malformed', /invalid response envelope/],
  ].map(([scenario, error]) => ({
    name: scenario + ' keeps inputs and recovers on retry',
    run: async (d) => {
      await start(d, scenario)
      await button(d, 'Load API calendar →').press('Enter')
      await button(d, 'Retry API request').waitFor({ state: 'visible' })
      assert.match(await d.getByRole('alert').innerText(), error)
      assert.equal(
        await d.getByLabel('From', { exact: true }).evaluate((e) => e.value),
        '2025-01-01',
      )
      await button(d, 'Retry API request').press('Enter')
      await text(d, 'Loaded query').waitFor({ state: 'visible' })
      await heading(d, 'January 2025').waitFor({ state: 'visible' })
    },
  })),
  {
    name: 'map failure preserves calendar and has its own retry',
    run: async (d) => {
      await start(d, 'map-error')
      await load(d)
      await button(d, 'Retry map layer').waitFor({ state: 'visible' })
      await heading(d, 'January 2025').waitFor({ state: 'visible' })
      await button(d, 'January 2025: 10 API value').waitFor({ state: 'visible' })
      await button(d, 'Retry map layer').press('Enter')
      await d
        .getByText('1 API cell centroids · all sensors · 2025-01.', { exact: false })
        .waitFor({ state: 'visible' })
    },
  },
  {
    name: 'placeholder zeros stay unavailable and placeholder CSV never downloads',
    run: async (d) => {
      await start(d, 'stub')
      await button(d, 'Load API calendar →').press('Enter')
      await text(d, 'Loaded placeholder query').waitFor({ state: 'visible' })
      await button(d, 'January 2025: value unavailable').waitFor({ state: 'visible' })
      await d.getByRole('radio', { name: 'Harmonized (API)', exact: true }).press('Space')
      await button(d, 'January 2025: value unavailable').waitFor({ state: 'visible' })
      await exportBlocked(d, 'The API export is a placeholder. No observation file was downloaded.')
    },
  },
  {
    name: 'CSV stub is blocked even with a non-placeholder calendar',
    run: async (d) => {
      await start(d, 'csv-stub')
      await load(d)
      await exportBlocked(d, 'The API export is a placeholder. No observation file was downloaded.')
    },
  },
  {
    name: 'CSV with unreadable provenance is blocked',
    run: async (d) => {
      await start(d, 'csv-unknown')
      await load(d)
      await exportBlocked(
        d,
        'CSV placeholder status is not readable. The API must expose X-Stub: false for an observation export.',
      )
    },
  },
  {
    name: 'selected-month CSV download and map requests share the clipped leap-month range',
    run: async (d) => {
      await start(d)
      await setDate(d, 'From', '2024-02-10')
      await setDate(d, 'To', '2024-03-05')
      await load(d)
      await heading(d, 'February 2024').waitFor({ state: 'visible' })
      const csv = await d.download(() => button(d, 'Export month CSV').press('Enter'))
      assert.match(csv, /modis,true,2024-02-10/)
      assert.match(csv, /viirs,true,2024-02-29/)
      assert.equal(csv.trim().split(/\r?\n/).length, 3)
      const log = await requests(d)
      const map = log.findLast((entry) => entry.path === '/api/map')
      const file = log.findLast((entry) => entry.path === '/api/hotspots.csv')
      assert.equal(map.query.start, '2024-02-10')
      assert.equal(map.query.end, '2024-02-29')
      assert.deepEqual(file.body, {
        aoi: { bbox: [31, 24, 33, 26] },
        start: '2024-02-10',
        end: '2024-02-29',
        include_static: false,
      })
      assert.equal(Object.hasOwn(file.body, 'source'), false)
    },
  },
  {
    name: 'cancel and connection switch prevent a slow API response overwriting the demo',
    run: async (d) => {
      await start(d, 'slow')
      await button(d, 'Load API calendar →').press('Enter')
      await button(d, 'Cancel request').waitFor({ state: 'visible' })
      await button(d, 'Cancel request').press('Enter')
      await d.getByRole('combobox', { name: 'Data connection' }).selectOption('demo')
      await button(d, 'Run source demo →').press('Enter')
      await button(d, 'January 2025: 12 synthetic records').waitFor({ state: 'visible' })
      await button(d, 'Play season').press('Enter')
      await d.getByRole('main').press('Control+Home')
      await heading(d, 'March 2025').waitFor({ state: 'visible' })
      assert.equal(await d.evaluate(() => scrollY), 0)
      await button(d, 'Pause season').press('Enter')
      await button(d, 'March 2025: 10 synthetic records').waitFor({ state: 'visible' })
      assert.match(await summary(d).innerText(), /Synthetic demo/)
    },
  },
  {
    name: 'keyboard grid moves across years, keeps one Tab entry and fits the viewport',
    run: async (d) => {
      await start(d)
      await setDate(d, 'From', '2024-01-01')
      await load(d)
      await button(d, 'January 2024: 10 API value').press('ArrowDown')
      await heading(d, 'January 2025').waitFor({ state: 'visible' })
      await button(d, 'January 2025: 22 API value').press('ArrowUp')
      await heading(d, 'January 2024').waitFor({ state: 'visible' })
      await button(d, 'January 2024: 10 API value').press('ArrowLeft')
      assert.equal(
        await d.evaluate(() => document.activeElement?.getAttribute('data-period')),
        '2024-01',
      )
      assert.equal(
        await d.evaluate(() => document.querySelectorAll('[data-period][tabindex="0"]').length),
        1,
      )
      await button(d, 'January 2024: 10 API value').press('Tab')
      assert.equal(
        await d.evaluate(() => document.activeElement?.getAttribute('data-period')),
        null,
      )
      await noOverflow(d)
    },
  },
]

journeys.push({
  name: 'map module download failure leaves calendar and search usable',
  run: async (d) => {
    await start(d, 'map-code-error')
    await heading(d, 'Map code unavailable').waitFor({ state: 'visible' })
    await load(d)
    await button(d, 'January 2025: 10 API value').waitFor({ state: 'visible' })
    assert.equal(await button(d, 'Export month CSV').isEnabled(), true)
    await button(d, 'February 2025: 0 API value').press('Enter')
    await heading(d, 'February 2025').waitFor({ state: 'visible' })
    await noOverflow(d)
  },
})

journeys.push({
  name: 'anomaly view preserves zero, signed differences, missing months and withheld placeholders',
  run: async (d) => {
    await start(d)
    await load(d)
    await heading(d, 'Monthly anomaly').waitFor({ state: 'visible' })
    await button(d, 'Show anomaly view').press('Enter')
    await button(d, 'February 2025').press('Enter')
    await heading(d, 'February 2025').waitFor({ state: 'visible' })
    assert.match(
      await d.getByRole('region', { name: 'Monthly anomaly', exact: true }).innerText(),
      /-5[\s\S]*-100%/,
    )
    await button(d, 'March 2025').press('Enter')
    await text(d, 'Historical comparison not supplied for this month.').waitFor({
      state: 'visible',
    })
    await button(d, 'April 2025').press('Enter')
    await text(d, 'Percentage is undefined for a zero historical median.').waitFor({
      state: 'visible',
    })
    await button(d, 'January 2025').press('Enter')
    assert.match(
      await d.getByRole('region', { name: 'Monthly anomaly', exact: true }).innerText(),
      /0%/,
    )
    await noOverflow(d)
    await start(d, 'stub')
    await button(d, 'Load API calendar →').press('Enter')
    await text(d, 'API placeholder; anomaly values are withheld.').waitFor({ state: 'visible' })
    const region = await d.getByRole('region', { name: 'Monthly anomaly', exact: true }).innerText()
    assert.ok(!region.includes('0%'))
    await d.getByRole('combobox', { name: /Data connection/ }).selectOption('demo')
    await text(d, 'Anomalies are unavailable in the synthetic demo.').waitFor({ state: 'visible' })
  },
})
