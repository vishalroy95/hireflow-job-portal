import toast from 'react-hot-toast'

export function confirmAction({
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
} = {}) {
  return new Promise((resolve) => {
    const toastId = toast.custom(
      () => (
        <div className="w-80 rounded-lg border border-gray-200 bg-white p-4 text-gray-900 shadow-xl">
          <p className="font-semibold">{title}</p>
          <p className="mt-1 text-sm text-gray-600">{message}</p>
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                toast.dismiss(toastId)
                resolve(false)
              }}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={() => {
                toast.dismiss(toastId)
                resolve(true)
              }}
              className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
            >
              {confirmText}
            </button>
          </div>
        </div>
      ),
      { duration: Infinity }
    )
  })
}
