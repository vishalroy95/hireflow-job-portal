const Input = ({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  required = false,
  disabled = false,
  ...props
}) => {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`input-field ${error ? 'border-red-500 ring-red-200' : ''}`}
        {...props}
      />
      {error && <span className="text-red-500 text-sm mt-1 block">{error}</span>}
    </div>
  )
}

export default Input
