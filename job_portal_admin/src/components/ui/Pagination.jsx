import { AiOutlineLeft, AiOutlineRight } from 'react-icons/ai'
import { Button } from './Button'

export function Pagination({ currentPage = 1, totalPages = 1, onPageChange }) {
  const pages = []
  const maxVisible = 5

  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2))
  let endPage = Math.min(totalPages, startPage + maxVisible - 1)

  if (endPage - startPage + 1 < maxVisible) {
    startPage = Math.max(1, endPage - maxVisible + 1)
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i)
  }

  return (
    <div className="flex items-center justify-center gap-2 py-4">
      <Button
        size="sm"
        variant="outline"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <AiOutlineLeft /> Previous
      </Button>

      {startPage > 1 && (
        <>
          <Button size="sm" variant="outline" onClick={() => onPageChange(1)}>1</Button>
          {startPage > 2 && <span className="text-slate-400">...</span>}
        </>
      )}

      {pages.map((page) => (
        <Button
          key={page}
          size="sm"
          variant={page === currentPage ? 'primary' : 'outline'}
          onClick={() => onPageChange(page)}
        >
          {page}
        </Button>
      ))}

      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && <span className="text-slate-400">...</span>}
          <Button size="sm" variant="outline" onClick={() => onPageChange(totalPages)}>
            {totalPages}
          </Button>
        </>
      )}

      <Button
        size="sm"
        variant="outline"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Next <AiOutlineRight />
      </Button>
    </div>
  )
}
