import assert from 'node:assert/strict'
import test from 'node:test'
import { adjacentPeriod, revealCalendarMonth } from './calendarNavigation.ts'

const periods = Array.from(
  { length: 24 },
  (_, index) => `${2024 + Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, '0')}`,
)

test('calendar arrows move by month or by calendar column across years', () => {
  assert.equal(adjacentPeriod(periods, '2024-12', 'ArrowRight'), '2025-01')
  assert.equal(adjacentPeriod(periods, '2025-01', 'ArrowLeft'), '2024-12')
  assert.equal(adjacentPeriod(periods, '2024-05', 'ArrowDown'), '2025-05')
  assert.equal(adjacentPeriod(periods, '2025-05', 'ArrowUp'), '2024-05')
})

test('calendar navigation does not wrap outside a partial loaded period', () => {
  const partial = periods.slice(2, 16)
  assert.equal(adjacentPeriod(partial, '2024-03', 'ArrowLeft'), null)
  assert.equal(adjacentPeriod(partial, '2024-03', 'ArrowUp'), null)
  assert.equal(adjacentPeriod(partial, '2025-04', 'ArrowRight'), null)
  assert.equal(adjacentPeriod(partial, '2025-04', 'ArrowDown'), null)
  assert.equal(adjacentPeriod(partial, '2024-02', 'ArrowRight'), null)
  assert.equal(adjacentPeriod(partial, '2024-03', 'Enter'), null)
})

function scroller(width: number, total: number, scrollLeft = 0) {
  const calls: ScrollToOptions[] = []
  return {
    calls,
    clientWidth: width,
    scrollWidth: total,
    scrollLeft,
    getBoundingClientRect: () => ({ left: 20 }),
    scrollTo: (options: ScrollToOptions) => {
      calls.push(options)
    },
  }
}
const cell = (left: number, right: number) => ({ getBoundingClientRect: () => ({ left, right }) })

test('a fitting desktop calendar and a visible month never initiate scrolling', () => {
  const desktop = scroller(1000, 1000)
  revealCalendarMonth(desktop, cell(100, 150), false)
  assert.deepEqual(desktop.calls, [])
  const mobile = scroller(300, 720, 100)
  revealCalendarMonth(mobile, cell(30, 90), false)
  assert.deepEqual(mobile.calls, [])
})

test('offscreen months move only their horizontal container, with bounded offsets', () => {
  const right = scroller(300, 720)
  revealCalendarMonth(right, cell(340, 390), false)
  assert.deepEqual(right.calls, [{ left: 70, behavior: 'smooth' }])
  const left = scroller(300, 720, 100)
  revealCalendarMonth(left, cell(-30, 10), false)
  assert.deepEqual(left.calls, [{ left: 50, behavior: 'smooth' }])
  const edge = scroller(300, 720, 400)
  revealCalendarMonth(edge, cell(350, 400), false)
  assert.deepEqual(edge.calls, [{ left: 420, behavior: 'smooth' }])
})

test('reduced motion reveals an offscreen cell instantly with no vertical scroll target', () => {
  const mobile = scroller(300, 720)
  revealCalendarMonth(mobile, cell(340, 390), true)
  assert.deepEqual(mobile.calls, [{ left: 70, behavior: 'instant' }])
  assert.equal(Object.hasOwn(mobile.calls[0]!, 'top'), false)
})
