import { FiAlertCircle } from 'react-icons/fi'

const Error = ({ message, onRetry }) => {
  if (!message) return null

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3">
        <FiAlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-red-800 font-medium">{message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-red-700 underline text-sm mt-2 hover:text-red-800"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default Error
