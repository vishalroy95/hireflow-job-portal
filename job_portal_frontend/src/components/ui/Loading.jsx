import { FiLoader } from 'react-icons/fi'

const Loading = ({ fullScreen = false, message = 'Loading...' }) => {
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 flex flex-col items-center gap-4">
          <FiLoader className="w-10 h-10 text-primary animate-spin" />
          <p className="text-gray-700 font-medium">{message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center gap-2 py-8">
      <FiLoader className="w-8 h-8 text-primary animate-spin" />
      <p className="text-gray-600">{message}</p>
    </div>
  )
}

export default Loading
