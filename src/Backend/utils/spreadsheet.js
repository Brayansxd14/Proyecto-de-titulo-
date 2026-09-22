import XLSX from 'xlsx'

export const normalizeHeader = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[\s_-]+/g, '')
export const valueFrom = (row, aliases) => {
  const key = Object.keys(row).find(item => aliases.includes(normalizeHeader(item)))
  return key ? row[key] : undefined
}
export const readSpreadsheet = buffer => {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  return XLSX.utils.sheet_to_json(sheet, { defval: '' })
}
export const numberFrom = value => {
  if (typeof value === 'number') return value
  const text = String(value ?? '').trim().replace(/[$€£\s]/g, '')
  if (!text) return 0
  const normalized = text.includes(',') ? text.replace(/\./g, '').replace(',', '.') : text.replace(/\.(?=\d{3}(?:\D|$))/g, '')
  return Number(normalized)
}