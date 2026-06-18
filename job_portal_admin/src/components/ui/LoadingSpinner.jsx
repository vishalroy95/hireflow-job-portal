export function LoadingSpinner({ size = 'md' }) {
  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
  }

  return (
    <div className="flex items-center justify-center">
      <div className={`${sizes[size]} border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin`} />
    </div>
  )
}
