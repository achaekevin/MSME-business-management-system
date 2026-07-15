export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div
        className="h-12 w-12 rounded-full border-4 border-blue-200 border-t-blue-600"
        style={{ animation: 'spin 1s linear infinite' }}
      />
    </div>
  )
}
