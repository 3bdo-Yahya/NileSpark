import type { AnalysisResult } from '../model/types.ts'

export function makeMonthCsv(result: AnalysisResult, period: string): string {
  const records = result.observations.filter((record) => record.period === period)
  const lines = ['is_demo,source,longitude,latitude,acquired_at_utc,period']
  records.forEach((record) =>
    lines.push(
      [
        true,
        record.source,
        record.longitude,
        record.latitude,
        record.acquiredAt,
        record.period,
      ].join(','),
    ),
  )
  return `${lines.join('\r\n')}\r\n`
}
export function downloadMonthCsv(result: AnalysisResult, period: string): void {
  const blob = new Blob([makeMonthCsv(result, period)], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `burncal-DEMO-${result.query.source}-${period}.csv`
  anchor.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
