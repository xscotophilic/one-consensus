interface TransactionStatusProps {
  isProcessing?: boolean;
  error?: string | null;
  successMessage?: string | null;
  className?: string;
}

export function TransactionStatus({
  isProcessing = false,
  error = null,
  successMessage = null,
  className = "",
}: TransactionStatusProps) {
  if (!isProcessing && !error && !successMessage) {
    return null;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Error State */}
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md border border-red-200">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 mr-2 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Processing State */}
      {isProcessing && (
        <div className="bg-blue-50 text-blue-600 p-3 rounded-md border border-blue-200">
          <div className="flex items-center">
            <svg
              className="animate-spin w-5 h-5 mr-2 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Transaction in progress... Please wait for confirmation.</span>
          </div>
        </div>
      )}

      {/* Success State */}
      {successMessage && (
        <div className="bg-green-50 text-green-600 p-3 rounded-md border border-green-200">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 mr-2 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>{successMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Additional specialized components for common use cases
export function TransactionLoader({ message = "Transaction in progress... Please wait for confirmation." }: { message?: string }) {
  return (
    <TransactionStatus
      isProcessing={true}
    />
  );
}

export function TransactionError({ error }: { error: string }) {
  return (
    <TransactionStatus
      error={error}
    />
  );
}

export function TransactionSuccess({ message }: { message: string }) {
  return (
    <TransactionStatus
      successMessage={message}
    />
  );
}
