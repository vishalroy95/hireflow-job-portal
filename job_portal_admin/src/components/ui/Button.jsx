export function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  ...props
}) {
  const baseStyles = 'font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center gap-2'

  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white',
    secondary: 'bg-slate-700 hover:bg-slate-600 disabled:bg-slate-700 text-white',
    danger: 'bg-red-600 hover:bg-red-700 disabled:bg-slate-600 text-white',
    success: 'bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white',
    outline: 'border border-slate-600 hover:bg-slate-800 disabled:border-slate-700 text-slate-300',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  }

  return (
    <button
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${disabled ? 'cursor-not-allowed opacity-60' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
