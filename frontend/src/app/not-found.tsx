export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-6">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-gray-200 mb-4">404</h1>
        <p className="text-lg text-gray-600 mb-8 max-w-6xl">
          The page you're looking for doesn't exist or has been moved.
        </p>
      </div>
    </div>
  );
}
