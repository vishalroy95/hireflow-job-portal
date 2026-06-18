export function exportToCSV(data, filename = 'data.csv') {
  if (!data || data.length === 0) return

  const headers = Object.keys(data[0])
  const csv = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header]
        // Escape quotes and wrap in quotes if needed
        return typeof value === 'string' && value.includes(',')
          ? `"${value.replace(/"/g, '""')}"`
          : value
      }).join(',')
    )
  ].join('\n')

  const blob = new Blob([csv], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  window.URL.revokeObjectURL(url)
}
